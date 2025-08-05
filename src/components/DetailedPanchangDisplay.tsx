import React, { useState, useEffect } from 'react';
import { panchangDetailedAPI } from '../lib/panchang-detailed-api';
import { useLocation } from '../hooks/useLocation';
import { useVoice } from '../hooks/useVoice';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  Volume2, 
  VolumeX,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DetailedPanchangDisplayProps {
  query?: string;
  onBack?: () => void;
}

const DetailedPanchangDisplay: React.FC<DetailedPanchangDisplayProps> = ({ query, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [spokenSummary, setSpokenSummary] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuery, setUserQuery] = useState(query || '');
  const [lastQuery, setLastQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const { currentLocation } = useLocation();
  const { speakText, stopAudio, isPlaying } = useVoice();

  // Auto-fetch Panchang data when component mounts or location changes
  useEffect(() => {
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      fetchPanchangData();
    }
  }, [currentLocation]);

  const fetchPanchangData = async (customQuery?: string) => {
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      setError('Location not available. Please enable location access.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = customQuery || userQuery || 'Show me today\'s Panchang';
      const location = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };

      console.log('Fetching detailed Panchang with query:', query, 'and location:', location);

      const response = await panchangDetailedAPI.getDetailedPanchang(query, location);

      if (response && response.tableData) {
        setPanchangData(response.tableData);
        setSpokenSummary(response.spokenSummary || '');
        setLastQuery(customQuery || userQuery);
        
        // Auto-speak the summary
        if (response.spokenSummary && !isMuted) {
          setTimeout(() => {
            speakSummary(response.spokenSummary);
          }, 500);
        }

        console.log('Detailed Panchang data received:', response.tableData);
      } else {
        setError('Failed to fetch Panchang data');
        console.error('Panchang fetch failed: No data received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error in fetchPanchangData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakSummary = async (summary: string) => {
    if (!summary || isMuted) return;
    
    setIsSpeaking(true);
    try {
      await speakText(summary);
    } catch (error) {
      console.error('Error speaking summary:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    stopAudio();
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userQuery.trim()) {
      fetchPanchangData(userQuery.trim());
    }
  };

  const handleRefresh = () => {
    fetchPanchangData();
  };

  const formatTableData = (data: any) => {
    if (!data || !data.tableData) {
      return 'No data available';
    }
    
    // If tableData is already a markdown string, return it
    if (typeof data.tableData === 'string') {
      return data.tableData;
    }
    
    // Otherwise, format as table
    return `# Panchang Information

| Field | Value |
|-------|-------|
| **Date** | ${data.date || 'Not available'} |
| **Vasara** | ${data.vasara || 'Not available'} |
| **Tithi** | ${data.tithi || 'Not available'} |
| **Nakshatra** | ${data.nakshatra || 'Not available'} |
| **Raashi** | ${data.raashi || 'Not available'} |
| **Sunrise** | ${data.sunrise || 'Not available'} |
| **Sunset** | ${data.sunset || 'Not available'} |
| **Amrutha Kalam** | ${data.amruthaKalam || 'Not available'} |
| **Rahu Kalam** | ${data.rahuKalam || 'Not available'} |
| **Source** | ${data.source || 'Not available'} |`;
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (panchangData) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Calendar className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Loading Panchang data...';
    if (error) return 'Error loading data';
    if (panchangData) return 'Panchang data loaded';
    return 'Ready to fetch data';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detailed Panchang Information</h1>
            <p className="text-sm text-gray-600">
              {currentLocation?.location_name || 'Location detecting...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span>Location: {currentLocation?.location_name || 'Detecting...'}</span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>
      </div>

      {/* Query Input */}
      <div className="mb-6">
        <form onSubmit={handleQuerySubmit} className="flex gap-3">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask about Panchang: 'Show me today's Panchang' or 'When is the next Ekadashi?'"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={isLoading || !userQuery.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={toggleMute}
            className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {isMuted && <span className="text-orange-600">Voice output is muted</span>}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Error:</span>
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Fetching detailed Panchang information...</p>
        </div>
      )}

      {/* Panchang Data Table */}
      {panchangData && (
        <div className="space-y-6">
          {/* Spoken Summary */}
          {spokenSummary && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Spoken Summary</span>
                </div>
                <div className="flex gap-2">
                  {isSpeaking ? (
                    <button
                      onClick={stopSpeaking}
                      className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      <VolumeX className="w-4 h-4" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => speakSummary(spokenSummary)}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      <Volume2 className="w-4 h-4" />
                      Speak
                    </button>
                  )}
                  <button
                    onClick={toggleMute}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </div>
              <p className="text-blue-700 text-sm">{spokenSummary}</p>
            </div>
          )}

          {/* Query Info */}
          {lastQuery && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-600">Query: </span>
              <span className="text-sm font-medium text-gray-800">"{lastQuery}"</span>
            </div>
          )}

          {/* Panchang Table */}
          <div className="overflow-x-auto">
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Panchang Information</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-purple-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                          Field
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                          Value(s)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {panchangData && (
                        <>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Date</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.date || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Maasa</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.maasa || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Vasara</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.vasara || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Tithi</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.tithi || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Tithi Start/End</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.tithiStartEnd || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Nakshatra</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.nakshatra || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Raashi</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.raashi || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Sunrise</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.sunrise || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Sunset</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.sunset || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Aayana</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.aayana || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Amrutha Kalam</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.amruthaKalam || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Varjyam</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.varjyam || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Durmuhurtham</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.durmuhurtham || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Rahu Kalam</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.rahuKalam || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Yama Gandam</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.yamaGandam || 'Not available'}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Pradosham Timings</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.pradosham || 'Not available'}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Source</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-800">{panchangData.source || 'Not available'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Auspicious Timings</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li><strong>Amrutha Kalam:</strong> {panchangData.amruthaKalam}</li>
                <li><strong>Sunrise:</strong> {panchangData.sunrise}</li>
                <li><strong>Sunset:</strong> {panchangData.sunset}</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Avoid These Timings</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li><strong>Rahu Kalam:</strong> {panchangData.rahuKalam}</li>
                <li><strong>Varjyam:</strong> {panchangData.varjyam}</li>
                <li><strong>Durmuhurtham:</strong> {panchangData.durmuhurtham}</li>
                <li><strong>Yama Gandam:</strong> {panchangData.yamaGandam}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      {onBack && (
        <div className="mt-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

export default DetailedPanchangDisplay; 