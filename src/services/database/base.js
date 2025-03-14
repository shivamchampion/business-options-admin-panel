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
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    
    // Filter deleted documents unless explicitly requested
    if (data.isDeleted && !includeDeleted) return null;
    
    return { id: docSnap.id, ...data };
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
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Document ${id} not found in ${collectionName}`);
    }
    
    const currentData = docSnap.data();
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
    const docRef = doc(db, collectionName, id);
    const timestamp = serverTimestamp();
    const currentUser = auth.currentUser;
    
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: timestamp,
      deletedBy: currentUser?.uid || 'system',
      deletionReason: reason
    });
    
    return id;
  }
  
  /**
   * Permanently deletes a document (use with caution)
   * 
   * @param {string} collectionName - Name of the collection
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  export async function permanentlyDeleteDocument(collectionName, id) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
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
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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