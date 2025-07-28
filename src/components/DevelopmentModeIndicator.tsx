import React from 'react';
import { Code, AlertCircle } from 'lucide-react';

const DevelopmentModeIndicator: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Development Mode</span>
        </div>
        <div className="mt-2 text-xs text-yellow-700">
          <p>• Hot reload enabled</p>
          <p>• Error boundaries active</p>
          <p>• Debug info available</p>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentModeIndicator; 