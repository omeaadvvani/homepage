import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Clock, 
  Sparkles, 
  Send, 
  RotateCcw, 
  Settings, 
  Moon, 
  Sun, 
  Bell,
  ArrowRight,
  MessageCircle,
  ChevronRight,
  Scroll,
  Volume2,
  Mic,
  MicOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface MainExperienceScreenProps {
  onChangePreferences: () => void;
  onShowSettings: () => void;
  onLogout?: () => void;
}

interface SpiritualEvent {
  id: string;
  name: string;
  date: string;
  time_start: string;
  time_end: string;
  guidance: string;
  type: 'tithi' | 'festival' | 'fast' | 'prayer';
}

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  action: string;
  days_away: number;
}

const MainExperienceScreen: React.FC<MainExperienceScreenProps> = ({ 
  onChangePreferences, 
  onShowSettings,
  onLogout 
}) => {
  const { user, userProfile } = useAuth();
  const { preferences } = useUserPreferences();
  
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showSacredText, setShowSacredText] = useState(false);
  const [todayEvent, setTodayEvent] = useState<SpiritualEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  // Sample spiritual events data (in production, this would come from your database)
  const sampleEvents: SpiritualEvent[] = [
    {
      id: '1',
      name: 'Pradosham',
      date: new Date().toISOString().split('T')[0],
      time_start: '16:40',
      time_end: '18:10',
      guidance: 'Offer water to Lord Shiva and observe silence during this auspicious time.',
      type: 'prayer'
    }
  ];

  const sampleUpcoming: UpcomingEvent[] = [
    {
      id: '1',
      name: 'Ekadashi',
      date: '2025-01-02',
      action: 'Fast and offer prayers to Lord Vishnu',
      days_away: 3
    },
    {
      id: '2',
      name: 'Amavasya',
      date: '2025-01-05',
      action: 'Offer prayers to ancestors and light diyas',
      days_away: 6
    },
    {
      id: '3',
      name: 'Makar Sankranti',
      date: '2025-01-14',
      action: 'Celebrate harvest festival with til-gud',
      days_away: 15
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check mic support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);
  }, []);
  // Load today's event
  useEffect(() => {
    // In production, fetch from Supabase based on user's calendar type and location
    setTodayEvent(sampleEvents[0]);
    setUpcomingEvents(sampleUpcoming);
  }, [preferences]);

  // Enhanced Text-to-Speech function with improved safety and voice selection
  const speak = (text: string) => {
    try {
      if (!text || text.trim() === "") return;

      const synth = window.speechSynthesis;
      
      // Stop any currently speaking utterance
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);

      // Good pace and tone
      utterance.lang = "en-IN";
      utterance.rate = 0.85;
      utterance.pitch = 1.1;

      // SAFELY load voices
      const setVoice = () => {
        const voices = synth.getVoices();

        // Preferred female voices (pick what your device supports)
        const preferredVoice = voices.find((v) =>
          v.name === "Google UK English Female" ||
          v.name === "Microsoft Zira Desktop - English (United States)" ||
          v.name === "Samantha" ||
          v.name === "Karen" ||
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("google")
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        synth.speak(utterance);
      };

      // Handle voice loading on some browsers
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = () => setVoice();
      } else {
        setVoice();
      }
    } catch (error) {
      console.warn('Text-to-speech not supported or failed:', error);
      // Silently fail gracefully
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    setResponse('');
    setApiError('');

    try {
      // Get user context for API call
      const userLocation = preferences?.location || userProfile?.location || null;
      const userCalendar = preferences?.calendar_type || userProfile?.calendar_tradition || null;

      // Prepare API payload
      const payload: any = {
        question: question.trim()
      };

      // Add context if available (fallback for guest users)
      if (userLocation) {
        payload.location = userLocation;
      }
      if (userCalendar) {
        payload.calendar = userCalendar;
      }

      // Call Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/ask-voicevedic`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const responseText = data.answer || 'Sorry, I couldn\'t provide a response at this time.';
      setResponse(responseText);

      // Trigger text-to-speech safely
      if (responseText && responseText.trim() !== "") {
        setTimeout(() => {
          speak(responseText);
        }, 300);
      }

    } catch (error: any) {
      console.error('Ask VoiceVedic error:', error);
      setApiError(error.message || 'Failed to get response');
      
      // Fallback response for better UX
      const fallbackResponse = 'I\'m unable to respond right now. Please try again in a moment. Your spiritual journey continues with patience and devotion.';
      setResponse(fallbackResponse);
      
    } finally {
      setIsAsking(false);
    }
  };

  const handleTryAnother = () => {
    setQuestion('');
    setResponse('');
    setApiError('');
    // Stop any currently speaking utterance
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.warn('Could not cancel speech synthesis:', error);
    }
  };

  const handleReplayAudio = () => {
    if (response && response.trim() !== "") {
      speak(response);
    }
  };

  const startVoiceCapture = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Voice input is not supported on this browser. Please try Chrome or Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      setIsListening(true);

      recognition.onstart = () => {
        console.log("🎙️ Listening...");
      };

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        console.log("Heard:", spokenText);
        
        // Fill the input field with spoken text
        setQuestion(spokenText);
        setIsListening(false);
        
        // Auto-trigger the ask function after a short delay
        setTimeout(() => {
          if (spokenText.trim()) {
            handleAskQuestion();
          }
        }, 500);
      };

      recognition.onerror = (event) => {
        console.error("Mic Error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions and try again.");
        } else if (event.error === 'no-speech') {
          alert("No speech detected. Please try speaking again.");
        } else {
          alert("Voice recognition error. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Mic capture failed:", err);
      setIsListening(false);
      alert("Voice input failed. Please try typing your question instead.");
    }
  };
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'prayer': return <Moon className="w-5 h-5" />;
      case 'festival': return <Sun className="w-5 h-5" />;
      case 'fast': return <Bell className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  // Get display values with fallbacks
  const displayLanguage = preferences?.language || userProfile?.preferred_language || 'English';
  const displayCalendar = preferences?.calendar_type || userProfile?.calendar_tradition || 'North Indian';
  const displayLocation = preferences?.location || userProfile?.location || 'India';

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Settings Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onShowSettings}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="App Settings"
        >
          <Settings className="w-5 h-5 text-spiritual-600 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm">Settings</span>
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
        <div className="text-center mb-8 max-w-4xl mt-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-spiritual-900 mb-4 leading-spiritual tracking-spiritual">
            {getGreeting()}, Welcome to
            <br />
            <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          {/* User Context Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-spiritual-700">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-spiritual border border-spiritual-200/50">
              <Calendar className="w-4 h-4 text-spiritual-600" />
              <span className="text-sm font-medium tracking-spiritual">{displayCalendar}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-spiritual border border-spiritual-200/50">
              <Globe className="w-4 h-4 text-spiritual-600" />
              <span className="text-sm font-medium tracking-spiritual">{displayLanguage}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-spiritual border border-spiritual-200/50">
              <MapPin className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium tracking-spiritual">{displayLocation}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="w-full max-w-4xl space-y-8 animate-slide-up">
          
          {/* Today's Spiritual Timing Block */}
          {todayEvent && (
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
              <div className="flex items-center gap-3 mb-4">
                {getEventIcon(todayEvent.type)}
                <h2 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Today's Spiritual Focus</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold text-spiritual-800 mb-2 tracking-spiritual">
                    {todayEvent.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4 text-spiritual-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium tracking-spiritual">
                      {formatTime(todayEvent.time_start)} – {formatTime(todayEvent.time_end)}
                    </span>
                  </div>
                  <p className="text-spiritual-700 leading-relaxed tracking-spiritual">
                    {todayEvent.guidance}
                  </p>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-center p-4 bg-spiritual-50 rounded-spiritual border border-spiritual-200/50">
                    <div className="text-2xl font-bold text-spiritual-800 tracking-spiritual">
                      {formatTime(currentTime.toTimeString().slice(0, 5))}
                    </div>
                    <div className="text-sm text-spiritual-600 tracking-spiritual">Current Time</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ask VoiceVedic Block */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-spiritual-600" />
              <div>
                <h2 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Ask VoiceVedic</h2>
                <p className="text-spiritual-700/80 tracking-spiritual">Get spiritual answers in simple 3-line guidance</p>
              </div>
            </div>
            
            {/* Question Input */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isAsking && handleAskQuestion()}
                    placeholder="e.g. When is Amavasya this month?"
                    className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual"
                    disabled={isAsking}
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

              {/* Voice Input Status */}
              {isListening && (
                <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-800 font-medium tracking-spiritual">
                      🎙️ Listening... Speak your question now
                    </span>
                  </div>
                </div>
              )}

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-3">
                  <p className="text-sm text-red-700 tracking-spiritual">
                    <strong>Connection Error:</strong> {apiError}
                  </p>
                </div>
              )}

              {/* Response Display */}
              {(isAsking || response) && (
                <div className="bg-spiritual-50/70 border border-spiritual-200/50 rounded-spiritual p-4">
                  {isAsking ? (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-spiritual-600 animate-pulse" />
                      <span className="text-spiritual-800 font-medium tracking-spiritual">VoiceVedic is thinking...</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Scroll className="w-5 h-5 text-spiritual-600" />
                        <span className="text-sm font-medium text-spiritual-800 tracking-spiritual">VoiceVedic says:</span>
                      </div>
                      <div className="text-spiritual-800 leading-relaxed tracking-spiritual mb-4 whitespace-pre-line">
                        {response}
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleTryAnother}
                          className="group flex items-center gap-2 text-spiritual-600 hover:text-spiritual-700 font-medium transition-colors duration-300 tracking-spiritual"
                        >
                          <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                          <span>Ask Another Question</span>
                        </button>
                        
                        {/* Speaker Icon for Voice Replay */}
                        <button
                          onClick={handleReplayAudio}
                          className="group flex items-center gap-2 text-spiritual-600 hover:text-spiritual-700 font-medium transition-all duration-300 tracking-spiritual opacity-0 animate-fade-in"
                          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
                          title="Replay audio"
                        >
                          <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm">Replay</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Preview */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-spiritual-600" />
                <h2 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Upcoming Events</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-spiritual-50/50 rounded-spiritual border border-spiritual-200/30 hover:bg-spiritual-50 transition-colors duration-300">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-spiritual-900 tracking-spiritual">{event.name}</h3>
                      <span className="text-xs bg-spiritual-200 text-spiritual-800 px-2 py-1 rounded-full font-medium tracking-spiritual">
                        {event.days_away} days
                      </span>
                    </div>
                    <p className="text-sm text-spiritual-700 tracking-spiritual">{event.action}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-spiritual-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onChangePreferences}
              className="group flex items-center justify-center gap-3 flex-1 px-6 py-4 bg-white/70 border-2 border-spiritual-300 hover:border-spiritual-400 text-spiritual-900 font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 tracking-spiritual"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Change My Preferences</span>
            </button>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="group flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-200/50 tracking-spiritual"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainExperienceScreen;