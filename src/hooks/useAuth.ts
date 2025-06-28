import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState(false); // Changed to false to prevent infinite loading

  // Mock functions for now - will work without Supabase connection
  const signUp = async (email: string, pin: string, profileData: {
    calendar_tradition: string;
    preferred_language: string;
    selected_rituals: string[];
    notification_time: string;
    location?: string;
  }) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful response
      const mockUser = {
        id: 'mock-user-id',
        email,
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      setUserProfile({
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        email,
        pin_hash: 'hashed-pin',
        ...profileData,
        location: profileData.location || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { data: { user: mockUser }, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pin: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful response
      const mockUser = {
        id: 'mock-user-id',
        email,
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      setUserProfile({
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        email,
        pin_hash: 'hashed-pin',
        calendar_tradition: 'north-indian',
        preferred_language: 'English',
        selected_rituals: ['ekadashi'],
        notification_time: '07:00',
        location: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { data: { user: mockUser }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Mock update
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const fetchUserProfile = async (userId: string) => {
    // Mock function - does nothing for now
    console.log('Fetching profile for user:', userId);
  };

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