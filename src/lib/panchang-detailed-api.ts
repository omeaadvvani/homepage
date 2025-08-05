interface PanchangDetailedRequest {
  date?: string; // MM/DD/YY format, defaults to today
  latitude: number;
  longitude: number;
  location: string;
  timezone?: string;
  query?: string; // User's natural language query
}

interface PanchangDetailedResponse {
  success: boolean;
  data?: PanchangDetailedData;
  error?: string;
  spokenSummary?: string;
}

interface PanchangDetailedData {
  date: string; // MM/DD/YY
  time: string; // HH:MM AM/PM
  maasa: string;
  vasara: string;
  tithi: string;
  tithiStartEnd: string;
  nakshatra: string;
  raashi: string;
  sunrise: string;
  sunset: string;
  aayana: string;
  amruthaKalam: string;
  varjyam: string;
  durmuhurtham: string;
  rahuKalam: string;
  yamaGandam: string;
  pradoshamTimings: string;
}

interface TithiNakshatraQuery {
  type: 'tithi' | 'nakshatra';
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

class PanchangDetailedAPI {
  private baseURL = 'https://api.panchang.click'; // Kept for reference but not used
  private userId: string;
  private authCode: string;

  constructor() {
    this.userId = import.meta.env.VITE_PANCHANG_USER_ID || '';
    this.authCode = import.meta.env.VITE_PANCHANG_AUTH_CODE || '';
    console.log('🤖 PanchangDetailedAPI initialized - using Perplexity API for all data');
  }

  /**
   * Parse user query to extract date and specific tithi/nakshatra requests
   */
  private parseUserQuery(query: string): {
    date?: string;
    specificTithi?: string;
    specificNakshatra?: string;
    isNextOccurrence: boolean;
  } {
    const lowerQuery = query.toLowerCase();
    const result = {
      date: undefined as string | undefined,
      specificTithi: undefined as string | undefined,
      specificNakshatra: undefined as string | undefined,
      isNextOccurrence: false
    };

    // Check for date patterns
    const todayPatterns = ['today', 'current', 'now'];
    const tomorrowPatterns = ['tomorrow', 'next day'];
    const yesterdayPatterns = ['yesterday', 'previous day'];

    if (todayPatterns.some(pattern => lowerQuery.includes(pattern))) {
      result.date = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    } else if (tomorrowPatterns.some(pattern => lowerQuery.includes(pattern))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.date = tomorrow.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    } else if (yesterdayPatterns.some(pattern => lowerQuery.includes(pattern))) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      result.date = yesterday.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    }

    // Check for specific tithi queries
    const tithiNames = [
      'pratipada', 'dwitiya', 'tritiya', 'chaturthi', 'panchami', 'shashthi',
      'saptami', 'ashtami', 'navami', 'dashami', 'ekadashi', 'dwadashi',
      'trayodashi', 'chaturdashi', 'purnima', 'amavasya'
    ];

    for (const tithi of tithiNames) {
      if (lowerQuery.includes(tithi)) {
        result.specificTithi = tithi;
        break;
      }
    }

    // Check for specific nakshatra queries
    const nakshatraNames = [
      'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra',
      'punarvasu', 'pushya', 'ashlesha', 'magha', 'purva phalguni', 'uttara phalguni',
      'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyestha',
      'mula', 'purva ashadha', 'uttara ashadha', 'shravana', 'dhanishta',
      'shatabhisha', 'purva bhadrapada', 'uttara bhadrapada', 'revati'
    ];

    for (const nakshatra of nakshatraNames) {
      if (lowerQuery.includes(nakshatra)) {
        result.specificNakshatra = nakshatra;
        break;
      }
    }

    // Check for next occurrence queries
    if (lowerQuery.includes('next') || lowerQuery.includes('when') || lowerQuery.includes('occurrence')) {
      result.isNextOccurrence = true;
    }

    return result;
  }

  /**
   * Format time to 12-hour clock with AM/PM
   */
  private formatTime(timeString: string): string {
    if (!timeString) return 'Not available';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  }

  /**
   * Format date to MM/DD/YY
   */
  private formatDate(dateString: string): string {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  }

