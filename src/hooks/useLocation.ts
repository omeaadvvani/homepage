import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LocationData {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  accuracy?: number;
  timestamp: string;
  is_active: boolean;
}

export interface LocationState {
  currentLocation: LocationData | null;
  isTracking: boolean;
  error: string | null;
  accuracy: number | null;
  lastUpdate: Date | null;
}

export const useLocation = (userId?: string) => {
  const [locationState, setLocationState] = useState<LocationState>({
    currentLocation: null,
    isTracking: false,
    error: null,
    accuracy: null,
    lastUpdate: null
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  // Initialize location tracking
  const startLocationTracking = useCallback(async () => {
    if (!userId) {
      setLocationState(prev => ({ ...prev, error: 'User ID required for location tracking' }));
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationState(prev => ({ ...prev, error: 'Geolocation not supported by browser' }));
      return;
    }

    try {
      setLocationState(prev => ({ ...prev, isTracking: true, error: null }));

      // Get initial position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const locationData: LocationData = {
        user_id: userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_name: await getLocationName(position.coords.latitude, position.coords.longitude),
        accuracy: position.coords.accuracy || undefined,
        timestamp: new Date().toISOString(),
        is_active: true
      };

      // Save to Supabase
      await saveLocationToDatabase(locationData);

      setLocationState(prev => ({
        ...prev,
        currentLocation: locationData,
        accuracy: position.coords.accuracy,
        lastUpdate: new Date(),
        isTracking: true
      }));

      // Start watching for position changes
      const newWatchId = navigator.geolocation.watchPosition(
        async (position) => {
          const updatedLocationData: LocationData = {
            user_id: userId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_name: await getLocationName(position.coords.latitude, position.coords.longitude),
            accuracy: position.coords.accuracy || undefined,
            timestamp: new Date().toISOString(),
            is_active: true
          };

          // Save to Supabase
          await saveLocationToDatabase(updatedLocationData);

          setLocationState(prev => ({
            ...prev,
            currentLocation: updatedLocationData,
            accuracy: position.coords.accuracy,
            lastUpdate: new Date()
          }));
        },
        (error) => {
          console.error('Location watch error:', error);
          setLocationState(prev => ({
            ...prev,
            error: `Location tracking error: ${error.message}`,
            isTracking: false
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000 // Update every 30 seconds
        }
      );

      setWatchId(newWatchId);

    } catch (error) {
      console.error('Location tracking start error:', error);
      setLocationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start location tracking',
        isTracking: false
      }));
    }
  }, [userId]);

  // Stop location tracking
  const stopLocationTracking = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (userId) {
      // Mark location as inactive in database
      try {
        const { error } = await supabase
          .from('user_locations')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating location status:', error);
        }
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      }
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      currentLocation: null
    }));
  }, [watchId, userId]);

  // Get location name from coordinates
  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use a reliable geocoding service for precise location names
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (response.ok) {
        const data = await response.json();
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';
        
        // Return precise location name
        if (city && state) {
          return `${city}, ${state}, ${country}`;
        } else if (city) {
          return `${city}, ${country}`;
        } else if (state) {
          return `${state}, ${country}`;
        } else {
          return country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      } else {
        // Fallback to coordinate-based detection for major regions
        if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
          return 'India';
        } else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
          return 'United States';
        } else if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
          return 'Europe';
        } else {
          return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      }
    } catch (error) {
      console.warn('Geocoding failed, using fallback:', error);
      // Fallback to coordinate-based detection
      if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
        return 'India';
      } else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
        return 'United States';
      } else if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
        return 'Europe';
      } else {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }
  };

  // Save location to Supabase database
  const saveLocationToDatabase = async (locationData: LocationData) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: locationData.user_id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          location_name: locationData.location_name,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp,
          is_active: locationData.is_active
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving location to database:', error);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Subscribe to real-time location updates from other users
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time location update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const locationData = payload.new as LocationData;
            setLocationState(prev => ({
              ...prev,
              currentLocation: locationData,
              lastUpdate: new Date()
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...locationState,
    startLocationTracking,
    stopLocationTracking,
    getLocationName
  };
}; 