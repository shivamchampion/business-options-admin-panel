/**
 * Tag Service
 * Handles operations related to tag entities
 */
import { 
    collection, doc, getDoc, getDocs, query, where, 
    orderBy, limit, updateDoc, increment
  } from 'firebase/firestore';
  import { db } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  import { slugify } from '../../utils/helpers';
  
  /**
   * Creates a new tag
   * 
   * @param {Object} tagData - Tag data
   * @returns {Promise<string>} - Tag ID
   */
  export async function createTag(tagData) {
    // Create a slug from the name
    const slug = slugify(tagData.name);
    const id = tagData.id || slug;
    
    // Check if tag with this slug already exists
    const existingDoc = await getDoc(doc(db, COLLECTIONS.TAGS, id));
    if (existingDoc.exists()) {
      throw new Error(`Tag with ID or slug "${id}" already exists`);
    }
    
    // Prepare tag data
    const tagDoc = {
      id,
      name: tagData.name,
      slug,
      category: tagData.category || 'general',
      description: tagData.description || '',
      listingCount: 0,
      relevance: tagData.relevance || 0,
      isFeatured: tagData.isFeatured || false,
      color: tagData.color || '',
      icon: tagData.icon || ''
    };
    
    // Create tag document
    await BaseService.createDocument(COLLECTIONS.TAGS, tagDoc, id);
    
    return id;
  }
  
  /**
   * Gets a tag by ID
   * 
   * @param {string} id - Tag ID
   * @returns {Promise<Object|null>} - Tag data or null if not found
   */
  export async function getTagById(id) {
    return BaseService.getDocument(COLLECTIONS.TAGS, id);
  }
  
  /**
   * Gets a tag by slug
   * 
   * @param {string} slug - Tag slug
   * @returns {Promise<Object|null>} - Tag data or null if not found
   */
  export async function getTagBySlug(slug) {
    const tagsRef = collection(db, COLLECTIONS.TAGS);
    const q = query(
      tagsRef, 
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
   * Updates a tag
   * 
   * @param {string} id - Tag ID
   * @param {Object} tagData - Tag data to update
   * @returns {Promise<string>} - Tag ID
   */
  export async function updateTag(id, tagData) {
    return BaseService.updateDocument(COLLECTIONS.TAGS, id, tagData);
  }
  
  /**
   * Increments tag listing count
   * 
   * @param {string} id - Tag ID
   * @param {number} amount - Amount to increment (negative to decrement)
   * @returns {Promise<void>}
   */
  export async function incrementListingCount(id, amount = 1) {
    const tagRef = doc(db, COLLECTIONS.TAGS, id);
    await updateDoc(tagRef, {
      listingCount: increment(amount)
    });
  }
  
  /**
   * Gets tags with optional filtering
   * 
   * @param {string|null} category - Tag category
   * @param {boolean} featuredOnly - Whether to only get featured tags
   * @param {string} orderByField - Field to order by ('relevance', 'listingCount', 'name')
   * @param {number} limitCount - Maximum number of tags to retrieve
   * @returns {Promise<Array>} - Array of tags
   */
  export async function getTags(category = null, featuredOnly = false, orderByField = 'name', limitCount = 100) {
    const tagsRef = collection(db, COLLECTIONS.TAGS);
    let constraints = [where('isDeleted', '==', false)];
    
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    if (featuredOnly) {
      constraints.push(where('isFeatured', '==', true));
    }
    
    // Add ordering
    switch (orderByField) {
      case 'relevance':
        constraints.push(orderBy('relevance', 'desc'));
        break;
      case 'listingCount':
        constraints.push(orderBy('listingCount', 'desc'));
        break;
      default:
        constraints.push(orderBy('name', 'asc'));
    }
    
    // Add limit
    constraints.push(limit(limitCount));
    
    const q = query(tagsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets featured tags
   * 
   * @param {number} limitCount - Maximum number of tags to retrieve
   * @returns {Promise<Array>} - Array of featured tags
   */
  export async function getFeaturedTags(limitCount = 10) {
    return getTags(null, true, 'relevance', limitCount);
  }
  
  /**
   * Gets popular tags based on listing count
   * 
   * @param {number} limitCount - Maximum number of tags to retrieve
   * @returns {Promise<Array>} - Array of popular tags
   */
  export async function getPopularTags(limitCount = 10) {
    return getTags(null, false, 'listingCount', limitCount);
  }
  
  /**
   * Gets tags by category
   * 
   * @param {string} category - Tag category
   * @param {number} limitCount - Maximum number of tags to retrieve
   * @returns {Promise<Array>} - Array of tags in the category
   */
  export async function getTagsByCategory(category, limitCount = 20) {
    return getTags(category, false, 'name', limitCount);
  }
  
  /**
   * Creates multiple tags at once
   * 
   * @param {Array} tags - Array of tag data objects
   * @returns {Promise<Array>} - Array of created tag IDs
   */
  export async function createMultipleTags(tags) {
    const results = [];
    
    for (const tagData of tags) {
      try {
        const id = await createTag(tagData);
        results.push(id);
      } catch (error) {
        console.error(`Error creating tag ${tagData.name}:`, error);
      }
    }
    
    return results;
  }