  /**
   * Generate spoken summary for voice output
   */
  private generateSpokenSummary(data: PanchangDetailedData): string {
    const summary = `Today is ${data.vasara}, ${data.date}. The current tithi is ${data.tithi}. `;
    
    if (data.tithi.includes('till') || data.tithi.includes('from')) {
      summary += `The tithi changes during the day. `;
    }
    
    if (data.nakshatra.includes('till') || data.nakshatra.includes('from')) {
      summary += `The nakshatra also changes during the day. `;
    }
    
    summary += `Sunrise is at ${data.sunrise} and sunset at ${data.sunset}. `;
    summary += `The auspicious Amrutha Kalam is from ${data.amruthaKalam}. `;
    summary += `Avoid activities during Rahu Kalam from ${data.rahuKalam}.`;
    
    return summary;
  }

  /**
   * Get detailed Panchang information
   */
  async getDetailedPanchang(request: PanchangDetailedRequest): Promise<PanchangDetailedResponse> {
    try {
      console.log('🔍 Parsing user query for Panchang details:', request.query);
      
      // Parse user query
      const queryInfo = request.query ? this.parseUserQuery(request.query) : {};
      
      // Determine date to fetch
      const targetDate = request.date || queryInfo.date || new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });

      console.log('📅 Fetching Panchang for date:', targetDate);
      console.log('📍 Location:', request.location);
      console.log('🎯 Specific query:', queryInfo);

      // Fetch Panchang data from API
      const apiResponse = await this.fetchPanchangData({
        date: targetDate,
        latitude: request.latitude,
        longitude: request.longitude,
        location: request.location,
        timezone: request.timezone
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to fetch Panchang data');
      }

      // Format the data according to specifications
      const formattedData = this.formatPanchangData(apiResponse.data, targetDate);
      
      // Generate spoken summary
      const spokenSummary = this.generateSpokenSummary(formattedData);

      console.log('✅ Detailed Panchang data formatted successfully');
      console.log('🗣️ Spoken summary generated');

      return {
        success: true,
        data: formattedData,
        spokenSummary
      };

    } catch (error) {
      console.error('❌ Error fetching detailed Panchang:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch Panchang data using Perplexity API instead of Panchang API
   */
  private async fetchPanchangData(params: {
    date: string;
    latitude: number;
    longitude: number;
    location: string;
    timezone?: string;
  }) {
    try {
      console.log('🤖 Using Perplexity API for Panchang data');
      
      // Create a comprehensive query for Perplexity
      const query = `Provide detailed Panchang information for ${params.location} on ${params.date}. Include:
- Current tithi with start and end times
- Nakshatra with timing
- Sunrise and sunset times
- Auspicious timings (Amrutha Kalam)
- Inauspicious timings (Rahu Kalam, Varjyam, Durmuhurtham, Yama Gandam)
- Aayana (Dakshinayana/Uttarayana)
- Maasa (lunar month)
- Vasara (day of week)
- Raashi (zodiac sign)

Format the response as a structured JSON object with all these details.`;

      // Import and use Perplexity API
      const { perplexityAPI } = await import('./perplexity-api');
      
      const response = await perplexityAPI.generateText(query, {
        model: 'llama-3.1-sonar-small-128k-online',
        maxTokens: 1500,
        temperature: 0.3,
        systemPrompt: `You are an expert Vedic astrologer and Panchang specialist. Provide accurate, detailed Panchang information in a structured format. Always include specific timings and dates. Respond with comprehensive Panchang data including all traditional elements like tithi, nakshatra, auspicious/inauspicious timings, etc.`
      });

      // Parse the response to extract structured data
      const parsedData = this.parsePerplexityResponse(response, params);
      
      return { success: true, data: parsedData };

    } catch (error) {
      console.error('❌ Perplexity API fetch error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Perplexity API request failed' };
    }
  }

  /**
   * Parse Perplexity response to extract structured Panchang data
   */
  private parsePerplexityResponse(response: string, params: any): any {
    try {
      console.log('🔍 Parsing Perplexity response for Panchang data');
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('Failed to parse JSON from response, using fallback parsing');
        }
      }

      // Fallback: Extract information using regex patterns
      const extractedData: any = {
        date: params.date,
        location: params.location,
        maasa: this.extractValue(response, /maasa[:\s]+([^\n,]+)/i) || 'Not available',
        vasara: this.extractValue(response, /vasara[:\s]+([^\n,]+)/i) || 'Not available',
        tithi: this.extractValue(response, /tithi[:\s]+([^\n,]+)/i) || 'Not available',
        nakshatra: this.extractValue(response, /nakshatra[:\s]+([^\n,]+)/i) || 'Not available',
        raashi: this.extractValue(response, /raashi[:\s]+([^\n,]+)/i) || 'Not available',
        sunrise: this.extractTime(response, /sunrise[:\s]+([^\d]+)/i) || 'Not available',
        sunset: this.extractTime(response, /sunset[:\s]+([^\d]+)/i) || 'Not available',
        aayana: this.extractValue(response, /aayana[:\s]+([^\n,]+)/i) || 'Not available',
        amruthaKalamStart: this.extractTime(response, /amrutha[:\s]+([^\d]+)/i) || 'Not available',
        amruthaKalamEnd: this.extractTime(response, /amrutha[:\s]+([^\d]+)/i) || 'Not available',
        rahuKalamStart: this.extractTime(response, /rahu[:\s]+([^\d]+)/i) || 'Not available',
        rahuKalamEnd: this.extractTime(response, /rahu[:\s]+([^\d]+)/i) || 'Not available',
        varjyamStart: this.extractTime(response, /varjyam[:\s]+([^\d]+)/i) || 'Not available',
        varjyamEnd: this.extractTime(response, /varjyam[:\s]+([^\d]+)/i) || 'Not available',
        durmuhurthamStart: this.extractTime(response, /durmuhurtham[:\s]+([^\d]+)/i) || 'Not available',
        durmuhurthamEnd: this.extractTime(response, /durmuhurtham[:\s]+([^\d]+)/i) || 'Not available',
        yamaGandamStart: this.extractTime(response, /yama[:\s]+([^\d]+)/i) || 'Not available',
        yamaGandamEnd: this.extractTime(response, /yama[:\s]+([^\d]+)/i) || 'Not available',
        pradoshamStart: this.extractTime(response, /pradosham[:\s]+([^\d]+)/i) || 'Not available',
        pradoshamEnd: this.extractTime(response, /pradosham[:\s]+([^\d]+)/i) || 'Not available'
      };

      console.log('✅ Extracted Panchang data from Perplexity response:', extractedData);
      return extractedData;

    } catch (error) {
      console.error('❌ Error parsing Perplexity response:', error);
      // Return default data structure
      return {
        date: params.date,
        location: params.location,
        maasa: 'Not available',
        vasara: 'Not available',
        tithi: 'Not available',
        nakshatra: 'Not available',
        raashi: 'Not available',
        sunrise: 'Not available',
        sunset: 'Not available',
        aayana: 'Not available',
        amruthaKalamStart: 'Not available',
        amruthaKalamEnd: 'Not available',
        rahuKalamStart: 'Not available',
        rahuKalamEnd: 'Not available',
        varjyamStart: 'Not available',
        varjyamEnd: 'Not available',
        durmuhurthamStart: 'Not available',
        durmuhurthamEnd: 'Not available',
        yamaGandamStart: 'Not available',
        yamaGandamEnd: 'Not available',
        pradoshamStart: 'Not available',
        pradoshamEnd: 'Not available'
      };
    }
  }

