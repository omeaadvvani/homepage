import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Globe, 
  Moon, 
  Bell, 
  AlertCircle, 
  BookOpen, 
  Clock,
  ChevronDown,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MapPin
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedRituals, setSelectedRituals] = useState<string[]>([]);
  const [notificationTime, setNotificationTime] = useState('07:00');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showSacredText, setShowSacredText] = useState(false);

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
    }
  ];

  const languages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'
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

  const handleRitualToggle = (ritualId: string) => {
    setSelectedRituals(prev => 
      prev.includes(ritualId) 
        ? prev.filter(id => id !== ritualId)
        : [...prev, ritualId]
    );
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const isFormValid = selectedCalendar && selectedLanguage && selectedRituals.length > 0;

  return (
    <div className="min-h-screen bg-spiritual-gradient relative overflow-hidden">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-400/10 via-transparent to-maroon-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 hover:bg-white hover:shadow-xl hover:border-saffron-300 transition-all duration-300 text-maroon-800 font-medium font-soft-sans"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-saffron-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm tracking-spiritual">Back</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-8 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-3xl md:text-4xl font-spiritual text-maroon-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start min-h-screen px-6 py-12 relative z-10">
        
        {/* Header Section - Enhanced Typography */}
        <div className="text-center mb-12 max-w-3xl" style={{ marginTop: '72px' }}>
          <h1 className="text-4xl md:text-5xl font-spiritual font-bold text-maroon-900 mb-4 leading-spiritual tracking-spiritual">
            Let's Personalize Your
            <br />
            <span className="bg-gradient-to-r from-saffron-600 to-maroon-600 bg-clip-text text-transparent">
              Spiritual Journey
            </span>
            <Sparkles className="inline-block w-8 h-8 ml-3 text-saffron-600" />
          </h1>
          
          <p className="text-xl text-maroon-800/80 font-medium font-soft-sans tracking-wide-spiritual leading-relaxed-spiritual">
            So we can serve you better, every day.
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="w-full max-w-3xl space-y-12">
          
          {/* Step 1: Calendar Tradition */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full flex items-center justify-center font-bold text-lg font-soft-sans shadow-lg">1</div>
              <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Choose Your Calendar Tradition</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendarOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedCalendar(option.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${
                    selectedCalendar === option.id
                      ? 'border-saffron-400 bg-saffron-50 shadow-lg animate-spiritual-pulse'
                      : 'border-saffron-200 bg-white/70 hover:border-saffron-300 hover:bg-saffron-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <option.icon className={`w-6 h-6 mt-1 ${
                      selectedCalendar === option.id ? 'text-saffron-600' : 'text-maroon-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold font-soft-sans text-maroon-900 group-hover:text-saffron-700 text-lg tracking-spiritual">
                        {option.name}
                      </h4>
                      <p className="text-sm text-maroon-700/70 mt-2 font-soft-sans leading-relaxed-spiritual">
                        {option.description}
                      </p>
                    </div>
                    {selectedCalendar === option.id && (
                      <Check className="w-6 h-6 text-saffron-600 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Language Selection */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50 relative ${isLanguageDropdownOpen ? 'z-[100]' : 'z-10'}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full flex items-center justify-center font-bold text-lg font-soft-sans shadow-lg">2</div>
              <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Select Your Preferred Language</h3>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center justify-between w-full p-6 bg-white/80 border-2 border-saffron-200 rounded-2xl hover:border-saffron-300 hover:bg-saffron-50/50 transition-all duration-300 text-maroon-900 font-medium font-soft-sans shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-saffron-600" />
                  <span className="text-lg tracking-spiritual">{selectedLanguage}</span>
                </div>
                <ChevronDown className={`w-6 h-6 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-saffron-100 overflow-hidden z-[101] max-h-72 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className={`block w-full text-left px-6 py-4 hover:bg-saffron-50 transition-colors duration-200 border-b border-saffron-50 last:border-b-0 font-soft-sans ${
                        selectedLanguage === language 
                          ? 'bg-saffron-100 text-saffron-800 font-semibold' 
                          : 'text-maroon-700 hover:text-saffron-700'
                      }`}
                    >
                      <span className="tracking-spiritual">{language}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Ritual Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full flex items-center justify-center font-bold text-lg font-soft-sans shadow-lg">3</div>
              <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Choose the Rituals You Want to Track</h3>
            </div>
            
            <div className="space-y-4">
              {ritualOptions.map((ritual) => (
                <button
                  key={ritual.id}
                  onClick={() => handleRitualToggle(ritual.id)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${
                    selectedRituals.includes(ritual.id)
                      ? 'border-saffron-400 bg-saffron-50 shadow-lg animate-spiritual-pulse'
                      : 'border-saffron-200 bg-white/70 hover:border-saffron-300 hover:bg-saffron-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                      selectedRituals.includes(ritual.id)
                        ? 'border-saffron-500 bg-saffron-500'
                        : 'border-saffron-300'
                    }`}>
                      {selectedRituals.includes(ritual.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <ritual.icon className={`w-6 h-6 ${
                      selectedRituals.includes(ritual.id) ? 'text-saffron-600' : 'text-maroon-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold font-soft-sans text-maroon-900 group-hover:text-saffron-700 text-lg tracking-spiritual">
                        {ritual.name}
                      </h4>
                      <p className="text-sm text-maroon-700/70 font-soft-sans leading-relaxed-spiritual">
                        {ritual.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Notification Time */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full flex items-center justify-center font-bold text-lg font-soft-sans shadow-lg">4</div>
              <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Select Notification Time</h3>
            </div>
            
            <div className="flex items-center gap-6">
              <Bell className="w-6 h-6 text-saffron-600" />
              <div className="flex-1">
                <label className="block text-lg font-medium font-soft-sans text-maroon-800 mb-4 tracking-spiritual">
                  When would you like to receive your daily update?
                </label>
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-maroon-600" />
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="px-6 py-4 border-2 border-saffron-200 rounded-2xl focus:border-saffron-400 focus:outline-none focus:ring-4 focus:ring-saffron-200/50 text-maroon-900 font-medium font-soft-sans bg-white/80 text-lg tracking-spiritual shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Location (Auto-detected) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50 relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full flex items-center justify-center font-bold text-lg font-soft-sans shadow-lg">5</div>
              <h3 className="text-2xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Location</h3>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
              <MapPin className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-lg font-medium font-soft-sans text-green-800 tracking-spiritual">Auto-detected Location</p>
                <p className="text-green-700 font-soft-sans">New Delhi, India</p>
                <p className="text-sm text-green-600 mt-2 font-soft-sans leading-relaxed-spiritual">
                  Used to calculate accurate ritual timings based on your region.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8 relative z-10">
            <button
              onClick={onComplete}
              disabled={!isFormValid}
              className={`group relative overflow-hidden flex items-center justify-center gap-4 w-full py-6 px-8 font-semibold font-soft-sans rounded-3xl shadow-xl transition-all duration-300 transform ${
                isFormValid
                  ? 'bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-500 hover:to-yellow-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] border-2 border-saffron-600/30 hover:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-200/50 animate-spiritual-pulse'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!isFormValid ? "Please complete all required steps" : "Continue to account creation"}
            >
              {/* Glow Effect */}
              {isFormValid && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-saffron-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              <ArrowRight className={`w-6 h-6 transition-transform duration-300 ${isFormValid ? 'group-hover:translate-x-1 group-active:translate-x-0' : ''}`} />
              <span className="text-xl tracking-spiritual">Begin My Spiritual Flow</span>
            </button>
            
            {isFormValid && (
              <p className="text-center text-base text-maroon-700/70 mt-6 font-soft-sans tracking-spiritual leading-relaxed-spiritual">
                You can change these preferences anytime in Settings.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isLanguageDropdownOpen && (
        <div 
          className="fixed inset-0 z-[99]" 
          onClick={() => setIsLanguageDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default OnboardingScreen;