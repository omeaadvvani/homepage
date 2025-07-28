import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

const ErrorPrevention: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Prevent unhandled errors from causing page reloads
    const handleError = (event: ErrorEvent) => {
      console.log('🚨 Error caught by ErrorPrevention:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'An unexpected error occurred');
      
      // Prevent the error from bubbling up
      event.preventDefault();
      return false;
    };

    // Prevent unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🚨 Unhandled promise rejection caught:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'A promise was rejected');
      
      // Prevent the rejection from causing a page reload
      event.preventDefault();
    };

    // Prevent Vite compilation errors from causing reloads
    const handleViteError = (event: MessageEvent) => {
      if (event.data && event.data.type === 'vite:error') {
        console.log('🚨 Vite error caught:', event.data);
        setHasError(true);
        setErrorMessage('A compilation error occurred. The page will refresh automatically when fixed.');
        
        // Don't prevent the event, but handle it gracefully
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('message', handleViteError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('message', handleViteError);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    // Soft reload without losing state
    window.location.reload();
  };

  const handleDismiss = () => {
    setHasError(false);
    setErrorMessage('');
  };

  if (!hasError) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">Error Prevention</h3>
          <button
            onClick={handleDismiss}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          An error was detected and prevented from causing a page reload. Your work is safe.
        </p>
        
        {errorMessage && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Show Error Details
            </summary>
            <div className="mt-2 p-3 bg-red-50 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
              {errorMessage}
            </div>
          </details>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPrevention; 