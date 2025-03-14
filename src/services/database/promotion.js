/**
 * Promotion Service
 * Handles operations related to platform promotions, discounts, and offers
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, serverTimestamp
  } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { COLLECTIONS } from '../../config/constants';
import { BaseService } from './index';

/**
 * Creates a new promotion
 * 
 * @param {Object} promotionData - Promotion data
 * @returns {Promise<string>} - Promotion ID
 */
export async function createPromotion(promotionData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to create promotions');
  }

  // Prepare promotion data
  const promotion = {
    ...promotionData,
    createdBy: currentUser.uid,
    isActive: promotionData.isActive !== undefined ? promotionData.isActive : true,
    currentUses: 0
  };

  return BaseService.createDocument(COLLECTIONS.PROMOTIONS, promotion);
}

/**
 * Gets a promotion by ID
 * 
 * @param {string} id - Promotion ID
 * @returns {Promise<Object|null>} - Promotion data or null if not found
 */
export async function getPromotionById(id) {
  return BaseService.getDocument(COLLECTIONS.PROMOTIONS, id);
}

/**
 * Gets a promotion by code
 * 
 * @param {string} code - Promotion code
 * @returns {Promise<Object|null>} - Promotion data or null if not found
 */
export async function getPromotionByCode(code) {
  const promotionsRef = collection(db, COLLECTIONS.PROMOTIONS);
  
  const q = query(
    promotionsRef,
    where('code', '==', code),
    where('isActive', '==', true),
    where('startDate', '<=', serverTimestamp()),
    where('endDate', '>=', serverTimestamp()),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Updates a promotion
 * 
 * @param {string} id - Promotion ID
 * @param {Object} promotionData - Promotion data to update
 * @returns {Promise<string>} - Promotion ID
 */
export async function updatePromotion(id, promotionData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to update promotions');
  }

  return BaseService.updateDocument(COLLECTIONS.PROMOTIONS, id, {
    ...promotionData,
    updatedBy: currentUser.uid
  });
}

/**
 * Gets active promotions
 * 
 * @param {string|null} type - Filter by promotion type
 * @returns {Promise<Array>} - Array of active promotions
 */
export async function getActivePromotions(type = null) {
  const promotionsRef = collection(db, COLLECTIONS.PROMOTIONS);
  
  let constraints = [
    where('isActive', '==', true),
    where('startDate', '<=', serverTimestamp()),
    where('endDate', '>=', serverTimestamp())
  ];
  
  if (type) {
    constraints.push(where('type', '==', type));
  }
  
  constraints.push(orderBy('startDate', 'desc'));
  
  const q = query(promotionsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Applies a promotion to a transaction
 * 
 * @param {string} code - Promotion code
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} - Promotion details and adjusted transaction
 */
export async function applyPromotion(code, transactionData) {
  // Find the promotion
  const promotion = await getPromotionByCode(code);
  
  if (!promotion) {
    throw new Error('Invalid or expired promotion code');
  }
  
  // Check usage limits
  if (promotion.maxUsesTotal && promotion.currentUses >= promotion.maxUsesTotal) {
    throw new Error('Promotion has reached its maximum uses');
  }
  
  // Check user-specific limits if applicable
  const currentUser = auth.currentUser;
  if (promotion.maxUsesPerUser && currentUser) {
    // TODO: Implement check for per-user usage limit
  }
  
  // Apply discount logic based on promotion type
  let discountedAmount = transactionData.amount;
  let discountAmount = 0;
  
  switch (promotion.discountType) {
    case 'percentage':
      discountAmount = transactionData.amount * (promotion.discountValue / 100);
      discountedAmount -= discountAmount;
      break;
    case 'fixed':
      discountAmount = Math.min(promotion.discountValue, transactionData.amount);
      discountedAmount -= discountAmount;
      break;
    case 'free_months':
      // Logic for free months (might apply to subscriptions)
      break;
  }
  
  // Update promotion usage
  await updatePromotion(promotion.id, {
    currentUses: promotion.currentUses + 1
  });
  
  return {
    promotion,
    discountAmount,
    discountedAmount,
    originalAmount: transactionData.amount
  };
}

/**
 * Gets promotional banners
 * 
 * @param {number} limit - Maximum number of banners to retrieve
 * @returns {Promise<Array>} - Array of active promotional banners
 */
export async function getPromotionalBanners(limit = 5) {
  const promotionsRef = collection(db, COLLECTIONS.PROMOTIONS);
  
  const q = query(
    promotionsRef,
    where('isActive', '==', true),
    where('displayOnCheckout', '==', true),
    where('startDate', '<=', serverTimestamp()),
    where('endDate', '>=', serverTimestamp()),
    orderBy('startDate', 'desc'),
    limit(limit)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Deletes a promotion (soft delete)
 * 
 * @param {string} id - Promotion ID
 * @returns {Promise<string>} - Promotion ID
 */
export async function deletePromotion(id) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to delete promotions');
  }

  return BaseService.deleteDocument(COLLECTIONS.PROMOTIONS, id);
}