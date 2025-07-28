import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import ErrorPrevention from './ErrorPrevention';
import CompilationErrorHandler from './CompilationErrorHandler';
import DevelopmentModeIndicator from './DevelopmentModeIndicator';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Prevent any unhandled errors from causing page reloads
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.log('🚨 Error caught by AppWrapper:', event.error);
      event.preventDefault();
      return false;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🚨 Unhandled promise rejection caught:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-spiritual-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spiritual-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-spiritual-800 mb-2">VoiceVedic</h1>
          <p className="text-spiritual-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ErrorPrevention />
        <CompilationErrorHandler />
        <DevelopmentModeIndicator />
        {children}
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppWrapper; 