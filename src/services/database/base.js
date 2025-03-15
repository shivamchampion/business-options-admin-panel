// src/services/database/base.js

/**
 * Base Database Service
 * Provides generic CRUD operations for Firestore collections
 */
import { 
  collection, doc, setDoc, addDoc, getDoc, 
  updateDoc, deleteDoc, query, where, orderBy, 
  limit, getDocs, serverTimestamp, arrayUnion 
} from "firebase/firestore";
import { auth, db } from '../../config/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new document in the specified collection
 * 
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @param {string|null} id - Optional document ID
 * @returns {Promise<Object>} - Created document with ID
 */
export async function createDocument(collectionName, data, id = null) {
  try {
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    const documentData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: currentUser?.uid || 'system',
      version: 1,
      isDeleted: false
    };
    
    let docRef;
    
    if (id) {
      docRef = doc(db, collectionName, id);
      await setDoc(docRef, documentData);
    } else {
      const collectionRef = collection(db, collectionName);
      docRef = await addDoc(collectionRef, documentData);
    }
    
    return { id: docRef.id, ...documentData };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Operation failed while offline");
    }
    throw error;
  }
}

/**
 * Retrieves a document by ID
 * 
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {boolean} includeDeleted - Whether to include soft-deleted documents
 * @returns {Promise<Object|null>} - Document data or null if not found
 */
export async function getDocument(collectionName, id, includeDeleted = false) {
  try {
    const docRef = doc(db, collectionName, id);
    const options = {};
    
    // Try to get from server first, then fall back to cache
    let docSnap;
    try {
      docSnap = await getDoc(docRef, { source: 'server' });
    } catch (serverError) {
      console.warn(`Couldn't fetch ${collectionName}/${id} from server:`, serverError);
      // Fall back to cache
      docSnap = await getDoc(docRef);
    }
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    
    // Filter deleted documents unless explicitly requested
    if (data.isDeleted && !includeDeleted) return null;
    
    return { id: docSnap.id, ...data };
  } catch (error) {
    console.error(`Error getting document ${id} from ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Operation attempted while offline, using cached data if available");
    }
    throw error;
  }
}

/**
 * Updates an existing document
 * 
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {Object} data - Data to update
 * @param {boolean} trackVersion - Whether to track version history
 * @returns {Promise<Object>} - Updated document
 */
export async function updateDocument(collectionName, id, data, trackVersion = true) {
  try {
    const docRef = doc(db, collectionName, id);
    let currentData;
    
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`Document ${id} not found in ${collectionName}`);
      }
      currentData = docSnap.data();
    } catch (error) {
      console.error(`Error getting document ${id} for update:`, error);
      // If we're offline, proceed with update anyway
      if (!navigator.onLine) {
        currentData = { version: 0 };
        console.warn("Proceeding with update while offline - version tracking may be inaccurate");
      } else {
        throw error;
      }
    }
    
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    let updateData = {
      ...data,
      updatedAt: timestamp,
      updatedBy: currentUser?.uid || 'system'
    };
    
    // Handle version tracking
    if (trackVersion) {
      const currentVersion = currentData.version || 1;
      const changedFields = Object.keys(data);
      
      updateData = {
        ...updateData,
        version: currentVersion + 1,
        versionHistory: arrayUnion({
          version: currentVersion + 1,
          changes: changedFields,
          changedBy: currentUser?.uid || 'system',
          changedAt: timestamp
        })
      };
    }
    
    await updateDoc(docRef, updateData);
    
    return { id, ...updateData };
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Update operation failed while offline");
    }
    throw error;
  }
}

/**
 * Soft-deletes a document
 * 
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {string|null} reason - Optional reason for deletion
 * @returns {Promise<string>} - Document ID
 */
export async function deleteDocument(collectionName, id, reason = null) {
  try {
    const docRef = doc(db, collectionName, id);
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: timestamp,
      deletedBy: currentUser?.uid || 'system',
      deletionReason: reason
    });
    // src/services/database/base.js (continued)
      
    return id;
  } catch (error) {
    console.error(`Error soft-deleting document ${id} from ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Delete operation failed while offline");
    }
    throw error;
  }
}

/**
 * Permanently deletes a document (use with caution)
 * 
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteDocument(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error permanently deleting document ${id} from ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Permanent delete operation failed while offline");
    }
    throw error;
  }
}

/**
 * Queries documents with filters, ordering, and pagination
 * 
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of conditions [field, operator, value]
 * @param {string|null} orderByField - Field to order by
 * @param {string} orderDirection - Direction to order ('asc' or 'desc')
 * @param {number|null} limitCount - Maximum number of documents to return
 * @param {boolean} includeDeleted - Whether to include soft-deleted documents
 * @returns {Promise<Array>} - Array of documents
 */
export async function queryDocuments(
  collectionName, 
  conditions = [], 
  orderByField = null, 
  orderDirection = 'asc', 
  limitCount = null,
  includeDeleted = false
) {
  try {
    const collectionRef = collection(db, collectionName);
    
    let queryConstraints = [];
    
    // Add conditions
    conditions.forEach(([field, operator, value]) => {
      if (field && operator && value !== undefined) {
        queryConstraints.push(where(field, operator, value));
      }
    });
    
    // Add deleted filter
    if (!includeDeleted) {
      queryConstraints.push(where('isDeleted', '==', false));
    }
    
    // Add ordering
    if (orderByField) {
      queryConstraints.push(orderBy(orderByField, orderDirection));
    }
    
    // Add limit
    if (limitCount) {
      queryConstraints.push(limit(limitCount));
    }
    
    // Create and execute query
    const q = query(collectionRef, ...queryConstraints);
    let snapshot;
    
    try {
      // Try to get from server first
      snapshot = await getDocs(q, { source: 'server' });
    } catch (serverError) {
      console.warn(`Couldn't fetch ${collectionName} from server:`, serverError);
      // Fall back to cache
      snapshot = await getDocs(q);
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    if (!navigator.onLine) {
      console.warn("Query operation attempted while offline, may be using cached data");
    }
    
    // Return empty array on error rather than failing completely
    return [];
  }
}

/**
 * Generates a UUID for new document IDs
 * 
 * @returns {string} - UUID v4
 */
export function generateUUID() {
  return uuidv4();
}

/**
 * Creates a monetary value object with consistent structure
 * 
 * @param {number} value - Monetary value
 * @param {string} currency - Currency code (default: INR)
 * @returns {Object} - Structured monetary value object
 */
export function createMonetaryValue(value, currency = 'INR') {
  let formatted = '';
  
  if (currency === 'INR') {
    formatted = `₹${value.toLocaleString('en-IN')}`;
  } else {
    formatted = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(value);
  }
  
  return {
    value,
    currency,
    formatted
  };
}