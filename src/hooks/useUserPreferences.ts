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
  timezone: string | null;
  device_type: string | null;
  is_active: boolean;
  updated_by_admin: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging for preferences state
  useEffect(() => {
    console.log("🔍 useUserPreferences State:", {
      user: user ? { id: user.id, email: user.email } : null,
      preferences: preferences ? { id: preferences.id, language: preferences.language, calendar: preferences.calendar_type } : null,
      loading,
      error
    });
  }, [user, preferences, loading, error]);

  // Detect device type
  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    
    if (isTablet) return 'Tablet';
    if (isMobile) return 'Mobile';
    return 'Desktop';
  };

  // Detect timezone
  const getTimezone = (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('⚠️ Could not detect timezone:', error);
      return 'UTC';
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!user) {
      console.log("🚫 No user for preferences fetch");
      return;
    }

    try {
      console.log("📋 Fetching user preferences for:", user.id);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true) // Only fetch active preferences
        .maybeSingle();

      if (fetchError) {
        console.error("❌ Preferences fetch error:", fetchError);
        throw fetchError;
      }

      console.log("📋 Preferences fetched:", data ? "Found" : "Not found");
      setPreferences(data);
    } catch (err: any) {
      console.error('❌ Error fetching preferences:', err);
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
      console.log("💾 Upserting preferences:", newPreferences);
      setLoading(true);
      setError(null);

      // Get user email from auth session
      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }

      // Auto-detect device and timezone
      const deviceType = getDeviceType();
      const timezone = getTimezone();

      console.log("🔧 Auto-detected:", { deviceType, timezone });

      const { data, error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email: userEmail,
          device_type: deviceType,
          timezone: timezone,
          is_active: true,
          updated_by_admin: false,
          ...newPreferences
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error("❌ Preferences upsert error:", upsertError);
        throw upsertError;
      }

      console.log("✅ Preferences upserted successfully");
      setPreferences(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('❌ Error saving preferences:', err);
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
    timezone: string | null;
    device_type: string | null;
  }>) => {
    if (!user || !preferences) {
      throw new Error('User must be logged in and have existing preferences');
    }

    try {
      console.log("📝 Updating preferences:", updates);
      setLoading(true);
      setError(null);

      // Include email in updates to ensure it's always current
      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('User email not found in session');
      }

      // Auto-update device type and timezone if not explicitly provided
      const finalUpdates = {
        email: userEmail,
        device_type: updates.device_type || getDeviceType(),
        timezone: updates.timezone || getTimezone(),
        updated_by_admin: false, // Always false for user updates
        ...updates
      };

      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update(finalUpdates)
        .eq('user_id', user.id)
        .eq('is_active', true) // Only update active preferences
        .select()
        .single();

      if (updateError) {
        console.error("❌ Preferences update error:", updateError);
        throw updateError;
      }

      console.log("✅ Preferences updated successfully");
      setPreferences(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('❌ Error updating preferences:', err);
      const errorMessage = err.message || 'Failed to update preferences';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Soft delete user preferences (set is_active to false)
  const deactivatePreferences = async () => {
    if (!user) {
      throw new Error('User must be logged in to deactivate preferences');
    }

    try {
      console.log("🔒 Deactivating preferences for:", user.id);
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ 
          is_active: false,
          updated_by_admin: false
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("❌ Preferences deactivation error:", updateError);
        throw updateError;
      }

      console.log("✅ Preferences deactivated successfully");
      setPreferences(null);
      return { error: null };
    } catch (err: any) {
      console.error('❌ Error deactivating preferences:', err);
      const errorMessage = err.message || 'Failed to deactivate preferences';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Hard delete user preferences (permanent deletion)
  const deletePreferences = async () => {
    if (!user) {
      throw new Error('User must be logged in to delete preferences');
    }

    try {
      console.log("🗑️ Deleting preferences for:", user.id);
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error("❌ Preferences deletion error:", deleteError);
        throw deleteError;
      }

      console.log("✅ Preferences deleted successfully");
      setPreferences(null);
      return { error: null };
    } catch (err: any) {
      console.error('❌ Error deleting preferences:', err);
      const errorMessage = err.message || 'Failed to delete preferences';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch preferences when user changes
  useEffect(() => {
    let isMounted = true;

    if (user && isMounted) {
      console.log("👤 User changed, fetching preferences");
      fetchPreferences();
    } else if (isMounted) {
      console.log("🚫 No user, clearing preferences");
      setPreferences(null);
      setError(null);
    }

    return () => {
      isMounted = false;
      console.log("🧹 useUserPreferences cleanup");
    };
  }, [user]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    upsertPreferences,
    updatePreferences,
    deactivatePreferences,
    deletePreferences
  };
};