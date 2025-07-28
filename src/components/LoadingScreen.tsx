import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Heart } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading VoiceVedic...', 
  showProgress = true 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (!showProgress) return;

    const messages = [
      'Loading VoiceVedic...',
      'Connecting to APIs...',
      'Initializing Panchang...',
      'Setting up voice features...',
      'Ready!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < messages.length) {
        setCurrentMessage(messages[currentStep]);
        setProgress((currentStep + 1) * (100 / messages.length));
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [showProgress]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cream-50 via-spiritual-50 to-cream-100 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-spiritual-400 to-spiritual-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-spiritual-800 mb-2 tracking-spiritual">
          VoiceVedic
        </h1>
        <p className="text-spiritual-600 mb-8 text-lg">
          Your Spiritual AI Companion
        </p>

        {/* Loading Animation */}
        <div className="mb-6">
          <Loader2 className="w-8 h-8 text-spiritual-600 animate-spin mx-auto" />
        </div>

        {/* Progress Message */}
        <div className="mb-4">
          <p className="text-spiritual-700 font-medium">
            {currentMessage}
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-spiritual-400 to-spiritual-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-spiritual-600">
              {Math.round(progress)}% Complete
            </p>
          </div>
        )}

        {/* Subtle Animation */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-spiritual-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-spiritual-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 