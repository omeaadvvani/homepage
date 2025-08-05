import React, { useState } from 'react';
import { perplexityAPI } from '../lib/perplexity-api';
import { Loader2, CheckCircle, XCircle, MessageSquare, Sparkles, BookOpen } from 'lucide-react';

interface TestResult {
  type: string;
  success: boolean;
  response?: string;
  error?: string;
  duration: number;
}

const PerplexityTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testQuery, setTestQuery] = useState('Tell me about meditation and mindfulness');

  const runTest = async (testType: string, testFunction: () => Promise<string>) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      const response = await testFunction();
      const duration = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        type: testType,
        success: true,
        response,
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
    
    // Test 1: Connection Test
    await runTest('Connection Test', () => 
      perplexityAPI.testConnection().then(success => 
        success ? 'Connection successful' : 'Connection failed'
      )
    );

    // Test 2: General Knowledge
    await runTest('General Knowledge', () => 
      perplexityAPI.generateKnowledgeResponse('What is the importance of meditation in daily life?')
    );

    // Test 3: Spiritual Guidance
    await runTest('Spiritual Guidance', () => 
      perplexityAPI.generateSpiritualGuidance('How can I find inner peace?', {
        userLocation: 'India',
        currentTime: new Date().toISOString()
      })
    );

    // Test 4: Astrological Insights
    await runTest('Astrological Insights', () => 
      perplexityAPI.generateAstrologicalInsights('What does today\'s energy suggest for spiritual practice?', {
        tithi: 'Navami',
        nakshatra: 'Vishaka',
        paksha: 'Shukla'
      })
    );

    // Test 5: Custom Query
    if (testQuery.trim()) {
      await runTest('Custom Query', () => 
        perplexityAPI.generateText(testQuery, {
          maxTokens: 500,
          temperature: 0.7
        })
      );
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-800">Perplexity API Integration Test</h1>
      </div>

      {/* API Key Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">API Key:</span>
          {import.meta.env.VITE_PERPLEXITY_API_KEY ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Configured</span>
              <span className="text-xs text-gray-500">
                ({import.meta.env.VITE_PERPLEXITY_API_KEY.substring(0, 8)}...)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Not configured</span>
            </div>
          )}
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
            placeholder="Enter a test query..."
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
              <Sparkles className="w-4 h-4" />
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
                    {result.response}
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
        <h2 className="text-lg font-semibold mb-3">Usage Examples</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Spiritual Guidance:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                perplexityAPI.generateSpiritualGuidance('How to find inner peace?')
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">Astrological Insights:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                perplexityAPI.generateAstrologicalInsights('Today\'s spiritual energy?')
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <span className="font-medium">General Knowledge:</span>
              <code className="block bg-gray-200 p-1 rounded mt-1">
                perplexityAPI.generateKnowledgeResponse('What is Vedic astrology?')
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerplexityTest; 