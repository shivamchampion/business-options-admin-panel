// pages/AdvisorManagementPage.jsx
import React, { useState } from 'react';
import { 
  PlusCircle, Search, Filter, Eye, Edit, Trash2, 
  MapPin, Phone, Mail, Calendar, Briefcase, 
  DollarSign, ArrowDown, ArrowUp, Download, ChevronDown,
  Users, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';

const AdvisorManagementPage = () => {
  const [activeTab, setActiveTab] = useState('advisors');
  const [showAddAdvisorModal, setShowAddAdvisorModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  
  // Mock data for advisors
  const advisors = [
    { 
      id: 1, 
      name: 'Rajesh Kumar', 
      email: 'rajesh@example.com', 
      phone: '+91 9876543210',
      city: 'Mumbai', 
      state: 'Maharashtra',
      status: 'Active', 
      joinDate: '2025-01-15',
      businessCount: 12,
      totalCommission: '₹185,000',
      pendingCommission: '₹32,500',
      kycVerified: true
    },
    { 
      id: 2, 
      name: 'Priya Sharma', 
      email: 'priya@example.com', 
      phone: '+91 9876543211',
      city: 'Delhi', 
      state: 'Delhi',
      status: 'Active', 
      joinDate: '2025-01-28',
      businessCount: 8,
      totalCommission: '₹120,000',
      pendingCommission: '₹45,000',
      kycVerified: true
    },
    { 
      id: 3, 
      name: 'Sanjay Patel', 
      email: 'sanjay@example.com', 
      phone: '+91 9876543212',
      city: 'Ahmedabad', 
      state: 'Gujarat',
      status: 'Inactive', 
      joinDate: '2025-02-10',
      businessCount: 5,
      totalCommission: '₹68,000',
      pendingCommission: '₹12,000',
      kycVerified: false
    },
    { 
      id: 4, 
      name: 'Anita Desai', 
      email: 'anita@example.com', 
      phone: '+91 9876543213',
      city: 'Bangalore', 
      state: 'Karnataka',
      status: 'Pending', 
      joinDate: '2025-03-05',
      businessCount: 0,
      totalCommission: '₹0',
      pendingCommission: '₹0',
      kycVerified: false
    }
  ];
  
  // Mock data for commissions
  const commissions = [
    {
      id: 1,
      advisor: 'Rajesh Kumar',
      advisorId: 1,
      business: 'Tech Solutions Ltd',
      businessType: 'Business',
      amount: '₹15,000',
      status: 'Paid',
      date: '2025-03-01'
    },
    {
      id: 2,
      advisor: 'Rajesh Kumar',
      advisorId: 1,
      business: 'Food Franchise Chain',
      businessType: 'Franchise',
      amount: '₹32,500',
      status: 'Pending',
      date: '2025-03-08'
    },
    {
      id: 3,
      advisor: 'Priya Sharma',
      advisorId: 2,
      business: 'Healthcare Startup',
      businessType: 'Startup',
      amount: '₹28,000',
      status: 'Paid',
      date: '2025-02-15'
    },
    {
      id: 4,
      advisor: 'Priya Sharma',
      advisorId: 2,
      business: 'Real Estate Investment',
      businessType: 'Investment',
      amount: '₹45,000',
      status: 'Pending',
      date: '2025-03-05'
    },
    {
      id: 5,
      advisor: 'Sanjay Patel',
      advisorId: 3,
      business: 'E-commerce Platform',
      businessType: 'Digital Asset',
      amount: '₹12,000',
      status: 'Pending',
      date: '2025-02-28'
    }
  ];
  
  // Commission rates by business type
  const commissionRates = [
    { type: 'Business', base: '5%', min: '₹10,000', max: '₹50,000' },
    { type: 'Franchise', base: '7%', min: '₹25,000', max: '₹100,000' },
    { type: 'Startup', base: '6%', min: '₹15,000', max: '₹75,000' },
    { type: 'Investment', base: '3%', min: '₹20,000', max: 'No limit' },
    { type: 'Digital Asset', base: '8%', min: '₹5,000', max: '₹30,000' }
  ];
  
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Paid': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Rejected': 'bg-red-100 text-red-800'
  };
  
  const handleViewAdvisor = (advisor) => {
    setSelectedAdvisor(advisor);
  };
  
  const handlePayCommission = (commission) => {
    setShowCommissionModal(true);
  };
  
  // Stats for the dashboard
  const stats = [
    { 
      title: "Total Advisors", 
      value: "24", 
      change: "+3", 
      icon: Users,
      color: "blue"
    },
    { 
      title: "Active Advisors", 
      value: "18", 
      change: "+2", 
      icon: CheckCircle, 
      color: "green"
    },
    { 
      title: "Total Commission Paid", 
      value: "₹8.5L", 
      change: "+₹1.2L", 
      icon: DollarSign, 
      color: "indigo"
    },
    { 
      title: "Business Conversions", 
      value: "128", 
      change: "+18", 
      icon: TrendingUp,
      color: "purple"
    }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Advisor Management</h2>
          <p className="text-sm text-gray-500">Manage business advisors and commission agents</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors"
          onClick={() => setShowAddAdvisorModal(true)}
        >
          <PlusCircle size={16} />
          <span className="font-medium">Add Advisor</span>
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-xl font-bold text-gray-800">{stat.value}</h3>
                <div className="flex items-center mt-1">
                  <ArrowUp size={14} className="text-green-500" />
                  <span className="text-xs font-medium text-green-500 ml-1">{stat.change}</span>
                  <span className="text-xs text-gray-500 ml-2">this month</span>
                </div>
              </div>
              <div className={`bg-${stat.color}-50 p-3 rounded-lg`}>
                <stat.icon size={20} className={`text-${stat.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'advisors'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('advisors')}
          >
            Advisors
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'commissions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('commissions')}
          >
            Commissions
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'rates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('rates')}
          >
            Commission Rates
          </button>
        </div>
        
        {/* Search & Filter */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={activeTab === 'advisors' ? 'Search advisors...' : 'Search commissions...'} 
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                <Filter size={16} className="text-gray-500" />
              </button>
            </div>
            
            {activeTab === 'advisors' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Status:</span>
                <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
                
                <span className="text-sm text-gray-500">Location:</span>
                <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                  <option>All Locations</option>
                  <option>Mumbai</option>
                  <option>Delhi</option>
                  <option>Bangalore</option>
                  <option>Ahmedabad</option>
                </select>
              </div>
            )}
            
            {activeTab === 'commissions' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Status:</span>
                <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
                
                <span className="text-sm text-gray-500">Date:</span>
                <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                  <option>All Time</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        {/* Advisors Table */}
        {activeTab === 'advisors' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Advisor</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">KYC</th>
                  <th className="px-6 py-3">Business Count</th>
                  <th className="px-6 py-3">Pending Commission</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advisors.map((advisor) => (
                  <tr key={advisor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                          {advisor.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{advisor.name}</div>
                          <div className="text-xs text-gray-500">{advisor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{advisor.city}, {advisor.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[advisor.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          advisor.status === 'Active' ? 'bg-green-600' : advisor.status === 'Pending' ? 'bg-yellow-600' : 'bg-red-600'
                        } mr-1.5`}></span>
                        {advisor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {advisor.kycVerified ? (
                        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800">
                          <XCircle size={12} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {advisor.businessCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{advisor.pendingCommission}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3 justify-end">
                        <button 
                          className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          onClick={() => handleViewAdvisor(advisor)}
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-amber-50 rounded text-amber-600">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 hover:bg-red-50 rounded text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Commissions Table */}
        {activeTab === 'commissions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Advisor</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{commission.business}</span>
                        <span className="text-xs text-gray-500">{commission.businessType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{commission.advisor}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {commission.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[commission.status]}`}>
                        {commission.status === 'Paid' ? (
                          <CheckCircle size={12} className="mr-1 text-green-600" />
                        ) : (
                          <Clock size={12} className="mr-1 text-yellow-600" />
                        )}
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commission.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3 justify-end">
                        {commission.status === 'Pending' && (
                          <button 
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium"
                            onClick={() => handlePayCommission(commission)}
                          >
                            Pay Now
                          </button>
                        )}
                        <button className="p-1 hover:bg-amber-50 rounded text-amber-600">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                <Download size={16} />
                <span>Export Commission Report</span>
              </button>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">
                  Total Pending: <span className="font-medium text-gray-800">₹89,500</span>
                </span>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium">
                  Pay All Pending
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Commission Rates */}
        {activeTab === 'rates' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Business Type</th>
                  <th className="px-6 py-3">Base Rate</th>
                  <th className="px-6 py-3">Minimum</th>
                  <th className="px-6 py-3">Maximum</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissionRates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{rate.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{rate.base}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{rate.min}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{rate.max}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="px-3 py-1 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 text-xs">
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Commission Policy</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600 mt-1.5 mr-2"></span>
                  Base commission rates are calculated as a percentage of the total business value.
                </li>
                <li className="flex items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600 mt-1.5 mr-2"></span>
                  Commission is paid only after successful completion of the deal and receipt of payment.
                </li>
                <li className="flex items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600 mt-1.5 mr-2"></span>
                  Advisors must be KYC verified to receive commission payments.
                </li>
                <li className="flex items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600 mt-1.5 mr-2"></span>
                  Special rates may apply for high-value deals or exclusive partnerships.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected Advisor Details */}
      {selectedAdvisor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                {selectedAdvisor.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedAdvisor.name}</h3>
                <p className="text-sm text-gray-500">Advisor since {selectedAdvisor.joinDate}</p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedAdvisor.status]}`}>
                    {selectedAdvisor.status}
                  </span>
                  {selectedAdvisor.kycVerified && (
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 ml-2">
                      <CheckCircle size={12} className="mr-1" />
                      KYC Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 text-sm flex items-center">
                <Edit size={14} className="mr-1" />
                Edit
              </button>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center">
                <DollarSign size={14} className="mr-1" />
                Pay Commission
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{selectedAdvisor.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{selectedAdvisor.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">{selectedAdvisor.city}, {selectedAdvisor.state}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Joined: {selectedAdvisor.joinDate}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Performance Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Businesses</span>
                  <span className="text-sm font-medium text-gray-800">{selectedAdvisor.businessCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Commission</span>
                  <span className="text-sm font-medium text-gray-800">{selectedAdvisor.totalCommission}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pending Commission</span>
                  <span className="text-sm font-medium text-gray-800">{selectedAdvisor.pendingCommission}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
              <div className="space-y-3">
                <div className="border-l-2 border-blue-500 pl-3">
                  <p className="text-sm text-gray-700">Added a new business listing</p>
                  <p className="text-xs text-gray-500">Mar 5, 2025</p>
                </div>
                <div className="border-l-2 border-green-500 pl-3">
                  <p className="text-sm text-gray-700">Commission payment received</p>
                  <p className="text-xs text-gray-500">Mar 1, 2025</p>
                </div>
                <div className="border-l-2 border-purple-500 pl-3">
                  <p className="text-sm text-gray-700">Profile information updated</p>
                  <p className="text-xs text-gray-500">Feb 25, 2025</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Businesses Referred</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-4 py-2">Business Name</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">Tech Solutions Ltd</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Business</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">2025-02-15</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">₹15,000</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">Food Franchise Chain</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Franchise</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                        In Progress
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">2025-03-08</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">₹32,500</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                View All Businesses
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Advisor Modal */}
      {showAddAdvisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Add New Advisor</h3>
            </div>
            <div className="p-6">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm">
                    <option value="">Select state</option>
                    <option>Maharashtra</option>
                    <option>Delhi</option>
                    <option>Karnataka</option>
                    <option>Gujarat</option>
                    <option>Tamil Nadu</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password
                  </label>
                  <input 
                    type="password" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise Areas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Business', 'Franchise', 'Startup', 'Investment', 'Digital Asset'].map((area) => (
                      
                        <div key={area} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`area-${area}`} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`area-${area}`} className="ml-2 text-sm text-gray-700">
                            {area}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center mt-2">
                      <input 
                        type="checkbox" 
                        id="send-welcome-email" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="send-welcome-email" className="ml-2 text-sm text-gray-700">
                        Send welcome email with login details
                      </label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg"
                  onClick={() => setShowAddAdvisorModal(false)}
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Create Advisor
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Process Commission Modal */}
        {showCommissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Process Commission Payment</h3>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Business:</span>
                    <span className="text-sm font-medium text-gray-800">Food Franchise Chain</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Advisor:</span>
                    <span className="text-sm font-medium text-gray-800">Rajesh Kumar</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Commission Amount:</span>
                    <span className="text-sm font-medium text-gray-800">₹32,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction Date:</span>
                    <span className="text-sm font-medium text-gray-800">Today</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm">
                      <option>Bank Transfer</option>
                      <option>UPI</option>
                      <option>Cheque</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      placeholder="Enter transaction reference"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm h-20"
                      placeholder="Add any additional notes"
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <input 
                      type="checkbox" 
                      id="send-confirmation" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked
                    />
                    <label htmlFor="send-confirmation" className="ml-2 text-sm text-gray-700">
                      Send payment confirmation to advisor
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg"
                  onClick={() => setShowCommissionModal(false)}
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center">
                  <DollarSign size={16} className="mr-1" />
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default AdvisorManagementPage;