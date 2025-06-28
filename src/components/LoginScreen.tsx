import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowLeft, Mail, Eye, EyeOff, LogIn, RotateCcw } from 'lucide-react';

interface LoginScreenProps {
  onComplete: () => void;
  onBack?: () => void;
  onForgotPin?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onComplete, onBack, onForgotPin }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [showSacredText, setShowSacredText] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && validateEmail(value)) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Clear errors when user starts typing
    if (pinError) setPinError('');
    if (emailError) setEmailError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
    setPin(newPin);
    
    const nextIndex = Math.min(pastedData.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isEmailValid = email && validateEmail(email);
  const isFormValid = isEmailValid && isPinComplete;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoggingIn(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoggingIn(false);
      onComplete();
    }, 1500);
  };

  const handleForgotPin = () => {
    if (onForgotPin) {
      onForgotPin();
    } else {
      // Default behavior - show alert
      alert('Forgot PIN functionality would redirect to PIN reset flow. This typically involves email verification and PIN reset.');
    }
  };

  const clearForm = () => {
    setEmail('');
    setPin(['', '', '', '']);
    setEmailError('');
    setPinError('');
  };

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

      {/* Clear Form Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={clearForm}
          className="group flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-saffron-200/60 hover:bg-white hover:shadow-xl hover:border-saffron-300 transition-all duration-300 text-maroon-800 font-medium font-soft-sans"
          title="Clear Form"
        >
          <RotateCcw className="w-4 h-4 text-saffron-600 group-hover:rotate-180 transition-transform duration-300" />
          <span className="text-sm tracking-spiritual">Clear</span>
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
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative z-10">
        
        {/* Header Section - Enhanced Typography */}
        <div className="text-center mb-12 max-w-2xl" style={{ marginTop: '72px' }}>
          <h1 className="text-5xl md:text-6xl font-spiritual font-bold text-maroon-900 mb-6 leading-spiritual tracking-spiritual">
            Welcome Back
          </h1>
          
          <p className="text-xl text-maroon-800/80 font-medium font-soft-sans tracking-wide-spiritual leading-relaxed-spiritual">
            Enter your details to continue your spiritual journey
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-lg space-y-8">
          
          {/* Email Address Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50">
            <div className="flex items-center gap-4 mb-6">
              <Mail className="w-6 h-6 text-saffron-600" />
              <h3 className="text-xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Email Address</h3>
            </div>
            
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="yourname@example.com"
                className={`w-full px-6 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-saffron-200/50 transition-all duration-300 bg-white/80 text-maroon-900 placeholder-maroon-600/50 font-soft-sans text-lg tracking-spiritual ${
                  emailError 
                    ? 'border-red-400 focus:border-red-500' 
                    : email && isEmailValid
                      ? 'border-green-400 focus:border-green-500'
                      : 'border-saffron-200 focus:border-saffron-400 hover:border-saffron-300'
                }`}
              />
              
              {email && isEmailValid && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {emailError && (
              <p className="text-sm text-red-600 mt-3 flex items-center gap-2 font-soft-sans">
                <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
                {emailError}
              </p>
            )}
          </div>

          {/* PIN Entry Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-saffron-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-saffron-600" />
                <h3 className="text-xl font-semibold font-spiritual text-maroon-900 tracking-spiritual">Enter your 4-digit PIN</h3>
              </div>
              <button
                onClick={() => setShowPin(!showPin)}
                className="p-2 text-maroon-600 hover:text-saffron-600 transition-colors duration-300 rounded-full hover:bg-saffron-50"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* PIN Input Fields */}
            <div className="flex justify-center gap-4 mb-6">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 bg-white/80 text-maroon-900 hover:border-saffron-300 focus:scale-105 font-soft-sans ${
                    pinError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200/50' 
                      : 'border-saffron-200 focus:border-saffron-400 focus:ring-saffron-200/50'
                  }`}
                  placeholder={showPin ? "0" : "•"}
                />
              ))}
            </div>
            
            {pinError && (
              <div className="text-center mb-6">
                <p className="text-sm text-red-600 flex items-center justify-center gap-2 font-soft-sans">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </span>
                  {pinError}
                </p>
              </div>
            )}
            
            <p className="text-sm text-maroon-700/70 text-center font-soft-sans leading-relaxed-spiritual">
              Enter the 4-digit PIN you created when signing up.
            </p>
          </div>

          {/* Login Button - ENHANCED WITH PROPER INTERACTIONS */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isLoggingIn}
            className={`group relative overflow-hidden flex items-center justify-center gap-4 w-full py-5 px-8 font-semibold font-soft-sans rounded-3xl shadow-xl transition-all duration-300 transform ${
              isFormValid && !isLoggingIn
                ? 'bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-500 hover:to-yellow-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] border-2 border-saffron-600/30 hover:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-saffron-200/50 animate-spiritual-pulse'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isFormValid ? "Please enter your email and PIN" : "Login to your account"}
          >
            {/* Glow Effect */}
            {isFormValid && !isLoggingIn && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-saffron-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            )}
            
            {/* Button Content */}
            <div className="relative z-10 flex items-center gap-4">
              {isLoggingIn ? (
                <>
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xl tracking-spiritual">Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className={`w-6 h-6 transition-transform duration-300 ${isFormValid ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-xl tracking-spiritual">Login</span>
                </>
              )}
            </div>
          </button>

          {/* Forgot PIN Link */}
          <div className="text-center">
            <button
              onClick={handleForgotPin}
              className="group text-maroon-700 hover:text-saffron-600 font-medium font-soft-sans transition-colors duration-300 relative text-lg tracking-spiritual"
              title="Reset your PIN via email"
            >
              <span className="relative">
                Forgot your PIN?
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-saffron-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;