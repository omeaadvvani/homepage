import { supabase } from './supabase';
import { aiService } from './gemini-api';
import { formatDate, formatDateTime } from './date-utils';
import { vedicAstroAPI } from './vedic-astro-api';

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
  // Vedic Astro enhanced data
  moonrise?: string;
  moonset?: string;
  rahu_kalam?: string;
  gulika_kalam?: string;
  yamaganda_kalam?: string;
  abhijit_muhurta?: string;
  brahma_muhurta?: string;
  sandhya_kal?: string;
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
  private cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days cache expiry
  private eventCache: Map<string, { event: any; timestamp: number }> = new Map();
  private eventCacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days cache expiry for events

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.userId = import.meta.env.VITE_PANCHANG_USER_ID || '';
    this.authCode = import.meta.env.VITE_PANCHANG_AUTH_CODE || '';
    
    console.log('🔑 PanchangAPIService credentials check:', {
      hasSupabaseUrl: !!this.supabaseUrl,
      hasSupabaseKey: !!this.supabaseAnonKey,
      hasUserId: !!this.userId,
      hasAuthCode: !!this.authCode,
      userId: this.userId,
      authCodeLength: this.authCode.length
    });
  }

  private getCacheKey(date: string, latitude: number, longitude: number): string {
    return `${date}_${latitude}_${longitude}`;
  }

  private getFromCache(date: string, latitude: number, longitude: number): PanchangData | null {
    const key = this.getCacheKey(date, latitude, longitude);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📦 Using cached Panchang data for:', date);
      return cached.data;
    }
    
    // Remove expired entry if found
    if (cached) {
      this.cache.delete(key);
      console.log('🗑️ Removed expired cache entry for:', date);
    }
    
    return null;
  }

  private setCache(date: string, latitude: number, longitude: number, data: PanchangData): void {
    const key = this.getCacheKey(date, latitude, longitude);
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log('💾 Cached Panchang data for:', date);
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    // Clear expired event cache
    for (const [key, value] of this.eventCache.entries()) {
      if (now - value.timestamp > this.eventCacheExpiry) {
        this.eventCache.delete(key);
      }
    }
    
    if (expiredCount > 0) {
      console.log(`🧹 Cleared ${expiredCount} expired cache entries`);
    }
  }

  // Clear all cache (useful for testing)
  clearAllCache(): void {
    this.cache.clear();
    this.eventCache.clear();
    console.log('🧹 Cleared all cache entries');
  }

  // Clear cache for specific date and location
  clearCacheForDate(date: string, latitude: number, longitude: number): void {
    const key = this.getCacheKey(date, latitude, longitude);
    this.cache.delete(key);
    console.log('🗑️ Cleared cache for:', date);
  }

  // Preload cache for a date range (30 days past and future)
  private async preloadCache(latitude: number, longitude: number): Promise<void> {
    const today = new Date();
    const cachePromises: Promise<void>[] = [];
    
    // Preload 30 days into the past and future
    for (let i = -30; i <= 30; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const cacheKey = this.getCacheKey(dateStr, latitude, longitude);
      
      // Only preload if not already cached
      if (!this.cache.has(cacheKey)) {
        cachePromises.push(
          this.getPanchangData(dateStr, latitude, longitude)
            .then(response => {
              if (response.success && response.data) {
                console.log(`📥 Preloaded data for: ${dateStr}`);
              }
            })
            .catch(error => {
              console.warn(`⚠️ Failed to preload data for ${dateStr}:`, error);
            })
        );
      }
    }
    
    // Execute preloading in background
    Promise.allSettled(cachePromises).then(() => {
      console.log('✅ Cache preloading completed');
    });
  }

  async getPanchangData(date: string, latitude: number, longitude: number): Promise<PanchangResponse> {
    try {
      // Only clear expired cache occasionally to improve performance
      if (Math.random() < 0.1) { // 10% chance to clear expired cache
        this.clearExpiredCache();
      }
      
      // Check cache first
      const cachedData = this.getFromCache(date, latitude, longitude);
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      console.log('🌐 Fetching Panchang data from API...');
      
      // Ensure we're using the exact date requested, not a modified version
      let targetDate = date;
      
      // If date is in YYYY-MM-DD format, ensure it's the exact date requested
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        // Validate the date components
        const requestedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const targetYear = requestedDate.getFullYear().toString();
        const targetMonth = String(requestedDate.getMonth() + 1).padStart(2, '0');
        const targetDay = String(requestedDate.getDate()).padStart(2, '0');
        targetDate = `${targetYear}-${targetMonth}-${targetDay}`;
      }
      
      // Convert YYYY-MM-DD to DD/MM/YYYY format for the API
      const [year, month, day] = targetDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      console.log('📅 Requested date:', date);
      console.log('📅 Target date:', targetDate);
      console.log('📅 Formatted date for API:', formattedDate);
      
      // Call Supabase Edge Function as proxy
      const functionBody = {
        question: 'What is today\'s panchang?',
        date: formattedDate,
        time: '06:00:00',
        timezone: '5.5', // IST timezone for panchang calculations
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        userId: this.userId,
        authCode: this.authCode
      };
      
      console.log('📡 Calling Supabase function with:', {
        ...functionBody,
        userId: this.userId,
        authCode: this.authCode.substring(0, 8) + '...'
      });
      
      const { data, error } = await supabase.functions.invoke('panchang-guidance', {
        body: functionBody
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.status !== 'ok') {
        console.error('❌ API response error:', data?.error || 'Unknown error');
        return { success: false, error: data?.error || 'Failed to fetch Panchang data' };
      }

      // Parse and validate time data with proper date association
      const parseTimeWithDate = (timeString: string, baseDate: string): string => {
        if (!timeString) return '';
        
        // Handle different time formats from API
        if (timeString.includes('-')) {
          // Format: "03-08-2025 05:54:05" or "02-08-2025 07:28:41"
          const [datePart, timePart] = timeString.split(' ');
          if (datePart && timePart) {
            const [day, month, year] = datePart.split('-');
            // Ensure we use the correct year (2025) instead of any incorrect year from API
            const currentYear = new Date().getFullYear().toString();
            return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`;
          }
        } else if (timeString.includes(':')) {
          // Format: "07:43:32" - use base date
          return `${baseDate} ${timeString}`;
        }
        
        return timeString;
      };

      // Function to fix incorrect years in Panchang data
      const fixIncorrectYears = (data: any): any => {
        const currentYear = new Date().getFullYear().toString();
        
        // Helper function to fix year in datetime string
        const fixYearInDateTime = (dateTimeString: string): string => {
          if (!dateTimeString || typeof dateTimeString !== 'string') return dateTimeString;
          
          // Handle various date formats
          // Format 1: "02-08-1909 15:37:00" (DD-MM-YYYY HH:MM:SS)
          // Format 2: "15-02-1910 03:37:00" (DD-MM-YYYY HH:MM:SS)
          // Format 3: "2025-08-02 15:37:00" (YYYY-MM-DD HH:MM:SS)
          
          const parts = dateTimeString.split(' ');
          if (parts.length === 2) {
            const [datePart, timePart] = parts;
            const dateComponents = datePart.split('-');
            
            if (dateComponents.length === 3) {
              let day, month, year;
              
              // Determine format based on first component length
              if (dateComponents[0].length === 4) {
                // Format: YYYY-MM-DD
                [year, month, day] = dateComponents;
              } else {
                // Format: DD-MM-YYYY
                [day, month, year] = dateComponents;
              }
              
              // Always use current year (2025) regardless of what the API returns
              const correctedYear = currentYear;
              const correctedMonth = month.padStart(2, '0');
              const correctedDay = day.padStart(2, '0');
              
              return `${correctedYear}-${correctedMonth}-${correctedDay} ${timePart}`;
            }
          }
          
          return dateTimeString;
        };
        
        // Fix years in all datetime fields
        if (data.panchang) {
          data.panchang.tithiStart = fixYearInDateTime(data.panchang.tithiStart);
          data.panchang.tithiTill = fixYearInDateTime(data.panchang.tithiTill);
          data.panchang.nakshatraStart = fixYearInDateTime(data.panchang.nakshatraStart);
          data.panchang.nakshatraTill = fixYearInDateTime(data.panchang.nakshatraTill);
          data.panchang.yogTill = fixYearInDateTime(data.panchang.yogTill);
          data.panchang.karanTill = fixYearInDateTime(data.panchang.karanTill);
        }
        
        return data;
      };

      // Helper function to format time for display
      const formatTimeForDisplay = (timeString: string): string => {
        if (!timeString) return '';
        
        // If it's already in the correct format, return as is
        if (timeString.includes('-') && timeString.includes(':')) {
          const [datePart, timePart] = timeString.split(' ');
          if (datePart && timePart) {
            const dateComponents = datePart.split('-');
            
            if (dateComponents.length === 3) {
              let day, month;
              
              // Determine format based on first component length
              if (dateComponents[0].length === 4) {
                // Format: YYYY-MM-DD
                [, month, day] = dateComponents;
              } else {
                // Format: DD-MM-YYYY
                [day, month] = dateComponents;
              }
              
              // Always use current year (2025) regardless of what the API returns
              const currentYear = new Date().getFullYear().toString();
              const correctedMonth = month.padStart(2, '0');
              const correctedDay = day.padStart(2, '0');
              
              return `${currentYear}-${correctedMonth}-${correctedDay} ${timePart}`;
            }
          }
        }
        
        return timeString;
      };

      // Fix incorrect years in the API response
      const fixedData = fixIncorrectYears(data);

      // Get enhanced data from Vedic Astro API
      let vedicAstroData = null;
      try {
        const vedicAstroResponse = await vedicAstroAPI.getPanchangData(targetDate, latitude, longitude);
        if (vedicAstroResponse.success && vedicAstroResponse.data) {
          vedicAstroData = vedicAstroResponse.data;
          console.log('✅ Vedic Astro data fetched successfully');
        }
      } catch (vedicError) {
        console.warn('⚠️ Vedic Astro API failed, continuing with primary data:', vedicError);
      }

      const panchangData: PanchangData = {
        tithi: fixedData.panchang.tithi || '',
        nakshatra: fixedData.panchang.nakshatra || '',
        yoga: fixedData.panchang.yoga || '',
        karana: fixedData.panchang.karana || '',
        rashi: fixedData.panchang.rashi || '',
        maasa: fixedData.panchang.maasa || '',
        paksha: fixedData.panchang.paksha || '',
        sunrise: fixedData.panchang.sunrise || '',
        sunset: fixedData.panchang.sunset || '',
        date: targetDate, // Use the exact requested date
        time: '06:00:00',
        location: `${latitude}, ${longitude}`,
        tithiTill: formatTimeForDisplay(fixedData.panchang.tithiTill),
        tithinum: fixedData.panchang.tithinum,
        tithiStart: formatTimeForDisplay(fixedData.panchang.tithiStart),
        nakshatraStart: formatTimeForDisplay(fixedData.panchang.nakshatraStart),
        nakshatraTill: formatTimeForDisplay(fixedData.panchang.nakshatraTill),
        yogaStart: formatTimeForDisplay(fixedData.panchang.yoga),
        yogaTill: formatTimeForDisplay(fixedData.panchang.yogTill),
        karanaStart: formatTimeForDisplay(fixedData.panchang.karana),
        karanaTill: formatTimeForDisplay(fixedData.panchang.karanTill),
        vaar: fixedData.panchang.vaar,
        vaar_number: fixedData.panchang.vaar_number,
        // Enhanced data from Vedic Astro API
        moonrise: vedicAstroData?.moonrise || '',
        moonset: vedicAstroData?.moonset || '',
        rahu_kalam: vedicAstroData?.rahu_kalam || '',
        gulika_kalam: vedicAstroData?.gulika_kalam || '',
        yamaganda_kalam: vedicAstroData?.yamaganda_kalam || '',
        abhijit_muhurta: vedicAstroData?.abhijit_muhurta || '',
        brahma_muhurta: vedicAstroData?.brahma_muhurta || '',
        sandhya_kal: vedicAstroData?.sandhya_kal || ''
      };

      // Cache the result
      this.setCache(targetDate, latitude, longitude, panchangData);

      console.log('✅ Enhanced Panchang data fetched successfully');
      return { success: true, data: panchangData };

    } catch (error) {
      console.error('❌ Error fetching Panchang data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Panchang data' 
      };
    }
  }

  async getPanchangGuidance(request: PanchangGuidanceRequest): Promise<PanchangGuidanceResponse> {
    try {
      const { question, date, time, timezone, latitude, longitude } = request;
      const questionLower = question.toLowerCase();
      const lat = latitude || 28.6139; // Default to Delhi
      const lng = longitude || 77.2090;
      
      // Define Tithi keywords for spelling correction - ALL 16 TITHIS
      const tithiKeywords = {
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
      
      // Define Tithi guidance for spiritual recommendations
      const tithiGuidance = {
        'pratipada': '🙏 Recommended: Pratipada rituals, new beginnings, and spiritual practices. First tithi after new/full moon.',
        'dwitiya': '🙏 Recommended: Dwitiya rituals, spiritual practices, and meditation. Second tithi.',
        'tritiya': '🙏 Recommended: Tritiya rituals, spiritual practices, and meditation. Third tithi.',
        'chaturthi': '🙏 Recommended: Chaturthi rituals, spiritual practices, and meditation. Fourth tithi.',
        'panchami': '🙏 Recommended: Panchami rituals, spiritual practices, and meditation. Fifth tithi.',
        'shashthi': '🙏 Recommended: Shashthi rituals, spiritual practices, and meditation. Sixth tithi.',
        'saptami': '🙏 Recommended: Saptami rituals, spiritual practices, and meditation. Seventh tithi.',
        'ashtami': '🙏 Recommended: Ashtami rituals, spiritual practices, and meditation. Eighth tithi.',
        'navami': '🙏 Recommended: Navami rituals, spiritual practices, and meditation. Ninth tithi.',
        'dashami': '🙏 Recommended: Dashami rituals, spiritual practices, and meditation. Tenth tithi.',
        'ekadashi': '🙏 Recommended: Ekadashi fasting, spiritual practices, and meditation. Eleventh tithi.',
        'dwadashi': '🙏 Recommended: Dwadashi rituals, spiritual practices, and meditation. Twelfth tithi.',
        'trayodashi': '🙏 Recommended: Trayodashi rituals, spiritual practices, and meditation. Thirteenth tithi.',
        'chaturdashi': '🙏 Recommended: Chaturdashi rituals, spiritual practices, and meditation. Fourteenth tithi.',
        'purnima': '🙏 Recommended: Purnima rituals, full moon meditation, and spiritual practices. Fifteenth tithi (full moon).',
        'amavasya': '🙏 Recommended: Amavasya rituals, ancestral offerings, and spiritual purification. New moon (also considered a tithi).'
      };
      
      // Enhanced date extraction with multiple formats
      let targetDate = date;
      
      // Multiple date format patterns
      const datePatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY
        /today/i,                          // "today"
        /tomorrow/i,                       // "tomorrow"
        /yesterday/i                       // "yesterday"
      ];
      
      for (const pattern of datePatterns) {
        const match = question.match(pattern);
        if (match) {
          if (pattern.source.includes('today')) {
            targetDate = new Date().toISOString().split('T')[0];
            break;
          } else if (pattern.source.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0];
            break;
          } else if (pattern.source.includes('yesterday')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday.toISOString().split('T')[0];
            break;
          } else {
            const [_, first, second, third] = match;
            // Determine format based on pattern
            if (pattern.source.includes('YYYY-MM-DD')) {
              targetDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
            } else {
              // Assume DD/MM/YYYY or DD-MM-YYYY
              targetDate = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
            }
            break;
          }
        }
      }
      
      // Validate the extracted date
      const isValidDate = (dateStr: string): boolean => {
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date.getTime());
      };
      
      if (!targetDate || !isValidDate(targetDate)) {
        console.log('⚠️ Invalid date extracted, using current date');
        targetDate = new Date().toISOString().split('T')[0];
      }
      
      // Handle "next" queries for ALL Tithis
      console.log('🔍 Checking for next Tithi queries...');
      for (const [keyword, tithiType] of Object.entries(tithiKeywords)) {
        if (question.includes(`next ${keyword}`)) {
          console.log(`🎯 Found "next ${keyword}" query, searching for next occurrence...`);
          const nextEvent = await this.findNextEvent(tithiType as any, lat, lng);
          if (nextEvent.success && nextEvent.event) {
            let response = `🕉️ Next ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Information:\n\n`;
            response += `📅 Date: ${formatDate(nextEvent.event.date)}\n`;
            response += `🕉️ Tithi: ${nextEvent.event.tithi}\n`;
            response += `⏰ Start: ${formatDateTime(nextEvent.event.startTime)}\n`;
            response += `⏰ End: ${formatDateTime(nextEvent.event.endTime)}\n`;
            response += `🌙 Paksha: ${nextEvent.event.paksha}\n`;
            response += `📅 Maasa: ${nextEvent.event.maasa}\n`;
            response += `📆 Varam: ${nextEvent.event.vaar}\n\n`;
            
            // Add spiritual guidance for this Tithi
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
        if (question.includes(keyword) && !question.includes('next')) {
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
              if (question.includes('krishna paksha')) {
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
              if (question.includes('maasa') || question.includes('month')) {
        const today = new Date().toISOString().split('T')[0];
        const panchangData = await this.getAccuratePanchangData(today, lat, lng);
        
        if (panchangData.success && panchangData.data) {
          let response = `📅 Current Maasa Information:\n\n`;
          response += `📅 Date: ${formatDate(panchangData.data.date)}\n`;
          response += `🕉️ Current Tithi: ${panchangData.data.tithi}\n`;
          response += `🌙 Current Paksha: ${panchangData.data.paksha}\n`;
          response += `📅 Maasa: ${panchangData.data.maasa}\n`;
          response += `📆 Varam: ${panchangData.data.vaar}\n\n`;
          
          response += `📖 **About ${panchangData.data.maasa} Maasa:**\n`;
          response += `• Each Hindu month has specific spiritual significance\n`;
          response += `• Different months are auspicious for different practices\n`;
          response += `• The current month influences the energy of your spiritual practices\n\n`;
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
              if (question.includes('varalakshmi') || question.includes('vratham')) {
        let response = `🕉️ Varalakshmi Vratham Information:\n\n`;
        response += `📅 **About Varalakshmi Vratham:**\n`;
        response += `• Varalakshmi Vratham is a sacred Hindu festival\n`;
        response += `• It is observed on the Friday before Purnima in the month of Shravana\n`;
        response += `• This vratham is dedicated to Goddess Lakshmi\n`;
        response += `• It is believed to bring prosperity and well-being to the family\n\n`;
        response += `🙏 **Rituals and Practices:**\n`;
        response += `• Wake up early and take a holy bath\n`;
        response += `• Decorate the house with rangoli and flowers\n`;
        response += `• Prepare special offerings to Goddess Lakshmi\n`;
        response += `• Perform the vratham with devotion and faith\n`;
        response += `• Distribute prasad to family and friends\n\n`;
        response += `💡 **Spiritual Significance:**\n`;
        response += `• This vratham is especially beneficial for married women\n`;
        response += `• It is believed to bring harmony and prosperity to the family\n`;
        response += `• The vratham should be performed with pure intentions\n`;
        response += `• Regular observance can bring lasting benefits`;
        
        return {
          success: true,
          guidance: response,
          panchang: undefined
        };
      }
      
      // Default: Get today's Panchang data
      console.log('📅 Getting today\'s Panchang data as default response');
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
        error: 'Unable to process your question. Please try asking about specific Tithis, dates, or spiritual topics.'
      };

    } catch (error) {
      console.error('❌ Error in getPanchangGuidance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Panchang guidance'
      };
    }
  }

  private generateGuidance(question: string, panchang: PanchangData): string {
    let response = `Panchang Information:\n\n`;
    response += `Date: ${formatDate(panchang.date)}\n`;
    response += `Tithi: ${panchang.tithi}\n`;
    response += `Nakshatra: ${panchang.nakshatra}\n`;
    response += `Paksha: ${panchang.paksha}\n`;
    response += `Maasa: ${panchang.maasa}\n`;
    response += `Varam: ${panchang.vaar}\n`;
    
    if (panchang.tithiStart && panchang.tithiTill) {
      response += `Tithi Start: ${formatDateTime(panchang.tithiStart)}\n`;
      response += `Tithi End: ${formatDateTime(panchang.tithiTill)}\n`;
    }
    
    if (panchang.nakshatraStart && panchang.nakshatraTill) {
      response += `Nakshatra Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
      response += `Nakshatra End: ${formatDateTime(panchang.nakshatraTill)}\n`;
    }
    
    if (panchang.sunrise && panchang.sunset) {
      response += `Sunrise: ${panchang.sunrise}\n`;
      response += `Sunset: ${panchang.sunset}\n`;
    }
    
    response += `Location: ${panchang.location}\n\n`;
    
    // Add spiritual guidance based on Tithi
    const tithiGuidance = {
      'Pratipada': 'Recommended: New beginnings, spiritual practices, and meditation. First tithi after new or full moon.',
      'Dwitiya': 'Recommended: Dwitiya rituals, spiritual practices, and meditation. Second tithi.',
      'Tritiya': 'Recommended: Tritiya rituals, spiritual practices, and meditation. Third tithi.',
      'Chaturthi': 'Recommended: Chaturthi rituals, spiritual practices, and meditation. Fourth tithi.',
      'Panchami': 'Recommended: Panchami rituals, spiritual practices, and meditation. Fifth tithi.',
      'Shashthi': 'Recommended: Shashthi rituals, spiritual practices, and meditation. Sixth tithi.',
      'Saptami': 'Recommended: Saptami rituals, spiritual practices, and meditation. Seventh tithi.',
      'Ashtami': 'Recommended: Ashtami rituals, spiritual practices, and meditation. Eighth tithi.',
      'Navami': 'Recommended: Navami rituals, spiritual practices, and meditation. Ninth tithi.',
      'Dashami': 'Recommended: Dashami rituals, spiritual practices, and meditation. Tenth tithi.',
      'Ekadashi': 'Recommended: Ekadashi fasting, spiritual practices, and meditation. Eleventh tithi.',
      'Dwadashi': 'Recommended: Dwadashi rituals, spiritual practices, and meditation. Twelfth tithi.',
      'Trayodashi': 'Recommended: Trayodashi rituals, spiritual practices, and meditation. Thirteenth tithi.',
      'Chaturdashi': 'Recommended: Chaturdashi rituals, spiritual practices, and meditation. Fourteenth tithi.',
      'Purnima': 'Recommended: Purnima rituals, full moon meditation, and spiritual practices. Fifteenth tithi, full moon.',
      'Amavasya': 'Recommended: Amavasya rituals, ancestral offerings, and spiritual purification. New moon.'
    };
    
    response += tithiGuidance[panchang.tithi as keyof typeof tithiGuidance] || 'Recommended: Spiritual practices and meditation.';
    response += `\n\nSpiritual tip: Use this time for meditation, prayer, and connecting with your inner self.`;
    
    return response;
  }

  // Generate visual version with icons for display
  private generateVisualGuidance(question: string, panchang: PanchangData): string {
    let response = `🕉️ Panchang Information:\n\n`;
    response += `📅 Date: ${formatDate(panchang.date)}\n`;
    response += `🕉️ Tithi: ${panchang.tithi}\n`;
    response += `⭐ Nakshatra: ${panchang.nakshatra}\n`;
    response += `🌙 Paksha: ${panchang.paksha}\n`;
    response += `📅 Maasa: ${panchang.maasa}\n`;
    response += `📆 Varam: ${panchang.vaar}\n`;
    
    if (panchang.tithiStart && panchang.tithiTill) {
      response += `⏰ Tithi Start: ${formatDateTime(panchang.tithiStart)}\n`;
      response += `⏰ Tithi End: ${formatDateTime(panchang.tithiTill)}\n`;
    }
    
    if (panchang.nakshatraStart && panchang.nakshatraTill) {
      response += `⭐ Nakshatra Start: ${formatDateTime(panchang.nakshatraStart)}\n`;
      response += `⭐ Nakshatra End: ${formatDateTime(panchang.nakshatraTill)}\n`;
    }
    
    if (panchang.sunrise && panchang.sunset) {
      response += `🌅 Sunrise: ${panchang.sunrise}\n`;
      response += `🌇 Sunset: ${panchang.sunset}\n`;
    }
    
    response += `📍 Location: ${panchang.location}\n\n`;
    
    // Add spiritual guidance based on Tithi
    const tithiGuidance = {
      'Pratipada': '🙏 Recommended: New beginnings, spiritual practices, and meditation. First tithi after new/full moon.',
      'Dwitiya': '🙏 Recommended: Dwitiya rituals, spiritual practices, and meditation. Second tithi.',
      'Tritiya': '🙏 Recommended: Tritiya rituals, spiritual practices, and meditation. Third tithi.',
      'Chaturthi': '🙏 Recommended: Chaturthi rituals, spiritual practices, and meditation. Fourth tithi.',
      'Panchami': '🙏 Recommended: Panchami rituals, spiritual practices, and meditation. Fifth tithi.',
      'Shashthi': '🙏 Recommended: Shashthi rituals, spiritual practices, and meditation. Sixth tithi.',
      'Saptami': '🙏 Recommended: Saptami rituals, spiritual practices, and meditation. Seventh tithi.',
      'Ashtami': '🙏 Recommended: Ashtami rituals, spiritual practices, and meditation. Eighth tithi.',
      'Navami': '🙏 Recommended: Navami rituals, spiritual practices, and meditation. Ninth tithi.',
      'Dashami': '🙏 Recommended: Dashami rituals, spiritual practices, and meditation. Tenth tithi.',
      'Ekadashi': '🙏 Recommended: Ekadashi fasting, spiritual practices, and meditation. Eleventh tithi.',
      'Dwadashi': '🙏 Recommended: Dwadashi rituals, spiritual practices, and meditation. Twelfth tithi.',
      'Trayodashi': '🙏 Recommended: Trayodashi rituals, spiritual practices, and meditation. Thirteenth tithi.',
      'Chaturdashi': '🙏 Recommended: Chaturdashi rituals, spiritual practices, and meditation. Fourteenth tithi.',
      'Purnima': '🙏 Recommended: Purnima rituals, full moon meditation, and spiritual practices. Fifteenth tithi (full moon).',
      'Amavasya': '🙏 Recommended: Amavasya rituals, ancestral offerings, and spiritual purification. New moon (also considered a tithi).'
    };
    
    response += tithiGuidance[panchang.tithi as keyof typeof tithiGuidance] || '🙏 Recommended: Spiritual practices and meditation.';
    response += `\n\n💡 Spiritual tip: Use this time for meditation, prayer, and connecting with your inner self.`;
    
    return response;
  }

  async getAccuratePanchangData(targetDate: string, latitude: number, longitude: number): Promise<PanchangResponse> {
    return this.getPanchangData(targetDate, latitude, longitude);
  }

  async findNextEvent(eventType: 'pratipada' | 'dwitiya' | 'tritiya' | 'chaturthi' | 'panchami' | 'shashthi' | 'saptami' | 'ashtami' | 'navami' | 'dashami' | 'ekadashi' | 'dwadashi' | 'trayodashi' | 'chaturdashi' | 'purnima' | 'amavasya', latitude: number, longitude: number): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      console.log(`🔍 Finding next ${eventType} event...`);
      
      // Check event cache first
      const eventCacheKey = `${eventType}_${latitude}_${longitude}`;
      const cachedEvent = this.eventCache.get(eventCacheKey);
      if (cachedEvent && Date.now() - cachedEvent.timestamp < this.eventCacheExpiry) {
        console.log('📦 Using cached event data');
        return { success: true, event: cachedEvent.event };
      }
      
      // Map event types to their Tithi numbers for efficient searching
      const tithiMap: Record<string, number> = {
        'pratipada': 1,
        'dwitiya': 2,
        'tritiya': 3,
        'chaturthi': 4,
        'panchami': 5,
        'shashthi': 6,
        'saptami': 7,
        'ashtami': 8,
        'navami': 9,
        'dashami': 10,
        'ekadashi': 11,
        'dwadashi': 12,
        'trayodashi': 13,
        'chaturdashi': 14,
        'purnima': 15,
        'amavasya': 30 // Special case for new moon
      };
      
      const targetTithiNum = tithiMap[eventType];
      if (!targetTithiNum) {
        return { success: false, error: `Invalid event type: ${eventType}` };
      }
      
      // Smart search algorithm: Get current Tithi and calculate approximate next occurrence
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const [year, month, day] = todayStr.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      console.log(`🔍 Getting current Tithi to calculate next ${eventType}...`);
      
      // Get current day's Panchang data
      const { data, error } = await supabase.functions.invoke('panchang-guidance', {
        body: {
          question: `What is the panchang for ${formattedDate}?`,
          date: formattedDate,
          time: '06:00:00',
          timezone: '5.5',
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          userId: this.userId,
          authCode: this.authCode
        }
      });

      if (error || !data || !data.panchang) {
        console.error('❌ Failed to get current Panchang data:', error || data?.error);
        return { success: false, error: 'Failed to get current Panchang data' };
      }

      const currentTithiNum = data.panchang.tithinum;
      const currentTithi = data.panchang.tithi;
      
      console.log(`📅 Current Tithi: ${currentTithi} (${currentTithiNum}), Target: ${eventType} (${targetTithiNum})`);
      
      // Calculate days to next occurrence
      let daysToAdd = 0;
      
      if (targetTithiNum === 30) { // Amavasya (new moon)
        // Amavasya occurs every ~29.5 days, so search around that interval
        daysToAdd = 29;
      } else if (targetTithiNum === 15) { // Purnima (full moon)
        // Purnima occurs every ~29.5 days, so search around that interval
        daysToAdd = 29;
      } else {
        // For regular Tithis, calculate based on current Tithi
        if (currentTithiNum <= targetTithiNum) {
          daysToAdd = targetTithiNum - currentTithiNum;
        } else {
          // Target Tithi is in next cycle (after Purnima/Amavasya)
          daysToAdd = (30 - currentTithiNum) + targetTithiNum;
        }
      }
      
      // Add some buffer days to ensure we find it
      daysToAdd = Math.max(daysToAdd - 2, 0); // Start 2 days earlier
      
      console.log(`🚀 Calculating next ${eventType} in approximately ${daysToAdd} days...`);
      
      // Search in a small window around the calculated date
      const searchStartDate = new Date(today);
      searchStartDate.setDate(searchStartDate.getDate() + daysToAdd);
      
      // Search in a 5-day window around the calculated date
      for (let i = 0; i < 5; i++) {
        const searchDate = new Date(searchStartDate);
        searchDate.setDate(searchDate.getDate() + i);
        
        const dateStr = searchDate.toISOString().split('T')[0];
        const [searchYear, searchMonth, searchDay] = dateStr.split('-');
        const searchFormattedDate = `${searchDay}/${searchMonth}/${searchYear}`;
        
        console.log(`🔍 Checking date: ${searchFormattedDate} for ${eventType}...`);
        
        try {
          const searchData = await supabase.functions.invoke('panchang-guidance', {
            body: {
              question: `What is the panchang for ${searchFormattedDate}?`,
              date: searchFormattedDate,
              time: '06:00:00',
              timezone: '5.5',
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              userId: this.userId,
              authCode: this.authCode
            }
          });

          if (searchData.error || !searchData.data || !searchData.data.panchang) {
            console.error('❌ Search API error:', searchData.error);
            continue;
          }

          const searchTithiNum = searchData.data.panchang.tithinum;
          const searchTithi = searchData.data.panchang.tithi;
          
          console.log(`📅 Date: ${searchFormattedDate}, Tithi: ${searchTithi} (${searchTithiNum})`);
          
          // Check if this is the target Tithi
          if (searchTithiNum === targetTithiNum || 
              (eventType === 'amavasya' && searchTithiNum === 30) ||
              (eventType === 'purnima' && searchTithiNum === 15)) {
            
            // Found the target Tithi!
            const eventData = {
              date: searchFormattedDate,
              tithi: searchData.data.panchang.tithi,
              nakshatra: searchData.data.panchang.nakshatra,
              paksha: searchData.data.panchang.paksha,
              maasa: searchData.data.panchang.maasa,
              vaar: searchData.data.panchang.vaar,
              startTime: searchData.data.panchang.tithiStart,
              endTime: searchData.data.panchang.tithiTill
            };

            console.log('✅ Next event found:', eventData);
            
            // Cache the event result
            this.eventCache.set(eventCacheKey, { event: eventData, timestamp: Date.now() });
            
            return { success: true, event: eventData };
          }
          
        } catch (error) {
          console.error(`❌ Error checking date ${searchFormattedDate}:`, error);
        }
      }
      
      return { success: false, error: `Could not find next ${eventType} in the calculated window` };

    } catch (error) {
      console.error('❌ Error finding next event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to find next event' 
      };
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      console.log('🔐 Validating Panchang API credentials...');
      
      // Use a simple test call to validate credentials
      const { data, error } = await supabase.functions.invoke('panchang-guidance', {
        body: {
          question: 'test',
          date: '27/07/2025',
          time: '06:00:00',
          timezone: '5.5',
          latitude: '28.6139',
          longitude: '77.2090',
          userId: this.userId,
          authCode: this.authCode
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return false;
      }

      if (!data || !data.panchang) {
        console.error('❌ Credential validation failed:', data?.error || 'Unknown error');
        return false;
      }

      console.log('✅ Credentials validated successfully');
      return true;

    } catch (error) {
      console.error('❌ Error validating credentials:', error);
      return false;
    }
  }
}

export const panchangAPI = new PanchangAPIService(); 