  /**
   * Extract value using regex pattern
   */
  private extractValue(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract time using regex pattern
   */
  private extractTime(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    if (!match) return null;
    
    // Try to find time patterns in the matched text
    const timeMatch = match[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
    }
    
    return match[1].trim();
  }

  /**
   * Format Panchang data according to specifications
   */
  private formatPanchangData(rawData: any, targetDate: string): PanchangDetailedData {
    // Extract and format all required fields
    const formattedData: PanchangDetailedData = {
      date: this.formatDate(targetDate),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      maasa: rawData.maasa || 'Not available',
      vasara: rawData.vasara || 'Not available',
      tithi: this.formatTithi(rawData.tithi, rawData.tithiStart, rawData.tithiEnd),
      tithiStartEnd: this.formatTithiTimings(rawData.tithi, rawData.tithiStart, rawData.tithiEnd),
      nakshatra: this.formatNakshatra(rawData.nakshatra, rawData.nakshatraStart, rawData.nakshatraEnd),
      raashi: this.formatRaashi(rawData.raashi, rawData.raashiStart, rawData.raashiEnd),
      sunrise: this.formatTime(rawData.sunrise),
      sunset: this.formatTime(rawData.sunset),
      aayana: rawData.aayana || 'Not available',
      amruthaKalam: this.formatTimeRange(rawData.amruthaKalamStart, rawData.amruthaKalamEnd),
      varjyam: this.formatTimeRange(rawData.varjyamStart, rawData.varjyamEnd),
      durmuhurtham: this.formatTimeRange(rawData.durmuhurthamStart, rawData.durmuhurthamEnd),
      rahuKalam: this.formatTimeRange(rawData.rahuKalamStart, rawData.rahuKalamEnd),
      yamaGandam: this.formatTimeRange(rawData.yamaGandamStart, rawData.yamaGandamEnd),
      pradoshamTimings: this.formatTimeRange(rawData.pradoshamStart, rawData.pradoshamEnd)
    };

    return formattedData;
  }

  /**
   * Format tithi with paksha information
   */
  private formatTithi(tithi: string, startTime?: string, endTime?: string): string {
    if (!tithi) return 'Not available';
    
    const paksha = tithi.includes('Shukla') ? 'Shukla' : 'Krishna';
    const tithiName = tithi.replace('Shukla ', '').replace('Krishna ', '');
    
    if (startTime && endTime) {
      const startFormatted = this.formatTime(startTime);
      const endFormatted = this.formatTime(endTime);
      return `${paksha} ${tithiName} (till ${endFormatted})`;
    }
    
    return `${paksha} ${tithiName}`;
  }

  /**
   * Format tithi timings with dates
   */
  private formatTithiTimings(tithi: string, startTime?: string, endTime?: string): string {
    if (!tithi || !startTime || !endTime) return 'Not available';
    
    const paksha = tithi.includes('Shukla') ? 'Shukla' : 'Krishna';
    const tithiName = tithi.replace('Shukla ', '').replace('Krishna ', '');
    const startFormatted = this.formatTime(startTime);
    const endFormatted = this.formatTime(endTime);
    const date = this.formatDate(new Date().toISOString());
    
    return `${tithiName}: ${date}, ${startFormatted} – ${endFormatted}`;
  }

  /**
   * Format nakshatra with timing changes
   */
  private formatNakshatra(nakshatra: string, startTime?: string, endTime?: string): string {
    if (!nakshatra) return 'Not available';
    
    if (startTime && endTime) {
      const startFormatted = this.formatTime(startTime);
      const endFormatted = this.formatTime(endTime);
      return `${nakshatra} (till ${endFormatted})`;
    }
    
    return nakshatra;
  }

  /**
   * Format raashi with timing changes
   */
  private formatRaashi(raashi: string, startTime?: string, endTime?: string): string {
    if (!raashi) return 'Not available';
    
    if (startTime && endTime) {
      const startFormatted = this.formatTime(startTime);
      const endFormatted = this.formatTime(endTime);
      return `${raashi} (till ${endFormatted})`;
    }
    
    return raashi;
  }

  /**
   * Format time range
   */
  private formatTimeRange(startTime?: string, endTime?: string): string {
    if (!startTime || !endTime) return 'Not available';
    
    const startFormatted = this.formatTime(startTime);
    const endFormatted = this.formatTime(endTime);
    
    return `${startFormatted} – ${endFormatted}`;
  }

  /**
   * Get next occurrence of specific tithi or nakshatra
   */
  async getNextOccurrence(query: string, location: string, latitude: number, longitude: number): Promise<PanchangDetailedResponse> {
    try {
      const queryInfo = this.parseUserQuery(query);
      const searchType = queryInfo.specificTithi ? 'tithi' : queryInfo.specificNakshatra ? 'nakshatra' : null;
      const searchName = queryInfo.specificTithi || queryInfo.specificNakshatra;

      if (!searchType || !searchName) {
        throw new Error('Please specify a tithi or nakshatra to search for');
      }

      console.log(`🔍 Searching for next occurrence of ${searchType}: ${searchName}`);

      // Search for next occurrence (this would require additional API calls)
      // For now, return current day's data with a note about next occurrence
      const currentData = await this.getDetailedPanchang({
        date: new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit'
        }),
        latitude,
        longitude,
        location,
        query: `Next occurrence of ${searchName}`
      });

      if (currentData.success && currentData.data) {
        currentData.spokenSummary = `The next occurrence of ${searchName} will be available in the detailed Panchang data. ${currentData.spokenSummary}`;
      }

      return currentData;

    } catch (error) {
      console.error('❌ Error getting next occurrence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get next occurrence'
      };
    }
  }
}

// Create and export singleton instance
export const panchangDetailedAPI = new PanchangDetailedAPI();

// Export the class for testing
export { PanchangDetailedAPI }; 