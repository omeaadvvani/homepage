import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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