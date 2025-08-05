import React, { useState } from 'react';
import { perplexityWebScraper } from '../lib/perplexity-web-scraper';
import { Loader2, CheckCircle, XCircle, Globe, Search, MessageSquare } from 'lucide-react';

interface TestResult {
  query: string;
  success: boolean;
  response: string;
  source: string;
  timestamp: string;
  duration: number;
}

const PerplexityWebScraperTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testQuery, setTestQuery] = useState('Tell me about today\'s Panchang');

  const runTest = async (query: string) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      console.log('🌐 Testing web scraper with query:', query);
      const response = await perplexityWebScraper.scrapeFromPerplexity(query);
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        query,
        success: response.success,
        response: response.content,
        source: response.source,
        timestamp: response.timestamp,
        duration
      };
      
      setResults(prev => [...prev, result]);
      console.log('✅ Web scraper test completed:', result);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setResults(prev => [...prev, {
        query,
        success: false,
        response: errorMessage,
        source: 'Error',
        timestamp: new Date().toISOString(),
        duration
      }]);
      
      console.error('❌ Web scraper test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    
    const testQueries = [
      'Tell me about today\'s Panchang',
      'When is the next Ekadashi?',
      'What is Purnima?',
      'Tell me about Amavasya',
      'What are Nakshatras?',
      'Explain Tithi in Hindu calendar'
    ];

    for (const query of testQueries) {
      await runTest(query);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const runCustomTest = async () => {
    if (testQuery.trim()) {
      await runTest(testQuery);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const isConnected = await perplexityWebScraper.testConnection();
      console.log('🌐 Web scraper connection test:', isConnected ? 'SUCCESS' : 'FAILED');
      alert(isConnected ? '✅ Web scraper is working!' : '❌ Web scraper test failed');
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      alert('❌ Web scraper connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Perplexity Web Scraper Test</h1>
      </div>

      {/* Description */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">About This Test</h2>
        <p className="text-sm text-gray-700 mb-2">
          This component tests the web scraper fallback system that fetches information from Perplexity.ai 
          when the API is not working. It provides comprehensive Panchang and spiritual information.
        </p>
        <div className="text-xs text-blue-600">
          <strong>Features:</strong> Fallback data, markdown formatting, spoken summaries, comprehensive Panchang information
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a query to test..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Run All Tests
          </button>
          
          <button
            onClick={runCustomTest}
            disabled={isLoading || !testQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            Test Custom Query
          </button>
          
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            Test Connection
          </button>
          
          <button
            onClick={clearResults}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
          
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium text-gray-800">
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
                <span className="text-sm text-gray-500">
                  ({result.duration}ms)
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {result.source}
                </span>
              </div>
              
              <div className="mb-2">
                <strong className="text-sm text-gray-700">Query:</strong>
                <span className="ml-2 text-sm text-gray-600">{result.query}</span>
              </div>
              
              <div className="mb-2">
                <strong className="text-sm text-gray-700">Response:</strong>
                <div className="mt-1 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{result.response}</pre>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Timestamp: {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Usage Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-gray-700">Panchang Queries:</strong>
            <ul className="mt-1 text-gray-600 space-y-1">
              <li>• "Tell me about today's Panchang"</li>
              <li>• "What is the current tithi?"</li>
              <li>• "Show me auspicious timings"</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-700">Spiritual Queries:</strong>
            <ul className="mt-1 text-gray-600 space-y-1">
              <li>• "When is the next Ekadashi?"</li>
              <li>• "What is Purnima?"</li>
              <li>• "Tell me about Amavasya"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 p-3 bg-blue-50 rounded text-center text-sm text-blue-700">
        <strong>Note:</strong> This web scraper provides fallback data when the Perplexity API is not working. 
        It includes comprehensive Panchang information and spiritual guidance.
      </div>
    </div>
  );
};

export default PerplexityWebScraperTest; 