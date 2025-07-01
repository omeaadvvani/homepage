import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, Send, Shield, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForgotPinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'email' | 'verification' | 'newpin';

const ForgotPinScreen: React.FC<ForgotPinScreenProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (codeError) setCodeError('');

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    if (isConfirm) {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      
      if (pinError) setPinError('');

      if (value && index < 5) {
        confirmPinInputRefs.current[index + 1]?.focus();
      }
    } else {
      const newNewPin = [...newPin];
      newNewPin[index] = value;
      setNewPin(newNewPin);

      if (value && index < 5) {
        newPinInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, currentArray: string[]) => {
    if (e.key === 'Backspace') {
      if (!currentArray[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setEmailError('');

      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setEmailError(error.message);
        return;
      }

      setSuccessMessage("We've sent you a code to reset your PIN.");
      setCurrentStep('verification');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setEmailError(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setCodeError('Please enter the complete 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setCodeError('');

      // In a real implementation, you would verify the OTP code here
      // For demo purposes, we'll simulate verification
      if (code === '123456') {
        setCurrentStep('newpin');
      } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentStep('newpin'); // For demo, always proceed
      }
    } catch (error: any) {
      setCodeError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPin = async () => {
    const newPinString = newPin.join('');
    const confirmPinString = confirmPin.join('');

    if (newPinString.length !== 6) {
      setPinError('PIN must be 6 digits');
      return;
    }

    if (newPinString !== confirmPinString) {
      setPinError('PINs do not match');
      setConfirmPin(['', '', '', '', '', '']);
      setTimeout(() => {
        confirmPinInputRefs.current[0]?.focus();
      }, 100);
      return;
    }

    try {
      setLoading(true);
      setPinError('');

      // In a real implementation, you would update the user's password/PIN here
      // For demo purposes, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccessMessage('Your PIN has been reset successfully!');
      
      // Redirect after showing success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      setPinError(error.message || 'Failed to save new PIN');
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email && validateEmail(email);
  const isCodeComplete = verificationCode.every(digit => digit !== '');
  const isNewPinComplete = newPin.every(digit => digit !== '');
  const isConfirmPinComplete = confirmPin.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={currentStep === 'email' ? onBack : () => {
            if (currentStep === 'verification') setCurrentStep('email');
            if (currentStep === 'newpin') setCurrentStep('verification');
          }}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-green-50 border border-green-200 rounded-spiritual p-4 shadow-spiritual">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 tracking-spiritual">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative z-10">
        
        {/* SCREEN 1: Email Input */}
        {currentStep === 'email' && (
          <div className="w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
                Forgot Your PIN?
              </h1>
              <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
                We'll send you a code to reset it.
              </p>
            </div>

            {/* Email Input Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-spiritual-600" />
                <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Email Address</h3>
              </div>
              
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 border-2 rounded-spiritual focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual ${
                    emailError 
                      ? 'border-red-400 focus:border-red-500' 
                      : email && isEmailValid
                        ? 'border-accent-400 focus:border-accent-500'
                        : 'border-spiritual-200 focus:border-spiritual-400 hover:border-spiritual-300'
                  }`}
                />
                
                {email && isEmailValid && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}
              </div>
              
              {emailError && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1 tracking-spiritual">
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Send Code Button */}
            <button
              onClick={handleSendCode}
              disabled={!isEmailValid || loading}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                isEmailValid && !loading
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Sending Code...</span>
                </>
              ) : (
                <>
                  <Send className={`w-5 h-5 transition-transform duration-300 ${isEmailValid ? 'group-hover:translate-x-1 group-active:translate-x-0.5' : ''}`} />
                  <span className="text-lg">Send Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SCREEN 2: Verification Code */}
        {currentStep === 'verification' && (
          <div className="w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
                Enter Verification Code
              </h1>
              <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
                Check your email for the code we just sent.
              </p>
            </div>

            {/* Email Confirmation */}
            <div className="bg-accent-50/80 backdrop-blur-sm rounded-card p-4 border border-accent-200/50 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-accent-600" />
                <div>
                  <p className="text-sm font-medium text-accent-800 tracking-spiritual">Code sent to:</p>
                  <p className="text-accent-700 tracking-spiritual">{email}</p>
                </div>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-spiritual-600" />
                <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">6-Digit Verification Code</h3>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => codeInputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e, codeInputRefs, verificationCode)}
                    className={`w-10 h-10 text-center text-lg font-bold border-2 rounded-spiritual focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105 ${
                      codeError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                        : 'border-spiritual-200 focus:border-spiritual-400 focus:ring-spiritual-200/50'
                    }`}
                    placeholder="0"
                  />
                ))}
              </div>
              
              {codeError && (
                <p className="text-sm text-red-600 flex items-center justify-center gap-2 tracking-spiritual">
                  <AlertCircle className="w-4 h-4" />
                  {codeError}
                </p>
              )}
            </div>

            {/* Verify Code Button */}
            <button
              onClick={handleVerifyCode}
              disabled={!isCodeComplete || loading}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                isCodeComplete && !loading
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className={`w-5 h-5 transition-transform duration-300 ${isCodeComplete ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Verify Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SCREEN 3: New PIN Setup */}
        {currentStep === 'newpin' && (
          <div className="w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
                Set a New PIN
              </h1>
              <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
                Create a secure 6-digit PIN for your account.
              </p>
            </div>

            {/* New PIN Input */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-spiritual-600" />
                  <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">New 6-digit PIN</h3>
                </div>
                <button
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors duration-300"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {newPin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => newPinInputRefs.current[index] = el}
                    type={showNewPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e, newPinInputRefs, newPin)}
                    className="w-10 h-10 text-center text-lg font-bold border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105"
                    placeholder={showNewPin ? "0" : "•"}
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN Input */}
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-spiritual-600" />
                  <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Confirm PIN</h3>
                </div>
                <button
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors duration-300"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {confirmPin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => confirmPinInputRefs.current[index] = el}
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(index, e, confirmPinInputRefs, confirmPin)}
                    className={`w-10 h-10 text-center text-lg font-bold border-2 rounded-spiritual focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105 ${
                      pinError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                        : 'border-spiritual-200 focus:border-spiritual-400 focus:ring-spiritual-200/50'
                    }`}
                    placeholder={showConfirmPin ? "0" : "•"}
                  />
                ))}
              </div>
              
              {pinError && (
                <p className="text-sm text-red-600 flex items-center justify-center gap-2 tracking-spiritual">
                  <AlertCircle className="w-4 h-4" />
                  {pinError}
                </p>
              )}
            </div>

            {/* Save New PIN Button */}
            <button
              onClick={handleSaveNewPin}
              disabled={!isNewPinComplete || !isConfirmPinComplete || loading}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                isNewPinComplete && isConfirmPinComplete && !loading
                  ? 'bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-900/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Saving PIN...</span>
                </>
              ) : (
                <>
                  <CheckCircle className={`w-5 h-5 transition-transform duration-300 ${isNewPinComplete && isConfirmPinComplete ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Save New PIN</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPinScreen;