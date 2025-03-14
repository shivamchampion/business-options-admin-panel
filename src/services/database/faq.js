/**
 * FAQ Service
 * Handles operations related to frequently asked questions
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, serverTimestamp, startAfter
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  import { slugify } from '../../utils/helpers';
  
  /**
   * Creates a new FAQ
   * 
   * @param {Object} faqData - FAQ data
   * @returns {Promise<string>} - FAQ ID
   */
  export async function createFaq(faqData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create FAQs');
    }
    
    // Generate ID from question if not provided
    const id = faqData.id || slugify(faqData.question.substring(0, 50));
    
    // Prepare FAQ data
    const faq = {
      ...faqData,
      isPublished: faqData.isPublished !== undefined ? faqData.isPublished : true
    };
    
    return BaseService.createDocument(COLLECTIONS.FAQS, faq, id);
  }
  
  /**
   * Gets an FAQ by ID
   * 
   * @param {string} id - FAQ ID
   * @returns {Promise<Object|null>} - FAQ data or null if not found
   */
  export async function getFaqById(id) {
    return BaseService.getDocument(COLLECTIONS.FAQS, id);
  }
  
  /**
   * Updates an FAQ
   * 
   * @param {string} id - FAQ ID
   * @param {Object} faqData - FAQ data to update
   * @returns {Promise<string>} - FAQ ID
   */
  export async function updateFaq(id, faqData) {
    return BaseService.updateDocument(COLLECTIONS.FAQS, id, faqData);
  }
  
  /**
   * Gets FAQs with filtering and pagination
   * 
   * @param {Object} filters - Filters to apply (category, published, etc.)
   * @param {number} pageSize - Number of FAQs per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getFaqs(filters = {}, pageSize = 20, lastVisible = null) {
    const faqsRef = collection(db, COLLECTIONS.FAQS);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add filters
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.subcategory) {
      constraints.push(where('subcategory', '==', filters.subcategory));
    }
    
    if (filters.isPublished !== undefined) {
      constraints.push(where('isPublished', '==', filters.isPublished));
    }
    
    if (filters.showOnHomepage !== undefined) {
      constraints.push(where('showOnHomepage', '==', filters.showOnHomepage));
    }
    
    // Add ordering
    if (filters.orderBy) {
      constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'asc'));
    } else {
      constraints.push(orderBy('order', 'asc'));
    }
    
    // Add pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.FAQS, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(faqsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      faqs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Gets FAQs by category
   * 
   * @param {string} category - FAQ category
   * @param {boolean} publishedOnly - Whether to only get published FAQs
   * @returns {Promise<Array>} - Array of FAQs
   */
  export async function getFaqsByCategory(category, publishedOnly = true) {
    const faqsRef = collection(db, COLLECTIONS.FAQS);
    let constraints = [
      where('isDeleted', '==', false),
      where('category', '==', category)
    ];
    
    if (publishedOnly) {
      constraints.push(where('isPublished', '==', true));
    }
    
    constraints.push(orderBy('order', 'asc'));
    
    const q = query(faqsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets homepage FAQs
   * 
   * @param {number} limit - Maximum number of FAQs to retrieve
   * @returns {Promise<Array>} - Array of FAQs
   */
  export async function getHomepageFaqs(limitCount = 5) {
    const faqsRef = collection(db, COLLECTIONS.FAQS);
    
    const q = query(
      faqsRef,
      where('isDeleted', '==', false),
      where('isPublished', '==', true),
      where('showOnHomepage', '==', true),
      orderBy('order', 'asc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets FAQ categories
   * 
   * @returns {Promise<Array>} - Array of unique categories
   */
  export async function getFaqCategories() {
    const faqsRef = collection(db, COLLECTIONS.FAQS);
    
    const q = query(
      faqsRef,
      where('isDeleted', '==', false),
      where('isPublished', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    // Extract unique categories
    const categories = new Set();
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categories.add(category);
      }
    });
    
    return Array.from(categories);
  }
  
  /**
   * Searches FAQs
   * 
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Array of matching FAQs
   */
  export async function searchFaqs(query, limitCount = 10) {
    // Firestore doesn't support full-text search natively
    // For basic functionality, we'll do a client-side search
    
    const faqsRef = collection(db, COLLECTIONS.FAQS);
    
    const q = query(
      faqsRef,
      where('isDeleted', '==', false),
      where('isPublished', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    // Simple search implementation
  const searchQuery = query.toLowerCase();
  
  const results = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(faq => {
      // Search in question and answer
      return (
        faq.question.toLowerCase().includes(searchQuery) ||
        faq.answer.toLowerCase().includes(searchQuery)
      );
    })
    .slice(0, limitCount);
  
  return results;
}

/**
 * Publishes or unpublishes an FAQ
 * 
 * @param {string} id - FAQ ID
 * @param {boolean} isPublished - Publication status
 * @returns {Promise<string>} - FAQ ID
 */
export async function publishFaq(id, isPublished = true) {
  const timestamp = serverTimestamp();
  
  return BaseService.updateDocument(COLLECTIONS.FAQS, id, {
    isPublished,
    updatedAt: timestamp
  });
}

/**
 * Sets FAQ homepage visibility
 * 
 * @param {string} id - FAQ ID
 * @param {boolean} showOnHomepage - Homepage visibility
 * @returns {Promise<string>} - FAQ ID
 */
export async function setFaqHomepageVisibility(id, showOnHomepage = true) {
  const timestamp = serverTimestamp();
  
  return BaseService.updateDocument(COLLECTIONS.FAQS, id, {
    showOnHomepage,
    updatedAt: timestamp
  });
}

/**
 * Reorders FAQs
 * 
 * @param {Array} orderedIds - Array of FAQ IDs in desired order
 * @returns {Promise<void>}
 */
export async function reorderFaqs(orderedIds) {
  const batch = db.batch();
  
  orderedIds.forEach((id, index) => {
    const docRef = doc(db, COLLECTIONS.FAQS, id);
    batch.update(docRef, {
      order: index,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
}

/**
 * Gets related FAQs for a specific FAQ
 * 
 * @param {string} id - FAQ ID
 * @param {number} limit - Maximum number of related FAQs
 * @returns {Promise<Array>} - Array of related FAQs
 */
export async function getRelatedFaqs(id, limitCount = 3) {
  const faq = await getFaqById(id);
  
  if (!faq) {
    return [];
  }
  
  // Get FAQs in the same category
  const faqsRef = collection(db, COLLECTIONS.FAQS);
  
  const q = query(
    faqsRef,
    where('isDeleted', '==', false),
    where('isPublished', '==', true),
    where('category', '==', faq.category),
    where(documentId(), '!=', id),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}