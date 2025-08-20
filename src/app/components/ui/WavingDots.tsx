'use client';

import React from 'react';

interface WavingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function WavingDots({ 
  size = 'md', 
  color = '#6b7280',
  className = '' 
}: WavingDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2 gap-1',
    md: 'w-3 h-3 gap-1.5',
    lg: 'w-4 h-4 gap-2'
  };

  const dotSize = sizeClasses[size];

  return (
    <div className={`waving-dots ${className}`}>
      <span 
        className={`${dotSize} rounded-full`}
        style={{ 
          backgroundColor: color,
          animationDelay: '0s',
          animation: 'wave 1.2s ease-in-out infinite'
        }}
      />
      <span 
        className={`${dotSize} rounded-full`}
        style={{ 
          backgroundColor: color,
          animationDelay: '0.2s',
          animation: 'wave 1.2s ease-in-out infinite'
        }}
      />
      <span 
        className={`${dotSize} rounded-full`}
        style={{ 
          backgroundColor: color,
          animationDelay: '0.4s',
          animation: 'wave 1.2s ease-in-out infinite'
        }}
      />
    </div>
  );
} 