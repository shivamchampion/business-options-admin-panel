// AnalyticsPage.jsx
import React, { useState } from 'react';
import { 
  FileBarChart, Eye, Users, Activity, Clock, 
  TrendingUp, Download, Calendar
} from 'lucide-react';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last7');
  
  // Analytics tabs
  const analyticsTabs = [
    { name: "Overview", id: "overview" },
    { name: "Traffic Sources", id: "traffic" },
    { name: "User Behavior", id: "behavior" },
    { name: "Conversions", id: "conversions" },
    { name: "Demographics", id: "demographics" }
  ];
  
  // Date range options
  const dateRanges = [
    { name: "Last 7 days", id: "last7" },
    { name: "Last 30 days", id: "last30" },
    { name: "Last 90 days", id: "last90" },
    { name: "This year", id: "year" },
    { name: "Custom Range", id: "custom" }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Analytics & Reports</h2>
          <p className="text-sm text-gray-500">View detailed statistics and generate reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm transition-colors">
            <FileBarChart size={16} />
            <span className="font-medium">Export Report</span>
          </button>
          
          <div className="relative">
            <select 
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm appearance-none"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map(range => (
                <option key={range.id} value={range.id}>{range.name}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {analyticsTabs.map((tab) => (
              <button
                key={tab.id}
                className={`text-sm font-medium px-6 py-4 whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {[
                  { title: "Total Page Views", value: "125.4K", change: "+12.3%", icon: Eye, color: "blue" },
                  { title: "New Users", value: "2,847", change: "+8.6%", icon: Users, color: "green" },
                  { title: "Bounce Rate", value: "42.8%", change: "-3.2%", icon: Activity, color: "yellow" },
                  { title: "Avg. Session Duration", value: "2m 45s", change: "+5.1%", icon: Clock, color: "purple" }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`bg-${stat.color}-50 p-2 rounded-lg`}>
                        <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                      </div>
                      <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="border border-gray-100 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800">Website Traffic Overview</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 bg-blue-500 rounded-full"></span>
                      <span className="text-xs text-gray-500">This Period</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 bg-blue-200 rounded-full"></span>
                      <span className="text-xs text-gray-500">Previous Period</span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="h-64 w-full bg-gray-50 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Traffic chart will be displayed here</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Traffic by Listing Type</h3>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download size={16} />
                    </button>
                  </div>
                  <div className="h-48 w-full bg-gray-50 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Pie chart will be displayed here</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {[
                      { name: "Businesses", value: "42%", color: "blue" },
                      { name: "Franchises", value: "28%", color: "green" },
                      { name: "Startups", value: "18%", color: "yellow" },
                      { name: "Investors", value: "12%", color: "purple" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`h-3 w-3 bg-${item.color}-500 rounded-full`}></span>
                        <span className="text-sm text-gray-500">{item.name}</span>
                        <span className="text-sm font-medium text-gray-800 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border border-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Top Performing Listings</h3>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download size={16} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Tech Solutions Ltd", type: "Business", visits: 1245, conversion: 4.8 },
                      { name: "Food Chain Franchise", type: "Franchise", visits: 968, conversion: 3.9 },
                      { name: "EcoFriendly Startup", type: "Startup", visits: 754, conversion: 5.2 },
                      { name: "Real Estate Fund", type: "Investor", visits: 623, conversion: 2.7 },
                      { name: "SaaS Platform", type: "Digital Asset", visits: 512, conversion: 3.1 }
                    ].map((listing, index) => (
                      <div key={index} className="flex items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="mr-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 text-blue-600">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{listing.name}</p>
                          <p className="text-xs text-gray-500">{listing.type}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm font-medium text-gray-800">{listing.visits} visits</p>
                          <p className="text-xs text-gray-500">{listing.conversion}% conversion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'traffic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Traffic Sources</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Download size={16} />
                  </button>
                </div>
                <div className="h-64 w-full bg-gray-50 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Traffic sources chart will be displayed here</p>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {[
                    { name: "Direct", value: "35%", visits: "43,854" },
                    { name: "Organic Search", value: "28%", visits: "35,012" },
                    { name: "Referral", value: "22%", visits: "27,544" },
                    { name: "Social Media", value: "15%", visits: "18,753" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800 block">{item.value}</span>
                        <span className="text-xs text-gray-500">{item.visits} visits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Top Referrers</h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Download size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "google.com", visits: 12583, percentage: 45 },
                    { name: "facebook.com", visits: 8254, percentage: 30 },
                    { name: "linkedin.com", visits: 4127, percentage: 15 },
                    { name: "instagram.com", visits: 2751, percentage: 10 }
                  ].map((referrer, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-800">{referrer.name}</p>
                        <p className="text-sm font-medium text-gray-800">{referrer.visits} visits</p>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${referrer.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{referrer.percentage}% of total traffic</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {(activeTab !== 'overview' && activeTab !== 'traffic') && (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-500 mb-2">{analyticsTabs.find(tab => tab.id === activeTab)?.name} Data</p>
                <p className="text-sm text-gray-400">Detailed analytics will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Key Metrics</h3>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Download size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: "Listings Created", current: 324, previous: 287, change: "+12.9%" },
              { name: "User Registrations", current: 842, previous: 756, change: "+11.4%" },
              { name: "Inquiries Sent", current: 1245, previous: 1087, change: "+14.5%" },
              { name: "Successful Deals", current: 58, previous: 43, change: "+34.9%" }
            ].map((metric, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <p className="text-sm font-medium text-gray-500 mb-1">{metric.name}</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-bold text-gray-800">{metric.current}</p>
                  <div className="flex items-center">
                    <TrendingUp size={12} className="text-green-500 mr-1" />
                    <span className="text-xs font-medium text-green-500">{metric.change}</span>
                    <span className="text-xs text-gray-500 ml-1">vs. last period</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Conversion Funnel</h3>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Download size={16} />
            </button>
          </div>
          
          <div className="h-64 w-full bg-gray-50 flex items-center justify-center mb-4">
            <p className="text-sm text-gray-500">Conversion funnel chart will be displayed here</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { stage: "Visitors", value: 28547, percentage: "100%" },
              { stage: "View Listing", value: 12483, percentage: "43.7%" },
              { stage: "Contact Business", value: 2875, percentage: "10.1%" },
              { stage: "Conversion", value: 987, percentage: "3.5%" }
            ].map((stage, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">{stage.stage}</p>
                <p className="text-lg font-bold text-gray-800">{stage.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stage.percentage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Custom Report Builder */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Custom Report Builder</h2>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
              <FileBarChart size={16} />
              <span className="font-medium">Generate Report</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>User Activity</option>
                <option>Listing Performance</option>
                <option>Revenue Analysis</option>
                <option>Traffic Sources</option>
                <option>Conversion Analytics</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
                <option>Custom Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option>PDF Report</option>
                <option>Excel Spreadsheet</option>
                <option>CSV Data</option>
                <option>Interactive Dashboard</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metrics to Include
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                "Page Views", "Unique Visitors", "Bounce Rate", "Avg. Session Duration",
                "New User Registrations", "Listings Created", "Inquiries Sent", "Revenue",
                "Conversion Rate", "Traffic Sources", "User Demographics", "Device Usage"
              ].map((metric, index) => (
                <div key={index} className="flex items-center">
                  <input 
                    type="checkbox" 
                    id={`metric-${index}`}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked={index < 6}
                  />
                  <label htmlFor={`metric-${index}`} className="ml-2 text-sm text-gray-700">
                    {metric}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="schedule-report"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="schedule-report" className="ml-2 text-sm text-gray-700">
                Schedule this report to run automatically
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                Save as Template
              </button>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Load Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;