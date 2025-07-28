export interface GeminiRequest {
  question: string;
  context?: string;
}

export interface GeminiResponse {
  success: boolean;
  response?: string;
  error?: string;
  isPanchangQuery?: boolean;
  extractedDate?: string;
  extractedLocation?: string;
  queryType?: 'next_event' | 'date_specific' | 'general' | 'vague' | 'spiritual_guidance';
  correctedSpelling?: string;
  suggestedQueries?: string[];
}

class GeminiAPIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDeXkh_zbZxuNESQUH1FXAlXBB5YFOcV08';
  }

  async analyzeQuestion(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const prompt = `
You are an AI assistant specialized in Hindu astrology and Panchang (Hindu calendar). 
Analyze the following question and provide a structured response. Handle spelling variations and typos intelligently.

Question: "${request.question}"

Please analyze this question and respond in the following JSON format:
{
  "isPanchangQuery": true/false,
  "queryType": "next_event|date_specific|general|vague|spiritual_guidance",
  "extractedDate": "YYYY-MM-DD" (if date is mentioned),
  "extractedLocation": "location" (if location is mentioned),
  "clarifiedQuestion": "rephrased clear question",
  "correctedSpelling": "corrected spelling if needed",
  "suggestedQueries": ["array of suggested queries"],
  "explanation": "brief explanation of what the user is asking",
  "suggestedResponse": "how to respond to this query"
}

Handle common spelling variations for Hindu terms:
- "pratipada" (correct) vs "pratipada", "pratipada", "pratipada" - 1st tithi
- "dwitiya" (correct) vs "dwitiya", "dwitiya", "dwitiya" - 2nd tithi
- "tritiya" (correct) vs "tritiya", "tritiya", "tritiya" - 3rd tithi
- "chaturthi" (correct) vs "chaturthi", "chaturthi", "chaturthi" - 4th tithi
- "panchami" (correct) vs "panchami", "panchami", "panchami" - 5th tithi
- "shashthi" (correct) vs "shashti", "shashthi", "shashthi" - 6th tithi
- "saptami" (correct) vs "saptami", "saptami", "saptami" - 7th tithi
- "ashtami" (correct) vs "ashtami", "ashtami", "ashtami" - 8th tithi
- "navami" (correct) vs "navami", "navami", "navami" - 9th tithi
- "dashami" (correct) vs "dashami", "dashami", "dashami" - 10th tithi
- "ekadashi" (correct) vs "ekadasi", "ekadasi", "ekadashi" - 11th tithi
- "dwadashi" (correct) vs "dwadashi", "dwadashi", "dwadashi" - 12th tithi
- "trayodashi" (correct) vs "trayodashi", "trayodashi", "trayodashi" - 13th tithi
- "chaturdashi" (correct) vs "chaturdashi", "chaturdashi", "chaturdashi" - 14th tithi
- "purnima" (correct) vs "purnima", "purnima", "purnima" - 15th tithi (full moon)
- "amavasya" (correct) vs "amavasya", "amavasya", "amavasya" - New moon

If the question is vague or unclear, provide a helpful clarification.
If it's a Panchang-related question, identify the specific type of information needed.
If it's not Panchang-related, suggest how to handle it appropriately.

Focus on:
- Hindu calendar events (Tithi, Nakshatra, Yoga, Karana)
- Auspicious timings and dates
- Fasting days and religious observances
- Astrological guidance
- Date-specific Panchang information
- Spiritual practices and rituals
- Specific festivals and vratas (Varalakshmi Vratham, etc.)
- Paksha information (Krishna Paksha, Shukla Paksha)
- Maasa (lunar month) information
- Tithi-specific queries (Ashtami, Ekadashi, Purnima, Amavasya)
`;

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
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON response
      try {
        const parsedResponse = JSON.parse(responseText);
        
        return {
          success: true,
          response: parsedResponse.clarifiedQuestion || request.question,
          isPanchangQuery: parsedResponse.isPanchangQuery || false,
          extractedDate: parsedResponse.extractedDate,
          extractedLocation: parsedResponse.extractedLocation,
          queryType: parsedResponse.queryType as any,
          correctedSpelling: parsedResponse.correctedSpelling,
          suggestedQueries: parsedResponse.suggestedQueries
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw response
        return {
          success: true,
          response: responseText,
          isPanchangQuery: true,
          queryType: 'general'
        };
      }

    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        error: `Failed to analyze question: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getSpiritualGuidance(question: string): Promise<GeminiResponse> {
    try {
      const prompt = `
You are a spiritual guide specializing in Hindu philosophy and Vedic wisdom. 
Provide guidance for the following question or concern.

Question: "${question}"

Please provide:
1. A compassionate and wise response
2. Relevant spiritual teachings or quotes
3. Practical advice if applicable
4. Encouragement and positive perspective

Keep the response respectful, informative, and spiritually uplifting.
`;

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
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;

      return {
        success: true,
        response: responseText,
        isPanchangQuery: false,
        queryType: 'general'
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        error: `Failed to get spiritual guidance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const geminiAPI = new GeminiAPIService(); 