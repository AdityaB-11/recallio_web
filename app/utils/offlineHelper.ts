// Utility functions for handling offline operations with Firebase

/**
 * Executes a Firestore operation with offline fallback
 * @param onlineOperation Function to execute when online
 * @param offlineFallback Function to execute when offline (or in case of error)
 * @param isOnline Current online status
 */
export async function withOfflineFallback<T>(
  onlineOperation: () => Promise<T>,
  offlineFallback: () => T | Promise<T>,
  isOnline: boolean
): Promise<T> {
  if (!isOnline) {
    return offlineFallback();
  }
  
  try {
    return await onlineOperation();
  } catch (error: any) {
    console.error('Operation failed, using offline fallback:', error);
    
    // Check if error is network-related
    if (
      error.code === 'unavailable' || 
      error.code === 'failed-precondition' ||
      error.message?.includes('offline') ||
      error.message?.includes('network')
    ) {
      return offlineFallback();
    }
    
    // Rethrow other errors
    throw error;
  }
}

/**
 * Creates a dummy response for when we're offline
 * @param fallbackData Default data to return when offline
 */
export function createOfflineFallback<T>(fallbackData: T) {
  return () => {
    console.log('Using offline fallback data');
    return fallbackData;
  };
}

/**
 * Helper to determine if an error is related to being offline
 * @param error The error to check
 */
export function isOfflineError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.code === 'unavailable' ||
    error.code === 'failed-precondition' ||
    error.message?.includes('offline') ||
    error.message?.includes('network') ||
    error.name === 'FirebaseError' && error.message?.includes('client is offline')
  );
}

// Type for pending operations that need to be synced when back online
export interface PendingOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: number;
}

// Store pending operations in localStorage
export function addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>) {
  try {
    const pendingOperations: PendingOperation[] = JSON.parse(
      localStorage.getItem('pendingOperations') || '[]'
    );
    
    const newOperation: PendingOperation = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      ...operation
    };
    
    pendingOperations.push(newOperation);
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
    
    return newOperation.id;
  } catch (e) {
    console.error('Failed to store pending operation:', e);
    return null;
  }
}

// Get all pending operations
export function getPendingOperations(): PendingOperation[] {
  try {
    return JSON.parse(localStorage.getItem('pendingOperations') || '[]');
  } catch (e) {
    console.error('Failed to retrieve pending operations:', e);
    return [];
  }
}

// Remove a completed operation
export function removePendingOperation(id: string) {
  try {
    const pendingOperations: PendingOperation[] = JSON.parse(
      localStorage.getItem('pendingOperations') || '[]'
    );
    
    const updatedOperations = pendingOperations.filter(op => op.id !== id);
    localStorage.setItem('pendingOperations', JSON.stringify(updatedOperations));
  } catch (e) {
    console.error('Failed to remove pending operation:', e);
  }
} 