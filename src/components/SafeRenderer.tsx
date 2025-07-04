import React from "react";

interface SafeRendererProps {
  isLoading: boolean;
  hasError?: boolean;
  dataReady: boolean;
  errorMessage?: string;
  children: React.ReactNode;
}

const SafeRenderer: React.FC<SafeRendererProps> = ({
  isLoading,
  hasError = false,
  dataReady,
  errorMessage = "Something went wrong.",
  children,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-spiritual-700 tracking-spiritual text-lg font-medium">
            Loading your spiritual journey...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-4 tracking-spiritual">
            Something went wrong
          </h2>
          <p className="text-red-600 text-sm tracking-spiritual mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-spiritual transition-colors duration-300 tracking-spiritual"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!dataReady) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spiritual-300 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-spiritual-600 tracking-spiritual text-lg font-medium">
            Preparing your personalized experience...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SafeRenderer;