// src/services/database/chatroom.js
/**
 * Chatroom Service
 * Handles operations related to chat rooms
 */
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, 
    query, where, orderBy, limit, startAfter, serverTimestamp, 
    arrayUnion, arrayRemove, writeBatch, increment
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new chatroom between two users
   * 
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {string|null} listingId - Optional related listing ID
   * @returns {Promise<string>} - Chatroom ID
   */
  export async function createChatroom(user1Id, user2Id, listingId = null) {
    // Check if chatroom already exists
    const existingChatroom = await getChatroomBetweenUsers(user1Id, user2Id);
    
    if (existingChatroom) {
      // If listing is provided and different from existing, update it
      if (listingId && (!existingChatroom.listing || existingChatroom.listing.id !== listingId)) {
        const chatroomRef = doc(db, COLLECTIONS.CHATROOMS, existingChatroom.id);
        
        // Get listing details
        const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
        const listingDoc = await getDoc(listingRef);
        
        if (listingDoc.exists()) {
          const listing = listingDoc.data();
          
          await updateDoc(chatroomRef, {
            listing: {
              id: listingId,
              name: listing.name,
              type: listing.type,
              image: listing.media?.featuredImage?.url || ''
            },
            updatedAt: serverTimestamp()
          });
        }
      }
      
      return existingChatroom.id;
    }
    
    // Get user details
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, user1Id)),
      getDoc(doc(db, COLLECTIONS.USERS, user2Id))
    ]);
    
    if (!user1Doc.exists() || !user2Doc.exists()) {
      throw new Error('One or both users do not exist');
    }
    
    const user1 = user1Doc.data();
    const user2 = user2Doc.data();
    
    // Prepare chatroom data
    const chatroomData = {
      participants: [user1Id, user2Id],
      participantDetails: [
        {
          userId: user1Id,
          name: user1.displayName || 'User',
          photo: user1.profileImage?.url || '',
          role: user1.role
        },
        {
          userId: user2Id,
          name: user2.displayName || 'User',
          photo: user2.profileImage?.url || '',
          role: user2.role
        }
      ],
      status: 'active',
      counters: {
        messageCount: 0,
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        mediaCount: 0,
        offerCount: 0
      },
      activity: {
        lastActive: serverTimestamp(),
        createdBy: user1Id
      },
      lifecycle: {
        connectionInitiated: serverTimestamp(),
        dealStage: 'initial_contact'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    };
    
    // If listing ID is provided, add listing info
    if (listingId) {
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
      const listingDoc = await getDoc(listingRef);
      
      if (listingDoc.exists()) {
        const listing = listingDoc.data();
        
        chatroomData.listing = {
          id: listingId,
          name: listing.name,
          type: listing.type,
          image: listing.media?.featuredImage?.url || ''
        };
      }
    }
    
    // Create chatroom
    const chatroomRef = await addDoc(collection(db, COLLECTIONS.CHATROOMS), chatroomData);
    
    return chatroomRef.id;
  }
  
  /**
   * Gets a chatroom by ID
   * 
   * @param {string} id - Chatroom ID
   * @returns {Promise<Object|null>} - Chatroom data or null if not found
   */
  export async function getChatroomById(id) {
    return BaseService.getDocument(COLLECTIONS.CHATROOMS, id);
  }
  
  /**
   * Gets a chatroom between two users
   * 
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @returns {Promise<Object|null>} - Chatroom data or null if not found
   */
  export async function getChatroomBetweenUsers(user1Id, user2Id) {
    const chatroomsRef = collection(db, COLLECTIONS.CHATROOMS);
    
    // Create a query where both users are participants
    const q = query(
      chatroomsRef,
      where('participants', 'array-contains', user1Id),
      where('status', '==', 'active'),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    // Find chatroom where the other user is also a participant
    const chatroom = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(user2Id);
    });
    
    if (!chatroom) return null;
    
    return {
      id: chatroom.id,
      ...chatroom.data()
    };
  }
  
  /**
   * Gets chatrooms for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {number} pageSize - Number of chatrooms per page
   * @param {string|null} lastChatroomId - Last chatroom ID for pagination
   * @returns {Promise<Object>} - Chatrooms and pagination info
   */
  export async function getUserChatrooms(userId = null, pageSize = 10, lastChatroomId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const chatroomsRef = collection(db, COLLECTIONS.CHATROOMS);
    
    let constraints = [
      where('participants', 'array-contains', targetUserId),
      where('status', '==', 'active'),
      where('isDeleted', '==', false),
      orderBy('lastMessage.timestamp', 'desc')
    ];
    
    if (lastChatroomId) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.CHATROOMS, lastChatroomId));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    const q = query(chatroomsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      chatrooms: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Archives a chatroom
   * 
   * @param {string} chatroomId - Chatroom ID
   * @returns {Promise<void>}
   */
  export async function archiveChatroom(chatroomId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to archive a chatroom');
    }
    
    const chatroomRef = doc(db, COLLECTIONS.CHATROOMS, chatroomId);
    await updateDoc(chatroomRef, {
      status: 'archived',
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Blocks a chatroom
   * 
   * @param {string} chatroomId - Chatroom ID
   * @returns {Promise<void>}
   */
  export async function blockChatroom(chatroomId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to block a chatroom');
    }
    
    const chatroomRef = doc(db, COLLECTIONS.CHATROOMS, chatroomId);
    await updateDoc(chatroomRef, {
      status: 'blocked',
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Gets unread message count for a user
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<number>} - Total unread messages
   */
  export async function getUnreadMessageCount(userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const chatroomsRef = collection(db, COLLECTIONS.CHATROOMS);
    
    const q = query(
      chatroomsRef,
      where('participants', 'array-contains', targetUserId),
      where('status', '==', 'active'),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    let totalUnread = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalUnread += data.counters?.unreadCount?.[targetUserId] || 0;
    });
    
    return totalUnread;
  }