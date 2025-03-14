/**
 * User Service
 * Handles all operations related to user entities
 */
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    query, where, getDocs, serverTimestamp, limit, 
    orderBy, startAfter, documentId, increment
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
  import { COLLECTIONS, USER_ROLES, USER_STATUS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new user with Firebase Auth and Firestore profile
   * 
   * @param {Object} userData - User data including email and password
   * @returns {Promise<string>} - User ID of created user
   */
  export async function createUser(userData) {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const uid = userCredential.user.uid;
    const timestamp = serverTimestamp();
    
    // Create display name if none provided
    const displayName = userData.displayName || userData.email.split('@')[0];
    
    // Update Auth profile
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    // Prepare user document data
    const userDoc = {
      uid,
      email: userData.email,
      displayName: displayName,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      status: USER_STATUS.ACTIVE,
      role: userData.role || USER_ROLES.USER,
      emailVerified: userCredential.user.emailVerified,
      phoneNumber: userData.phoneNumber || '',
      phoneVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: timestamp,
      version: 1,
      isDeleted: false
    };
    
    // Create Firestore user document
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(userRef, userDoc);
    
    // Record activity
    await BaseService.createDocument(COLLECTIONS.ACTIVITIES, {
      userId: uid,
      type: 'account_created',
      description: 'Account created',
      metadata: {
        userRole: userDoc.role
      }
    });
    
    return uid;
  }
  
  /**
   * Gets a user by ID
   * 
   * @param {string} uid - User ID
   * @param {boolean} includeDeleted - Whether to include soft-deleted users
   * @returns {Promise<Object|null>} - User data or null if not found
   */
  export async function getUserById(uid, includeDeleted = false) {
    return BaseService.getDocument(COLLECTIONS.USERS, uid, includeDeleted);
  }
  
  /**
   * Gets a user by email
   * 
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} - User data or null if not found
   */
  export async function getUserByEmail(email) {
    const q = query(
      collection(db, COLLECTIONS.USERS), 
      where('email', '==', email), 
      where('isDeleted', '==', false),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  /**
   * Updates a user's profile
   * 
   * @param {string} uid - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<string>} - User ID
   */
  export async function updateUser(uid, userData) {
    return BaseService.updateDocument(COLLECTIONS.USERS, uid, userData);
  }
  
  /**
   * Updates a user's role
   * 
   * @param {string} uid - User ID
   * @param {string} role - New role
   * @returns {Promise<string>} - User ID
   */
  export async function updateUserRole(uid, role) {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    await updateDoc(docRef, {
      role,
      updatedAt: timestamp,
      updatedBy: currentUser?.uid || 'system',
      'roleHistory': {
        changedAt: timestamp,
        changedBy: currentUser?.uid || 'system',
        previousRole: (await getDoc(docRef)).data().role,
        newRole: role
      }
    });
    
    // Log as audit event
    await BaseService.createDocument(COLLECTIONS.AUDIT_LOGS, {
      action: 'update_user_role',
      entityType: 'user',
      entityId: uid,
      performedBy: currentUser?.uid || 'system',
      details: { newRole: role }
    });
    
    return uid;
  }
  
  /**
   * Deactivates a user
   * 
   * @param {string} uid - User ID
   * @param {string} reason - Reason for deactivation
   * @returns {Promise<string>} - User ID
   */
  export async function deactivateUser(uid, reason) {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    await updateDoc(docRef, {
      status: USER_STATUS.SUSPENDED,
      suspendedAt: timestamp,
      suspendedBy: currentUser?.uid || 'system',
      suspensionReason: reason,
      updatedAt: timestamp,
      updatedBy: currentUser?.uid || 'system'
    });
    
    // Log as audit event
    await BaseService.createDocument(COLLECTIONS.AUDIT_LOGS, {
      action: 'deactivate_user',
      entityType: 'user',
      entityId: uid,
      performedBy: currentUser?.uid || 'system',
      details: { reason }
    });
    
    return uid;
  }
  
  /**
   * Gets paginated users with optional filters
   * 
   * @param {string|null} role - Filter by role
   * @param {string|null} status - Filter by status
   * @param {string|null} searchTerm - Search term for email or name
   * @param {number} pageSize - Results per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getUsers(role = null, status = null, searchTerm = null, pageSize = 10, lastVisible = null) {
    const usersRef = collection(db, COLLECTIONS.USERS);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add role filter if provided
    if (role) {
      constraints.push(where('role', '==', role));
    }
    
    // Add status filter if provided
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add starting point for pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.USERS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    // Add limit
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(usersRef, ...constraints);
    const snapshot = await getDocs(q);
    
    // Filter by search term if provided (since Firestore can't query this way)
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(term) || 
        user.displayName?.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term)
      );
    }
    
    return {
      users,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Gets total user count
   * 
   * @param {string|null} role - Filter by role
   * @param {string|null} status - Filter by status
   * @returns {Promise<number>} - User count
   */
  export async function getUserCount(role = null, status = null) {
    const usersRef = collection(db, COLLECTIONS.USERS);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add role filter if provided
    if (role) {
      constraints.push(where('role', '==', role));
    }
    
    // Add status filter if provided
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    // Execute query
    const q = query(usersRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  }