'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WifiIcon } from '@heroicons/react/24/outline';

export default function OfflineIndicator() {
  const { isOnline } = useAuth();
  const [visible, setVisible] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  
  // Only show the indicator after the initial mount
  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
      return;
    }
    
    if (!isOnline) {
      setVisible(true);
    } else {
      // When coming back online, wait a bit before hiding
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, firstLoad]);
  
  // Don't show anything on first render or when online
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center bg-yellow-900/90 text-yellow-300 px-3 py-2 rounded-lg shadow-lg border border-yellow-800 animate-fadeIn">
      <WifiIcon className="h-5 w-5 mr-2" />
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
} 