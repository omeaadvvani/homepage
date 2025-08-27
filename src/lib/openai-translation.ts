// OpenAI Translation and Audio Service for Voice Vedic
export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  audioUrl?: string;
  audioBlob?: Blob;
  targetLanguage: string;
}

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TTSRequest {
  model: string;
  input: string;
  voice: string;
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
  speed?: number;
}

class OpenAITranslationService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }
  }

  // Language voice mapping for natural TTS
  private getVoiceForLanguage(language: string): string {
    const voiceMap: Record<string, string> = {
      'English': 'alloy',
      'Hindi': 'nova',
      'Telugu': 'shimmer', 
      'Tamil': 'echo',
      'Kannada': 'fable',
      'Malayalam': 'onyx'
    };
    
    return voiceMap[language] || 'alloy';
  }

  // Get language-specific translation prompt
  private getTranslationPrompt(targetLanguage: string): string {
    const languageInstructions: Record<string, string> = {
      'Telugu': `Translate to Telugu following these exact rules:
- Always use Telugu script (తెలుగు)
- Keep proper nouns like "Ekadashi", "Shravana" as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use natural Telugu terms for common words
- Structure must match the example format exactly`,
      
      'Hindi': `Translate to Hindi following these exact rules:
- Always use Devanagari script (हिंदी)
- Keep proper nouns like "Ekadashi", "Shravana" as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use natural Hindi terms for common words
- Structure must match the example format exactly`,
      
      'Tamil': `Translate to Tamil following these exact rules:
- Always use Tamil script (தமிழ்)
- Keep proper nouns like "Ekadashi", "Shravana" as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use natural Tamil terms for common words
- Structure must match the example format exactly`,
      
      'Kannada': `Translate to Kannada following these exact rules:
- Always use Kannada script (ಕನ್ನಡ)
- Keep proper nouns like "Ekadashi", "Shravana" as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use natural Kannada terms for common words
- Structure must match the example format exactly`,
      
      'Malayalam': `Translate to Malayalam following these exact rules:
- Always use Malayalam script (മലയാളം)
- Keep proper nouns like "Ekadashi", "Shravana" as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use natural Malayalam terms for common words
- Structure must match the example format exactly`,
      
      'English': `Format in English following these exact rules:
- Keep all proper nouns as they are
- Date format: MM/DD/YY (08/27/25)
- Time format: HH:MM AM/PM (06:15 AM, 07:45 PM)
- Use clear, natural English
- Structure must match the example format exactly`
    };

    return languageInstructions[targetLanguage] || languageInstructions['English'];
  }

  // Translate Panchang text to target language
  async translatePanchangText(request: TranslationRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a expert translator for Vedic and Hindu spiritual content. Your task is to translate Panchang (Hindu calendar) details from English to the target language while preserving the exact structure and format.

${this.getTranslationPrompt(request.targetLanguage)}

CRITICAL FORMAT REQUIREMENTS:
📅 Date: MM/DD/YY
🌅 Sunrise: HH:MM AM/PM | 🌇 Sunset: HH:MM AM/PM
📖 Maasa: [translated month name]
📆 Vasara (Day): [translated day]
🌙 Tithi: [translated tithi details]
Start: MM/DD/YY HH:MM AM/PM | End: MM/DD/YY HH:MM AM/PM
✨ Nakshatra: [translated nakshatra] till HH:MM AM/PM
💫 Amrutha Kalam: HH:MM AM/PM – HH:MM AM/PM
🚫 Varjyam: HH:MM AM/PM – HH:MM AM/PM
⚠️ Durmuhurtham: HH:MM AM/PM – HH:MM AM/PM
🔥 Rahu Kalam: HH:MM AM/PM – HH:MM AM/PM
⛔ Yama Gandam: HH:MM AM/PM – HH:MM AM/PM
🌌 Brahma Muhurtham: HH:MM AM/PM – HH:MM AM/PM

Keep emojis exactly as shown. Translate only the content, not the structure or emojis.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Translate this Panchang content to ${request.targetLanguage}:\n\n${request.text}`
      }
    ];

    const requestBody: OpenAIRequest = {
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1500,
      temperature: 0.3 // Lower temperature for consistent formatting
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No translation received from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI Translation API call failed:', error);
      throw error;
    }
  }

  // Generate audio using OpenAI TTS
  async generateAudio(text: string, language: string): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const voice = this.getVoiceForLanguage(language);
    
    const requestBody: TTSRequest = {
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
      speed: 0.9 // Slightly slower for better pronunciation
    };

    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI TTS API error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.blob();

    } catch (error) {
      console.error('OpenAI TTS API call failed:', error);
      throw error;
    }
  }

  // Complete translation with both text and audio
  async translateWithAudio(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      // Step 1: Translate the text
      const translatedText = await this.translatePanchangText(request);
      
      // Step 2: Generate audio for the translated text
      const audioBlob = await this.generateAudio(translatedText, request.targetLanguage);
      
      // Step 3: Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        translatedText,
        audioUrl,
        audioBlob,
        targetLanguage: request.targetLanguage
      };
      
    } catch (error) {
      console.error('Translation with audio failed:', error);
      // Return text-only translation if audio fails
      try {
        const translatedText = await this.translatePanchangText(request);
        return {
          translatedText,
          targetLanguage: request.targetLanguage
        };
      } catch (translationError) {
        throw new Error(`Translation failed: ${translationError}`);
      }
    }
  }

  // Clean up audio URLs to prevent memory leaks
  static cleanupAudioUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // Helper to detect if text is already in target language (basic check)
  private needsTranslation(text: string, targetLanguage: string): boolean {
    // If target is English and text contains mostly ASCII, probably doesn't need translation
    if (targetLanguage === 'English') {
      const asciiRatio = (text.match(/[a-zA-Z\s]/g) || []).length / text.length;
      return asciiRatio < 0.7; // If less than 70% ASCII, probably needs translation
    }
    
    // For other languages, check if target script is already present
    const scriptRanges: Record<string, RegExp> = {
      'Hindi': /[\u0900-\u097F]/,
      'Telugu': /[\u0C00-\u0C7F]/,
      'Tamil': /[\u0B80-\u0BFF]/,
      'Kannada': /[\u0C80-\u0CFF]/,
      'Malayalam': /[\u0D00-\u0D7F]/
    };
    
    const scriptRegex = scriptRanges[targetLanguage];
    if (scriptRegex) {
      const scriptMatches = (text.match(scriptRegex) || []).length;
      const totalChars = text.replace(/[^\p{L}]/gu, '').length;
      return scriptMatches / totalChars < 0.5; // If less than 50% target script, needs translation
    }
    
    return true; // Default to needing translation
  }

  // Smart translation that checks if translation is needed
  async smartTranslate(request: TranslationRequest): Promise<TranslationResponse> {
    // If source and target are the same, just generate audio
    if (request.sourceLanguage === request.targetLanguage) {
      const audioBlob = await this.generateAudio(request.text, request.targetLanguage);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        translatedText: request.text,
        audioUrl,
        audioBlob,
        targetLanguage: request.targetLanguage
      };
    }

    // Check if translation is actually needed
    if (!this.needsTranslation(request.text, request.targetLanguage)) {
      const audioBlob = await this.generateAudio(request.text, request.targetLanguage);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        translatedText: request.text,
        audioUrl,
        audioBlob,
        targetLanguage: request.targetLanguage
      };
    }

    // Perform full translation with audio
    return this.translateWithAudio(request);
  }
}

export const openAITranslationService = new OpenAITranslationService();
