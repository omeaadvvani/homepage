import { useState, useEffect, useCallback, useRef } from 'react';
import { elevenLabsService, ElevenLabsVoice, VoiceSettings, TextToSpeechRequest } from '../lib/elevenlabs';
import { useAuth } from './useAuth';

export interface VoiceState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  error: string | null;
  audioUrl: string | null;
  availableVoices: ElevenLabsVoice[];
  selectedVoice: ElevenLabsVoice | null;
  userSettings: VoiceSettings | null;
  isLoading: boolean;
}

export const useVoice = () => {
  const { user } = useAuth();
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isPlaying: false,
    isPaused: false,
    currentText: '',
    error: null,
    audioUrl: null,
    availableVoices: [],
    selectedVoice: null,
    userSettings: null,
    isLoading: false
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  // Load user's voice settings
  const loadUserVoiceSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setVoiceState(prev => ({ ...prev, isLoading: true }));
      const settings = await elevenLabsService.getUserVoiceSettings(user.id);
      
      if (settings) {
        setVoiceState(prev => ({ 
          ...prev, 
          userSettings: settings,
          selectedVoice: {
            voice_id: settings.voice_id,
            name: settings.voice_name,
            category: 'custom',
            settings: {
              stability: settings.stability,
              similarity_boost: settings.similarity_boost,
              style: settings.style,
              use_speaker_boost: settings.use_speaker_boost
            }
          }
        }));
      } else {
        // Use default soothing voice if no settings found
        const defaultVoice = elevenLabsService.getDefaultSoothingVoice();
        setVoiceState(prev => ({ 
          ...prev, 
          selectedVoice: defaultVoice 
        }));
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to load voice settings' 
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  // Load available voices
  const loadAvailableVoices = useCallback(async () => {
    try {
      setVoiceState(prev => ({ ...prev, isLoading: true }));
      const voices = await elevenLabsService.getVoices();
      
      // Filter for soothing female voices and include user's custom voice
      const soothingVoices = voices.filter(voice => 
        voice.voice_id === 'pjcYQlDFKMbcOUp6F5GD' || // User's custom voice
        voice.name.toLowerCase().includes('sarah') ||
        voice.name.toLowerCase().includes('emily') ||
        voice.name.toLowerCase().includes('anna') ||
        voice.name.toLowerCase().includes('lisa') ||
        voice.category === 'premade'
      );

      // If no voices found, use default voice
      if (soothingVoices.length === 0) {
        const defaultVoice = elevenLabsService.getDefaultSoothingVoice();
        setVoiceState(prev => ({ 
          ...prev, 
          availableVoices: [defaultVoice],
          selectedVoice: defaultVoice
        }));
      } else {
        setVoiceState(prev => ({ 
          ...prev, 
          availableVoices: soothingVoices 
        }));
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      // Use default voice on error
      const defaultVoice = elevenLabsService.getDefaultSoothingVoice();
      setVoiceState(prev => ({ 
        ...prev, 
        availableVoices: [defaultVoice],
        selectedVoice: defaultVoice,
        error: 'Failed to load voices, using default'
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save voice settings
  const saveVoiceSettings = useCallback(async (voice: ElevenLabsVoice) => {
    if (!user?.id) return false;

    try {
      const settings: VoiceSettings = {
        user_id: user.id,
        voice_id: voice.voice_id,
        voice_name: voice.name,
        stability: voice.settings?.stability || 0.5,
        similarity_boost: voice.settings?.similarity_boost || 0.5,
        style: voice.settings?.style || 0.0,
        use_speaker_boost: voice.settings?.use_speaker_boost || true
      };

      const success = await elevenLabsService.saveUserVoiceSettings(settings);
      
      if (success) {
        setVoiceState(prev => ({ 
          ...prev, 
          userSettings: settings,
          selectedVoice: voice 
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving voice settings:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to save voice settings' 
      }));
      return false;
    }
  }, [user?.id]);

  // Convert text to speech
  const speakText = useCallback(async (text: string, voice?: ElevenLabsVoice) => {
    const selectedVoice = voice || voiceState.selectedVoice;
    if (!selectedVoice) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'No voice selected' 
      }));
      return;
    }

    try {
      setVoiceState(prev => ({ 
        ...prev, 
        isLoading: true,
        error: null,
        currentText: text 
      }));

      const request: TextToSpeechRequest = {
        text,
        voice_id: selectedVoice.voice_id,
        voice_settings: selectedVoice.settings
      };

      const audioBuffer = await elevenLabsService.textToSpeech(request);
      
      if (audioBuffer) {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        setVoiceState(prev => ({ 
          ...prev, 
          audioUrl,
          isLoading: false 
        }));

        // Play the audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setVoiceState(prev => ({ ...prev, isPlaying: true }));
        }
      } else {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Failed to generate speech',
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      
      // Handle specific ElevenLabs errors
      let errorMessage = 'Failed to convert text to speech';
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMessage = 'ElevenLabs rate limit exceeded. Please try again in a moment or check your API key.';
        } else if (error.message.includes('401')) {
          errorMessage = 'ElevenLabs API key is invalid. Please check your configuration.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setVoiceState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
    }
  }, [voiceState.selectedVoice]);

  // Stream text to speech (for real-time applications)
  const streamTextToSpeech = useCallback(async (
    text: string, 
    voice?: ElevenLabsVoice
  ) => {
    const selectedVoice = voice || voiceState.selectedVoice;
    if (!selectedVoice) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'No voice selected' 
      }));
      return;
    }

    try {
      setVoiceState(prev => ({ 
        ...prev, 
        isLoading: true,
        error: null,
        currentText: text 
      }));

      // Create MediaSource for streaming
      const mediaSource = new MediaSource();
      const audioUrl = URL.createObjectURL(mediaSource);
      mediaSourceRef.current = mediaSource;

      mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        sourceBufferRef.current = sourceBuffer;

        const request: TextToSpeechRequest = {
          text,
          voice_id: selectedVoice.voice_id,
          voice_settings: selectedVoice.settings
        };

        elevenLabsService.streamTextToSpeech(
          request,
          (chunk) => {
            // Append audio chunk to source buffer
            if (sourceBuffer && !sourceBuffer.updating) {
              sourceBuffer.appendBuffer(chunk);
            }
          },
          () => {
            // Streaming complete
            if (mediaSource.readyState === 'open') {
              mediaSource.endOfStream();
            }
            setVoiceState(prev => ({ 
              ...prev, 
              isLoading: false,
              audioUrl 
            }));
          },
          (error) => {
            setVoiceState(prev => ({ 
              ...prev, 
              error,
              isLoading: false 
            }));
          }
        );
      });

      setVoiceState(prev => ({ 
        ...prev, 
        audioUrl,
        isPlaying: true 
      }));

    } catch (error) {
      console.error('Error in streaming text-to-speech:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to stream text to speech',
        isLoading: false 
      }));
    }
  }, [voiceState.selectedVoice]);

  // Control audio playback
  const playAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setVoiceState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setVoiceState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setVoiceState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false 
      }));
    }
  }, []);

  // Cleanup audio resources
  const cleanupAudio = useCallback(() => {
    if (voiceState.audioUrl) {
      URL.revokeObjectURL(voiceState.audioUrl);
    }
    if (mediaSourceRef.current) {
      mediaSourceRef.current = null;
    }
    if (sourceBufferRef.current) {
      sourceBufferRef.current = null;
    }
  }, [voiceState.audioUrl]);

  // Initialize voice settings and available voices
  useEffect(() => {
    loadUserVoiceSettings();
    loadAvailableVoices();
  }, [loadUserVoiceSettings, loadAvailableVoices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    ...voiceState,
    speakText,
    streamTextToSpeech,
    playAudio,
    pauseAudio,
    stopAudio,
    saveVoiceSettings,
    loadAvailableVoices,
    loadUserVoiceSettings,
    cleanupAudio
  };
}; 