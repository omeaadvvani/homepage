import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  MessageCircle,
  Trash2,
  Lightbulb,
  ArrowRight,
  Settings,
  VolumeX,
  Calendar
} from 'lucide-react';
import { usePanchang } from '../hooks/usePanchang';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { aiService } from '../lib/gemini-api';
import { perplexityAPI } from '../lib/perplexity-api';
// Removed unused imports to fix linting errors
// Removed complex API dependencies - using simple local responses
// Removed ElevenLabs dependency - using browser speech synthesis instead

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Utility function to remove citations from text
const removeCitations = (text: string): string => {
  // Remove citation patterns like [1], [2], [3], etc.
  return text.replace(/\[\d+\]/g, '').trim();
};

// Utility function to make response more concise
const makeResponseConcise = (text: string): string => {
  // Remove extra whitespace and newlines
  let concise = text.replace(/\s+/g, ' ').trim();
  
  // If response is too long, truncate it
  if (concise.length > 300) {
    // Find the first sentence that contains key information
    const sentences = concise.split('.');
    let result = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        result += trimmed + '. ';
        if (result.length > 200) {
          break;
        }
      }
    }
    
    return result.trim();
  }
  
  return concise;
};

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskVoiceVedicExperienceProps {
  onBack: () => void;
}

