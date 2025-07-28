import React, { useEffect, useState } from 'react';

const DebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      envVars: {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        panchangUserId: import.meta.env.VITE_PANCHANG_USER_ID ? 'Set' : 'Missing',
        panchangAuthCode: import.meta.env.VITE_PANCHANG_AUTH_CODE ? 'Set' : 'Missing',
        geminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDeXkh_zbZxuNESQUH1FXAlXBB5YFOcV08') ? 'Set' : 'Missing',
        panchangApiUrl: 'https://api.panchang.click/v0.4/panchangapip1',
      },
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-xs">
      <h3 className="font-bold mb-2">Debug Information</h3>
      <pre className="whitespace-pre-wrap overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default DebugInfo; 