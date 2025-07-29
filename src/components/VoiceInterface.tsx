import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { usePanchang } from '../hooks/usePanchang';

interface VoiceInterfaceProps {
  onResponse?: (response: string) => void;
  onUserQuestion?: (question: string) => void;
  className?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onResponse, onUserQuestion, className = '' }) => {
  const {
    isListening,
    isProcessing,
    transcribedText,
    speechError,
    isPlaying,
    error,
    startListening,
    stopListening,
    speakText
  } = useVoice();

  const { getPanchangGuidance } = usePanchang();
  const [isAutoMode, setIsAutoMode] = useState(true);

  // Handle microphone button click
  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Process speech input with Panchang API
  const processSpeechWithAPI = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Call the onUserQuestion callback first
      if (onUserQuestion) {
        onUserQuestion(text);
      }

      // Call Panchang API with the transcribed text
      const response = await getPanchangGuidance({
        question: text,
        latitude: 28.6139, // Default to Delhi
        longitude: 77.2090
      });

      if (response.success && response.guidance) {
        // Speak the response
        await speakText(response.guidance);
        
        // Call the onResponse callback if provided
        if (onResponse) {
          onResponse(response.guidance);
        }
      } else {
        const errorMessage = response.error || 'Sorry, I could not process your request. Please try again.';
        await speakText(errorMessage);
        
        if (onResponse) {
          onResponse(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error processing speech with API:', error);
      const errorMessage = 'Sorry, there was an error processing your request. Please try again.';
      await speakText(errorMessage);
      
      if (onResponse) {
        onResponse(errorMessage);
      }
    }
  };

  // Auto-process when transcription is complete
  useEffect(() => {
    if (transcribedText && !isListening && !isProcessing && isAutoMode) {
      processSpeechWithAPI(transcribedText);
    }
  }, [transcribedText, isListening, isProcessing, isAutoMode]);

  return (
    <div className={`voice-interface ${className}`}>
      {/* Status Indicators */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {isListening && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center gap-2 text-orange-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
        
        {isPlaying && (
          <div className="flex items-center gap-2 text-green-600">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">Speaking...</span>
          </div>
        )}
        
        {speechError && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{speechError}</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Transcribed Text Display */}
      {transcribedText && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">You said:</span>
          </div>
          <p className="text-blue-900">{transcribedText}</p>
        </div>
      )}

      {/* Microphone Button */}
      <div className="flex justify-center">
        <button
          onClick={handleMicrophoneClick}
          disabled={isProcessing || isPlaying}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110' 
              : 'bg-spiritual-500 hover:bg-spiritual-600 text-white shadow-lg'
            }
            ${isProcessing || isPlaying 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
          
          {/* Pulse animation when listening */}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          {isListening 
            ? 'Speak your question now...' 
            : 'Click the microphone to start speaking'
          }
        </p>
        
        {isAutoMode && (
          <p className="text-xs text-gray-500">
            Auto-processing enabled - your question will be processed automatically
          </p>
        )}
      </div>

      {/* Auto Mode Toggle */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isAutoMode}
            onChange={(e) => setIsAutoMode(e.target.checked)}
            className="w-4 h-4 text-spiritual-600 border-gray-300 rounded focus:ring-spiritual-500"
          />
          Auto-process speech
        </label>
      </div>

      {/* Error Display */}
      {(speechError || error) && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {speechError || error}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">💡 Voice Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Speak clearly and at a normal pace</li>
          <li>• Try questions like "When is the next Ekadashi?"</li>
          <li>• Ask about specific dates: "What is the tithi on 15th August?"</li>
          <li>• Inquire about spiritual guidance: "Tell me about Krishna Paksha"</li>
          <li>• Make sure your microphone is working and allowed</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceInterface; 