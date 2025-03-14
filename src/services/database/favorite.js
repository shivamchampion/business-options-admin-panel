// src/services/database/favorite.js
/**
 * Favorite Service
 * Handles operations related to user favorites/bookmarks
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, increment, arrayUnion, arrayRemove
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Adds a listing to user's favorites
   * 
   * @param {string} listingId - Listing ID
   * @param {Object} options - Additional options (category, notes, etc.)
   * @returns {Promise<string>} - Favorite ID
   */
  export async function addFavorite(listingId, options = {}) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to add favorites');
    }
    
    // Check if listing exists
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }
    
    const listing = listingDoc.data();
    
    // Check if already favorited
    const existingFavorite = await getFavoriteByUserAndListing(currentUser.uid, listingId);
    
    if (existingFavorite) {
      // Update existing favorite
      return BaseService.updateDocument(COLLECTIONS.FAVORITES, existingFavorite.id, {
        ...options,
        updatedAt: serverTimestamp()
      });
    }
    
    // Create new favorite
    const favoriteData = {
      userId: currentUser.uid,
      listingId,
      listingType: listing.type,
      listingName: listing.name,
      ...options
    };
    
    const favoriteId = await BaseService.createDocument(COLLECTIONS.FAVORITES, favoriteData);
    
    // Update listing favorite count
    await updateDoc(listingRef, {
      'analytics.favoriteCount': increment(1)
    });
    
    // Update user's favorites array
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    await updateDoc(userRef, {
      favorites: arrayUnion(listingId)
    });
    
    // Log activity
    await BaseService.createDocument(COLLECTIONS.ACTIVITIES, {
      userId: currentUser.uid,
      type: 'favorite_listing',
      description: `Added ${listing.name} to favorites`,
      related: {
        listingId,
        listingName: listing.name,
        listingType: listing.type
      }
    });
    
    return favoriteId;
  }
  
  /**
   * Removes a listing from user's favorites
   * 
   * @param {string} listingId - Listing ID
   * @returns {Promise<void>}
   */
  export async function removeFavorite(listingId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to remove favorites');
    }
    
    // Find the favorite
    const favorite = await getFavoriteByUserAndListing(currentUser.uid, listingId);
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    // Delete the favorite
    await BaseService.deleteDocument(COLLECTIONS.FAVORITES, favorite.id);
    
    // Update listing favorite count
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      'analytics.favoriteCount': increment(-1)
    });
    
    // Update user's favorites array
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(listingId)
    });
  }
  
  /**
   * Gets a favorite by ID
   * 
   * @param {string} id - Favorite ID
   * @returns {Promise<Object|null>} - Favorite data or null if not found
   */
  export async function getFavoriteById(id) {
    return BaseService.getDocument(COLLECTIONS.FAVORITES, id);
  }
  
  /**
   * Gets a favorite by user ID and listing ID
   * 
   * @param {string} userId - User ID
   * @param {string} listingId - Listing ID
   * @returns {Promise<Object|null>} - Favorite data or null if not found
   */
  export async function getFavoriteByUserAndListing(userId, listingId) {
    const favoritesRef = collection(db, COLLECTIONS.FAVORITES);
    
    const q = query(
      favoritesRef,
      where('userId', '==', userId),
      where('listingId', '==', listingId),
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
   * Gets user's favorites with pagination
   * 
   * @param {string|null} userId - User ID (defaults to current user)
   * @param {string|null} category - Filter by category
   * @param {number} pageSize - Number of favorites per page
   * @param {string|null} lastFavoriteId - Last favorite ID for pagination
   * @returns {Promise<Object>} - Favorites and pagination info
   */
  export async function getUserFavorites(userId = null, category = null, pageSize = 10, lastFavoriteId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }
    
    const favoritesRef = collection(db, COLLECTIONS.FAVORITES);
    
    let constraints = [
      where('userId', '==', targetUserId)
    ];
    
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (lastFavoriteId) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.FAVORITES, lastFavoriteId));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    const q = query(favoritesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      favorites: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Updates a favorite
   * 
   * @param {string} id - Favorite ID
   * @param {Object} favoriteData - Favorite data to update
   * @returns {Promise<string>} - Favorite ID
   */
  export async function updateFavorite(id, favoriteData) {
    const currentUser = auth.currentUser;
    
    const favorite = await getFavoriteById(id);
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    // Check if user is the owner
    if (favorite.userId !== currentUser.uid) {
      throw new Error('Unauthorized to update this favorite');
    }
    
    return BaseService.updateDocument(COLLECTIONS.FAVORITES, id, favoriteData);
  }
  
  /**
   * Checks if a listing is favorited by a user
   * 
   * @param {string} listingId - Listing ID
   * @param {string|null} userId - User ID (defaults to current user)
   * @returns {Promise<boolean>} - Whether the listing is favorited
   */
  export async function isFavorited(listingId, userId = null) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      return false;
    }
    
    const favorite = await getFavoriteByUserAndListing(targetUserId, listingId);
    
    return favorite !== null;
  }