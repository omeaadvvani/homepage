import React, { useState, useEffect } from 'react';
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
  Moon
} from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import SafeRenderer from './SafeRenderer';

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
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [showSacredText, setShowSacredText] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { upsertPreferences, loading } = useUserPreferences();

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

  const handleCalendarSelect = (selectedCalendar: string) => {
    setCalendarType(selectedCalendar);
    setIsCalendarDropdownOpen(false);
  };

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

      const { error } = await upsertPreferences({
        language,
        calendar_type: selectedCalendarOption?.name || 'North Indian (Drik Panchang)',
        location: detectedLocation,
        notification_time: notificationTime
      });

      if (error) {
        setSaveError(error);
        return;
      }

      setSaveSuccess(true);
      
      // Show success message briefly, then complete
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err: any) {
      setSaveError(err.message || 'Failed to save preferences');
    }
  };

  const isFormValid = language && calendarType && selectedRituals.length > 0;

  // Determine data readiness - for preferences, we just need the form to be ready
  const isDataReady = true; // Preferences screen doesn't depend on external data initially
  const hasError = !!saveError && !saveSuccess; // Only show error if not in success state
  const isLoading = false; // No initial loading state for preferences

  return (
    <SafeRenderer
      isLoading={isLoading}
      hasError={hasError}
      dataReady={isDataReady}
      errorMessage={saveError || "Unable to load preferences form. Please refresh the page."}
    >
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

          {saveError && !saveSuccess && (
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

            {/* Step 3: Ritual Selection */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
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

            {/* Step 4: Notification Time */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-spiritual-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
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
              <button
                onClick={handleSavePreferences}
                disabled={!isFormValid || loading || saveSuccess}
                className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                  isFormValid && !loading && !saveSuccess
                    ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!isFormValid ? "Please complete all required steps" : "Save your preferences"}
              >
                {/* Glow Effect */}
                {isFormValid && !loading && !saveSuccess && (
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
                    <Save className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                    <span className="text-lg">Save Preferences</span>
                  </>
                )}
              </button>
              
              {isFormValid && (
                <p className="text-center text-sm text-spiritual-700/70 mt-4 tracking-spiritual">
                  You can change these preferences anytime in Settings.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SafeRenderer>
  );
};

export default PreferencesScreen;