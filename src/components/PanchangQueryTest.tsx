import React, { useState } from 'react';
import { perplexityAPI } from '../lib/perplexity-api';

// Utility function to remove citations from text
const removeCitations = (text: string): string => {
  // Remove citation patterns like [1], [2], [3], etc.
  return text.replace(/\[\d+\]/g, '').trim();
};

const PanchangQueryTest: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      console.log('🚀 Starting query:', query);
      
      // Extract date from query if present
      const dateMatch = query.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      let targetDate = undefined;
      
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        targetDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log('📅 Extracted date from query:', targetDate);
      }
      
      // Determine the type of query and use appropriate Perplexity method
      const lowerQuery = query.toLowerCase();
      let responseText = '';
      
      if (lowerQuery.includes('spiritual') || lowerQuery.includes('meditation') || 
          lowerQuery.includes('peace') || lowerQuery.includes('mindfulness') ||
          lowerQuery.includes('lost') || lowerQuery.includes('path')) {
        // Use spiritual guidance
        responseText = await perplexityAPI.generateSpiritualGuidance(query, {
          userLocation: 'Delhi, India',
          currentTime: new Date().toISOString()
        });
      } else if (lowerQuery.includes('astrology') || lowerQuery.includes('horoscope') || 
                 lowerQuery.includes('nakshatra') || lowerQuery.includes('tithi') ||
                 lowerQuery.includes('panchang') || lowerQuery.includes('paksha') ||
                 lowerQuery.includes('maasa') || lowerQuery.includes('vratham') ||
                 lowerQuery.includes('ekadashi') || lowerQuery.includes('purnima') ||
                 lowerQuery.includes('amavasya') || lowerQuery.includes('ashtami')) {
        // Use astrological insights for Panchang-related queries
        responseText = await perplexityAPI.generateAstrologicalInsights(query);
      } else {
        // Use general knowledge response
        responseText = await perplexityAPI.generateKnowledgeResponse(query);
      }
      
      if (responseText && responseText.trim()) {
        // Remove citations from the response
        responseText = removeCitations(responseText);
        setResponse(responseText);
        console.log('✅ Query completed successfully with Perplexity AI (citations removed)');
      } else {
        setResponse('I apologize, but I am unable to process your question at the moment. Please try asking about specific Tithis, dates, spiritual topics, or Panchang information.');
        console.log('❌ Empty response from Perplexity API');
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('💥 Query error:', error);
    } finally {
      setIsLoading(false);
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
          onClick={handleQuery}
          disabled={isLoading || !query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Querying...' : 'Ask Question'}
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