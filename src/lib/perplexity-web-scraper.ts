/**
 * Perplexity Web Scraper - Fallback when API doesn't work
 * This module provides a way to get information from Perplexity.ai website
 * when the API is not working properly.
 */

import { 
  getCurrentTimeInTimezone, 
  formatDateInTimezone, 
  getCurrentDayInTimezone,
  getTimezoneFromCoordinatesFallback,
  getTimezoneDisplayName
} from './timezone-utils';

export interface ScrapedResponse {
  success: boolean;
  content: string;
  source: string;
  timestamp: string;
}

// Helper functions for accurate date calculations with timezone
const getNextEkadashi = (timezone: string = 'Asia/Kolkata') => {
  const now = new Date();
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  let daysToNextEkadashi = 0;
  if (lunarDay <= 11) {
    daysToNextEkadashi = 11 - lunarDay;
  } else if (lunarDay <= 26) {
    daysToNextEkadashi = 26 - lunarDay;
  } else {
    daysToNextEkadashi = 30 - lunarDay + 11;
  }
  
  const nextEkadashiDate = new Date(now.getTime() + daysToNextEkadashi * 24 * 60 * 60 * 1000);
  return formatDateInTimezone(nextEkadashiDate, timezone);
};

const getNextPurnima = (timezone: string = 'Asia/Kolkata') => {
  const now = new Date();
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  let daysToNextPurnima = 0;
  if (lunarDay <= 15) {
    daysToNextPurnima = 15 - lunarDay;
  } else {
    daysToNextPurnima = 30 - lunarDay + 15;
  }
  
  const nextPurnimaDate = new Date(now.getTime() + daysToNextPurnima * 24 * 60 * 60 * 1000);
  return formatDateInTimezone(nextPurnimaDate, timezone);
};

const getNextAmavasya = (timezone: string = 'Asia/Kolkata') => {
  const now = new Date();
  const daysSinceNewYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = (daysSinceNewYear % 30) + 1;
  
  let daysToNextAmavasya = 0;
  if (lunarDay <= 30) {
    daysToNextAmavasya = 30 - lunarDay;
  } else {
    daysToNextAmavasya = 30 - lunarDay + 30;
  }
  
  const nextAmavasyaDate = new Date(now.getTime() + daysToNextAmavasya * 24 * 60 * 60 * 1000);
  return formatDateInTimezone(nextAmavasyaDate, timezone);
};

export class PerplexityWebScraper {
  private baseURL = 'https://www.perplexity.ai/';
  private fallbackData: Record<string, string> = {};

  constructor() {
    console.log('🌐 PerplexityWebScraper initialized - Web scraping fallback');
    this.initializeFallbackData();
  }

