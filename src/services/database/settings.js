/**
 * Settings Service
 * Handles operations related to application settings
 */
import { 
    doc, getDoc, setDoc, serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  
  /**
   * Gets settings by category
   * 
   * @param {string} category - Settings category
   * @returns {Promise<Object|null>} - Settings data or null if not found
   */
  export async function getSettings(category) {
    const docRef = doc(db, COLLECTIONS.SETTINGS, category);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    return null;
  }
  
  /**
   * Updates settings
   * 
   * @param {string} category - Settings category
   * @param {Object} settingsData - Settings data to update
   * @returns {Promise<string>} - Settings category
   */
  export async function updateSettings(category, settingsData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to update settings');
    }
    
    const docRef = doc(db, COLLECTIONS.SETTINGS, category);
    
    await setDoc(docRef, {
      ...settingsData,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    }, { merge: true });
    
    return category;
  }
  
  /**
   * Gets all settings
   * 
   * @returns {Promise<Object>} - Object with all settings by category
   */
  export async function getAllSettings() {
    const categories = ['general', 'email', 'integrations', 'content', 'database'];
    const settings = {};
    
    for (const category of categories) {
      settings[category] = await getSettings(category);
    }
    
    return settings;
  }
  
  /**
   * Gets general settings
   * 
   * @returns {Promise<Object|null>} - General settings or null if not found
   */
  export async function getGeneralSettings() {
    return getSettings('general');
  }
  
  /**
   * Updates general settings
   * 
   * @param {Object} settingsData - General settings data to update
   * @returns {Promise<string>} - Settings category
   */
  export async function updateGeneralSettings(settingsData) {
    return updateSettings('general', settingsData);
  }
  
  /**
   * Gets email settings
   * 
   * @returns {Promise<Object|null>} - Email settings or null if not found
   */
  export async function getEmailSettings() {
    return getSettings('email');
}

/**
 * Updates email settings
 * 
 * @param {Object} settingsData - Email settings data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateEmailSettings(settingsData) {
  return updateSettings('email', settingsData);
}

/**
 * Gets integration settings
 * 
 * @returns {Promise<Object|null>} - Integration settings or null if not found
 */
export async function getIntegrationSettings() {
  return getSettings('integrations');
}

/**
 * Updates integration settings
 * 
 * @param {Object} settingsData - Integration settings data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateIntegrationSettings(settingsData) {
  return updateSettings('integrations', settingsData);
}

/**
 * Gets content settings
 * 
 * @returns {Promise<Object|null>} - Content settings or null if not found
 */
export async function getContentSettings() {
  return getSettings('content');
}

/**
 * Updates content settings
 * 
 * @param {Object} settingsData - Content settings data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateContentSettings(settingsData) {
  return updateSettings('content', settingsData);
}

/**
 * Gets database settings
 * 
 * @returns {Promise<Object|null>} - Database settings or null if not found
 */
export async function getDatabaseSettings() {
  return getSettings('database');
}

/**
 * Updates database settings
 * 
 * @param {Object} settingsData - Database settings data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateDatabaseSettings(settingsData) {
  return updateSettings('database', settingsData);
}

/**
 * Gets the database schema version
 * 
 * @returns {Promise<string|null>} - Schema version or null if not found
 */
export async function getDatabaseSchemaVersion() {
  const settings = await getDatabaseSettings();
  return settings?.schemaVersion || null;
}

/**
 * Gets site maintenance status
 * 
 * @returns {Promise<boolean>} - Whether site is in maintenance mode
 */
export async function getSiteMaintenance() {
  const settings = await getGeneralSettings();
  return settings?.isMaintenanceMode || false;
}

/**
 * Sets site maintenance mode
 * 
 * @param {boolean} isEnabled - Whether to enable maintenance mode
 * @param {string} message - Maintenance message
 * @returns {Promise<string>} - Settings category
 */
export async function setSiteMaintenance(isEnabled, message = null) {
  const updates = {
    isMaintenanceMode: isEnabled
  };
  
  if (message) {
    updates.maintenanceMessage = message;
  }
  
  return updateGeneralSettings(updates);
}

/**
 * Gets the site theme settings
 * 
 * @returns {Promise<Object|null>} - Theme settings or null if not found
 */
export async function getThemeSettings() {
  const settings = await getSettings('theme');
  return settings || null;
}

/**
 * Updates the site theme settings
 * 
 * @param {Object} themeData - Theme settings data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateThemeSettings(themeData) {
  return updateSettings('theme', themeData);
}

/**
 * Gets homepage section visibility settings
 * 
 * @returns {Promise<Object|null>} - Section visibility settings or defaults
 */
export async function getHomepageSections() {
  const theme = await getThemeSettings();
  
  // Return defaults if no settings found
  if (!theme || !theme.homepageSections) {
    return {
      hero: true,
      search: true,
      featuredBusinesses: true,
      popularFranchises: true,
      trendingStartups: true,
      topInvestors: true,
      latestDigitalAssets: true,
      testimonials: true,
      blogPosts: true,
      newsletter: true
    };
  }
  
  return theme.homepageSections;
}

/**
 * Updates homepage section visibility settings
 * 
 * @param {Object} sectionData - Section visibility data to update
 * @returns {Promise<string>} - Settings category
 */
export async function updateHomepageSections(sectionData) {
  return updateSettings('theme', {
    homepageSections: sectionData
  });
}