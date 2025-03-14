// UsersPage.jsx
import React, { useState } from 'react';
import { 
  PlusCircle, Search, Filter, Eye, Edit, Trash2
} from 'lucide-react';

const UsersPage = () => {
  const [activeUserFilter, setActiveUserFilter] = useState('all');
  
  // User filter options
  const userFilters = [
    { name: "All Users", id: "all" },
    { name: "Admins", id: "admin" },
    { name: "Business Owners", id: "business" },
    { name: "Investors", id: "investor" },
    { name: "Standard Users", id: "standard" }
  ];
  
  // User management data
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i === 0 ? "Admin" : i % 3 === 0 ? "Business Owner" : i % 3 === 1 ? "Investor" : "Standard User",
    status: i % 5 === 0 ? "Inactive" : "Active",
    listings: Math.floor(Math.random() * 5),
    joinDate: `2025-0${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 28) + 1}`,
    lastActive: i % 5 === 0 ? "Never" : `${Math.floor(Math.random() * 24)} hours ago`
  }));
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">User Management</h2>
          <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
          <PlusCircle size={16} />
          <span className="font-medium">Add User</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            {userFilters.map((filter) => (
              <button
                key={filter.id}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeUserFilter === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveUserFilter(filter.id)}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                <Filter size={16} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Status:</span>
              <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
              // UsersPage.jsx (continued)
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Recently Active</option>
                <option>Most Listings</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                </th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Listings</th>
                <th className="px-6 py-3">Join Date</th>
                <th className="px-6 py-3">Last Active</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${
                      user.role === "Admin" 
                        ? "bg-purple-100 text-purple-800" 
                        : user.role === "Business Owner"
                        ? "bg-blue-100 text-blue-800"
                        : user.role === "Investor"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                      user.status === "Active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        user.status === "Active" ? "bg-green-600" : "bg-red-600"
                      } mr-1.5`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.listings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-3 justify-end">
                      <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
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
        
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">128</span> users
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* User Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">User Activity</h3>
          
          <div className="border-b border-gray-200 pb-5">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Actions</h4>
            <div className="space-y-4">
              {[
                { action: "Created a new business listing", time: "2 hours ago" },
                { action: "Updated profile information", time: "Yesterday at 3:45 PM" },
                { action: "Contacted a franchise owner", time: "2 days ago" },
                { action: "Viewed 5 business listings", time: "3 days ago" },
                { action: "Registered account", time: "2 weeks ago" }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Login History</h4>
            <div className="space-y-3">
              {[
                { device: "Windows PC - Chrome", location: "Mumbai, India", ip: "192.168.1.1", time: "Today at 9:41 AM" },
                { device: "Android Phone - Mobile App", location: "Delhi, India", ip: "192.168.1.2", time: "Yesterday at 7:32 PM" },
                { device: "MacBook - Safari", location: "Bangalore, India", ip: "192.168.1.3", time: "March 5, 2025, 11:15 AM" }
              ].map((login, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{login.device}</p>
                      <p className="text-xs text-gray-500">{login.location} • IP: {login.ip}</p>
                    </div>
                    <p className="text-xs text-gray-500">{login.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">User Information</h3>
          
          <div className="flex flex-col items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-3">
              U
            </div>
            <h4 className="text-lg font-semibold text-gray-800">User 1</h4>
            <p className="text-sm text-gray-500">user1@example.com</p>
            <div className="mt-2">
              <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 mr-1.5"></span>
                Active
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Full Name</p>
              <p className="text-sm font-medium text-gray-800">User One</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
              <p className="text-sm font-medium text-gray-800">+91 9876543210</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
              <p className="text-sm font-medium text-gray-800">123 Business Street, Mumbai, India</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Account Type</p>
              <p className="text-sm font-medium text-gray-800">Business Owner</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Member Since</p>
              <p className="text-sm font-medium text-gray-800">January 15, 2025</p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button className="w-full mb-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
                <Edit size={16} />
                <span className="font-medium">Edit User</span>
              </button>
              
              <button className="w-full flex items-center justify-center gap-2 bg-white border border-red-500 hover:bg-red-50 text-red-600 py-2 px-4 rounded-lg shadow-sm transition-colors">
                <Trash2 size={16} />
                <span className="font-medium">Delete User</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
              