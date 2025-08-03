import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, CheckCircle, Send, Type } from 'lucide-react';
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
    speakText,
    stopAudio
  } = useVoice();

  const { getPanchangGuidance } = usePanchang();
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);

  // Handle microphone button click
  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Process input (speech or text) with Panchang API
  const processInputWithAPI = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Call the onUserQuestion callback first
      if (onUserQuestion) {
        onUserQuestion(text);
      }

      // Call Panchang API with the input text
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
      console.error('Error processing input with API:', error);
      const errorMessage = 'Sorry, there was an error processing your request. Please try again.';
      await speakText(errorMessage);
      
      if (onResponse) {
        onResponse(errorMessage);
      }
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      processInputWithAPI(textInput.trim());
      setTextInput('');
    }
  };

  // Auto-process when transcription is complete
  useEffect(() => {
    if (transcribedText && !isListening && !isProcessing && isAutoMode) {
      // Add a small delay to ensure transcription is fully complete
      const timer = setTimeout(() => {
        console.log('Auto-processing transcribed text:', transcribedText);
        processInputWithAPI(transcribedText);
      }, 500); // 500ms delay to ensure transcription is stable
      
      return () => clearTimeout(timer);
    }
  }, [transcribedText, isListening, isProcessing, isAutoMode]);

  // Auto-process when speech recognition ends with final transcript
  useEffect(() => {
    if (transcribedText && !isListening && isAutoMode && !isProcessing) {
      // Check if we have a meaningful transcript (not just interim results)
      if (transcribedText.trim().length > 2) {
        console.log('Speech recognition ended, auto-processing:', transcribedText);
        processInputWithAPI(transcribedText);
      }
    }
  }, [isListening, transcribedText, isAutoMode, isProcessing]);

  // Keyboard shortcut to stop TTS playback
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPlaying) {
        stopAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stopAudio]);

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
            <button
              onClick={stopAudio}
              className="ml-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Stop playback"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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

        {/* Auto-send indicator */}
        {isAutoMode && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-send enabled</span>
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

      {/* Input Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setIsTextMode(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isTextMode 
                ? 'bg-white text-spiritual-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Mic className="w-4 h-4 inline mr-2" />
            Voice
          </button>
          <button
            onClick={() => setIsTextMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isTextMode 
                ? 'bg-white text-spiritual-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Type className="w-4 h-4 inline mr-2" />
            Text
          </button>
        </div>
        
        {/* Auto-send toggle for voice mode */}
        {!isTextMode && (
          <div className="ml-4 flex items-center gap-2">
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isAutoMode 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
              title={isAutoMode ? 'Auto-send enabled' : 'Auto-send disabled'}
            >
              <CheckCircle className={`w-4 h-4 inline mr-1 ${isAutoMode ? 'text-green-600' : 'text-gray-500'}`} />
              Auto-send
            </button>
          </div>
        )}
      </div>

      {/* Stop TTS Button - Only show when playing */}
      {isPlaying && (
        <div className="flex justify-center mb-4">
          <button
            onClick={stopAudio}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
            title="Stop text-to-speech playback"
          >
            <VolumeX className="w-4 h-4" />
            <span className="text-sm font-medium">Stop Speaking</span>
          </button>
        </div>
      )}

      {/* Voice Input */}
      {!isTextMode && (
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
      )}

      {/* Text Input */}
      {isTextMode && (
        <form onSubmit={handleTextSubmit} className="w-full max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask your question here..."
              disabled={isProcessing || isPlaying}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing || isPlaying}
              className="px-4 py-2 bg-spiritual-600 text-white rounded-lg hover:bg-spiritual-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          {isTextMode 
            ? 'Type your question and press Enter or click Send'
            : isAutoMode 
              ? 'Click the microphone and speak your question - it will automatically send when you finish speaking'
              : 'Click the microphone and speak your question, then click Send when done'
          }
        </p>
        {!isTextMode && (
          <p className="text-xs text-gray-500">
            {isAutoMode 
              ? 'Auto-send is enabled - your question will be processed automatically'
              : 'Auto-send is disabled - click Send after speaking'
            }
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