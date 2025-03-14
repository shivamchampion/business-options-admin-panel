/**
 * Application constants and enumerations
 * Centralized definitions for consistent usage across the application
 */

// User roles and permissions
export const USER_ROLES = {
    ADMIN: 'admin',
    BUSINESS_OWNER: 'business_owner',
    MODERATOR: 'moderator',
    USER: 'user'
  };
  
  // Listing types
  export const LISTING_TYPES = {
    BUSINESS: 'business',
    FRANCHISE: 'franchise',
    STARTUP: 'startup',
    INVESTOR: 'investor',
    DIGITAL_ASSET: 'digital_asset'
  };
  
  // Listing statuses
  export const LISTING_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    ARCHIVED: 'archived'
  };
  
  // Subscription statuses
  export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    PAUSED: 'paused'
  };
  
  // Transaction statuses
  export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  };
  
  // User statuses
  export const USER_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DISABLED: 'disabled'
  };
  
  // Notification types
  export const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    LISTING: 'listing',
    MESSAGE: 'message',
    TRANSACTION: 'transaction',
    APPLICATION: 'application'
  };
  
  // Collection names for Firestore
  export const COLLECTIONS = {
    USERS: 'users',
    LISTINGS: 'listings',
    INDUSTRIES: 'industries',
    LOCATIONS: 'locations',
    TAGS: 'tags',
    REVIEWS: 'reviews',
    MESSAGES: 'messages',
    CHATROOMS: 'chatrooms',
    ACTIVITIES: 'activities',
    FAVORITES: 'favorites',
    NOTIFICATIONS: 'notifications',
    SUBSCRIPTIONS: 'subscriptions',
    PLANS: 'plans',
    TRANSACTIONS: 'transactions',
    PAYMENT_METHODS: 'paymentMethods',
    PROMOTIONS: 'promotions',
    ANALYTICS: 'analytics',
    CONTENT_PAGES: 'contentPages',
    SETTINGS: 'settings',
    ENUMS: 'enums',
    REPORTS: 'reports',
    FAQS: 'faqs',
    AUDIT_LOGS: 'auditLogs',
    FEATURE_FLAGS: 'featureFlags',
    SUPPORT_TICKETS: 'supportTickets'
  };
  
  // Pagination defaults
  export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50
  };