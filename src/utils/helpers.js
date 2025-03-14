/**
 * Helper Functions
 * Provides utility functions used throughout the application
 */

/**
 * Creates a URL-friendly slug from a string
 * 
 * @param {string} str - String to slugify
 * @returns {string} - URL-friendly slug
 */
export function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with a single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  }
  
  /**
   * Formats a date in a user-friendly way
   * 
   * @param {Date|string|number|Object} date - Date to format
   * @param {string} format - Format type ('short', 'long', 'relative')
   * @returns {string} - Formatted date string
   */
  export function formatDate(date, format = 'short') {
    if (!date) return '';
    
    // Convert Firebase timestamp to Date if needed
    const dateObj = date instanceof Date 
      ? date 
      : date?.toDate 
        ? date.toDate() 
        : new Date(date);
    
    if (isNaN(dateObj.getTime())) return '';
    
    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-IN', {
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'relative':
        return getRelativeTime(dateObj);
      
      // Default: short format
      default:
        return dateObj.toLocaleDateString('en-IN', {
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        });
    }
  }
  
  /**
   * Gets relative time (e.g., "2 hours ago") from a date
   * 
   * @param {Date} date - Date to get relative time from
   * @returns {string} - Relative time string
   */
  export function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else if (diffMonth < 12) {
      return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
    }
  }
  
  /**
   * Formats currency with proper symbol and localization
   * 
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: INR)
   * @returns {string} - Formatted currency string
   */
  export function formatCurrency(amount, currency = 'INR') {
    if (amount === undefined || amount === null) return '';
    
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  }
  
  /**
   * Formats a number with commas for thousands
   * 
   * @param {number} num - Number to format
   * @returns {string} - Formatted number string
   */
  export function formatNumber(num) {
    if (num === undefined || num === null) return '';
    
    return new Intl.NumberFormat('en-IN').format(num);
  }
  
  /**
   * Truncates a string to a specific length and adds ellipsis
   * 
   * @param {string} str - String to truncate
   * @param {number} length - Maximum length
   * @returns {string} - Truncated string
   */
  export function truncateString(str, length = 100) {
    if (!str) return '';
    
    if (str.length <= length) return str;
    
    return str.slice(0, length) + '...';
  }
  
  /**
   * Extracts initials from a name
   * 
   * @param {string} name - Name to extract initials from
   * @returns {string} - Initials (max 2 characters)
   */
  export function getInitials(name) {
    if (!name) return '';
    
    const parts = name.split(' ').filter(part => part.length > 0);
    
    if (parts.length === 0) return '';
    
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  /**
   * Creates a random color based on a string (for user avatars, etc.)
   * 
   * @param {string} str - String to base color on
   * @returns {string} - CSS color class
   */
  export function getRandomColor(str) {
    if (!str) return 'bg-blue-100 text-blue-600';
    
    const colors = [
      'bg-red-100 text-red-600',
      'bg-green-100 text-green-600',
      'bg-blue-100 text-blue-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-teal-100 text-teal-600'
    ];
    
    // Generate a deterministic index based on the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a color from the array using the hash
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
  
  /**
   * Gets status color class for a specific status
   * 
   * @param {string} status - Status to get color for
   * @returns {string} - CSS color class
   */
  export function getStatusColor(status) {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'published': 'bg-green-100 text-green-800',
      'draft': 'bg-gray-100 text-gray-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'featured': 'bg-blue-100 text-blue-800',
      'archived': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'suspended': 'bg-red-100 text-red-800',
      'disabled': 'bg-red-100 text-red-800',
      'expired': 'bg-red-100 text-red-800',
      'cancelled': 'bg-red-100 text-red-800',
      'paused': 'bg-yellow-100 text-yellow-800'
    };
    
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }
  
  /**
   * Calculates time passed between two dates
   * 
   * @param {Date|string|number|Object} start - Start date
   * @param {Date|string|number|Object} end - End date (defaults to now)
   * @returns {string} - Human-readable time difference
   */
  export function timeBetween(start, end = new Date()) {
    // Convert inputs to Date objects if they aren't already
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    // Calculate the difference in milliseconds
    const diffMs = endDate - startDate;
    
    // Convert milliseconds to various time units
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    // Format the result based on the largest unit
    if (diffYear > 0) {
      return `${diffYear} ${diffYear === 1 ? 'year' : 'years'}`;
    } else if (diffMonth > 0) {
      return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'}`;
    } else if (diffDay > 0) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'}`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'}`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'}`;
    } else {
      return `${diffSec} ${diffSec === 1 ? 'second' : 'seconds'}`;
    }
  }