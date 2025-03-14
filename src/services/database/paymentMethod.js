// src/services/database/paymentMethod.js
/**
 * Payment Method Service
 * Handles operations related to saved payment methods
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, updateDoc, serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new payment method
   * 
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<string>} - Payment method ID
   */
  export async function createPaymentMethod(paymentMethodData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to add payment methods');
    }
    
    // Make sure required fields are present
    if (!paymentMethodData.type) {
      throw new Error('Payment method type is required');
    }
    
    // Check if this should be the default method
    let isDefault = paymentMethodData.isDefault;
    
    if (isDefault) {
      // If setting as default, update other methods
      await unsetDefaultPaymentMethods(currentUser.uid);
    } else {
      // If no preference provided, check if this is the first method
      const existing = await getUserPaymentMethods(currentUser.uid);
      isDefault = existing.length === 0;
    }
    
    // Create payment method
    return BaseService.createDocument(COLLECTIONS.PAYMENT_METHODS, {
      userId: currentUser.uid,
      type: paymentMethodData.type,
      isDefault,
      ...paymentMethodData
    });
  }
  
  /**
   * Gets a payment method by ID
   * 
   * @param {string} id - Payment method ID
   * @returns {Promise<Object|null>} - Payment method data or null if not found
   */
  export async function getPaymentMethodById(id) {
    return BaseService.getDocument(COLLECTIONS.PAYMENT_METHODS, id);
  }
  
  /**
   * Updates a payment method
   * 
   * @param {string} id - Payment method ID
   * @param {Object} paymentMethodData - Payment method data to update
   * @returns {Promise<string>} - Payment method ID
   */
  export async function updatePaymentMethod(id, paymentMethodData) {
    const currentUser = auth.currentUser;
    
    const paymentMethod = await getPaymentMethodById(id);
    
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }
    
    // Check if user is authorized
    if (paymentMethod.userId !== currentUser.uid) {
      throw new Error('Unauthorized to update this payment method');
    }
    
    // If setting as default, update other methods
    if (paymentMethodData.isDefault) {
      await unsetDefaultPaymentMethods(currentUser.uid);
    }
    
    return BaseService.updateDocument(COLLECTIONS.PAYMENT_METHODS, id, paymentMethodData);
  }
  
  /**
   * Deletes a payment method
   * 
   * @param {string} id - Payment method ID
   * @returns {Promise<string>} - Payment method ID
   */
  export async function deletePaymentMethod(id) {
    const currentUser = auth.currentUser;
    
    const paymentMethod = await getPaymentMethodById(id);
    
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }
    
    // Check if user is authorized
    if (paymentMethod.userId !== currentUser.uid) {
      throw new Error('Unauthorized to delete this payment method');
    }
    
    // Delete payment method
    const result = await BaseService.deleteDocument(COLLECTIONS.PAYMENT_METHODS, id);
    
    // If this was the default method, set a new default
    if (paymentMethod.isDefault) {
      const methods = await getUserPaymentMethods(currentUser.uid);
      if (methods.length > 0) {
        await setDefaultPaymentMethod(methods[0].id);
      }
    }
    
    return result;
  }
  
  /**
   * Gets payment methods for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<Array>} - Array of payment methods
   */
  export async function getUserPaymentMethods(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const paymentMethodsRef = collection(db, COLLECTIONS.PAYMENT_METHODS);
    
    const q = query(
      paymentMethodsRef,
      where('userId', '==', targetUserId),
      where('isDeleted', '==', false),
      orderBy('isDefault', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets default payment method for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<Object|null>} - Default payment method or null if not found
   */
  export async function getDefaultPaymentMethod(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const paymentMethodsRef = collection(db, COLLECTIONS.PAYMENT_METHODS);
    
    const q = query(
      paymentMethodsRef,
      where('userId', '==', targetUserId),
      where('isDefault', '==', true),
      where('isDeleted', '==', false),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }
  
  /**
   * Sets a payment method as default
   * 
   * @param {string} id - Payment method ID
   * @returns {Promise<string>} - Payment method ID
   */
  export async function setDefaultPaymentMethod(id) {
    const currentUser = auth.currentUser;
    
    const paymentMethod = await getPaymentMethodById(id);
    
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }
    
    // Check if user is authorized
    if (paymentMethod.userId !== currentUser.uid) {
      throw new Error('Unauthorized to update this payment method');
    }
    
    // Unset other default payment methods
    await unsetDefaultPaymentMethods(currentUser.uid);
    
    // Set this method as default
    await BaseService.updateDocument(COLLECTIONS.PAYMENT_METHODS, id, {
      isDefault: true,
      updatedAt: serverTimestamp()
    });
    
    return id;
  }
  
  /**
   * Unsets all default payment methods for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async function unsetDefaultPaymentMethods(userId) {
    const paymentMethodsRef = collection(db, COLLECTIONS.PAYMENT_METHODS);
    
    const q = query(
      paymentMethodsRef,
      where('userId', '==', userId),
      where('isDefault', '==', true),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return;
    }
    
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        isDefault: false,
        updatedAt: timestamp
      });
    });
    
    await batch.commit();
  }
  
  /**
   * Updates payment method usage
   * 
   * @param {string} id - Payment method ID
   * @returns {Promise<string>} - Payment method ID
   */
  export async function updatePaymentMethodUsage(id) {
    const paymentMethodRef = doc(db, COLLECTIONS.PAYMENT_METHODS, id);
    
    await updateDoc(paymentMethodRef, {
      lastUsed: serverTimestamp(),
      usageCount: increment(1)
    });
    
    return id;
  }
  