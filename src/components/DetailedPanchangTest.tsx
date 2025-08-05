import React, { useState } from 'react';
import { panchangDetailedAPI } from '../lib/panchang-detailed-api';
import { Loader2, CheckCircle, XCircle, MessageSquare, Calendar, Clock, MapPin } from 'lucide-react';

interface TestResult {
  type: string;
  success: boolean;
  response?: any;
  error?: string;
  duration: number;
}

const DetailedPanchangTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testQuery, setTestQuery] = useState('Show me today\'s Panchang');

  const runTest = async (testType: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      const response = await testFunction();
      const duration = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        type: testType,
        success: response.success,
        response: response.data || response,
        error: response.error,
        duration
      }]);
      
      console.log(`✅ ${testType} test completed successfully`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setResults(prev => [...prev, {
        type: testType,
        success: false,
        error: errorMessage,
        duration
      }]);
      
      console.error(`❌ ${testType} test failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    
    // Test 1: Basic Panchang Query
    await runTest('Basic Panchang Query', () => 
      panchangDetailedAPI.getDetailedPanchang({
        latitude: 28.6139,
        longitude: 77.2090,
        location: 'Delhi, India',
        query: 'Show me today\'s Panchang with all details'
      })
    );

    // Test 2: Specific Tithi Query
    await runTest('Specific Tithi Query', () => 
      panchangDetailedAPI.getDetailedPanchang({
        latitude: 28.6139,
        longitude: 77.2090,
        location: 'Delhi, India',
        query: 'When is the next Ekadashi and what are the auspicious timings?'
      })
    );

    // Test 3: Nakshatra Query
    await runTest('Nakshatra Query', () => 
      panchangDetailedAPI.getDetailedPanchang({
        latitude: 28.6139,
        longitude: 77.2090,
        location: 'Delhi, India',
        query: 'Tell me about today\'s nakshatra and raashi'
      })
    );

    // Test 4: Tomorrow's Panchang
    await runTest('Tomorrow\'s Panchang', () => 
      panchangDetailedAPI.getDetailedPanchang({
        latitude: 28.6139,
        longitude: 77.2090,
        location: 'Delhi, India',
        query: 'Show me tomorrow\'s Panchang with sunrise and sunset times'
      })
    );

    // Test 5: Custom Query
    if (testQuery.trim()) {
      await runTest('Custom Query', () => 
        panchangDetailedAPI.getDetailedPanchang({
          latitude: 28.6139,
          longitude: 77.2090,
          location: 'Delhi, India',
          query: testQuery
        })
      );
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const formatPanchangData = (data: any) => {
    if (!data) return 'No data available';
    
    return `
Date: ${data.date}
Time: ${data.time}
Maasa: ${data.maasa}
Vasara: ${data.vasara}
Tithi: ${data.tithi}
Nakshatra: ${data.nakshatra}
Sunrise: ${data.sunrise}
Sunset: ${data.sunset}
    `.trim();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-800">Detailed Panchang API Test</h1>
      </div>

      {/* API Configuration Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Perplexity API:</span>
            {import.meta.env.VITE_PERPLEXITY_API_KEY ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Configured</span>
                <span className="text-xs text-gray-500">
                  ({import.meta.env.VITE_PERPLEXITY_API_KEY.substring(0, 8)}...)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Not configured</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Data Source:</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600">Perplexity AI</span>
            </div>
          </div>
        </div>
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <strong>Note:</strong> All Panchang data is now generated using Perplexity AI instead of the Panchang API
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Test Query:
          </label>
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter a Panchang query..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </button>

          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Test Results</h2>
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-800">{result.type}</span>
                </div>
                <span className="text-sm text-gray-500">{result.duration}ms</span>
              </div>

              {result.success && result.response && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Response:</span>
                  </div>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{formatPanchangData(result.response)}</pre>
                  </div>
                </div>
              )}

              {!result.success && result.error && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Error:</span>
                  </div>
                  <div className="bg-red-100 p-3 rounded border text-sm text-red-700">
                    {result.error}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Test Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Total Tests:</span> {results.length}
              </div>
              <div>
                <span className="text-blue-600">Successful:</span> {results.filter(r => r.success).length}
              </div>
              <div>
                <span className="text-blue-600">Failed:</span> {results.filter(r => !r.success).length}
              </div>
              <div>
                <span className="text-blue-600">Average Time:</span> {
                  Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
                }ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Usage Examples (Perplexity AI)</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Basic Panchang:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                "Show me today's Panchang with all details"
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Specific Tithi:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                "When is the next Ekadashi and what are the auspicious timings?"
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Location Specific:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                "Show me tomorrow's Panchang for Mumbai with sunrise times"
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Auspicious Timings:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                "What are today's Amrutha Kalam and Rahu Kalam timings?"
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedPanchangTest; 