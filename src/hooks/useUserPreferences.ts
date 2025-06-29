import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UserPreferences {
  id: string;
  user_id: string;
  email: string;
  language: string;
  calendar_type: string;
  location: string | null;
  notification_time: string | null;
  created_at: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setPreferences(data);
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      setError(err.message || 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  // Upsert user preferences (insert or update)
  const upsertPreferences = async (newPreferences: {
    language: string;
    calendar_type: string;
    location?: string | null;
    notification_time?: string | null;
  }) => {
    if (!user) {
      throw new Error('User must be logged in to save preferences');
    }

    try {
      setLoading(true);
      setError(null);

      // Get user email from auth session
      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }

      const { data, error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email: userEmail,
          ...newPreferences
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      setPreferences(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      const errorMessage = err.message || 'Failed to save preferences';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update specific preference fields
  const updatePreferences = async (updates: Partial<{
    language: string;
    calendar_type: string;
    location: string | null;
    notification_time: string | null;
  }>) => {
    if (!user || !preferences) {
      throw new Error('User must be logged in and have existing preferences');
    }

    try {
      setLoading(true);
      setError(null);

      // Include email in updates to ensure it's always current
      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }

      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          email: userEmail,
          ...updates
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPreferences(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      const errorMessage = err.message || 'Failed to update preferences';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete user preferences
  const deletePreferences = async () => {
    if (!user) {
      throw new Error('User must be logged in to delete preferences');
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setPreferences(null);
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting preferences:', err);
      const errorMessage = err.message || 'Failed to delete preferences';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch preferences when user changes
  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setError(null);
    }
  }, [user]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    upsertPreferences,
    updatePreferences,
    deletePreferences
  };
};