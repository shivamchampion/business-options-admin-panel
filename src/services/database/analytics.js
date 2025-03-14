/**
 * Analytics Service
 * Handles operations related to analytics data and reporting
 */
import { 
    collection, doc, getDoc, getDocs, query, where, orderBy, 
    limit, addDoc, serverTimestamp, setDoc
  } from 'firebase/firestore';
  import { db } from '../../config/firebase';
  import { COLLECTIONS } from '../../config/constants';
  import { BaseService } from './index';
  
  /**
   * Creates a new analytics record
   * 
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<string>} - Analytics record ID
   */
  export async function createAnalyticsRecord(analyticsData) {
    const timestamp = serverTimestamp();
    
    // Prepare the analytics data
    const data = {
      ...analyticsData,
      createdAt: timestamp
    };
    
    // Generate document ID based on period if provided
    let docId = null;
    if (analyticsData.period && analyticsData.period.date) {
      docId = analyticsData.period.date;
    }
    
    return BaseService.createDocument(COLLECTIONS.ANALYTICS, data, docId);
  }
  
  /**
   * Updates analytics for a specific metric
   * 
   * @param {string} period - Time period (date string in YYYY-MM-DD format)
   * @param {string} category - Metric category
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @returns {Promise<void>}
   */
  export async function updateAnalyticMetric(period, category, metric, value) {
    const docRef = doc(db, COLLECTIONS.ANALYTICS, period);
    
    // Create empty analytics record if it doesn't exist
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        period: {
          date: period,
          type: period.length === 10 ? 'daily' : period.length === 7 ? 'monthly' : 'custom'
        },
        createdAt: serverTimestamp()
      });
    }
    
    // Update the specific metric
    await setDoc(docRef, {
      [category]: {
        [metric]: value
      },
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  
  /**
   * Gets analytics data for a specific period
   * 
   * @param {string} period - Time period (date string in YYYY-MM-DD format)
   * @returns {Promise<Object|null>} - Analytics data or null if not found
   */
  export async function getAnalyticsByPeriod(period) {
    return BaseService.getDocument(COLLECTIONS.ANALYTICS, period);
  }
  
  /**
   * Gets analytics data for a date range
   * 
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} - Array of analytics records
   */
  export async function getAnalyticsRange(startDate, endDate) {
    const analyticsRef = collection(db, COLLECTIONS.ANALYTICS);
    
    const q = query(
      analyticsRef,
      where('period.date', '>=', startDate),
      where('period.date', '<=', endDate),
      orderBy('period.date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Records a page view event
   * 
   * @param {string} page - Page path or name
   * @param {string|null} userId - User ID (if authenticated)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  export async function recordPageView(page, userId = null, metadata = {}) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Add pageview event to activities collection
    await addDoc(collection(db, COLLECTIONS.ACTIVITIES), {
      type: 'page_view',
      page,
      userId: userId || 'anonymous',
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      createdAt: serverTimestamp()
    });
    
    // Increment pageview count in analytics collection
    try {
      const docRef = doc(db, COLLECTIONS.ANALYTICS, today);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing analytics
        const data = docSnap.data();
        const currentPageviews = data.engagement?.totalPageviews || 0;
        
        await setDoc(docRef, {
          engagement: {
            totalPageviews: currentPageviews + 1
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        // Create new analytics record
        await setDoc(docRef, {
          period: {
            date: today,
            type: 'daily'
          },
          engagement: {
            totalPageviews: 1
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }
  
  /**
   * Gets page view metrics for the analytics dashboard
   * 
   * @returns {Promise<Array>} - Array of page view metrics
   */
  export async function getPageViewMetrics() {
    // In a real application, this would query and aggregate analytics data
    // For this example, we'll return mock data
    return [
      { page: "Business Listings", visits: 12453, interaction: 68, conversion: 3.2 },
      { page: "Franchise Opportunities", visits: 8764, interaction: 72, conversion: 4.1 },
      { page: "Startup Showcase", visits: 6542, interaction: 65, conversion: 2.8 },
      { page: "Investor Network", visits: 4321, interaction: 58, conversion: 2.3 },
      { page: "Digital Assets", visits: 3897, interaction: 61, conversion: 2.7 }
    ];
  }
  
  /**
   * Gets user growth data for the dashboard
   * 
   * @param {number} months - Number of months to include
   * @returns {Promise<Array>} - Array of user growth data points
   */
  export async function getUserGrowthData(months = 6) {
    // In a real application, this would query and aggregate analytics data
    // For this example, we'll return mock data
    return [
      { month: "Oct", users: 1850 },
      { month: "Nov", users: 2100 },
      { month: "Dec", users: 2300 },
      { month: "Jan", users: 2600 },
      { month: "Feb", users: 2850 },
      { month: "Mar", users: 3200 }
    ];
  }
  
  /**
   * Gets traffic source breakdown
   * 
   * @returns {Promise<Object>} - Traffic source data
   */
  export async function getTrafficSources() {
    // In a real application, this would query and aggregate analytics data
    // For this example, we'll return mock data
    return {
      direct: 35,
      organic: 28,
      referral: 22,
      social: 15
    };
  }
  
  /**
   * Gets conversion funnel data
   * 
   * @returns {Promise<Array>} - Funnel stages with counts and rates
   */
  export async function getConversionFunnel() {
    // In a real application, this would query and aggregate analytics data
    // For this example, we'll return mock data
    return [
      { stage: "Visitors", value: 28547, percentage: "100%" },
      { stage: "View Listing", value: 12483, percentage: "43.7%" },
      { stage: "Contact Business", value: 2875, percentage: "10.1%" },
      { stage: "Conversion", value: 987, percentage: "3.5%" }
    ];
  }