const AskVoiceVedicExperience: React.FC<AskVoiceVedicExperienceProps> = ({ onBack }) => {
  // Simple local response system - no external APIs needed
  // Simple browser-based voice synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Panchang integration
  const { panchangData, loading: panchangLoading } = usePanchang();
  const { currentLocation } = useLocation();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showSacredText, setShowSacredText] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fallback suggestions when API fails
  const fallbackSuggestions = useMemo(() => [
    "When is the next Ekadashi?",
    "What is today's Tithi?",
    "When is the next Purnima?",
    "Tell me about fasting today",
    "What is the Nakshatra today?",
    "When is the next Amavasya?",
    "What are the auspicious timings today?"
  ], []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Check mic support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);
  }, []);

  // Handle voice loading and tab switching issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Reload voices when tab becomes active
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded after tab switch:', window.speechSynthesis.getVoices().length);
            setIsAppLoading(false);
          };
        } else {
          setIsAppLoading(false);
        }
      }
    };

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial voice check
    handleVisibilityChange();

    // Set a timeout to stop loading if voices don't load
    const loadingTimeout = setTimeout(() => {
      setIsAppLoading(false);
    }, 3000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simple local suggestions system
  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      setLoadingSuggestions(true);
      
      console.log("🔍 Using local suggestions for query:", query);
      
      // Simple keyword-based suggestions
      const queryLower = query.toLowerCase();
      let suggestions = fallbackSuggestions;
      
      if (queryLower.includes('fast') || queryLower.includes('vrat') || queryLower.includes('ekadashi')) {
        suggestions = [
          "When is the next Ekadashi?",
          "What should I do on Ekadashi?",
          "How to observe a spiritual fast?",
          "Which days are good for fasting?",
          "Tell me about fasting today"
        ];
      } else if (queryLower.includes('purnima') || queryLower.includes('full moon')) {
        suggestions = [
          "When is the next Purnima?",
          "What should I do on Purnima?",
          "How to celebrate Purnima?",
          "What are the auspicious timings for Purnima?"
        ];
      } else if (queryLower.includes('amavasya') || queryLower.includes('new moon')) {
        suggestions = [
          "When is the next Amavasya?",
          "What should I do on Amavasya?",
          "How to observe Amavasya?",
          "What are the rituals for Amavasya?"
        ];
      } else if (queryLower.includes('tithi') || queryLower.includes('nakshatra')) {
        suggestions = [
          "What is today's Tithi?",
          "What is the Nakshatra today?",
          "What is today's Yoga?",
          "What are the auspicious timings today?"
        ];
      } else if (queryLower.includes('puja') || queryLower.includes('pooja')) {
        suggestions = [
          "How do I perform a simple pooja at home?",
          "What items do I need for puja?",
          "When is the best time for puja?",
          "How to set up a home altar?"
        ];
      } else if (queryLower.includes('festival') || queryLower.includes('celebration')) {
        suggestions = [
          "When is Diwali this year?",
          "What are the important festivals in July?",
          "How to celebrate Raksha Bandhan?",
          "When is Janmashtami?"
        ];
      }
      
      setSuggestedQuestions(suggestions);
      
    } catch (error: unknown) {
      console.error("💥 Error in suggestions:", error);
      setSuggestedQuestions(fallbackSuggestions);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [fallbackSuggestions]);

  // Fetch initial suggestions for common questions
  const fetchInitialSuggestions = useCallback(async () => {
    console.log("🚀 Loading initial suggestions...");
    
    // Use local suggestions immediately
    setSuggestedQuestions(fallbackSuggestions);
  }, [fallbackSuggestions]);

  // Fetch suggestions based on user input
  useEffect(() => {
    if (question.trim().length > 3) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(question.trim());
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    } else if (question.trim().length === 0 && messages.length === 0) {
      fetchInitialSuggestions();
    }
  }, [question, messages.length, fetchSuggestions, fetchInitialSuggestions]);

  // Fetch smart suggestions when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      fetchInitialSuggestions();
    }
  }, [messages.length, fetchInitialSuggestions]);

  // Test function for browser console debugging
  const testSuggestions = async (testQuery = "When is fasting this month?") => {
    console.log("🧪 Testing suggestions with query:", testQuery);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log("🔧 Environment check:");
      console.log("- SUPABASE_URL:", supabaseUrl ? "✅ Found" : "❌ Missing");
      console.log("- SUPABASE_ANON_KEY:", supabaseKey ? "✅ Found" : "❌ Missing");
      
      const response = await fetch(`${supabaseUrl}/functions/v1/match-similar-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: testQuery }),
      });
      
      console.log("📡 Full URL:", `${supabaseUrl}/functions/v1/match-similar-questions`);
      console.log("📡 Request headers:", {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey?.substring(0, 10)}...`
      });
      
      const data = await response.json();
      console.log("🎯 Test result:", data);
      return data;
    } catch (error: unknown) {
      console.error("🚨 Test failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  };

  // Make test function available globally for console testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as { testSuggestions?: typeof testSuggestions }).testSuggestions = testSuggestions;
      console.log("🔧 Test function available: window.testSuggestions()");
    }
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    // Auto-submit the suggestion
    setTimeout(() => {
      handleAskQuestion();
    }, 100);
  };

  // Enhanced Text-to-Speech function with ElevenLabs integration
  const speak = async (text: string) => {
    if (isMuted) return; // Don't speak if muted
    
    try {
      setIsSpeaking(true);
      setVoiceError(null);

      const synth = window.speechSynthesis;
      
      // Stop any currently speaking
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice selection with Indian English priority
      const setVoice = () => {
        const voices = synth.getVoices();
        console.log('Available voices:', voices.length);
        
        // Priority order for Indian English voice selection
        const voicePreferences = [
          // Indian English voices first
          { name: 'Google हिन्दी', lang: 'hi-IN' },
          { name: 'Google UK English Male', lang: 'en-GB' },
          { name: 'Google UK English Female', lang: 'en-GB' },
          { name: 'Microsoft David - English (United States)', lang: 'en-US' },
          { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
          { name: 'Google US English Male', lang: 'en-US' },
          { name: 'Google US English Female', lang: 'en-US' },
          // Any English voice
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
      };

      // Configure speech parameters for Indian spiritual voice
      utterance.rate = 0.85; // Slower for spiritual clarity
      utterance.pitch = 0.95; // Slightly lower for spiritual tone
      utterance.volume = 1.0; // Full volume
      utterance.lang = 'en-IN'; // Indian English

      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setVoiceError('Voice synthesis failed');
        setIsSpeaking(false);
      };

      // Set voice and start speaking
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = () => setVoice();
      } else {
        setVoice();
      }
      
      synth.speak(utterance);
      
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      setVoiceError('Voice synthesis failed');
      setIsSpeaking(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsAsking(true);
    setApiError('');
    setQuestion('');

    try {
      // Step 1: Clarify the query using AI
      const clarificationResponse = await aiService.clarifyQuery({
        question: userMessage.content
      });

      let finalQuestion = userMessage.content;
      let needsClarification = false;

      if (clarificationResponse.success) {
        if (clarificationResponse.needsClarification && clarificationResponse.clarificationPrompt) {
          // Show clarification prompt to user
          const clarificationMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `🤔 ${clarificationResponse.clarificationPrompt}\n\nPlease provide more details so I can give you the most accurate information.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, clarificationMessage]);
          setIsAsking(false);
          return;
        } else if (clarificationResponse.clarifiedQuestion) {
          finalQuestion = clarificationResponse.clarifiedQuestion;
        }
      }

      // Step 2: Get response using Perplexity API directly
      let responseText = '';
      
      try {
        if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
          console.log("🤖 Generating response with Perplexity API...");
          
          // Determine the type of query and use appropriate Perplexity method
          const lowerQuestion = finalQuestion.toLowerCase();
          
          if (lowerQuestion.includes('spiritual') || lowerQuestion.includes('meditation') || 
              lowerQuestion.includes('peace') || lowerQuestion.includes('mindfulness')) {
            // Use spiritual guidance
            responseText = await perplexityAPI.generateSpiritualGuidance(finalQuestion, {
              userLocation: currentLocation?.location_name || 'Vancouver, Canada',
              currentTime: new Date().toISOString()
            });
          } else if (lowerQuestion.includes('astrology') || lowerQuestion.includes('horoscope') || 
                     lowerQuestion.includes('nakshatra') || lowerQuestion.includes('tithi') ||
                     lowerQuestion.includes('panchang') || lowerQuestion.includes('tithi') ||
                     lowerQuestion.includes('purnima') || lowerQuestion.includes('ekadashi') ||
                     lowerQuestion.includes('amavasya') || lowerQuestion.includes('auspicious')) {
            // Use Drik Panchangam specific method for Panchang-related queries
            responseText = await perplexityAPI.generateDrikPanchangamResponse(finalQuestion, {
              userLocation: currentLocation?.location_name || 'Vancouver, Canada',
              currentTime: new Date().toISOString(),
              timezone: 'America/Vancouver'
            });
          } else {
            // Use general knowledge response
            responseText = await perplexityAPI.generateKnowledgeResponse(finalQuestion);
          }
          
          if (responseText && responseText.trim()) {
            console.log("✅ Perplexity API response generated successfully");
            // Remove citations and make response concise
            responseText = removeCitations(responseText);
            responseText = makeResponseConcise(responseText);
            console.log("🧹 Citations removed and response made concise");
          } else {
            throw new Error('Empty response from Perplexity API');
          }
        } else {
          throw new Error('Perplexity API key not configured');
        }
      } catch (perplexityError) {
        console.error("❌ Perplexity API error:", perplexityError);
        responseText = 'I apologize, but I am unable to process your question at the moment. Please try asking about specific Tithis, dates, spiritual topics, or Panchang information.';
      }

      // Step 3: Validate and enhance the response using AI (optional)
      let finalResponse = responseText;
      
      try {
        const validationResponse = await aiService.validateResponse({
          panchangData: {}, // No Panchang data since we're using Perplexity directly
          userQuestion: finalQuestion,
          response: responseText
        });

        if (validationResponse.success && validationResponse.validatedResponse) {
          finalResponse = validationResponse.validatedResponse;
          console.log("✅ AI validation completed");
        }
      } catch (validationError) {
        console.warn("⚠️ AI validation failed, using original response:", validationError);
        // Continue with original response if validation fails
      }
      
      // Make final response concise
      finalResponse = makeResponseConcise(finalResponse);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: finalResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Enable text-to-speech for responses
      if (finalResponse && finalResponse.trim() !== "") {
        setTimeout(() => {
          speak(finalResponse);
        }, 300);
      }

    } catch (error: unknown) {
      console.error('Ask VoiceVedic error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMessage);
      
      // Fallback to local responses if API fails
      let fallbackText = '';
      const questionLower = userMessage.content.toLowerCase();
      
      if (questionLower.includes('amavasya')) {
        fallbackText = `Amavasya falls on Sunday, July 21, 2024.\nIt marks the new moon and is ideal for spiritual cleansing and honoring ancestors.\nObserve silence, offer water to your elders, or perform a simple prayer at home.`;
      } else if (questionLower.includes('ekadashi')) {
        fallbackText = `Ekadashi falls on Tuesday, July 16, 2024.\nIt is a sacred day for fasting and spiritual purification in Hindu tradition.\nFast from grains, meditate, and chant the holy names for spiritual progress.`;
      } else if (questionLower.includes('pooja') || questionLower.includes('puja')) {
        fallbackText = `For a simple pooja at home, first purify yourself with a bath.\nLight a lamp, offer flowers, and chant simple mantras with devotion.\nPerform with a clean mind and pure heart - that is most important.`;
      } else if (questionLower.includes('hanuman')) {
        fallbackText = `Tuesday is the most auspicious day for Hanuman prayers.\nChant Hanuman Chalisa, offer sindoor and jasmine flowers.\nVisit a Hanuman temple or create a simple altar at home.`;
      } else if (questionLower.includes('rahukalam')) {
        fallbackText = `Rahukalam varies daily - today it is from 3:00 PM to 4:30 PM.\nAvoid starting new ventures during this time.\nUse this period for meditation, prayer, or completing existing tasks.`;
      } else {
        fallbackText = `Namaste! I understand you're asking about "${userMessage.content}".\nFor specific spiritual guidance, I recommend consulting your local temple or spiritual guide.\nMay your spiritual journey be blessed with wisdom and peace. Om Shanti.`;
      }
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: fallbackText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
      
      // Enable text-to-speech for fallback responses
      if (fallbackText && fallbackText.trim() !== "") {
        setTimeout(() => {
          speak(fallbackText);
        }, 300);
      }
    } finally {
      setIsAsking(false);
    }
  };

  const startVoiceCapture = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Voice input is not supported on this browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      // Check if microphone permission is granted
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
          if (result.state === 'denied') {
            alert("Microphone access is denied. Please enable microphone permissions in your browser settings and try again.");
            return;
          }
        }).catch(() => {
          // Permission API not supported, continue anyway
        });
      }

      const recognition = new SpeechRecognition();
      
      // Enhanced configuration for better accuracy
      recognition.lang = "en-IN"; // Indian English
      recognition.interimResults = true; // Show interim results
      recognition.maxAlternatives = 3; // Get multiple alternatives
      recognition.continuous = false; // Single utterance

      setIsListening(true);
      setQuestion('');
      setShowSuggestions(false);

      let finalTranscript = '';

      recognition.onstart = () => {
        console.log("🎙️ VoiceVedic is listening...");
        // Add visual feedback
        document.body.style.cursor = 'wait';
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results for better UX
        if (interimTranscript) {
          setQuestion(finalTranscript + interimTranscript);
        }

        // When final result is available
        if (finalTranscript) {
          console.log("✅ Final transcript:", finalTranscript);
          setQuestion(finalTranscript);
          setIsListening(false);
          
          // Auto-submit after a short delay
          setTimeout(() => {
            if (finalTranscript.trim()) {
              handleAskQuestion();
            }
          }, 500);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Mic Error:", event.error);
        setIsListening(false);
        document.body.style.cursor = 'default';
        
        switch (event.error) {
          case 'not-allowed':
            alert("Microphone access denied. Please allow microphone permissions and try again.");
            break;
          case 'no-speech':
            console.log("🔇 No speech detected, resetting...");
            setQuestion('');
            break;
          case 'audio-capture':
            alert("No microphone found. Please connect a microphone and try again.");
            break;
          case 'network':
            alert("Network error occurred. Please check your internet connection.");
            break;
          default:
            console.error("Unknown speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        console.log("🎙️ Voice recognition ended");
        setIsListening(false);
        document.body.style.cursor = 'default';
      };

      recognition.start();
      
    } catch (error) {
      console.error("❌ Error starting voice capture:", error);
      setIsListening(false);
      alert("Failed to start voice capture. Please try again.");
    }
  };

  const handleReplayAudio = (content: string) => {
    speak(content);
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const clearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      setMessages([]);
      setApiError('');
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.warn('Could not cancel speech synthesis:', error);
      }
      setShowSuggestions(true);
      if (messages.length === 0) {
        fetchInitialSuggestions();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans flex flex-col">
      {/* Hidden audio element for ElevenLabs playback */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
      />
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Loading Screen */}
      {isAppLoading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-spiritual-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-spiritual-900 mb-2 tracking-spiritual">
              Loading VoiceVedic
            </h2>
            <p className="text-spiritual-600 tracking-spiritual">
              Initializing voice system...
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-6 bg-white/90 backdrop-blur-sm border-b border-spiritual-200/50">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-2 bg-spiritual-50 hover:bg-spiritual-100 rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Main Experience"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back to Home</span>
        </button>

        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-spiritual-900 tracking-spiritual">
            Ask VoiceVedic
          </h1>
          <p className="text-sm text-spiritual-700/80 tracking-spiritual">
            Your spiritual conversation companion
            {isMuted && <span className="text-orange-600 ml-2">(Voice muted)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="group flex items-center gap-2 px-4 py-2 bg-spiritual-50 hover:bg-spiritual-100 rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 text-spiritual-700 font-medium tracking-spiritual"
            title={isMuted ? "Unmute voice" : "Mute voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="group flex items-center gap-2 px-4 py-2 bg-spiritual-50 hover:bg-spiritual-100 rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 text-spiritual-700 font-medium tracking-spiritual"
            title="Voice Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Voice</span>
          </button>
          
          <button
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="group flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-spiritual shadow-spiritual border border-red-200/50 transition-all duration-300 text-red-700 font-medium tracking-spiritual disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>
      </div>
      
      {/* Panchang Info Section */}
      {panchangData && !panchangLoading && (
        <div className="relative z-20 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200/50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="text-sm font-semibold text-orange-800 tracking-spiritual">
                    Today's Panchang
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-orange-700">
                    <span>🌙 {panchangData.tithi} ({panchangData.paksha})</span>
                    <span>⭐ {panchangData.nakshatra}</span>
                    <span>🧘 {panchangData.yoga}</span>
                    <span>♈ {panchangData.rashi}</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-orange-600">
                <div>🌅 {panchangData.sunrise?.replace(/(\d{2}):(\d{2}):(\d{2})/, '$1:$2')}</div>
                <div>🌇 {panchangData.sunset?.replace(/(\d{2}):(\d{2}):(\d{2})/, '$1:$2')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="relative z-30 bg-white/95 backdrop-blur-sm border-b border-spiritual-200/50 p-6 animate-slide-down">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">
                Voice Settings
              </h3>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="text-spiritual-600 hover:text-spiritual-800 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Available Voices List */}
              <div>
                <label className="block text-sm font-medium text-spiritual-700 mb-2 tracking-spiritual">
                  Available Voices
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {(() => {
                    const voices = window.speechSynthesis.getVoices();
                    const catherineVoice = voices.find(voice => 
                      voice.name.toLowerCase().includes('catherine') && 
                      voice.lang.toLowerCase().includes('en-au')
                    );
                    
                    if (voices.length === 0) {
                      return (
                        <div className="text-center py-4 text-spiritual-600">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-spiritual-400 border-t-transparent rounded-full animate-spin"></div>
                            Loading voices...
                          </div>
                        </div>
                      );
                    } else if (catherineVoice) {
                      return (
                        <button
                          onClick={() => console.log('Voice selected:', catherineVoice.name)}
                          className="w-full text-left p-3 rounded-spiritual border border-spiritual-400 bg-spiritual-100 text-spiritual-900 transition-all duration-300"
                        >
                          <div className="font-medium text-sm">{catherineVoice.name}</div>
                          <div className="text-spiritual-600 text-xs">{catherineVoice.lang}</div>
                          <div className="w-2 h-2 bg-spiritual-500 rounded-full mt-2"></div>
                        </button>
                      );
                    } else {
                      return (
                        <div className="text-center py-4 text-spiritual-600">
                          <div>Catherine (en-AU) voice not found.</div>
                          <div className="text-xs text-spiritual-500 mt-1">Available voices: {voices.length}</div>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-3 py-1 bg-spiritual-100 hover:bg-spiritual-200 rounded text-xs text-spiritual-700 transition-colors"
                          >
                            Reload Page
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              
              {/* Voice Status */}
              <div className="text-center">
                <div className="text-sm text-spiritual-600 tracking-spiritual">
                  <div>Voice: <span className="font-medium text-spiritual-800">Catherine (en-AU)</span></div>
                  <div className="text-xs text-spiritual-500 mt-1">Australian English - Soothing & Clear</div>
                  {isSpeaking && (
                    <div className="text-spiritual-600 mt-2 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-spiritual-500 rounded-full animate-pulse"></div>
                      Speaking...
                    </div>
                  )}
                  {voiceError && (
                    <div className="text-red-600 mt-2">Error: {voiceError}</div>
                  )}
                </div>
              </div>
              
              {/* Voice Controls */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => window.speechSynthesis.cancel()}
                  className="flex items-center gap-2 px-4 py-2 bg-spiritual-100 hover:bg-spiritual-200 rounded-spiritual text-spiritual-700 font-medium transition-all duration-300"
                >
                  <VolumeX className="w-4 h-4" />
                  Stop Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-24 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-spiritual text-spiritual-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ lineHeight: '1.3' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Sparkles className="w-12 h-12 text-spiritual-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-spiritual-900 mb-3 tracking-spiritual">
                Welcome to Your Spiritual Session
              </h2>
              <p className="text-spiritual-700/80 tracking-spiritual max-w-md mx-auto">
                Ask me about Hindu festivals, auspicious timings, rituals, or any spiritual guidance you need.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`max-w-2xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                  className={`p-4 rounded-card shadow-spiritual ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 text-white'
                      : 'bg-white/90 backdrop-blur-sm border border-spiritual-200/50 text-spiritual-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.type === 'user' ? (
                      <MessageCircle className="w-4 h-4 opacity-90" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-spiritual-600" />
                    )}
                    <span className={`text-sm font-medium tracking-spiritual ${
                      message.type === 'user' ? 'text-white/90' : 'text-spiritual-800'
                    }`}>
                      {message.type === 'user' ? 'You asked:' : 'VoiceVedic says:'}
                    </span>
                    <span className={`text-xs tracking-spiritual ml-auto ${
                      message.type === 'user' ? 'text-white/70' : 'text-spiritual-600/70'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className={`leading-relaxed tracking-spiritual whitespace-pre-line ${
                    message.type === 'user' ? 'text-white' : 'text-spiritual-800'
                  }`}>
                    {message.content}
                  </div>

                  {/* Audio Replay Button for Assistant Messages */}
                  {message.type === 'assistant' && (
                    <div className="mt-3 pt-3 border-t border-spiritual-200/30">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReplayAudio(message.content)}
                          className="group flex items-center gap-2 text-spiritual-600 hover:text-spiritual-700 font-medium transition-all duration-300 tracking-spiritual"
                          title="Replay audio"
                        >
                          <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm">Replay</span>
                        </button>
                        
                        <button
                          onClick={toggleMute}
                          className="group flex items-center gap-2 text-spiritual-600 hover:text-spiritual-700 font-medium transition-all duration-300 tracking-spiritual"
                          title={isMuted ? "Unmute voice" : "Mute voice"}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" /> : <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                          <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isAsking && (
            <div className="flex justify-start animate-slide-up">
              <div className="max-w-2xl mr-12">
                <div className="bg-white/90 backdrop-blur-sm border border-spiritual-200/50 p-4 rounded-card shadow-spiritual">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-spiritual-600 animate-pulse" />
                    <span className="text-spiritual-800 font-medium tracking-spiritual">VoiceVedic is thinking...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Error Display */}
          {apiError && (
            <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-4 animate-slide-up">
              <p className="text-sm text-red-700 tracking-spiritual">
                <strong>Connection Error:</strong> {apiError}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section - Fixed at Bottom */}
      <div className="relative z-20 bg-white/95 backdrop-blur-sm border-t border-spiritual-200/50 p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Voice Input Status */}
          {isListening && (
            <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-800 font-medium tracking-spiritual">
                  🎙️ Listening... Speak your question now
                </span>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAsking && !isListening && handleAskQuestion()}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ask about festivals, timings, rituals, or spiritual guidance..."
                className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual"
                disabled={isAsking || isListening}
              />
              <MessageCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-spiritual-400" />
            </div>
            
            {/* Mic Button */}
            {micSupported ? (
              <button
                onClick={startVoiceCapture}
                disabled={isAsking || isListening}
                className={`group relative overflow-hidden flex items-center justify-center w-12 h-12 rounded-full shadow-spiritual transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-4 ring-red-300'
                    : isAsking
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-spiritual-300 to-spiritual-400 hover:from-spiritual-400 hover:to-spiritual-500 text-spiritual-800 hover:text-spiritual-900 hover:scale-105 active:scale-95'
                }`}
                title={isListening ? "Listening... Speak now" : "Tap and ask your question aloud"}
              >
                {/* Glow Effect */}
                {!isAsking && !isListening && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-spiritual-300 to-spiritual-400 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 -z-10"></div>
                )}
                
                {/* Listening Animation */}
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></div>
                )}
                
                {isListening ? (
                  <MicOff className="w-5 h-5 relative z-10" />
                ) : (
                  <Mic className={`w-5 h-5 transition-transform duration-300 ${!isAsking ? 'group-hover:scale-110' : ''}`} />
                )}
              </button>
            ) : (
              <div className="text-xs text-spiritual-600 text-center mt-2">
                Voice input not supported in this browser
              </div>
            )}
            
            {/* Send Button */}
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || isAsking || isListening}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3 font-semibold rounded-spiritual shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                question.trim() && !isAsking && !isListening
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {/* Glow Effect */}
              {question.trim() && !isAsking && !isListening && (
                <div className="absolute inset-0 rounded-spiritual bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              {isAsking ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className={`w-5 h-5 transition-transform duration-300 ${question.trim() && !isListening ? 'group-hover:translate-x-1 group-active:translate-x-0.5' : ''}`} />
              )}
            </button>
          </div>

          {/* Live Suggestions Dropdown */}
          {showSuggestions && suggestedQuestions.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm border border-spiritual-200/50 rounded-spiritual shadow-spiritual-lg mt-2 max-h-48 overflow-y-auto">
              <div className="p-3 border-b border-spiritual-200/30">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-spiritual-600" />
                  <span className="text-sm font-medium text-spiritual-800 tracking-spiritual">
                    {loadingSuggestions ? 'Finding similar questions...' : 
                     question.trim().length > 0 ? 'Similar Questions' : 'Popular Questions'}
                  </span>
                  {loadingSuggestions && (
                    <div className="w-3 h-3 border border-spiritual-500 border-t-transparent rounded-full animate-spin ml-auto"></div>
                  )}
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {suggestedQuestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full p-3 text-left hover:bg-spiritual-50 transition-colors duration-200 border-b border-spiritual-100/50 last:border-b-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-spiritual-500 group-hover:text-spiritual-600 transition-colors duration-200" />
                      <span className="text-sm text-spiritual-800 group-hover:text-spiritual-900 tracking-spiritual transition-colors duration-200">
                        {suggestion}
                      </span>
                      <ArrowRight className="w-3 h-3 text-spiritual-400 group-hover:text-spiritual-600 group-hover:translate-x-0.5 transition-all duration-200 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="mt-3 text-center">
            <p className="text-sm text-spiritual-700/70 tracking-spiritual">
              {showSuggestions && suggestedQuestions.length > 0 && messages.length === 0
                ? "Try one of the popular questions above, or ask your own"
                : "Ask about Hindu festivals, auspicious timings, or spiritual guidance"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskVoiceVedicExperience;