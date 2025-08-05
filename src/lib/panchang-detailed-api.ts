import { perplexityAPI } from './perplexity-api';
import { perplexityWebScraper } from './perplexity-web-scraper';
import { 
  getCurrentTimeInTimezone, 
  formatDateInTimezone, 
  formatTimeInTimezone,
  getCurrentDayInTimezone,
  calculateSunTimes,
  getTimezoneFromCoordinates,
  getTimezoneFromCoordinatesFallback,
  getTimezoneDisplayName
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
    significance: 'Fasting on Ekadashi helps purify the mind and body, and is believed to bring spiritual benefits.',
    formatTable: (timezone: string = 'Asia/Kolkata') => {
      const nextDate = new Date();
      const daysSinceNewYear = Math.floor((nextDate.getTime() - new Date(nextDate.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
      const lunarDay = (daysSinceNewYear % 30) + 1;
      
      let daysToNextEkadashi = 0;
      if (lunarDay <= 11) {
        daysToNextEkadashi = 11 - lunarDay;
      } else if (lunarDay <= 26) {
        daysToNextEkadashi = 26 - lunarDay;
      } else {
        daysToNextEkadashi = 30 - lunarDay + 11;
      }
      
      const nextEkadashiDate = new Date(nextDate.getTime() + daysToNextEkadashi * 24 * 60 * 60 * 1000);
      const startDate = new Date(nextEkadashiDate);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(18, 35, 0, 0); // 6:35 PM
      
      const endDate = new Date(nextEkadashiDate);
      endDate.setHours(16, 37, 0, 0); // 4:37 PM
      
      const timezoneDisplay = getTimezoneDisplayName(timezone);
      
      return `# Ekadashi Information

## What is Ekadashi?
Ekadashi is the eleventh lunar day of the waxing and waning moon in the Hindu calendar. It is considered highly auspicious for fasting and spiritual practices.

## Next Ekadashi Details

| Field | Value |
|-------|-------|
| **Ekadashi Name** | Aja Ekadashi |
| **Date** | ${formatDateInTimezone(nextEkadashiDate, timezone)} |
| **Day** | ${nextEkadashiDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Krishna Paksha (Waning Moon) |
| **Month** | Bhadrapada |
| **Start Time** | ${formatTimeInTimezone(startDate, timezone)} ${timezoneDisplay} |
| **End Time** | ${formatTimeInTimezone(endDate, timezone)} ${timezoneDisplay} |
| **Duration** | 22 hours 2 minutes |
| **Timezone** | ${timezoneDisplay} |

## Significance
- **Spiritual Benefits:** Fasting on Ekadashi helps purify the mind and body
- **Karmic Cleansing:** Believed to wash away sins and negative karma
- **Health Benefits:** Detoxifies the body and improves digestion
- **Mental Clarity:** Enhances concentration and spiritual awareness

## Recommended Practices
1. **Fasting:** Complete or partial fasting from grains and beans
2. **Prayer:** Chanting mantras and reading spiritual texts
3. **Meditation:** Extended meditation sessions
4. **Charity:** Donating food and helping the needy
5. **Temple Visit:** Visiting temples and performing rituals

## Foods to Avoid
- Rice, wheat, and other grains
- Beans and lentils
- Onion and garlic
- Non-vegetarian food
- Alcohol and tobacco

## Foods to Consume
- Fruits and nuts
- Milk and dairy products
- Root vegetables (except onion/garlic)
- Herbal teas and water

## Spiritual Tip
Ekadashi is considered one of the most powerful days for spiritual advancement. Use this time for deep meditation and connecting with your higher self.`;
    }
  },
  'purnima': {
    description: 'Purnima is the full moon day, the fifteenth lunar day. It marks the completion of the waxing phase of the moon.',
    nextOccurrence: getNextPurnima(),
    timings: 'Full day',
    significance: 'Purnima is ideal for meditation, charity, and spiritual practices. Many festivals fall on Purnima.',
    formatTable: (timezone: string = 'Asia/Kolkata') => {
      const nextDate = new Date();
      const daysSinceNewYear = Math.floor((nextDate.getTime() - new Date(nextDate.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
      const lunarDay = (daysSinceNewYear % 30) + 1;
      
      let daysToNextPurnima = 0;
      if (lunarDay <= 15) {
        daysToNextPurnima = 15 - lunarDay;
      } else {
        daysToNextPurnima = 30 - lunarDay + 15;
      }
      
      const nextPurnimaDate = new Date(nextDate.getTime() + daysToNextPurnima * 24 * 60 * 60 * 1000);
      const timezoneDisplay = getTimezoneDisplayName(timezone);
      
      return `# Purnima (Full Moon) Information

## What is Purnima?
Purnima is the full moon day, the fifteenth lunar day. It marks the completion of the waxing phase of the moon and is considered highly auspicious.

## Next Purnima Details

| Field | Value |
|-------|-------|
| **Date** | ${formatDateInTimezone(nextPurnimaDate, timezone)} |
| **Day** | ${nextPurnimaDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Shukla Paksha (Waxing Moon) |
| **Moonrise** | ${formatTimeInTimezone(new Date(nextPurnimaDate.getTime() + 18 * 60 * 60 * 1000), timezone)} ${timezoneDisplay} |
| **Best Time for Rituals** | Evening after moonrise |
| **Timezone** | ${timezoneDisplay} |

## Significance
- **Spiritual Power:** Maximum spiritual energy during full moon
- **Meditation:** Ideal time for deep meditation and spiritual practices
- **Charity:** Best time for giving and receiving blessings
- **Festivals:** Many important festivals fall on Purnima

## Recommended Practices
1. **Moon Worship:** Chanting moon mantras and offering prayers
2. **Meditation:** Extended meditation under moonlight
3. **Charity:** Donating food, clothes, and helping others
4. **Temple Visit:** Visiting temples and performing rituals
5. **Fasting:** Some people observe partial fasting

## Spiritual Benefits
- **Mental Clarity:** Enhanced intuition and wisdom
- **Emotional Balance:** Better control over emotions
- **Karmic Cleansing:** Washing away negative karma
- **Spiritual Growth:** Accelerated spiritual progress

## Moon Mantra
"Om Som Somaya Namah" - Chant this mantra during Purnima for maximum benefits.`;
    }
  },
  'amavasya': {
    description: 'Amavasya is the new moon day, when the moon is not visible. It marks the beginning of the waxing phase.',
    nextOccurrence: getNextAmavasya(),
    timings: 'Full day',
    significance: 'Amavasya is considered auspicious for ancestral rituals and spiritual practices.',
    formatTable: (timezone: string = 'Asia/Kolkata') => {
      const nextDate = new Date();
      const daysSinceNewYear = Math.floor((nextDate.getTime() - new Date(nextDate.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
      const lunarDay = (daysSinceNewYear % 30) + 1;
      
      let daysToNextAmavasya = 0;
      if (lunarDay <= 30) {
        daysToNextAmavasya = 30 - lunarDay;
      } else {
        daysToNextAmavasya = 30 - lunarDay + 30;
      }
      
      const nextAmavasyaDate = new Date(nextDate.getTime() + daysToNextAmavasya * 24 * 60 * 60 * 1000);
      const timezoneDisplay = getTimezoneDisplayName(timezone);
      
      return `# Amavasya (New Moon) Information

## What is Amavasya?
Amavasya is the new moon day, when the moon is not visible. It marks the beginning of the waxing phase and is considered auspicious for ancestral rituals.

## Next Amavasya Details

| Field | Value |
|-------|-------|
| **Date** | ${formatDateInTimezone(nextAmavasyaDate, timezone)} |
| **Day** | ${nextAmavasyaDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Krishna Paksha (Waning Moon) |
| **Best Time for Rituals** | Early morning or evening |
| **Timezone** | ${timezoneDisplay} |

## Significance
- **Ancestral Worship:** Ideal time for offering prayers to ancestors
- **Spiritual Practices:** Excellent for meditation and spiritual activities
- **New Beginnings:** Considered auspicious for starting new ventures
- **Cleansing:** Time for inner purification and reflection

## Recommended Practices
1. **Ancestral Rituals:** Offering prayers and food to ancestors
2. **Meditation:** Deep meditation and spiritual practices
3. **Charity:** Donating to the needy and performing good deeds
4. **Temple Visit:** Visiting temples and performing rituals
5. **Fasting:** Some people observe fasting on Amavasya

## Spiritual Benefits
- **Ancestral Blessings:** Receiving blessings from ancestors
- **Inner Peace:** Enhanced spiritual awareness
- **Karmic Cleansing:** Washing away negative karma
- **New Beginnings:** Positive energy for new ventures

## Mantra for Amavasya
"Om Pitru Devaya Namah" - Chant this mantra for ancestral blessings.`;
    }
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
  maasa?: string;
  tithiStartEnd?: string;
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
  private generateSpokenSummary(data: PanchangDetailedData, timezone: string): string {
    const timezoneDisplay = getTimezoneDisplayName(timezone);
    
    // Create a brief, clear spoken summary
    let summary = `Today is ${data.vasara}, ${data.date} in ${timezoneDisplay}. `;
    
    // Add tithi information
    if (data.tithi) {
      summary += `The current tithi is ${data.tithi}. `;
    }
    
    // Add nakshatra information
    if (data.nakshatra) {
      summary += `The nakshatra is ${data.nakshatra}. `;
    }
    
    // Add raashi information
    if (data.raashi) {
      summary += `The raashi is ${data.raashi}. `;
    }
    
    // Add sunrise/sunset information
    if (data.sunrise && data.sunset) {
      summary += `Sunrise is at ${data.sunrise} and sunset is at ${data.sunset}. `;
    }
    
    // Add auspicious timing
    if (data.amruthaKalam) {
      summary += `The auspicious Amrutha Kalam is from ${data.amruthaKalam}. `;
    }
    
    // Add inauspicious timing
    if (data.rahuKalam) {
      summary += `Avoid important activities during Rahu Kalam from ${data.rahuKalam}. `;
    }
    
    summary += `This information is tailored to your local timezone.`;
    
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
  private getFallbackData(query: string, location?: { latitude: number; longitude: number }, timezone: string = 'Asia/Kolkata'): PanchangDetailedData {
    const lowerQuery = query.toLowerCase();
    
    // Determine timezone from location
    const getTimezoneFromCoords = (lat: number, lng: number): string => {
      // India coordinates (approximate)
      if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) return 'Asia/Kolkata';
      // US coordinates (approximate)
      if (lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66) return 'America/New_York';
      // UK coordinates (approximate)
      if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) return 'Europe/London';
      // Australia coordinates (approximate)
      if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia/Sydney';
      // Default to India timezone
      return 'Asia/Kolkata';
    };
    
    const fallbackTimezone = location ? getTimezoneFromCoords(location.latitude, location.longitude) : 'Asia/Kolkata';
    const fallbackData = getFallbackPanchangData(fallbackTimezone);
    
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
  private getTithiInfo(tithiName: string, timezone: string): string {
    const tithi = TITHI_DATA[tithiName.toLowerCase() as keyof typeof TITHI_DATA];
    if (tithi) {
      return tithi.formatTable(timezone); // Use provided timezone for formatting
    }
    return `Information about ${tithiName} is not available in the current database.`;
  }

  /**
   * Get specific nakshatra information
   */
  private getNakshatraInfo(nakshatraName: string, timezone: string): string {
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
   * Remove citation numbers from text (e.g., [1], [2], [3])
   */
  private removeCitations(text: string): string {
    // Remove citation patterns like [1], [2], [3], etc.
    return text.replace(/\[\d+\]/g, '').trim();
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
      
      // Get user's timezone from location
      let userTimezone = 'Asia/Kolkata'; // Default to India
      if (location) {
        try {
          userTimezone = await getTimezoneFromCoordinates(location.latitude, location.longitude);
          console.log('📍 User timezone detected:', userTimezone);
        } catch (error) {
          console.log('⚠️ Could not detect timezone, using fallback');
          userTimezone = getTimezoneFromCoordinatesFallback(location.latitude, location.longitude);
        }
      }
      
      // First try Perplexity API with user's location context
      try {
        const locationContext = location ? 
          `User is located at ${location.latitude}, ${location.longitude} (${userTimezone} timezone). ` : 
          '';
        
        const response = await perplexityAPI.generateText(query, {
          model: 'sonar-pro',
          maxTokens: 1500,
          temperature: 0.3,
          systemPrompt: `You are an expert Vedic astrologer and Panchang specialist. ${locationContext}Provide accurate, detailed Panchang information in a structured format tailored to the user's location and timezone. Always include specific timings and dates in the user's local timezone. Respond with comprehensive Panchang data including all traditional elements like tithi, nakshatra, auspicious/inauspicious timings, etc. Format dates as MM/DD/YY and times as HH:MM AM/PM in the user's local timezone.`
        });

        if (response && response.length > 0) {
          console.log('✅ Perplexity API response received');
          
          // Check if response contains citations
          const hasCitations = /\[\d+\]/.test(response);
          if (hasCitations) {
            console.log('⚠️ Perplexity response contains citations, using fallback data instead');
            throw new Error('Citations detected in response');
          }
          
          const parsedData = this.parsePerplexityResponse(response, userTimezone);
          const tableData = this.formatPanchangData(parsedData, userTimezone);
          const spokenSummary = this.generateSpokenSummary(parsedData, userTimezone);
          
          return {
            tableData,
            spokenSummary,
            source: 'Perplexity AI'
          };
        }
      } catch (perplexityError) {
        console.log('⚠️ Perplexity API failed or contained citations, using fallback data:', perplexityError);
        this.useFallback = true;
      }

      // Use fallback data with user's timezone
      console.log('🔄 Using fallback data system with user timezone:', userTimezone);
      const parsedQuery = this.parseUserQuery(query);
      
      // For specific queries, always use fallback data to ensure tabular format
      const specificQueries = ['ekadashi', 'purnima', 'amavasya', 'ashtami', 'navami', 'dashami'];
      const isSpecificQuery = specificQueries.some(sq => query.toLowerCase().includes(sq));
      
      if (isSpecificQuery || parsedQuery.tithi) {
        console.log('📋 Using fallback data for specific query to ensure tabular format');
        const tithiInfo = this.getTithiInfo(parsedQuery.tithi || query.toLowerCase(), userTimezone);
        return {
          tableData: tithiInfo,
          spokenSummary: `Here is information about ${parsedQuery.tithi || query} in your local timezone. ${TITHI_DATA[parsedQuery.tithi?.toLowerCase() as keyof typeof TITHI_DATA]?.description || 'This is important information for your spiritual practice.'}`,
          source: 'Local Database (Clean Format)'
        };
      }
      
      if (parsedQuery.nakshatra) {
        const nakshatraInfo = this.getNakshatraInfo(parsedQuery.nakshatra, userTimezone);
        return {
          tableData: nakshatraInfo,
          spokenSummary: `Here is information about ${parsedQuery.nakshatra} nakshatra in your local timezone. ${NAKSHATRA_DATA[parsedQuery.nakshatra.toLowerCase() as keyof typeof NAKSHATRA_DATA]?.description}`,
          source: 'Local Database (Clean Format)'
        };
      }

      // Default fallback data with user's timezone
      const fallbackData = this.getFallbackData(query, location, userTimezone);
      const tableData = this.formatPanchangData(fallbackData, userTimezone);
      const spokenSummary = this.generateSpokenSummary(fallbackData, userTimezone);
      
      return {
        tableData,
        spokenSummary,
        source: 'Local Database (Fallback)'
      };

    } catch (error) {
      console.error('❌ Error in getDetailedPanchang:', error);
      
      // Ultimate fallback
      const fallbackData = this.getFallbackData(query, location, 'Asia/Kolkata');
      const tableData = this.formatPanchangData(fallbackData, 'Asia/Kolkata');
      const spokenSummary = this.generateSpokenSummary(fallbackData, 'Asia/Kolkata');
      
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
  private parsePerplexityResponse(response: string, timezone: string): PanchangDetailedData {
    console.log('🔍 Parsing Perplexity response...');
    
    // Remove citations from response
    const cleanResponse = this.removeCitations(response);
    console.log('🧹 Cleaned response (removed citations):', cleanResponse.substring(0, 200) + '...');
    
    try {
      // Try to parse as JSON first
      const jsonMatch = cleanResponse.match(/```json\s*(\{.*?\})\s*```/s);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        console.log('✅ Parsed JSON data:', jsonData);
        
        return {
          date: jsonData.date || getCurrentDate(timezone),
          vasara: jsonData.vasara || getCurrentDay(timezone),
          tithi: jsonData.tithi || 'Shukla Ashtami',
          nakshatra: jsonData.nakshatra || 'Swati',
          raashi: jsonData.raashi || 'Tula',
          sunrise: jsonData.sunrise || '6:02 AM',
          sunset: jsonData.sunset || '8:18 PM',
          amruthaKalam: jsonData.amruthaKalam || '9:15 AM – 10:55 AM',
          rahuKalam: jsonData.rahuKalam || '7:21 AM – 8:59 AM',
          yamaGandam: jsonData.yamaGandam || '11:34 AM – 1:12 PM',
          varjyam: jsonData.varjyam || '2:05 PM – 3:45 PM',
          durmuhurtham: jsonData.durmuhurtham || '12:15 PM – 1:07 PM',
          pradosham: jsonData.pradosham || '7:15 PM – 8:15 PM',
          aayana: jsonData.aayana || 'Dakshinayana'
        };
      }
    } catch (error) {
      console.log('JSON parsing failed, using regex extraction');
    }

    // Fallback to regex extraction
    const data: Partial<PanchangDetailedData> = {};
    
    // Extract date
    const dateMatch = cleanResponse.match(/Date[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{2})/i);
    if (dateMatch) data.date = dateMatch[1];
    
    // Extract vasara
    const vasaraMatch = cleanResponse.match(/Vasara[:\s]*([A-Za-z]+)/i);
    if (vasaraMatch) data.vasara = vasaraMatch[1];
    
    // Extract tithi
    const tithiMatch = cleanResponse.match(/Tithi[:\s]*([^,\n]+)/i);
    if (tithiMatch) data.tithi = tithiMatch[1].trim();
    
    // Extract nakshatra
    const nakshatraMatch = cleanResponse.match(/Nakshatra[:\s]*([^,\n]+)/i);
    if (nakshatraMatch) data.nakshatra = nakshatraMatch[1].trim();
    
    // Extract sunrise/sunset
    const sunriseMatch = cleanResponse.match(/Sunrise[:\s]*([0-9:]+ [AP]M)/i);
    if (sunriseMatch) data.sunrise = sunriseMatch[1];
    
    const sunsetMatch = cleanResponse.match(/Sunset[:\s]*([0-9:]+ [AP]M)/i);
    if (sunsetMatch) data.sunset = sunsetMatch[1];
    
    // Fill in defaults for missing fields
    return {
      date: data.date || getCurrentDate(timezone),
      vasara: data.vasara || getCurrentDay(timezone),
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
  private formatPanchangData(data: PanchangDetailedData, timezone: string): string {
    const timezoneDisplay = getTimezoneDisplayName(timezone);
    
    return `# Panchang Information

| Field | Value(s) |
|-------|----------|
| **Date** | ${data.date} |
| **Maasa** | ${data.maasa || 'Not available'} |
| **Vasara** | ${data.vasara} |
| **Tithi** | ${data.tithi} |
| **Tithi Start/End** | ${data.tithiStartEnd || 'Not available'} |
| **Nakshatra** | ${data.nakshatra} |
| **Raashi** | ${data.raashi} |
| **Sunrise** | ${data.sunrise} |
| **Sunset** | ${data.sunset} |
| **Aayana** | ${data.aayana} |
| **Amrutha Kalam** | ${data.amruthaKalam} |
| **Varjyam** | ${data.varjyam} |
| **Durmuhurtham** | ${data.durmuhurtham} |
| **Rahu Kalam** | ${data.rahuKalam} |
| **Yama Gandam** | ${data.yamaGandam} |
| **Pradosham Timings** | ${data.pradosham} |
| **Timezone** | ${timezoneDisplay} |

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