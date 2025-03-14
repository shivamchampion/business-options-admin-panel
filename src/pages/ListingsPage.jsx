// ListingsPage.jsx
import React, { useState } from 'react';
import { 
  PlusCircle, Search, Filter, Store, Briefcase, 
  TrendingUp, Users, Globe, Eye, Edit, Trash2, MoreVertical
} from 'lucide-react';

const ListingsPage = () => {
  const [activeListing, setActiveListing] = useState('all');
  
  // Listing filter options
  const listingTypes = [
    { name: "All Listings", id: "all" },
    { name: "Businesses", id: "business" },
    { name: "Franchises", id: "franchise" },
    { name: "Startups", id: "startup" },
    { name: "Investors", id: "investor" },
    { name: "Digital Assets", id: "digital" }
  ];
  
  // Status badge colors
  const statusColors = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Featured": "bg-blue-100 text-blue-800",
    "Rejected": "bg-red-100 text-red-800"
  };
  
  // Mock listing data
  const listings = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Business Listing ${i + 1}`,
    type: i % 5 === 0 ? "Business" : i % 5 === 1 ? "Franchise" : i % 5 === 2 ? "Startup" : i % 5 === 3 ? "Investor" : "Digital Asset",
    owner: `Owner ${i + 1}`,
    status: i % 4 === 0 ? "Pending" : i % 4 === 1 ? "Approved" : i % 4 === 2 ? "Featured" : "Rejected",
    visits: Math.floor(Math.random() * 1000),
    date: `2025-0${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 28) + 1}`
  }));
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Manage Listings</h2>
          <p className="text-sm text-gray-500">View, edit or remove business listings</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
          <PlusCircle size={16} />
          <span className="font-medium">Add New Listing</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            {listingTypes.map((type) => (
              <button
                key={type.id}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeListing === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveListing(type.id)}
              >
                {type.name}
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
                  placeholder="Search listings..." 
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
                <option>Pending</option>
                <option>Approved</option>
                <option>Featured</option>
                <option>Rejected</option>
              </select>
              
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="text-sm border border-gray-300 rounded-md p-2 pr-8">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Most Visited</option>
                <option>Highest Rated</option>
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Visits</th>
                <th className="px-6 py-3">Date Added</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                          {listing.type === "Business" && <Store size={16} />}
                          {listing.type === "Franchise" && <Briefcase size={16} />}
                          {listing.type === "Startup" && <TrendingUp size={16} />}
                          {listing.type === "Investor" && <Users size={16} />}
                          {listing.type === "Digital Asset" && <Globe size={16} />}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                        <div className="text-xs text-gray-500">ID: {listing.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{listing.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{listing.owner}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[listing.status]}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.visits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex items-center space-x-3">
                      <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 hover:bg-amber-50 rounded text-amber-600">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 hover:bg-red-50 rounded text-red-600">
                        <Trash2 size={16} />
                      </button>
                      <div className="relative">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">54</span> results
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
    </div>
  );
};

export default ListingsPage;