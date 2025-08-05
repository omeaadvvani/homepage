// Voice utilities for Indian accent voice samples
export interface VoiceSample {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: 'indian' | 'british' | 'american';
  description: string;
  sampleText: string;
  voiceSettings?: any;
}

export const INDIAN_VOICE_SAMPLES: VoiceSample[] = [
  {
    id: 'indian-male-spiritual',
    name: 'Arjun',
    gender: 'male',
    accent: 'indian',
    description: 'Calm and soothing Indian male voice with divine spiritual presence',
    sampleText: 'Om Namah Shivaya. I am Arjun, your spiritual guide in VoiceVedic. I will share with you the sacred wisdom of the ancient texts and guide you through your spiritual practices with a voice that carries divine energy. Together, we will discover the profound knowledge that lies within the Panchang and find peace in your spiritual journey.',
    voiceSettings: {
      rate: 0.85,
      pitch: 0.95,
      volume: 1.0,
      lang: 'en-IN'
    }
  }
];

export const getVoiceSampleById = (id: string): VoiceSample | undefined => {
  return INDIAN_VOICE_SAMPLES.find(voice => voice.id === id);
};

export const getVoiceSamplesByGender = (gender: 'male' | 'female'): VoiceSample[] => {
  return INDIAN_VOICE_SAMPLES.filter(voice => voice.gender === gender);
};

export const getVoiceSamplesByAccent = (accent: 'indian' | 'british' | 'american'): VoiceSample[] => {
  return INDIAN_VOICE_SAMPLES.filter(voice => voice.accent === accent);
};

export const getRandomVoiceSample = (): VoiceSample => {
  const randomIndex = Math.floor(Math.random() * INDIAN_VOICE_SAMPLES.length);
  return INDIAN_VOICE_SAMPLES[randomIndex];
};

// Voice sample playback utilities
export const playVoiceSample = async (voiceSample: VoiceSample): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(voiceSample.sampleText);
      
      // Apply voice settings if available
      if (voiceSample.voiceSettings) {
        utterance.rate = voiceSample.voiceSettings.rate || 0.9;
        utterance.pitch = voiceSample.voiceSettings.pitch || 1.0;
        utterance.volume = voiceSample.voiceSettings.volume || 1.0;
        utterance.lang = voiceSample.voiceSettings.lang || 'en-IN';
      } else {
        // Default settings
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-IN';
      }

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      // Priority order for Indian English voices
      const voicePreferences = [
        { name: 'Google हिन्दी', lang: 'hi-IN' },
        { name: 'Google UK English Female', lang: 'en-GB' },
        { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
        { name: 'Google UK English Male', lang: 'en-GB' },
        { name: 'Microsoft David - English (United States)', lang: 'en-US' },
        { name: 'Google US English Female', lang: 'en-US' },
        { name: 'Google US English Male', lang: 'en-US' },
        { lang: 'en-GB' },
        { lang: 'en-US' },
        { lang: 'en' }
      ];

      let selectedVoice = null;
      
      // Try to find a preferred voice
      for (const preference of voicePreferences) {
        selectedVoice = voices.find(voice => {
          if (preference.name && preference.lang) {
            return voice.name.includes(preference.name) && voice.lang.startsWith(preference.lang);
          } else if (preference.name) {
            return voice.name.includes(preference.name);
          } else if (preference.lang) {
            return voice.lang.startsWith(preference.lang);
          }
          return false;
        });
        
        if (selectedVoice) {
          console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
          break;
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (voices.length > 0) {
        // Fallback to first available voice
        utterance.voice = voices[0];
        console.log('Using fallback voice:', voices[0].name);
      }

      utterance.onend = () => {
        console.log('Voice sample playback ended');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Voice sample playback error:', event);
        reject(new Error('Voice sample playback failed'));
      };

      // Set voice and start speaking
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            utterance.voice = voices[0];
          }
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Error in voice sample playback:', error);
      reject(error);
    }
  });
};

// ResponsiveVoice integration
export const playVoiceSampleWithResponsiveVoice = async (voiceSample: VoiceSample): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        const responsiveVoice = (window as any).responsiveVoice;
        
        let voiceName = 'UK English Female';
        if (voiceSample.gender === 'male') {
          voiceName = 'UK English Male';
        }
        if (voiceSample.accent === 'indian') {
          voiceName = voiceSample.gender === 'male' ? 'Indian English Male' : 'Indian English Female';
        }
        
        responsiveVoice.speak(voiceSample.sampleText, voiceName, {
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0,
          onend: () => {
            console.log(`✅ ResponsiveVoice sample completed for ${voiceSample.name}`);
            resolve();
          },
          onerror: () => {
            reject(new Error('ResponsiveVoice failed'));
          }
        });
      } else {
        reject(new Error('ResponsiveVoice not available'));
      }
    } catch (error) {
      reject(error);
    }
  });
}; 