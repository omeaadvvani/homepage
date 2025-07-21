import { useState, useEffect, useCallback } from 'react';
import { panchangApi, type PanchangData, type PanchangApiResponse } from '../lib/panchang-api';

interface UsePanchangReturn {
  panchangData: PanchangData | null;
  loading: boolean;
  error: string | null;
  fetchPanchang: (date?: Date, latitude?: string, longitude?: string) => Promise<void>;
  fetchTodaysPanchang: (latitude?: string, longitude?: string) => Promise<void>;
  refreshPanchang: () => Promise<void>;
}

export const usePanchang = (): UsePanchangReturn => {
  const [panchangData, setPanchangData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPanchang = useCallback(async (
    date: Date = new Date(),
    latitude?: string,
    longitude?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const formattedDate = panchangApi.formatDateForApi(date);
      const formattedTime = panchangApi.formatTimeForApi(date);
      const timezone = panchangApi.getTimezoneOffset();

      const response: PanchangApiResponse = await panchangApi.getPanchang(
        formattedDate,
        formattedTime,
        timezone,
        latitude,
        longitude
      );

      if (response.error) {
        setError(response.error);
        setPanchangData(null);
      } else {
        setPanchangData(response.data);
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

  const fetchTodaysPanchang = useCallback(async (latitude?: string, longitude?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response: PanchangApiResponse = await panchangApi.getTodaysPanchang(latitude, longitude);

      if (response.error) {
        setError(response.error);
        setPanchangData(null);
      } else {
        setPanchangData(response.data);
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
      const date = new Date();
      const latitude = panchangData.reqlat;
      const longitude = panchangData.reqlon;
      await fetchPanchang(date, latitude, longitude);
    } else {
      await fetchTodaysPanchang();
    }
  }, [panchangData, fetchPanchang, fetchTodaysPanchang]);

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
  };
}; 