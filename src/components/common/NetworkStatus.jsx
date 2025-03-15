// src/components/common/NetworkStatus.jsx

import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      // Hide the alert after 5 seconds
      setTimeout(() => setShowAlert(false), 5000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showAlert) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {isOnline ? (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Connected</AlertTitle>
          <AlertDescription className="text-green-600">
            Your connection has been restored.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Connection Lost</AlertTitle>
          <AlertDescription className="text-yellow-600">
            You are currently offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NetworkStatus;