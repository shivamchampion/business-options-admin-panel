/**
 * Activity Service
 * Handles operations related to user activities and analytics
 */
import { 
    collection, addDoc, query, where, getDocs, orderBy, 
    limit, startAfter, serverTimestamp, doc, updateDoc, 
    getDoc, increment, getAggregateFromServer, count
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Logs a user activity
   * 
   * @param {string} type - Activity type
   * @param {string} description - Activity description
   * @param {Object} related - Related entities
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} - Activity ID
   */
  export async function logActivity(type, description, related = {}, metadata = {}) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to log activity');
    }
    
    const timestamp = serverTimestamp();
    
    const activityData = {
      userId: currentUser.uid,
      type,
      description,
      related,
      metadata: {
        ...metadata,
        deviceInfo: navigator.userAgent || 'Unknown',
        ipAddress: 'client', // Actual IP would be logged server-side
        timestamp: new Date().toISOString()
      },
      createdAt: timestamp
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ACTIVITIES), activityData);
    return docRef.id;
  }
  
  /**
   * Gets recent activities for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {number} limit - Maximum number of activities to retrieve
   * @returns {Promise<Array>} - Array of activities
   */
  export async function getRecentActivities(userId = null, limitCount = 10) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);
    const q = query(
      activitiesRef,
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Records a page view
   * 
   * @param {string} page - Page name or path
   * @param {string|null} entityId - Related entity ID
   * @param {string|null} entityType - Related entity type
   * @returns {Promise<string>} - Activity ID
   */
  export async function recordPageView(page, entityId = null, entityType = null) {
    const related = {};
    
    if (entityId && entityType) {
      related.entityId = entityId;
      related.entityType = entityType;
    }
    
    return logActivity(
      'page_view', 
      `Viewed ${page}`, 
      related, 
      { page }
    );
  }
  
  /**
   * Records a listing view and updates listing view count
   * 
   * @param {string} listingId - Listing ID
   * @param {boolean} isUnique - Whether this is a unique view
   * @returns {Promise<string>} - Activity ID
   */
  export async function recordListingView(listingId, isUnique = false) {
    const currentUser = auth.currentUser;
    
    // Increment listing view count
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error(`Listing ${listingId} not found`);
    }
    
    // Update listing analytics
    const updateData = {
      'analytics.viewCount': increment(1),
      'analytics.lastViewed': serverTimestamp()
    };
    
    if (isUnique) {
      updateData['analytics.uniqueViewCount'] = increment(1);
    }
    
    await updateDoc(listingRef, updateData);
    
    // Log activity if user is authenticated
    if (currentUser) {
      return logActivity(
        'view_listing',
        `Viewed listing: ${listingDoc.data().name}`,
        {
          listingId,
          listingName: listingDoc.data().name,
          listingType: listingDoc.data().type
        }
      );
    }
    
    return null;
  }
  
  /**
   * Gets total count of activities by type
   * 
   * @param {string} type - Activity type
   * @returns {Promise<number>} - Count of activities
   */
  export async function getTotalActivityCount(type) {
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);
    const q = query(activitiesRef, where('type', '==', type));
    
    const snapshot = await getAggregateFromServer(q, { count: count() });
    return snapshot.data().count;
  }
  
  /**
   * Gets page view metrics for the analytics dashboard
   * 
   * @returns {Promise<Array>} - Array of page view metrics
   */
  export async function getPageViewMetrics() {
    // In a real application, this would query aggregated analytics data
    // For this example, we'll return mock data
    return [
      { page: "Business Listings", visits: 12453, interaction: 68, conversion: 3.2 },
      { page: "Franchise Opportunities", visits: 8764, interaction: 72, conversion: 4.1 },
      { page: "Startup Showcase", visits: 6542, interaction: 65, conversion: 2.8 },
      { page: "Investor Network", visits: 4321, interaction: 58, conversion: 2.3 },
      { page: "Digital Assets", visits: 3897, interaction: 61, conversion: 2.7 }
    ];
  }
  
  /**
   * Gets user activity history with pagination
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {number} pageSize - Results per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getUserActivityHistory(userId = null, pageSize = 20, lastVisible = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);
    let constraints = [
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc')
    ];
    
    // Add starting point for pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.ACTIVITIES, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    // Add limit
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(activitiesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      activities: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }