'use client';

import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-blue-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-start p-4 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-in-out relative overflow-hidden";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isLeaving ? 'translate-x-full opacity-0' : ''}`;
      case 'error':
        return `${baseStyles} bg-red-50 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isLeaving ? 'translate-x-full opacity-0' : ''}`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isLeaving ? 'translate-x-full opacity-0' : ''}`;
      case 'info':
        return `${baseStyles} bg-blue-50 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isLeaving ? 'translate-x-full opacity-0' : ''}`;
      default:
        return `${baseStyles} bg-gray-50 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${isLeaving ? 'translate-x-full opacity-0' : ''}`;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  const getLeftBarColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'info':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={getStyles()}>
      {/* Left vertical color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getLeftBarColor()}`}></div>
      
      <div className="flex-shrink-0 ml-4">
        {getIcon()}
      </div>
      <div className="ml-3 flex-1">
        <p className={`text-sm font-medium ${getTextColor()}`}>{title}</p>
        {message && (
          <p className={`text-sm ${getTextColor()} opacity-80 mt-1`}>{message}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className={`inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors`}
        >
          <span className="sr-only">Close</span>
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 