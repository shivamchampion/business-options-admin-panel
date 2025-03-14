// DashboardPage.jsx
import React from 'react';
import { 
  Users, Store, Briefcase, TrendingUp, Eye, 
  ArrowUpRight, Clock, Activity, ChevronDown
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import RecentListings from '../components/RecentListings';
import InstantApplications from '../components/InstantApplications';
import UserActivity from '../components/UserActivity';

const DashboardPage = () => {
  // Mock data for statistics
  const stats = [
    {
      title: "Total Users",
      value: "5,842",
      change: "+12.5%",
      icon: Users,
      color: "blue"
    },
    {
      title: "Total Listings",
      value: "3,267",
      change: "+8.2%",
      icon: Store,
      color: "indigo"
    },
    {
      title: "Pending Approvals",
      value: "124",
      change: "+4.3%",
      icon: Clock,
      color: "yellow"
    },
    {
      title: "Monthly Visits",
      value: "28,547",
      change: "+16.7%",
      icon: Eye,
      color: "green"
    },
    {
      title: "Conversion Rate",
      value: "3.8%",
      change: "+1.2%",
      icon: Activity,
      color: "purple"
    },
    {
      title: "Total Revenue",
      value: "₹45.2L",
      change: "+9.8%",
      icon: TrendingUp,
      color: "teal"
    }
  ];
  
  // Mock data for recent listings
  const recentListings = [
    { id: 1, name: "Tech Innovators Ltd", type: "Business", status: "Pending", owner: "Raj Sharma", date: "2025-03-08", visits: 124 },
    { id: 2, name: "HealthPlus Franchise", type: "Franchise", status: "Approved", owner: "Priya Patel", date: "2025-03-07", visits: 342 },
    { id: 3, name: "EcoSolutions", type: "Startup", status: "Featured", owner: "Amit Singh", date: "2025-03-06", visits: 567 },
    { id: 4, name: "Global Ventures Capital", type: "Investor", status: "Approved", owner: "Shikha Jain", date: "2025-03-05", visits: 231 },
    { id: 5, name: "Crypto Exchange Platform", type: "Digital Asset", status: "Rejected", owner: "Vivek Kumar", date: "2025-03-04", visits: 89 }
  ];
  
  // Mock data for instant applications
  const instantApps = [
    { id: 1, name: "Neha Gupta", business: "Coffee Chain Franchise", type: "Franchise", date: "2025-03-08", status: "New" },
    { id: 2, name: "Rahul Verma", business: "Tech Startup Investment", type: "Investor", date: "2025-03-07", status: "Contacted" },
    { id: 3, name: "Sneha Reddy", business: "Online Retail Business", type: "Business", date: "2025-03-06", status: "In Discussion" }
  ];
  
  // Mock data for user activity
  const userActivity = [
    { page: "Business Listings", visits: 12453, interaction: 68, conversion: 3.2 },
    { page: "Franchise Opportunities", visits: 8764, interaction: 72, conversion: 4.1 },
    { page: "Startup Showcase", visits: 6542, interaction: 65, conversion: 2.8 },
    { page: "Investor Network", visits: 4321, interaction: 58, conversion: 2.3 },
    { page: "Digital Assets", visits: 3897, interaction: 61, conversion: 2.7 }
  ];
  
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