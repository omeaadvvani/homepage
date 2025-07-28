import React, { useState } from 'react';
import { panchangAPI } from '../lib/panchang-api';

const AllTithisTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const allTithis = [
    // All 16 Tithis (same names in both Shukla and Krishna Paksha)
    { name: 'Pratipada', description: 'First tithi after new/full moon, new beginnings' },
    { name: 'Dwitiya', description: 'Second tithi, spiritual practices' },
    { name: 'Tritiya', description: 'Third tithi, prayer and meditation' },
    { name: 'Chaturthi', description: 'Fourth tithi, Ganesh worship' },
    { name: 'Panchami', description: 'Fifth tithi, spiritual practices' },
    { name: 'Shashthi', description: 'Sixth tithi (Shashti), spiritual practices' },
    { name: 'Saptami', description: 'Seventh tithi, spiritual practices' },
    { name: 'Ashtami', description: 'Eighth tithi, Durga Puja' },
    { name: 'Navami', description: 'Ninth tithi, Siddhi Vinayaka Puja' },
    { name: 'Dashami', description: 'Tenth tithi, Vijayadashami' },
    { name: 'Ekadashi', description: 'Eleventh tithi, fasting day' },
    { name: 'Dwadashi', description: 'Twelfth tithi, spiritual practices' },
    { name: 'Trayodashi', description: 'Thirteenth tithi, Pradosh Vrat' },
    { name: 'Chaturdashi', description: 'Fourteenth tithi, spiritual practices' },
    { name: 'Purnima', description: 'Fifteenth tithi, full moon' },
    { name: 'Amavasya', description: 'New moon, also considered a tithi' }
  ];

  const testAllTithis = async () => {
    setLoading(true);
    setResults([]);
    
    const newResults: string[] = [];
    
    for (const tithi of allTithis) {
      try {
        const question = `When is the next ${tithi.name.toLowerCase()}?`;
        newResults.push(`\n🔍 Testing: ${question}`);
        
        const response = await panchangAPI.getPanchangGuidance({
          question,
          latitude: 28.6139,
          longitude: 77.2090
        });
        
        if (response.success && response.guidance) {
          newResults.push(`✅ ${tithi.name}: ${tithi.description}`);
          newResults.push(response.guidance);
        } else {
          newResults.push(`❌ ${tithi.name}: Failed to get data`);
        }
      } catch (error) {
        newResults.push(`❌ ${tithi.name}: Error - ${error}`);
      }
    }
    
    setResults(newResults);
    setLoading(false);
  };

  const testSpecificTithi = async (tithiName: string) => {
    setLoading(true);
    setResults([]);
    
    try {
      const question = `When is the next ${tithiName.toLowerCase()}?`;
      setResults([`🔍 Testing: ${question}`]);
      
      const response = await panchangAPI.getPanchangGuidance({
        question,
        latitude: 28.6139,
        longitude: 77.2090
      });
      
      if (response.success && response.guidance) {
        setResults([`✅ ${tithiName}`, response.guidance]);
      } else {
        setResults([`❌ ${tithiName}: Failed to get data`]);
      }
    } catch (error) {
      setResults([`❌ ${tithiName}: Error - ${error}`]);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-800">
        🕉️ All 16 Tithis Test
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          This component tests all 16 Tithis in the Hindu calendar. Each Tithi has specific spiritual significance and rituals.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {allTithis.map((tithi, index) => (
            <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800">{tithi.name}</h3>
              <p className="text-sm text-gray-600">{tithi.description}</p>
              <button
                onClick={() => testSpecificTithi(tithi.name)}
                className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Test {tithi.name}
              </button>
            </div>
          ))}
        </div>
        
        <button
          onClick={testAllTithis}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test All 16 Tithis'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-800">Test Results:</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="mb-2 text-sm">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📚 Hindu Calendar Information:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Total Tithis:</strong> 16 Tithis in the Hindu calendar</li>
            <li>• <strong>Shukla Paksha:</strong> Waxing moon phase (same 16 Tithis)</li>
            <li>• <strong>Krishna Paksha:</strong> Waning moon phase (same 16 Tithis)</li>
            <li>• <strong>Each Tithi:</strong> Has specific spiritual significance and recommended practices</li>
            <li>• <strong>Timing:</strong> Each Tithi has specific start and end times</li>
            <li>• <strong>Special:</strong> Purnima (full moon) and Amavasya (new moon) are key tithis</li>
          </ul>
        </div>
    </div>
  );
};

export default AllTithisTest; 