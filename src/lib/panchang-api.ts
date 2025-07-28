// Panchang API Service for VoiceVedic
// Integrates with Panchang.Click API for Hindu calendar data
import { geminiAPI } from './gemini-api';
import { formatDate, formatDateTime, formatTime } from './date-utils';

export interface PanchangData {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  rashi: string;
  maasa: string;
  paksha: string;
  sunrise: string;
  sunset: string;
  date: string;
  time: string;
  location: string;
  tithiTill?: string;
  tithinum?: number;
  tithiStart?: string;
  nakshatraStart?: string;
  nakshatraTill?: string;
  yogaStart?: string;
  yogaTill?: string;
  karanaStart?: string;
  karanaTill?: string;
  vaar?: string;
  vaar_number?: number;
}

export interface PanchangResponse {
  success: boolean;
  data?: PanchangData;
  error?: string;
  message?: string;
}

export interface PanchangGuidanceRequest {
  question: string;
  date?: string;
  time?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export interface PanchangGuidanceResponse {
  success: boolean;
  guidance?: string;
  panchang?: PanchangData;
  error?: string;
  message?: string;
}

class PanchangAPIService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private userId: string;
  private authCode: string;
  private cache: Map<string, { data: PanchangData; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes cache expiry

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.userId = import.meta.env.VITE_PANCHANG_USER_ID || 'kiranku';
    this.authCode = import.meta.env.VITE_PANCHANG_AUTH_CODE || '6d024cd3cced6e74fd1ec17acb371584';
  }

  // Cache management methods
  private getCacheKey(date: string, latitude: number, longitude: number): string {
    return `${date}_${latitude}_${longitude}`;
  }

  private getFromCache(date: string, latitude: number, longitude: number): PanchangData | null {
    const key = this.getCacheKey(date, latitude, longitude);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📦 Using cached data for:', date);
      return cached.data;
    }
    
