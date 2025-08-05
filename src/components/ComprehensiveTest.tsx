import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, VolumeX } from 'lucide-react';
import { usePanchang } from '../hooks/usePanchang';
import { useVoice } from '../hooks/useVoice';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: string | number | boolean | Record<string, unknown>;
}

const ComprehensiveTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  
  const { getPanchangGuidance, getPanchangData, validateCredentials } = usePanchang();
  const { speakText, availableVoices, selectedVoice, isPlaying, error: voiceError, stopAudio } = useVoice();

  const tests = [
    {
      name: 'API Credentials Validation',
      test: async () => {
        const isValid = await validateCredentials();
        return {
          passed: isValid,
          message: isValid ? 'API credentials are valid' : 'API credentials validation failed',
          details: { isValid }
        };
      }
    },
    {
      name: 'Date-Specific Data Retrieval',
      test: async () => {
        const today = new Date().toISOString().split('T')[0];
        const response = await getPanchangData(today, 28.6139, 77.2090);
        return {
          passed: response.success,
          message: response.success ? 'Date-specific data retrieved successfully' : response.error || 'Failed to retrieve date-specific data',
          details: response.data
        };
      }
    },
    {
      name: 'Time Parsing and Validation',
      test: async () => {
        const today = new Date().toISOString().split('T')[0];
        const response = await getPanchangData(today, 28.6139, 77.2090);
        if (!response.success || !response.data) {
          return {
            passed: false,
            message: 'Cannot test time parsing without valid data',
            details: response.error
          };
        }
        
        const hasValidTimes = response.data.tithiStart && response.data.tithiTill;
        return {
          passed: hasValidTimes,
          message: hasValidTimes ? 'Time parsing working correctly' : 'Time parsing failed',
          details: {
            tithiStart: response.data.tithiStart,
            tithiTill: response.data.tithiTill
          }
        };
      }
    },
    {
      name: 'Caching Mechanism',
      test: async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Note: Cache clearing not needed for Perplexity API
        console.log('Testing Perplexity API caching behavior');
        
        // First call - should hit the API
        const start1 = Date.now();
        const response1 = await getPanchangData(today, 28.6139, 77.2090);
        const time1 = Date.now() - start1;
        
        // Small delay to ensure timing is accurate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Second call - should hit the cache
        const start2 = Date.now();
        const response2 = await getPanchangData(today, 28.6139, 77.2090);
        const time2 = Date.now() - start2;
        
        // Check if both calls were successful
        const bothSuccessful = response1.success && response2.success;
        
        // Check if second call was faster (indicating cache hit)
        const isCached = time2 < time1 * 0.8; // Second call should be at least 20% faster
        
        // Additional check: if second call was very fast (< 50ms), it's likely cached
        const isVeryFast = time2 < 50;
        
        const improvement = bothSuccessful ? Math.round(((time1 - time2) / time1) * 100) : null;
        
        return {
          passed: bothSuccessful && (isCached || isVeryFast),
          message: bothSuccessful && (isCached || isVeryFast) ? 'Caching working correctly' : 'Caching not working as expected',
          details: {
            firstCallTime: time1,
            secondCallTime: time2,
            improvement: improvement,
            firstCallSuccess: response1.success,
            secondCallSuccess: response2.success,
            cacheHit: isCached || isVeryFast
          }
        };
      }
    },
    {
      name: 'Ambiguous Query Handling',
      test: async () => {
        const response = await getPanchangGuidance({
          question: 'what is this',
          latitude: 28.6139,
          longitude: 77.2090
        });
        
        const hasClarification = response.guidance && response.guidance.includes('clarify');
        return {
          passed: hasClarification,
          message: hasClarification ? 'Ambiguous query handling working' : 'Ambiguous query handling failed',
          details: response.guidance
        };
      }
    },
    {
      name: 'Voice System Integration',
      test: async () => {
        const hasVoices = availableVoices.length > 0;
        const hasSelectedVoice = selectedVoice !== null;
        
        return {
          passed: hasVoices && hasSelectedVoice,
          message: hasVoices && hasSelectedVoice ? 'Voice system working correctly' : 'Voice system not properly configured',
          details: {
            availableVoices: availableVoices.length,
            selectedVoice: selectedVoice?.name
          }
        };
      }
    },
    {
      name: 'Text-to-Speech Functionality',
      test: async () => {
        try {
          await speakText('This is a test of the text-to-speech functionality.');
          return {
            passed: true,
            message: 'Text-to-speech working correctly',
            details: { selectedVoice: selectedVoice?.name }
          };
        } catch (error) {
          return {
            passed: false,
            message: 'Text-to-speech failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }
      }
    },
    {
      name: 'Multiple Date Format Support',
      test: async () => {
        const dateFormats = [
          '2025-07-29',
          '29/07/2025',
          '29-07-2025',
          'today',
          'tomorrow'
        ];
        
        const results = [];
        for (const dateFormat of dateFormats) {
          try {
            const response = await getPanchangGuidance({
              question: `What is the tithi on ${dateFormat}?`,
              latitude: 28.6139,
              longitude: 77.2090
            });
            results.push({
              format: dateFormat,
              success: response.success,
              hasData: response.panchang !== undefined
            });
          } catch (error) {
            results.push({
              format: dateFormat,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        const allSuccessful = results.every(r => r.success);
        return {
          passed: allSuccessful,
          message: allSuccessful ? 'All date formats supported' : 'Some date formats failed',
          details: results
        };
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(tests.map(test => ({
      name: test.name,
      status: 'pending' as const,
      message: 'Waiting to run...'
    })));

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      
      // Update status to running
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status: 'running' as const, message: 'Running test...' } : result
      ));

      try {
        const result = await test.test();
        
        setTestResults(prev => prev.map((testResult, index) => 
          index === i ? {
            ...testResult,
            status: result.passed ? 'passed' as const : 'failed' as const,
            message: result.message,
            details: result.details
          } : testResult
        ));
      } catch (error) {
        setTestResults(prev => prev.map((testResult, index) => 
          index === i ? {
            ...testResult,
            status: 'failed' as const,
            message: 'Test threw an error',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          } : testResult
        ));
      }
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-600';
      case 'passed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const totalTests = testResults.length;

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
            onClick={runAllTests}
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
              Running: {currentTest}
            </span>
            <span className="text-sm text-gray-500">
              {passedTests}/{totalTests} passed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-spiritual-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(passedTests / totalTests) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(result.status)}
              <h3 className={`font-medium ${getStatusColor(result.status)}`}>
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
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Test Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Tests:</span>
              <span className="ml-2 font-medium">{totalTests}</span>
            </div>
            <div>
              <span className="text-gray-600">Passed:</span>
              <span className="ml-2 font-medium text-green-600">{passedTests}</span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{totalTests - passedTests}</span>
            </div>
            <div>
              <span className="text-gray-600">Success Rate:</span>
              <span className="ml-2 font-medium">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
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