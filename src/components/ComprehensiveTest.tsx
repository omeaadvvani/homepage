import React, { useState } from 'react';
import { CheckCircle, XCircle, VolumeX } from 'lucide-react';
import { usePanchang } from '../hooks/usePanchang';
import { useVoice } from '../hooks/useVoice';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
  details?: string;
}

const ComprehensiveTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { getPanchangGuidance, getPanchangData, validateCredentials } = usePanchang();
  const { speakText, availableVoices, selectedVoice, isPlaying, error: voiceError, stopAudio } = useVoice();
  const { currentLocation } = useLocation();
  const { user } = useAuth();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const location = currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      } : { latitude: 49.2827, longitude: -123.1207 }; // Vancouver coordinates as fallback

      // Test 1: Basic Panchang data
      const today = new Date().toISOString().split('T')[0];
      const response = await getPanchangData(today, location.latitude, location.longitude);
      setResults(prev => [...prev, {
        name: 'Basic Panchang',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? 'Successfully fetched Panchang data' : 'Failed to fetch Panchang data',
        details: response.error || 'No error'
      }]);

      // Test 2: Location detection
      setResults(prev => [...prev, {
        name: 'Location Detection',
        status: currentLocation ? 'passed' : 'failed',
        message: currentLocation ? 'Location detected successfully' : 'Location not detected',
        details: currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : 'Using fallback coordinates'
      }]);

      // Test 3: Voice functionality
      setResults(prev => [...prev, {
        name: 'Voice System',
        status: availableVoices.length > 0 ? 'passed' : 'failed',
        message: availableVoices.length > 0 ? 'Voice system available' : 'Voice system not available',
        details: `${availableVoices.length} voices found`
      }]);

    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Error Handling',
        status: 'failed',
        message: 'Test encountered an error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Comprehensive Feature Test</h2>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={stopAudio}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Stop TTS playback"
            >
              <VolumeX className="w-4 h-4" />
              <span className="text-sm">Stop</span>
            </button>
          )}
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-6 py-2 bg-spiritual-600 text-white rounded-lg hover:bg-spiritual-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Running: {results.length > 0 ? results[results.length - 1].name : ''}
            </span>
            <span className="text-sm text-gray-500">
              {results.filter(r => r.status === 'passed').length}/{results.length} passed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-spiritual-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(results.filter(r => r.status === 'passed').length / results.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {result.status === 'passed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <h3 className={`font-medium ${result.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                {result.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{result.message}</p>
            
            {result.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Show Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                  {result.details}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Test Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Tests:</span>
              <span className="ml-2 font-medium">{results.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Passed:</span>
              <span className="ml-2 font-medium text-green-600">{results.filter(r => r.status === 'passed').length}</span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{results.filter(r => r.status === 'failed').length}</span>
            </div>
            <div>
              <span className="text-gray-600">Success Rate:</span>
              <span className="ml-2 font-medium">
                {results.length > 0 ? Math.round((results.filter(r => r.status === 'passed').length / results.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Voice System Status */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Voice System Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Available Voices:</span>
            <span className="ml-2 font-medium">{availableVoices.length}</span>
          </div>
          <div>
            <span className="text-blue-600">Selected Voice:</span>
            <span className="ml-2 font-medium">{selectedVoice?.name || 'None'}</span>
          </div>
          <div>
            <span className="text-blue-600">Currently Playing:</span>
            <span className="ml-2 font-medium">{isPlaying ? 'Yes' : 'No'}</span>
          </div>
          {voiceError && (
            <div>
              <span className="text-blue-600">Voice Error:</span>
              <span className="ml-2 font-medium text-red-600">{voiceError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveTest; 