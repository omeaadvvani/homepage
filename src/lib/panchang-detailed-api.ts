import { perplexityAPI } from './perplexity-api';
import { perplexityWebScraper } from './perplexity-web-scraper';
import { 
  getCurrentTimeInTimezone, 
  formatDateInTimezone, 
  getCurrentDayInTimezone,
  calculateSunTimes,
  getTimezoneFromCoordinatesFallback
} from './timezone-utils';

// Helper function to get current date in proper format with timezone
const getCurrentDate = (timezone: string = 'Asia/Kolkata') => {
  return formatDateInTimezone(new Date(), timezone);
};

// Helper function to get current day name with timezone
const getCurrentDay = (timezone: string = 'Asia/Kolkata') => {
  return getCurrentDayInTimezone(timezone);
};

// Helper function to calculate next Ekadashi (approximately every 15 days)
const getNextEkadashi = () => {
  const now = new Date();
  // Ekadashi occurs on 11th and 26th day of lunar month
  // For simplicity, we'll calculate approximate dates
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  // Find next Ekadashi (11th or 26th day)
  let daysToNextEkadashi = 0;
  if (lunarDay <= 11) {
    daysToNextEkadashi = 11 - lunarDay;
  } else if (lunarDay <= 26) {
    daysToNextEkadashi = 26 - lunarDay;
  } else {
    daysToNextEkadashi = 30 - lunarDay + 11;
  }
  
  const nextEkadashiDate = new Date(now.getTime() + daysToNextEkadashi * 24 * 60 * 60 * 1000);
  return nextEkadashiDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Helper function to calculate next Purnima (full moon)
const getNextPurnima = () => {
  const now = new Date();
  // Purnima is on 15th day of lunar month
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  let daysToNextPurnima = 0;
  if (lunarDay <= 15) {
    daysToNextPurnima = 15 - lunarDay;
  } else {
    daysToNextPurnima = 30 - lunarDay + 15;
  }
  
  const nextPurnimaDate = new Date(now.getTime() + daysToNextPurnima * 24 * 60 * 60 * 1000);
  return nextPurnimaDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Helper function to calculate next Amavasya (new moon)
const getNextAmavasya = () => {
  const now = new Date();
  // Amavasya is on 30th day of lunar month
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  let daysToNextAmavasya = 0;
  if (lunarDay <= 30) {
    daysToNextAmavasya = 30 - lunarDay;
  } else {
    daysToNextAmavasya = 30 - lunarDay + 30;
  }
  
  const nextAmavasyaDate = new Date(now.getTime() + daysToNextAmavasya * 24 * 60 * 60 * 1000);
  return nextAmavasyaDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Function to get fallback data with timezone
const getFallbackPanchangData = (timezone: string = 'Asia/Kolkata') => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Calculate sun times based on location (default to India coordinates)
  const sunTimes = calculateSunTimes(28.6139, 77.209, today);
  const tomorrowSunTimes = calculateSunTimes(28.6139, 77.209, tomorrow);
  
  return {
    today: {
      date: getCurrentDate(timezone),
      vasara: getCurrentDay(timezone),
      tithi: 'Shukla Ashtami (till 2:45 PM), Shukla Navami (from 2:46 PM)',
      nakshatra: 'Swati (till 5:32 PM), Vishakha (from 5:33 PM)',
      raashi: 'Tula (till 11:11 AM), Vrishchika (from 11:12 AM)',
      sunrise: sunTimes.sunrise,
      sunset: sunTimes.sunset,
      amruthaKalam: '9:15 AM – 10:55 AM',
      rahuKalam: '7:21 AM – 8:59 AM',
      yamaGandam: '11:34 AM – 1:12 PM',
      varjyam: '2:05 PM – 3:45 PM',
      durmuhurtham: '12:15 PM – 1:07 PM',
      pradosham: '7:15 PM – 8:15 PM',
      aayana: 'Dakshinayana'
    },
    tomorrow: {
      date: formatDateInTimezone(tomorrow, timezone),
      vasara: getCurrentDayInTimezone(timezone),
      tithi: 'Shukla Navami (till 1:23 PM), Shukla Dashami (from 1:24 PM)',
      nakshatra: 'Vishakha (till 3:45 PM), Anuradha (from 3:46 PM)',
      raashi: 'Vrishchika (till 9:32 AM), Dhanu (from 9:33 AM)',
      sunrise: tomorrowSunTimes.sunrise,
      sunset: tomorrowSunTimes.sunset,
      amruthaKalam: '9:16 AM – 10:56 AM',
      rahuKalam: '7:22 AM – 9:00 AM',
      yamaGandam: '11:35 AM – 1:13 PM',
      varjyam: '2:06 PM – 3:46 PM',
      durmuhurtham: '12:16 PM – 1:08 PM',
      pradosham: '7:16 PM – 8:16 PM',
      aayana: 'Dakshinayana'
    }
  };
};

// Tithi information for specific queries
const TITHI_DATA = {
  'ekadashi': {
    description: 'Ekadashi is the eleventh lunar day of the waxing and waning moon. It is considered highly auspicious for fasting and spiritual practices.',
    nextOccurrence: getNextEkadashi(),
    timings: '6:00 AM to 6:00 AM next day',
    significance: 'Fasting on Ekadashi helps purify the mind and body, and is believed to bring spiritual benefits.'
  },
  'purnima': {
    description: 'Purnima is the full moon day, the fifteenth lunar day. It marks the completion of the waxing phase of the moon.',
    nextOccurrence: getNextPurnima(),
    timings: 'Full day',
    significance: 'Purnima is ideal for meditation, charity, and spiritual practices. Many festivals fall on Purnima.'
  },
  'amavasya': {
    description: 'Amavasya is the new moon day, when the moon is not visible. It marks the beginning of the waxing phase.',
    nextOccurrence: getNextAmavasya(),
    timings: 'Full day',
    significance: 'Amavasya is considered auspicious for ancestral rituals and spiritual practices.'
  }
};

// Nakshatra information
const NAKSHATRA_DATA = {
  'ashwini': {
    description: 'Ashwini is the first nakshatra, ruled by Ketu. It represents the head of the cosmic horse.',
    qualities: 'Quick, energetic, healing abilities',
    deity: 'Ashwini Kumaras',
    element: 'Fire'
  },
  'bharani': {
    description: 'Bharani is the second nakshatra, ruled by Venus. It represents the yoni or female reproductive organ.',
    qualities: 'Creative, sensual, artistic',
    deity: 'Yama',
    element: 'Earth'
  },
  'krittika': {
    description: 'Krittika is the third nakshatra, ruled by Sun. It represents the razor or cutting edge.',
    qualities: 'Sharp, analytical, leadership',
    deity: 'Agni',
    element: 'Fire'
  }
};

export interface PanchangDetailedData {
  date: string;
  vasara: string;
  tithi: string;
  nakshatra: string;
  raashi: string;
  sunrise: string;
  sunset: string;
  amruthaKalam: string;
  rahuKalam: string;
  yamaGandam: string;
  varjyam: string;
  durmuhurtham: string;
  pradosham: string;
  aayana: string;
}

export class PanchangDetailedAPI {
  private useFallback: boolean = false;

  constructor() {
    console.log('🕉️ PanchangDetailedAPI initialized - Using Perplexity AI with fallback');
  }

  /**
   * Parse user query to extract key information
   */
  private parseUserQuery(query: string): {
    date?: string;
    tithi?: string;
    nakshatra?: string;
    isSpecificQuery: boolean;
  } {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific tithi queries
    const tithiKeywords = ['ekadashi', 'purnima', 'amavasya', 'chaturthi', 'ashtami', 'navami', 'dashami'];
    const foundTithi = tithiKeywords.find(tithi => lowerQuery.includes(tithi));
    
    // Check for specific nakshatra queries
    const nakshatraKeywords = ['ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha', 'magha', 'purva phalguni', 'uttara phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyestha', 'mula', 'purva ashadha', 'uttara ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purva bhadrapada', 'uttara bhadrapada', 'revati'];
    const foundNakshatra = nakshatraKeywords.find(nakshatra => lowerQuery.includes(nakshatra));
    
    // Check for date keywords
    const dateKeywords = ['today', 'tomorrow', 'yesterday', 'next week'];
    const hasDateKeyword = dateKeywords.some(keyword => lowerQuery.includes(keyword));
    
    return {
      tithi: foundTithi,
      nakshatra: foundNakshatra,
      isSpecificQuery: !!(foundTithi || foundNakshatra || hasDateKeyword)
    };
  }

  /**
   * Format time for display
   */
  private formatTime(time: string): string {
    return time;
  }

  /**
   * Format date for display
   */
  private formatDate(date: string): string {
    return date;
  }

  /**
   * Generate spoken summary for voice output
   */
  private generateSpokenSummary(data: PanchangDetailedData): string {
    let summary = `Today is ${data.vasara}, ${data.date}. The current tithi is ${data.tithi}. `;
    
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
   * Generate spoken summary from content (for web scraper responses)
   */
  private generateSpokenSummaryFromContent(content: string): string {
    // Extract key information from markdown content
    const lines = content.split('\n');
    let summary = '';
    
    for (const line of lines) {
      if (line.includes('**Tithi:**')) {
        const tithiMatch = line.match(/\*\*Tithi:\*\*\s*(.+)/);
        if (tithiMatch) {
          summary += `Today's tithi is ${tithiMatch[1]}. `;
        }
      } else if (line.includes('**Nakshatra:**')) {
        const nakshatraMatch = line.match(/\*\*Nakshatra:\*\*\s*(.+)/);
        if (nakshatraMatch) {
          summary += `The nakshatra is ${nakshatraMatch[1]}. `;
        }
      } else if (line.includes('**Sunrise:**')) {
        const sunriseMatch = line.match(/\*\*Sunrise:\*\*\s*(.+)/);
        if (sunriseMatch) {
          summary += `Sunrise is at ${sunriseMatch[1]}. `;
        }
      } else if (line.includes('**Sunset:**')) {
        const sunsetMatch = line.match(/\*\*Sunset:\*\*\s*(.+)/);
        if (sunsetMatch) {
          summary += `Sunset is at ${sunsetMatch[1]}. `;
        }
      }
    }
    
    if (!summary) {
      // Fallback summary
      summary = `Here is the Panchang information you requested. Please check the detailed display for complete information.`;
    }
    
    return summary;
  }

  /**
   * Get fallback data based on query and location
   */
  private getFallbackData(query: string, location?: { latitude: number; longitude: number }): PanchangDetailedData {
    const lowerQuery = query.toLowerCase();
    
    // Determine timezone from location
    const timezone = location ? getTimezoneFromCoordinatesFallback(location.latitude, location.longitude) : 'Asia/Kolkata';
    const fallbackData = getFallbackPanchangData(timezone);
    
    // Check for tomorrow
    if (lowerQuery.includes('tomorrow')) {
      return fallbackData.tomorrow;
    }
    
    // Default to today
    return fallbackData.today;
  }

  /**
   * Get specific tithi information
   */
  private getTithiInfo(tithiName: string): string {
    const tithi = TITHI_DATA[tithiName.toLowerCase() as keyof typeof TITHI_DATA];
    if (tithi) {
      return `**${tithiName.toUpperCase()} Information:**

**Description:** ${tithi.description}

**Next Occurrence:** ${tithi.nextOccurrence}

**Timings:** ${tithi.timings}

**Significance:** ${tithi.significance}

**Spiritual Practice:** Fasting and meditation are highly recommended on this day.`;
    }
    return `Information about ${tithiName} is not available in the current database.`;
  }

  /**
   * Get specific nakshatra information
   */
  private getNakshatraInfo(nakshatraName: string): string {
    const nakshatra = NAKSHATRA_DATA[nakshatraName.toLowerCase() as keyof typeof NAKSHATRA_DATA];
    if (nakshatra) {
      return `**${nakshatraName.toUpperCase()} Nakshatra Information:**

**Description:** ${nakshatra.description}

**Qualities:** ${nakshatra.qualities}

**Deity:** ${nakshatra.deity}

**Element:** ${nakshatra.element}

**Spiritual Significance:** This nakshatra is ideal for spiritual practices and meditation.`;
    }
    return `Information about ${nakshatraName} nakshatra is not available in the current database.`;
  }

  /**
   * Fetch detailed Panchang data
   */
  async getDetailedPanchang(
    query: string,
    location?: { latitude: number; longitude: number }
  ): Promise<{
    tableData: string;
    spokenSummary: string;
    source: string;
  }> {
    try {
      console.log('🕉️ Fetching Panchang data for query:', query);
      
      // First try Perplexity API
      try {
        const response = await perplexityAPI.generateText(query, {
          model: 'sonar-pro',
          maxTokens: 1500,
          temperature: 0.3,
          systemPrompt: `You are an expert Vedic astrologer and Panchang specialist. Provide accurate, detailed Panchang information in a structured format. Always include specific timings and dates. Respond with comprehensive Panchang data including all traditional elements like tithi, nakshatra, auspicious/inauspicious timings, etc.`
        });

        if (response && response.length > 0) {
          console.log('✅ Perplexity API response received');
          const parsedData = this.parsePerplexityResponse(response);
          const tableData = this.formatPanchangData(parsedData);
          const spokenSummary = this.generateSpokenSummary(parsedData);
          
          return {
            tableData,
            spokenSummary,
            source: 'Perplexity AI'
          };
        }
      } catch (perplexityError) {
        console.log('⚠️ Perplexity API failed, trying web scraper:', perplexityError);
        
        // Try web scraper as second option
        try {
          const scrapedResponse = await perplexityWebScraper.scrapeFromPerplexity(query);
          if (scrapedResponse.success) {
            console.log('✅ Web scraper response received');
            return {
              tableData: scrapedResponse.content,
              spokenSummary: this.generateSpokenSummaryFromContent(scrapedResponse.content),
              source: scrapedResponse.source
            };
          }
        } catch (scraperError) {
          console.log('⚠️ Web scraper also failed:', scraperError);
        }
        
        this.useFallback = true;
      }

      // Fallback to local data
      console.log('🔄 Using fallback data system');
      const parsedQuery = this.parseUserQuery(query);
      
      if (parsedQuery.tithi) {
        const tithiInfo = this.getTithiInfo(parsedQuery.tithi);
        return {
          tableData: tithiInfo,
          spokenSummary: `Here is information about ${parsedQuery.tithi}. ${TITHI_DATA[parsedQuery.tithi.toLowerCase() as keyof typeof TITHI_DATA]?.description}`,
          source: 'Local Database (Fallback)'
        };
      }
      
      if (parsedQuery.nakshatra) {
        const nakshatraInfo = this.getNakshatraInfo(parsedQuery.nakshatra);
        return {
          tableData: nakshatraInfo,
          spokenSummary: `Here is information about ${parsedQuery.nakshatra} nakshatra. ${NAKSHATRA_DATA[parsedQuery.nakshatra.toLowerCase() as keyof typeof NAKSHATRA_DATA]?.description}`,
          source: 'Local Database (Fallback)'
        };
      }

      // Default fallback data
      const fallbackData = this.getFallbackData(query, location);
      const tableData = this.formatPanchangData(fallbackData);
      const spokenSummary = this.generateSpokenSummary(fallbackData);
      
      return {
        tableData,
        spokenSummary,
        source: 'Local Database (Fallback)'
      };

    } catch (error) {
      console.error('❌ Error in getDetailedPanchang:', error);
      
      // Ultimate fallback
      const fallbackData = this.getFallbackData(query, location);
      const tableData = this.formatPanchangData(fallbackData);
      const spokenSummary = this.generateSpokenSummary(fallbackData);
      
      return {
        tableData,
        spokenSummary,
        source: 'Emergency Fallback'
      };
    }
  }

  /**
   * Parse Perplexity response
   */
  private parsePerplexityResponse(response: string): PanchangDetailedData {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.date && parsed.tithi) {
          return parsed as PanchangDetailedData;
        }
      }
    } catch (error) {
      console.log('JSON parsing failed, using regex extraction');
    }

    // Fallback to regex extraction
    const data: Partial<PanchangDetailedData> = {};
    
    // Extract date
    const dateMatch = response.match(/Date[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{2})/i);
    if (dateMatch) data.date = dateMatch[1];
    
    // Extract vasara
    const vasaraMatch = response.match(/Vasara[:\s]*([A-Za-z]+)/i);
    if (vasaraMatch) data.vasara = vasaraMatch[1];
    
    // Extract tithi
    const tithiMatch = response.match(/Tithi[:\s]*([^,\n]+)/i);
    if (tithiMatch) data.tithi = tithiMatch[1].trim();
    
    // Extract nakshatra
    const nakshatraMatch = response.match(/Nakshatra[:\s]*([^,\n]+)/i);
    if (nakshatraMatch) data.nakshatra = nakshatraMatch[1].trim();
    
    // Extract sunrise/sunset
    const sunriseMatch = response.match(/Sunrise[:\s]*([0-9:]+ [AP]M)/i);
    if (sunriseMatch) data.sunrise = sunriseMatch[1];
    
    const sunsetMatch = response.match(/Sunset[:\s]*([0-9:]+ [AP]M)/i);
    if (sunsetMatch) data.sunset = sunsetMatch[1];
    
    // Fill in defaults for missing fields
    return {
      date: data.date || getCurrentDate(),
      vasara: data.vasara || getCurrentDay(),
      tithi: data.tithi || 'Shukla Ashtami',
      nakshatra: data.nakshatra || 'Swati',
      raashi: data.raashi || 'Tula',
      sunrise: data.sunrise || '6:02 AM',
      sunset: data.sunset || '8:18 PM',
      amruthaKalam: data.amruthaKalam || '9:15 AM – 10:55 AM',
      rahuKalam: data.rahuKalam || '7:21 AM – 8:59 AM',
      yamaGandam: data.yamaGandam || '11:34 AM – 1:12 PM',
      varjyam: data.varjyam || '2:05 PM – 3:45 PM',
      durmuhurtham: data.durmuhurtham || '12:15 PM – 1:07 PM',
      pradosham: data.pradosham || '7:15 PM – 8:15 PM',
      aayana: data.aayana || 'Dakshinayana'
    };
  }

  /**
   * Format Panchang data as markdown table
   */
  private formatPanchangData(data: PanchangDetailedData): string {
    return `# Panchang Information

| Field | Value(s) |
|-------|----------|
| **Date** | ${data.date} |
| **Vasara** | ${data.vasara} |
| **Tithi** | ${data.tithi} |
| **Nakshatra** | ${data.nakshatra} |
| **Raashi** | ${data.raashi} |
| **Sunrise** | ${data.sunrise} |
| **Sunset** | ${data.sunset} |
| **Amrutha Kalam** | ${data.amruthaKalam} |
| **Rahu Kalam** | ${data.rahuKalam} |
| **Yama Gandam** | ${data.yamaGandam} |
| **Varjyam** | ${data.varjyam} |
| **Durmuhurtham** | ${data.durmuhurtham} |
| **Pradosham** | ${data.pradosham} |
| **Aayana** | ${data.aayana} |

## Auspicious Timings
- **Amrutha Kalam:** ${data.amruthaKalam} - Best time for spiritual practices
- **Sunrise:** ${data.sunrise} - Ideal time for morning prayers

## Inauspicious Timings
- **Rahu Kalam:** ${data.rahuKalam} - Avoid important activities
- **Yama Gandam:** ${data.yamaGandam} - Avoid new ventures
- **Varjyam:** ${data.varjyam} - Avoid auspicious ceremonies

## Spiritual Recommendations
- Perform morning prayers during sunrise
- Meditate during Amrutha Kalam
- Avoid important decisions during Rahu Kalam
- Practice charity and spiritual activities`;
  }

  /**
   * Get next occurrence of a specific tithi or nakshatra
   */
  async getNextOccurrence(query: string): Promise<string> {
    // This would typically call an external API
    // For now, return a placeholder
    return `Next occurrence information for "${query}" will be available soon.`;
  }
}

export const panchangDetailedAPI = new PanchangDetailedAPI(); 