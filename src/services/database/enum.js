/**
 * Enum Service
 * Handles operations related to system-wide enumerated values
 */
import { 
    collection, doc, getDoc, getDocs, setDoc, 
    query, where, serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Gets an enum by ID
   * 
   * @param {string} id - Enum ID (type name)
   * @returns {Promise<Object|null>} - Enum data or null if not found
   */
  export async function getEnum(id) {
    return BaseService.getDocument(COLLECTIONS.ENUMS, id);
  }
  
  /**
   * Creates or updates an enum
   * 
   * @param {string} id - Enum ID (type name)
   * @param {Array} values - Enum values
   * @param {string} description - Enum description
   * @param {boolean} isSystem - Whether this is a system enum
   * @returns {Promise<string>} - Enum ID
   */
  export async function setEnum(id, values, description = '', isSystem = false) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to update enums');
    }
    
    const timestamp = serverTimestamp();
    
    const enumData = {
      id,
      values,
      description,
      isSystem,
      updatedAt: timestamp,
      updatedBy: currentUser.uid
    };
    
    // Check if enum exists
    const enumDoc = await getEnum(id);
    
    if (!enumDoc) {
      // Create new enum
      enumData.createdAt = timestamp;
      enumData.createdBy = currentUser.uid;
    } else if (enumDoc.isSystem && !isSystem) {
      // Prevent updating system enums
      throw new Error('Cannot modify system enum');
    }
    
    const docRef = doc(db, COLLECTIONS.ENUMS, id);
    await setDoc(docRef, enumData, { merge: true });
    
    return id;
  }
  
  /**
   * Gets all enums
   * 
   * @param {boolean} includeSystem - Whether to include system enums
   * @returns {Promise<Array>} - Array of enums
   */
  export async function getAllEnums(includeSystem = true) {
    const enumsRef = collection(db, COLLECTIONS.ENUMS);
    
    let constraints = [];
    
    if (!includeSystem) {
      constraints.push(where('isSystem', '==', false));
    }
    
    const q = query(enumsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets enum values by ID
   * 
   * @param {string} id - Enum ID (type name)
   * @returns {Promise<Array>} - Array of enum values or empty array if not found
   */
  export async function getEnumValues(id) {
    const enumDoc = await getEnum(id);
    return enumDoc?.values || [];
  }
  
  /**
   * Adds a value to an enum
   * 
   * @param {string} id - Enum ID (type name)
   * @param {Object} value - Value to add
   * @returns {Promise<string>} - Enum ID
   */
  export async function addEnumValue(id, value) {
    const enumDoc = await getEnum(id);
    
    if (!enumDoc) {
      throw new Error('Enum not found');
    }
    
    if (enumDoc.isSystem) {
      throw new Error('Cannot modify system enum');
    }
    
    // Check if value with same key already exists
    const existingValue = enumDoc.values.find(v => v.key === value.key);
    if (existingValue) {
      throw new Error(`Value with key "${value.key}" already exists`);
    }
    
    // Add new value
    const values = [...enumDoc.values, value];
    
    return setEnum(id, values, enumDoc.description, enumDoc.isSystem);
  }
  
  /**
   * Updates a value in an enum
   * 
   * @param {string} id - Enum ID (type name)
   * @param {string} key - Value key to update
   * @param {Object} value - Updated value
   * @returns {Promise<string>} - Enum ID
   */
  export async function updateEnumValue(id, key, value) {
    const enumDoc = await getEnum(id);
    
    if (!enumDoc) {
      throw new Error('Enum not found');
    }
    
    if (enumDoc.isSystem) {
      throw new Error('Cannot modify system enum');
    }
    
    // Find value index
    const index = enumDoc.values.findIndex(v => v.key === key);
    if (index === -1) {
      throw new Error(`Value with key "${key}" not found`);
    }
    
    // Update value
    const values = [...enumDoc.values];
    values[index] = { ...values[index], ...value };
    
    return setEnum(id, values, enumDoc.description, enumDoc.isSystem);
  }
  
  /**
   * Removes a value from an enum
   * 
   * @param {string} id - Enum ID (type name)
   * @param {string} key - Value key to remove
   * @returns {Promise<string>} - Enum ID
   */
  export async function removeEnumValue(id, key) {
    const enumDoc = await getEnum(id);
    
    if (!enumDoc) {
      throw new Error('Enum not found');
    }
    
    if (enumDoc.isSystem) {
      throw new Error('Cannot modify system enum');
    }
    
    // Remove value
    const values = enumDoc.values.filter(v => v.key !== key);
    
    return setEnum(id, values, enumDoc.description, enumDoc.isSystem);
  }
  
  /**
   * Gets display name for an enum value
   * 
   * @param {string} enumId - Enum ID (type name)
   * @param {string} key - Value key
   * @returns {Promise<string|null>} - Display name or null if not found
   */
  export async function getEnumDisplayName(enumId, key) {
    const values = await getEnumValues(enumId);
    const value = values.find(v => v.key === key);
    return value ? value.displayName : null;
  }
  
  /**
   * Initializes system enums
   * 
   * @returns {Promise<void>}
   */
  export async function initializeSystemEnums() {
    // This function would be called on application startup
    // to ensure all system enums are properly initialized
    
    // Example: Initialize user roles enum
    await setEnum('USER_ROLES', [
      { key: 'admin', displayName: 'Admin', description: 'System administrator', order: 1, isDefault: false },
      { key: 'moderator', displayName: 'Moderator', description: 'Content moderator', order: 2, isDefault: false },
      { key: 'business_owner', displayName: 'Business Owner', description: 'Business owner', order: 3, isDefault: false },
      { key: 'user', displayName: 'User', description: 'Standard user', order: 4, isDefault: true }
    ], 'User roles', true);
    
    // Example: Initialize listing types enum
    await setEnum('LISTING_TYPES', [
      { key: 'business', displayName: 'Business', description: 'Business for sale', order: 1, isDefault: true },
      { key: 'franchise', displayName: 'Franchise', description: 'Franchise opportunity', order: 2, isDefault: false },
      { key: 'startup', displayName: 'Startup', description: 'Startup seeking investment', order: 3, isDefault: false },
      { key: 'investor', displayName: 'Investor', description: 'Investor seeking opportunities', order: 4, isDefault: false },
      { key: 'digital_asset', displayName: 'Digital Asset', description: 'Digital asset for sale', order: 5, isDefault: false }
    ], 'Listing types', true);
    
    // Example: Initialize listing statuses enum
    await setEnum('LISTING_STATUS', [
      { key: 'draft', displayName: 'Draft', description: 'In-progress by owner', order: 1, isDefault: true },
      { key: 'pending', displayName: 'Pending', description: 'Submitted for review', order: 2, isDefault: false },
      { key: 'published', displayName: 'Published', description: 'Visible to all users', order: 3, isDefault: false },
      { key: 'rejected', displayName: 'Rejected', description: 'Declined by moderators', order: 4, isDefault: false },
      { key: 'archived', displayName: 'Archived', description: 'No longer active', order: 5, isDefault: false }
    ], 'Listing statuses', true);
  }