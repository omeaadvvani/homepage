import React, { useEffect, useState } from 'react';
import { perplexityAPI } from '../lib/perplexity-api';

// Utility function to remove citations from text
const removeCitations = (text: string): string => {
  // Remove citation patterns like [1], [2], [3], etc.
  return text.replace(/\[\d+\]/g, '').trim();
};

const PanchangTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [isLoading, setIsLoading] = useState(true);
  const [detailedError, setDetailedError] = useState<string>('');

  useEffect(() => {
    const testPanchangAPI = async () => {
      try {
        setIsLoading(true);
        setDetailedError('');
        
        console.log('Starting Perplexity API test for Panchang queries...');
        
        // Test Perplexity API with a Panchang-related query
        const testQuery = "When is the next Ekadashi?";
        console.log('Testing with query:', testQuery);
        
        const response = await perplexityAPI.generateAstrologicalInsights(testQuery);
        console.log('Perplexity API response:', response);
        
        if (response && response.trim()) {
          // Remove citations from response
          const cleanResponse = removeCitations(response);
          setTestResult(`✅ Perplexity AI working! Successfully generated response for Panchang query`);
          setDetailedError(`Response preview: ${cleanResponse.substring(0, 100)}...`);
        } else {
          setTestResult(`❌ Perplexity API returned empty response`);
          setDetailedError(`Empty response from Perplexity API`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Perplexity API test error:', error);
        setTestResult(`❌ Error testing Perplexity API: ${errorMessage}`);
        setDetailedError(`Full error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    testPanchangAPI();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Perplexity AI Panchang Test</h3>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Testing API connection...</span>
        </div>
      ) : (
        <div className="text-sm">
          <p className={testResult.includes('✅') ? 'text-green-600' : testResult.includes('❌') ? 'text-red-600' : 'text-yellow-600'}>
            {testResult}
          </p>
          {detailedError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500">Show error details</summary>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {detailedError}
              </pre>
            </details>
          )}
          <p className="text-gray-600 mt-2">
            Using Perplexity AI for all Panchang queries
          </p>
        </div>
      )}
    </div>
  );
};

export default PanchangTest; 