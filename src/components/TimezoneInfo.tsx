import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Globe } from 'lucide-react';
import { 
  getCurrentTimeInTimezone, 
  getTimezoneDisplayName,
  getTimezoneFromCoordinatesFallback,
  LocationInfo,
  TimeInfo
} from '../lib/timezone-utils';

interface TimezoneInfoProps {
  location?: LocationInfo;
  className?: string;
}

export const TimezoneInfo: React.FC<TimezoneInfoProps> = ({ location, className = '' }) => {
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      try {
        let timezone = 'America/Vancouver'; // Default to Vancouver for user's location
        
        if (location && location.latitude && location.longitude) {
          // Use the user's actual location to determine timezone
          timezone = getTimezoneFromCoordinatesFallback(location.latitude, location.longitude);
          console.log('📍 Using timezone for location:', timezone, 'at', location.latitude, location.longitude);
        } else {
          console.log('📍 No location provided, using default timezone:', timezone);
        }
        
        const currentTime = getCurrentTimeInTimezone(timezone);
        setTimeInfo(currentTime);
        setLoading(false);
      } catch (error) {
        console.error('Error getting timezone info:', error);
        setLoading(false);
      }
    };

    updateTime();
    
    // Update time every minute
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [location]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <Clock className="w-4 h-4" />
        <span>Loading timezone...</span>
      </div>
    );
  }

  if (!timeInfo) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <Clock className="w-4 h-4" />
        <span>Time unavailable</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <Clock className="w-4 h-4 text-blue-600" />
      <span className="font-medium">{timeInfo.localTime}</span>
      <Globe className="w-4 h-4 text-green-600" />
      <span className="text-gray-600">
        {getTimezoneDisplayName(timeInfo.timezone)}
      </span>
      {location && (
        <>
          <MapPin className="w-4 h-4 text-red-600" />
          <span className="text-gray-600">
            {location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
          </span>
        </>
      )}
    </div>
  );
};

export default TimezoneInfo; 