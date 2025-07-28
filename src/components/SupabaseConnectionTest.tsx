import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.from('user_preferences').select('count').limit(1);
        
        if (error) {
          setConnectionStatus('error');
          setErrorMessage(`Connection error: ${error.message}`);
        } else {
          setConnectionStatus('success');
        }
      } catch (err) {
        setConnectionStatus('error');
        setErrorMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      
      {connectionStatus === 'testing' && (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Testing connection...</span>
        </div>
      )}
      
      {connectionStatus === 'success' && (
        <div className="flex items-center text-green-600">
          <span className="mr-2">✅</span>
          <span>Connected to Supabase successfully!</span>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="text-red-600">
          <div className="flex items-center mb-2">
            <span className="mr-2">❌</span>
            <span>Connection failed</span>
          </div>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p><strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest; 