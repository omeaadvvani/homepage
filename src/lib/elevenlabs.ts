import { supabase } from './supabase';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  samples?: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export interface VoiceSettings {
  user_id: string;
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  }

  // Get user's voice settings from Supabase
  async getUserVoiceSettings(userId: string): Promise<VoiceSettings | null> {
    try {
      const { data, error } = await supabase
        .from('voice_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching voice settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching voice settings:', error);
      return null;
    }
  }

  // Save user's voice settings to Supabase
  async saveUserVoiceSettings(settings: VoiceSettings): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('voice_settings')
        .upsert(settings, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving voice settings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving voice settings:', error);
      return false;
    }
  }

  // Get available voices from ElevenLabs
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Get specific voice details
  async getVoice(voiceId: string): Promise<ElevenLabsVoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voice:', error);
      return null;
    }
  }

  // Convert text to speech
  async textToSpeech(request: TextToSpeechRequest): Promise<ArrayBuffer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_monolingual_v1',
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      return null;
    }
  }

  // Stream text to speech (for real-time applications)
  async streamTextToSpeech(
    request: TextToSpeechRequest,
    onChunk: (chunk: ArrayBuffer) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}/stream`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_monolingual_v1',
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(value);
      }

      onComplete();
    } catch (error) {
      console.error('Error in streaming text-to-speech:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Get default soothing female voice
  getDefaultSoothingVoice(): ElevenLabsVoice {
    return {
      voice_id: 'pjcYQlDFKMbcOUp6F5GD', // User's custom voice ID
      name: 'Sarah',
      category: 'custom',
      description: 'A warm, soothing female voice perfect for spiritual guidance',
      settings: {
        stability: 0.7,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    };
  }

  // Check if API key is valid
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
}

export const elevenLabsService = new ElevenLabsService(); 