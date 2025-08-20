'use client';

import React, { useState, useEffect } from 'react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  isVisible: boolean;
  onExit?: () => void;
  enterClass?: string;
  exitClass?: string;
  duration?: number;
  className?: string;
}

export default function TransitionWrapper({
  children,
  isVisible,
  onExit,
  enterClass = 'form-scale-enter',
  exitClass = 'form-scale-exit',
  duration = 300,
  className = ''
}: TransitionWrapperProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);
      // Remove enter animation class after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        onExit?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onExit]);

  if (!shouldRender) return null;

  const animationClass = isVisible ? enterClass : exitClass;

  return (
    <div className={`${animationClass} ${className}`}>
      {children}
    </div>
  );
} 