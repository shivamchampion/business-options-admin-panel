/**
 * Firebase configuration and initialization
 * This file sets up and exports Firebase services used throughout the application
 */
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline data persistence when possible
try {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser doesn\'t support offline persistence');
      }
    });
} catch (error) {
  console.warn('Error enabling offline persistence:', error);
}

// Connect to Firebase emulators when in development mode
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'http://localhost:9099';
  connectAuthEmulator(auth, authEmulatorHost);
  console.log('Connected to Firebase Auth Emulator');
}

export default app;