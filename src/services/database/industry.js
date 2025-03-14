/**
 * Industry Service
 * Handles operations related to industry classifications
 */
import { 
    collection, doc, getDoc, getDocs, query, 
    where, orderBy, limit, serverTimestamp
  } from 'firebase/firestore';
  import { db } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  import { slugify } from '../../utils/helpers';
  
  /**
   * Creates a new industry
   * 
   * @param {Object} industryData - Industry data
   * @returns {Promise<string>} - Industry ID
   */
  export async function createIndustry(industryData) {
    const slug = slugify(industryData.name);
    
    // Check if industry with this slug already exists
    const existingIndustry = await getIndustryBySlug(slug);
    if (existingIndustry) {
      throw new Error(`Industry with name '${industryData.name}' already exists`);
    }
    
    const industry = {
      ...industryData,
      slug,
      listingCount: 0,
      isSubIndustry: !!industryData.parentId,
      level: industryData.parentId ? 1 : 0
    };
    
    // Use slug as ID if available
    return BaseService.createDocument(COLLECTIONS.INDUSTRIES, industry, slug);
  }
  
  /**
   * Gets an industry by ID
   * 
   * @param {string} id - Industry ID
   * @returns {Promise<Object|null>} - Industry data or null if not found
   */
  export async function getIndustryById(id) {
    return BaseService.getDocument(COLLECTIONS.INDUSTRIES, id);
  }
  
  /**
   * Gets an industry by slug
   * 
   * @param {string} slug - Industry slug
   * @returns {Promise<Object|null>} - Industry data or null if not found
   */
  export async function getIndustryBySlug(slug) {
    const industriesRef = collection(db, COLLECTIONS.INDUSTRIES);
    const q = query(
      industriesRef,
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
   * Updates an industry
   * 
   * @param {string} id - Industry ID
   * @param {Object} industryData - Industry data to update
   * @returns {Promise<string>} - Industry ID
   */
  export async function updateIndustry(id, industryData) {
    // If name is changed, update slug as well
    if (industryData.name) {
      const industry = await getIndustryById(id);
      
      if (industry && industryData.name !== industry.name) {
        const newSlug = slugify(industryData.name);
        
        // Check if another industry with this slug exists
        const existingIndustry = await getIndustryBySlug(newSlug);
        if (existingIndustry && existingIndustry.id !== id) {
          throw new Error(`Industry with name '${industryData.name}' already exists`);
        }
        
        industryData.slug = newSlug;
      }
    }
    
    return BaseService.updateDocument(COLLECTIONS.INDUSTRIES, id, industryData);
  }
  
  /**
   * Gets all industries
   * 
   * @param {boolean} parentOnly - Whether to get only parent industries
   * @param {boolean} includeInactive - Whether to include inactive industries
   * @returns {Promise<Array>} - Array of industries
   */
  export async function getAllIndustries(parentOnly = false, includeInactive = false) {
    const industriesRef = collection(db, COLLECTIONS.INDUSTRIES);
    let constraints = [where('isDeleted', '==', false)];
    
    if (!includeInactive) {
      constraints.push(where('isVisible', '==', true));
    }
    
    if (parentOnly) {
      constraints.push(where('isSubIndustry', '==', false));
    }
    
    constraints.push(orderBy('order', 'asc'));
    
    const q = query(industriesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets sub-industries for a parent industry
   * 
   * @param {string} parentId - Parent industry ID
   * @returns {Promise<Array>} - Array of sub-industries
   */
  export async function getSubIndustries(parentId) {
    const industriesRef = collection(db, COLLECTIONS.INDUSTRIES);
    const q = query(
      industriesRef,
      where('isDeleted', '==', false),
      where('isVisible', '==', true),
      where('parentId', '==', parentId),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets featured industries
   * 
   * @param {number} count - Number of industries to retrieve
   * @returns {Promise<Array>} - Array of featured industries
   */
  export async function getFeaturedIndustries(count = 10) {
    const industriesRef = collection(db, COLLECTIONS.INDUSTRIES);
    const q = query(
      industriesRef,
      where('isDeleted', '==', false),
      where('isVisible', '==', true),
      where('isFeatured', '==', true),
      orderBy('order', 'asc'),
      limit(count)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Increments the listing count for an industry
   * 
   * @param {string} id - Industry ID
   * @returns {Promise<void>}
   */
  export async function incrementListingCount(id) {
    const docRef = doc(db, COLLECTIONS.INDUSTRIES, id);
    await BaseService.updateDocument(COLLECTIONS.INDUSTRIES, id, {
      listingCount: increment(1)
    });
  }