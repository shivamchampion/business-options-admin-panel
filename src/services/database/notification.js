// src/services/database/notification.js
/**
 * Notification Service
 * Handles operations related to user notifications
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, updateDoc, writeBatch,
    increment
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a notification
   * 
   * @param {Object} notificationData - Notification data
   * @returns {Promise<string>} - Notification ID
   */
  export async function createNotification(notificationData) {
    // Ensure required fields are present
    if (!notificationData.userId || !notificationData.type || !notificationData.title) {
      throw new Error('Missing required notification fields');
    }
    
    return BaseService.createDocument(COLLECTIONS.NOTIFICATIONS, {
      ...notificationData,
      status: {
        isRead: false,
        isClicked: false,
        ...(notificationData.status || {})
      },
      importance: notificationData.importance || 'medium',
      expiresAt: notificationData.expiresAt || null
    });
  }
  
  /**
   * Gets a notification by ID
   * 
   * @param {string} id - Notification ID
   * @returns {Promise<Object|null>} - Notification data or null if not found
   */
  export async function getNotificationById(id) {
    return BaseService.getDocument(COLLECTIONS.NOTIFICATIONS, id);
  }
  
  /**
   * Marks a notification as read
   * 
   * @param {string} id - Notification ID
   * @returns {Promise<string>} - Notification ID
   */
  export async function markNotificationAsRead(id) {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    
    await updateDoc(notificationRef, {
      'status.isRead': true,
      'status.readAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return id;
  }
  
  /**
   * Marks a notification as clicked
   * 
   * @param {string} id - Notification ID
   * @returns {Promise<string>} - Notification ID
   */
  export async function markNotificationAsClicked(id) {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    
    await updateDoc(notificationRef, {
      'status.isClicked': true,
      'status.clickedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return id;
  }
  
  /**
   * Gets user's notifications with pagination
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {boolean} unreadOnly - Get only unread notifications
   * @param {number} pageSize - Number of notifications per page
   * @param {string|null} lastNotificationId - Last notification ID for pagination
   * @returns {Promise<Object>} - Notifications and pagination info
   */
  export async function getUserNotifications(userId = null, unreadOnly = false, pageSize = 20, lastNotificationId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    let constraints = [
      where('userId', '==', targetUserId),
      where('isDeleted', '==', false)
    ];
    
    if (unreadOnly) {
      constraints.push(where('status.isRead', '==', false));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (lastNotificationId) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.NOTIFICATIONS, lastNotificationId));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      notifications: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Marks all notifications as read
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<number>} - Number of notifications marked as read
   */
  export async function markAllNotificationsAsRead(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    const q = query(
      notificationsRef,
      where('userId', '==', targetUserId),
      where('status.isRead', '==', false),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        'status.isRead': true,
        'status.readAt': timestamp,
        updatedAt: timestamp
      });
    });
    
    await batch.commit();
    
    return snapshot.size;
  }
  
  /**
   * Gets unread notification count
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<number>} - Number of unread notifications
   */
  export async function getUnreadNotificationCount(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      return 0;
    }
    
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    const q = query(
      notificationsRef,
      where('userId', '==', targetUserId),
      where('status.isRead', '==', false),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  }
  
  /**
   * Deletes a notification (soft delete)
   * 
   * @param {string} id - Notification ID
   * @returns {Promise<string>} - Notification ID
   */
  export async function deleteNotification(id) {
    return BaseService.deleteDocument(COLLECTIONS.NOTIFICATIONS, id);
  }
  
  /**
   * Deletes all notifications for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<number>} - Number of notifications deleted
   */
  export async function deleteAllNotifications(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    const q = query(
      notificationsRef,
      where('userId', '==', targetUserId),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        isDeleted: true,
        deletedAt: timestamp,
        updatedAt: timestamp
      });
    });
    
    await batch.commit();
    
    return snapshot.size;
  }