export interface VedicAstroPanchangData {
  date: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahu_kalam: string;
  gulika_kalam: string;
  yamaganda_kalam: string;
  abhijit_muhurta: string;
  brahma_muhurta: string;
  sandhya_kal: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface VedicAstroResponse {
  success: boolean;
  data?: VedicAstroPanchangData;
  error?: string;
}

class VedicAstroAPIService {
  private apiKey: string = '0bed219b-8acc-5194-81f9-51b86fe29a3b';
  private baseUrl: string = 'https://api.vedicastroapi.com/v3-json/panchang';
  private cache: Map<string, { data: VedicAstroPanchangData; timestamp: number }> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours cache expiry

  constructor() {
    // API key is already set
  }

  private getCacheKey(date: string, latitude: number, longitude: number): string {
    return `vedic_astro_${date}_${latitude}_${longitude}`;
  }

  private getFromCache(date: string, latitude: number, longitude: number): VedicAstroPanchangData | null {
    const key = this.getCacheKey(date, latitude, longitude);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📦 Using cached Vedic Astro data for:', date);
      return cached.data;
    }
    
    return null;
  }

  private setCache(date: string, latitude: number, longitude: number, data: VedicAstroPanchangData): void {
    const key = this.getCacheKey(date, latitude, longitude);
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log('💾 Cached Vedic Astro data for:', date);
  }

  async getPanchangData(date: string, latitude: number, longitude: number): Promise<VedicAstroResponse> {
    try {
      // Check cache first
      const cachedData = this.getFromCache(date, latitude, longitude);
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      console.log('🌐 Fetching Vedic Astro Panchang data...');
      
      // Convert YYYY-MM-DD to DD-MM-YYYY format for Vedic Astro API
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      
      // Try different endpoint formats
      const endpoints = [
        `${this.baseUrl}?api_key=${this.apiKey}&date=${formattedDate}&latitude=${latitude}&longitude=${longitude}&tz=5.5`,
        `${this.baseUrl}?api_key=${this.apiKey}&date=${formattedDate}&lat=${latitude}&lon=${longitude}&tzone=5.5`,
        `${this.baseUrl}?api_key=${this.apiKey}&date=${formattedDate}&lat=${latitude}&lon=${longitude}`,
        `${this.baseUrl}?api_key=${this.apiKey}&date=${formattedDate}`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 Trying endpoint:', endpoint);
          response = await fetch(endpoint);
          
          if (response.ok) {
            data = await response.json();
            if (data.success || data.data) {
              console.log('✅ Vedic Astro API endpoint found:', endpoint);
              break;
            }
          }
        } catch (error) {
          console.warn('⚠️ Endpoint failed:', endpoint, error);
          continue;
        }
      }

      if (!response || !response.ok || !data) {
        console.warn('⚠️ All Vedic Astro API endpoints failed, providing fallback data');
        // Return fallback data structure
        const fallbackData: VedicAstroPanchangData = {
          date: date,
          tithi: '',
          nakshatra: '',
          yoga: '',
          karana: '',
          sunrise: '',
          sunset: '',
          moonrise: '',
          moonset: '',
          rahu_kalam: '',
          gulika_kalam: '',
          yamaganda_kalam: '',
          abhijit_muhurta: '',
          brahma_muhurta: '',
          sandhya_kal: '',
          location: `${latitude}, ${longitude}`,
          latitude: latitude,
          longitude: longitude
        };

        return { success: true, data: fallbackData };
      }

      if (!data.success && !data.data) {
        throw new Error(data.message || 'Vedic Astro API returned error');
      }

      const panchangData: VedicAstroPanchangData = {
        date: date,
        tithi: data.data?.tithi || '',
        nakshatra: data.data?.nakshatra || '',
        yoga: data.data?.yoga || '',
        karana: data.data?.karana || '',
        sunrise: data.data?.sunrise || '',
        sunset: data.data?.sunset || '',
        moonrise: data.data?.moonrise || '',
        moonset: data.data?.moonset || '',
        rahu_kalam: data.data?.rahu_kalam || '',
        gulika_kalam: data.data?.gulika_kalam || '',
        yamaganda_kalam: data.data?.yamaganda_kalam || '',
        abhijit_muhurta: data.data?.abhijit_muhurta || '',
        brahma_muhurta: data.data?.brahma_muhurta || '',
        sandhya_kal: data.data?.sandhya_kal || '',
        location: `${latitude}, ${longitude}`,
        latitude: latitude,
        longitude: longitude
      };

      // Cache the result
      this.setCache(date, latitude, longitude, panchangData);

      console.log('✅ Vedic Astro Panchang data fetched successfully');
      return { success: true, data: panchangData };

    } catch (error) {
      console.error('❌ Error fetching Vedic Astro Panchang data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Vedic Astro Panchang data' 
      };
    }
  }

  // Get auspicious timings
  async getAuspiciousTimings(date: string, latitude: number, longitude: number): Promise<VedicAstroResponse> {
    try {
      const panchangData = await this.getPanchangData(date, latitude, longitude);
      
      if (!panchangData.success || !panchangData.data) {
        return panchangData;
      }

      // Extract auspicious timings
      const auspiciousData = {
        ...panchangData.data,
        auspicious_timings: {
          brahma_muhurta: panchangData.data.brahma_muhurta,
          abhijit_muhurta: panchangData.data.abhijit_muhurta,
          sandhya_kal: panchangData.data.sandhya_kal
        },
        inauspicious_timings: {
          rahu_kalam: panchangData.data.rahu_kalam,
          gulika_kalam: panchangData.data.gulika_kalam,
          yamaganda_kalam: panchangData.data.yamaganda_kalam
        }
      };

      return { success: true, data: auspiciousData as VedicAstroPanchangData };

    } catch (error) {
      console.error('❌ Error fetching auspicious timings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch auspicious timings' 
      };
    }
  }
}

export const vedicAstroAPI = new VedicAstroAPIService(); 