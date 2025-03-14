// src/services/database/message.js
/**
 * Message Service
 * Handles operations related to user messages
 */
import { 
    collection, getDocs, addDoc, updateDoc, setDoc, query, where, orderBy, limit, startAfter, serverTimestamp, arrayUnion
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Sends a message
   * 
   * @param {Object} messageData - Message data
   * @returns {Promise<string>} - Message ID
   */
  export async function sendMessage(messageData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to send messages');
    }
    
    const timestamp = serverTimestamp();
    
    // Get existing or create new chatroom
    let chatroomId = messageData.chatroomId;
    
    if (!chatroomId) {
      // Create new chatroom
      chatroomId = await createChatroom(
        currentUser.uid, 
        messageData.recipient, 
        messageData.listing?.id
      );
    }
    
    // Prepare message data
    const message = {
      chatroomId,
      sender: currentUser.uid,
      senderName: currentUser.displayName || 'User',
      recipient: messageData.recipient,
      content: {
        ...messageData.content,
        type: messageData.content.type || 'text'
      },
      status: {
        isSent: true,
        isDelivered: false,
        isRead: false
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };
    
    // If message has a listing reference, include it
    if (messageData.listing) {
      message.listing = messageData.listing;
    }
    
    // Add message to the messages collection
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const messageRef = await addDoc(messagesRef, message);
    
    // Update chatroom with last message details
    const chatroomRef = doc(db, COLLECTIONS.CHATROOMS, chatroomId);
    await updateDoc(chatroomRef, {
      lastMessage: {
        id: messageRef.id,
        text: messageData.content.text,
        sender: currentUser.uid,
        timestamp,
        type: messageData.content.type || 'text'
      },
      'counters.messageCount': increment(1),
      [`counters.unreadCount.${messageData.recipient}`]: increment(1),
      updatedAt: timestamp
    });
    
    // Create a notification for the recipient
    await BaseService.createDocument(COLLECTIONS.NOTIFICATIONS, {
      userId: messageData.recipient,
      type: 'message',
      title: `New message from ${currentUser.displayName || 'User'}`,
      message: messageData.content.text.substring(0, 100) + (messageData.content.text.length > 100 ? '...' : ''),
      status: {
        isRead: false,
        isClicked: false
      },
      related: {
        chatroomId,
        messageId: messageRef.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User'
      },
      createdAt: timestamp
    });
    
    return messageRef.id;
  }
  
  /**
   * Gets messages for a chatroom with pagination
   * 
   * @param {string} chatroomId - Chatroom ID
   * @param {number} pageSize - Number of messages per page
   * @param {string|null} lastMessageId - Last message ID for pagination
   * @returns {Promise<Object>} - Messages and pagination info
   */
  export async function getChatroomMessages(chatroomId, pageSize = 20, lastMessageId = null) {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    
    let constraints = [
      where('chatroomId', '==', chatroomId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    ];
    
    if (lastMessageId) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.MESSAGES, lastMessageId));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    const q = query(messagesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      messages: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Marks messages as read
   * 
   * @param {string} chatroomId - Chatroom ID
   * @returns {Promise<void>}
   */
  export async function markMessagesAsRead(chatroomId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to mark messages as read');
    }
    
    // Get unread messages for this user in the chatroom
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where('chatroomId', '==', chatroomId),
      where('recipient', '==', currentUser.uid),
      where('status.isRead', '==', false),
      where('isDeleted', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    // If no unread messages, return
    if (snapshot.empty) return;
    
    // Update status for each message
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    snapshot.forEach(doc => {
      const messageRef = doc.ref;
      batch.update(messageRef, {
        'status.isRead': true,
        'status.readAt': timestamp,
        updatedAt: timestamp
      });
    });
    
    // Update chatroom unread counter
    const chatroomRef = doc(db, COLLECTIONS.CHATROOMS, chatroomId);
    batch.update(chatroomRef, {
      [`counters.unreadCount.${currentUser.uid}`]: 0,
      updatedAt: timestamp
    });
    
    await batch.commit();
  }
  
  /**
   * Deletes a message (soft delete)
   * 
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  export async function deleteMessage(messageId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to delete messages');
    }
    
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }
    
    const message = messageDoc.data();
    
    // Check if current user is the sender
    if (message.sender !== currentUser.uid) {
      // If not the sender, just mark as deleted for this user
      await updateDoc(messageRef, {
        deletedFor: arrayUnion(currentUser.uid),
        updatedAt: serverTimestamp()
      });
    } else {
      // If sender, soft delete the message
      await BaseService.deleteDocument(COLLECTIONS.MESSAGES, messageId);
    }
  }
  