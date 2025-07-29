import React from 'react';
import VoiceInterface from './VoiceInterface';

const VoiceTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-spiritual-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-spiritual-900 mb-4">
            🎤 Voice Interface Test
          </h1>
          <p className="text-lg text-spiritual-700">
            Test the Speech-to-Text and Text-to-Speech functionality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Voice Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-spiritual-900 mb-4">
              Voice Interface
            </h2>
            <VoiceInterface 
              onUserQuestion={(question) => {
                console.log('User asked:', question);
              }}
              onResponse={(response) => {
                console.log('Response:', response);
              }}
            />
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-spiritual-900 mb-4">
              How to Use
            </h2>
            <div className="space-y-4 text-spiritual-700">
              <div>
                <h3 className="font-semibold text-spiritual-800 mb-2">🎤 Speech-to-Text</h3>
                <ul className="text-sm space-y-1">
                  <li>• Click the microphone button</li>
                  <li>• Speak your question clearly</li>
                  <li>• The system will transcribe your speech</li>
                  <li>• Your question will be processed automatically</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-spiritual-800 mb-2">🔊 Text-to-Speech</h3>
                <ul className="text-sm space-y-1">
                  <li>• The response will be spoken back to you</li>
                  <li>• You can replay the audio if needed</li>
                  <li>• The response is also displayed as text</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-spiritual-800 mb-2">💡 Example Questions</h3>
                <ul className="text-sm space-y-1">
                  <li>• "When is the next Ekadashi?"</li>
                  <li>• "What is the tithi today?"</li>
                  <li>• "Tell me about Krishna Paksha"</li>
                  <li>• "When is the next Purnima?"</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-spiritual-800 mb-2">⚠️ Requirements</h3>
                <ul className="text-sm space-y-1">
                  <li>• Microphone access must be allowed</li>
                  <li>• Works best in Chrome/Edge browsers</li>
                  <li>• Speak clearly and at normal pace</li>
                  <li>• Ensure ElevenLabs API key is configured</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🔧 Technical Information</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Speech Recognition: Web Speech API (browser-native)</p>
            <p>• Text-to-Speech: ElevenLabs API (high-quality AI voices)</p>
            <p>• Processing: Panchang API + Gemini AI for intelligent responses</p>
            <p>• Auto-processing: Questions are processed automatically without pressing Enter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTest; 