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
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed, user:", user ? `${user.email} (${user.uid})` : "No user");
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get additional user data from Firestore with force refresh
          console.log(`Fetching Firestore user document for UID: ${user.uid}`);
          const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
          const userDocSnap = await getDoc(userDocRef, { source: 'server' }); // Force server refresh
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("Firestore user data:", userData);
            
            // Make sure we're comparing lowercase strings to avoid case sensitivity issues
            userData.role = userData.role ? userData.role.toLowerCase() : '';
            
            setUserDetails(userData);
            
            // Check if the special admin account needs a role update
            if (user.email === 'admin@businessoptions.in' && user.uid === 'ZmzFLxbtzGNYnDI1IJsTMDxva3y2') {
              if (userData.role !== USER_ROLES.ADMIN.toLowerCase()) {
                console.log("Updating admin role for admin@businessoptions.in");
                await updateDoc(userDocRef, {
                  role: USER_ROLES.ADMIN.toLowerCase(),
                  updatedAt: serverTimestamp()
                });
                // Update local state to reflect the change
                setUserDetails({
                  ...userData,
                  role: USER_ROLES.ADMIN.toLowerCase()
                });
              }
            }
            
            // Update last login timestamp
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            });
          } else {
            console.log("User document doesn't exist in Firestore, creating new document");
            // Create a basic user document if it doesn't exist
            const userDoc = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              status: USER_STATUS.ACTIVE,
              role: user.email === 'admin@businessoptions.in' ? 
                USER_ROLES.ADMIN.toLowerCase() : 
                USER_ROLES.USER.toLowerCase(),
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
        } catch (err) {
          console.error("Error fetching user details:", err);
          setError(err.message);
        }
      } else {
        console.log("No user signed in, clearing userDetails");
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
    console.log("Login attempt for email:", email);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase authentication successful:", result);
      return result;
    } catch (err) {
      console.error("Firebase authentication error:", err);
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
    console.log("Register attempt for email:", email);
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
        role: email === 'admin@businessoptions.in' ? 
          USER_ROLES.ADMIN.toLowerCase() : 
          USER_ROLES.USER.toLowerCase(),
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
      console.error("Registration error:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logs the user out
   * @returns {Promise<void>}
   */
  const logout = async () => {
    console.log("Logout attempt");
    setError(null);
    try {
      await signOut(auth);
      console.log("Logout successful");
      // Force clear user state
      setCurrentUser(null);
      setUserDetails(null);
    } catch (err) {
      console.error("Logout error:", err);
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
    console.log("Password reset attempt for email:", email);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");
    } catch (err) {
      console.error("Password reset error:", err);
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
    console.log("Update email attempt to:", newEmail);
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
      console.log("Email updated successfully");
    } catch (err) {
      console.error("Update email error:", err);
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
    console.log("Update password attempt");
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
      console.log("Password updated successfully");
    } catch (err) {
      console.error("Update password error:", err);
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
    console.log("Update profile attempt with data:", profileData);
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
      console.log("Profile updated successfully");
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Check if user has a specific role (case-insensitive)
   * @param {string} role - Role to check
   * @returns {boolean} - Whether user has the role
   */
  const hasRole = (role) => {
    if (!userDetails || !userDetails.role) return false;
    
    // Case-insensitive comparison
    const userRole = userDetails.role.toLowerCase();
    const checkRole = role.toLowerCase();
    
    return userRole === checkRole;
  };

  /**
   * Check if user is an admin
   * @returns {boolean} - Whether user is an admin
   */
  const isAdmin = () => {
    if (!userDetails || !userDetails.role) return false;
    
    // Case-insensitive comparison
    const userRole = userDetails.role.toLowerCase();
    const adminRole = USER_ROLES.ADMIN.toLowerCase();
    const moderatorRole = USER_ROLES.MODERATOR.toLowerCase();
    
    // Special case for the known admin
    if (currentUser?.email === 'admin@businessoptions.in' && 
        currentUser?.uid === 'ZmzFLxbtzGNYnDI1IJsTMDxva3y2') {
      return true;
    }
    
    return userRole === adminRole || userRole === moderatorRole;
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