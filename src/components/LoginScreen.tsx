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

      {/* Clear Form Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={clearForm}
          className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-orange-200/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-amber-800 font-medium"
          title="Clear Form"
        >
          <RotateCcw className="w-4 h-4 text-orange-600 group-hover:rotate-180 transition-transform duration-300" />
          <span className="text-sm">Clear</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-20 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-serif text-red-900 tracking-wide select-none animate-float animate-glow opacity-30" 
             style={{ fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari", serif' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4 leading-tight">
            Welcome Back
          </h1>
          
          <p className="text-lg text-amber-800/80 font-medium">
            Enter your details to continue your spiritual journey
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md space-y-6">
          
          {/* Email Address Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-amber-900">Email Address</h3>
            </div>
            
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="yourname@example.com"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-300 bg-white/70 text-amber-900 placeholder-amber-600/50 ${
                  emailError 
                    ? 'border-red-400 focus:border-red-500' 
                    : email && isEmailValid
                      ? 'border-green-400 focus:border-green-500'
                      : 'border-orange-200 focus:border-orange-400 hover:border-orange-300'
                }`}
              />
              
              {email && isEmailValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {emailError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
                {emailError}
              </p>
            )}
          </div>

          {/* PIN Entry Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-amber-900">Enter your 4-digit PIN</h3>
              </div>
              <button
                onClick={() => setShowPin(!showPin)}
                className="p-1 text-amber-600 hover:text-orange-600 transition-colors duration-300"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* PIN Input Fields */}
            <div className="flex justify-center gap-3 mb-4">
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
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 bg-white/70 text-amber-900 hover:border-orange-300 focus:scale-105 ${
                    pinError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                  }`}
                  placeholder={showPin ? "0" : "•"}
                />
              ))}
            </div>
            
            {pinError && (
              <div className="text-center mb-4">
                <p className="text-sm text-red-600 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </span>
                  {pinError}
                </p>
              </div>
            )}
            
            <p className="text-sm text-amber-700/70 text-center">
              Enter the 4-digit PIN you created when signing up.
            </p>
          </div>

          {/* Login Button - ENHANCED WITH PROPER INTERACTIONS */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || isLoggingIn}
            className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-2xl shadow-lg transition-all duration-300 transform ${
              isFormValid && !isLoggingIn
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-orange-500 hover:to-yellow-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-2 border-orange-600/30 hover:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-orange-200/50'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isFormValid ? "Please enter your email and PIN" : "Login to your account"}
          >
            {/* Ripple Effect Background */}
            {isFormValid && !isLoggingIn && (
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            )}
            
            {/* Button Content */}
            <div className="relative z-10 flex items-center gap-3">
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Login</span>
                </>
              )}
            </div>
            
            {/* Glow Effect */}
            {isFormValid && !isLoggingIn && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            )}
          </button>

          {/* Forgot PIN Link */}
          <div className="text-center">
            <button
              onClick={handleForgotPin}
              className="group text-amber-700 hover:text-orange-600 font-medium transition-colors duration-300 relative"
              title="Reset your PIN via email"
            >
              <span className="relative">
                Forgot your PIN?
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;