import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Globe, LogIn, UserPlus, Headphones, ChevronDown, MapPin, AlertCircle, Navigation, VolumeX } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useVoice } from './hooks/useVoice';
import GuestOnboardingScreen from './components/GuestOnboardingScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import DemoScreen from './components/DemoScreen';
import PreferencesScreen from './components/PreferencesScreen';
import ResetPinScreen from './components/ResetPinScreen';
import MainExperienceScreen from './components/MainExperienceScreen';
import SettingsScreen from './components/SettingsScreen';
import AskVoiceVedicExperience from './components/AskVoiceVedicExperience';
import SupabaseTest from './components/SupabaseTest';
import PanchangTest from './components/PanchangTest';
import PanchangQueryTest from './components/PanchangQueryTest';
import PerformanceMonitor from './components/PerformanceMonitor';
import UpcomingEvents from './components/UpcomingEvents';
import UserList from './components/UserList';
import AllTithisTest from './components/AllTithisTest';
import VoiceTest from './components/VoiceTest';
import DebugInfo from './components/DebugInfo';
// Removed unused import: DevelopmentModeIndicator
import GitLogTest from './components/GitLogTest';
import ComprehensiveTest from './components/ComprehensiveTest';
import LocationTest from './components/LocationTest';
import PerplexityTest from './components/PerplexityTest';
import DetailedPanchangDisplay from './components/DetailedPanchangDisplay';
import DetailedPanchangTest from './components/DetailedPanchangTest';

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [authError, setAuthError] = useState('');
  const [locationWarning, setLocationWarning] = useState('');

  const { user, userProfile, loading: authLoading, error: authHookError, signOut } = useAuth();
  const { 
    currentLocation, 
    isTracking, 
    error: locationError, 
    startLocationTracking,
    stopLocationTracking 
  } = useLocation(user?.id);
  const { isPlaying, stopAudio } = useVoice();

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
  }, []);

  // Simplified app loading - shorter timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1000); // Reduced from 2000ms to 1000ms

    return () => clearTimeout(timer);
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
      setSupabaseError('Supabase is not properly configured. Please check your .env file.');
    }
  }, []);

  // Comprehensive location detection with multiple fallback strategies
  useEffect(() => {
    console.log('📍 Location detection triggered:', { userId: user?.id, isTracking });
    
    const detectLocation = async () => {
      // For authenticated users, use the location tracking hook
      if (user?.id) {
        if (!isTracking) {
          console.log('🚀 Starting location tracking for authenticated user:', user.id);
          startLocationTracking();
        }
        return;
      }

      // For non-authenticated users, use simple location detection
      console.log('🌍 Starting location detection for guest user...');
      
      // Check if geolocation is supported
      if (!('geolocation' in navigator)) {
        console.log('❌ Geolocation not supported');
        setLocation('India');
        setLocationStatus('success');
        setLocationWarning('Geolocation not supported. Using default location.');
        return;
      }

      // Check HTTPS requirement
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.log('⚠️ HTTPS required for geolocation');
        setLocation('India');
        setLocationStatus('success');
        setLocationWarning('HTTPS required for geolocation. Using default location.');
        return;
      }

      // Check permission status
      try {
        const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
        console.log('🔐 Permission status:', permissionStatus?.state);
        
        if (permissionStatus?.state === 'denied') {
          console.log('❌ Permission denied, using default location');
          setLocation('India');
          setLocationStatus('success');
          setLocationWarning('Location permission denied. Using default location.');
          return;
        }
      } catch (error) {
        console.log('⚠️ Could not check permission status:', error);
      }

      // Try multiple location strategies
      const tryLocationStrategies = async () => {
        // Strategy 1: High accuracy GPS
        try {
          console.log('📍 Trying high accuracy GPS...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });

          const { latitude, longitude, accuracy } = position.coords;
          console.log('✅ High accuracy position obtained:', { latitude, longitude, accuracy });
          
          const locationName = await getPreciseLocationName(latitude, longitude);
          setLocation(locationName);
          setLocationStatus('success');
          setLocationWarning('');
          console.log('📍 Location set to:', locationName);
          return;
        } catch (error) {
          console.log('❌ High accuracy failed:', error);
        }

        // Strategy 2: Low accuracy (network-based)
        try {
          console.log('📍 Trying low accuracy...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 300000 // 5 minutes cache
            });
          });

          const { latitude, longitude, accuracy } = position.coords;
          console.log('✅ Low accuracy position obtained:', { latitude, longitude, accuracy });
          
          const locationName = await getPreciseLocationName(latitude, longitude);
          setLocation(locationName);
          setLocationStatus('success');
          setLocationWarning('Location obtained with low accuracy.');
          console.log('📍 Location set to:', locationName);
          return;
        } catch (error) {
          console.log('❌ Low accuracy failed:', error);
        }

        // Strategy 3: IP-based location
        try {
          console.log('📍 Trying IP-based location...');
          const ipLocation = await getIPBasedLocation();
          console.log('✅ IP-based location obtained:', ipLocation);
          
          setLocation(ipLocation.name);
          setLocationStatus('success');
          setLocationWarning('Location obtained via IP address.');
          console.log('📍 Location set to:', ipLocation.name);
          return;
        } catch (error) {
          console.log('❌ IP-based location failed:', error);
        }

        // Strategy 4: Default fallback
        console.log('❌ All location strategies failed, using default');
        setLocation('India');
        setLocationStatus('success');
        setLocationWarning('Location detection failed. Using default location.');
      };

      await tryLocationStrategies();
    };

    detectLocation();
  }, [user?.id, isTracking, startLocationTracking]);

  // Update location state when real-time location changes
  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation.location_name);
      setLocationStatus('success');
    }
  }, [currentLocation]);

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      console.error('Location tracking error:', locationError);
      setLocationWarning(locationError);
      setLocation('India');
      setLocationStatus('success');
    }
  }, [locationError]);

  // Handle user authentication state changes
  useEffect(() => {
    if (!authLoading && user) {
      if (newUserNeedsPreferences) {
        setCurrentScreen('preferences');
        setNewUserNeedsPreferences(false);
      } else if (userProfile || guestMode) {
        setCurrentScreen('main-experience');
      }
    }
    
    if (authHookError && !authLoading) {
      console.error('Authentication error:', authHookError);
      setAuthError(authHookError);
    }
  }, [user, userProfile, authLoading, authHookError, newUserNeedsPreferences, guestMode]);

  // Add a timeout for authLoading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (authLoading) {
      timeoutId = setTimeout(() => {
        setAuthTimeout(true);
        setAuthError('Authentication is taking too long. Please check your connection or try again.');
      }, 8000); // Reduced from 10000ms to 8000ms
    } else {
      setAuthTimeout(false);
    }
    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogin = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('login');
      setIsNavigating(false);
    }, 100);
  };

  const handleSignUp = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('signup');
      setIsNavigating(false);
    }, 100);
  };

  const handleContinueAsGuest = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('guest-onboarding');
      setIsNavigating(false);
    }, 100);
  };

  const handleBackToHome = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('home');
      setNewUserNeedsPreferences(false);
      setGuestMode(false);
      setPreviousScreen('home');
      setIsNavigating(false);
      if (window.location.pathname === '/reset-pin') {
        window.history.pushState({}, '', '/');
      }
    }, 100);
  };

  const handleBackToMainExperience = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleSignUpComplete = () => {
    setNewUserNeedsPreferences(true);
  };

  const handlePreferencesComplete = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleGuestOnboardingComplete = () => {
    setGuestMode(true);
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleLoginComplete = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleTryDemo = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('demo');
      setIsNavigating(false);
    }, 100);
  };

  const handleShowPreferences = () => {
    setPreviousScreen(currentScreen);
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('preferences');
      setIsNavigating(false);
    }, 100);
  };

  const handleShowSettings = () => {
    setPreviousScreen(currentScreen);
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('settings');
      setIsNavigating(false);
    }, 100);
  };

  const handleResetPinComplete = () => {
    alert('Your PIN has been reset successfully! Please log in with your new PIN.');
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('login');
      setIsNavigating(false);
      window.history.pushState({}, '', '/');
    }, 100);
  };

  // Simplified location name detection
  const getPreciseLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('🔍 Getting location name for coordinates:', latitude, longitude);
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📍 Geocoding response:', data);
        
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';
        
        let locationName = '';
        if (city && state) {
          locationName = `${city}, ${state}, ${country}`;
        } else if (city) {
          locationName = `${city}, ${country}`;
        } else if (state) {
          locationName = `${state}, ${country}`;
        } else {
          locationName = country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        console.log('✅ Location name resolved:', locationName);
        return locationName;
      } else {
        console.warn('⚠️ Geocoding API failed, using fallback');
        return getFallbackLocationName(latitude, longitude);
      }
    } catch (error) {
      console.warn('❌ Geocoding failed, using fallback:', error);
      return getFallbackLocationName(latitude, longitude);
    }
  };

  // Fallback location name based on coordinates
  const getFallbackLocationName = (latitude: number, longitude: number): string => {
    // India coordinates
    if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
      return 'India';
    }
    // United States coordinates
    else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
      return 'United States';
    }
    // Europe coordinates
    else if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
      return 'Europe';
    }
    // China coordinates
    else if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
      return 'China';
    }
    // Japan coordinates
    else if (latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 146) {
      return 'Japan';
    }
    // Australia coordinates
    else if (latitude >= -44 && latitude <= -10 && longitude >= 113 && longitude <= 154) {
      return 'Australia';
    }
    // Canada coordinates
    else if (latitude >= 41 && latitude <= 84 && longitude >= -141 && longitude <= -52) {
      return 'Canada';
    }
    // Brazil coordinates
    else if (latitude >= -34 && latitude <= 6 && longitude >= -74 && longitude <= -34) {
      return 'Brazil';
    }
    // Russia coordinates
    else if (latitude >= 41 && latitude <= 82 && longitude >= 26 && longitude <= 190) {
      return 'Russia';
    }
    // Default to coordinates
    else {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // Get IP-based location as fallback
  const getIPBasedLocation = async (): Promise<{ latitude: number; longitude: number; name: string }> => {
    try {
      console.log('🌐 Getting IP-based location...');
      
      const response = await fetch('https://api.bigdatacloud.net/data/ip-geolocation-full?key=free');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 IP-based location response:', data);
        
        const latitude = data.location?.latitude || 20.5937; // Default to India
        const longitude = data.location?.longitude || 78.9629;
        const city = data.location?.city || '';
        const state = data.location?.principalSubdivision || '';
        const country = data.location?.country?.name || 'India';
        
        let name = '';
        if (city && state) {
          name = `${city}, ${state}, ${country}`;
        } else if (city) {
          name = `${city}, ${country}`;
        } else if (state) {
          name = `${state}, ${country}`;
        } else {
          name = country;
        }
        
        return { latitude, longitude, name };
      } else {
        throw new Error('IP-based location failed');
      }
    } catch (error) {
      console.warn('❌ IP-based location failed:', error);
      // Return default India location
      return { 
        latitude: 20.5937, 
        longitude: 78.9629, 
        name: 'India (IP fallback)' 
      };
    }
  };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      await signOut();
      setGuestMode(false);
      setNewUserNeedsPreferences(false);
      setPreviousScreen('home');
      setTimeout(() => {
        setCurrentScreen('home');
        setIsNavigating(false);
      }, 300);
    } catch (error) {
      console.error('Logout error:', error);
      setTimeout(() => {
        setCurrentScreen('home');
        setIsNavigating(false);
      }, 300);
    }
  };

  // Fade in the sacred text after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth state or navigating
  if ((authLoading && !authTimeout) || isNavigating || isAppLoading) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-spiritual-700 tracking-spiritual">
            {isAppLoading ? 'Initializing VoiceVedic...' : authLoading ? 'Loading...' : 'Navigating...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if auth loading timed out
  if (authTimeout) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 tracking-spiritual font-semibold mb-2">
            {authError || 'Could not authenticate your session.'}
          </p>
          <button
            className="px-4 py-2 bg-spiritual-500 text-white rounded shadow"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
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
      <Routes>
        <Route 
          path="/" 
          element={
            <MainExperienceScreen 
              onChangePreferences={handleShowPreferences}
              onShowSettings={handleShowSettings}
              onLogout={guestMode ? handleBackToHome : handleLogout}
              locationWarning={locationWarning}
            />
          } 
        />
        <Route 
          path="/ask" 
          element={
            <AskVoiceVedicExperience 
              onBack={() => window.history.back()}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (currentScreen === 'signup') {
    return <SignUpScreen onComplete={handleSignUpComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'preferences') {
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
      
      {/* Location Warning Banner */}
      {locationWarning && (
        <div className={`absolute ${supabaseError ? 'top-16' : 'top-0'} left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-3 z-30`}>
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium tracking-spiritual">{locationWarning}</p>
            <button
              onClick={() => setLocationWarning('')}
              className="ml-2 p-1 text-yellow-600 hover:text-yellow-700 transition-colors"
              title="Dismiss warning"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
      <div className={`absolute ${supabaseError && locationWarning ? 'top-32' : supabaseError || locationWarning ? 'top-20' : 'top-6'} right-6 z-20 flex items-center gap-4`}>
        
        {/* Global Stop TTS Button */}
        {isPlaying && (
          <button
            onClick={stopAudio}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
            title="Stop text-to-speech playback"
          >
            <VolumeX className="w-4 h-4" />
            <span className="text-sm font-medium">Stop TTS</span>
          </button>
        )}
        
        {/* Real-Time Location Tracking */}
        <div className="group relative">
          <div 
            className={`flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 ${
              locationStatus === 'success' ? 'hover:bg-white hover:shadow-spiritual-lg' : ''
            }`}
            title="Real-time location tracking for accurate ritual timings"
          >
            {isTracking ? (
              <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
            ) : (
            <MapPin className={`w-5 h-5 transition-colors duration-300 ${
              locationStatus === 'loading' ? 'text-spiritual-500 animate-pulse' :
              locationStatus === 'success' ? 'text-accent-600' :
              'text-gray-400'
            }`} />
            )}
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
            {isTracking && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            )}
            {(locationStatus === 'error' || locationStatus === 'loading') && (
              <button
                onClick={() => {
                  if (user?.id) {
                    console.log('Manual start location tracking');
                    startLocationTracking();
                  } else {
                    setLocationWarning('Please log in to enable real-time location tracking.');
                  }
                }}
                className="ml-2 p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors"
                title="Start location tracking"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {isTracking && (
              <button
                onClick={() => stopLocationTracking()}
                className="ml-2 p-1 text-red-600 hover:text-red-700 transition-colors"
                title="Stop location tracking"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-spiritual-900 text-white text-xs rounded-spiritual opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30 shadow-spiritual-lg">
            Real-time location tracking for accurate ritual timings
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

      {/* Authentication Loading Screen */}
      {(authLoading || authTimeout || authError) && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {authLoading && !authTimeout && (
              <>
                <div className="w-16 h-16 border-4 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-spiritual-900 mb-4 tracking-spiritual">
                  Connecting to VoiceVedic...
                </h2>
                <p className="text-spiritual-700 mb-8 tracking-spiritual">
                  Please wait while we authenticate your session.
                </p>
              </>
            )}
            
            {(authTimeout || authError) && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-spiritual-900 mb-4 tracking-spiritual">
                  Connection Issue
                </h2>
                <p className="text-spiritual-700 mb-6 tracking-spiritual">
                  {authError || 'Authentication is taking too long. Please check your connection.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-spiritual-600 text-white rounded-button font-medium tracking-spiritual hover:bg-spiritual-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleContinueAsGuest}
                    className="px-6 py-3 bg-white border-2 border-spiritual-300 text-spiritual-700 rounded-button font-medium tracking-spiritual hover:border-spiritual-400 transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <LogIn className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Login</span>
          </button>

          {/* Sign Up Button - Direct to Sign Up */}
          <button 
            onClick={handleSignUp}
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-900/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-900 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <UserPlus className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Sign Up</span>
          </button>

          {/* Try Demo Button */}
          <button 
            onClick={handleTryDemo}
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border-2 border-spiritual-300 hover:border-spiritual-400 text-spiritual-900 font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isNavigating}
            className="group text-spiritual-700 hover:text-spiritual-600 font-medium transition-colors duration-300 relative tracking-spiritual disabled:opacity-50 disabled:cursor-not-allowed"
            title="Explore basic features without logging in"
          >
            <span className="relative">
              Continue as Guest
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-spiritual-400 group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>

        {/* Supabase Connection Test */}
        <div className="mt-8 max-w-md">
          <SupabaseTest />
        </div>

        {/* Panchang API Test */}
        <div className="mt-4 max-w-md">
          <PanchangTest />
        </div>

        {/* Panchang Query Test */}
        <div className="mt-4 max-w-lg">
          <PanchangQueryTest />
        </div>

        {/* Upcoming Events */}
        <div className="mt-4 max-w-md">
          <UpcomingEvents />
        </div>

        {/* User Database */}
        <div className="mt-4 max-w-md">
          <UserList />
        </div>

        {/* All 16 Tithis Test */}
        <div className="mt-4 max-w-4xl">
          <AllTithisTest />
        <VoiceTest />
        </div>

        {/* Git Log Test */}
        <div className="mt-4 max-w-4xl">
          <GitLogTest />
        </div>

        {/* Comprehensive Feature Test */}
        <div className="mt-4 max-w-6xl">
          <ComprehensiveTest />
        </div>

        {/* Performance Monitor */}
        <div className="mt-4 max-w-md">
          <PerformanceMonitor />
        </div>

        {/* Debug Information */}
        <div className="mt-4 max-w-md">
          <DebugInfo />
        </div>

        {/* Location Test */}
        <div className="mt-4 max-w-md">
          <LocationTest />
        </div>

        {/* Perplexity API Test */}
        <div className="mt-4 max-w-4xl">
          <PerplexityTest />
        </div>

        {/* Detailed Panchang Display */}
        <div className="mt-4 max-w-6xl">
          <DetailedPanchangDisplay />
        </div>

        {/* Detailed Panchang Test */}
        <div className="mt-4 max-w-4xl">
          <DetailedPanchangTest />
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