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
        model = 'llama-3.1-sonar-small-128k-online',
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
      model: 'llama-3.1-sonar-small-128k-online',
      maxTokens: 800,
      temperature: 0.8,
      systemPrompt
    });
  }

  /**
   * Generate astrological insights using Perplexity
   */
  async generateAstrologicalInsights(
    query: string,
    panchangData?: any
  ): Promise<string> {
    const systemPrompt = `You are an expert Vedic astrologer for Voice Vedic. Provide astrological insights that are:
- Based on traditional Vedic astrology principles
- Practical and actionable
- Positive and encouraging
- Respectful of free will and personal choice
- Focused on spiritual growth and self-improvement

Always emphasize that astrology is a tool for self-understanding, not deterministic.`;

    let enhancedQuery = query;
    if (panchangData) {
      enhancedQuery += `\n\nPanchang Data: ${JSON.stringify(panchangData)}`;
    }

    return this.generateText(enhancedQuery, {
      model: 'llama-3.1-sonar-small-128k-online',
      maxTokens: 600,
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
      model: 'llama-3.1-sonar-small-128k-online',
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