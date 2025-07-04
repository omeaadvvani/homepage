import React, { useState, useEffect } from 'react';
import { Globe, LogIn, UserPlus, Headphones, ChevronDown, MapPin, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import OnboardingScreen from './components/OnboardingScreen';
import GuestOnboardingScreen from './components/GuestOnboardingScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import DemoScreen from './components/DemoScreen';
import PreferencesScreen from './components/PreferencesScreen';
import ResetPinScreen from './components/ResetPinScreen';
import MainExperienceScreen from './components/MainExperienceScreen';
import SettingsScreen from './components/SettingsScreen';

function App() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSacredText, setShowSacredText] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'signup' | 'preferences' | 'guest-onboarding' | 'login' | 'demo' | 'reset-pin' | 'main-experience' | 'settings'>('home');
  const [location, setLocation] = useState<string>('Detecting location...');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [supabaseError, setSupabaseError] = useState<string>('');
  const [newUserNeedsPreferences, setNewUserNeedsPreferences] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<string>('home');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const { user, userProfile, loading: authLoading, signOut } = useAuth();

  const languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Malayalam',
    'Kannada'
  ];

  // Check for reset-pin route on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/reset-pin') {
      setCurrentScreen('reset-pin');
    }
    // Mark initial load as complete immediately
    setInitialLoadComplete(true);
  }, []);

  // Check Supabase configuration on mount
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'your_supabase_project_url' || 
        supabaseAnonKey === 'your_supabase_anon_key' ||
        supabaseUrl.includes('placeholder') ||
        supabaseAnonKey.includes('placeholder')) {
      setSupabaseError('Supabase is not properly configured. Please click "Connect to Supabase" in the top right corner.');
    }
  }, []);

  // Auto-detect location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get user's location using geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding to get city name
                const { latitude, longitude } = position.coords;
                
                // For demo purposes, we'll simulate the API call
                // In production, you'd use a service like OpenCage, MapBox, or Google Geocoding
                setTimeout(() => {
                  // Simulate different locations based on coordinates
                  const mockLocations = [
                    'New Delhi, India',
                    'Mumbai, India', 
                    'Bangalore, India',
                    'Chennai, India',
                    'Hyderabad, India',
                    'Kolkata, India'
                  ];
                  const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
                  setLocation(randomLocation);
                  setLocationStatus('success');
                }, 1000); // Reduced timeout
                
              } catch (error) {
                console.error('Geocoding error:', error);
                setLocation('Location unavailable');
                setLocationStatus('error');
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              setLocation('Location unavailable');
              setLocationStatus('error');
            },
            {
              timeout: 10000, // Reduced timeout to 10 seconds
              enableHighAccuracy: false,
              maximumAge: 300000 // 5 minutes
            }
          );
        } else {
          setLocation('Location unavailable');
          setLocationStatus('error');
        }
      } catch (error) {
        console.error('Location detection error:', error);
        setLocation('Location unavailable');
        setLocationStatus('error');
      }
    };

    detectLocation();
  }, []);

  // Handle user authentication state changes - SIMPLIFIED
  useEffect(() => {
    // Only proceed if initial load is complete
    if (!initialLoadComplete) return;

    // Don't wait for auth loading to complete - proceed immediately
    if (user) {
      // If user just signed up and needs to set preferences
      if (newUserNeedsPreferences) {
        setCurrentScreen('preferences');
        setNewUserNeedsPreferences(false);
      }
      // If user already has profile or preferences, show main experience
      else if (userProfile || guestMode) {
        setCurrentScreen('main-experience');
      }
      // If user is logged in but no profile and not in guest mode, stay on current screen
      // This prevents infinite redirects
    }
    // If no user and not in guest mode, ensure we're on an appropriate screen
    else if (!guestMode && !['home', 'signup', 'login', 'demo', 'reset-pin', 'guest-onboarding'].includes(currentScreen)) {
      setCurrentScreen('home');
    }
  }, [user, userProfile, newUserNeedsPreferences, guestMode, initialLoadComplete, currentScreen]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogin = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setCurrentScreen('login');
  };

  const handleSignUp = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setCurrentScreen('signup');
  };

  const handleContinueAsGuest = () => {
    setCurrentScreen('guest-onboarding');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setNewUserNeedsPreferences(false);
    setGuestMode(false);
    setPreviousScreen('home');
    // Clear URL if we're on reset-pin route
    if (window.location.pathname === '/reset-pin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleBackToMainExperience = () => {
    setCurrentScreen('main-experience');
  };

  const handleSignUpComplete = () => {
    // After successful sign-up, move to preferences screen
    setNewUserNeedsPreferences(true);
    // The useEffect will handle moving to preferences screen
  };

  const handlePreferencesComplete = () => {
    // Preferences saved successfully - move to main experience
    setCurrentScreen('main-experience');
  };

  const handleGuestOnboardingComplete = () => {
    // Guest onboarding completed - move to main experience in guest mode
    setGuestMode(true);
    setCurrentScreen('main-experience');
  };

  const handleLoginComplete = () => {
    // Login completed - move to main experience
    setCurrentScreen('main-experience');
  };

  const handleTryDemo = () => {
    setCurrentScreen('demo');
  };

  const handleShowPreferences = () => {
    // Store current screen as previous for proper back navigation
    setPreviousScreen(currentScreen);
    setCurrentScreen('preferences');
  };

  const handleShowSettings = () => {
    // Store current screen as previous for proper back navigation
    setPreviousScreen(currentScreen);
    setCurrentScreen('settings');
  };

  const handleResetPinComplete = () => {
    // PIN reset completed, redirect to login
    alert('Your PIN has been reset successfully! Please log in with your new PIN.');
    setCurrentScreen('login');
    // Clear URL
    window.history.pushState({}, '', '/');
  };

  const handleLogout = async () => {
    try {
      // Call Supabase signOut
      await signOut();
      
      // Reset all state
      setGuestMode(false);
      setNewUserNeedsPreferences(false);
      setPreviousScreen('home');
      
      // Navigate to home screen
      setCurrentScreen('home');
      
      // Optional: Show logout success message
      // You could implement a toast notification here
      console.log('Logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, still redirect to home for UX
      setCurrentScreen('home');
    }
  };

  // Fade in the sacred text after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Show loading ONLY if initial load is not complete AND auth is still loading
  if (!initialLoadComplete && authLoading) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-spiritual-700 tracking-spiritual">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Reset PIN screen if on that route
  if (currentScreen === 'reset-pin') {
    return <ResetPinScreen onComplete={handleResetPinComplete} onBack={handleBackToHome} />;
  }

  // Show Main Experience if user is authenticated or in guest mode
  if (currentScreen === 'main-experience') {
    return (
      <MainExperienceScreen 
        onChangePreferences={handleShowPreferences}
        onShowSettings={handleShowSettings}
        onLogout={guestMode ? handleBackToHome : handleLogout}
      />
    );
  }

  if (currentScreen === 'signup') {
    return <SignUpScreen onComplete={handleSignUpComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'preferences') {
    // Determine the correct back handler based on previous screen
    const backHandler = previousScreen === 'main-experience' ? handleBackToMainExperience : handleBackToHome;
    return (
      <PreferencesScreen 
        onComplete={handlePreferencesComplete} 
        onBack={backHandler} 
        detectedLocation={location} 
      />
    );
  }

  if (currentScreen === 'settings') {
    // Determine the correct back handler based on previous screen
    const backHandler = previousScreen === 'main-experience' ? handleBackToMainExperience : handleBackToHome;
    return (
      <SettingsScreen 
        onBack={backHandler}
        onChangePreferences={handleShowPreferences}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'guest-onboarding') {
    return <GuestOnboardingScreen onComplete={handleGuestOnboardingComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onComplete={handleLoginComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'demo') {
    return <DemoScreen onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Supabase Error Banner */}
      {supabaseError && (
        <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-3 z-30">
          <div className="flex items-center justify-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium tracking-spiritual">{supabaseError}</p>
          </div>
        </div>
      )}
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
      <div className={`absolute bottom-24 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-spiritual text-spiritual-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ lineHeight: '1.3' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Top Right Controls - Language & Location */}
      <div className={`absolute ${supabaseError ? 'top-20' : 'top-6'} right-6 z-20 flex items-center gap-4`}>
        
        {/* Location Auto-Detect */}
        <div className="group relative">
          <div 
            className={`flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 ${
              locationStatus === 'success' ? 'hover:bg-white hover:shadow-spiritual-lg' : ''
            }`}
            title="Used to calculate accurate ritual timings based on your region"
          >
            <MapPin className={`w-5 h-5 transition-colors duration-300 ${
              locationStatus === 'loading' ? 'text-spiritual-500 animate-pulse' :
              locationStatus === 'success' ? 'text-accent-600' :
              'text-gray-400'
            }`} />
            <span className={`text-sm font-medium transition-colors duration-300 tracking-spiritual ${
              locationStatus === 'loading' ? 'text-spiritual-700' :
              locationStatus === 'success' ? 'text-spiritual-800' :
              'text-gray-500'
            }`}>
              {location}
            </span>
            {locationStatus === 'loading' && (
              <div className="w-3 h-3 border border-spiritual-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-spiritual-900 text-white text-xs rounded-spiritual opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30 shadow-spiritual-lg">
            Used to calculate accurate ritual timings based on your region
            <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-spiritual-900"></div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          >
            <Globe className="w-5 h-5 text-spiritual-600" />
            <span className="text-sm">{selectedLanguage}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-card shadow-spiritual-lg border border-spiritual-100 overflow-hidden min-w-32 z-30">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-spiritual-50 transition-colors duration-200 tracking-spiritual ${
                    selectedLanguage === language 
                      ? 'bg-spiritual-100 text-spiritual-800 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center min-h-screen px-6 pb-24 relative z-10 ${supabaseError ? 'pt-20' : ''}`}>
        
        {/* Center Block */}
        <div className="text-center mb-12 max-w-2xl animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
            Namaste. Welcome to
            <br />
            <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          <h2 className="text-xl md:text-2xl text-spiritual-800/80 font-medium mb-8 tracking-spiritual line-height-spiritual-relaxed">
            Your daily spiritual companion
          </h2>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-6 w-full max-w-sm animate-slide-up">
          {/* Login Button */}
          <button 
            onClick={handleLogin}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <LogIn className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Login</span>
          </button>

          {/* Sign Up Button - Direct to Sign Up */}
          <button 
            onClick={handleSignUp}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-900/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-900 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <UserPlus className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Sign Up</span>
          </button>

          {/* Try Demo Button */}
          <button 
            onClick={handleTryDemo}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border-2 border-spiritual-300 hover:border-spiritual-400 text-spiritual-900 font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-spiritual-200/50"
          >
            {/* Subtle Background Glow */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-100 to-spiritual-200 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            
            <Headphones className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300 relative z-10" />
            <span className="text-lg tracking-spiritual relative z-10">Try Demo</span>
          </button>
        </div>

        {/* Guest Access */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleContinueAsGuest}
            className="group text-spiritual-700 hover:text-spiritual-600 font-medium transition-colors duration-300 relative tracking-spiritual"
            title="Explore basic features without logging in"
          >
            <span className="relative">
              Continue as Guest
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-spiritual-400 group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cream-100/60 to-transparent py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Terms of Service
            </a>
            <span className="text-spiritual-400">|</span>
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Privacy Policy
            </a>
            <span className="text-spiritual-400">|</span>
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              About Us
            </a>
          </div>
          <div className="text-center text-spiritual-600 text-sm font-medium tracking-spiritual">
            Made with love by the VoiceVedic Team
          </div>
        </div>
      </footer>

      {/* Click outside to close dropdown */}
      {isLanguageDropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsLanguageDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;