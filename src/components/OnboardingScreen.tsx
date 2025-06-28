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
  ArrowLeft
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
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-200 to-cream-100 relative overflow-hidden">
      {/* Diagonal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-300/10 to-red-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-orange-200/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-amber-800 font-medium"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
      <div className={`absolute bottom-20 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-serif text-red-900 tracking-wide select-none animate-float animate-glow opacity-30" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 max-w-2xl mt-12">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3 leading-tight">
            Create Your Account &
            <br />
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Personalize Your Journey
            </span>
            <Sparkles className="inline-block w-8 h-8 ml-2 text-amber-600" />
          </h1>
          
          <p className="text-lg text-amber-800/80 font-medium">
            Set up your spiritual preferences to get started.
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Step 1: Calendar Tradition */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-xl font-semibold text-amber-900">Choose Your Calendar Tradition</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {calendarOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedCalendar(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:shadow-md ${
                    selectedCalendar === option.id
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-orange-200 bg-white/50 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <option.icon className={`w-5 h-5 mt-1 ${
                      selectedCalendar === option.id ? 'text-orange-600' : 'text-amber-600'
                    }`} />
                    <div>
                      <h4 className="font-medium text-amber-900 group-hover:text-orange-700">
                        {option.name}
                      </h4>
                      <p className="text-sm text-amber-700/70 mt-1">
                        {option.description}
                      </p>
                    </div>
                    {selectedCalendar === option.id && (
                      <Check className="w-5 h-5 text-orange-600 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Language Selection */}
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50 relative ${isLanguageDropdownOpen ? 'z-[100]' : 'z-10'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-xl font-semibold text-amber-900">Select Your Preferred Language</h3>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center justify-between w-full p-4 bg-white/70 border-2 border-orange-200 rounded-xl hover:border-orange-300 transition-all duration-300 text-amber-900 font-medium"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <span>{selectedLanguage}</span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden z-[101] max-h-60 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className={`block w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors duration-200 border-b border-orange-50 last:border-b-0 ${
                        selectedLanguage === language 
                          ? 'bg-orange-100 text-orange-800 font-medium' 
                          : 'text-gray-700 hover:text-orange-700'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Ritual Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-xl font-semibold text-amber-900">Choose the Rituals You Want to Track</h3>
            </div>
            
            <div className="space-y-3">
              {ritualOptions.map((ritual) => (
                <button
                  key={ritual.id}
                  onClick={() => handleRitualToggle(ritual.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:shadow-md ${
                    selectedRituals.includes(ritual.id)
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-orange-200 bg-white/50 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      selectedRituals.includes(ritual.id)
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-orange-300'
                    }`}>
                      {selectedRituals.includes(ritual.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <ritual.icon className={`w-5 h-5 ${
                      selectedRituals.includes(ritual.id) ? 'text-orange-600' : 'text-amber-600'
                    }`} />
                    <div>
                      <h4 className="font-medium text-amber-900 group-hover:text-orange-700">
                        {ritual.name}
                      </h4>
                      <p className="text-sm text-amber-700/70">
                        {ritual.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Notification Time */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
              <h3 className="text-xl font-semibold text-amber-900">Select Notification Time</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  When would you like to receive your daily update?
                </label>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none text-amber-900 font-medium bg-white/70"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 relative z-10">
            <button
              onClick={onComplete}
              disabled={!isFormValid}
              className={`group flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-2xl shadow-lg transition-all duration-300 transform ${
                isFormValid
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white hover:shadow-xl hover:scale-105 border-2 border-red-800/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!isFormValid ? "Please complete all required steps" : "Create your account and start your spiritual journey"}
            >
              <Sparkles className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'group-hover:rotate-12' : ''}`} />
              <span className="text-lg">Create Account & Get Started</span>
            </button>
            
            {isFormValid && (
              <p className="text-center text-sm text-amber-700/70 mt-3">
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