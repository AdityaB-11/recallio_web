'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { enableNetwork, disableNetwork, enableIndexedDbPersistence } from 'firebase/firestore';
import { getPendingOperations, removePendingOperation, isOfflineError, addPendingOperation } from '../utils/offlineHelper';

interface UserData {
  isPremium: boolean;
  premiumExpiry?: string;
  promoApplied?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isOnline: boolean;
  isPremium: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: (promoCode?: string) => Promise<void>;
  checkPremiumStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Check if user is premium
  const isPremium = userData?.isPremium || false;

  // Setup online/offline detection
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize online status from navigator if available
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db)
        .then(() => {
          console.log('Firebase network connection restored');
          // Process any pending operations when back online
          processPendingOperations();
        })
        .catch(console.error);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db).catch(console.error);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Enable offline persistence only in browser environment
    try {
      enableIndexedDbPersistence(db)
        .then(() => console.log('Offline persistence enabled'))
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
          }
        });
    } catch (error) {
      console.error('Error enabling persistence:', error);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process pending operations when back online
  const processPendingOperations = async () => {
    if (!user) return;
    
    try {
      const pendingOps = getPendingOperations();
      console.log(`Processing ${pendingOps.length} pending operations`);
      
      for (const op of pendingOps) {
        try {
          // Process based on operation type
          if (op.operation === 'create') {
            const collectionRef = collection(db, op.collection);
            await addDoc(collectionRef, { ...op.data, userId: user.uid });
          } else if (op.operation === 'update' && op.documentId) {
            const docRef = doc(db, op.collection, op.documentId);
            await updateDoc(docRef, op.data);
          } else if (op.operation === 'delete' && op.documentId) {
            const docRef = doc(db, op.collection, op.documentId);
            await deleteDoc(docRef);
          }
          
          // Remove from pending operations after successful processing
          removePendingOperation(op.id);
        } catch (err) {
          console.error(`Failed to process operation ${op.id}:`, err);
          // Only remove if it's not an offline error
          if (!isOfflineError(err)) {
            removePendingOperation(op.id);
          }
        }
      }
    } catch (err) {
      console.error('Error processing pending operations:', err);
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (userId: string) => {
    try {
      if (!isOnline) {
        // Return cached data if available or default values
        return userData || { isPremium: false };
      }
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        return data;
      } else {
        // If document doesn't exist, create a new one with default values
        const defaultData: UserData = { isPremium: false };
        if (isOnline) {
          await setDoc(userDocRef, defaultData);
        }
        setUserData(defaultData);
        return defaultData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return cached data if available or default values
      return userData || { isPremium: false };
    }
  };

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserData(currentUser.uid);
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('Firebase auth initialization error:', error);
      setFirebaseError(error.message || 'Failed to initialize Firebase authentication');
      setLoading(false);
      return () => {};
    }
  }, [isOnline]);

  const signup = async (email: string, password: string) => {
    if (!isOnline) {
      throw new Error('Cannot sign up while offline. Please check your internet connection and try again.');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const defaultData: UserData = { isPremium: false };
      await setDoc(doc(db, 'users', userCredential.user.uid), defaultData);
      setUserData(defaultData);
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase configuration error. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const login = async (email: string, password: string) => {
    if (!isOnline) {
      throw new Error('Cannot log in while offline. Please check your internet connection and try again.');
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase configuration error. Please contact support or check the Firebase API key.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Handle offline logout
      if (!isOnline) {
        setUser(null);
        setUserData(null);
      }
    }
  };

  // Upgrade user to premium
  const upgradeToPremium = async (promoCode?: string) => {
    if (!user) return;
    
    // Check if the promo code matches the environment variable
    const validPromoCode = process.env.NEXT_PUBLIC_PREMIUM_PROMO_CODE;
    const isValidPromo = validPromoCode && promoCode === validPromoCode;
    
    // Only allow premium upgrade with a valid promo code
    if (!isValidPromo && promoCode) {
      throw new Error('Invalid promo code');
    }
    
    // Set expiry date for one year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    const premiumData: UserData = {
      isPremium: true,
      premiumExpiry: expiry.toISOString(),
      promoApplied: promoCode || null
    };
    
    // Update local state immediately for better user experience
    setUserData(prevData => ({ ...prevData, ...premiumData }));
    
    // If offline, queue the operation for later and return success
    if (!isOnline) {
      console.log('Offline detected, queueing premium upgrade for later');
      addPendingOperation({
        operation: 'update',
        collection: 'users',
        documentId: user.uid,
        data: premiumData
      });
      return;
    }
    
    // If online, try to update Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, premiumData);
      console.log('Premium status updated in Firestore');
    } catch (error: any) {
      console.error('Error upgrading to premium:', error);
      
      // If it's an offline error, queue the operation for later
      if (isOfflineError(error)) {
        console.log('Network error detected, queueing premium upgrade for later');
        addPendingOperation({
          operation: 'update',
          collection: 'users',
          documentId: user.uid,
          data: premiumData
        });
        // Don't revert UI state or throw error, as we've queued it for later
        return;
      }
      
      // For other errors, revert the local state change and throw
      setUserData(prevData => ({ ...prevData, isPremium: false, premiumExpiry: undefined, promoApplied: undefined }));
      throw error;
    }
  };

  // Check if user's premium status is valid
  const checkPremiumStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // If offline, use cached data
      if (!isOnline) {
        return isPremium;
      }
      
      const freshData = await fetchUserData(user.uid);
      
      if (!freshData?.isPremium) return false;
      
      // Check if premium has expired
      if (freshData.premiumExpiry) {
        const expiryDate = new Date(freshData.premiumExpiry);
        if (expiryDate < new Date()) {
          // Premium has expired, update status if online
          if (isOnline) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { isPremium: false });
          }
          setUserData(prevData => ({ ...prevData, isPremium: false }));
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking premium status:', error);
      // If there's an error, fall back to cached status
      return isPremium;
    }
  };

  const value = {
    user,
    userData,
    loading,
    isOnline,
    isPremium,
    signup,
    login,
    logout,
    upgradeToPremium,
    checkPremiumStatus
  };

  // If there's a Firebase initialization error, display a message
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-lg shadow-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Firebase Configuration Error</h2>
          <p className="text-gray-300 mb-4">
            There was an error initializing the application. Please ensure Firebase is properly configured.
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Error details: {firebaseError}
          </p>
          <div className="bg-slate-700 p-4 rounded text-left text-gray-300 text-sm mb-4">
            <p className="font-medium mb-2">Troubleshooting steps:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Ensure your .env.local file contains valid Firebase credentials</li>
              <li>Check that you're using a valid Firebase API key</li>
              <li>Verify that your Firebase project is properly set up and enabled</li>
              <li>Try refreshing the page</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 