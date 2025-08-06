interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  search_domain_filter?: string[];
  search_recency_filter?: string;
}

interface PerplexityResponse {
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

class PerplexityAPI {
  private apiKey: string;
  private baseURL = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Perplexity API key not found in environment variables');
    }
  }

  /**
   * Generate text using Perplexity API
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key not configured');
      }

      const {
        model = 'sonar-pro',
        maxTokens = 1000,
        temperature = 0.7,
        systemPrompt = 'You are a helpful AI assistant for Voice Vedic, a spiritual and astrological application. Provide clear, accurate, and helpful responses.'
      } = options;

      const messages: PerplexityMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const requestBody: PerplexityRequest = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        stream: false,
        search_domain_filter: [],
        search_recency_filter: "month"
      };

      console.log('🤖 Perplexity API Request:', {
        model,
        promptLength: prompt.length,
        maxTokens,
        temperature
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Perplexity API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log('✅ Perplexity API response received');
        
        // Clean the response for TTS
        const cleanedContent = this.cleanResponse(content);
        return cleanedContent;
      } else {
        throw new Error('No response content from Perplexity API');
      }

    } catch (error) {
      console.error('❌ Perplexity API Error:', error);
      throw error;
    }
  }

  /**
   * Clean response by removing special symbols and ensuring English only
   */
  private cleanResponse(response: string): string {
    // Remove special symbols and characters
    let cleaned = response
      .replace(/[*#@$%^&+=<>{}[\]|\\]/g, '') // Remove special symbols
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/[^\w\s\-.,:;()]/g, '') // Keep only alphanumeric, spaces, and basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove citations and reference numbers
    cleaned = cleaned
      .replace(/\b\d+\b(?=\s*$)/g, '') // Remove numbers at end of lines
      .replace(/calculations\d+/gi, '') // Remove "calculations4" etc.
      .replace(/references?\d+/gi, '') // Remove "reference1" etc.
      .replace(/sources?\d+/gi, ''); // Remove "source1" etc.
    
    // Fix broken table formats
    cleaned = cleaned
      .replace(/Field\s+Value\s+[-=]+\s+Date/gi, '| Field | Value |\n|-------|-------|\n| Date |')
      .replace(/[-=]{3,}/g, '---') // Fix broken separators
      .replace(/\|\s*[-=]+\s*\|/g, '|-------|'); // Fix broken table headers
    
    // Ensure it's in English only
    cleaned = cleaned.replace(/[^\x00-\x7F]/g, '');
    
    // Remove timezone mentions
    cleaned = cleaned
      .replace(/in\s+AmericaVancouver\s+timezone/gi, '')
      .replace(/in\s+America\/Vancouver\s+timezone/gi, '')
      .replace(/Vancouver,\s+Canada\s+local\s+time/gi, '')
      .replace(/converted\s+from\s+Drik\s+Panchangam\s+calculations/gi, '');
    
    return cleaned.trim();
  }

  /**
   * Generate spiritual guidance using Perplexity
   */
  async generateSpiritualGuidance(
    query: string,
    context?: {
      panchangData?: any;
      userLocation?: string;
      currentTime?: string;
    }
  ): Promise<string> {
    const systemPrompt = `You are a wise spiritual guide for Voice Vedic. Provide gentle, uplifting spiritual guidance that is:
- Rooted in Vedic wisdom and spiritual traditions
- Practical and actionable
- Respectful of all spiritual paths
- Encouraging and positive
- Suitable for daily spiritual practice

Focus on meditation, mindfulness, gratitude, and inner peace. Keep responses concise but meaningful.`;

    let enhancedQuery = query;
    if (context?.panchangData) {
      enhancedQuery += `\n\nCurrent Panchang Information: ${JSON.stringify(context.panchangData)}`;
    }
    if (context?.userLocation) {
      enhancedQuery += `\n\nUser Location: ${context.userLocation}`;
    }
    if (context?.currentTime) {
      enhancedQuery += `\n\nCurrent Time: ${context.currentTime}`;
    }

    return this.generateText(enhancedQuery, {
      model: 'sonar-pro',
      maxTokens: 800,
      temperature: 0.8,
      systemPrompt
    });
  }

  /**
   * Check if query is Panchang-related
   */
  private isPanchangQuery(query: string): boolean {
    const panchangKeywords = [
      'panchang', 'tithi', 'nakshatra', 'yoga', 'karana', 'maasa', 'paksha',
      'sunrise', 'sunset', 'auspicious', 'inauspicious', 'muhurtham',
      'purnima', 'amavasya', 'ekadashi', 'ashtami', 'navami', 'dashami',
      'dwadashi', 'trayodashi', 'chaturdashi', 'pratipada', 'dwitiya',
      'tritya', 'chaturthi', 'panchami', 'shashthi', 'saptami',
      'rahu', 'yama', 'gulika', 'abhijit', 'varjyam', 'durmuhratham',
      'pradosham', 'sandhya', 'brahma', 'godhuli', 'abhijit',
      'swati', 'vishakha', 'anuraadha', 'jyeshtha', 'mula', 'purvashadha',
      'uttarashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purvabhadrapada',
      'uttarabhadrapada', 'revati', 'ashwini', 'bharani', 'krittika', 'rohini',
      'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha', 'magha',
      'purvaphalguni', 'uttaraphalguni', 'hasta', 'chitra', 'vishakha',
      'divine', 'spiritual', 'vedic', 'hindu', 'astrology', 'horoscope'
    ];
    
    const lowerQuery = query.toLowerCase();
    return panchangKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Generate response for non-Panchang queries
   */
  async generateNonPanchangResponse(query: string): Promise<string> {
    return `I apologize, but VoiceVedic is specifically designed for Panchang and divine spiritual information only. 

This application can help you with:
- Panchang information (tithi, nakshatra, yoga, karana)
- Auspicious timings and muhurthams
- Divine spiritual guidance
- Vedic astrology insights
- Hindu calendar and festival information

Please ask questions related to Panchang, spiritual guidance, or divine information. For example:
- "What is today's Panchang?"
- "When is the next Purnima?"
- "Tell me about today's auspicious timings"
- "What is the spiritual significance of Ekadashi?"`;
  }

  /**
   * Generate Drik Panchangam specific responses with timezone conversion
   */
  async generateDrikPanchangamResponse(
    query: string,
    context?: {
      userLocation?: string;
      currentTime?: string;
      timezone?: string;
    }
  ): Promise<string> {
    const timezone = context?.timezone || 'America/Vancouver';
    const location = context?.userLocation || 'Vancouver, Canada';
    
    const systemPrompt = `You are a Drik Panchangam expert for Voice Vedic. Provide accurate Panchang information using Drik Panchangam calculations but with CRITICAL timezone conversion.

CRITICAL REQUIREMENTS:
- Use Drik Panchangam calculations as the source
- Convert ALL timings from IST (Indian Standard Time) to ${timezone} timezone
- All times must be in ${location} local time
- Use MM/DD/YY format for dates
- Use HH:MM AM/PM format for times
- NEVER show IST times - only ${timezone} times
- DO NOT mention timezone in output - just show the converted times
- NO special symbols, emojis, or non-English characters
- Output MUST be in clean tabular format
- Use ONLY English language
- Keep responses CONCISE and CLEAR

OUTPUT FORMAT REQUIREMENTS:
- Use clean Markdown table format
- NO special characters (*, #, @, etc.)
- NO emojis or symbols
- ONLY English text
- Clean, readable format for TTS
- DO NOT mention timezone in the output
- NO citations or reference numbers
- Keep it BRIEF and TO THE POINT

For specific queries:
- Tithi queries: Show start and end times in ${timezone}
- Nakshatra queries: Show start and end times in ${timezone}
- Auspicious timings: Convert all timings to ${timezone}
- Festival dates: Show in ${timezone} local time

Table format example:
| Field | Value |
|-------|-------|
| Date | 08/08/25 |
| Tithi | Shukla Ashtami |
| Nakshatra | Swati |
| Sunrise | 6:02 AM |
| Sunset | 8:18 PM |

Always convert from IST to ${timezone} timezone but DO NOT mention timezone in output.`;

    let enhancedQuery = query;
    if (context?.currentTime) {
      enhancedQuery += `\n\nCurrent time in ${timezone}: ${context.currentTime}`;
    }
    enhancedQuery += `\n\nCRITICAL: Use Drik Panchangam calculations but convert ALL timings from IST to ${timezone} timezone for ${location}. Show all times in ${timezone} local time only. Output in clean tabular format with NO special symbols or emojis. Use ONLY English language. DO NOT mention timezone in the output. Keep it BRIEF and CONCISE.`;

    return this.generateText(enhancedQuery, {
      model: 'sonar-pro',
      maxTokens: 800,
      temperature: 0.5,
      systemPrompt
    });
  }

  /**
   * Generate astrological insights using Perplexity
   */
  async generateAstrologicalInsights(
    query: string,
    context?: {
      userLocation?: string;
      currentTime?: string;
      timezone?: string;
    }
  ): Promise<string> {
    const timezone = context?.timezone || 'America/Vancouver';
    const location = context?.userLocation || 'Vancouver, Canada';
    
    const systemPrompt = `You are an expert Vedic astrologer for Voice Vedic. Provide astrological insights that are:
- Based on traditional Vedic astrology principles and Drik Panchangam standards
- Practical and actionable
- Positive and encouraging
- Respectful of free will and personal choice
- Focused on spiritual growth and self-improvement

CRITICAL TIMEZONE REQUIREMENTS:
- All dates, times, and astrological calculations MUST be provided in ${timezone} timezone (${location} local time)
- Use Drik Panchangam calculations but convert ALL times to ${timezone} timezone
- Use MM/DD/YY format for dates
- Use HH:MM AM/PM format for times
- ALL times should be in ${timezone} timezone (NOT IST or India timezone)
- Provide times as per ${location} local time
- When mentioning Panchang timings, always specify they are in ${timezone} timezone

For Panchang queries (tithi, nakshatra, auspicious timings):
- Use Drik Panchangam calculations
- Convert all timings from IST to ${timezone} timezone
- Show start and end times in ${timezone} local time
- Format: "Tithi Start: MM/DD/YY at HH:MM AM/PM ${timezone}"
- Format: "Tithi End: MM/DD/YY at HH:MM AM/PM ${timezone}"

Always emphasize that astrology is a tool for self-understanding, not deterministic.`;

    let enhancedQuery = query;
    if (context?.currentTime) {
      enhancedQuery += `\n\nCurrent time in ${timezone}: ${context.currentTime}`;
    }
    enhancedQuery += `\n\nIMPORTANT: Please provide all Panchang information using Drik Panchangam calculations but convert ALL timings to ${timezone} timezone for ${location}. Do NOT use IST or India timezone. All times must be in ${timezone} local time.`;

    return this.generateText(enhancedQuery, {
      model: 'sonar-pro',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt
    });
  }

  /**
   * Generate general knowledge responses
   */
  async generateKnowledgeResponse(query: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for Voice Vedic. Provide accurate, informative, and helpful responses. Be concise but thorough.`;

    return this.generateText(query, {
      model: 'sonar-pro',
      maxTokens: 1000,
      temperature: 0.5,
      systemPrompt
    });
  }

  /**
   * Test connection with different models
   */
  async testConnection(): Promise<boolean> {
    try {
      const testModels = [
        'sonar-pro',
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-small-128k',
        'llama-3.1-sonar-medium-128k-online',
        'llama-3.1-sonar-medium-128k',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-large-128k',
        'mixtral-8x7b-instruct',
        'mistral-7b-instruct',
        'codellama-34b-instruct',
        'llama-2-70b-chat',
        'llama-2-13b-chat',
        'llama-2-7b-chat'
      ];

      for (const model of testModels) {
        try {
          console.log(`🧪 Testing model: ${model}`);
          const response = await this.generateText('Hello, this is a test.', {
            model,
            maxTokens: 50,
            temperature: 0.1
          });
          
          if (response && response.length > 0) {
            console.log(`✅ Model ${model} works! Response: ${response.substring(0, 100)}...`);
            return true;
          }
        } catch (modelError) {
          console.log(`❌ Model ${model} failed: ${modelError}`);
          continue;
        }
      }
      
      console.error('❌ All models failed');
      return false;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const perplexityAPI = new PerplexityAPI();

// Export the class for testing purposes
export { PerplexityAPI }; 