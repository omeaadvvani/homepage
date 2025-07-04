import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  pin_hash: string;
  calendar_tradition: string;
  preferred_language: string;
  selected_rituals: string[];
  notification_time: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        if (!isMounted) return;
        
        console.log("🔐 Getting initial auth session...");
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          return;
        }

        if (!isMounted) return;

        console.log("🔐 Initial session:", session ? "Found" : "None");
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("👤 User found, fetching profile...");
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error);
      } finally {
        if (isMounted) {
          console.log("🔐 Auth initialization complete");
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔄 Auth state changed:', event, session ? "Session exists" : "No session");
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log("👤 User authenticated, fetching profile...");
            await fetchUserProfile(session.user.id);
          } else {
            console.log("🚫 No user, clearing profile");
            setUserProfile(null);
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
        }
      }
    );

    return () => {
      isMounted = false;
      console.log("🔐 Auth hook cleanup");
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("📋 Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return;
      }

      console.log("📋 User profile:", data ? "Found" : "Not found");
      setUserProfile(data);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const signUp = async (email: string, pin: string) => {
    try {
      console.log("📝 Starting sign up for:", email);
      setLoading(true);

      // Create auth user with email and PIN as password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pin,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (authError) {
        console.error("❌ Sign up auth error:", authError);
        throw authError;
      }

      console.log("✅ Sign up successful:", authData.user ? "User created" : "No user");
      // Note: We don't create user_profiles here anymore
      // The preferences will be saved separately after sign-up

      return { data: authData, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pin: string) => {
    try {
      console.log("🔑 Starting sign in for:", email);
      setLoading(true);

      // Sign in with email and PIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pin
      });

      if (error) {
        console.error("❌ Sign in error:", error);
        throw error;
      }

      console.log("✅ Sign in successful");
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Starting sign out...");
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        // Don't throw error - still proceed with local cleanup
      }
      
      // Clear local state regardless of Supabase response
      console.log("🧹 Clearing local auth state");
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log("✅ Sign out complete");
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      // Even if there's an error, clear local state for UX
      console.log("🧹 Error recovery: clearing local state anyway");
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.log("❌ No user logged in for profile update");
      return { error: 'No user logged in' };
    }

    try {
      console.log("📝 Updating user profile:", updates);
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error("❌ Profile update error:", error);
        throw error;
      }

      console.log("✅ Profile updated successfully");
      await fetchUserProfile(user.id);
      return { error: null };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return { error };
    }
  };

  // Debug logging for auth state
  useEffect(() => {
    console.log("🔍 useAuth State:", {
      user: user ? { id: user.id, email: user.email } : null,
      userProfile: userProfile ? { id: userProfile.id, email: userProfile.email } : null,
      loading,
      hasSession: !!session
    });
  }, [user, userProfile, loading, session]);

  return {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchUserProfile
  };
};