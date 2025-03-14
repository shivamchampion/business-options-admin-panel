/**
 * Transaction Operations Service
 * Handles complex operations requiring Firestore transactions
 */
import { 
    doc, getDoc, runTransaction, serverTimestamp, 
    increment, collection, addDoc
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS, SUBSCRIPTION_STATUS } from '../../config/constants';
  
  /**
   * Transfers listing ownership from one user to another
   * 
   * @param {string} listingId - Listing ID
   * @param {string} fromUserId - Current owner user ID
   * @param {string} toUserId - New owner user ID
   * @param {string} reason - Reason for transferring ownership
   * @returns {Promise<Object>} - Transaction result
   */
  export async function transferListingOwnership(listingId, fromUserId, toUserId, reason) {
    return runTransaction(db, async (transaction) => {
      // Get the listing
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
      const listingDoc = await transaction.get(listingRef);
      
      if (!listingDoc.exists()) {
        throw new Error('Listing does not exist');
      }
      
      const listing = listingDoc.data();
      
      // Verify current owner
      if (listing.ownerId !== fromUserId) {
        throw new Error('User does not own this listing');
      }
      
      // Get both user documents
      const fromUserRef = doc(db, COLLECTIONS.USERS, fromUserId);
      const toUserRef = doc(db, COLLECTIONS.USERS, toUserId);
      
      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);
      
      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        throw new Error('One or both users do not exist');
      }
      
      const timestamp = serverTimestamp();
      
      // Update the listing
      transaction.update(listingRef, {
        ownerId: toUserId,
        ownerName: toUserDoc.data().displayName || '',
        ownership: {
          isTransferable: listing.ownership?.isTransferable || true,
          transferHistory: [
            ...(listing.ownership?.transferHistory || []),
            {
              fromUserId,
              toUserId,
              transferredAt: timestamp,
              reason
            }
          ]
        },
        updatedAt: timestamp,
        updatedBy: fromUserId
      });
      
      // Update the users' listing arrays
      transaction.update(fromUserRef, {
        listings: listing.ownerId === fromUserId 
          ? (fromUserDoc.data().listings || []).filter(id => id !== listingId)
          : fromUserDoc.data().listings || []
      });
      
      transaction.update(toUserRef, {
        listings: [
          ...(toUserDoc.data().listings || []),
          listingId
        ]
      });
      
      // Create activity records in the transaction
      const activityData1 = {
        userId: fromUserId,
        type: 'transfer_listing_out',
        description: `Transferred ownership of listing ${listing.name}`,
        related: {
          listingId,
          listingName: listing.name,
          userId: toUserId
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        isDeleted: false
      };
      
      const activityData2 = {
        userId: toUserId,
        type: 'transfer_listing_in',
        description: `Received ownership of listing ${listing.name}`,
        related: {
          listingId,
          listingName: listing.name,
          userId: fromUserId
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        isDeleted: false
      };
      
      // Create activities after transaction completes
      await addDoc(collection(db, COLLECTIONS.ACTIVITIES), activityData1);
      await addDoc(collection(db, COLLECTIONS.ACTIVITIES), activityData2);
      
      return {
        success: true,
        listingId,
        timestamp
      };
    });
  }
  
  /**
   * Processes a subscription purchase
   * 
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} - Transaction result with subscription and transaction IDs
   */
  export async function processSubscriptionPurchase(userId, planId, paymentData) {
    return runTransaction(db, async (transaction) => {
      // Get user and plan
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const planRef = doc(db, COLLECTIONS.PLANS, planId);
      
      const userDoc = await transaction.get(userRef);
      const planDoc = await transaction.get(planRef);
      
      if (!userDoc.exists()) {
        throw new Error('User does not exist');
      }
      
      if (!planDoc.exists()) {
        throw new Error('Plan does not exist');
      }
      
      const user = userDoc.data();
      const plan = planDoc.data();
      const timestamp = serverTimestamp();
      
      // Calculate dates
      const startDate = timestamp;
      // End date calculation (simplified)
      // In a real app, you would use a proper date library to add days
      
      // Create transaction reference
      const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
      
      // Create subscription reference
      const subscriptionRef = doc(collection(db, COLLECTIONS.SUBSCRIPTIONS));
      
      // Prepare transaction data
      const transactionData = {
        userId,
        type: 'subscription_purchase',
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'completed',
        payment: {
          method: paymentData.method,
          gateway: paymentData.gateway,
          gatewayTransactionId: paymentData.transactionId
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: timestamp,
        version: 1,
        isDeleted: false
      };
      
      // Prepare subscription data
      const subscriptionData = {
        userId,
        planId,
        planType: plan.type,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        isActive: true,
        startDate,
        endDate: null, // This would be calculated properly in production
        payment: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentMethod: paymentData.method,
          transactionId: transactionRef.id,
          hasAutoRenew: paymentData.autoRenew || false
        },
        details: {
          planName: plan.name,
          planFeatures: plan.features,
          duration: plan.duration?.displayText || '30 days',
          durationDays: plan.duration?.days || 30
        },
        usage: {
          connectsTotal: plan.limits?.totalConnects || 0,
          connectsUsed: 0,
          connectsRemaining: plan.limits?.totalConnects || 0,
          listingsTotal: plan.limits?.listings?.total || 0,
          listingsUsed: 0
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        isDeleted: false
      };
      
      // Update user's current plan
      const userUpdate = {
        'currentPlan.id': planId,
        'currentPlan.name': plan.name,
        'currentPlan.type': plan.type,
        'currentPlan.startDate': startDate,
        'currentPlan.isAutoRenew': paymentData.autoRenew || false,
        'currentPlan.status': SUBSCRIPTION_STATUS.ACTIVE,
        'connectsBalance': (user.connectsBalance || 0) + (plan.limits?.totalConnects || 0),
        'updatedAt': timestamp
      };
      
      // Set/update all documents in transaction
      transaction.set(transactionRef, transactionData);
      transaction.set(subscriptionRef, subscriptionData);
      transaction.update(userRef, userUpdate);
      
      // Update plan subscription count
      transaction.update(planRef, {
        'tracking.subscribers': increment(1),
        'updatedAt': timestamp
      });
      
      return {
        success: true,
        subscriptionId: subscriptionRef.id,
        transactionId: transactionRef.id
      };
    });
  }
  
  /**
   * Processes an advisor commission payment
   * 
   * @param {string} advisorId - Advisor user ID
   * @param {string} businessId - Business listing ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} - Transaction result
   */
  export async function processAdvisorCommission(advisorId, businessId, paymentData) {
    return runTransaction(db, async (transaction) => {
      // Get advisor and business
      const advisorRef = doc(db, COLLECTIONS.USERS, advisorId);
      const businessRef = doc(db, COLLECTIONS.LISTINGS, businessId);
      
      const advisorDoc = await transaction.get(advisorRef);
      const businessDoc = await transaction.get(businessRef);
      
      if (!advisorDoc.exists()) {
        throw new Error('Advisor does not exist');
      }
      
      if (!businessDoc.exists()) {
        throw new Error('Business listing does not exist');
      }
      
      const advisor = advisorDoc.data();
      const business = businessDoc.data();
      const timestamp = serverTimestamp();
      const currentUser = auth.currentUser;
      
      // Create transaction reference
      const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
      const commissionRef = doc(collection(db, 'advisorCommissions')); // Use a dedicated collection for commissions
      
      // Prepare transaction data
      const transactionData = {
        userId: advisorId,
        type: 'advisor_commission',
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        status: 'completed',
        payment: {
          method: paymentData.method,
          reference: paymentData.reference,
          notes: paymentData.notes
        },
        related: {
          businessId,
          businessName: business.name,
          businessType: business.type
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: timestamp,
        createdBy: currentUser?.uid || 'system',
        version: 1,
        isDeleted: false
      };
      
      // Prepare commission data
      const commissionData = {
        advisorId,
        businessId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        status: 'paid',
        paymentDate: timestamp,
        paymentMethod: paymentData.method,
        paymentReference: paymentData.reference,
        transactionId: transactionRef.id,
        notes: paymentData.notes,
        businessDetails: {
          name: business.name,
          type: business.type
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: currentUser?.uid || 'system',
        version: 1,
        isDeleted: false
      };
      
      // Set documents in transaction
      transaction.set(transactionRef, transactionData);
      transaction.set(commissionRef, commissionData);
      
      // Update advisor's total commission amount
      transaction.update(advisorRef, {
        'totalCommission': increment(paymentData.amount),
        'pendingCommission': increment(-paymentData.amount),
        'commissionHistory': [
          ...(advisor.commissionHistory || []),
          {
            amount: paymentData.amount,
            businessId,
            businessName: business.name,
            date: timestamp,
            status: 'paid'
          }
        ],
        'updatedAt': timestamp
      });
      
      // Create activity record
      const activityData = {
        userId: advisorId,
        type: 'commission_received',
        description: `Received commission payment for ${business.name}`,
        related: {
          businessId,
          businessName: business.name,
          amount: paymentData.amount,
          currency: paymentData.currency || 'INR'
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        isDeleted: false
      };
      
      await addDoc(collection(db, COLLECTIONS.ACTIVITIES), activityData);
      
      return {
        success: true,
        commissionId: commissionRef.id,
        transactionId: transactionRef.id
      };
    });
  }