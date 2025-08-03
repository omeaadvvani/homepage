import React, { useState, useEffect } from 'react';

const LocationTest: React.FC = () => {
  const [locationStatus, setLocationStatus] = useState<string>('Checking...');
  const [coordinates, setCoordinates] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isTestingGeocoding, setIsTestingGeocoding] = useState<boolean>(false);

  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('🔍 Testing geocoding for:', latitude, longitude);
      setIsTestingGeocoding(true);
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📍 Geocoding test response:', data);
        
        const city = data.city || data.locality || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';
        
        let name = '';
        if (city && state) {
          name = `${city}, ${state}, ${country}`;
        } else if (city) {
          name = `${city}, ${country}`;
        } else if (state) {
          name = `${state}, ${country}`;
        } else {
          name = country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        console.log('✅ Location name test result:', name);
        return name;
      } else {
        console.warn('⚠️ Geocoding API test failed');
        return 'Geocoding failed';
      }
    } catch (error) {
      console.warn('❌ Geocoding test failed:', error);
      return 'Geocoding error';
    } finally {
      setIsTestingGeocoding(false);
    }
  };

  useEffect(() => {
    const testLocation = () => {
      console.log('🧪 Starting location test...');
      
      if (!('geolocation' in navigator)) {
        console.error('❌ Geolocation not supported');
        setLocationStatus('Geolocation not supported');
        return;
      }

      setLocationStatus('Requesting location...');
      console.log('📍 Requesting current position...');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('✅ Position obtained:', { latitude, longitude, accuracy });
          
          setCoordinates(`${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
          setLocationStatus('Location obtained successfully!');
          setError('');
          
          // Test geocoding
          const name = await getLocationName(latitude, longitude);
          setLocationName(name);
        },
        (error) => {
          console.error('❌ Location error:', error);
          setLocationStatus('Location error');
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError('Location permission denied. Please allow location access.');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Location information unavailable.');
              break;
            case error.TIMEOUT:
              setError('Location request timed out.');
              break;
            default:
              setError(`Location error: ${error.message}`);
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    };

    testLocation();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      zIndex: 1000,
      maxWidth: '350px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📍 Location Test</h3>
      <p><strong>Status:</strong> {locationStatus}</p>
      {coordinates && <p><strong>Coordinates:</strong> {coordinates}</p>}
      {locationName && <p><strong>Location Name:</strong> {locationName}</p>}
      {isTestingGeocoding && <p style={{ color: '#666' }}>🔄 Testing geocoding...</p>}
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      <button 
        onClick={() => window.location.reload()} 
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        🔄 Refresh Test
      </button>
    </div>
  );
};

export default LocationTest; 