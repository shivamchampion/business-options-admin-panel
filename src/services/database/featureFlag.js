/**
 * Feature Flag Service
 * Handles operations related to feature toggles and A/B testing
 */
import { 
    doc, getDoc, setDoc, collection, getDocs, query, where, 
    serverTimestamp
  } from 'firebase/firestore';
  import { db, auth } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  
  /**
   * Gets a feature flag by ID
   * 
   * @param {string} id - Feature flag ID
   * @returns {Promise<Object|null>} - Feature flag data or null if not found
   */
  export async function getFeatureFlag(id) {
    const docRef = doc(db, COLLECTIONS.FEATURE_FLAGS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
  }
  
  /**
   * Creates or updates a feature flag
   * 
   * @param {string} id - Feature flag ID
   * @param {Object} flagData - Feature flag data
   * @returns {Promise<string>} - Feature flag ID
   */
  export async function setFeatureFlag(id, flagData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to update feature flags');
    }
    
    const timestamp = serverTimestamp();
    
    const flag = {
      ...flagData,
      updatedAt: timestamp,
      updatedBy: currentUser.uid
    };
    
    // Check if flag exists
    const existingFlag = await getFeatureFlag(id);
    
    if (!existingFlag) {
      // Create new flag
      flag.createdAt = timestamp;
      flag.createdBy = currentUser.uid;
    }
    
    const docRef = doc(db, COLLECTIONS.FEATURE_FLAGS, id);
    await setDoc(docRef, flag, { merge: true });
    
    return id;
  }
  
  /**
   * Enables a feature flag
   * 
   * @param {string} id - Feature flag ID
   * @param {boolean} enableInProduction - Whether to enable in production
   * @returns {Promise<string>} - Feature flag ID
   */
  export async function enableFeatureFlag(id, enableInProduction = false) {
    const flag = await getFeatureFlag(id);
    
    if (!flag) {
      throw new Error('Feature flag not found');
    }
    
    // Update environment settings
    const environment = {
      ...flag.environment,
      development: true,
      staging: true
    };
    
    if (enableInProduction) {
      environment.production = true;
    }
    
    return setFeatureFlag(id, {
      isEnabled: true,
      environment
    });
  }
  
  /**
   * Disables a feature flag
   * 
   * @param {string} id - Feature flag ID
   * @returns {Promise<string>} - Feature flag ID
   */
  export async function disableFeatureFlag(id) {
    const flag = await getFeatureFlag(id);
    
    if (!flag) {
      throw new Error('Feature flag not found');
    }
    
    return setFeatureFlag(id, {
      isEnabled: false
    });
  }
  
  /**
   * Gets all feature flags
   * 
   * @param {boolean} activeOnly - Whether to only get active flags
   * @returns {Promise<Array>} - Array of feature flags
   */
  export async function getAllFeatureFlags(activeOnly = false) {
    const flagsRef = collection(db, COLLECTIONS.FEATURE_FLAGS);
    
    let constraints = [];
    
    if (activeOnly) {
      constraints.push(where('isEnabled', '==', true));
    }
    
    const q = query(flagsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Updates feature flag rollout percentage
   * 
   * @param {string} id - Feature flag ID
   * @param {number} percentage - Rollout percentage (0-100)
   * @returns {Promise<string>} - Feature flag ID
   */
  export async function updateFeatureFlagRollout(id, percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    
    return setFeatureFlag(id, {
      rolloutPercentage: percentage
    });
  }
  
  /**
   * Checks if a feature flag is enabled for a user
   * 
   * @param {string} id - Feature flag ID
   * @param {string} userId - User ID
   * @param {string} environment - Environment ('development', 'staging', 'production')
   * @returns {Promise<boolean>} - Whether the feature is enabled for the user
   */
  export async function isFeatureEnabledForUser(id, userId, environment = 'production') {
    const flag = await getFeatureFlag(id);
    
    // Feature doesn't exist or is disabled
    if (!flag || !flag.isEnabled) {
      return false;
    }
    
    // Feature is not enabled in this environment
    if (!flag.environment || !flag.environment[environment]) {
      return false;
    }
    
    // Check user segments if specified
    if (flag.userSegments && flag.userSegments.length > 0) {
      // This would need to be implemented based on how user segments are defined
      // For example, checking if the user belongs to any of the specified segments
      return false; // Placeholder
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // Deterministic check based on user ID
      const hash = hashString(userId);
      const userPercentile = hash % 100;
      
      return userPercentile < flag.rolloutPercentage;
    }
    
    // Default: feature is enabled
    return true;
  }
  
  /**
   * Gets A/B test variant for a user
   * 
   * @param {string} id - Feature flag ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Test variant or null if not applicable
   */
  export async function getTestVariantForUser(id, userId) {
    const flag = await getFeatureFlag(id);
    
    // Feature doesn't exist, is disabled, or is not a test
    if (!flag || !flag.isEnabled || !flag.isTest || !flag.testVariants || flag.testVariants.length === 0) {
      return null;
    }
    
    // Deterministic variant selection based on user ID
    const hash = hashString(userId);
    const variantIndex = hash % flag.testVariants.length;
    
    return flag.testVariants[variantIndex];
  }
  
  /**
   * Creates a simple hash from a string
   * 
   * @param {string} str - String to hash
   * @returns {number} - Hash value
   */
  function hashString(str) {
    let hash = 0;
    
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }
  
  /**
   * Gets active feature flags for the current environment
   * 
   * @param {string} environment - Environment ('development', 'staging', 'production')
   * @returns {Promise<Array>} - Array of active feature flags
   */
  export async function getActiveFeatureFlags(environment = 'production') {
    const flagsRef = collection(db, COLLECTIONS.FEATURE_FLAGS);
    
    const q = query(
      flagsRef,
      where('isEnabled', '==', true),
      where(`environment.${environment}`, '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Creates a new A/B test
   * 
   * @param {string} id - Test ID
   * @param {string} description - Test description
   * @param {Array} variants - Test variants
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Feature flag ID
   */
  export async function createABTest(id, description, variants, options = {}) {
    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length < 2) {
      throw new Error('At least two variants are required for an A/B test');
    }
    
    // Ensure variants have weights that sum to 100
    let totalWeight = variants.reduce((sum, variant) => sum + (variant.weight || 0), 0);
    
    if (totalWeight === 0) {
      // Distribute weight evenly if not specified
      variants = variants.map(variant => ({
        ...variant,
        weight: 100 / variants.length
      }));
    } else if (totalWeight !== 100) {
      // Normalize weights to sum to 100
      variants = variants.map(variant => ({
        ...variant,
        weight: ((variant.weight || 0) / totalWeight) * 100
      }));
    }
    
    return setFeatureFlag(id, {
      description,
      isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
      isTest: true,
      testVariants: variants,
      environment: options.environment || {
        development: true,
        staging: true,
        production: false
      },
      rolloutPercentage: options.rolloutPercentage || 100
    });
  }