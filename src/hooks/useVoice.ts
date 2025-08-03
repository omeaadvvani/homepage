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
  // Speech-to-Text state
  isListening: boolean;
  isProcessing: boolean;
  transcribedText: string;
  speechError: string | null;
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
    isLoading: false,
    // Speech-to-Text state
    isListening: false,
    isProcessing: false,
    transcribedText: '',
    speechError: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const recognitionRef = useRef<unknown>(null);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceState(prev => ({ 
        ...prev, 
        speechError: 'Speech recognition is not supported in this browser' 
      }));
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: true,
        speechError: null,
        transcribedText: ''
      }));
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setVoiceState(prev => ({ 
        ...prev, 
        transcribedText: finalTranscript || interimTranscript
      }));
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture error. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false,
        speechError: errorMessage
      }));
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, final transcript:', voiceState.transcribedText);
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false,
        // Keep the transcribed text for auto-processing
        transcribedText: prev.transcribedText
      }));
    };

    return true;
  }, []);

  // Start listening for speech
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      if (!initializeSpeechRecognition()) {
        return;
      }
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        speechError: 'Failed to start speech recognition' 
      }));
    }
  }, [initializeSpeechRecognition]);

  // Stop listening for speech
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Process speech input and get response
  const processSpeechInput = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setVoiceState(prev => ({ 
      ...prev, 
      isProcessing: true,
      currentText: text
    }));

    try {
      // Here you would call your API to get the response
      // For now, we'll simulate this with a simple response
      const response = `I heard you say: "${text}". This is a simulated response.`;
      
      // Speak the response
      await speakText(response);
      
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        transcribedText: ''
      }));
    } catch (error) {
      console.error('Error processing speech input:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to process speech input'
      }));
    }
  }, []);

  // Auto-process when transcription is complete
  useEffect(() => {
    if (voiceState.transcribedText && !voiceState.isListening && !voiceState.isProcessing) {
      // Removed auto-processing logic - let VoiceInterface handle it
      // This prevents conflicts between useVoice and VoiceInterface auto-processing
    }
  }, [voiceState.transcribedText, voiceState.isListening, voiceState.isProcessing]);

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
      setVoiceState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First try to get voices from ElevenLabs API
      const voices = await elevenLabsService.getVoices();
      
      // Create a more accurate and diverse voice list
      const curatedVoices: ElevenLabsVoice[] = [];
      
      // Add actual API voices if available
      if (voices && voices.length > 0) {
        // Filter for high-quality voices with Indian accents or soothing qualities
        const filteredVoices = voices.filter(voice => 
          voice.voice_id === 'pjcYQlDFKMbcOUp6F5GD' || // User's custom voice
          voice.name.toLowerCase().includes('priya') ||
          voice.name.toLowerCase().includes('meera') ||
          voice.name.toLowerCase().includes('anita') ||
          voice.name.toLowerCase().includes('kavya') ||
          voice.name.toLowerCase().includes('sarah') ||
          voice.name.toLowerCase().includes('emily') ||
          voice.name.toLowerCase().includes('anna') ||
          voice.name.toLowerCase().includes('lisa') ||
          voice.name.toLowerCase().includes('indian') ||
          voice.name.toLowerCase().includes('soft') ||
          voice.name.toLowerCase().includes('gentle') ||
          voice.category === 'premade'
        );
        
        curatedVoices.push(...filteredVoices);
      }

      // Add high-quality predefined Indian voices as fallback
      const predefinedIndianVoices: ElevenLabsVoice[] = [
        {
          voice_id: 'priya_indian_female_01',
          name: 'Priya (Indian Female - Soft)',
          category: 'custom',
          description: 'Gentle Indian female voice with spiritual warmth',
          labels: { accent: 'Indian', gender: 'female', style: 'spiritual' },
          settings: {
            stability: 0.75,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        },
        {
          voice_id: 'meera_indian_female_02',
          name: 'Meera (Indian Female - Melodic)',
          category: 'custom',
          description: 'Melodic Indian female voice with traditional warmth',
          labels: { accent: 'Indian', gender: 'female', style: 'traditional' },
          settings: {
            stability: 0.7,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true
          }
        },
        {
          voice_id: 'raj_indian_male_01',
          name: 'Raj (Indian Male - Wise)',
          category: 'custom',
          description: 'Wise Indian male voice with spiritual depth',
          labels: { accent: 'Indian', gender: 'male', style: 'spiritual' },
          settings: {
            stability: 0.8,
            similarity_boost: 0.7,
            style: 0.2,
            use_speaker_boost: true
          }
        },
        {
          voice_id: 'arun_indian_male_02',
          name: 'Arun (Indian Male - Gentle)',
          category: 'custom',
          description: 'Gentle Indian male voice with calming presence',
          labels: { accent: 'Indian', gender: 'male', style: 'gentle' },
          settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        },
        {
          voice_id: 'sarah_soothing_01',
          name: 'Sarah (Soothing English)',
          category: 'custom',
          description: 'Soothing English voice with spiritual warmth',
          labels: { accent: 'English', gender: 'female', style: 'soothing' },
          settings: {
            stability: 0.8,
            similarity_boost: 0.6,
            style: 0.2,
            use_speaker_boost: true
          }
        },
        {
          voice_id: 'emily_gentle_01',
          name: 'Emily (Gentle English)',
          category: 'custom',
          description: 'Gentle English voice with calming presence',
          labels: { accent: 'English', gender: 'female', style: 'gentle' },
          settings: {
            stability: 0.7,
            similarity_boost: 0.65,
            style: 0.25,
            use_speaker_boost: true
          }
        }
      ];

      // Combine API voices with predefined voices, avoiding duplicates
      const allVoices = [...curatedVoices];
      
      // Add predefined voices only if they don't conflict with API voices
      predefinedIndianVoices.forEach(predefinedVoice => {
        const exists = allVoices.some(voice => 
          voice.name.toLowerCase().includes(predefinedVoice.name.split(' ')[0].toLowerCase())
        );
        if (!exists) {
          allVoices.push(predefinedVoice);
        }
      });

      // Ensure we have at least one voice
      if (allVoices.length === 0) {
        const defaultVoice = elevenLabsService.getDefaultSoothingVoice();
        setVoiceState(prev => ({ 
          ...prev, 
          availableVoices: [defaultVoice],
          selectedVoice: defaultVoice,
          error: 'Using default voice - no voices available'
        }));
      } else {
        // Sort voices by quality and relevance
        const sortedVoices = allVoices.sort((a, b) => {
          // Prioritize Indian voices
          const aIsIndian = a.name.toLowerCase().includes('indian') || 
                           (a.labels?.accent === 'Indian');
          const bIsIndian = b.name.toLowerCase().includes('indian') || 
                           (b.labels?.accent === 'Indian');
          
          if (aIsIndian && !bIsIndian) return -1;
          if (!aIsIndian && bIsIndian) return 1;
          
          // Then sort by name
          return a.name.localeCompare(b.name);
        });

        setVoiceState(prev => ({ 
          ...prev, 
          availableVoices: sortedVoices,
          error: null
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
  const speakText = useCallback(async (text: string, voice?: ElevenLabsVoice, externalAudioRef?: React.RefObject<HTMLAudioElement>) => {
    console.log('🎤 speakText called with:', { text: text.substring(0, 50) + '...', voice: voice?.name, hasExternalRef: !!externalAudioRef });
    
    const selectedVoice = voice || voiceState.selectedVoice;
    if (!selectedVoice) {
      console.error('❌ No voice selected');
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'No voice selected' 
      }));
      return;
    }

    try {
      console.log('🔄 Setting loading state...');
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

      console.log('📡 Calling ElevenLabs API with voice ID:', selectedVoice.voice_id);
      const audioBuffer = await elevenLabsService.textToSpeech(request);
      
      if (audioBuffer) {
        console.log('✅ Received audio buffer, size:', audioBuffer.byteLength);
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        console.log('🔗 Created audio URL:', audioUrl);
        setVoiceState(prev => ({ 
          ...prev, 
          audioUrl,
          isLoading: false 
        }));

        // Play the audio using the provided audio ref or the internal one
        const audioElement = externalAudioRef?.current || audioRef.current;
        console.log('🎵 Audio element found:', !!audioElement);
        
        if (audioElement) {
          console.log('▶️ Playing audio...');
          audioElement.src = audioUrl;
          await audioElement.play();
          setVoiceState(prev => ({ ...prev, isPlaying: true }));
          console.log('✅ Audio playback started');
        } else {
          console.error('❌ No audio element found');
        }
      } else {
        console.error('❌ No audio buffer received');
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Failed to generate speech',
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('❌ Error in text-to-speech:', error);
      
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
    initializeSpeechRecognition();
  }, [loadUserVoiceSettings, loadAvailableVoices, initializeSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
    cleanupAudio,
    // Speech-to-Text methods
    startListening,
    stopListening,
    processSpeechInput
  };
}; 