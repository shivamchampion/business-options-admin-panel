// src/services/database/transaction.js
/**
 * Transaction Service
 * Handles operations related to payment transactions
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new transaction
   * 
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<string>} - Transaction ID
   */
  export async function createTransaction(transactionData) {
    return BaseService.createDocument(COLLECTIONS.TRANSACTIONS, transactionData);
  }
  
  /**
   * Gets a transaction by ID
   * 
   * @param {string} id - Transaction ID
   * @returns {Promise<Object|null>} - Transaction data or null if not found
   */
  export async function getTransactionById(id) {
    return BaseService.getDocument(COLLECTIONS.TRANSACTIONS, id);
  }
  
  /**
   * Updates a transaction
   * 
   * @param {string} id - Transaction ID
   * @param {Object} transactionData - Transaction data to update
   * @returns {Promise<string>} - Transaction ID
   */
  export async function updateTransaction(id, transactionData) {
    return BaseService.updateDocument(COLLECTIONS.TRANSACTIONS, id, transactionData);
  }
  
  /**
   * Gets transactions for a user with pagination
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {string|null} type - Filter by transaction type
   * @param {string|null} status - Filter by transaction status
   * @param {number} pageSize - Number of transactions per page
   * @param {string|null} lastTransactionId - Last transaction ID for pagination
   * @returns {Promise<Object>} - Transactions and pagination info
   */
  export async function getUserTransactions(userId = null, type = null, status = null, pageSize = 10, lastTransactionId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    
    let constraints = [
      where('userId', '==', targetUserId),
      where('isDeleted', '==', false)
    ];
    
    if (type) {
      constraints.push(where('type', '==', type));
    }
    
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (lastTransactionId) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.TRANSACTIONS, lastTransactionId));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    const q = query(transactionsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      transactions: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Marks a transaction as completed
   * 
   * @param {string} id - Transaction ID
   * @returns {Promise<string>} - Transaction ID
   */
  export async function completeTransaction(id) {
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.TRANSACTIONS, id, {
      status: 'completed',
      completedAt: timestamp
    });
  }
  
  /**
   * Marks a transaction as failed
   * 
   * @param {string} id - Transaction ID
   * @param {string} reason - Failure reason
   * @returns {Promise<string>} - Transaction ID
   */
  export async function failTransaction(id, reason) {
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.TRANSACTIONS, id, {
      status: 'failed',
      failureReason: reason,
      updatedAt: timestamp
    });
  }
  
  /**
   * Processes a refund
   * 
   * @param {string} id - Transaction ID
   * @param {string} reason - Refund reason
   * @param {number|null} amount - Refund amount (if partial)
   * @returns {Promise<string>} - Transaction ID
   */
  export async function refundTransaction(id, reason, amount = null) {
    const transaction = await getTransactionById(id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be refunded');
    }
    
    const timestamp = serverTimestamp();
    const refundAmount = amount || transaction.amount;
    
    // Update transaction
    return BaseService.updateDocument(COLLECTIONS.TRANSACTIONS, id, {
      status: 'refunded',
      refund: {
        isRefunded: true,
        refundAmount,
        refundDate: timestamp,
        refundReason: reason,
        refundRequestedBy: auth.currentUser ? auth.currentUser.uid : 'system',
        refundProcessedBy: auth.currentUser ? auth.currentUser.uid : 'system'
      },
      refundedAt: timestamp
    });
  }
  