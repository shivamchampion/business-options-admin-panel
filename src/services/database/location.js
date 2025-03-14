/**
 * Location Service
 * Handles operations related to geographic locations
 */
import { 
    collection, doc, getDoc, getDocs, query, 
    where, orderBy, limit
  } from 'firebase/firestore';
  import { db } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new location
   * 
   * @param {Object} locationData - Location data
   * @returns {Promise<string>} - Location ID
   */
  export async function createLocation(locationData) {
    // Generate path for hierarchical locations
    let path = locationData.name.toLowerCase();
    
    if (locationData.parentId) {
      const parent = await getLocationById(locationData.parentId);
      if (parent) {
        path = `${parent.path}/${path}`;
      }
    }
    
    const location = {
      ...locationData,
      path,
      listingCount: 0
    };
    
    // Use path as ID if it's not too long
    const id = path.length <= 30 ? path.replace(/\//g, '-') : null;
    return BaseService.createDocument(COLLECTIONS.LOCATIONS, location, id);
  }
  
  /**
   * Gets a location by ID
   * 
   * @param {string} id - Location ID
   * @returns {Promise<Object|null>} - Location data or null if not found
   */
  export async function getLocationById(id) {
    return BaseService.getDocument(COLLECTIONS.LOCATIONS, id);
  }
  
  /**
   * Gets a location by path
   * 
   * @param {string} path - Location path
   * @returns {Promise<Object|null>} - Location data or null if not found
   */
  export async function getLocationByPath(path) {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('path', '==', path),
      where('isDeleted', '==', false),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  /**
   * Updates a location
   * 
   * @param {string} id - Location ID
   * @param {Object} locationData - Location data to update
   * @returns {Promise<string>} - Location ID
   */
  export async function updateLocation(id, locationData) {
    return BaseService.updateDocument(COLLECTIONS.LOCATIONS, id, locationData);
  }
  
  /**
   * Gets all countries
   * 
   * @returns {Promise<Array>} - Array of countries
   */
  export async function getCountries() {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('isDeleted', '==', false),
      where('type', '==', 'country'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets states for a country
   * 
   * @param {string} countryId - Country ID
   * @returns {Promise<Array>} - Array of states
   */
  export async function getStates(countryId) {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('isDeleted', '==', false),
      where('type', '==', 'state'),
      where('parentId', '==', countryId),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets cities for a state
   * 
   * @param {string} stateId - State ID
   * @returns {Promise<Array>} - Array of cities
   */
  export async function getCities(stateId) {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('isDeleted', '==', false),
      where('type', '==', 'city'),
      where('parentId', '==', stateId),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Gets popular locations
   * 
   * @param {number} count - Number of locations to retrieve
   * @returns {Promise<Array>} - Array of popular locations
   */
  export async function getPopularLocations(count = 10) {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('isDeleted', '==', false),
      where('isFeatured', '==', true),
      orderBy('listingCount', 'desc'),
      limit(count)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Searches for locations
   * 
   * @param {string} searchTerm - Search term
   * @param {string} type - Location type (optional)
   * @param {number} count - Number of results to retrieve
   * @returns {Promise<Array>} - Array of locations
   */
  export async function searchLocations(searchTerm, type = null, count = 10) {
    // Firestore doesn't support direct text search
    // In production, consider using Algolia or another search service
    
    // For basic functionality, we can query for locations that start with the search term
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    let constraints = [
      where('isDeleted', '==', false),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    ];
    
    if (type) {
      constraints.push(where('type', '==', type));
    }
    
    constraints.push(limit(count));
    
    const q = query(locationsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }