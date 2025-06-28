import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url' || 
    supabaseAnonKey === 'your_supabase_anon_key' ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey.includes('placeholder')) {
  console.error('Supabase environment variables are not properly configured.');
  console.error('Please connect to Supabase using the "Connect to Supabase" button.');
  
  // Create a dummy client to prevent crashes
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          pin_hash: string;
          calendar_tradition: string;
          preferred_language: string;
          selected_rituals: string[];
          notification_time: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          pin_hash?: string;
          calendar_tradition?: string;
          preferred_language?: string;
          selected_rituals?: string[];
          notification_time?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}