import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, CheckCircle, ArrowLeft, Mail, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface SignUpScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onComplete, onBack }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [showSacredText, setShowSacredText] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    if (isConfirm) {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      
      // Clear error when user starts typing
      if (pinError) setPinError('');

      // Auto-focus next input
      if (value && index < 3) {
        confirmInputRefs.current[index + 1]?.focus();
      }
    } else {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Auto-focus next input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin;
      if (!currentPin[index] && index > 0) {
        const refs = isConfirm ? confirmInputRefs : inputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent, isConfirm = false) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
    
    if (isConfirm) {
      setConfirmPin(newPin);
      const nextIndex = Math.min(pastedData.length, 3);
      confirmInputRefs.current[nextIndex]?.focus();
    } else {
      setPin(newPin);
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isConfirmPinComplete = confirmPin.every(digit => digit !== '');
  const isEmailValid = email && validateEmail(email);
  const pinsMatch = pin.join('') === confirmPin.join('');

  const handleContinueToConfirm = () => {
    if (!isPinComplete) return;
    setStep('confirm');
    setPinError('');
    // Focus first confirm input after a short delay
    setTimeout(() => {
      confirmInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleConfirmPin = () => {
    if (!isConfirmPinComplete) return;
    
    if (!pinsMatch) {
      setPinError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '']);
      setTimeout(() => {
        confirmInputRefs.current[0]?.focus();
      }, 100);
      return;
    }
    
    // PINs match, proceed to create account
    handleCreateAccount();
  };

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    
    // Simulate account creation
    setTimeout(() => {
      setIsCreatingAccount(false);
      onComplete();
    }, 2000);
  };

  const handleBackToCreate = () => {
    setStep('create');
    setPinError('');
    setConfirmPin(['', '', '', '']);
  };

  const handleGoogleSignUp = () => {
    // In a real app, this would integrate with Google OAuth
    alert('Google Sign-Up integration would be implemented here. This would redirect to Google OAuth flow.');
  };

  const isFormValid = isEmailValid && isPinComplete && (step === 'create' || (isConfirmPinComplete && pinsMatch));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-200 to-cream-100 relative overflow-hidden">
      {/* Diagonal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-300/10 to-red-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={step === 'confirm' ? handleBackToCreate : onBack}
          className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-orange-200/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-amber-800 font-medium"
          title={step === 'confirm' ? "Back to PIN Creation" : "Back to Onboarding"}
        >
          <ArrowLeft className="w-4 h-4 text-orange-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
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
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 max-w-lg mt-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 leading-tight">
              {step === 'create' ? 'Complete Your Setup' : 'Confirm Your PIN 🔒'}
            </h1>
          </div>
          
          <p className="text-lg text-amber-800/80 font-medium">
            {step === 'create' 
              ? "Secure your preferences with a quick login method."
              : "Please re-enter your PIN to confirm it's correct."
            }
          </p>
        </div>

        {/* Sign-Up Form */}
        <div className="w-full max-w-md space-y-6">
          
          {/* Email Address Section - Only show in create step */}
          {step === 'create' && (
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
                
                {email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : emailError ? (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    ) : null}
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
          )}

          {/* Email Summary - Show in confirm step */}
          {step === 'confirm' && (
            <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-4 border border-green-200/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Email Address</p>
                  <p className="text-green-700">{email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create PIN Section */}
          {step === 'create' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-amber-900">Create a 4-digit PIN</h3>
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
                    onPaste={index === 0 ? (e) => handlePaste(e) : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-300 bg-white/70 text-amber-900 hover:border-orange-300 focus:scale-105"
                    placeholder={showPin ? "0" : "•"}
                  />
                ))}
              </div>
              
              <p className="text-sm text-amber-700/70 text-center">
                This PIN helps you quickly access your account across devices.
              </p>
            </div>
          )}

          {/* Confirm PIN Section */}
          {step === 'confirm' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-amber-900">Confirm your PIN</h3>
                </div>
                <button
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="p-1 text-amber-600 hover:text-orange-600 transition-colors duration-300"
                  title={showConfirmPin ? "Hide PIN" : "Show PIN"}
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Confirm PIN Input Fields */}
              <div className="flex justify-center gap-3 mb-4">
                {confirmPin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => confirmInputRefs.current[index] = el}
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    onPaste={index === 0 ? (e) => handlePaste(e, true) : undefined}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 bg-white/70 text-amber-900 hover:border-orange-300 focus:scale-105 ${
                      pinError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                        : 'border-orange-200 focus:border-orange-400 focus:ring-orange-200'
                    }`}
                    placeholder={showConfirmPin ? "0" : "•"}
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
                Re-enter the same 4-digit PIN you created above.
              </p>
            </div>
          )}

          {/* Main CTA Button - Finish Sign Up */}
          {step === 'create' && isEmailValid && isPinComplete && (
            <button
              onClick={handleContinueToConfirm}
              className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-red-800/20"
            >
              <CheckCircle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-lg">Finish Sign Up</span>
            </button>
          )}

          {step === 'confirm' && isConfirmPinComplete && (
            <button
              onClick={handleConfirmPin}
              disabled={isCreatingAccount}
              className={`group flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-2xl shadow-lg transition-all duration-300 transform ${
                isCreatingAccount
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white hover:shadow-xl hover:scale-105 border-2 border-red-800/20'
              }`}
            >
              {isCreatingAccount ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Creating Account...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-lg">Create My Account</span>
                </>
              )}
            </button>
          )}

          {/* OR Divider - Only show in create step */}
          {step === 'create' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orange-200/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-amber-400 via-orange-200 to-cream-100 text-amber-700 font-medium">
                    or
                  </span>
                </div>
              </div>

              {/* Google Sign-Up Button */}
              <button
                onClick={handleGoogleSignUp}
                className="group flex items-center justify-center gap-4 w-full py-4 px-6 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium text-gray-700 hover:text-gray-900"
              >
                {/* Google G Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-lg">Sign up with Google</span>
              </button>

              {/* Terms & Privacy */}
              <div className="text-center">
                <p className="text-sm text-amber-700/70">
                  By signing up, you agree to our{' '}
                  <button className="text-orange-600 hover:text-orange-700 underline hover:no-underline transition-all duration-300">
                    Terms & Privacy Policy
                  </button>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;