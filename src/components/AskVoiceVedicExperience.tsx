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

import { useVoiceVedicAPI } from '../lib/voicevedic-api';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';

// Removed unused imports to fix linting errors
// Perplexity API integration for spiritual guidance
// Browser-based voice synthesis

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
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
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  onAddMessage: (message: { id: string; type: 'user' | 'assistant'; content: string; timestamp: Date }) => void;
  onClearConversation: () => void;
}

const AskVoiceVedicExperience: React.FC<AskVoiceVedicExperienceProps> = ({ 
  onBack, 
  messages, 
  onAddMessage, 
  onClearConversation 
}) => {
  // Enhanced API and location detection
  const { askVoiceVedic } = useVoiceVedicAPI();
  const { user } = useAuth();
  const { currentLocation, startLocationTracking } = useLocation(user?.id);
  
  // Simple local response system - no external APIs needed
  // Simple browser-based voice synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  
  const [question, setQuestion] = useState('');
  // Messages are now managed by parent component to persist across navigation
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
    "When is next Amavasya in Mumbai?",
    "When is Purnima this month in Chicago USA?",
    "When is Rahukaal today?"
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
    
    // Ensure app loads even if voice synthesis is not available
    const checkVoiceSupport = () => {
      if (!window.speechSynthesis) {
        console.log('Speech synthesis not supported, continuing without voice');
        setIsAppLoading(false);
        setVoiceInitialized(true);
        return;
      }
      
      // If voices are already available, stop loading
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices available immediately:', voices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
      }
    };
    
    checkVoiceSupport();
  }, []);

  // Handle voice loading and tab switching issues
  useEffect(() => {
    const initializeVoiceSystem = () => {
      // Prevent multiple initializations
      if (voiceInitialized) {
        return;
      }
      
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      if (voices.length > 0) {
        // Voices are already loaded
        console.log('Voices loaded immediately:', voices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
        return;
      }
      
      // Wait for voices to load
      const handleVoicesChanged = () => {
        const loadedVoices = window.speechSynthesis.getVoices();
        console.log('Voices loaded after event:', loadedVoices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout - stop loading after 3 seconds
      const timeoutId = setTimeout(() => {
        console.log('Voice loading timeout, continuing anyway');
        setIsAppLoading(false);
        setVoiceInitialized(true);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }, 3000);
      
      // Cleanup timeout if voices load
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        clearTimeout(timeoutId);
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !voiceInitialized) {
        // Reload voices when tab becomes active (only if not already initialized)
        initializeVoiceSystem();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initialize voice system and location tracking when component mounts
    initializeVoiceSystem();
    
    if (user?.id) {
      startLocationTracking();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, startLocationTracking, voiceInitialized]);

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
      
      if (queryLower.includes('fast') || queryLower.includes('vrat')) {
        suggestions = [
          "When is the next Ekadashi?",
          "What should I do on Ekadashi?",
          "How to observe a spiritual fast?",
          "Which days are good for fasting?"
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

  // Voice options for Indian/neutral accents
  const getAvailableVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    return [
      ...voices.filter(v => v.lang === "en-IN" && v.name.toLowerCase().includes("female")).map(v => ({ label: `Indian English Female – ${v.name}`, value: v.name })),
      ...voices.filter(v => v.lang === "en-IN" && v.name.toLowerCase().includes("male")).map(v => ({ label: `Indian English Male – ${v.name}`, value: v.name })),
      ...voices.filter(v => v.lang === "en-GB" && v.name.toLowerCase().includes("female")).map(v => ({ label: `Neutral English Female – ${v.name}`, value: v.name })),
      ...voices.filter(v => v.lang === "en-GB" && v.name.toLowerCase().includes("male")).map(v => ({ label: `Neutral English Male – ${v.name}`, value: v.name })),
    ];
  };
  const [voiceOptions, setVoiceOptions] = useState(getAvailableVoices());
  const [selectedVoice, setSelectedVoice] = useState(voiceOptions[0]?.value || "");
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      const options = getAvailableVoices();
      setVoiceOptions(options);
      if (!options.find(v => v.value === selectedVoice)) {
        setSelectedVoice(options[0]?.value || "");
      }
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Function to clean up time strings for TTS to avoid "AM PM" reading issues
  const cleanTextForTTS = (text: string): string => {
    // Fix time format issues that cause TTS to read "AM PM" incorrectly
    return text
      // Remove special characters and symbols that cause TTS issues
      .replace(/🪔/g, 'Jai Shree Krishna')
      .replace(/[•·]/g, '')
      .replace(/[–—]/g, ' to ')
      .replace(/[^\w\s\-\.,:;()]/g, '') // Remove all special characters except basic punctuation
      // Fix "3:40 PM to 5:20 PM" becoming "3:40 AM PM to 5:20 AM PM"
      .replace(/(\d{1,2}:\d{2})\s+(AM|PM)\s+to\s+(\d{1,2}:\d{2})\s+(AM|PM)/g, '$1 $2 to $3 $4')
      // Fix "9:05 AM to 10:45 AM" becoming "9:05 AM PM to 10:45 AM PM"
      .replace(/(\d{1,2}:\d{2})\s+(AM|PM)\s+to\s+(\d{1,2}:\d{2})\s+(AM|PM)/g, '$1 $2 to $3 $4')
      // Fix any remaining "AM PM" combinations
      .replace(/(AM|PM)\s+(AM|PM)/g, '$1')
      // Fix "About" and "Around" for better TTS
      .replace(/About\s+/g, '')
      .replace(/Around\s+/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      // Handle Panchangam format better
      .replace(/(\d{1,2}:\d{2}\s+(?:AM|PM))/g, '$1')
      // Clean up any remaining formatting for better TTS
      .replace(/\s+/g, ' ')
      .trim();
  };

  const playMessage = (msgId: string, text: string) => {
    if (playingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setPlayingMsgId(msgId);
    
    // Clean the text for better TTS
    const cleanedText = cleanTextForTTS(text);
    
    const utterance = new window.SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name === selectedVoice) || voices[0];
    utterance.onend = () => setPlayingMsgId(null);
    utterance.onerror = () => setPlayingMsgId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Output post-processing for Perplexity responses
  function processPerplexityResponse(response: string, isMoreInfo: boolean = false): string {
    let lines = response.split('\n').map(line => line.trim()).filter(Boolean);

    // Remove only the most problematic reasoning/thinking lines
    const forbiddenPhrases = [
      "let's tackle this",
      "step by step", 
      "i need to check",
      "search results",
      "the instructions say",
      "wait,",
      "reasoning",
      "<think>",
      "<reasoning>",
      "</think>",
      "looking at",
      "the fifth source",
      "the fourth source",
      "the third source",
      "the first result",
      "please consult",
      "consult local panchang",
      "priests for precise timings",
      "please check drik panchang",
      "refer to drik panchang",
      "consult drik panchang",
      "check kksf",
      "refer to kksf",
      "consult kksf",
      "check other sources",
      "refer to other sources",
      "consult other sources"
    ];
    
    // Remove lines containing forbidden phrases and source references
    lines = lines.filter(line =>
      !forbiddenPhrases.some(phrase => line.toLowerCase().includes(phrase)) &&
      !/\[\d+\]/.test(line)
    );

    // Remove all asterisks (**) for Markdown bold
    lines = lines.map(line => line.replace(/\*\*/g, ""));

    // Keep the greeting but preserve all the actual content
    const jaiShreeIndex = lines.findIndex(line => line.includes('🪔 Jai Shree Krishna') || line.includes('Jai Shree Krishna'));
    if (jaiShreeIndex >= 0) {
      // Keep the greeting and everything after it
      lines = lines.slice(jaiShreeIndex);
    }

    // Ensure greeting is present
    if (!lines[0]?.includes('Jai Shree Krishna')) {
      lines.unshift('🪔 Jai Shree Krishna.');
    }

    // For panchangam questions, preserve more content
    const isPanchangamQuestion = /panchang|tithi|nakshatra|rahu|muhurat/i.test(response);
    const maxLines = isPanchangamQuestion ? 25 : 15;
    
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
    }

    // Keep meaningful content - don't truncate sentences aggressively
    lines = lines.map(line => {
      // For panchangam data, keep the full line
      if (isPanchangamQuestion && (line.includes(':') || line.includes('AM') || line.includes('PM') || line.includes('Tithi') || line.includes('Nakshatra'))) {
        return line;
      }
      
      // For other content, limit to 2 sentences
      const sentences = line.split('. ');
      return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    });

    return lines.join('\n');
  }

  // Extract location from user's question
  const extractLocationFromQuestion = (question: string): string | null => {
    const locationPatterns = [
      /in\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /at\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /for\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /location\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common words that aren't locations
        if (!/^(today|this|the|a|an|my|your|our|their|what|when|where|how|why|is|are|was|were|will|can|could|should|would|do|does|did)$/i.test(location)) {
          return location;
        }
      }
    }
    return null;
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

            onAddMessage(userMessage);
    setIsAsking(true);
    setApiError('');
    setQuestion('');

    try {
      // Call enhanced VoiceVedic API with location context
      const extractedLocation = extractLocationFromQuestion(userMessage.content);
      const request = {
        question: userMessage.content,
        location: extractedLocation || currentLocation?.location_name
      };
      
      console.log('🔍 API Request:', request);
      const response = await askVoiceVedic(request);
      console.log('🔍 API Response:', response);
      
      const responseText = response.answer;
      console.log('🔍 Response Text:', responseText);
      
      // Determine if user asked for 'more info'
      const isMoreInfo = /more info|full panchang|all details/i.test(userMessage.content);
      const processedText = processPerplexityResponse(responseText, isMoreInfo);
      console.log('🔍 Processed Text:', processedText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: processedText,
        timestamp: new Date()
      };

              onAddMessage(assistantMessage);

      // Trigger text-to-speech for the response
      if (responseText && responseText.trim() !== "") {
        setTimeout(() => {
          playMessage(assistantMessage.id, responseText);
        }, 300);
      }

    } catch (error: unknown) {
      console.error('Ask VoiceVedic error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMessage);
      
      let errorContent = 'I apologize, but I encountered an error while processing your question. Please try again.';
      
      if (errorMessage.includes('API key not configured')) {
        errorContent = 'Perplexity API key is not configured. Please check your environment variables.';
      } else if (errorMessage.includes('Perplexity API error')) {
        errorContent = 'There was an issue with the Perplexity service. Please try again in a moment.';
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };

              onAddMessage(errorResponse);
    } finally {
      setIsAsking(false);
    }
  };

  const startVoiceCapture = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Mic input is not supported on this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setQuestion('');
      setShowSuggestions(false);

      recognition.onstart = () => {
        console.log("🎙️ VoiceVedic is listening...");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const spokenText = event.results[0][0].transcript;
        console.log("✅ Heard:", spokenText);
        
        setQuestion(spokenText);
        setIsListening(false);
        
        setTimeout(() => {
          if (spokenText.trim()) {
            handleAskQuestion();
          }
        }, 150);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Mic Error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions and try again.");
        } else if (event.error === 'no-speech') {
          console.log("🔇 No speech detected, resetting...");
        } else {
          console.warn("❌ Voice recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Voice capture failed:", err);
      setIsListening(false);
    }
  };

  const clearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      onClearConversation();
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
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-2 py-1 rounded border text-sm text-spiritual-700 bg-white shadow"
            value={selectedVoice}
            onChange={e => setSelectedVoice(e.target.value)}
            style={{ minWidth: 180 }}
            title="Choose Voice Accent"
          >
            {voiceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
                Ask me about Hindu festivals, auspicious timings, rituals, or any spiritual guidance you need. For best results, include your location — like “When is the next Amavasya in Mumbai, India?”
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
                    {/* Sound icon for assistant messages */}
                    {message.type === 'assistant' && (
                      <button
                        className={`ml-2 p-1 rounded-full transition-colors duration-200 ${playingMsgId === message.id ? 'bg-yellow-200 text-yellow-800' : 'bg-spiritual-100 text-spiritual-700 hover:bg-yellow-100'}`}
                        onClick={() => {
                          if (playingMsgId === message.id) {
                            // If currently playing, stop and mute
                            window.speechSynthesis.cancel();
                            setPlayingMsgId(null);
                            setIsMuted(true);
                          } else {
                            // If not playing, start playing and unmute
                            setIsMuted(false);
                            playMessage(message.id, message.content);
                          }
                        }}
                        title={playingMsgId === message.id ? 'Stop Voice' : 'Play Voice'}
                      >
                        {playingMsgId === message.id ? <VolumeX className="w-5 h-5" /> : (isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />)}
                      </button>
                    )}
                  </div>
                  
                  <div className={`leading-relaxed tracking-spiritual whitespace-pre-line ${
                    message.type === 'user' ? 'text-white' : 'text-spiritual-800'
                  }`}>
                    {message.content}
                  </div>

                  {/* Audio Replay Button for Assistant Messages */}
                  {message.type === 'assistant' && (
                    <div className="mt-3 pt-3 border-t border-spiritual-200/30">
                      <button
                        onClick={() => {
                          setIsMuted(false);
                          playMessage(message.id, message.content);
                        }}
                        className="group flex items-center gap-2 text-spiritual-600 hover:text-spiritual-700 font-medium transition-all duration-300 tracking-spiritual"
                        title="Replay audio"
                      >
                        <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm">Replay</span>
                      </button>
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
            {micSupported && (
              <button
                onClick={startVoiceCapture}
                disabled={isAsking || isListening}
                className={`group relative overflow-hidden flex items-center justify-center w-12 h-12 rounded-full shadow-spiritual transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
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
                
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className={`w-5 h-5 transition-transform duration-300 ${!isAsking ? 'group-hover:scale-110' : ''}`} />
                )}
              </button>
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
      {isSpeaking && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          onClick={() => { setIsMuted(true); window.speechSynthesis.cancel(); }}
        >
          <VolumeX className="w-5 h-5" /> Mute
        </button>
      )}
    </div>
  );
};

export default AskVoiceVedicExperience;