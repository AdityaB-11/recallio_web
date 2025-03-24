// Import the Firebase SDK
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    console.error(`Missing required Firebase configuration: ${missingKeys.join(', ')}`);
    console.error('Please ensure you have a .env.local file with the correct Firebase configuration.');
    return false;
  }
  
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'your-firebase-api-key') {
    console.error('Firebase API key is still set to the placeholder value. Please update with your actual Firebase API key.');
    return false;
  }
  
  return true;
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if configuration is valid
let app, auth, db;

try {
  // Only initialize if configuration is valid
  if (validateFirebaseConfig()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Configure Firestore for better offline support
    // Connect to emulators in development environment
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      if (typeof window !== 'undefined' && !window.firestoreEmulatorConnected) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        window.firestoreEmulatorConnected = true;
        console.log('Connected to Firebase emulators');
      }
    }
  } else {
    // Create mock Firebase instances to prevent runtime errors
    console.warn('Using mock Firebase instances due to invalid configuration.');
    // These mock objects will prevent runtime errors but won't actually work
    app = {} as any;
    auth = {
      currentUser: null,
      onAuthStateChanged: (callback) => {
        callback(null);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not properly configured')),
      createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not properly configured')),
      signOut: () => Promise.resolve()
    } as any;
    db = {} as any;
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create mock instances to prevent runtime errors
  app = {} as any;
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  } as any;
  db = {} as any;
}

export { app, auth, db }; 