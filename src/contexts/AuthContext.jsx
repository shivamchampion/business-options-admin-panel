/**
 * Authentication Context
 * Manages user authentication state and related functions
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS, USER_ROLES, USER_STATUS } from '../config/constants';

// Create the context
const AuthContext = createContext();

/**
 * Hook for using the authentication context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Authentication Provider Component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserDetails(userDocSnap.data());
          } else {
            // Create a basic user document if it doesn't exist
            // This can happen if user was created through Auth but Firestore doc wasn't created
            const userDoc = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              status: USER_STATUS.ACTIVE,
              role: USER_ROLES.USER,
              emailVerified: user.emailVerified,
              phoneNumber: user.phoneNumber || '',
              phoneVerified: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              version: 1,
              isDeleted: false
            };
            
            await setDoc(userDocRef, userDoc);
            setUserDetails(userDoc);
          }
          
          // Update last login timestamp
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp()
          });
        } catch (err) {
          console.error("Error fetching user details:", err);
          setError(err.message);
        }
      } else {
        setUserDetails(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Logs in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<UserCredential>} Firebase user credential
   */
  const login = async (email, password) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Registers a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise<UserCredential>} Firebase user credential
   */
  const register = async (email, password, displayName) => {
    setError(null);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName || email.split('@')[0]
      });
      
      // Create user document in Firestore
      const userDoc = {
        uid: userCredential.user.uid,
        email,
        displayName: displayName || email.split('@')[0],
        status: USER_STATUS.ACTIVE,
        role: USER_ROLES.USER,
        emailVerified: userCredential.user.emailVerified,
        phoneNumber: '',
        phoneVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        version: 1,
        isDeleted: false
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), userDoc);
      
      return userCredential;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logs the user out
   * @returns {Promise<void>}
   */
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Sends a password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Updates the user's email
   * @param {string} newEmail - New email address
   * @returns {Promise<void>}
   */
  const updateUserEmail = async (newEmail) => {
    setError(null);
    if (!currentUser) {
      throw new Error('No user is logged in');
    }
    
    try {
      await updateEmail(currentUser, newEmail);
      
      // Update Firestore document
      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userDocRef, {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Updates the user's password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  const updateUserPassword = async (newPassword) => {
    setError(null);
    if (!currentUser) {
      throw new Error('No user is logged in');
    }
    
    try {
      await updatePassword(currentUser, newPassword);
      
      // Update security info in Firestore
      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userDocRef, {
        'security.lastPasswordChange': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Updates the user's profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<void>}
   */
  const updateUserProfile = async (profileData) => {
    setError(null);
    if (!currentUser) {
      throw new Error('No user is logged in');
    }
    
    try {
      // Update displayName in Auth if provided
      if (profileData.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName
        });
      }
      
      // Update Firestore document
      const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      
      // Update local userDetails state
      setUserDetails(prevDetails => ({
        ...prevDetails,
        ...profileData
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return userDetails?.role === role;
  };

  // Check if user is an admin
  const isAdmin = () => {
    return userDetails?.role === USER_ROLES.ADMIN || userDetails?.role === USER_ROLES.MODERATOR;
  };

  // Context value
  const value = {
    currentUser,
    userDetails,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    updateUserProfile,
    hasRole,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}