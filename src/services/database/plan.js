/**
 * Plan Service
 * Handles operations related to subscription plans
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, limit
  } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../config/constants';
import { BaseService } from './index';

/**
 * Creates a new plan
 * 
 * @param {Object} planData - Plan data
 * @returns {Promise<string>} - Plan ID
 */
export async function createPlan(planData) {
  return BaseService.createDocument(COLLECTIONS.PLANS, planData);
}

/**
 * Gets a plan by ID
 * 
 * @param {string} id - Plan ID
 * @returns {Promise<Object|null>} - Plan data or null if not found
 */
export async function getPlanById(id) {
  return BaseService.getDocument(COLLECTIONS.PLANS, id);
}

/**
 * Updates a plan
 * 
 * @param {string} id - Plan ID
 * @param {Object} planData - Plan data to update
 * @returns {Promise<string>} - Plan ID
 */
export async function updatePlan(id, planData) {
  return BaseService.updateDocument(COLLECTIONS.PLANS, id, planData);
}

/**
 * Gets all active plans
 * 
 * @param {string|null} type - Filter by plan type
 * @returns {Promise<Array>} - Array of plans
 */
export async function getActivePlans(type = null) {
  const plansRef = collection(db, COLLECTIONS.PLANS);
  
  let constraints = [
    where('isDeleted', '==', false),
    where('isActive', '==', true),
    where('availability.isPublic', '==', true)
  ];
  
  if (type) {
    constraints.push(where('type', '==', type));
  }
  
  constraints.push(orderBy('display.order', 'asc'));
  
  const q = query(plansRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Gets featured plan
 * 
 * @returns {Promise<Object|null>} - Featured plan or null if not found
 */
export async function getFeaturedPlan() {
  const plansRef = collection(db, COLLECTIONS.PLANS);
  
  const q = query(
    plansRef,
    where('isDeleted', '==', false),
    where('isActive', '==', true),
    where('availability.isPublic', '==', true),
    where('display.isRecommended', '==', true),
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
 * Gets all plans (for admin)
 * 
 * @returns {Promise<Array>} - Array of all plans
 */
export async function getAllPlans() {
  const plansRef = collection(db, COLLECTIONS.PLANS);
  
  const q = query(
    plansRef,
    where('isDeleted', '==', false),
    orderBy('display.order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Gets plans by listing type
 * 
 * @param {string} listingType - Listing type
 * @returns {Promise<Array>} - Array of plans
 */
export async function getPlansByListingType(listingType) {
  const plansRef = collection(db, COLLECTIONS.PLANS);
  
  const q = query(
    plansRef,
    where('isDeleted', '==', false),
    where('isActive', '==', true),
    where('availability.isPublic', '==', true),
    where('availability.forListingTypes', 'array-contains', listingType),
    orderBy('display.order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}