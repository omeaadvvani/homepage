import React, { useState, useEffect } from 'react';
import { Globe, LogIn, UserPlus, Headphones, ChevronDown } from 'lucide-react';
import OnboardingScreen from './components/OnboardingScreen';
import GuestOnboardingScreen from './components/GuestOnboardingScreen';

function App() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSacredText, setShowSacredText] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'onboarding' | 'guest-onboarding'>('home');

  const languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Malayalam',
    'Kannada'
  ];

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogin = () => {
    // For now, just show an alert for login
    // In a real app, this would navigate to a login form
    alert('Login functionality will be implemented here. This would typically show a login form with email/password fields.');
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
    // Here you would typically navigate to the main app
    console.log('Onboarding completed!');
    // For demo purposes, we'll just show an alert
    alert('Welcome to VoiceVedic! Your spiritual journey begins now. 🙏');
  };

  const handleGuestOnboardingComplete = () => {
    // Here you would typically navigate to the main app in guest mode
    console.log('Guest onboarding completed!');
    // For demo purposes, we'll just show an alert
    alert('Welcome to VoiceVedic! Explore our features as a guest. You can create an account anytime to save your preferences. 🙏');
  };

  const handleTryDemo = () => {
    // For now, just show an alert for demo
    // In a real app, this would show a demo/tutorial
    alert('Demo functionality will be implemented here. This would typically show an interactive tutorial of the app features.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-200 to-cream-100 relative overflow-hidden">
      {/* Diagonal gradient overlay with maroon corner hints */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-300/10 to-red-900/5"></div>
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
      <div className={`absolute bottom-20 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-serif text-red-900 tracking-wide select-none animate-float animate-glow" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-orange-200/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-amber-800 font-medium"
          >
            <Globe className="w-4 h-4 text-orange-600" />
            <span className="text-sm">{selectedLanguage}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden min-w-32 z-30">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors duration-200 ${
                    selectedLanguage === language 
                      ? 'bg-orange-100 text-orange-800 font-medium' 
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20 relative z-10">
        
        {/* Center Block */}
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-amber-900 mb-4 leading-tight">
            Namaste. Welcome to
            <br />
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          <h2 className="text-xl md:text-2xl text-amber-800/80 font-medium mb-8">
            Your daily spiritual companion
          </h2>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* Login Button */}
          <button 
            onClick={handleLogin}
            className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-red-800/20"
          >
            <LogIn className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg">Login</span>
          </button>

          {/* Sign Up Button - Goes to Onboarding */}
          <button 
            onClick={handleSignUp}
            className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-red-800/20"
          >
            <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg">Sign Up</span>
          </button>

          {/* Try Demo Button */}
          <button 
            onClick={handleTryDemo}
            className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-orange-400 text-amber-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-amber-600/30"
          >
            <Headphones className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg">Try Demo</span>
          </button>
        </div>

        {/* Guest Access */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleContinueAsGuest}
            className="group text-amber-700 hover:text-orange-600 font-medium transition-colors duration-300 relative"
            title="Explore basic features without logging in"
          >
            <span className="relative">
              Continue as Guest
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cream-100/60 to-transparent py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
            <a href="#" className="text-amber-700 hover:text-orange-600 transition-colors duration-300 hover:underline">
              Terms of Service
            </a>
            <span className="text-amber-400">|</span>
            <a href="#" className="text-amber-700 hover:text-orange-600 transition-colors duration-300 hover:underline">
              Privacy Policy
            </a>
            <span className="text-amber-400">|</span>
            <a href="#" className="text-amber-700 hover:text-orange-600 transition-colors duration-300 hover:underline">
              About Us
            </a>
          </div>
          <div className="text-center text-amber-600 text-sm font-medium">
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