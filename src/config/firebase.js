// src/config/firebase.js

/**
 * Firebase configuration and initialization
 * This file sets up and exports Firebase services used throughout the application
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { 
  getAuth, 
  connectAuthEmulator 
} from "firebase/auth";
import { 
  getStorage, 
  connectStorageEmulator 
} from "firebase/storage";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Ensure only one app is initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with improved persistence settings
let db;
try {
  // Use persistent local cache with multi-tab synchronization
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn('Error initializing Firestore with persistence:', error);
  // Fallback to regular initialization if cache config fails
  db = getFirestore(app);
}

// Initialize and export Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export { db };

// Flag to determine if we should use emulators
const shouldUseEmulators = import.meta.env.DEV && 
                          import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
                          navigator.onLine; // Only try to use emulators if online

// Connect to Firebase emulators when in development mode and emulators flag is true
if (shouldUseEmulators) {
  try {
    // Connect to Auth emulator
    const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'http://localhost:9099';
    connectAuthEmulator(auth, authEmulatorHost, { disableWarnings: true });
    console.log('Connected to Firebase Auth Emulator');
    
    // Connect to Firestore emulator if needed
    if (import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST) {
      const [host, portStr] = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST.split(':');
      const port = parseInt(portStr, 10) || 8080;
      connectFirestoreEmulator(db, host, port);
      console.log(`Connected to Firebase Firestore Emulator at ${host}:${port}`);
    }
    
    // Connect to Storage emulator if needed
    if (import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST) {
      const [host, portStr] = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST.split(':');
      const port = parseInt(portStr, 10) || 9199;
      connectStorageEmulator(storage, host, port);
      console.log(`Connected to Firebase Storage Emulator at ${host}:${port}`);
    }
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
    console.warn('Falling back to production Firebase services');
  }
}

// Export information about environment for debugging
export const firebaseInfo = {
  usingEmulators: shouldUseEmulators,
  environment: import.meta.env.MODE,
  projectId: firebaseConfig.projectId
};

export default app;