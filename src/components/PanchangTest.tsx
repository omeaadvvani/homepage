import React, { useEffect, useState } from 'react';
import { panchangAPI } from '../lib/panchang-api';

const PanchangTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [isLoading, setIsLoading] = useState(true);
  const [detailedError, setDetailedError] = useState<string>('');

  useEffect(() => {
    const testPanchangAPI = async () => {
      try {
        setIsLoading(true);
        setDetailedError('');
        
        console.log('Starting Panchang API test...');
        
        // First, test direct API call to check CORS
        try {
          const testUrl = 'https://api.panchang.click/v0.4/panchangapip1?date=27/07/2025&time=14:45:00&tz=5.5&userid=kiranku&authcode=6d024cd3cced6e74fd1ec17acb371584&lat=28.6139&lon=77.2090';
          console.log('Testing direct API call to:', testUrl);
          
          const directResponse = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors'
          });
          
          console.log('Direct API response status:', directResponse.status);
          console.log('Direct API response headers:', directResponse.headers);
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('Direct API response data:', directData);
          } else {
            console.error('Direct API call failed:', directResponse.status, directResponse.statusText);
          }
        } catch (directError) {
          console.error('Direct API call error:', directError);
        }
        
        const isValid = await panchangAPI.validateCredentials();
        console.log('Credential validation result:', isValid);
        
        if (!isValid) {
          setTestResult('❌ API credentials validation failed');
          setDetailedError('Check browser console for detailed error information');
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        console.log('Fetching Panchang data for date:', today);
        
        const panchangData = await panchangAPI.getPanchangData(today, 28.6139, 77.2090);
        console.log('Panchang data result:', panchangData);
        
        if (!panchangData.success) {
          setTestResult(`❌ Failed to get Panchang data: ${panchangData.error}`);
          setDetailedError(`Error details: ${panchangData.error}`);
          return;
        }
        
        const guidance = await panchangAPI.getPanchangGuidance({
          question: "When is the next Ekadashi?",
          date: today,
          latitude: 28.6139,
          longitude: 77.2090
        });
        
        console.log('Guidance result:', guidance);
        
        if (guidance.success) {
          setTestResult(`✅ Panchang API working! Today: ${panchangData.data?.tithi} Tithi, ${panchangData.data?.nakshatra} Nakshatra, ${panchangData.data?.paksha} Paksha`);
        } else {
          setTestResult(`⚠️ API working but guidance failed: ${guidance.error}`);
          setDetailedError(`Guidance error: ${guidance.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Panchang API test error:', error);
        setTestResult(`❌ Error testing Panchang API: ${errorMessage}`);
        setDetailedError(`Full error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    testPanchangAPI();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Panchang API Test</h3>
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
            User ID: kiranku | Auth Code: 6d024cd3cced6e74fd1ec17acb371584
          </p>
        </div>
      )}
    </div>
  );
};

export default PanchangTest; 