    return null;
  }

  private setCache(date: string, latitude: number, longitude: number, data: PanchangData): void {
    const key = this.getCacheKey(date, latitude, longitude);
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log('💾 Cached data for:', date);
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get basic Panchang data for a specific date and location
  async getPanchangData(date: string, latitude: number, longitude: number): Promise<PanchangResponse> {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        return {
          success: false,
          error: 'Supabase configuration missing'
        };
      }

      // Check cache first
      const cachedData = this.getFromCache(date, latitude, longitude);
      if (cachedData) {
        return {
          success: true,
          data: cachedData
        };
      }

      // Clear expired cache entries
      this.clearExpiredCache();

      // Convert date format from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      // Get current time in HH:MM:SS format
      const now = new Date();
      const time = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      // Use Supabase Edge Function as proxy to avoid CORS issues
      const url = `${this.supabaseUrl}/functions/v1/panchang-guidance`;
      
      const requestBody = {
        question: "What is today's Panchang?",
        date: formattedDate,
        time: time,
        timezone: "5.5", // IST timezone
        latitude: latitude.toString(),
        longitude: longitude.toString()
      };

      console.log('🌐 Making API request for:', formattedDate);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();

      if (data.panchang) {
        const panchangData = {
          tithi: data.panchang.tithi || '',
          nakshatra: data.panchang.nakshatra || '',
          yoga: data.panchang.yoga || '',
          karana: data.panchang.karana || '',
          rashi: data.panchang.rashi || '',
          maasa: data.panchang.maasa || '',
          paksha: data.panchang.paksha || '',
          sunrise: data.panchang.sunrise || '',
          sunset: data.panchang.sunset || '',
          date: date,
          time: time,
          location: `${latitude}, ${longitude}`,
          tithiTill: data.panchang.tithiTill || '',
          tithinum: data.panchang.tithinum || 0,
          tithiStart: data.panchang.tithiStart || '',
          nakshatraStart: data.panchang.nakshatraStart || '',
          nakshatraTill: data.panchang.nakshatraTill || '',
          yogaStart: data.panchang.yogaStart || '',
          yogaTill: data.panchang.yogaTill || '',
          karanaStart: data.panchang.karanaStart || '',
          karanaTill: data.panchang.karanaTill || '',
          vaar: data.panchang.vaar || '',
          vaar_number: data.panchang.vaar_number || 0
        };

        // Cache the result
        this.setCache(date, latitude, longitude, panchangData);

        return {
          success: true,
          data: panchangData
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch Panchang data'
        };
      }
    } catch (error) {
      console.error('Panchang API Error:', error);
      return {
        success: false,
        error: `Network error or API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get spiritual guidance based on Panchang data
  async getPanchangGuidance(request: PanchangGuidanceRequest): Promise<PanchangGuidanceResponse> {
    try {
      const { question, date, time, timezone, latitude, longitude } = request;
      const questionLower = question.toLowerCase();
      const lat = latitude || 28.6139; // Default to Delhi
      const lng = longitude || 77.2090;
      
      // Define Tithi keywords for spelling correction - ALL 16 TITHIS
      const tithiKeywords = {
        // All 16 Tithis (same names in both Shukla and Krishna Paksha)
        'pratipada': 'pratipada',    // 1st tithi after new/full moon
        'dwitiya': 'dwitiya',        // 2nd tithi
        'tritiya': 'tritiya',        // 3rd tithi
        'chaturthi': 'chaturthi',    // 4th tithi
        'panchami': 'panchami',      // 5th tithi
        'shashthi': 'shashthi',      // 6th tithi (Shashti)
        'saptami': 'saptami',        // 7th tithi
        'ashtami': 'ashtami',        // 8th tithi
        'navami': 'navami',          // 9th tithi
        'dashami': 'dashami',        // 10th tithi
        'ekadashi': 'ekadashi',      // 11th tithi
        'dwadashi': 'dwadashi',      // 12th tithi
        'trayodashi': 'trayodashi',  // 13th tithi
        'chaturdashi': 'chaturdashi', // 14th tithi
        'purnima': 'purnima',        // 15th tithi (full moon)
        'amavasya': 'amavasya'       // New moon (also considered a tithi)
      };
      
      // First, analyze the question using Gemini to understand intent
      console.log('🤖 Analyzing question with Gemini:', question);
      const geminiAnalysis = await geminiAPI.analyzeQuestion({ question });
      
      if (!geminiAnalysis.success) {
        console.log('❌ Gemini analysis failed, falling back to direct processing');
      } else {
        console.log('✅ Gemini analysis successful:', geminiAnalysis);
        
        // Use corrected spelling if available
        let processedQuestion = question;
        if (geminiAnalysis.correctedSpelling) {
          processedQuestion = question.replace(
            new RegExp(Object.keys(tithiKeywords).join('|'), 'gi'),
            geminiAnalysis.correctedSpelling
          );
          console.log('🔤 Corrected spelling:', geminiAnalysis.correctedSpelling);
        }
        
        // If Gemini identified it as a vague question or spiritual guidance, get spiritual guidance
        if (geminiAnalysis.queryType === 'vague' || geminiAnalysis.queryType === 'spiritual_guidance' || !geminiAnalysis.isPanchangQuery) {
          console.log('🤖 Question is vague, spiritual, or non-Panchang, getting spiritual guidance');
          const spiritualGuidance = await geminiAPI.getSpiritualGuidance(question);
          
          if (spiritualGuidance.success && spiritualGuidance.response) {
            return {
              success: true,
              guidance: `🤖 **AI Understanding**: ${geminiAnalysis.response}\n\n${spiritualGuidance.response}`,
              panchang: undefined
            };
          }
        }
        
        // If Gemini extracted a date, use it
        if (geminiAnalysis.extractedDate) {
          console.log('📅 Gemini extracted date:', geminiAnalysis.extractedDate);
          const targetDate = geminiAnalysis.extractedDate;
          const panchangData = await this.getAccuratePanchangData(targetDate, lat, lng);
          
          if (panchangData.success && panchangData.data) {
            const guidance = this.generateGuidance(geminiAnalysis.response || question, panchangData.data);
            return {
              success: true,
              guidance,
              panchang: panchangData.data
            };
          }
        }
      }
      
      // Extract date from question if specified (fallback method)
      let targetDate = date;
      const dateMatch = question.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        targetDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle "next" queries for ALL Tithis
      console.log('🔍 Checking for next Tithi queries...');
      for (const [keyword, tithiType] of Object.entries(tithiKeywords)) {
        if (questionLower.includes(`next ${keyword}`)) {
          console.log(`🎯 Found "next ${keyword}" query, searching for next occurrence...`);
          const nextEvent = await this.findNextEvent(tithiType as any, lat, lng);
          if (nextEvent.success && nextEvent.event) {
            let response = `🕉️ Next ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Information:\n\n`;
            response += `📅 Date: ${formatDate(nextEvent.event.date)}\n`;
            response += `🕉️ Tithi: ${nextEvent.event.tithi}\n`;
            response += `⏰ Start: ${formatDateTime(nextEvent.event.startTime)}\n`;
            response += `⏰ End: ${formatDateTime(nextEvent.event.endTime)}\n`;
            response += `⭐ Nakshatra: ${nextEvent.event.nakshatra}\n`;
            response += `🌙 Paksha: ${nextEvent.event.paksha}\n`;
            response += `📅 Maasa: ${nextEvent.event.maasa}\n`;
            response += `📆 Varam: ${nextEvent.event.vaar}\n\n`;
            
            // Add specific guidance for each Tithi
            const tithiGuidance = {
              'pratipada': '🙏 Recommended: Pratipada rituals, new month celebrations, and auspicious beginnings. First tithi after new/full moon.',
              'dwitiya': '🙏 Recommended: Dwitiya rituals, spiritual practices, and meditation. Second tithi.',
              'tritiya': '🙏 Recommended: Tritiya rituals, spiritual practices, and prayer. Third tithi.',
              'chaturthi': '🙏 Recommended: Ganesh Chaturthi, Vinayaka worship, and obstacle removal. Fourth tithi.',
              'panchami': '🙏 Recommended: Panchami rituals, spiritual practices, and meditation. Fifth tithi.',
              'shashthi': '🙏 Recommended: Shashthi rituals, spiritual practices, and prayer. Sixth tithi (Shashti).',
              'saptami': '🙏 Recommended: Saptami rituals, spiritual practices, and meditation. Seventh tithi.',
              'ashtami': '🙏 Recommended: Durga Puja, fasting, spiritual practices, and strength rituals. Eighth tithi.',
              'navami': '🙏 Recommended: Siddhi Vinayaka Puja, spiritual practices, and success rituals. Ninth tithi.',
              'dashami': '🙏 Recommended: Vijayadashami celebrations, new beginnings, and victory rituals. Tenth tithi.',
              'ekadashi': '🙏 Recommended: Light fast, avoid grains, focus on prayers and meditation. Eleventh tithi.',
              'dwadashi': '🙏 Recommended: Dwadashi rituals, spiritual practices, and prayer. Twelfth tithi.',
              'trayodashi': '🙏 Recommended: Pradosh Vrat, Shiva worship, and spiritual practices. Thirteenth tithi.',
              'chaturdashi': '🙏 Recommended: Chaturdashi rituals, spiritual practices, and meditation. Fourteenth tithi.',
              'purnima': '🙏 Recommended: Purnima rituals, full moon meditation, and spiritual practices. Fifteenth tithi (full moon).',
              'amavasya': '🙏 Recommended: Amavasya rituals, ancestral offerings, and spiritual purification. New moon (also considered a tithi).'
            };
            
            response += tithiGuidance[tithiType as keyof typeof tithiGuidance] || '🙏 Recommended: Spiritual practices and meditation.';
            response += `\n\n💡 Spiritual tip: Use this time for meditation, prayer, and connecting with your inner self.`;
            
            return {
              success: true,
              guidance: response,
              panchang: {
                tithi: nextEvent.event.tithi,
                nakshatra: nextEvent.event.nakshatra,
                yoga: '',
                karana: '',
                rashi: '',
                maasa: nextEvent.event.maasa,
                paksha: nextEvent.event.paksha,
                sunrise: '',
                sunset: '',
                date: nextEvent.event.date,
                time: '',
                location: `${lat}, ${lng}`,
                tithiStart: nextEvent.event.startTime,
                tithiTill: nextEvent.event.endTime,
                vaar: nextEvent.event.vaar
              }
            };
          }
        }
      }
      
      // Fallback: Check for any Tithi mention without "next"
      for (const [keyword, tithiType] of Object.entries(tithiKeywords)) {
        if (questionLower.includes(keyword) && !questionLower.includes('next')) {
          console.log(`🎯 Found "${keyword}" query, providing current information...`);
          // Get today's data for this Tithi
          const today = new Date().toISOString().split('T')[0];
          const panchangData = await this.getAccuratePanchangData(today, lat, lng);
          
          if (panchangData.success && panchangData.data) {
            const guidance = this.generateGuidance(question, panchangData.data);
            return {
              success: true,
              guidance,
              panchang: panchangData.data
            };
          }
        }
      }
      
      // Handle Krishna Paksha queries
      if (questionLower.includes('krishna paksha')) {
        const today = new Date().toISOString().split('T')[0];
        const panchangData = await this.getAccuratePanchangData(today, lat, lng);
        
        if (panchangData.success && panchangData.data) {
          let response = `🌙 Krishna Paksha Information:\n\n`;
          response += `📅 Current Date: ${formatDate(panchangData.data.date)}\n`;
          response += `🕉️ Current Tithi: ${panchangData.data.tithi}\n`;
          response += `🌙 Current Paksha: ${panchangData.data.paksha}\n`;
          response += `📅 Maasa: ${panchangData.data.maasa}\n`;
          response += `📆 Varam: ${panchangData.data.vaar}\n\n`;
          
          if (panchangData.data.paksha.toLowerCase().includes('krishna')) {
            response += `✅ We are currently in Krishna Paksha!\n\n`;
            response += `📖 **About Krishna Paksha:**\n`;
            response += `• Krishna Paksha is the waning phase of the moon\n`;
            response += `• It lasts for 15 days from Purnima to Amavasya\n`;
            response += `• This period is considered auspicious for:\n`;
            response += `  - Pitru tarpan (ancestral offerings)\n`;
            response += `  - Meditation and spiritual practices\n`;
            response += `  - Fasting and purification\n`;
            response += `  - Removing negative karma\n\n`;
            response += `🙏 Recommended practices during Krishna Paksha:\n`;
            response += `• Light a lamp for ancestors\n`;
            response += `• Practice meditation and yoga\n`;
            response += `• Read spiritual texts\n`;
            response += `• Perform acts of charity`;
          } else {
            response += `📅 We are currently in ${panchangData.data.paksha} Paksha\n\n`;
            response += `🌙 **Next Krishna Paksha:**\n`;
            response += `• Will begin after the next Purnima\n`;
            response += `• Lasts for 15 days until Amavasya\n`;
            response += `• Ideal for spiritual purification practices`;
          }
          
          return {
            success: true,
            guidance: response,
            panchang: panchangData.data
          };
        }
      }
      
      // Handle Maasa queries
      if (questionLower.includes('maasa') || questionLower.includes('month')) {
        const today = new Date().toISOString().split('T')[0];
        const panchangData = await this.getAccuratePanchangData(today, lat, lng);
        
        if (panchangData.success && panchangData.data) {
          let response = `📅 Current Maasa Information:\n\n`;
          response += `📅 Date: ${formatDate(panchangData.data.date)}\n`;
          response += `📅 Maasa: ${panchangData.data.maasa}\n`;
          response += `🕉️ Tithi: ${panchangData.data.tithi}\n`;
          response += `🌙 Paksha: ${panchangData.data.paksha}\n`;
          response += `📆 Varam: ${panchangData.data.vaar}\n\n`;
          
          response += `📖 **About ${panchangData.data.maasa} Maasa:**\n`;
          response += `• Each Hindu month has specific spiritual significance\n`;
          response += `• Different months are auspicious for different practices\n`;
          response += `• Current month: ${panchangData.data.maasa}\n\n`;
          response += `🙏 Recommended practices for this month:\n`;
          response += `• Follow the specific rituals for ${panchangData.data.maasa}\n`;
          response += `• Practice meditation and prayer\n`;
          response += `• Read spiritual texts\n`;
          response += `• Perform acts of charity`;
          
          return {
            success: true,
            guidance: response,
            panchang: panchangData.data
          };
        }
      }
      
      // Handle Varalakshmi Vratham queries
      if (questionLower.includes('varalakshmi') || questionLower.includes('vratham')) {
        let response = `🕉️ Varalakshmi Vratham Information:\n\n`;
        response += `📅 **Varalakshmi Vratham** is a sacred Hindu festival\n`;
        response += `• Celebrated on the Friday before Purnima in Shravan month\n`;
        response += `• Dedicated to Goddess Lakshmi for prosperity and well-being\n`;
        response += `• Usually falls in July-August (Shravan month)\n\n`;
        response += `🙏 **Rituals and Practices:**\n`;
        response += `• Women observe fasting and perform special puja\n`;
        response += `• Decorate homes with rangoli and flowers\n`;
        response += `• Offer prayers to Goddess Lakshmi\n`;
        response += `• Distribute prasad to family and friends\n\n`;
        response += `💡 **Spiritual Significance:**\n`;
        response += `• Brings prosperity and abundance\n`;
        response += `• Strengthens family bonds\n`;
        response += `• Removes obstacles and negative energy\n`;
        response += `• Fulfills wishes and desires`;
        
        return {
          success: true,
          guidance: response,
          panchang: undefined
        };
      }
      
      // Default: Get today's Panchang data
      const today = new Date().toISOString().split('T')[0];
      const panchangData = await this.getAccuratePanchangData(today, lat, lng);
      
      if (panchangData.success && panchangData.data) {
        const guidance = this.generateGuidance(question, panchangData.data);
        return {
          success: true,
          guidance,
          panchang: panchangData.data
        };
      }
      
      return {
        success: false,
        error: 'Unable to get Panchang data. Please try again.'
      };
      
    } catch (error) {
      console.error('Error in getPanchangGuidance:', error);
      return {
        success: false,
        error: 'An error occurred while processing your request. Please try again.'
      };
    }
  }

  // Generate intelligent response based on question and Panchang data
  private generateGuidance(question: string, panchang: PanchangData): string {
    const questionLower = question.toLowerCase();
    let response = '';

    // Handle specific date queries
    if (questionLower.includes('date') || questionLower.includes('when')) {
      const dateMatch = question.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        response += `📅 Detailed Panchang for ${day}/${month}/${year}:\n\n`;
        response += `🕉️ Tithi: ${panchang.tithi}\n`;
        if (panchang.tithiStart) response += `   ⏰ Start: ${formatDateTime(panchang.tithiStart)}\n`;
        if (panchang.tithiTill) response += `   ⏰ End: ${formatDateTime(panchang.tithiTill)}\n`;
        response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
        if (panchang.nakshatraStart) response += `   ⏰ Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
        if (panchang.nakshatraTill) response += `   ⏰ End: ${formatDateTime(panchang.nakshatraTill)}\n`;
        response += `🌙 Paksha: ${panchang.paksha}\n`;
        response += `🧘 Yoga: ${panchang.yoga}\n`;
        if (panchang.yogaStart) response += `   ⏰ Start: ${formatDateTime(panchang.yogaStart)}\n`;
        if (panchang.yogaTill) response += `   ⏰ End: ${formatDateTime(panchang.yogaTill)}\n`;
        response += `🔮 Karana: ${panchang.karana}\n`;
        if (panchang.karanaStart) response += `   ⏰ Start: ${formatDateTime(panchang.karanaStart)}\n`;
        if (panchang.karanaTill) response += `   ⏰ End: ${formatDateTime(panchang.karanaTill)}\n`;
        response += `🌅 Sunrise: ${formatTime(panchang.sunrise)}\n`;
        response += `🌇 Sunset: ${formatTime(panchang.sunset)}\n`;
        response += `📅 Date: ${panchang.date}\n`;
        response += `📅 Maasa: ${panchang.maasa}\n`;
        response += `📆 Varam: ${panchang.vaar}\n`;
        return response;
      }
    }

    // Handle "next Ekadashi" queries
    if (questionLower.includes('next ekadashi') || questionLower.includes('when is ekadashi')) {
      response += `🕉️ Next Ekadashi Information:\n\n`;
      response += `Today is ${panchang.tithi} Tithi.\n\n`;
      
      if (panchang.tithi.toLowerCase().includes('ekadashi')) {
        response += `🎉 Today is Ekadashi! It's an auspicious day for fasting and spiritual practices.\n\n`;
        response += `📅 Date: ${formatDate(panchang.date)}\n`;
        response += `🕉️ Tithi: ${panchang.tithi}\n`;
        if (panchang.tithiStart) response += `⏰ Start: ${formatDateTime(panchang.tithiStart)}\n`;
        if (panchang.tithiTill) response += `⏰ End: ${formatDateTime(panchang.tithiTill)}\n`;
        response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
        if (panchang.nakshatraStart) response += `⏰ Nakshatra Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
        if (panchang.nakshatraTill) response += `⏰ Nakshatra End: ${formatDateTime(panchang.nakshatraTill)}\n`;
        response += `🌙 Paksha: ${panchang.paksha}\n`;
        response += `📅 Maasa: ${panchang.maasa}\n`;
        response += `📆 Varam: ${panchang.vaar}\n\n`;
        response += `🙏 Recommended: Light fast, avoid grains, focus on prayers and meditation.`;
      } else {
        response += `📅 Next Ekadashi will be found by searching upcoming dates...\n`;
        response += `💡 Tip: The system will search for the exact date and timing.`;
      }
      return response;
    }

    // Handle "next Purnima" queries
    if (questionLower.includes('next purnima') || questionLower.includes('when is purnima')) {
      response += `🌕 Next Purnima Information:\n\n`;
      response += `Today is ${panchang.tithi} Tithi.\n\n`;
      
      if (panchang.tithi.toLowerCase().includes('purnima')) {
        response += `🎉 Today is Purnima! It's a full moon day, excellent for spiritual practices.\n\n`;
        response += `📅 Date: ${formatDate(panchang.date)}\n`;
        response += `🕉️ Tithi: ${panchang.tithi}\n`;
        if (panchang.tithiStart) response += `⏰ Start: ${formatDateTime(panchang.tithiStart)}\n`;
        if (panchang.tithiTill) response += `⏰ End: ${formatDateTime(panchang.tithiTill)}\n`;
        response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
        if (panchang.nakshatraStart) response += `⏰ Nakshatra Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
        if (panchang.nakshatraTill) response += `⏰ Nakshatra End: ${formatDateTime(panchang.nakshatraTill)}\n`;
        response += `🌙 Paksha: ${panchang.paksha}\n`;
        response += `📅 Maasa: ${panchang.maasa}\n`;
        response += `📆 Varam: ${panchang.vaar}\n\n`;
        response += `🙏 Recommended: Moon worship, meditation, and charitable activities.`;
      } else {
        response += `📅 Next Purnima will be found by searching upcoming dates...\n`;
        response += `💡 Tip: The system will search for the exact date and timing.`;
      }
      return response;
    }

    // Handle "next Amavasya" queries
    if (questionLower.includes('next amavasya') || questionLower.includes('when is amavasya')) {
      response += `🌑 Next Amavasya Information:\n\n`;
      response += `Today is ${panchang.tithi} Tithi.\n\n`;
      
      if (panchang.tithi.toLowerCase().includes('amavasya')) {
        response += `🎉 Today is Amavasya! It's a new moon day, good for ancestral rituals.\n\n`;
        response += `📅 Date: ${formatDate(panchang.date)}\n`;
        response += `🕉️ Tithi: ${panchang.tithi}\n`;
        if (panchang.tithiStart) response += `⏰ Start: ${formatDateTime(panchang.tithiStart)}\n`;
        if (panchang.tithiTill) response += `⏰ End: ${formatDateTime(panchang.tithiTill)}\n`;
        response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
        if (panchang.nakshatraStart) response += `⏰ Nakshatra Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
        if (panchang.nakshatraTill) response += `⏰ Nakshatra End: ${formatDateTime(panchang.nakshatraTill)}\n`;
        response += `🌙 Paksha: ${panchang.paksha}\n`;
        response += `📅 Maasa: ${panchang.maasa}\n`;
        response += `📆 Varam: ${panchang.vaar}\n\n`;
        response += `🙏 Recommended: Pitru tarpan, meditation, and spiritual practices.`;
      } else {
        response += `📅 Next Amavasya will be found by searching upcoming dates...\n`;
        response += `💡 Tip: The system will search for the exact date and timing.`;
      }
      return response;
    }

    // Handle specific Tithi queries
    if (questionLower.includes('tithi') && !questionLower.includes('next')) {
      response += `📅 Today's Detailed Panchang Information:\n\n`;
      response += `🕉️ Tithi: ${panchang.tithi}\n`;
      if (panchang.tithiStart) response += `⏰ Start: ${panchang.tithiStart}\n`;
      if (panchang.tithiTill) response += `⏰ End: ${panchang.tithiTill}\n`;
      response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
      if (panchang.nakshatraStart) response += `⏰ Start: ${panchang.nakshatraStart}\n`;
      if (panchang.nakshatraTill) response += `⏰ End: ${panchang.nakshatraTill}\n`;
      response += `🌙 Paksha: ${panchang.paksha}\n`;
      response += `🧘 Yoga: ${panchang.yoga}\n`;
      if (panchang.yogaStart) response += `⏰ Start: ${panchang.yogaStart}\n`;
      if (panchang.yogaTill) response += `⏰ End: ${panchang.yogaTill}\n`;
      response += `🔮 Karana: ${panchang.karana}\n`;
      if (panchang.karanaStart) response += `⏰ Start: ${panchang.karanaStart}\n`;
      if (panchang.karanaTill) response += `⏰ End: ${panchang.karanaTill}\n`;
      response += `🌅 Sunrise: ${panchang.sunrise}\n`;
      response += `🌇 Sunset: ${panchang.sunset}\n`;
      response += `📅 Date: ${panchang.date}\n`;
      response += `📅 Maasa: ${panchang.maasa}\n`;
      response += `📆 Varam: ${panchang.vaar}\n`;
      return response;
    }

    // Handle general spiritual guidance
    if (questionLower.includes('fast') || questionLower.includes('vrat')) {
      if (panchang.tithi.toLowerCase().includes('ekadashi')) {
        response += `🎉 Today is ${panchang.tithi}, an auspicious day for fasting!\n\n`;
        response += `📅 Date: ${panchang.date}\n`;
        response += `🕉️ Tithi: ${panchang.tithi}\n`;
        if (panchang.tithiStart) response += `⏰ Start: ${panchang.tithiStart}\n`;
        if (panchang.tithiTill) response += `⏰ End: ${panchang.tithiTill}\n`;
        response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
        response += `🌙 Paksha: ${panchang.paksha}\n`;
        response += `📅 Maasa: ${panchang.maasa}\n`;
        response += `📆 Varam: ${panchang.vaar}\n\n`;
        response += `🙏 Recommended practices:\n`;
        response += `• Light fast (avoid grains)\n`;
        response += `• Focus on prayers and meditation\n`;
        response += `• Read spiritual texts\n`;
        response += `• Practice self-discipline`;
      } else {
        response += `Today is ${panchang.tithi} Tithi.\n\n`;
        response += `💡 While not Ekadashi, you can still observe spiritual practices.\n`;
        response += `🙏 Consider fasting on the next Ekadashi for maximum spiritual benefits.`;
      }
      return response;
    }

    // Default response with current Panchang
    response += `🕉️ Today's Detailed Panchang: ${panchang.tithi} Tithi, ${panchang.nakshatra} Nakshatra\n\n`;
    response += `📅 Date: ${formatDate(panchang.date)}\n`;
    if (panchang.tithiStart) response += `⏰ Tithi Start: ${formatDateTime(panchang.tithiStart)}\n`;
    if (panchang.tithiTill) response += `⏰ Tithi End: ${formatDateTime(panchang.tithiTill)}\n`;
    response += `🌅 Sunrise: ${formatTime(panchang.sunrise)}\n`;
    response += `🌇 Sunset: ${formatTime(panchang.sunset)}\n`;
    response += `🌙 Paksha: ${panchang.paksha}\n`;
    response += `🧘 Yoga: ${panchang.yoga}\n`;
    response += `📅 Maasa: ${panchang.maasa}\n`;
    response += `📆 Varam: ${panchang.vaar}\n\n`;
    response += `💡 Spiritual tip: Use this time for meditation, prayer, and connecting with your inner self.`;

    return response;
  }

  // Get accurate Panchang data for a specific date (now uses caching)
  async getAccuratePanchangData(targetDate: string, latitude: number, longitude: number): Promise<PanchangResponse> {
    // Use the cached getPanchangData method which already includes caching
    return await this.getPanchangData(targetDate, latitude, longitude);
  }

  // Find next specific event with smart calculations and minimal API calls
  async findNextEvent(eventType: 'pratipada' | 'dwitiya' | 'tritiya' | 'chaturthi' | 'panchami' | 'shashthi' | 'saptami' | 'ashtami' | 'navami' | 'dashami' | 'ekadashi' | 'dwadashi' | 'trayodashi' | 'chaturdashi' | 'purnima' | 'amavasya', latitude: number, longitude: number): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // First, get today's Panchang to understand current position
      const today = new Date().toISOString().split('T')[0];
      const todayData = await this.getPanchangData(today, latitude, longitude);
      
      if (!todayData.success || !todayData.data) {
        return {
          success: false,
          error: 'Failed to get today\'s Panchang data'
        };
      }

      const currentTithiNum = todayData.data.tithinum || 0;
      let targetDays = 0;

      // Smart calculation based on current tithi
      if (eventType === 'ekadashi') {
        // Ekadashi occurs on 11th and 26th tithi
        const daysToNextEkadashi = currentTithiNum <= 11 ? 11 - currentTithiNum : 26 - currentTithiNum;
        if (daysToNextEkadashi <= 0) {
          targetDays = 11; // Next cycle
        } else {
          targetDays = daysToNextEkadashi;
        }
      } else if (eventType === 'purnima') {
        // Purnima occurs on 15th tithi
        const daysToNextPurnima = 15 - currentTithiNum;
        if (daysToNextPurnima <= 0) {
          targetDays = 15; // Next cycle
        } else {
          targetDays = daysToNextPurnima;
        }
      } else if (eventType === 'amavasya') {
        // Amavasya occurs on 30th tithi (or 0th of next cycle)
        const daysToNextAmavasya = 30 - currentTithiNum;
        if (daysToNextAmavasya <= 0) {
          targetDays = 30; // Next cycle
        } else {
          targetDays = daysToNextAmavasya;
        }
      } else if (eventType === 'ashtami') {
        // Ashtami occurs on 8th and 23rd tithi
        const daysToNextAshtami = currentTithiNum <= 8 ? 8 - currentTithiNum : 23 - currentTithiNum;
        if (daysToNextAshtami <= 0) {
          targetDays = 8; // Next cycle
        } else {
          targetDays = daysToNextAshtami;
        }
      }

      // Calculate target date
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + targetDays);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Get Panchang data for the calculated target date
      const targetData = await this.getPanchangData(targetDateStr, latitude, longitude);
      
      if (!targetData.success || !targetData.data) {
        return {
          success: false,
          error: `Failed to get Panchang data for calculated ${eventType} date`
        };
      }

      const tithi = targetData.data.tithi.toLowerCase();
      
      // Verify if the calculated date has the target event
      if ((eventType === 'ekadashi' && tithi.includes('ekadashi')) ||
          (eventType === 'purnima' && tithi.includes('purnima')) ||
          (eventType === 'amavasya' && tithi.includes('amavasya')) ||
          (eventType === 'ashtami' && tithi.includes('ashtami'))) {
        
        return {
          success: true,
          event: {
            type: eventType.charAt(0).toUpperCase() + eventType.slice(1),
            date: targetDateStr,
            tithi: targetData.data.tithi,
            startTime: targetData.data.tithiStart,
            endTime: targetData.data.tithiTill,
            nakshatra: targetData.data.nakshatra,
            paksha: targetData.data.paksha,
            maasa: targetData.data.maasa,
            vaar: targetData.data.vaar
          }
        };
      }

      // If calculated date doesn't match, do a limited search (max 5 days around calculated date)
      const searchRange = 5;
      for (let i = -searchRange; i <= searchRange; i++) {
        const searchDate = new Date(targetDate);
        searchDate.setDate(targetDate.getDate() + i);
        const searchDateStr = searchDate.toISOString().split('T')[0];
        
        const searchData = await this.getPanchangData(searchDateStr, latitude, longitude);
        
        if (searchData.success && searchData.data) {
          const searchTithi = searchData.data.tithi.toLowerCase();
          
          if ((eventType === 'ekadashi' && searchTithi.includes('ekadashi')) ||
              (eventType === 'purnima' && searchTithi.includes('purnima')) ||
              (eventType === 'amavasya' && searchTithi.includes('amavasya')) ||
              (eventType === 'ashtami' && searchTithi.includes('ashtami'))) {
            
            return {
              success: true,
              event: {
                type: eventType.charAt(0).toUpperCase() + eventType.slice(1),
                date: searchDateStr,
                tithi: searchData.data.tithi,
                startTime: searchData.data.tithiStart,
                endTime: searchData.data.tithiTill,
                nakshatra: searchData.data.nakshatra,
                paksha: searchData.data.paksha,
                maasa: searchData.data.maasa,
                vaar: searchData.data.vaar
              }
            };
          }
        }
      }
      
      return {
        success: false,
        error: `No ${eventType} found in the calculated range`
      };
    } catch (error) {
      return {
        success: false,
        error: `Error finding next ${eventType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Validate API credentials
  async validateCredentials(): Promise<boolean> {
    try {
      // First check if Supabase configuration is set
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        console.error('Supabase configuration not set:', { 
          supabaseUrl: this.supabaseUrl ? 'Set' : 'Missing',
          supabaseAnonKey: this.supabaseAnonKey ? 'Set' : 'Missing'
        });
        return false;
      }

      // Make a test API call through Supabase Edge Function
      const today = new Date().toISOString().split('T')[0];
      console.log('Validating Panchang API through Supabase Edge Function with:', {
        supabaseUrl: this.supabaseUrl,
        date: today,
        coordinates: [28.6139, 77.2090]
      });

      const result = await this.getPanchangData(today, 28.6139, 77.2090);
      console.log('Validation result:', result);
      
      return result.success;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const panchangAPI = new PanchangAPIService(); 