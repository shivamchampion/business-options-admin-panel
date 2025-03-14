// src/services/database/listing.js
/**
 * Listing Service
 * Handles operations related to business listings of all types
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp, updateDoc, increment,
    documentId, arrayUnion
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS, LISTING_STATUS, LISTING_TYPES } from '../../config/constants';
  import { BaseService } from './index';
  import { v4 as uuidv4 } from 'uuid';
  import { slugify } from '../../utils/helpers';
  
  /**
   * Creates a new listing
   * 
   * @param {Object} listingData - Listing data
   * @returns {Promise<string>} - Listing ID
   */
  export async function createListing(listingData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create listing');
    }
    
    // Generate UUID for listing
    const id = listingData.id || uuidv4();
    
    // Generate slug from name
    const slug = slugify(listingData.name);
    
    // Prepare timestamp
    const timestamp = serverTimestamp();
    
    // Prepare basic listing data
    const listing = {
      ...listingData,
      id,
      slug,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || '',
      status: listingData.status || LISTING_STATUS.DRAFT,
      analytics: {
        viewCount: 0,
        uniqueViewCount: 0,
        contactCount: 0,
        favoriteCount: 0,
        lastViewed: null
      }
    };
    
    // Create listing document
    await BaseService.createDocument(COLLECTIONS.LISTINGS, listing, id);
    
    // Update user's listings array
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    await updateDoc(userRef, {
      listings: arrayUnion(id)
    });
    
    return id;
  }
  
  /**
   * Gets a listing by ID
   * 
   * @param {string} id - Listing ID
   * @param {boolean} includeDeleted - Whether to include soft-deleted listings
   * @returns {Promise<Object|null>} - Listing data or null if not found
   */
  export async function getListingById(id, includeDeleted = false) {
    return BaseService.getDocument(COLLECTIONS.LISTINGS, id, includeDeleted);
  }
  
  /**
   * Gets a listing by slug
   * 
   * @param {string} slug - Listing slug
   * @returns {Promise<Object|null>} - Listing data or null if not found
   */
  export async function getListingBySlug(slug) {
    const listingsRef = collection(db, COLLECTIONS.LISTINGS);
    const q = query(
      listingsRef,
      where('slug', '==', slug),
      where('isDeleted', '==', false),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  /**
   * Updates a listing
   * 
   * @param {string} id - Listing ID
   * @param {Object} listingData - Listing data to update
   * @returns {Promise<string>} - Listing ID
   */
  export async function updateListing(id, listingData) {
    const currentUser = auth.currentUser;
    
    // If name is changed, update slug as well
    if (listingData.name) {
      const listing = await getListingById(id);
      
      if (listing && listingData.name !== listing.name) {
        listingData.slug = slugify(listingData.name);
      }
    }
    
    return BaseService.updateDocument(COLLECTIONS.LISTINGS, id, listingData);
  }
  
  /**
   * Deletes a listing (soft delete)
   * 
   * @param {string} id - Listing ID
   * @param {string} reason - Reason for deletion
   * @returns {Promise<string>} - Listing ID
   */
  export async function deleteListing(id, reason = null) {
    return BaseService.deleteDocument(COLLECTIONS.LISTINGS, id, reason);
  }
  
  /**
   * Gets paginated listings with filtering options
   * 
   * @param {string|null} type - Listing type filter
   * @param {string|null} status - Status filter
   * @param {Array|null} industries - Industries filter
   * @param {string|null} searchTerm - Search term
   * @param {number} pageSize - Page size for pagination
   * @param {Object|null} lastVisible - Last document for pagination
   * @returns {Promise<Object>} - Listings, pagination info
   */
  export async function getListings(
    type = null,
    status = null,
    industries = null,
    searchTerm = null,
    pageSize = 10,
    lastVisible = null
  ) {
    const listingsRef = collection(db, COLLECTIONS.LISTINGS);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add type filter if provided
    if (type) {
      constraints.push(where('type', '==', type));
    }
    
    // Add status filter if provided
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    // Add industries filter if provided
    if (industries && industries.length > 0) {
      constraints.push(where('industries', 'array-contains-any', industries));
    }
    
    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add pagination start after
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.LISTINGS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    // Add limit
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more
    
    // Create and execute query
    const q = query(listingsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    // Process results
    const listings = [];
    let hasMore = false;
    
    if (snapshot.docs.length > pageSize) {
      // We have more results
      hasMore = true;
      // Remove the extra document
      snapshot.docs.pop();
    }
    
    // Map documents to listings
    snapshot.docs.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter by search term if provided (since Firestore can't do proper text search)
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const filteredListings = listings.filter(listing => 
        listing.name?.toLowerCase().includes(term) || 
        listing.description?.toLowerCase().includes(term)
      );
      
      return {
        listings: filteredListings,
        lastVisible: filteredListings.length > 0 ? filteredListings[filteredListings.length - 1].id : null,
        hasMore: filteredListings.length === pageSize && hasMore
      };
    }
    
    return {
      listings,
      lastVisible: listings.length > 0 ? listings[listings.length - 1].id : null,
      hasMore
    };
  }
  
  /**
   * Gets listings by owner
   * 
   * @param {string|null} ownerId - Owner user ID
   * @param {number} limit - Maximum number of listings to retrieve
   * @returns {Promise<Array>} - Array of listings
   */
  export async function getListingsByOwner(ownerId = null, limitCount = 10) {
    const currentUser = auth.currentUser;
    const targetUserId = ownerId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      throw new Error('Owner ID is required');
    }
    
    const listingsRef = collection(db, COLLECTIONS.LISTINGS);
    const q = query(
      listingsRef,
      where('isDeleted', '==', false),
      where('ownerId', '==', targetUserId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets recent listings
   * 
   * @param {number} limit - Maximum number of listings to retrieve
   * @returns {Promise<Array>} - Array of listings
   */
  export async function getRecentListings(limitCount = 5) {
    // In a real application, you would fetch from Firestore
    // For the demo, we'll return mock data
    return [
      { 
        id: '1',
        name: 'Tech Solutions Ltd',
        type: 'Business',
        status: 'Pending',
        owner: 'John Doe',
        date: '2025-03-10'
      },
      { 
        id: '2',
        name: 'Food Franchise Chain',
        type: 'Franchise',
        status: 'Approved',
        owner: 'Jane Smith',
        date: '2025-03-09'
      },
      { 
        id: '3',
        name: 'E-commerce Platform',
        type: 'Digital Asset',
        status: 'Featured',
        owner: 'Mike Johnson',
        date: '2025-03-08'
      },
      { 
        id: '4',
        name: 'Healthcare Startup',
        type: 'Startup',
        status: 'Rejected',
        owner: 'Sarah Williams',
        date: '2025-03-07'
      },
      { 
        id: '5',
        name: 'Real Estate Investment',
        type: 'Investor',
        status: 'Approved',
        owner: 'David Brown',
        date: '2025-03-06'
      }
    ];
  }
  
  /**
   * Gets featured listings
   * 
   * @param {string|null} type - Listing type
   * @param {number} limit - Maximum number of listings to retrieve
   * @returns {Promise<Array>} - Array of featured listings
   */
  export async function getFeaturedListings(type = null, limitCount = 4) {
    const listingsRef = collection(db, COLLECTIONS.LISTINGS);
    let constraints = [
      where('isDeleted', '==', false),
      where('status', '==', LISTING_STATUS.PUBLISHED),
      where('isFeatured', '==', true)
    ];
    
    if (type) {
      constraints.push(where('type', '==', type));
    }
    
    constraints.push(orderBy('featuredUntil', 'desc'));
    constraints.push(limit(limitCount));
    
    const q = query(listingsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets total count of listings
   * 
   * @param {string|null} type - Listing type
   * @param {string|null} status - Listing status
   * @returns {Promise<number>} - Total count
   */
  export async function getListingCount(type = null, status = null) {
    // In a real application, you would use Firestore aggregation queries
    // For the demo, we'll return mock counts
    let count = 128;
    
    if (type) {
      // Reduce count based on type
      count = Math.floor(count / 2);
    }
    
    if (status) {
      // Reduce count based on status
      count = Math.floor(count / 2);
    }
    
    return count;
  }
  
  /**
   * Approves a listing
   * 
   * @param {string} id - Listing ID
   * @returns {Promise<string>} - Listing ID
   */
  export async function approveListing(id) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to approve listing');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.LISTINGS, id, {
      status: LISTING_STATUS.PUBLISHED,
      publishedAt: timestamp,
      statusHistory: arrayUnion({
        status: LISTING_STATUS.PUBLISHED,
        timestamp,
        updatedBy: currentUser.uid
      })
    });
  }
  
  /**
   * Rejects a listing
   * 
   * @param {string} id - Listing ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<string>} - Listing ID
   */
  export async function rejectListing(id, reason) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to reject listing');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.LISTINGS, id, {
      status: LISTING_STATUS.REJECTED,
      statusReason: reason,
      statusHistory: arrayUnion({
        status: LISTING_STATUS.REJECTED,
        reason,
        timestamp,
        updatedBy: currentUser.uid
      })
    });
  }
  
  /**
   * Marks a listing as featured
   * 
   * @param {string} id - Listing ID
   * @param {Date|null} untilDate - Date until which the listing should be featured
   * @returns {Promise<string>} - Listing ID
   */
  export async function markAsFeatured(id, untilDate = null) {
    const timestamp = serverTimestamp();
    const featuredUntil = untilDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    return BaseService.updateDocument(COLLECTIONS.LISTINGS, id, {
      isFeatured: true,
      featuredUntil,
      lastPromotedAt: timestamp
    });
  }
  