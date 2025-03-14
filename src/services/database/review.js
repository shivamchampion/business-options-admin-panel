// src/services/database/review.js
/**
 * Review Service
 * Handles operations related to listing reviews
 */
import { 
    collection, doc, getDoc, getDocs, query, where,
    orderBy, limit, deleteDoc, serverTimestamp,
    increment
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new review
   * 
   * @param {Object} reviewData - Review data
   * @returns {Promise<string>} - Review ID
   */
  export async function createReview(reviewData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a review');
    }
    
    // Check if user has already reviewed this listing
    const existingReview = await getUserReviewForListing(currentUser.uid, reviewData.listingId);
    
    if (existingReview) {
      throw new Error('You have already reviewed this listing');
    }
    
    // Get user details
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const timestamp = serverTimestamp();
    
    // Create review document
    const review = {
      ...reviewData,
      userId: currentUser.uid,
      author: {
        name: userDoc.data().displayName || 'Anonymous',
        photo: userDoc.data().profileImage?.url || '',
        isVerified: userDoc.data().verification?.isIdentityVerified || false,
        previousReviews: 0, // This would be calculated in a real application
        memberSince: userDoc.data().createdAt
      },
      visibility: {
        isPublic: true,
        status: 'pending'
      },
      engagement: {
        helpfulCount: 0,
        unhelpfulCount: 0,
        reportCount: 0,
        commentCount: 0
      },
      helpfulness: {
        upvotes: 0,
        downvotes: 0,
        voterIds: []
      }
    };
    
    const reviewId = await BaseService.createDocument(COLLECTIONS.REVIEWS, review);
    
    // Update listing rating
    await updateListingRating(reviewData.listingId);
    
    return reviewId;
  }
  
  /**
   * Gets a review by ID
   * 
   * @param {string} id - Review ID
   * @returns {Promise<Object|null>} - Review data or null if not found
   */
  export async function getReviewById(id) {
    return BaseService.getDocument(COLLECTIONS.REVIEWS, id);
  }
  
  /**
   * Updates a review
   * 
   * @param {string} id - Review ID
   * @param {Object} reviewData - Review data to update
   * @returns {Promise<string>} - Review ID
   */
  export async function updateReview(id, reviewData) {
    const currentUser = auth.currentUser;
    
    const review = await getReviewById(id);
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Check if user is the author or an admin
    if (review.userId !== currentUser.uid && currentUser.role !== 'admin') {
      throw new Error('Unauthorized to update this review');
    }
    
    // Keep track of original rating and text for history
    const updateData = {
      ...reviewData,
      history: {
        originalRating: review.rating,
        originalText: review.content?.text,
        editCount: (review.history?.editCount || 0) + 1,
        lastEditedAt: serverTimestamp()
      }
    };
    
    await BaseService.updateDocument(COLLECTIONS.REVIEWS, id, updateData);
    
    // Update listing rating if rating was changed
    if (reviewData.rating && reviewData.rating !== review.rating) {
      await updateListingRating(review.listingId);
    }
    
    return id;
  }
  
  /**
   * Deletes a review
   * 
   * @param {string} id - Review ID
   * @returns {Promise<string>} - Review ID
   */
  export async function deleteReview(id) {
    const currentUser = auth.currentUser;
    
    const review = await getReviewById(id);
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Check if user is the author or an admin
    if (review.userId !== currentUser.uid && currentUser.role !== 'admin') {
      throw new Error('Unauthorized to delete this review');
    }
    
    await BaseService.deleteDocument(COLLECTIONS.REVIEWS, id);
    
    // Update listing rating
    await updateListingRating(review.listingId);
    
    return id;
  }
  
  /**
   * Gets reviews for a listing
   * 
   * @param {string} listingId - Listing ID
   * @param {number} limitCount - Maximum number of reviews to retrieve
   * @returns {Promise<Array>} - Array of reviews
   */
  export async function getListingReviews(listingId, limitCount = 10) {
    const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where('isDeleted', '==', false),
      where('listingId', '==', listingId),
      where('visibility.isPublic', '==', true),
      where('visibility.status', '==', 'live'),
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
   * Gets reviews by a user
   * 
   * @param {string} userId - User ID
   * @param {number} limitCount - Maximum number of reviews to retrieve
   * @returns {Promise<Array>} - Array of reviews
   */
  export async function getUserReviews(userId, limitCount = 10) {
    const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where('isDeleted', '==', false),
      where('userId', '==', userId),
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
   * Gets a user's review for a specific listing
   * 
   * @param {string} userId - User ID
   * @param {string} listingId - Listing ID
   * @returns {Promise<Object|null>} - Review data or null if not found
   */
  export async function getUserReviewForListing(userId, listingId) {
    const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where('isDeleted', '==', false),
      where('userId', '==', userId),
      where('listingId', '==', listingId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  /**
   * Updates the rating of a listing based on its reviews
   * 
   * @param {string} listingId - Listing ID
   * @returns {Promise<void>}
   */
  async function updateListingRating(listingId) {
    // Get all published reviews for the listing
    const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
    const q = query(
      reviewsRef,
      where('isDeleted', '==', false),
      where('listingId', '==', listingId),
      where('visibility.isPublic', '==', true),
      where('visibility.status', '==', 'live')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // No reviews, reset rating
      const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
      await updateDoc(listingRef, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.distribution': {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0
        }
      });
      return;
    }
    
    // Calculate average rating and distribution
    let totalRating = 0;
    let distribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };
    
    snapshot.forEach(doc => {
      const rating = doc.data().rating;
      totalRating += rating;
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    const averageRating = totalRating / snapshot.size;
    
    // Update listing
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      'rating.average': averageRating,
      'rating.count': snapshot.size,
      'rating.distribution': distribution,
      reviewCount: snapshot.size
    });
  }
  
  /**
   * Votes on review helpfulness
   * 
   * @param {string} reviewId - Review ID
   * @param {boolean} isHelpful - Whether the review is helpful
   * @returns {Promise<void>}
   */
  export async function voteReviewHelpfulness(reviewId, isHelpful) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to vote');
    }
    
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const review = reviewDoc.data();
    
    // Check if user has already voted
    if (review.helpfulness.voterIds.includes(currentUser.uid)) {
      throw new Error('You have already voted on this review');
    }
    
    // Update vote counts
    await updateDoc(reviewRef, {
      [`helpfulness.${isHelpful ? 'upvotes' : 'downvotes'}`]: increment(1),
      'helpfulness.voterIds': arrayUnion(currentUser.uid),
      [`engagement.${isHelpful ? 'helpfulCount' : 'unhelpfulCount'}`]: increment(1)
    });
  }
  
  /**
   * Reports a review
   * 
   * @param {string} reviewId - Review ID
   * @param {string} reason - Reason for reporting
   * @returns {Promise<void>}
   */
  export async function reportReview(reviewId, reason) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to report a review');
    }
    
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    // Create a report
    await BaseService.createDocument(COLLECTIONS.REPORTS, {
      type: 'review',
      targetId: reviewId,
      reportedBy: currentUser.uid,
      reason,
      status: 'pending',
      priority: 'medium'
    });
    
    // Update review report count
    await updateDoc(reviewRef, {
      'engagement.reportCount': increment(1),
      'engagement.reportReasons': arrayUnion(reason)
    });
  }