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
    id: 'indian-female-1',
    name: 'Priya',
    gender: 'female',
    accent: 'indian',
    description: 'Warm and gentle Indian female voice',
    sampleText: 'Namaste. Welcome to VoiceVedic. I am Priya, your spiritual companion. I will guide you through your daily Panchang readings and spiritual practices with warmth and wisdom. Together, we will explore the ancient wisdom of the Vedas and find peace in your spiritual journey.'
  },
  {
    id: 'indian-female-2',
    name: 'Lakshmi',
    gender: 'female',
    accent: 'indian',
    description: 'Elegant and wise Indian female voice',
    sampleText: 'Greetings. I am Lakshmi, your spiritual guide in VoiceVedic. I bring you the sacred knowledge of the Panchang and spiritual wisdom. Let me share with you the divine insights that will illuminate your path and bring harmony to your daily practices.'
  },
  {
    id: 'indian-male-1',
    name: 'Ravi',
    gender: 'male',
    accent: 'indian',
    description: 'Deep and authoritative Indian male voice',
    sampleText: 'Om Namah Shivaya. I am Ravi, your spiritual mentor in VoiceVedic. I will share with you the profound wisdom of the ancient texts and guide you through your spiritual practices. Together, we will discover the divine knowledge that lies within the Panchang.'
  },
  {
    id: 'indian-male-2',
    name: 'Arjun',
    gender: 'male',
    accent: 'indian',
    description: 'Wise and calming Indian male voice',
    sampleText: 'Namaste. Welcome to VoiceVedic. I am Arjun, here to be your spiritual companion. I will read your daily Panchang with clarity and share the sacred teachings that will bring peace and wisdom to your spiritual journey. Let us walk this path together.'
  },
  {
    id: 'british-female-1',
    name: 'Emma',
    gender: 'female',
    accent: 'british',
    description: 'Refined British female voice',
    sampleText: 'Hello. Welcome to VoiceVedic. I am Emma, your spiritual guide. I will share with you the ancient wisdom and daily Panchang readings with clarity and grace. Together, we will explore the spiritual traditions and find meaning in your daily practices.'
  },
  {
    id: 'british-male-1',
    name: 'James',
    gender: 'male',
    accent: 'british',
    description: 'Distinguished British male voice',
    sampleText: 'Greetings. I am James, your spiritual companion in VoiceVedic. I will guide you through your daily Panchang readings and share the profound wisdom of spiritual traditions. Let me help you discover the sacred knowledge that will enrich your spiritual journey.'
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
      
      // Set voice properties
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-IN'; // Indian English

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes('indian') || 
        v.lang.includes('en-IN') ||
        (voiceSample.accent === 'british' && v.lang.includes('en-GB'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        console.log(`✅ Voice sample completed for ${voiceSample.name}`);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Voice sample error:', event);
        reject(new Error('Voice sample failed'));
      };

      window.speechSynthesis.speak(utterance);
      
      // Timeout fallback
      setTimeout(() => {
        window.speechSynthesis.cancel();
        resolve();
      }, 15000); // 15 second timeout
      
    } catch (error) {
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