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
      'Telugu': 'nova', 
      'Tamil': 'echo',
      'Kannada': 'fable',
      'Malayalam': 'onyx'
    };
    
    return voiceMap[language] || 'alloy';
  }

  // Get language-specific translation prompt
  private getTranslationPrompt(targetLanguage: string): string {
    const languageInstructions: Record<string, string> = {
      'Telugu': `Translate to Telugu following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Use ONLY Telugu script (తెలుగు) for ALL labels and content
- Format: "- తేదీ: 08/27/25" (dash space label colon space content)
- Native labels: తేదీ (Date), సూర్యోదయం (Sunrise), సూర్యాస్తమయం (Sunset), మాసం (Month), వాసరం (Day), తిథి (Tithi), నక్షత్రం (Nakshatra), అమృత కాలం (Amrutha Kalam), వర్జ్యం (Varjyam), దుర్ముహూర్తం (Durmuhurtham), రాహు కాలం (Rahu Kalam), యమ గండం (Yama Gandam), బ్రహ్మ ముహూర్తం (Brahma Muhurtham)
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with native language labels`,
      
      'Hindi': `Translate to Hindi following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Use ONLY Devanagari script (हिंदी) for ALL labels and content
- Format: "- तारीख: 08/27/25" (dash space label colon space content)
- Native labels: तारीख (Date), सूर्योदय (Sunrise), सूर्यास्त (Sunset), मास (Month), वासर (Day), तिथि (Tithi), नक्षत्र (Nakshatra), अमृत काल (Amrutha Kalam), वर्ज्यम (Varjyam), दुर्मुहूर्त (Durmuhurtham), राहु काल (Rahu Kalam), यम गंडम (Yama Gandam), ब्रह्म मुहूर्त (Brahma Muhurtham)
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with native language labels`,
      
      'Tamil': `Translate to Tamil following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Use ONLY Tamil script (தமிழ்) for ALL labels and content
- Format: "- தேதி: 08/27/25" (dash space label colon space content)
- Native labels: தேதி (Date), சூரிய உதயம் (Sunrise), சூரிய அஸ்தமனம் (Sunset), மாதம் (Month), நாள் (Day), திதி (Tithi), நக்ஷத்திரம் (Nakshatra), அமிர்த காலம் (Amrutha Kalam), வர்ஜ்யம் (Varjyam), துர்முஹூர்த்தம் (Durmuhurtham), ராகு காலம் (Rahu Kalam), யம கண்டம் (Yama Gandam), பிரம்ம முஹூர்த்தம் (Brahma Muhurtham)
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with native language labels`,
      
      'Kannada': `Translate to Kannada following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Use ONLY Kannada script (ಕನ್ನಡ) for ALL labels and content
- Format: "- ದಿನಾಂಕ: 08/27/25" (dash space label colon space content)
- Native labels: ದಿನಾಂಕ (Date), ಸೂರ್ಯೋದಯ (Sunrise), ಸೂರ್ಯಾಸ್ತ (Sunset), ಮಾಸ (Month), ವಾರ (Day), ತಿಥಿ (Tithi), ನಕ್ಷತ್ರ (Nakshatra), ಅಮೃತ ಕಾಲ (Amrutha Kalam), ವರ್ಜ್ಯಂ (Varjyam), ದುರ್ಮುಹೂರ್ತ (Durmuhurtham), ರಾಹು ಕಾಲ (Rahu Kalam), ಯಮ ಗಂಡ (Yama Gandam), ಬ್ರಹ್ಮ ಮುಹೂರ್ತ (Brahma Muhurtham)
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with native language labels`,
      
      'Malayalam': `Translate to Malayalam following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Use ONLY Malayalam script (മലയാളം) for ALL labels and content
- Format: "- തീയതി: 08/27/25" (dash space label colon space content)
- Native labels: തീയതി (Date), സൂര്യോദയം (Sunrise), സൂര്യാസ്തമയം (Sunset), മാസം (Month), ദിവസം (Day), തിഥി (Tithi), നക്ഷത്രം (Nakshatra), അമൃത കാലം (Amrutha Kalam), വര്‍ജ്യം (Varjyam), ദുര്‍മുഹൂര്‍ത്തം (Durmuhurtham), രാഹു കാലം (Rahu Kalam), യമ ഗണ്ഡം (Yama Gandam), ബ്രഹ്മ മുഹൂര്‍ത്തം (Brahma Muhurtham)
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with native language labels`,
      
      'English': `Format in English following these CRITICAL rules:
- REMOVE ALL EMOJIS completely - no 📅, 🌅, 🌙, etc.
- Format: "- Date: 08/27/25" (dash space label colon space content)
- Use English labels: Date, Sunrise, Sunset, Month, Day, Tithi, Nakshatra, Amrutha Kalam, Varjyam, Durmuhurtham, Rahu Kalam, Yama Gandam, Brahma Muhurtham
- Keep spiritual terms like "Ekadashi", "Shravana" as-is
- Time format: HH:MM AM/PM
- Clean bullet format with English labels`
    };

    return languageInstructions[targetLanguage] || languageInstructions['English'];
  }

  // Translate Panchang text to target language
  async translatePanchangText(request: TranslationRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert translator for Vedic and Hindu spiritual content. Your task is to translate Panchang (Hindu calendar) details from English to the target language using ONLY native script labels and NO EMOJIS.

${this.getTranslationPrompt(request.targetLanguage)}

EXAMPLE CLEAN FORMAT (for Hindi):
🪔 Jai Shree Krishna.

आज मुंबई में 27 अगस्त 2025 का पंचांग इस प्रकार है:

- तिथि: चतुर्थी, दोपहर 15:44 तक, फिर पंचमी तिथि प्रारम्भ
- नक्षत्र: हस्त सुबह 06:04 तक, फिर चित्रा नक्षत्र
- योग: शुभ योग दोपहर 12:27 तक
- करण: प्रथम करण - वणिज दोपहर 15:44 तक, द्वितीय करण - बावा
- वार: बुधवार
- चंद्र राशि: कन्या रात 19:21 तक, फिर तुला
- सूर्य राशि: सिंह
- सूर्योदय: सुबह 06:00 बजे
- सूर्यास्त: सुबह 18:44 बजे
- राहुकाल: दोपहर 12:22 से 13:59 तक
- यमगांड: सुबह 07:36 से 09:11 तक
- अभिजीत मुहूर्त: सुबह 12:15 से 13:05 तक

चौघड़िया मुहूर्त (मुंबई के लिए):
- लाभ: 06:22 - 07:56
- अमृत: 07:56 - 09:30

CRITICAL REQUIREMENTS:
- NO EMOJIS in the main content (except greeting 🪔)
- Use ONLY native language labels for ALL terms
- Use "- " (dash space) for bullet points
- Keep spiritual proper nouns as-is
- Natural, flowing native language text
- Perfect native script rendering`;

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
        let translatedContent = data.choices[0].message.content;
        
        // Post-processing: Ensure absolutely no emojis except the greeting
        translatedContent = this.postProcessTranslation(translatedContent);
        
        return translatedContent;
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

  // Post-process translation to ensure world-class cleanliness
  private postProcessTranslation(content: string): string {
    // Split into lines for processing
    let lines = content.split('\n');
    
    // Process each line
    lines = lines.map(line => {
      // Keep the greeting line as-is (🪔 Jai Shree Krishna)
      if (line.includes('🪔') && line.includes('Jai Shree Krishna')) {
        return line;
      }
      
      // Remove ALL other emojis from content lines
      line = line.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
      
      // Ensure proper dash-space formatting for bullet points
      line = line.replace(/^[\s]*[•·*]\s*/, '- ');
      
      // Clean up extra spaces
      line = line.replace(/\s+/g, ' ').trim();
      
      return line;
    });
    
    // Remove empty lines but preserve structure
    lines = lines.filter(line => line.trim() !== '');
    
    return lines.join('\n');
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
