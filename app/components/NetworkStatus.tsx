'use client';

import { useAuth } from '../context/AuthContext';
import { getPendingOperations } from '../utils/offlineHelper';
import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const { isOnline } = useAuth();
  const [pendingOps, setPendingOps] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const updatePendingOps = () => {
      setPendingOps(getPendingOperations());
    };
    
    // Update on mount and whenever network status changes
    updatePendingOps();
    
    // Set interval to check for pending operations
    const interval = setInterval(updatePendingOps, 5000);
    
    return () => clearInterval(interval);
  }, [isOnline]);
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed top-2 right-2 z-50">
      <div 
        className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer ${
          isOnline 
            ? 'bg-green-900/50 text-green-300 border border-green-800/50' 
            : 'bg-yellow-900/50 text-yellow-300 border border-yellow-800/50'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isOnline ? 'ONLINE' : 'OFFLINE'} 
        {pendingOps.length > 0 && ` (${pendingOps.length})`}
      </div>
      
      {showDetails && pendingOps.length > 0 && (
        <div className="mt-2 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs font-mono text-white max-w-md max-h-80 overflow-auto backdrop-blur-sm">
          <div className="mb-2 pb-1 border-b border-slate-700 font-medium">
            Pending Operations: {pendingOps.length}
          </div>
          {pendingOps.map(op => (
            <div key={op.id} className="mb-2 border-l-2 border-indigo-500 pl-2">
              <div>ID: {op.id.substring(0, 6)}...</div>
              <div>Type: {op.operation}</div>
              <div>Collection: {op.collection}</div>
              {op.documentId && <div>DocID: {op.documentId.substring(0, 6)}...</div>}
              <div>Time: {new Date(op.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 