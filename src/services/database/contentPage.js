/**
 * Content Page Service
 * Handles operations related to CMS content pages
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, startAfter, serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  import { slugify } from '../../utils/helpers';
  
  /**
   * Creates a new content page
   * 
   * @param {Object} pageData - Content page data
   * @returns {Promise<string>} - Content page ID
   */
  export async function createContentPage(pageData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create content');
    }
    
    // Generate a slug if not provided
    const slug = pageData.slug || slugify(pageData.title);
    
    // Check if page with this slug already exists
    const existingPage = await getContentPageBySlug(slug);
    if (existingPage) {
      throw new Error(`Page with slug "${slug}" already exists`);
    }
    
    // Prepare page data
    const page = {
      ...pageData,
      slug,
      status: pageData.status || 'draft',
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Admin',
      version: 1
    };
    
    // Set published date if status is published
    if (page.status === 'published') {
      page.publishedAt = serverTimestamp();
    }
    
    return BaseService.createDocument(COLLECTIONS.CONTENT_PAGES, page);
  }
  
  /**
   * Gets a content page by ID
   * 
   * @param {string} id - Content page ID
   * @returns {Promise<Object|null>} - Content page data or null if not found
   */
  export async function getContentPageById(id) {
    return BaseService.getDocument(COLLECTIONS.CONTENT_PAGES, id);
  }
  
  /**
   * Gets a content page by slug
   * 
   * @param {string} slug - Content page slug
   * @returns {Promise<Object|null>} - Content page data or null if not found
   */
  export async function getContentPageBySlug(slug) {
    const contentPagesRef = collection(db, COLLECTIONS.CONTENT_PAGES);
    
    const q = query(
      contentPagesRef,
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
   * Updates a content page
   * 
   * @param {string} id - Content page ID
   * @param {Object} pageData - Content page data to update
   * @returns {Promise<string>} - Content page ID
   */
  export async function updateContentPage(id, pageData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to update content');
    }
    
    const contentPage = await getContentPageById(id);
    
    if (!contentPage) {
      throw new Error('Content page not found');
    }
    
    // If status is being changed to published, set publishedAt
    const updateData = { ...pageData };
    
    if (pageData.status === 'published' && contentPage.status !== 'published') {
      updateData.publishedAt = serverTimestamp();
    }
    
    // If title is changed and no slug is provided, update slug
    if (pageData.title && !pageData.slug && pageData.title !== contentPage.title) {
      updateData.slug = slugify(pageData.title);
      
      // Check if new slug already exists
      const existingPage = await getContentPageBySlug(updateData.slug);
      if (existingPage && existingPage.id !== id) {
        throw new Error(`Page with slug "${updateData.slug}" already exists`);
      }
    }
    
    // Track version history
    updateData.version = (contentPage.version || 1) + 1;
    updateData.versionHistory = [
      ...(contentPage.versionHistory || []),
      {
        version: updateData.version,
        content: contentPage.content,
        changedBy: currentUser.uid,
        changedAt: serverTimestamp()
      }
    ];
    
    return BaseService.updateDocument(COLLECTIONS.CONTENT_PAGES, id, updateData);
  }
  
  /**
   * Gets content pages with pagination and filtering
   * 
   * @param {Object} filters - Filters to apply (status, category, etc.)
   * @param {number} pageSize - Number of pages per page
   * @param {string|null} lastVisible - Last document ID for pagination
   * @returns {Promise<Object>} - Paginated results
   */
  export async function getContentPages(filters = {}, pageSize = 10, lastVisible = null) {
    const contentPagesRef = collection(db, COLLECTIONS.CONTENT_PAGES);
    let constraints = [where('isDeleted', '==', false)];
    
    // Add filters
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.showInNavigation) {
      constraints.push(where('showInNavigation', '==', true));
    }
    
    // Add ordering
    if (filters.orderBy) {
      constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'asc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    // Add pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(db, COLLECTIONS.CONTENT_PAGES, lastVisible));
      if (lastDoc.exists()) {
        constraints.push(startAfter(lastDoc));
      }
    }
    
    constraints.push(limit(pageSize));
    
    // Execute query
    const q = query(contentPagesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      pages: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
      hasMore: snapshot.docs.length >= pageSize
    };
  }
  
  /**
   * Gets navigation menu items
   * 
   * @returns {Promise<Array>} - Array of navigation items
   */
  export async function getNavigationItems() {
    const contentPagesRef = collection(db, COLLECTIONS.CONTENT_PAGES);
    
    const q = query(
      contentPagesRef,
      where('isDeleted', '==', false),
      where('status', '==', 'published'),
      where('showInNavigation', '==', true),
      orderBy('navigationOrder', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().navigationLabel || doc.data().title,
      slug: doc.data().slug,
      order: doc.data().navigationOrder
    }));
  }
  
  /**
   * Publishes a content page
   * 
   * @param {string} id - Content page ID
   * @returns {Promise<string>} - Content page ID
   */
  export async function publishContentPage(id) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to publish content');
    }
    
    const timestamp = serverTimestamp();
    
    return BaseService.updateDocument(COLLECTIONS.CONTENT_PAGES, id, {
      status: 'published',
      publishedAt: timestamp,
      updatedAt: timestamp
    });
  }
  
  /**
   * Gets site settings pages (terms, privacy, etc.)
   * 
   * @returns {Promise<Object>} - Object with page data by type
   */
  export async function getSiteSettingsPages() {
    const contentPagesRef = collection(db, COLLECTIONS.CONTENT_PAGES);
    
    const q = query(
      contentPagesRef,
      where('isDeleted', '==', false),
      where('status', '==', 'published'),
      where('category', '==', 'site-settings')
    );
    
    const snapshot = await getDocs(q);
    
    const result = {};
    
    snapshot.docs.forEach(doc => {
      const page = doc.data();
      if (page.template) {
        result[page.template] = {
          id: doc.id,
          ...page
        };
      }
    });
    
    return result;
  }