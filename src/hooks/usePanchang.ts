import { useState, useEffect, useCallback } from 'react';
import { panchangAPI, type PanchangData, type PanchangResponse, type PanchangGuidanceRequest, type PanchangGuidanceResponse } from '../lib/panchang-api';

interface UsePanchangReturn {
  panchangData: PanchangData | null;
  loading: boolean;
  error: string | null;
  fetchPanchang: (date?: string, latitude?: number, longitude?: number) => Promise<void>;
  fetchTodaysPanchang: (latitude?: number, longitude?: number) => Promise<void>;
  refreshPanchang: () => Promise<void>;
  getPanchangGuidance: (request: PanchangGuidanceRequest) => Promise<PanchangGuidanceResponse>;
  getPanchangData: (date: string, latitude: number, longitude: number) => Promise<PanchangResponse>;
  validateCredentials: () => Promise<boolean>;
}

export const usePanchang = (): UsePanchangReturn => {
  const [panchangData, setPanchangData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPanchang = useCallback(async (
    date: string = new Date().toISOString().split('T')[0],
    latitude?: number,
    longitude?: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Default to Delhi coordinates if not provided
      const lat = latitude || 28.6139;
      const lon = longitude || 77.2090;

      const response: PanchangResponse = await panchangAPI.getPanchangData(date, lat, lon);

      if (!response.success) {
        setError(response.error || 'Failed to fetch Panchang data');
        setPanchangData(null);
      } else {
        setPanchangData(response.data || null);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Panchang data';
      setError(errorMessage);
      setPanchangData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodaysPanchang = useCallback(async (latitude?: number, longitude?: number) => {
    setLoading(true);
    setError(null);

    try {
      // Get today's date in user's local timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${year}-${month}-${day}`;
      
      console.log('📅 Today\'s date:', todayFormatted);
      
      const lat = latitude || 28.6139;
      const lon = longitude || 77.2090;

      const response: PanchangResponse = await panchangAPI.getPanchangData(todayFormatted, lat, lon);

      if (!response.success) {
        setError(response.error || 'Failed to fetch today\'s Panchang data');
        setPanchangData(null);
      } else {
        setPanchangData(response.data || null);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s Panchang data';
      setError(errorMessage);
      setPanchangData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPanchang = useCallback(async () => {
    if (panchangData) {
      // Extract coordinates from location string or use defaults
      const locationParts = panchangData.location.split(', ');
      const lat = parseFloat(locationParts[0]) || 28.6139;
      const lon = parseFloat(locationParts[1]) || 77.2090;
      await fetchPanchang(panchangData.date, lat, lon);
    } else {
      await fetchTodaysPanchang();
    }
  }, [panchangData, fetchPanchang, fetchTodaysPanchang]);

  const getPanchangGuidance = useCallback(async (request: PanchangGuidanceRequest): Promise<PanchangGuidanceResponse> => {
    try {
      const response = await panchangAPI.getPanchangGuidance(request);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Panchang guidance';
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // Auto-fetch today's Panchang data on mount
  useEffect(() => {
    fetchTodaysPanchang();
  }, [fetchTodaysPanchang]);

  return {
    panchangData,
    loading,
    error,
    fetchPanchang,
    fetchTodaysPanchang,
    refreshPanchang,
    getPanchangGuidance,
    getPanchangData: panchangAPI.getPanchangData.bind(panchangAPI),
    validateCredentials: panchangAPI.validateCredentials.bind(panchangAPI),
  };
}; 