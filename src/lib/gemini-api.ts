export interface QueryClarificationRequest {
  question: string;
  context?: string;
}

export interface QueryClarificationResponse {
  success: boolean;
  clarifiedQuestion?: string;
  needsClarification?: boolean;
  clarificationPrompt?: string;
  error?: string;
}

export interface AIValidationRequest {
  panchangData: any;
  userQuestion: string;
  response: string;
}

export interface AIValidationResponse {
  success: boolean;
  validatedResponse?: string;
  confidence?: number;
  suggestions?: string[];
  error?: string;
}

// Gemini API implementation
class GeminiAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}

// Export the Gemini API instance
export const geminiAPI = new GeminiAPI();

class AIService {
  private geminiAPI: GeminiAPI;

  constructor() {
    this.geminiAPI = geminiAPI;
  }

  // Clarify ambiguous user queries
  async clarifyQuery(request: QueryClarificationRequest): Promise<QueryClarificationResponse> {
    try {
      const prompt = `
You are a Hindu spiritual assistant. The user asked: "${request.question}"

Please analyze if this question needs clarification. Consider:
1. Is the question clear and specific?
2. Are there multiple possible interpretations?
3. Does it need more context (date, location, specific ritual)?

If the question is clear, return the clarified version.
If it needs clarification, provide a helpful prompt to get more details.

Respond in JSON format:
{
  "needsClarification": boolean,
  "clarifiedQuestion": "string (if clear)",
  "clarificationPrompt": "string (if needs clarification)"
}
`;

      const response = await this.geminiAPI.generateText(prompt);
      
      try {
        const result = JSON.parse(response);
        return {
          success: true,
          needsClarification: result.needsClarification,
          clarifiedQuestion: result.clarifiedQuestion,
          clarificationPrompt: result.clarificationPrompt
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      console.error('AI clarification error:', error);
      return {
        success: false,
        error: 'Failed to clarify query'
      };
    }
  }

  // Validate and enhance panchang responses
  async validateResponse(request: AIValidationRequest): Promise<AIValidationResponse> {
    try {
      const prompt = `
You are validating Hindu spiritual guidance. 

User Question: "${request.userQuestion}"
Panchang Data: ${JSON.stringify(request.panchangData, null, 2)}
Current Response: "${request.response}"

Please validate and enhance this response:
1. Is the information accurate based on the panchang data?
2. Is the response clear and helpful?
3. Can it be improved for clarity or completeness?

Respond in JSON format:
{
  "validatedResponse": "improved response text",
  "confidence": 0.95,
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

      const response = await this.geminiAPI.generateText(prompt);
      
      try {
        const result = JSON.parse(response);
        return {
          success: true,
          validatedResponse: result.validatedResponse,
          confidence: result.confidence,
          suggestions: result.suggestions
        };
      } catch (parseError) {
        console.error('Failed to parse AI validation response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI validation response'
        };
      }
    } catch (error) {
      console.error('AI validation error:', error);
      return {
        success: false,
        error: 'Failed to validate response'
      };
    }
  }
}

export const aiService = new AIService(); 