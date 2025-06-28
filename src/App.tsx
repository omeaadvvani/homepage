import React, { useState, useEffect } from 'react';
import { Globe, LogIn, UserPlus, Headphones, ChevronDown, MapPin } from 'lucide-react';
import OnboardingScreen from './components/OnboardingScreen';
import GuestOnboardingScreen from './components/GuestOnboardingScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import DemoScreen from './components/DemoScreen';

function App() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSacredText, setShowSacredText] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'onboarding' | 'guest-onboarding' | 'signup' | 'login' | 'demo'>('home');
  const [location, setLocation] = useState<string>('Detecting location...');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Malayalam',
    'Kannada'
  ];

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
                }, 1500);
                
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
              timeout: 30000, // Increased timeout to 30 seconds
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

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogin = () => {
    setCurrentScreen('login');
  };

  const handleSignUp = () => {
    setCurrentScreen('onboarding');
  };

  const handleContinueAsGuest = () => {
    setCurrentScreen('guest-onboarding');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleOnboardingComplete = () => {
    // Move to sign-up screen after onboarding
    setCurrentScreen('signup');
  };

  const handleGuestOnboardingComplete = () => {
    // Here you would typically navigate to the main app in guest mode
    console.log('Guest onboarding completed!');
    // For demo purposes, we'll just show an alert
    alert('Welcome to VoiceVedic! Explore our features as a guest. You can create an account anytime to save your preferences. 🙏');
  };

  const handleSignUpComplete = () => {
    // Here you would typically navigate to the main app
    console.log('Sign-up completed!');
    // For demo purposes, we'll just show an alert
    alert('Welcome to VoiceVedic! Your account has been created successfully. Your spiritual journey begins now. 🙏');
  };

  const handleLoginComplete = () => {
    // Here you would typically navigate to the main app
    console.log('Login completed!');
    // For demo purposes, we'll just show an alert
    alert('Welcome back to VoiceVedic! Your spiritual journey continues. 🙏');
  };

  const handleTryDemo = () => {
    setCurrentScreen('demo');
  };

  // Fade in the sacred text after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (currentScreen === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'guest-onboarding') {
    return <GuestOnboardingScreen onComplete={handleGuestOnboardingComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'signup') {
    return <SignUpScreen onComplete={handleSignUpComplete} onBack={() => setCurrentScreen('onboarding')} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onComplete={handleLoginComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'demo') {
    return <DemoScreen onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-spiritual-gradient relative overflow-hidden">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-400/10 via-transparent to-maroon-900/5"></div>
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
      <div className={`absolute bottom-8 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-3xl md:text-4xl font-spiritual text-maroon-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Top Right Controls - Language & Location */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        
        {/* Location Auto-Detect */}
        <div className="group relative">
          <div 
            className={`flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 transition-all duration-300 hover:shadow-xl hover:bg-white ${
              locationStatus === 'success' ? 'hover:border-saffron-300' : ''
            }`}
            title="Used to calculate accurate ritual timings based on your region"
          >
            <MapPin className={`w-4 h-4 transition-colors duration-300 ${
              locationStatus === 'loading' ? 'text-saffron-500 animate-pulse' :
              locationStatus === 'success' ? 'text-green-600' :
              'text-gray-400'
            }`} />
            <span className={`text-sm font-medium font-soft-sans transition-colors duration-300 ${
              locationStatus === 'loading' ? 'text-saffron-700' :
              locationStatus === 'success' ? 'text-maroon-800' :
              'text-gray-500'
            }`}>
              {location}
            </span>
            {locationStatus === 'loading' && (
              <div className="w-3 h-3 border border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-maroon-900 text-white text-xs font-soft-sans rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30 shadow-xl">
            Used to calculate accurate ritual timings based on your region
            <div className="absolute bottom-full right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-maroon-900"></div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 hover:bg-white hover:shadow-xl hover:border-saffron-300 transition-all duration-300 text-maroon-800 font-medium font-soft-sans animate-spiritual-pulse"
          >
            <Globe className="w-4 h-4 text-saffron-600" />
            <span className="text-sm">{selectedLanguage}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-saffron-100 overflow-hidden min-w-40 z-30">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={`block w-full text-left px-5 py-4 text-sm font-soft-sans hover:bg-saffron-50 transition-colors duration-200 ${
                    selectedLanguage === language 
                      ? 'bg-saffron-100 text-saffron-800 font-medium' 
                      : 'text-maroon-700 hover:text-saffron-700'
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
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-24 relative z-10">
        
        {/* Center Block - Enhanced Typography */}
        <div className="text-center mb-18 max-w-3xl" style={{ marginTop: '72px' }}>
          <h1 className="text-5xl md:text-7xl font-spiritual font-bold text-maroon-900 mb-6 leading-spiritual tracking-spiritual">
            Namaste. Welcome to
            <br />
            <span className="bg-gradient-to-r from-saffron-600 to-maroon-600 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-maroon-800/80 font-medium font-soft-sans mb-12 tracking-wide-spiritual leading-relaxed-spiritual">
            Your daily spiritual companion
          </h2>
        </div>

        {/* CTA Buttons - Enhanced with Visual DNA */}
        <div className="flex flex-col gap-6 w-full max-w-md">
          {/* Login Button */}
          <button 
            onClick={handleLogin}
            className="group relative overflow-hidden flex items-center justify-center gap-4 w-full py-5 px-8 bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-500 hover:to-yellow-500 text-white font-semibold font-soft-sans rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-saffron-600/30 hover:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-200/50 animate-spiritual-pulse"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-saffron-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <LogIn className="w-6 h-6 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Login</span>
          </button>

          {/* Sign Up Button */}
          <button 
            onClick={handleSignUp}
            className="group relative overflow-hidden flex items-center justify-center gap-4 w-full py-5 px-8 bg-gradient-to-r from-maroon-500 to-maroon-600 hover:from-maroon-600 hover:to-red-600 text-white font-semibold font-soft-sans rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-maroon-700/30 hover:border-red-600/50 focus:outline-none focus:ring-4 focus:ring-maroon-200/50"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-maroon-500 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <UserPlus className="w-6 h-6 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Sign Up</span>
          </button>

          {/* Try Demo Button */}
          <button 
            onClick={handleTryDemo}
            className="group relative overflow-hidden flex items-center justify-center gap-4 w-full py-5 px-8 bg-gradient-to-r from-saffron-400 to-yellow-500 hover:from-yellow-500 hover:to-orange-400 text-maroon-900 font-semibold font-soft-sans rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-saffron-600/40 hover:border-orange-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-200/50"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <Headphones className="w-6 h-6 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Try Demo</span>
          </button>
        </div>

        {/* Guest Access - Enhanced Typography */}
        <div className="mt-12 text-center">
          <button 
            onClick={handleContinueAsGuest}
            className="group text-maroon-700 hover:text-saffron-600 font-medium font-soft-sans transition-colors duration-300 relative text-lg tracking-spiritual"
            title="Explore basic features without logging in"
          >
            <span className="relative">
              Continue as Guest
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-saffron-400 group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer - Enhanced with Visual DNA */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cream-100/80 to-transparent py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 mb-6 text-base font-soft-sans">
            <a href="#" className="text-maroon-700 hover:text-saffron-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Terms of Service
            </a>
            <span className="text-saffron-400 font-bold">|</span>
            <a href="#" className="text-maroon-700 hover:text-saffron-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Privacy Policy
            </a>
            <span className="text-saffron-400 font-bold">|</span>
            <a href="#" className="text-maroon-700 hover:text-saffron-600 transition-colors duration-300 hover:underline tracking-spiritual">
              About Us
            </a>
          </div>
          <div className="text-center text-saffron-600 text-base font-medium font-soft-sans tracking-spiritual">
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