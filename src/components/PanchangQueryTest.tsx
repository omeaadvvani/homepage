import React, { useState } from 'react';
import { perplexityAPI } from '../lib/perplexity-api';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';

// Utility function to remove citations from text
const removeCitations = (text: string): string => {
  // Remove citation patterns like [1], [2], [3], etc.
  return text.replace(/\[\d+\]/g, '').trim();
};

const PanchangQueryTest: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentLocation } = useLocation();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await perplexityAPI.generateDrikPanchangamResponse(query, {
        userLocation: currentLocation?.location_name || 'Vancouver, Canada',
        currentTime: new Date().toISOString(),
        timezone: 'America/Vancouver'
      });
      
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "When is the next Ashtami?",
    "When is the next Amavasya?",
    "What is Krishna Paksha?",
    "When does next Ashtami start?",
    "What maasa is this?",
    "When is the Varalakshmi Vratham?",
    "When is the next Ekadashi?",
    "When is the next Purnima?",
    "What is today's Tithi?",
    "Tell me about fasting today",
    "What is the Tithi on 15/08/2025?",
    "What is the Nakshatra on 20/08/2025?",
    "Get Panchang for 25/08/2025",
    "I'm feeling lost in life",
    "What should I do today?",
    "Is today auspicious?",
    "Help me understand my spiritual path"
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Panchang Query Test</h3>
      
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about Panchang..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Querying...' : 'Ask Question'}
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Example queries:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      
                   {response && (
               <div className="mt-4 p-3 bg-gray-50 rounded-md">
                 <h4 className="font-semibold mb-2">Response:</h4>
                 <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                 <div className="mt-2 text-xs text-gray-500">
                   💡 Performance: Check browser console for Perplexity API call details
                   🤖 AI: Perplexity AI is analyzing questions and providing comprehensive responses
                 </div>
               </div>
             )}
    </div>
  );
};

export default PanchangQueryTest; 