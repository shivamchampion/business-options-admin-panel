import { 
    collection, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    serverTimestamp,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS, LISTING_STATUS } from '../../config/constants';
  import { v4 as uuidv4 } from 'uuid';
  import { getListingValidationSchema } from '../../utils/validation/listing-schemas';
  
  export class ListingService {
    /**
     * Create a new listing with comprehensive validation
     * @param {Object} listingData - Complete listing data
     * @returns {Promise<string>} - Created listing ID
     */
    static async createListing(listingData) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create a listing');
      }
  
      // Validate listing data based on type
      const schema = getListingValidationSchema(listingData.type);
      try {
        await schema.validate(listingData, { abortEarly: false });
      } catch (validationError) {
        const errors = {};
        validationError.inner.forEach(err => {
          errors[err.path] = err.message;
        });
        throw new Error(JSON.stringify(errors));
      }
  
      // Prepare listing data
      const listingId = uuidv4();
      const timestamp = serverTimestamp();
  
      const listing = {
        ...listingData,
        id: listingId,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || currentUser.email,
        status: listingData.status || LISTING_STATUS.DRAFT,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        analytics: {
          viewCount: 0,
          uniqueViewCount: 0,
          contactCount: 0,
          favoriteCount: 0
        }
      };
  
      try {
        const listingsRef = collection(db, COLLECTIONS.LISTINGS);
        await addDoc(listingsRef, listing);
        return listingId;
      } catch (error) {
        console.error('Listing creation error:', error);
        throw new Error('Failed to create listing');
      }
    }
  
    /**
     * Update an existing listing
     * @param {string} listingId - Listing ID to update
     * @param {Object} updateData - Data to update
     * @returns {Promise<void>}
     */
    static async updateListing(listingId, updateData) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to update a listing');
      }
  
      // Validate update data
      const existingListing = await this.getListingById(listingId);
      if (!existingListing) {
        throw new Error('Listing not found');
      }
  
      const schema = getListingValidationSchema(existingListing.type);
      try {
        await schema.validate(updateData, { abortEarly: false });
      } catch (validationError) {
        const errors = {};
        validationError.inner.forEach(err => {
          errors[err.path] = err.message;
        });
        throw new Error(JSON.stringify(errors));
      }
  
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
      
      try {
        await updateDoc(listingRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
          version: (existingListing.version || 0) + 1
        });
      } catch (error) {
        console.error('Listing update error:', error);
        throw new Error('Failed to update listing');
      }
    }
  
    /**
     * Get a listing by ID
     * @param {string} listingId - Listing ID
     * @returns {Promise<Object|null>} - Listing data or null
     */
    static async getListingById(listingId) {
      try {
        const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
        const listingSnap = await getDoc(listingRef);
        
        return listingSnap.exists() 
          ? { id: listingSnap.id, ...listingSnap.data() } 
          : null;
      } catch (error) {
        console.error('Get listing error:', error);
        throw new Error('Failed to retrieve listing');
      }
    }
  
    /**
     * Get paginated listings with advanced filtering
     * @param {Object} filters - Filtering options
     * @param {number} pageSize - Number of listings per page
     * @param {Object} lastDocument - Last document for pagination
     * @returns {Promise<Object>} - Listings and pagination metadata
     */
    static async getListings(
      filters = {}, 
      pageSize = 10, 
      lastDocument = null
    ) {
      try {
        const listingsRef = collection(db, COLLECTIONS.LISTINGS);
        let queryConstraints = [
          where('isDeleted', '!=', true)
        ];
  
        // Dynamic filtering
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryConstraints.push(where(key, '==', value));
          }
        });
  
        // Default sorting
        queryConstraints.push(orderBy('createdAt', 'desc'));
  
        // Pagination
        if (lastDocument) {
          queryConstraints.push(startAfter(lastDocument));
        }
        queryConstraints.push(limit(pageSize + 1)); // Fetch one extra to check for more
  
        const listingsQuery = query(listingsRef, ...queryConstraints);
        const snapshot = await getDocs(listingsQuery);
  
        const listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        const hasMore = listings.length > pageSize;
        const finalListings = hasMore ? listings.slice(0, pageSize) : listings;
        const lastVisibleDoc = hasMore 
          ? snapshot.docs[pageSize - 1] 
          : snapshot.docs[snapshot.docs.length - 1];
  
        return {
          listings: finalListings,
          hasMore,
          lastDocument: lastVisibleDoc
        };
      } catch (error) {
        console.error('Listings fetch error:', error);
        throw new Error('Failed to retrieve listings');
      }
    }
  
    /**
     * Delete a listing
     * @param {string} listingId - Listing ID to delete
     * @returns {Promise<void>}
     */
    static async deleteListing(listingId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to delete a listing');
      }
  
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
  
      try {
        await updateDoc(listingRef, {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.uid
        });
      } catch (error) {
        console.error('Listing delete error:', error);
        throw new Error('Failed to delete listing');
      }
    }
  }