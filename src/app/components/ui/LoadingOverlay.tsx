'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  backdrop?: boolean;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  text = 'Loading...', 
  backdrop = true,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdrop ? 'bg-black bg-opacity-50 backdrop-blur-sm' : 'bg-white bg-opacity-90'} ${className}`}>
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
        <LoadingSpinner size="xl" color="blue" />
        <p className="mt-4 text-lg font-medium text-gray-700">{text}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 