// admin-setup.js
import { config } from 'dotenv';
config(); // Load environment variables from .env file if you use them

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Use your project's existing Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection name constant
const USERS_COLLECTION = 'users';

async function setupAdminUser() {
  const adminUid = 'ZmzFLxbtzGNYnDI1IJsTMDxva3y2';
  const userRef = doc(db, USERS_COLLECTION, adminUid);
  
  try {
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    const timestamp = serverTimestamp();
    
    // Admin user data 
    const adminData = {
      uid: adminUid,
      email: 'admin@businessoptions.in',
      displayName: 'Administrator',
      status: 'active',
      role: 'admin', // Lowercase to match your app's role checking
      emailVerified: true,
      phoneNumber: '',
      phoneVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: timestamp,
      version: 1,
      isDeleted: false,
      // Add standard fields that are in your user schema
      permissions: ['all'],
      profileImage: {
        url: '',
        path: ''
      },
      currentPlan: {
        status: 'active'
      },
      connectsBalance: 0
    };
    
    if (!userDoc.exists()) {
      console.log('Admin user document does not exist. Creating new document...');
      await setDoc(userRef, adminData);
      console.log('Admin user document created successfully!');
    } else {
      console.log('Admin user document exists. Updating document...');
      await setDoc(userRef, adminData, { merge: true });
      console.log('Admin user document updated successfully!');
    }
    
    // Verify the document was created/updated correctly
    const updatedDoc = await getDoc(userRef);
    console.log('Admin user document:', updatedDoc.data());
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

setupAdminUser()
  .then(() => {
    console.log('Admin setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Admin setup failed:', error);
    process.exit(1);
  });