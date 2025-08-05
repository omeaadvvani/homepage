/**
 * Timezone utilities for Voice Vedic application
 * Handles timezone conversions and location-based time calculations
 */

export interface LocationInfo {
  latitude: number;
  longitude: number;
  timezone?: string;
  city?: string;
  country?: string;
}

export interface TimeInfo {
  localTime: string;
  utcTime: string;
  timezone: string;
  offset: number;
}

/**
 * Get timezone from coordinates using reverse geocoding
 */
export async function getTimezoneFromCoordinates(latitude: number, longitude: number): Promise<string> {
  try {
    // Use a timezone API to get timezone from coordinates
    const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${latitude}&lng=${longitude}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.zoneName || 'Asia/Kolkata'; // Default to India timezone
    }
  } catch (error) {
    console.log('Timezone API failed, using fallback:', error);
  }
  
  // Fallback: Determine timezone based on coordinates
  return getTimezoneFromCoordinatesFallback(latitude, longitude);
}

/**
 * Fallback timezone determination based on coordinates
 */
export function getTimezoneFromCoordinatesFallback(latitude: number, longitude: number): string {
  // India coordinates (approximate)
  if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
    return 'Asia/Kolkata';
  }
  
  // US coordinates (approximate)
  if (latitude >= 24 && latitude <= 71 && longitude >= -180 && longitude <= -66) {
    return 'America/New_York';
  }
  
  // UK coordinates (approximate)
  if (latitude >= 49 && latitude <= 61 && longitude >= -8 && longitude <= 2) {
    return 'Europe/London';
  }
  
  // Australia coordinates (approximate)
  if (latitude >= -44 && latitude <= -10 && longitude >= 113 && longitude <= 154) {
    return 'Australia/Sydney';
  }
  
  // Default to India timezone
  return 'Asia/Kolkata';
}

/**
 * Get current time in specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string = 'Asia/Kolkata'): TimeInfo {
  const now = new Date();
  const utcTime = now.toISOString();
  
  try {
    const localTime = now.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const offset = getTimezoneOffset(timezone);
    
    return {
      localTime,
      utcTime,
      timezone,
      offset
    };
  } catch (error) {
    console.error('Error getting timezone time:', error);
    // Fallback to UTC
    return {
      localTime: now.toLocaleString('en-US'),
      utcTime,
      timezone: 'UTC',
      offset: 0
    };
  }
}

/**
 * Get timezone offset in hours
 */
function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcTime = now.getTime();
  
  try {
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = localTime.getTime() - utcTime;
    return offsetMs / (1000 * 60 * 60);
  } catch (error) {
    console.error('Error calculating timezone offset:', error);
    return 0;
  }
}

/**
 * Format date in specified timezone
 */
export function formatDateInTimezone(date: Date, timezone: string = 'Asia/Kolkata'): string {
  try {
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    return date.toLocaleDateString('en-US');
  }
}

/**
 * Format time in specified timezone
 */
export function formatTimeInTimezone(date: Date, timezone: string = 'Asia/Kolkata'): string {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    return date.toLocaleTimeString('en-US', { hour12: true });
  }
}

/**
 * Get current day name in specified timezone
 */
export function getCurrentDayInTimezone(timezone: string = 'Asia/Kolkata'): string {
  const now = new Date();
  try {
    return now.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day in timezone:', error);
    return now.toLocaleDateString('en-US', { weekday: 'long' });
  }
}

/**
 * Convert UTC time to local timezone
 */
export function convertUTCToLocal(utcTime: string, timezone: string = 'Asia/Kolkata'): string {
  try {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error converting UTC to local:', error);
    return utcTime;
  }
}

/**
 * Get timezone info for location
 */
export async function getTimezoneInfo(location: LocationInfo): Promise<TimeInfo> {
  const timezone = location.timezone || await getTimezoneFromCoordinates(location.latitude, location.longitude);
  return getCurrentTimeInTimezone(timezone);
}

/**
 * Calculate sunrise/sunset times for location
 */
export function calculateSunTimes(latitude: number, longitude: number, date: Date = new Date()): {
  sunrise: string;
  sunset: string;
} {
  // Simplified calculation - in a real app, you'd use a proper astronomical library
  const timezone = getTimezoneFromCoordinatesFallback(latitude, longitude);
  
  // Approximate sunrise/sunset times based on latitude
  let sunriseHour = 6;
  let sunsetHour = 18;
  
  // Adjust based on latitude and season
  const month = date.getMonth();
  const isSummer = month >= 3 && month <= 8; // March to August
  
  if (latitude > 0) { // Northern hemisphere
    if (isSummer) {
      sunriseHour = 5;
      sunsetHour = 19;
    } else {
      sunriseHour = 7;
      sunsetHour = 17;
    }
  } else { // Southern hemisphere
    if (isSummer) {
      sunriseHour = 7;
      sunsetHour = 17;
    } else {
      sunriseHour = 5;
      sunsetHour = 19;
    }
  }
  
  const sunrise = new Date(date);
  sunrise.setHours(sunriseHour, 0, 0, 0);
  
  const sunset = new Date(date);
  sunset.setHours(sunsetHour, 0, 0, 0);
  
  return {
    sunrise: formatTimeInTimezone(sunrise, timezone),
    sunset: formatTimeInTimezone(sunset, timezone)
  };
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(timezone: string): string {
  const timezoneNames: Record<string, string> = {
    'Asia/Kolkata': 'Indian Standard Time (IST)',
    'America/New_York': 'Eastern Time (ET)',
    'Europe/London': 'Greenwich Mean Time (GMT)',
    'Australia/Sydney': 'Australian Eastern Time (AET)',
    'UTC': 'Coordinated Universal Time (UTC)'
  };
  
  return timezoneNames[timezone] || timezone;
} 