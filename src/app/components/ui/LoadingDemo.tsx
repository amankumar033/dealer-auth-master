'use client';

import React, { useState } from 'react';
import { useToast } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import LoadingButton from './LoadingButton';
import LoadingOverlay from './LoadingOverlay';

const LoadingDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = async () => {
    setButtonLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setButtonLoading(false);
    showSuccess('Button action completed!');
  };

  const handleOverlayToggle = () => {
    setShowOverlay(!showOverlay);
    if (!showOverlay) {
      setTimeout(() => setShowOverlay(false), 3000);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Loading & Toast Demo</h1>
      
      {/* Toast Demonstrations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Toast Notifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingButton
            onClick={() => showSuccess('Success!', 'This is a success message.')}
            variant="success"
          >
            Show Success
          </LoadingButton>
          <LoadingButton
            onClick={() => showError('Error!', 'This is an error message.')}
            variant="danger"
          >
            Show Error
          </LoadingButton>
          <LoadingButton
            onClick={() => showWarning('Warning!', 'This is a warning message.')}
            variant="secondary"
          >
            Show Warning
          </LoadingButton>
          <LoadingButton
            onClick={() => showInfo('Info!', 'This is an info message.')}
            variant="primary"
          >
            Show Info
          </LoadingButton>
        </div>
      </div>

      {/* Loading Spinner Demonstrations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Loading Spinners</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <LoadingSpinner size="sm" text="Small" />
          </div>
          <div className="text-center">
            <LoadingSpinner size="md" text="Medium" />
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" text="Large" />
          </div>
          <div className="text-center">
            <LoadingSpinner size="xl" text="Extra Large" />
          </div>
        </div>
      </div>

      {/* Loading Button Demonstrations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Loading Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingButton
            onClick={handleButtonClick}
            loading={buttonLoading}
            variant="primary"
            loadingText="Processing..."
          >
            Primary Button
          </LoadingButton>
          <LoadingButton
            onClick={handleButtonClick}
            loading={buttonLoading}
            variant="success"
            loadingText="Saving..."
          >
            Success Button
          </LoadingButton>
          <LoadingButton
            onClick={handleButtonClick}
            loading={buttonLoading}
            variant="danger"
            loadingText="Deleting..."
          >
            Danger Button
          </LoadingButton>
          <LoadingButton
            onClick={handleButtonClick}
            loading={buttonLoading}
            variant="secondary"
            loadingText="Loading..."
          >
            Secondary Button
          </LoadingButton>
        </div>
      </div>

      {/* Loading Overlay Demonstration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Loading Overlay</h2>
        <LoadingButton
          onClick={handleOverlayToggle}
          variant="primary"
        >
          {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
        </LoadingButton>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={showOverlay} 
        text="Processing your request..." 
      />
    </div>
  );
};

export default LoadingDemo; 