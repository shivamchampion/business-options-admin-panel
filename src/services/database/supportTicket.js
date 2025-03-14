/**
 * Support Ticket Service
 * Handles operations related to support tickets and applications
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, updateDoc, addDoc
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new support ticket
   * 
   * @param {Object} ticketData - Support ticket data
   * @returns {Promise<string>} - Support ticket ID
   */
  export async function createSupportTicket(ticketData) {
    const currentUser = auth.currentUser;
    
    // Set default values if not provided
    const ticket = {
      ...ticketData,
      status: ticketData.status || 'open',
      priority: ticketData.priority || 'medium',
      userId: currentUser?.uid || ticketData.userId,
      type: ticketData.type || 'general'
    };
    
    return BaseService.createDocument(COLLECTIONS.SUPPORT_TICKETS, ticket);
  }
  
  /**
   * Gets a support ticket by ID
   * 
   * @param {string} id - Support ticket ID
   * @returns {Promise<Object|null>} - Support ticket data or null if not found
   */
  export async function getSupportTicketById(id) {
    return BaseService.getDocument(COLLECTIONS.SUPPORT_TICKETS, id);
  }
  
  /**
   * Updates a support ticket
   * 
   * @param {string} id - Support ticket ID
   * @param {Object} ticketData - Support ticket data to update
   * @returns {Promise<string>} - Support ticket ID
   */
  export async function updateSupportTicket(id, ticketData) {
    return BaseService.updateDocument(COLLECTIONS.SUPPORT_TICKETS, id, ticketData);
  }
  
  /**
   * Adds a message to a support ticket
   * 
   * @param {string} ticketId - Support ticket ID
   * @param {string} message - Message content
   * @param {string} senderType - Sender type ('customer', 'agent', 'system')
   * @returns {Promise<string>} - Support ticket ID
   */
  export async function addTicketMessage(ticketId, message, senderType = 'agent') {
    const currentUser = auth.currentUser;
    if (!currentUser && senderType !== 'system') {
      throw new Error('User must be authenticated to add a ticket message');
    }
    
    const ticketRef = doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Support ticket not found');
    }
    
    const timestamp = serverTimestamp();
    
    const newMessage = {
      senderId: currentUser?.uid || 'system',
      senderType,
      message,
      timestamp
    };
    
    // Update status based on who's responding
    let newStatus = ticketDoc.data().status;
    if (senderType === 'agent') {
      newStatus = 'waiting_for_customer';
    } else if (senderType === 'customer') {
      newStatus = 'in_progress';
    }
    
    await updateDoc(ticketRef, {
      messages: [...(ticketDoc.data().messages || []), newMessage],
      status: newStatus,
      lastUpdatedAt: timestamp,
      lastRepliedAt: timestamp,
      updatedAt: timestamp
    });
    
    return ticketId;
  }
  
  /**
   * Closes a support ticket
   * 
   * @param {string} id - Support ticket ID
   * @param {string} resolution - Resolution description
   * @returns {Promise<string>} - Support ticket ID
   */
  export async function closeSupportTicket(id, resolution) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to close a ticket');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.SUPPORT_TICKETS, id, {
      status: 'closed',
      resolution,
      resolvedAt: timestamp,
      resolvedBy: currentUser.uid,
      updatedAt: timestamp
    });
  }
  
  /**
   * Gets support tickets with filtering and pagination
   * 
   * @param {Object} filters - Filters to apply (status, type, userId, etc.)
   * @param {number} pageSize - Number of tickets per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getSupportTickets(filters = {}, pageSize = 10, lastVisible = null) {
    const ticketsRef = collection(db, COLLECTIONS.SUPPORT_TICKETS);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add filters
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    
    if (filters.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(ticketsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      tickets: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Assigns a support ticket to an agent
   * 
   * @param {string} id - Support ticket ID
   * @param {string} agentId - Agent user ID
   * @returns {Promise<string>} - Support ticket ID
   */
  export async function assignSupportTicket(id, agentId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to assign a ticket');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.SUPPORT_TICKETS, id, {
      assignedTo: agentId,
      status: 'in_progress',
      updatedAt: timestamp
    });
  }
  
  /**
   * Gets recent support tickets/applications
   * 
   * @param {number} limit - Maximum number of tickets to retrieve
   * @returns {Promise<Array>} - Array of recent tickets
   */
  export async function getRecentTickets(limitCount = 3) {
    // In a real application, this would fetch from Firestore
    // For the demo, we'll return mock data
    return [
      { 
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        business: 'Tech Solutions Ltd',
        type: 'Business',
        status: 'New',
        date: '2025-03-12'
      },
      { 
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        business: 'Food Franchise Chain',
        type: 'Franchise',
        status: 'Contacted',
        date: '2025-03-11'
      },
      { 
        id: '3',
        name: 'Raj Patel',
        email: 'raj@example.com',
        business: 'E-commerce Platform',
        type: 'Digital Asset',
        status: 'In Discussion',
        date: '2025-03-10'
      }
    ];
  }