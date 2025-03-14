/**
 * Audit Log Service
 * Handles operations related to system-wide action tracking
 */
import { 
    collection, doc, getDoc, getDocs, addDoc, query, where, 
    orderBy, limit, startAfter
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  
  /**
   * Creates a new audit log entry
   * 
   * @param {Object} logData - Audit log data
   * @returns {Promise<string>} - Audit log ID
   */
  export async function createAuditLog(logData) {
    const currentUser = auth.currentUser;
    
    // Prepare log data
    const log = {
      ...logData,
      performedBy: logData.performedBy || (currentUser ? currentUser.uid : 'system'),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ip: 'client' // Actual IP would be captured server-side
    };
    
    // Create log entry
    const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), log);
    return docRef.id;
  }
  
  /**
   * Gets an audit log entry by ID
   * 
   * @param {string} id - Audit log ID
   * @returns {Promise<Object|null>} - Audit log data or null if not found
   */
  export async function getAuditLogById(id) {
    const docRef = doc(db, COLLECTIONS.AUDIT_LOGS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
  }
  
  /**
   * Gets audit logs with filtering and pagination
   * 
   * @param {Object} filters - Filters to apply (action, entityType, etc.)
   * @param {number} pageSize - Number of logs per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getAuditLogs(filters = {}, pageSize = 20, lastVisible = null) {
    const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS);
    let constraints = [];
    
    // Add filters
    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    
    if (filters.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }
    
    if (filters.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }
    
    if (filters.performedBy) {
      constraints.push(where('performedBy', '==', filters.performedBy));
    }
    
    if (filters.severity) {
      constraints.push(where('severity', '==', filters.severity));
    }
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Add date range filter if provided
    if (filters.startDate && filters.endDate) {
      constraints.push(where('timestamp', '>=', new Date(filters.startDate)));
      constraints.push(where('timestamp', '<=', new Date(filters.endDate)));
    }
    
    // Add ordering
    constraints.push(orderBy('timestamp', 'desc'));
    
    // Add pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.AUDIT_LOGS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(logsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      logs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Gets entity audit trail
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {number} limitCount - Maximum number of log entries
   * @returns {Promise<Array>} - Array of audit log entries
   */
  export async function getEntityAuditTrail(entityType, entityId, limitCount = 20) {
    const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS);
    
    const q = query(
      logsRef,
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets user activity log
   * 
   * @param {string} userId - User ID
   * @param {number} limitCount - Maximum number of log entries
   * @returns {Promise<Array>} - Array of audit log entries
   */
  export async function getUserActivityLog(userId, limitCount = 20) {
    const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS);
    
    const q = query(
      logsRef,
      where('performedBy', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Logs a create action
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} details - Additional details
   * @returns {Promise<string>} - Audit log ID
   */
  export async function logCreateAction(entityType, entityId, details = {}) {
    return createAuditLog({
      action: 'create',
      entityType,
      entityId,
      severity: 'info',
      status: 'success',
      details
    });
  }
  
  /**
   * Logs an update action
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Array} fieldChanges - Array of changed field names
   * @param {Object} details - Additional details
   * @returns {Promise<string>} - Audit log ID
   */
  export async function logUpdateAction(entityType, entityId, fieldChanges = [], details = {}) {
    return createAuditLog({
      action: 'update',
      entityType,
      entityId,
      severity: 'info',
      status: 'success',
      fieldChanges,
      details
    });
  }
  
  /**
   * Logs a delete action
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} details - Additional details
   * @returns {Promise<string>} - Audit log ID
   */
  export async function logDeleteAction(entityType, entityId, details = {}) {
    return createAuditLog({
      action: 'delete',
      entityType,
      entityId,
      severity: 'warning',
      status: 'success',
      details
    });
  }
  
  /**
   * Logs a login action
   * 
   * @param {string} userId - User ID
   * @param {Object} details - Additional details
   * @returns {Promise<string>} - Audit log ID
   */
  export async function logLoginAction(userId, details = {}) {
    return createAuditLog({
      action: 'login',
      entityType: 'user',
      entityId: userId,
      performedBy: userId,
      severity: 'info',
      status: 'success',
      details
    });
  }
  
  /**
   * Logs a permission change action
   * 
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @param {Object} details - Additional details
   * @returns {Promise<string>} - Audit log ID
   */
  export async function logPermissionChange(userId, role, details = {}) {
    return createAuditLog({
      action: 'permission_change',
      entityType: 'user',
      entityId: userId,
      severity: 'warning',
      status: 'success',
      details: {
        ...details,
        role
      }
    });
  }