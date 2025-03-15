import * as Yup from 'yup';
import { LISTING_TYPES, LISTING_STATUS } from '../../config/constants';

// Shared validation utility
const createListingValidationSchema = (listingType) => {
  const baseSchema = {
    name: Yup.string()
      .trim()
      .min(3, 'Listing name must be at least 3 characters')
      .max(100, 'Listing name must be less than 100 characters')
      .required('Listing name is required'),
    
    description: Yup.string()
      .trim()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description must be less than 5000 characters')
      .required('Description is required'),
    
    type: Yup.string()
      .oneOf(Object.values(LISTING_TYPES), 'Invalid listing type')
      .required('Listing type is required'),
    
    status: Yup.string()
      .oneOf(Object.values(LISTING_STATUS), 'Invalid listing status')
      .required('Listing status is required'),
    
    location: Yup.object().shape({
      country: Yup.string().required('Country is required'),
      state: Yup.string().required('State is required'),
      city: Yup.string().required('City is required')
    }),
    
    contactInfo: Yup.object().shape({
      email: Yup.string()
        .email('Invalid email address')
        .required('Contact email is required'),
      phone: Yup.string()
        .matches(/^[+]?(\d{1,3})?[-\s.]?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}$/, 'Invalid phone number')
        .required('Contact phone is required')
    })
  };

  // Type-specific validations
  const typeSpecificSchemas = {
    [LISTING_TYPES.BUSINESS]: {
      businessDetails: Yup.object().shape({
        businessType: Yup.string().required('Business type is required'),
        establishedYear: Yup.number()
          .min(1900, 'Establishment year must be after 1900')
          .max(new Date().getFullYear(), 'Establishment year cannot be in the future')
          .required('Establishment year is required'),
        sale: Yup.object().shape({
          askingPrice: Yup.object().shape({
            value: Yup.number()
              .positive('Price must be a positive number')
              .required('Asking price is required')
          })
        })
      })
    },
    [LISTING_TYPES.FRANCHISE]: {
      franchiseDetails: Yup.object().shape({
        franchiseType: Yup.string().required('Franchise type is required'),
        totalOutlets: Yup.number()
          .min(0, 'Total outlets cannot be negative')
          .required('Total outlets is required'),
        investment: Yup.object().shape({
          investmentRange: Yup.object().shape({
            min: Yup.object().shape({
              value: Yup.number()
                .positive('Minimum investment must be positive')
                .required('Minimum investment is required')
            }),
            max: Yup.object().shape({
              value: Yup.number()
                .positive('Maximum investment must be positive')
                .when('min.value', (min, schema) => 
                  schema.min(min, 'Maximum investment must be greater than minimum')
                )
            })
          })
        })
      })
    },
    // Add more type-specific schemas as needed
  };

  return Yup.object().shape({
    ...baseSchema,
    ...(typeSpecificSchemas[listingType] || {})
  });
};

// Export schemas for each listing type
export const listingSchemas = {
  [LISTING_TYPES.BUSINESS]: createListingValidationSchema(LISTING_TYPES.BUSINESS),
  [LISTING_TYPES.FRANCHISE]: createListingValidationSchema(LISTING_TYPES.FRANCHISE),
  [LISTING_TYPES.STARTUP]: createListingValidationSchema(LISTING_TYPES.STARTUP),
  [LISTING_TYPES.INVESTOR]: createListingValidationSchema(LISTING_TYPES.INVESTOR),
  [LISTING_TYPES.DIGITAL_ASSET]: createListingValidationSchema(LISTING_TYPES.DIGITAL_ASSET)
};

export const getListingValidationSchema = (type) => {
  return listingSchemas[type] || createListingValidationSchema(LISTING_TYPES.BUSINESS);
};