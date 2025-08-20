'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingFormOverlayProps {
  isVisible: boolean;
  text?: string;
  className?: string;
}

const LoadingFormOverlay: React.FC<LoadingFormOverlayProps> = ({ 
  isVisible, 
  text = 'Saving...', 
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center border border-gray-200">
        <LoadingSpinner size="lg" color="blue" />
        <p className="mt-3 text-sm font-medium text-gray-700">{text}</p>
      </div>
    </div>
  );
};

export default LoadingFormOverlay; 