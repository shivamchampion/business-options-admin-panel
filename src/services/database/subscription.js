// src/services/database/subscription.js
/**
 * Subscription Service
 * Handles operations related to user subscriptions
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, updateDoc, arrayUnion,
    increment, writeBatch
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { COLLECTIONS, SUBSCRIPTION_STATUS } from '../../config/constants';
import { BaseService } from './index';
import { TransactionOperations } from './index';
import * as PlanService from './plan'; // Import PlanService instead of copy-pasting its code

/**
 * Creates a subscription
 * 
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - Subscription and transaction IDs
 */
export async function createSubscription(userId, planId, paymentData) {
  // Use transaction operation to handle the complex process
  return TransactionOperations.processSubscriptionPurchase(userId, planId, paymentData);
}

/**
 * Gets a subscription by ID
 * 
 * @param {string} id - Subscription ID
 * @returns {Promise<Object|null>} - Subscription data or null if not found
 */
export async function getSubscriptionById(id) {
  return BaseService.getDocument(COLLECTIONS.SUBSCRIPTIONS, id);
}

/**
 * Gets active subscription for a user
 * 
 * @param {string|null} userId - User ID (defaults to current user)
 * @returns {Promise<Object|null>} - Subscription data or null if not found
 */
export async function getActiveSubscription(userId = null) {
  const currentUser = auth.currentUser;
  const targetUserId = userId || (currentUser ? currentUser.uid : null);
  
  if (!targetUserId) {
    throw new Error('User ID is required');
  }
  
  const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
  
  const q = query(
    subscriptionsRef,
    where('userId', '==', targetUserId),
    where('status', '==', SUBSCRIPTION_STATUS.ACTIVE),
    where('isDeleted', '==', false),
    orderBy('endDate', 'desc'),
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
 * Gets subscriptions for a user
 * 
 * @param {string|null} userId - User ID (defaults to current user)
 * @param {string|null} status - Filter by status
 * @param {number} pageSize - Number of subscriptions per page
 * @param {string|null} lastSubscriptionId - Last subscription ID for pagination
 * @returns {Promise<Object>} - Subscriptions and pagination info
 */
export async function getUserSubscriptions(userId = null, status = null, pageSize = 10, lastSubscriptionId = null) {
  const currentUser = auth.currentUser;
  const targetUserId = userId || (currentUser ? currentUser.uid : null);
  
  if (!targetUserId) {
    throw new Error('User ID is required');
  }
  
  const subscriptionsRef = collection(db, COLLECTIONS.SUBSCRIPTIONS);
  
  let constraints = [
    where('userId', '==', targetUserId),
    where('isDeleted', '==', false)
  ];
  
  if (status) {
    constraints.push(where('status', '==', status));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  if (lastSubscriptionId) {
    const lastDoc = await getDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, lastSubscriptionId));
    if (lastDoc.exists()) {
      constraints.push(startAfter(lastDoc));
    }
  }
  
  constraints.push(limit(pageSize));
  
  const q = query(subscriptionsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return {
    subscriptions: snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })),
    lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    hasMore: snapshot.docs.length >= pageSize
  };
}

/**
 * Cancels a subscription
 * 
 * @param {string} id - Subscription ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<string>} - Subscription ID
 */
export async function cancelSubscription(id, reason) {
  const subscription = await getSubscriptionById(id);
  
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    throw new Error('Only active subscriptions can be cancelled');
  }
  
  const timestamp = serverTimestamp();
  
  // Update subscription
  await BaseService.updateDocument(COLLECTIONS.SUBSCRIPTIONS, id, {
    status: SUBSCRIPTION_STATUS.CANCELLED,
    isActive: false,
    cancelledDate: timestamp,
    cancellationReason: reason,
    statusHistory: arrayUnion({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      date: timestamp,
      reason
    })
  });
  
  // Update user's current plan status
  const userRef = doc(db, COLLECTIONS.USERS, subscription.userId);
  await updateDoc(userRef, {
    'currentPlan.status': SUBSCRIPTION_STATUS.CANCELLED,
    updatedAt: timestamp
  });
  
  return id;
}

/**
 * Uses subscription connects
 * 
 * @param {string} userId - User ID
 * @param {number} count - Number of connects to use
 * @param {string|null} listingId - Related listing ID
 * @param {string|null} contactType - Type of contact
 * @returns {Promise<boolean>} - Whether connects were successfully used
 */
export async function useSubscriptionConnects(userId, count, listingId = null, contactType = null) {
  // Get active subscription
  const subscription = await getActiveSubscription(userId);
  
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  
  // Check if enough connects are available
  if (subscription.usage.connectsRemaining < count) {
    throw new Error('Not enough connects available');
  }
  
  const timestamp = serverTimestamp();
  
  // Update subscription
  await BaseService.updateDocument(COLLECTIONS.SUBSCRIPTIONS, subscription.id, {
    'usage.connectsUsed': subscription.usage.connectsUsed + count,
    'usage.connectsRemaining': subscription.usage.connectsRemaining - count,
    'benefitsUsage.connectsUsageTimeline': arrayUnion({
      date: timestamp,
      used: count,
      remaining: subscription.usage.connectsRemaining - count
    })
  });
  
  // Update user's connects balance
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    connectsBalance: increment(-count),
    connectsHistory: arrayUnion({
      action: 'used',
      amount: count,
      source: 'subscription',
      listingId,
      contactType,
      timestamp
    })
  });
  
  return true;
}

/**
 * Checks if a subscription is about to expire
 * 
 * @param {string} id - Subscription ID
 * @param {number} daysThreshold - Days threshold for expiration
 * @returns {Promise<boolean>} - Whether the subscription is about to expire
 */
export async function isSubscriptionAboutToExpire(id, daysThreshold = 7) {
  const subscription = await getSubscriptionById(id);
  
  if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return false;
  }
  
  if (!subscription.endDate) {
    return false;
  }
  
  const endDate = subscription.endDate.toDate();
  const now = new Date();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
}