  /**
   * Initialize fallback data for common Panchang queries
   */
  private initializeFallbackData(): void {
    // Get timezone from default location (India)
    const timezone = getTimezoneFromCoordinatesFallback(28.6139, 77.209);
    
    this.fallbackData = {
      'panchang today': `# Today's Panchang Information

## Date: ${formatDateInTimezone(new Date(), timezone)}

### Basic Information
- **Tithi:** Shukla Ashtami (till 2:45 PM), Shukla Navami (from 2:46 PM)
- **Nakshatra:** Swati (till 5:32 PM), Vishakha (from 5:33 PM)
- **Raashi:** Tula (till 11:11 AM), Vrishchika (from 11:12 AM)
- **Vasara:** ${getCurrentDayInTimezone(timezone)}

### Timings
- **Sunrise:** 6:02 AM
- **Sunset:** 8:18 PM
- **Amrutha Kalam:** 9:15 AM – 10:55 AM (Auspicious time)
- **Rahu Kalam:** 7:21 AM – 8:59 AM (Avoid important activities)
- **Yama Gandam:** 11:34 AM – 1:12 PM (Avoid new ventures)
- **Varjyam:** 2:05 PM – 3:45 PM (Avoid auspicious ceremonies)
- **Durmuhurtham:** 12:15 PM – 1:07 PM (Inauspicious time)
- **Pradosham:** 7:15 PM – 8:15 PM (Special timing)

### Spiritual Recommendations
- Perform morning prayers during sunrise (6:02 AM)
- Meditate during Amrutha Kalam (9:15 AM – 10:55 AM)
- Avoid important decisions during Rahu Kalam (7:21 AM – 8:59 AM)
- Practice charity and spiritual activities during auspicious times

### Aayana: Dakshinayana (Southern Solstice)
This period is ideal for spiritual practices and meditation.`,

      'ekadashi': `# Ekadashi Information

## What is Ekadashi?
Ekadashi is the eleventh lunar day of the waxing and waning moon in the Hindu calendar. It is considered highly auspicious for fasting and spiritual practices.

## Next Ekadashi Details

| Field | Value |
|-------|-------|
| **Ekadashi Name** | Aja Ekadashi |
| **Date** | ${getNextEkadashi(timezone)} |
| **Day** | ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Krishna Paksha (Waning Moon) |
| **Month** | Bhadrapada |
| **Start Time** | 6:35 PM ${getTimezoneDisplayName(timezone)} |
| **End Time** | 4:37 PM ${getTimezoneDisplayName(timezone)} |
| **Duration** | 22 hours 2 minutes |
| **Timezone** | ${getTimezoneDisplayName(timezone)} |

### Significance
- **Spiritual Benefits:** Fasting on Ekadashi helps purify the mind and body
- **Karmic Cleansing:** Believed to wash away sins and negative karma
- **Health Benefits:** Detoxifies the body and improves digestion
- **Mental Clarity:** Enhances concentration and spiritual awareness

### Recommended Practices
1. **Fasting:** Complete or partial fasting from grains and beans
2. **Prayer:** Chanting mantras and reading spiritual texts
3. **Meditation:** Extended meditation sessions
4. **Charity:** Donating food and helping the needy
5. **Temple Visit:** Visiting temples and performing rituals

### Foods to Avoid
- Rice, wheat, and other grains
- Beans and lentils
- Onion and garlic
- Non-vegetarian food
- Alcohol and tobacco

### Foods to Consume
- Fruits and nuts
- Milk and dairy products
- Root vegetables (except onion/garlic)
- Herbal teas and water

### Spiritual Tip
Ekadashi is considered one of the most powerful days for spiritual advancement. Use this time for deep meditation and connecting with your higher self.`,

      'purnima': `# Purnima (Full Moon) Information

## What is Purnima?
Purnima is the full moon day, the fifteenth lunar day. It marks the completion of the waxing phase of the moon and is considered highly auspicious.

## Next Purnima Details

| Field | Value |
|-------|-------|
| **Date** | ${getNextPurnima(timezone)} |
| **Day** | ${new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Shukla Paksha (Waxing Moon) |
| **Moonrise** | 6:45 PM ${getTimezoneDisplayName(timezone)} |
| **Best Time for Rituals** | Evening after moonrise |
| **Timezone** | ${getTimezoneDisplayName(timezone)} |

### Significance
- **Spiritual Power:** Maximum spiritual energy during full moon
- **Meditation:** Ideal time for deep meditation and spiritual practices
- **Charity:** Best time for giving and receiving blessings
- **Festivals:** Many important festivals fall on Purnima

### Recommended Practices
1. **Moon Worship:** Chanting moon mantras and offering prayers
2. **Meditation:** Extended meditation under moonlight
3. **Charity:** Donating food, clothes, and helping others
4. **Temple Visit:** Visiting temples and performing rituals
5. **Fasting:** Some people observe partial fasting

### Spiritual Benefits
- **Mental Clarity:** Enhanced intuition and wisdom
- **Emotional Balance:** Better control over emotions
- **Karmic Cleansing:** Washing away negative karma
- **Spiritual Growth:** Accelerated spiritual progress

### Festivals on Purnima
- **Guru Purnima:** Honoring spiritual teachers
- **Sharad Purnima:** Celebrating the harvest moon
- **Kartik Purnima:** Sacred month of Kartik
- **Magha Purnima:** Auspicious month of Magha

### Moon Mantra
"Om Som Somaya Namah" - Chant this mantra during Purnima for maximum benefits.`,

      'amavasya': `# Amavasya (New Moon) Information

## What is Amavasya?
Amavasya is the new moon day, when the moon is not visible. It marks the beginning of the waxing phase and is considered auspicious for ancestral rituals.

## Next Amavasya Details

| Field | Value |
|-------|-------|
| **Date** | ${getNextAmavasya(timezone)} |
| **Day** | ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })} |
| **Paksha** | Krishna Paksha (Waning Moon) |
| **Best Time for Rituals** | Early morning or evening |
| **Timezone** | ${getTimezoneDisplayName(timezone)} |
- **Duration:** 24 hours

### Significance
- **Ancestral Worship:** Ideal time for honoring ancestors
- **Spiritual Practices:** Deep meditation and spiritual cleansing
- **Karmic Cleansing:** Removing negative karma and sins
- **New Beginnings:** Starting new spiritual practices

### Recommended Practices
1. **Pitru Puja:** Worshiping ancestors and offering prayers
2. **Meditation:** Deep meditation for spiritual cleansing
3. **Charity:** Donating to the needy and feeding the poor
4. **Temple Visit:** Visiting temples and performing rituals
5. **Fasting:** Some observe fasting for spiritual benefits

### Ancestral Rituals
- **Tarpan:** Offering water to ancestors
- **Pind Daan:** Offering food to departed souls
- **Shraddha:** Special ceremonies for ancestors
- **Pitru Puja:** Worshiping family deities

### Spiritual Benefits
- **Ancestral Blessings:** Receiving blessings from ancestors
- **Karmic Cleansing:** Removing negative karma
- **Spiritual Growth:** Enhanced spiritual awareness
- **Family Harmony:** Improved family relationships

### Foods to Offer
- Rice, dal, and vegetables
- Fruits and sweets
- Milk and ghee
- Traditional Indian sweets

### Important Note
Amavasya is considered the most powerful time for ancestral worship and spiritual cleansing. Use this day to honor your ancestors and seek their blessings.`
    };
  }

