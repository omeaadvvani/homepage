import React, { useState } from 'react';
import { usePanchang } from '../hooks/usePanchang';
import { useLocation } from '../hooks/useLocation';

const PanchangScreen: React.FC = () => {
  const { panchangData, loading, error, fetchPanchang, refreshPanchang } = usePanchang();
  const { currentLocation } = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleDateChange = async (dateString: string) => {
    setSelectedDate(dateString);
    const date = new Date(dateString);
    await fetchPanchang(
      date,
      currentLocation?.latitude?.toString(),
      currentLocation?.longitude?.toString()
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString.replace(/(\d{2}):(\d{2}):(\d{2})/, '$1:$2');
  };

  const getTithiEmoji = (tithi: string) => {
    const tithiEmojis: Record<string, string> = {
      'Pratipada': '🌑',
      'Dwitiya': '🌒',
      'Tritiya': '🌓',
      'Chaturthi': '🌔',
      'Panchami': '🌕',
      'Shashthi': '🌖',
      'Saptami': '🌗',
      'Ashtami': '🌘',
      'Navami': '🌑',
      'Dashami': '🌒',
      'Ekadashi': '🌓',
      'Dwadashi': '🌔',
      'Trayodashi': '🌕',
      'Chaturdashi': '🌖',
      'Purnima': '🌕',
      'Amavasya': '🌑'
    };
    return tithiEmojis[tithi] || '📅';
  };

  const getNakshatraEmoji = (nakshatra: string) => {
    return '⭐';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Panchang data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Panchang</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshPanchang}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Hindu Panchang</h1>
          <p className="text-gray-600">Sacred calendar for spiritual guidance</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="date-selector" className="text-lg font-semibold text-gray-700">
              Select Date:
            </label>
            <button
              onClick={refreshPanchang}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <input
            id="date-selector"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {panchangData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tithi Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{getTithiEmoji(panchangData.tithi)}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Tithi</h3>
                  <p className="text-gray-600">{panchangData.paksha}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-orange-600">{panchangData.tithi}</p>
                <p className="text-sm text-gray-500">
                  Start: {formatTime(panchangData.tithiStart)}
                </p>
                <p className="text-sm text-gray-500">
                  End: {formatTime(panchangData.tithiTill)}
                </p>
              </div>
            </div>

            {/* Nakshatra Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{getNakshatraEmoji(panchangData.nakshatra)}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Nakshatra</h3>
                  <p className="text-gray-600">Lunar Mansion</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-purple-600">{panchangData.nakshatra}</p>
                <p className="text-sm text-gray-500">
                  Start: {formatTime(panchangData.nakshatraStart)}
                </p>
                <p className="text-sm text-gray-500">
                  End: {formatTime(panchangData.nakshatraTill)}
                </p>
              </div>
            </div>

            {/* Yoga Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🧘</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Yoga</h3>
                  <p className="text-gray-600">Solar-Lunar Combination</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">{panchangData.yoga}</p>
                <p className="text-sm text-gray-500">
                  Until: {formatTime(panchangData.yogTill)}
                </p>
              </div>
            </div>

            {/* Karana Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">⚡</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Karana</h3>
                  <p className="text-gray-600">Half Tithi</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-600">{panchangData.karana}</p>
                <p className="text-sm text-gray-500">
                  Until: {formatTime(panchangData.karanTill)}
                </p>
              </div>
            </div>

            {/* Rashi Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">♈</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Rashi</h3>
                  <p className="text-gray-600">Zodiac Sign</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-indigo-600">{panchangData.rashi}</p>
              </div>
            </div>

            {/* Maasa Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🌙</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Maasa</h3>
                  <p className="text-gray-600">Lunar Month</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-pink-600">{panchangData.maasa}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sunrise/Sunset Card */}
        {panchangData && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🌅 Sun Timings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-2">🌅</div>
                <p className="text-sm text-gray-600">Sunrise</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatTime(panchangData.sunrise)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl mb-2">🌇</div>
                <p className="text-sm text-gray-600">Sunset</p>
                <p className="text-xl font-bold text-red-600">
                  {formatTime(panchangData.sunset)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Info */}
        {panchangData && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 text-center">
              Requests remaining: {panchangData.requestsremaining} | 
              Plan: {panchangData.plan} | 
              Data provided by Panchang.Click API
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanchangScreen; 