// pages/UserRolesPage.jsx
import React, { useState } from 'react';
import { 
  PlusCircle, Search, Filter, Eye, Edit, Trash2, 
  ShieldCheck, Lock, Check, X, Save
} from 'lucide-react';

const UserRolesPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Mock data for users with different roles
  const users = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      role: 'Super Admin', 
      status: 'Active', 
      lastLogin: '2025-03-09 14:32',
      permissions: ['all'] 
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      role: 'Content Manager', 
      status: 'Active', 
      lastLogin: '2025-03-08 10:15',
      permissions: ['view_listings', 'edit_listings', 'view_content', 'edit_content'] 
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      role: 'Support Admin', 
      status: 'Active', 
      lastLogin: '2025-03-07 16:45',
      permissions: ['view_users', 'view_applications', 'respond_applications'] 
    },
    { 
      id: 4, 
      name: 'Sarah Williams', 
      email: 'sarah@example.com', 
      role: 'Analytics Manager', 
      status: 'Inactive', 
      lastLogin: '2025-02-28 09:20',
      permissions: ['view_analytics', 'export_reports'] 
    }
  ];
  
  // Mock data for predefined roles and their permissions
  const roles = [
    { 
      id: 1, 
      name: 'Super Admin', 
      description: 'Full access to all system functions', 
      users: 1,
      permissions: ['all']
    },
    { 
      id: 2, 
      name: 'Content Manager', 
      description: 'Manage website content and listings', 
      users: 3,
      permissions: ['view_listings', 'edit_listings', 'delete_listings', 'view_content', 'edit_content']
    },
    { 
      id: 3, 
      name: 'Support Admin', 
      description: 'Handle user inquiries and applications', 
      users: 5,
      permissions: ['view_users', 'view_applications', 'respond_applications']
    },
    { 
      id: 4, 
      name: 'Analytics Manager', 
      description: 'Access to analytics and reports', 
      users: 2,
      permissions: ['view_analytics', 'export_reports']
    },
    { 
      id: 5, 
      name: 'Advisor Manager', 
      description: 'Manage advisors and their commissions', 
      users: 2,
      permissions: ['view_advisors', 'edit_advisors', 'view_commissions']
    }
  ];
  
  // All available permissions in the system
  const allPermissions = {
    users: ['view_users', 'create_users', 'edit_users', 'delete_users'],
    listings: ['view_listings', 'create_listings', 'edit_listings', 'delete_listings', 'approve_listings'],
    content: ['view_content', 'edit_content', 'publish_content'],
    applications: ['view_applications', 'respond_applications', 'delete_applications'],
    analytics: ['view_analytics', 'export_reports'],
    advisors: ['view_advisors', 'create_advisors', 'edit_advisors', 'delete_advisors', 'view_commissions', 'pay_commissions'],
    settings: ['view_settings', 'edit_settings']
  };
  
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800'
  };
  
  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">User Roles & Permissions</h2>
          <p className="text-sm text-gray-500">Manage admin users and their access permissions</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors"
          onClick={() => setShowAddUserModal(true)}
        >
          <PlusCircle size={16} />
          <span className="font-medium">Add Admin User</span>
        </button>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Admin Users
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === 'roles'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
        </div>
        
        {/* Search & Filter */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab === 'users' ? 'users' : 'roles'}...`} 
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
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Admin Users Table */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Login</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                      <div className="flex items-center">
                        <ShieldCheck size={16} className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-700">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[user.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-green-600' : 'bg-red-600'
                        } mr-1.5`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3 justify-end">
                        <button
                          className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          onClick={() => handleEditPermissions(user)}
                        >
                          <Lock size={16} />
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
        
        {/* Roles Table */}
        {activeTab === 'roles' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Users</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShieldCheck size={18} className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-800">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.users} {role.users === 1 ? 'user' : 'users'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3 justify-end">
                        <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                          <Lock size={16} />
                        </button>
                        <button className="p-1 hover:bg-amber-50 rounded text-amber-600">
                          <Edit size={16} />
                        </button>
                        {role.name !== 'Super Admin' && (
                          <button className="p-1 hover:bg-red-50 rounded text-red-600">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-gray-100">
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                <PlusCircle size={16} />
                <span>Create New Role</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Add Admin User</h3>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm">
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Password
                  </label>
                  <input 
                    type="password" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    placeholder="Enter password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters with a number and special character.
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="send-email" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="send-email" className="ml-2 text-sm text-gray-700">
                    Send welcome email with login details
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  Edit Permissions: {selectedUser.name}
                </h3>
                <span className="text-sm font-medium text-blue-600">Role: {selectedUser.role}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(allPermissions).map(([category, permissions]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3 capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2">
                      {permissions.map(permission => (
                        <div key={permission} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id={permission} 
                              checked={selectedUser.permissions.includes(permission) || selectedUser.permissions.includes('all')}
                              disabled={selectedUser.permissions.includes('all')}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={permission} className="ml-2 text-sm text-gray-700">
                              {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </label>
                          </div>
                          {permission.startsWith('view_') && (
                            <span className="text-xs text-gray-500">Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox" 
                    id="all-permissions" 
                    checked={selectedUser.permissions.includes('all')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="all-permissions" className="ml-2 text-sm font-medium text-blue-800">
                    Grant All Permissions (Super Admin Access)
                  </label>
                </div>
                <p className="text-xs text-blue-700 ml-6">
                  This will give the user full access to all system functions. Use with caution.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white z-10">
              <button 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg"
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
                <Save size={16} className="mr-1" />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRolesPage;