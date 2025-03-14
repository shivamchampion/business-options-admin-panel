/**
 * Validation Utilities
 * Provides functions for validating data against schemas
 */
import * as schemas from './schemas';

/**
 * Validates data against a specified schema
 * 
 * @param {Object} data - Data to validate
 * @param {Object} schema - Yup schema to validate against
 * @returns {Object} Object with validation results
 */
export async function validateData(data, schema) {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true };
  } catch (error) {
    // Format Yup errors into a more usable structure
    const errors = {};
    
    if (error.inner) {
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
    }
    
    return {
      isValid: false,
      errors
    };
  }
}

/**
 * Gets the appropriate schema based on listing type
 * 
 * @param {string} type - Listing type
 * @returns {Object} Yup schema for the specified listing type
 */
export function getListingSchema(type) {
  switch (type) {
    case 'business':
      return schemas.businessListingSchema;
    case 'franchise':
      return schemas.franchiseListingSchema;
    case 'startup':
      return schemas.startupListingSchema;
    case 'investor':
      return schemas.investorListingSchema;
    case 'digital_asset':
      return schemas.digitalAssetListingSchema;
    default:
      return schemas.listingBaseSchema;
  }
}

/**
 * Validates data and creates a record if valid
 * 
 * @param {function} createFn - Function to create record if valid
 * @param {Object} data - Data to validate
 * @param {Object} schema - Yup schema to validate against
 * @returns {Promise<Object>} Result of validation and creation
 */
export async function validateAndCreate(createFn, data, schema) {
  // Validate data
  const validation = await validateData(data, schema);
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  
  // Proceed with creation if validation passed
  return createFn(data);
}

/**
 * Validates data and updates a record if valid
 * 
 * @param {function} updateFn - Function to update record if valid
 * @param {string} id - ID of record to update
 * @param {Object} data - Data to validate
 * @param {Object} schema - Yup schema to validate against
 * @returns {Promise<Object>} Result of validation and update
 */
export async function validateAndUpdate(updateFn, id, data, schema) {
  // Validate data
  const validation = await validateData(data, schema);
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  
  // Proceed with update if validation passed
  return updateFn(id, data);
}

/**
 * Validates only the fields that are being updated
 * 
 * @param {Object} data - Data to validate
 * @param {Object} schema - Yup schema to validate against
 * @returns {Promise<Object>} Validation result
 */
export async function validatePartial(data, schema) {
  try {
    // Create a partial schema that only validates the fields present in data
    const partialSchema = schema.pick(Object.keys(data));
    await partialSchema.validate(data, { abortEarly: false });
    return { isValid: true };
  } catch (error) {
    // Format Yup errors into a more usable structure
    const errors = {};
    
    if (error.inner) {
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
    }
    
    return {
      isValid: false,
      errors
    };
  }
}