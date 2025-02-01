import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  subMessage = "Please wait a moment",
}) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Spinner */}
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        {/* Loading Text */}
        <p className="text-lg text-gray-700 font-semibold">{message}</p>
        {/* Subtle Animation */}
        <p className="text-sm text-gray-500 animate-pulse">{subMessage}</p>
      </div>
    </div>
  );
};
