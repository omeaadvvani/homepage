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

  const getIPBasedLocation = async (): Promise<{ latitude: number; longitude: number; name: string }> => {
    try {
      console.log('🌐 Trying IP-based location...');
      
      const response = await fetch('https://api.bigdatacloud.net/data/ip-geolocation-full?key=free&ip=8.8.8.8');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 IP-based location response:', data);
        
        const latitude = data.location?.latitude || 20.5937; // Default to India
        const longitude = data.location?.longitude || 78.9629;
        const city = data.location?.city || '';
        const state = data.location?.principalSubdivision || '';
        const country = data.location?.country?.name || 'India';
        
        let name = '';
        if (city && state) {
          name = `${city}, ${state}, ${country}`;
        } else if (city) {
          name = `${city}, ${country}`;
        } else if (state) {
          name = `${state}, ${country}`;
        } else {
          name = country;
        }
        
        return { latitude, longitude, name };
      } else {
        throw new Error('IP-based location failed');
      }
    } catch (error) {
      console.warn('❌ IP-based location failed:', error);
      // Return default India location
      return { 
        latitude: 20.5937, 
        longitude: 78.9629, 
        name: 'India (IP fallback)' 
      };
    }
  };

  useEffect(() => {
    const testLocation = () => {
      console.log('🧪 Starting location test...');
      
      // Check if we're on HTTPS (required for geolocation)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Geolocation requires HTTPS (except on localhost)');
        setLocationStatus('HTTPS required');
        setError('Geolocation requires HTTPS. Please access via https:// or localhost.');
        setLocationName('India (HTTPS required)');
        setCoordinates('HTTPS required for geolocation');
        return;
      }
      
      if (!('geolocation' in navigator)) {
        console.error('❌ Geolocation not supported');
        setLocationStatus('Geolocation not supported');
        setError('Your browser does not support geolocation.');
        return;
      }

      setLocationStatus('Requesting location...');
      console.log('📍 Requesting current position...');

      // First, check if we have permission
      navigator.permissions?.query({ name: 'geolocation' }).then((permissionStatus) => {
        console.log('🔐 Permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          setLocationStatus('Permission denied');
          setError('Location permission denied. Please allow location access in your browser settings.');
          setLocationName('India (permission denied)');
          setCoordinates('Permission denied');
          return;
        }
        
        if (permissionStatus.state === 'prompt') {
          console.log('📋 Permission prompt needed');
        }
      }).catch((error) => {
        console.log('⚠️ Could not check permission status:', error);
      });

      // Try multiple location strategies
      const tryLocationStrategies = () => {
        // Strategy 1: High accuracy (GPS)
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log('✅ High accuracy position obtained:', { latitude, longitude, accuracy });
            
            setCoordinates(`${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
            setLocationStatus('Location obtained successfully!');
            setError('');
            
            // Test geocoding
            const name = await getLocationName(latitude, longitude);
            setLocationName(name);
          },
          (error) => {
            console.log('❌ High accuracy failed, trying low accuracy...');
            
            // Strategy 2: Low accuracy (IP-based)
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log('✅ Low accuracy position obtained:', { latitude, longitude, accuracy });
                
                setCoordinates(`${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
                setLocationStatus('Location obtained (low accuracy)!');
                setError('');
                
                // Test geocoding
                const name = await getLocationName(latitude, longitude);
                setLocationName(name);
              },
                             (error) => {
                 console.log('❌ Low accuracy failed, trying IP-based location...');
                 
                 // Strategy 3: IP-based location
                 getIPBasedLocation().then((ipLocation) => {
                   console.log('✅ IP-based location obtained:', ipLocation);
                   
                   setCoordinates(`${ipLocation.latitude}, ${ipLocation.longitude} (IP-based)`);
                   setLocationStatus('Location obtained (IP-based)!');
                   setError('');
                   setLocationName(ipLocation.name);
                 }).catch((ipError) => {
                   console.error('❌ All location strategies failed:', ipError);
                   setLocationStatus('Location error');
                   
                   let errorMessage = '';
                   switch (error.code) {
                     case error.PERMISSION_DENIED:
                       errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
                       break;
                     case error.POSITION_UNAVAILABLE:
                       errorMessage = 'Location information unavailable. This might be due to network issues or GPS not being available.';
                       break;
                     case error.TIMEOUT:
                       errorMessage = 'Location request timed out. Please try again.';
                       break;
                     default:
                       errorMessage = `Location error: ${error.message}`;
                   }
                   
                   setError(errorMessage);
                   
                   // Set default location as fallback
                   setLocationName('India (fallback)');
                   setCoordinates('Default location used');
                 });
               },
              {
                timeout: 10000,
                enableHighAccuracy: false,
                maximumAge: 600000 // 10 minutes cache
              }
            );
          },
          {
            timeout: 8000,
            enableHighAccuracy: true,
            maximumAge: 0
          }
        );
      };

      tryLocationStrategies();
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
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Test
        </button>
        <button 
          onClick={() => {
            setLocationStatus('Testing...');
            setError('');
            setCoordinates('');
            setLocationName('');
            setTimeout(() => {
              const testLocation = () => {
                if (!('geolocation' in navigator)) {
                  setLocationStatus('Geolocation not supported');
                  setError('Your browser does not support geolocation.');
                  return;
                }
                
                setLocationStatus('Requesting location...');
                
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setCoordinates(`${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
                    setLocationStatus('Location obtained successfully!');
                    setError('');
                    
                    const name = await getLocationName(latitude, longitude);
                    setLocationName(name);
                  },
                  (error) => {
                    setLocationStatus('Location error');
                    setError(`Error: ${error.message}`);
                  },
                  {
                    timeout: 15000,
                    enableHighAccuracy: false,
                    maximumAge: 300000
                  }
                );
              };
              testLocation();
            }, 100);
          }}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧪 Test Again
        </button>
        <button 
          onClick={async () => {
            setLocationStatus('Testing IP-based location...');
            setError('');
            setCoordinates('');
            setLocationName('');
            
            try {
              const ipLocation = await getIPBasedLocation();
              setCoordinates(`${ipLocation.latitude}, ${ipLocation.longitude} (IP-based)`);
              setLocationStatus('IP-based location obtained!');
              setError('');
              setLocationName(ipLocation.name);
                         } catch (ipError) {
               setLocationStatus('IP-based location failed');
               setError('Failed to get IP-based location');
             }
          }}
          style={{
            background: '#ffc107',
            color: 'black',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🌐 Test IP Location
        </button>
      </div>
    </div>
  );
};

export default LocationTest; 