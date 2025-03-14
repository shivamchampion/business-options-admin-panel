/**
 * Dashboard Page Component
 * Shows key metrics and recent activity in the admin panel
 */
import React, { useState, useEffect } from 'react';
import { 
  Users, Store, Briefcase, TrendingUp, Eye, 
  ArrowUpRight, Clock, Activity, ChevronDown
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import RecentListings from '../components/RecentListings';
import InstantApplications from '../components/InstantApplications';
import UserActivity from '../components/UserActivity';
import { useDatabase } from '../contexts/DatabaseContext';
import { LISTING_STATUS } from '../config/constants';

const DashboardPage = () => {
  // Get database services
  const { 
    UserService, 
    ListingService, 
    ActivityService,
    SupportTicketService
  } = useDatabase();
  
  // State for dashboard data
  const [stats, setStats] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [instantApps, setInstantApps] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch various counts for stats
        const [
          totalUsers,
          totalListings,
          pendingListings,
          totalVisits,
          conversionRate
        ] = await Promise.all([
          UserService.getUserCount(),
          ListingService.getListingCount(),
          ListingService.getListingCount(null, LISTING_STATUS.PENDING),
          ActivityService.getTotalActivityCount('view_listing'),
          // This would be a calculated metric in a real application
          Promise.resolve(3.8)
        ]);
        
        // Prepare stats data
        const statsData = [
          {
            title: "Total Users",
            value: totalUsers.toString(),
            change: "+12.5%", // This would be calculated in a real application
            icon: Users,
            color: "blue"
          },
          {
            title: "Total Listings",
            value: totalListings.toString(),
            change: "+8.2%",
            icon: Store,
            color: "indigo"
          },
          {
            title: "Pending Approvals",
            value: pendingListings.toString(),
            change: "+4.3%",
            icon: Clock,
            color: "yellow"
          },
          {
            title: "Monthly Visits",
            value: totalVisits.toString(),
            change: "+16.7%",
            icon: Eye,
            color: "green"
          },
          {
            title: "Conversion Rate",
            value: `${conversionRate}%`,
            change: "+1.2%",
            icon: Activity,
            color: "purple"
          },
          {
            title: "Total Revenue",
            value: "₹45.2L", // This would come from transaction data in a real app
            change: "+9.8%",
            icon: TrendingUp,
            color: "teal"
          }
        ];
        
        setStats(statsData);
        
        // Fetch recent listings
        const listings = await ListingService.getRecentListings(5);
        setRecentListings(listings);
        
        // Fetch recent support tickets/applications
        const applications = await SupportTicketService.getRecentTickets(3);
        setInstantApps(applications);
        
        // Fetch user activity data
        const activity = await ActivityService.getPageViewMetrics();
        setUserActivity(activity);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [UserService, ListingService, ActivityService, SupportTicketService]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error loading dashboard data</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Listings */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Recent Listings</h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                View All <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
          <RecentListings listings={recentListings} />
        </div>
        
        {/* Instant Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Instant Applications</h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All
              </button>
            </div>
          </div>
          <InstantApplications applications={instantApps} />
        </div>
      </div>
      
      {/* User Activity */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">User Activity by Page</h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Period:</span>
              <select className="text-sm border border-gray-300 rounded-md p-1">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
        <UserActivity activityData={userActivity} />
      </div>
    </div>
  );
};

export default DashboardPage;