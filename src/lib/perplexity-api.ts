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
        console.error('❌ Perplexity API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          requestBody: JSON.stringify(requestBody, null, 2)
        });
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      console.log('✅ Perplexity API Response:', {
        model: data.model,
        tokensUsed: data.usage.total_tokens,
        responseLength: data.choices[0]?.message.content.length || 0
      });

      return data.choices[0]?.message.content || 'No response generated';

    } catch (error) {
      console.error('❌ Perplexity API Error:', error);
      throw error;
    }
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
- Always specify timezone: "in ${timezone} timezone"

For specific queries:
- Tithi queries: Show start and end times in ${timezone}
- Nakshatra queries: Show start and end times in ${timezone}
- Auspicious timings: Convert all timings to ${timezone}
- Festival dates: Show in ${timezone} local time

Format examples:
- "Purnima Tithi Start: 08/08/25 at 3:23 AM ${timezone}"
- "Purnima Tithi End: 08/09/25 at 4:51 AM ${timezone}"
- "Ekadashi begins: 08/15/25 at 2:15 AM ${timezone}"

Always convert from IST to ${timezone} timezone.`;

    let enhancedQuery = query;
    if (context?.currentTime) {
      enhancedQuery += `\n\nCurrent time in ${timezone}: ${context.currentTime}`;
    }
    enhancedQuery += `\n\nCRITICAL: Use Drik Panchangam calculations but convert ALL timings from IST to ${timezone} timezone for ${location}. Show all times in ${timezone} local time only.`;

    return this.generateText(enhancedQuery, {
      model: 'sonar-pro',
      maxTokens: 1200,
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