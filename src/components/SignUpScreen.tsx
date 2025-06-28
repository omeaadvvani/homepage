import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

interface SignUpScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onComplete, onBack }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [showSacredText, setShowSacredText] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
    setPin(newPin);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const isPinComplete = pin.every(digit => digit !== '');

  const handleCreateAccount = async () => {
    if (!isPinComplete) return;
    
    setIsCreatingAccount(true);
    
    // Simulate account creation
    setTimeout(() => {
      setIsCreatingAccount(false);
      onComplete();
    }, 2000);
  };

  const handleGoogleSignUp = () => {
    // In a real app, this would integrate with Google OAuth
    alert('Google Sign-Up integration would be implemented here. This would redirect to Google OAuth flow.');
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
          title="Back to Onboarding"
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 leading-tight">
              Just One Step Away 🔐
            </h1>
          </div>
          
          <p className="text-lg text-amber-800/80 font-medium">
            Let's save your preferences and complete your setup.
          </p>
        </div>

        {/* Sign-Up Form */}
        <div className="w-full max-w-md space-y-8">
          
          {/* Create PIN Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-200/50">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-semibold text-amber-900">Create a 4-digit PIN</h3>
              </div>
            </div>
            
            {/* PIN Input Fields */}
            <div className="flex justify-center gap-4 mb-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-300 bg-white/70 text-amber-900 hover:border-orange-300 focus:scale-105"
                  placeholder="•"
                />
              ))}
            </div>
            
            <p className="text-sm text-amber-700/70 text-center">
              This PIN helps you quickly access your account across devices.
            </p>
          </div>

          {/* OR Divider */}
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

          {/* Create Account Button (PIN) */}
          {isPinComplete && (
            <button
              onClick={handleCreateAccount}
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
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;