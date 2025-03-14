/**
 * Report Service
 * Handles operations related to user-submitted reports
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, updateDoc, increment
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new report
   * 
   * @param {Object} reportData - Report data
   * @returns {Promise<string>} - Report ID
   */
  export async function createReport(reportData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a report');
    }
    
    // Prepare report data
    const report = {
      ...reportData,
      reportedBy: currentUser.uid,
      status: 'pending',
      priority: reportData.priority || 'medium'
    };
    
    // Create report
    const reportId = await BaseService.createDocument(COLLECTIONS.REPORTS, report);
    
    // Update target entity's report count if applicable
    if (report.targetId && report.type) {
      try {
        let collectionName;
        
        switch (report.type) {
          case 'listing':
            collectionName = COLLECTIONS.LISTINGS;
            break;
          case 'user':
            collectionName = COLLECTIONS.USERS;
            break;
          case 'review':
            collectionName = COLLECTIONS.REVIEWS;
            break;
          case 'message':
            collectionName = COLLECTIONS.MESSAGES;
            break;
        }
        
        if (collectionName) {
          const targetRef = doc(db, collectionName, report.targetId);
          await updateDoc(targetRef, {
            flaggedCount: increment(1),
            flags: firebase.firestore.FieldValue.arrayUnion({
              reason: report.reason,
              reportedBy: currentUser.uid,
              reportedAt: serverTimestamp()
            })
          });
        }
      } catch (error) {
        console.error('Error updating target entity:', error);
      }
    }
    
    return reportId;
  }
  
  /**
   * Gets a report by ID
   * 
   * @param {string} id - Report ID
   * @returns {Promise<Object|null>} - Report data or null if not found
   */
  export async function getReportById(id) {
    return BaseService.getDocument(COLLECTIONS.REPORTS, id);
  }
  
  /**
   * Updates a report
   * 
   * @param {string} id - Report ID
   * @param {Object} reportData - Report data to update
   * @returns {Promise<string>} - Report ID
   */
  export async function updateReport(id, reportData) {
    return BaseService.updateDocument(COLLECTIONS.REPORTS, id, reportData);
  }
  
  /**
   * Gets reports with filtering and pagination
   * 
   * @param {Object} filters - Filters to apply (type, status, etc.)
   * @param {number} pageSize - Number of reports per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getReports(filters = {}, pageSize = 10, lastVisible = null) {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    let constraints = [];
    
    // Add filters
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    
    if (filters.reportedBy) {
      constraints.push(where('reportedBy', '==', filters.reportedBy));
    }
    
    // Add ordering
    if (filters.orderBy) {
      constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    // Add pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.REPORTS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(reportsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      reports: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Reviews a report
   * 
   * @param {string} id - Report ID
   * @param {string} status - New status ('under_review', 'resolved', 'dismissed')
   * @param {string} notes - Reviewer notes
   * @returns {Promise<string>} - Report ID
   */
  export async function reviewReport(id, status, notes = '') {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to review a report');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.REPORTS, id, {
      status,
      reviewedBy: currentUser.uid,
      reviewedAt: timestamp,
      resolutionNotes: notes,
      updatedAt: timestamp
    });
  }
  
  /**
   * Takes action on a report
   * 
   * @param {string} id - Report ID
   * @param {string} action - Action taken ('none', 'warning', 'removal', 'ban')
   * @returns {Promise<string>} - Report ID
   */
  export async function takeReportAction(id, action) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to take action on a report');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.REPORTS, id, {
      actionTaken: action,
      actionDate: timestamp,
      status: 'resolved',
      updatedAt: timestamp
    });
  }
  
  /**
   * Gets reports for a specific target
   * 
   * @param {string} targetId - Target entity ID
   * @param {string} type - Target entity type
   * @returns {Promise<Array>} - Array of reports
   */
  export async function getReportsForTarget(targetId, type) {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    
    const q = query(
      reportsRef,
      where('targetId', '==', targetId),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets report count for a specific target
   * 
   * @param {string} targetId - Target entity ID
   * @param {string} type - Target entity type
   * @returns {Promise<number>} - Report count
   */
  export async function getReportCountForTarget(targetId, type) {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    
    const q = query(
      reportsRef,
      where('targetId', '==', targetId),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  }
  
  /**
   * Gets pending reports count
   * 
   * @returns {Promise<number>} - Pending reports count
   */
  export async function getPendingReportCount() {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    
    const q = query(
      reportsRef,
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  }