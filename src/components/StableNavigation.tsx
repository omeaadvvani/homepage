import React, { useEffect, useState } from 'react';

interface StableNavigationProps {
  children: React.ReactNode;
}

const StableNavigation: React.FC<StableNavigationProps> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Prevent page reloads during navigation
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isNavigating) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    // Handle navigation changes
    const handleNavigation = () => {
      setIsNavigating(true);
      
      // Reset navigation state after a short delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 100);
    };

    // Listen for navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isNavigating]);

  // Prevent Vite HMR from causing page reloads
  useEffect(() => {
    const handleViteHMR = (event: MessageEvent) => {
      if (event.data && event.data.type === 'vite:beforeUpdate') {
        // Prevent automatic page reload on HMR
        event.preventDefault();
      }
    };

    window.addEventListener('message', handleViteHMR);
    return () => window.removeEventListener('message', handleViteHMR);
  }, []);

  return (
    <div className={`stable-navigation ${isNavigating ? 'navigating' : ''}`}>
      {children}
    </div>
  );
};

export default StableNavigation; 