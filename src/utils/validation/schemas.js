/**
 * Validation Schemas
 * Defines Yup validation schemas for various entity types
 */
import * as Yup from 'yup';
import { USER_ROLES, LISTING_TYPES, LISTING_STATUS } from '../../config/constants';

// Phone number regex for Indian numbers
const phoneRegExp = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;

// URL regex pattern
const urlRegExp = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Email regex pattern
const emailRegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * User validation schema
 */
export const userSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  displayName: Yup.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .required('Display name is required'),
  firstName: Yup.string()
    .max(50, 'First name must be less than 50 characters'),
  lastName: Yup.string()
    .max(50, 'Last name must be less than 50 characters'),
  phoneNumber: Yup.string()
    .matches(phoneRegExp, 'Invalid phone number')
    .nullable(),
  role: Yup.string()
    .oneOf(Object.values(USER_ROLES), 'Invalid role')
    .required('Role is required'),
  status: Yup.string()
    .oneOf(['active', 'suspended', 'disabled'], 'Invalid status')
    .required('Status is required'),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters')
});

/**
 * Password validation schema
 */
export const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

/**
 * Base listing validation schema (common to all listing types)
 */
export const listingBaseSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
  description: Yup.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .required('Description is required'),
  shortDescription: Yup.string()
    .max(200, 'Short description must be less than 200 characters'),
  type: Yup.string()
    .oneOf(Object.values(LISTING_TYPES), 'Invalid listing type')
    .required('Type is required'),
  status: Yup.string()
    .oneOf(Object.values(LISTING_STATUS), 'Invalid status')
    .required('Status is required'),
  industries: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one industry must be selected')
    .required('Industries are required'),
  'location.country': Yup.string()
    .required('Country is required'),
  'location.state': Yup.string()
    .required('State is required'),
  'location.city': Yup.string()
    .required('City is required')
});

/**
 * Business listing validation schema
 */
export const businessListingSchema = listingBaseSchema.concat(
  Yup.object().shape({
    'businessDetails.businessType': Yup.string()
      .required('Business type is required'),
    'businessDetails.establishedYear': Yup.number()
      .min(1900, 'Year must be after 1900')
      .max(new Date().getFullYear(), 'Year cannot be in the future')
      .required('Established year is required'),
    'businessDetails.sale.askingPrice.value': Yup.number()
      .min(0, 'Price cannot be negative')
      .required('Asking price is required'),
    'businessDetails.sale.reasonForSelling': Yup.string()
      .required('Reason for selling is required')
  })
);

/**
 * Franchise listing validation schema
 */
export const franchiseListingSchema = listingBaseSchema.concat(
  Yup.object().shape({
    'franchiseDetails.franchiseType': Yup.string()
      .required('Franchise type is required'),
    'franchiseDetails.investment.investmentRange.min.value': Yup.number()
      .min(0, 'Minimum investment cannot be negative')
      .required('Minimum investment is required'),
    'franchiseDetails.investment.investmentRange.max.value': Yup.number()
      .min(Yup.ref('franchiseDetails.investment.investmentRange.min.value'), 'Maximum investment must be greater than minimum')
      .required('Maximum investment is required'),
    'franchiseDetails.totalOutlets': Yup.number()
      .min(0, 'Total outlets cannot be negative')
      .required('Total outlets is required')
  })
);

/**
 * Startup listing validation schema
 */
export const startupListingSchema = listingBaseSchema.concat(
  Yup.object().shape({
    'startupDetails.stage': Yup.string()
      .required('Startup stage is required'),
    'startupDetails.funding.current.targetAmount.value': Yup.number()
      .min(0, 'Target amount cannot be negative'),
    'startupDetails.team.founders': Yup.array()
      .of(Yup.object().shape({
        name: Yup.string().required('Founder name is required'),
        role: Yup.string().required('Founder role is required')
      }))
      .min(1, 'At least one founder is required')
  })
);

/**
 * Investor listing validation schema
 */
export const investorListingSchema = listingBaseSchema.concat(
  Yup.object().shape({
    'investorDetails.investorType': Yup.string()
      .required('Investor type is required'),
    'investorDetails.investment.capacity.minInvestment.value': Yup.number()
      .min(0, 'Minimum investment cannot be negative')
      .required('Minimum investment is required'),
    'investorDetails.focus.industries.primary': Yup.array()
      .of(Yup.string())
      .min(1, 'At least one primary industry is required')
  })
);

/**
 * Digital asset listing validation schema
 */
export const digitalAssetListingSchema = listingBaseSchema.concat(
  Yup.object().shape({
    'digitalAssetDetails.assetType': Yup.string()
      .required('Asset type is required'),
    'digitalAssetDetails.sale.price.asking.value': Yup.number()
      .min(0, 'Price cannot be negative')
      .required('Asking price is required'),
    'digitalAssetDetails.traffic.overview.monthlyVisitors': Yup.number()
      .min(0, 'Monthly visitors cannot be negative')
  })
);

/**
 * Review validation schema
 */
export const reviewSchema = Yup.object().shape({
  listingId: Yup.string()
    .required('Listing ID is required'),
  userId: Yup.string()
    .required('User ID is required'),
  rating: Yup.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .required('Rating is required'),
  'content.title': Yup.string()
    .max(100, 'Title must be less than 100 characters')
    .required('Title is required'),
  'content.text': Yup.string()
    .min(10, 'Review text must be at least 10 characters')
    .max(2000, 'Review text must be less than 2000 characters')
    .required('Review text is required')
});

/**
 * Message validation schema
 */
export const messageSchema = Yup.object().shape({
  chatroomId: Yup.string()
    .required('Chatroom ID is required'),
  sender: Yup.string()
    .required('Sender is required'),
  recipient: Yup.string()
    .required('Recipient is required'),
  'content.text': Yup.string()
    .max(5000, 'Message must be less than 5000 characters')
    .required('Message text is required'),
  'content.type': Yup.string()
    .oneOf(['text', 'image', 'document', 'system', 'offer'], 'Invalid message type')
    .required('Message type is required')
});

/**
 * Plan validation schema
 */
export const planSchema = Yup.object().shape({
  name: Yup.string()
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  type: Yup.string()
    .required('Type is required'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  'pricing.amount': Yup.number()
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  'pricing.currency': Yup.string()
    .required('Currency is required'),
  'pricing.billingCycle': Yup.string()
    .required('Billing cycle is required'),
  'duration.days': Yup.number()
    .min(1, 'Duration must be at least 1 day')
    .required('Duration in days is required')
});

/**
 * Contact information validation schema
 */
export const contactInfoSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(phoneRegExp, 'Invalid phone number')
    .required('Phone number is required'),
  contactName: Yup.string()
    .required('Contact name is required'),
  website: Yup.string()
    .matches(urlRegExp, 'Invalid URL format')
    .nullable()
});

/**
 * Application validation schema
 */
export const applicationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(phoneRegExp, 'Invalid phone number')
    .required('Phone number is required'),
  business: Yup.string()
    .required('Business name is required'),
  type: Yup.string()
    .required('Business type is required'),
  message: Yup.string()
    .min(10, 'Message must be at least 10 characters')
    .required('Message is required')
});

/**
 * Commission validation schema
 */
export const commissionSchema = Yup.object().shape({
  advisorId: Yup.string()
    .required('Advisor ID is required'),
  businessId: Yup.string()
    .required('Business ID is required'),
  amount: Yup.number()
    .min(0, 'Amount cannot be negative')
    .required('Amount is required'),
  currency: Yup.string()
    .required('Currency is required'),
  paymentMethod: Yup.string()
    .required('Payment method is required')
});