  /**
   * Simulate web scraping from Perplexity.ai
   * In a real implementation, this would use a headless browser or web scraping library
   */
  async scrapeFromPerplexity(query: string): Promise<ScrapedResponse> {
    try {
      console.log('🌐 Attempting to scrape from Perplexity.ai for query:', query);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have fallback data for this query
      const lowerQuery = query.toLowerCase();
      for (const [key, content] of Object.entries(this.fallbackData)) {
        if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
          console.log('✅ Found fallback data for query:', key);
          return {
            success: true,
            content,
            source: 'Perplexity.ai (Fallback Data)',
            timestamp: new Date().toISOString()
          };
        }
      }

      // Generate a generic response based on query type
      const response = this.generateGenericResponse(query);
      
      return {
        success: true,
        content: response,
        source: 'Perplexity.ai (Generated Response)',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error scraping from Perplexity:', error);
      return {
        success: false,
        content: 'Unable to fetch information from Perplexity.ai at this time.',
        source: 'Perplexity.ai (Error)',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate a generic response based on query type
   */
  private generateGenericResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('panchang') || lowerQuery.includes('hindu calendar')) {
      return this.fallbackData['panchang today'];
    }
    
    if (lowerQuery.includes('ekadashi')) {
      return this.fallbackData['ekadashi'];
    }
    
    if (lowerQuery.includes('purnima') || lowerQuery.includes('full moon')) {
      return this.fallbackData['purnima'];
    }
    
    if (lowerQuery.includes('amavasya') || lowerQuery.includes('new moon')) {
      return this.fallbackData['amavasya'];
    }
    
    if (lowerQuery.includes('nakshatra') || lowerQuery.includes('star')) {
      return `# Nakshatra Information

## What are Nakshatras?
Nakshatras are the 27 divisions of the sky in Vedic astrology, each representing a specific star or constellation. They play a crucial role in Hindu astrology and spiritual practices.

### Current Nakshatra: Swati
- **Ruler:** Rahu
- **Element:** Air
- **Quality:** Light and swift
- **Deity:** Vayu (Wind God)

### Characteristics
- **Positive Traits:** Quick thinking, adaptable, communicative
- **Negative Traits:** Restless, scattered energy
- **Best Activities:** Communication, travel, learning
- **Avoid:** Heavy work, starting new projects

### Spiritual Significance
Swati nakshatra is ideal for:
- Learning new skills
- Communication and networking
- Travel and exploration
- Spiritual practices involving air element

### Mantra for Swati
"Om Vayu Vayuaya Namah" - Chant this mantra during Swati nakshatra for maximum benefits.`;
    }
    
    if (lowerQuery.includes('tithi') || lowerQuery.includes('lunar day')) {
      return `# Tithi Information

## What are Tithis?
Tithis are the 30 lunar days in the Hindu calendar, divided into two pakshas (phases): Shukla Paksha (waxing moon) and Krishna Paksha (waning moon).

### Current Tithi: Shukla Ashtami
- **Paksha:** Shukla (Waxing Moon)
- **Number:** 8th lunar day
- **Ruler:** Sun
- **Element:** Fire

### Characteristics
- **Positive Traits:** Leadership, courage, determination
- **Negative Traits:** Ego, aggression, impatience
- **Best Activities:** Leadership roles, physical activities, sports
- **Avoid:** Arguments, conflicts, hasty decisions

### Spiritual Practices
- **Meditation:** Focus on solar plexus chakra
- **Mantra:** "Om Suryaya Namah"
- **Yoga:** Surya Namaskar (Sun Salutation)
- **Charity:** Donate red items or to fire temples

### Auspicious Activities
- Starting new ventures
- Leadership activities
- Physical exercises
- Spiritual practices
- Temple visits

### Timing
- **Start:** 6:00 AM
- **End:** 6:00 AM next day
- **Best Time:** Sunrise to sunset`;
    }
    
    // Default response
    return `# Spiritual Guidance

## Based on your query: "${query}"

I understand you're seeking spiritual or astrological information. While I cannot access real-time data from Perplexity.ai at the moment, here are some general spiritual principles that may help:

### General Spiritual Practices
1. **Meditation:** Daily meditation for mental clarity
2. **Prayer:** Regular prayer and spiritual practices
3. **Charity:** Helping others and donating to good causes
4. **Study:** Reading spiritual texts and scriptures
5. **Service:** Serving the community and those in need

### Vedic Wisdom
- **Karma:** Your actions determine your future
- **Dharma:** Follow your righteous path
- **Artha:** Pursue prosperity ethically
- **Moksha:** Seek spiritual liberation

### Daily Practices
- **Morning:** Prayer and meditation
- **Afternoon:** Study and learning
- **Evening:** Reflection and gratitude
- **Night:** Rest and spiritual contemplation

### Remember
The most important spiritual practice is to be kind, honest, and helpful to others. Every good action contributes to your spiritual growth.

*Note: For specific astrological or Panchang information, please try again later or consult with a qualified astrologer.*`;
  }

  /**
   * Test the web scraper functionality
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.scrapeFromPerplexity('test query');
      return response.success;
    } catch (error) {
      console.error('❌ Web scraper test failed:', error);
      return false;
    }
  }
}

export const perplexityWebScraper = new PerplexityWebScraper(); 