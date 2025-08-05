import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Globe, 
  Calendar, 
  Clock, 
  MapPin, 
  Save, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  BookOpen,
  Bell,
  Moon,
  Volume2,
  Play,
  Pause,
  VolumeX
} from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useVoice } from '../hooks/useVoice';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  INDIAN_VOICE_SAMPLES, 
  VoiceSample, 
  playVoiceSample, 
  playVoiceSampleWithResponsiveVoice,
  getVoiceSamplesByGender 
} from '../lib/voice-utils';

interface PreferencesScreenProps {
  onComplete: () => void;
  onBack?: () => void;
  detectedLocation?: string;
}

const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ 
  onComplete, 
  onBack, 
  detectedLocation = 'Mumbai, India' 
}) => {
  const [language, setLanguage] = useState('English');
  const [calendarType, setCalendarType] = useState('north-indian');
  const [selectedRituals, setSelectedRituals] = useState<string[]>([]);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [showSacredText, setShowSacredText] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [samplingVoiceId, setSamplingVoiceId] = useState<string>('');
  const [voiceSampleError, setVoiceSampleError] = useState<string>('');
  const [voiceSampleSuccess, setVoiceSampleSuccess] = useState<string>('');
  const [selectedIndianVoice, setSelectedIndianVoice] = useState<VoiceSample | null>(null);
  const [isPlayingIndianVoice, setIsPlayingIndianVoice] = useState(false);

  const { upsertPreferences, loading } = useUserPreferences();
  const { 
    availableVoices, 
    selectedVoice, 
    speakText, 
    stopAudio, 
    isPlaying,
    loadAvailableVoices
  } = useVoice();

  const { user } = useAuth();

  // Create local audio ref for voice samples
  const audioRef = useRef<HTMLAudioElement>(null);

  const languages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'
  ];

  const calendarOptions = [
    {
      id: 'north-indian',
      name: 'North Indian (Drik Panchang)',
      icon: Calendar,
      description: 'Traditional Vedic calendar system'
    },
    {
      id: 'tamil',
      name: 'Tamil Calendar',
      icon: BookOpen,
      description: 'Tamil traditional calendar'
    },
    {
      id: 'telugu',
      name: 'Telugu Panchangam',
      icon: Calendar,
      description: 'Telugu traditional calendar'
    },
    {
      id: 'iskcon',
      name: 'ISKCON / Vaishnava Calendar',
      icon: BookOpen,
      description: 'Vaishnava spiritual calendar'
    },
    {
      id: 'kalnirnay',
      name: 'Kalnirnay',
      icon: Calendar,
      description: 'Popular Marathi calendar system'
    }
  ];

  const ritualOptions = [
    {
      id: 'ekadashi',
      name: 'Ekadashi',
      icon: Moon,
      description: 'Sacred fasting days'
    },
    {
      id: 'amavasya-pournami',
      name: 'Amavasya / Pournami',
      icon: Moon,
      description: 'New moon and full moon days'
    },
    {
      id: 'pradosham',
      name: 'Pradosham',
      icon: Moon,
      description: 'Auspicious evening prayers'
    },
    {
      id: 'rahukalam',
      name: 'Rahukalam / Yamagandam',
      icon: AlertCircle,
      description: 'Inauspicious time periods'
    },
    {
      id: 'festivals',
      name: 'Festival Alerts',
      icon: Bell,
      description: 'Major spiritual festivals'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setIsLanguageDropdownOpen(false);
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    const selectedVoice = indianVoiceSamples.find(v => v.id === voiceId);
    if (selectedVoice) {
      setSelectedIndianVoice(selectedVoice);
    }
  };

  const handleVoiceSample = async (voiceId: string) => {
    const voiceSample = indianVoiceSamples.find(v => v.id === voiceId);
    if (!voiceSample) return;

    setSamplingVoiceId(voiceId);
    setVoiceSampleError('');
    setVoiceSampleSuccess('');

    try {
      await playVoiceSample(voiceSample);
      setVoiceSampleSuccess(`Voice sample played successfully for ${voiceSample.name}`);
    } catch (error) {
      console.error('Voice sample error:', error);
      setVoiceSampleError('Failed to play voice sample. Please try again.');
    } finally {
      setSamplingVoiceId('');
    }
  };

  // Fallback voice sample using Web Speech API
  const playVoiceSampleWithWebSpeech = async (text: string, voice: any) => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!('speechSynthesis' in window)) {
          reject(new Error('Speech synthesis not supported'));
          return;
        }

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice properties based on the selected voice
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a matching voice in the browser's available voices
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.toLowerCase().includes('indian') || 
          v.lang.includes('en-IN') ||
          v.lang.includes('en-GB')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          console.log('✅ Web Speech API sample completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('❌ Web Speech API error:', event);
          reject(new Error('Speech synthesis failed'));
        };

        window.speechSynthesis.speak(utterance);
        
        // Set a timeout to resolve if speech doesn't end properly
        setTimeout(() => {
          window.speechSynthesis.cancel();
          resolve();
        }, 10000); // 10 second timeout
        
      } catch (error) {
        console.error('❌ Web Speech API error:', error);
        reject(error);
      }
    });
  };

  // Enhanced voice sample with multiple fallback options
  const playVoiceSampleWithFallbacks = async (text: string, voice: any) => {
    // Try multiple TTS services in order of preference
    const ttsServices = [
      { name: 'ElevenLabs', method: () => speakText(text, voice, audioRef) },
      { name: 'Web Speech API', method: () => playVoiceSampleWithWebSpeech(text, voice) },
      { name: 'Free TTS API', method: () => playVoiceSampleWithFreeTTS(text, voice) }
    ];

    for (const service of ttsServices) {
      try {
        console.log(`🎤 Trying ${service.name}...`);
        await service.method();
        console.log(`✅ ${service.name} succeeded`);
        return;
      } catch (error) {
        console.error(`❌ ${service.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All TTS services failed');
  };

  // Free TTS API fallback using ResponsiveVoice or similar
  const playVoiceSampleWithFreeTTS = async (text: string, voice: any) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Use ResponsiveVoice if available (free TTS service)
        if (typeof (window as any).responsiveVoice !== 'undefined') {
          const responsiveVoice = (window as any).responsiveVoice;
          
          // Map voice characteristics to ResponsiveVoice voices
          let voiceName = 'UK English Female';
          if (voice.labels?.gender?.toLowerCase() === 'male') {
            voiceName = 'UK English Male';
          }
          if (voice.name.toLowerCase().includes('indian') || voice.labels?.accent?.toLowerCase().includes('indian')) {
            voiceName = 'Indian English Female';
          }
          
          responsiveVoice.speak(text, voiceName, {
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0,
            onend: () => {
              console.log('✅ Free TTS sample completed');
              resolve();
            },
            onerror: () => {
              reject(new Error('Free TTS failed'));
            }
          });
        } else {
          // Fallback to basic Web Speech with Indian accent
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-IN';
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onend = () => resolve();
          utterance.onerror = () => reject(new Error('Basic TTS failed'));
          
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Load available voices on component mount
  useEffect(() => {
    loadAvailableVoices();
    
    // Also load browser voices for fallback
    if ('speechSynthesis' in window) {
      // Load voices if not already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('🎤 Browser voices loaded:', window.speechSynthesis.getVoices().length);
        };
      }
    }
  }, [loadAvailableVoices]);

  // Set initial selected voice
  useEffect(() => {
    if (selectedVoice && !selectedVoiceId) {
      setSelectedVoiceId(selectedVoice.voice_id);
    }
  }, [selectedVoice, selectedVoiceId]);

  // Clear sampling state when audio stops
  useEffect(() => {
    if (!isPlaying && samplingVoiceId) {
      setSamplingVoiceId('');
    }
  }, [isPlaying, samplingVoiceId]);

  // Keyboard shortcut to stop voice sample playback
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPlaying) {
        stopAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stopAudio]);

  // const handleCalendarSelect = (selectedCalendar: string) => {
  //   setCalendarType(selectedCalendar);
  //   setIsCalendarDropdownOpen(false);
  // };

  const handleRitualToggle = (ritualId: string) => {
    setSelectedRituals(prev => 
      prev.includes(ritualId) 
        ? prev.filter(id => id !== ritualId)
        : [...prev, ritualId]
    );
  };

  const selectedCalendarOption = calendarOptions.find(option => option.id === calendarType);

  const handleSavePreferences = async () => {
    try {
      setSaveError('');
      setSaveSuccess(false);

      // Save user preferences
      const { error: preferencesError } = await upsertPreferences({
        language,
        calendar_type: selectedCalendarOption?.name || 'North Indian (Drik Panchang)',
        location: detectedLocation,
        notification_time: notificationTime
      });

      if (preferencesError) {
        setSaveError(preferencesError);
        return;
      }

      // Save voice settings if a voice is selected
      if (selectedVoiceId) {
        const selectedVoice = availableVoices.find(v => v.voice_id === selectedVoiceId);
        if (selectedVoice) {
          const { error: voiceError } = await supabase
            .from('voice_settings')
            .upsert({
              user_id: user?.id,
              voice_id: selectedVoice.voice_id,
              voice_name: selectedVoice.name,
              stability: selectedVoice.settings?.stability || 0.5,
              similarity_boost: selectedVoice.settings?.similarity_boost || 0.5,
              style: selectedVoice.settings?.style || 0.0,
              use_speaker_boost: selectedVoice.settings?.use_speaker_boost || true
            }, {
              onConflict: 'user_id'
            });

          if (voiceError) {
            console.error('Error saving voice settings:', voiceError);
            // Don't fail the entire save if voice settings fail
          }
        }
      }

      setSaveSuccess(true);
      
      // Show success message briefly, then complete
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setSaveError(errorMessage);
    }
  };

  const isFormValid = language && calendarType && selectedRituals.length > 0 && selectedVoiceId;

  // Enhanced validation with detailed feedback
  const getValidationStatus = () => {
    const issues = [];
    
    if (!language) issues.push('Please select a language');
    if (!calendarType) issues.push('Please select a calendar type');
    if (selectedRituals.length === 0) issues.push('Please select at least one ritual');
    if (!selectedVoiceId) issues.push('Please select a voice assistant');
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const validationStatus = getValidationStatus();

  // Play Indian voice sample
  const playIndianVoiceSample = async (voiceSample: VoiceSample) => {
    console.log('🎤 Playing Indian voice sample:', voiceSample.name);
    setIsPlayingIndianVoice(true);
    setVoiceSampleError('');
    setVoiceSampleSuccess(`Playing ${voiceSample.name} (${voiceSample.gender}, ${voiceSample.accent} accent)...`);
    
    try {
      // Try ResponsiveVoice first, then fallback to Web Speech API
      try {
        await playVoiceSampleWithResponsiveVoice(voiceSample);
        setVoiceSampleSuccess(`✅ ${voiceSample.name} sample completed successfully`);
      } catch (responsiveVoiceError) {
        console.log('ResponsiveVoice failed, trying Web Speech API...');
        await playVoiceSample(voiceSample);
        setVoiceSampleSuccess(`✅ ${voiceSample.name} sample completed (using browser voice)`);
      }
    } catch (error) {
      console.error('❌ Indian voice sample failed:', error);
      setVoiceSampleError(`Failed to play ${voiceSample.name} sample. Please try again.`);
      setVoiceSampleSuccess('');
    } finally {
      setIsPlayingIndianVoice(false);
      
      // Clear notifications after delay
      setTimeout(() => {
        setVoiceSampleSuccess('');
        setVoiceSampleError('');
      }, 3000);
    }
  };

  // Handle Indian voice selection
  const handleIndianVoiceSelect = (voiceSample: VoiceSample) => {
    setSelectedIndianVoice(voiceSample);
    setSelectedVoiceId(voiceSample.id);
  };

  // Get Indian voice samples only
  const indianVoiceSamples = INDIAN_VOICE_SAMPLES;
  const indianFemaleVoices = getVoiceSamplesByGender('female');
  const indianMaleVoices = getVoiceSamplesByGender('male');

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-24 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-spiritual text-spiritual-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ lineHeight: '1.3' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start min-h-screen px-6 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-2xl mt-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-spiritual-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-spiritual-900 leading-spiritual tracking-spiritual">
              Create Your Account &
              <br />
              <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
                Personalize Your Journey
              </span>
            </h1>
          </div>
          
          <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
            Set up your spiritual preferences to get started.
          </p>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="w-full max-w-2xl mb-6 animate-slide-up">
            <div className="bg-green-50 border border-green-200 rounded-spiritual p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 tracking-spiritual">
                  Preferences saved successfully! Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="w-full max-w-2xl mb-6 animate-slide-up">
            <div className="bg-red-50 border border-red-200 rounded-spiritual p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 tracking-spiritual">{saveError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Form */}
        <div className="w-full max-w-2xl space-y-8 animate-slide-up">
          
          {/* Step 1: Calendar Tradition */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Choose Your Calendar Tradition</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendarOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setCalendarType(option.id)}
                  className={`p-4 rounded-spiritual border-2 transition-all duration-300 text-left group hover:shadow-spiritual ${
                    calendarType === option.id
                      ? 'border-spiritual-400 bg-spiritual-50 shadow-spiritual'
                      : 'border-spiritual-200 bg-white/50 hover:border-spiritual-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <option.icon className={`w-5 h-5 mt-1 ${
                      calendarType === option.id ? 'text-spiritual-600' : 'text-spiritual-500'
                    }`} />
                    <div>
                      <h4 className="font-medium text-spiritual-900 group-hover:text-spiritual-700 tracking-spiritual">
                        {option.name}
                      </h4>
                      <p className="text-sm text-spiritual-700/70 mt-1 tracking-spiritual">
                        {option.description}
                      </p>
                    </div>
                    {calendarType === option.id && (
                      <CheckCircle className="w-5 h-5 text-spiritual-600 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Language Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Select Your Preferred Language</h3>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center justify-between w-full p-4 bg-white/70 border-2 border-spiritual-200 rounded-spiritual hover:border-spiritual-300 transition-all duration-300 text-spiritual-900 font-medium tracking-spiritual focus:outline-none focus:ring-4 focus:ring-spiritual-200/50"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-spiritual-600" />
                  <span>{language}</span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-card shadow-spiritual-lg border border-spiritual-100 overflow-hidden z-[60] max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`block w-full text-left px-4 py-3 hover:bg-spiritual-50 transition-colors duration-200 border-b border-spiritual-50 last:border-b-0 tracking-spiritual ${
                        language === lang 
                          ? 'bg-spiritual-100 text-spiritual-800 font-medium' 
                          : 'text-gray-700 hover:text-spiritual-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Voice Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Choose Your Voice Assistant</h3>
            </div>
            
            {/* Instructions */}
            <div className="mb-6 p-4 bg-spiritual-50 rounded-spiritual border border-spiritual-200">
              <div className="flex items-start gap-3">
                <Volume2 className="w-5 h-5 text-spiritual-600 mt-0.5" />
                <div>
                  <p className="text-sm text-spiritual-800 font-medium mb-1">Voice Sample Instructions:</p>
                  <ul className="text-xs text-spiritual-700 space-y-1">
                    <li>• Click the <Play className="w-3 h-3 inline" /> button to hear a sample of each voice</li>
                    <li>• Each voice will read a spiritual greeting and introduction</li>
                    <li>• Press <kbd className="px-1 py-0.5 bg-spiritual-200 rounded text-xs">ESC</kbd> to stop playback</li>
                    <li>• Select the voice that resonates most with your spiritual practice</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Voice Sample Notifications */}
            {voiceSampleSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-spiritual">
                <div className="flex items-center gap-2 text-green-800">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{voiceSampleSuccess}</span>
                </div>
              </div>
            )}
            
            {voiceSampleError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-spiritual">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{voiceSampleError}</span>
                </div>
              </div>
            )}

            {/* Indian Voice Samples Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-spiritual-600" />
                  <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">
                    Choose Your Voice Assistant
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Indian Female Voices */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-spiritual-800 tracking-spiritual">Indian Female Voices</h4>
                    {indianFemaleVoices.map((voiceSample) => (
                      <div
                        key={voiceSample.id}
                        className={`p-4 rounded-spiritual border-2 transition-all duration-300 ${
                          selectedVoiceId === voiceSample.id
                            ? 'border-spiritual-400 bg-spiritual-50 shadow-spiritual'
                            : 'border-spiritual-200 bg-white/50 hover:border-spiritual-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              selectedVoiceId === voiceSample.id
                                ? 'border-spiritual-500 bg-spiritual-500'
                                : 'border-spiritual-300'
                            }`}>
                              {selectedVoiceId === voiceSample.id && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <Volume2 className={`w-5 h-5 ${
                              selectedVoiceId === voiceSample.id ? 'text-spiritual-600' : 'text-spiritual-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-spiritual-900 tracking-spiritual">
                                {voiceSample.name}
                              </h4>
                              <p className="text-sm text-spiritual-700/70 tracking-spiritual">
                                {voiceSample.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleVoiceSample(voiceSample.id)}
                              disabled={samplingVoiceId !== ''}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                samplingVoiceId === voiceSample.id
                                  ? 'bg-spiritual-300 text-spiritual-800 animate-pulse'
                                  : samplingVoiceId !== ''
                                    ? 'bg-spiritual-200 text-spiritual-700' 
                                    : 'bg-spiritual-100 hover:bg-spiritual-200 text-spiritual-600 hover:scale-105'
                              } disabled:opacity-50`}
                              title={
                                samplingVoiceId === voiceSample.id 
                                  ? "Playing sample..." 
                                  : samplingVoiceId !== ''
                                    ? "Another voice is playing" 
                                    : "Listen to voice sample"
                              }
                            >
                              {samplingVoiceId === voiceSample.id ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 border-2 border-spiritual-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">Playing</span>
                                </div>
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleVoiceSelect(voiceSample.id)}
                              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                selectedVoiceId === voiceSample.id
                                  ? 'bg-spiritual-700 text-white'
                                  : 'bg-spiritual-600 hover:bg-spiritual-700 text-white'
                              }`}
                            >
                              {selectedVoiceId === voiceSample.id ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indian Male Voices */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-spiritual-800 tracking-spiritual">Indian Male Voices</h4>
                    {indianMaleVoices.map((voiceSample) => (
                      <div
                        key={voiceSample.id}
                        className={`p-4 rounded-spiritual border-2 transition-all duration-300 ${
                          selectedVoiceId === voiceSample.id
                            ? 'border-spiritual-400 bg-spiritual-50 shadow-spiritual'
                            : 'border-spiritual-200 bg-white/50 hover:border-spiritual-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              selectedVoiceId === voiceSample.id
                                ? 'border-spiritual-500 bg-spiritual-500'
                                : 'border-spiritual-300'
                            }`}>
                              {selectedVoiceId === voiceSample.id && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <Volume2 className={`w-5 h-5 ${
                              selectedVoiceId === voiceSample.id ? 'text-spiritual-600' : 'text-spiritual-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-spiritual-900 tracking-spiritual">
                                {voiceSample.name}
                              </h4>
                              <p className="text-sm text-spiritual-700/70 tracking-spiritual">
                                {voiceSample.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleVoiceSample(voiceSample.id)}
                              disabled={samplingVoiceId !== ''}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                samplingVoiceId === voiceSample.id
                                  ? 'bg-spiritual-300 text-spiritual-800 animate-pulse'
                                  : samplingVoiceId !== ''
                                    ? 'bg-spiritual-200 text-spiritual-700' 
                                    : 'bg-spiritual-100 hover:bg-spiritual-200 text-spiritual-600 hover:scale-105'
                              } disabled:opacity-50`}
                              title={
                                samplingVoiceId === voiceSample.id 
                                  ? "Playing sample..." 
                                  : samplingVoiceId !== ''
                                    ? "Another voice is playing" 
                                    : "Listen to voice sample"
                              }
                            >
                              {samplingVoiceId === voiceSample.id ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 border-2 border-spiritual-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">Playing</span>
                                </div>
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleVoiceSelect(voiceSample.id)}
                              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                selectedVoiceId === voiceSample.id
                                  ? 'bg-spiritual-700 text-white'
                                  : 'bg-spiritual-600 hover:bg-spiritual-700 text-white'
                              }`}
                            >
                              {selectedVoiceId === voiceSample.id ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            
            {selectedVoiceId && (
              <div className="mt-4 p-3 bg-green-50 rounded-spiritual border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Selected: {indianVoiceSamples.find(v => v.id === selectedVoiceId)?.name || 'Voice'}
                  </span>
                </div>
              </div>
            )}

            {/* Stop button when playing */}
            {isPlaying && (
              <div className="mt-4 p-3 bg-red-50 rounded-spiritual border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Playing voice sample...
                    </span>
                  </div>
                  <button
                    onClick={stopAudio}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                  >
                    <VolumeX className="w-3 h-3" />
                    Stop
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Ritual Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Choose the Rituals You Want to Track</h3>
            </div>
            
            <div className="space-y-3">
              {ritualOptions.map((ritual) => (
                <button
                  key={ritual.id}
                  onClick={() => handleRitualToggle(ritual.id)}
                  className={`w-full p-4 rounded-spiritual border-2 transition-all duration-300 text-left group hover:shadow-spiritual ${
                    selectedRituals.includes(ritual.id)
                      ? 'border-spiritual-400 bg-spiritual-50 shadow-spiritual'
                      : 'border-spiritual-200 bg-white/50 hover:border-spiritual-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      selectedRituals.includes(ritual.id)
                        ? 'border-spiritual-500 bg-spiritual-500'
                        : 'border-spiritual-300'
                    }`}>
                      {selectedRituals.includes(ritual.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <ritual.icon className={`w-5 h-5 ${
                      selectedRituals.includes(ritual.id) ? 'text-spiritual-600' : 'text-spiritual-500'
                    }`} />
                    <div>
                      <h4 className="font-medium text-spiritual-900 group-hover:text-spiritual-700 tracking-spiritual">
                        {ritual.name}
                      </h4>
                      <p className="text-sm text-spiritual-700/70 tracking-spiritual">
                        {ritual.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Notification Time */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Select Notification Time</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-spiritual-600" />
              <div>
                <label className="block text-sm font-medium text-spiritual-800 mb-3 tracking-spiritual">
                  When would you like to receive your daily update?
                </label>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-spiritual-600" />
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 text-spiritual-900 font-medium bg-white/70 tracking-spiritual transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auto-detected Location (Read-only) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-accent-600" />
              <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Location</h3>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-spiritual-50/70 border-2 border-spiritual-200/50 rounded-spiritual">
              <span className="text-spiritual-800 font-medium tracking-spiritual">{detectedLocation}</span>
              <div className="ml-auto">
                <CheckCircle className="w-5 h-5 text-accent-600" />
              </div>
            </div>
            
            <p className="text-sm text-spiritual-700/70 mt-2 tracking-spiritual">
              Used to calculate accurate ritual timings for your region.
            </p>
          </div>

          {/* Save Preferences Button */}
          <div className="pt-6 relative z-10">
            {/* Validation Feedback */}
            {!validationStatus.isValid && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-spiritual">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Please complete the following:</h4>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationStatus.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={handleSavePreferences}
              disabled={!validationStatus.isValid || loading || saveSuccess}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                validationStatus.isValid && !loading && !saveSuccess
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!validationStatus.isValid ? "Please complete all required steps" : "Save your preferences"}
            >
              {/* Glow Effect */}
              {validationStatus.isValid && !loading && !saveSuccess && (
                <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Saving Preferences...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg">Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className={`w-5 h-5 transition-transform duration-300 ${validationStatus.isValid ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Save Preferences</span>
                </>
              )}
            </button>
            
            {validationStatus.isValid && (
              <p className="text-center text-sm text-spiritual-700/70 mt-4 tracking-spiritual">
                You can change these preferences anytime in Settings.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for voice samples */}
      <audio
        ref={audioRef}
        onEnded={() => console.log('Audio ended')}
        onError={() => console.error('Audio error')}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PreferencesScreen;