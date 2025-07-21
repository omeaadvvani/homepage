interface PanchangData {
  slon: number;
  mlon: number;
  tithinum: number;
  tithi: string;
  paksha: string;
  tithiStart: string;
  tithiTill: string;
  nakshatra_number: number;
  nakshatra: string;
  nakshatraStart: string;
  nakshatraTill: string;
  yoga: string;
  yogTill: string;
  karana: string;
  karanTill: string;
  rashi: string;
  sunrise: string;
  sunset: string;
  maasa: string;
  requestsremaining: number;
  requeststotal: number;
  plan: string;
  status: string;
  reqdate: string;
  reqtime: string;
  reqtz: string;
  reqlat: string;
  reqlon: string;
}

interface PanchangApiResponse {
  data: PanchangData;
  error?: string;
}

class PanchangApiService {
  private baseUrl = 'https://api.panchang.click/v0.4';
  private userId: string;
  private authCode: string;

  constructor() {
    // These should be set in your environment variables
    this.userId = import.meta.env.VITE_PANCHANG_USER_ID || '';
    this.authCode = import.meta.env.VITE_PANCHANG_AUTH_CODE || '';
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<PanchangApiResponse> {
    try {
      // Add required authentication parameters
      const queryParams = new URLSearchParams({
        ...params,
        userid: this.userId,
        authcode: this.authCode
      });

      const url = `${this.baseUrl}/${endpoint}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`API error: ${data.status}`);
      }

      return { data };
    } catch (error) {
      console.error('Panchang API error:', error);
      return {
        data: {} as PanchangData,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getPanchang(
    date: string, // Format: DD/MM/YYYY
    time: string, // Format: HH:MM:SS
    timezone: string, // Format: +5.5 (decimal hours)
    latitude?: string,
    longitude?: string
  ): Promise<PanchangApiResponse> {
    const params: Record<string, string> = {
      date,
      time,
      tz: timezone
    };

    if (latitude && longitude) {
      params.lat = latitude;
      params.lon = longitude;
    }

    return this.makeRequest('panchangapip1', params);
  }

  async getTodaysPanchang(latitude?: string, longitude?: string): Promise<PanchangApiResponse> {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const timezone = (now.getTimezoneOffset() / -60).toString(); // Convert to decimal hours

    return this.getPanchang(date, time, timezone, latitude, longitude);
  }

  // Helper method to format date for API
  formatDateForApi(date: Date): string {
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  // Helper method to format time for API
  formatTimeForApi(date: Date): string {
    return date.toTimeString().split(' ')[0]; // HH:MM:SS format
  }

  // Helper method to get timezone offset
  getTimezoneOffset(): string {
    return (new Date().getTimezoneOffset() / -60).toString();
  }
}

export const panchangApi = new PanchangApiService();
export type { PanchangData, PanchangApiResponse }; 