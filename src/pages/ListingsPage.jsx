/**
 * Listings Page Component
 * Manages all listings with filtering, search, and pagination
 */
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Search, Filter, Store, Briefcase, 
  TrendingUp, Users, Globe, Eye, Edit, Trash2, MoreVertical
} from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { formatDate, getStatusColor } from '../utils/helpers';
import { LISTING_TYPES } from '../config/constants';

const ListingsPage = () => {
  // Get listing service from database context
  const { ListingService } = useDatabase();
  
  // State for listings data and filters
  const [listings, setListings] = useState([]);
  const [activeListing, setActiveListing] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastVisible: null,
    hasMore: false,
    pageSize: 10,
    totalCount: 0
  });
  
  // Listing filter options
  const listingTypes = [
    { name: "All Listings", id: "all" },
    { name: "Businesses", id: LISTING_TYPES.BUSINESS },
    { name: "Franchises", id: LISTING_TYPES.FRANCHISE },
    { name: "Startups", id: LISTING_TYPES.STARTUP },
    { name: "Investors", id: LISTING_TYPES.INVESTOR },
    { name: "Digital Assets", id: LISTING_TYPES.DIGITAL_ASSET }
  ];
  
  // Status filter options
  const statusOptions = [
    { name: "All Status", id: "all" },
    { name: "Pending", id: "pending" },
    { name: "Approved", id: "published" },
    { name: "Featured", id: "featured" },
    { name: "Rejected", id: "rejected" }
  ];
  
  // Sort options
  const sortOptions = [
    { name: "Newest First", id: "newest" },
    { name: "Oldest First", id: "oldest" },
    { name: "Most Visited", id: "visits" },
    { name: "Alphabetical", id: "alpha" }
  ];
  
  // Fetch listings based on filters
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      
      try {
        // Determine listing type filter
        const type = activeListing !== 'all' ? activeListing : null;
        
        // Determine status filter
        const status = statusFilter !== 'all' ? statusFilter : null;
        
        // Determine sort field and direction
        let orderField = 'createdAt';
        let orderDirection = 'desc';
        
        switch (sortBy) {
          case 'oldest':
            orderField = 'createdAt';
            orderDirection = 'asc';
            break;
          case 'visits':
            orderField = 'analytics.viewCount';
            orderDirection = 'desc';
            break;
          case 'alpha':
            orderField = 'name';
            orderDirection = 'asc';
            break;
          default:
            // Default: newest first
            orderField = 'createdAt';
            orderDirection = 'desc';
        }
        
        // Get total count for pagination
        const totalCount = await ListingService.getListingCount(type, status);
        
        // Fetch listings with pagination
        const response = await ListingService.getListings(
          type,
          status,
          null, // industries filter
          searchTerm,
          pagination.pageSize,
          pagination.currentPage === 1 ? null : pagination.lastVisible
        );
        
        setListings(response.listings);
        setPagination(prev => ({
          ...prev,
          lastVisible: response.lastVisible,
          hasMore: response.hasMore,
          totalCount
        }));
        
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [
    ListingService, 
    activeListing, 
    statusFilter, 
    sortBy, 
    searchTerm, 
    pagination.currentPage, 
    pagination.pageSize
  ]);
  
  // Handle search input
  const handleSearch = (e) => {
    // Prevent the form from submitting and refreshing the page
    e.preventDefault();
    // Reset pagination when searching
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      lastVisible: null
    }));
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };
  
  // Handle listing deletion
  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await ListingService.deleteDocument(id);
        
        // Remove the deleted listing from the current list
        setListings(prev => prev.filter(listing => listing.id !== id));
        
        // Update total count
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }));
        
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert(`Error deleting listing: ${err.message}`);
      }
    }
  };
  
  // Get icon based on listing type
  const getListingIcon = (type) => {
    switch (type) {
      case LISTING_TYPES.BUSINESS:
        return <Store size={16} />;
      case LISTING_TYPES.FRANCHISE:
        return <Briefcase size={16} />;
      case LISTING_TYPES.STARTUP:
        return <TrendingUp size={16} />;
      case LISTING_TYPES.INVESTOR:
        return <Users size={16} />;
      case LISTING_TYPES.DIGITAL_ASSET:
        return <Globe size={16} />;
      default:
        return <Store size={16} />;
    }
  };
  
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
                onClick={() => {
                  setActiveListing(type.id);
                  // Reset pagination when changing filter
                  setPagination(prev => ({
                    ...prev,
                    currentPage: 1,
                    lastVisible: null
                  }));
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search listings..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                
                <button 
                  type="submit"
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Filter size={16} className="text-gray-500" />
                </button>
              </form>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Status:</span>
              <select 
                className="text-sm border border-gray-300 rounded-md p-2 pr-8"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  // Reset pagination when changing filter
                  setPagination(prev => ({
                    ...prev,
                    currentPage: 1,
                    lastVisible: null
                  }));
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                className="text-sm border border-gray-300 rounded-md p-2 pr-8"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  // Reset pagination when changing sort
                  setPagination(prev => ({
                    ...prev,
                    currentPage: 1,
                    lastVisible: null
                  }));
                }}
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-2">Error loading listings</p>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No listings found with the current filters.</p>
          </div>
        ) : (
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
                            {listing.media?.featuredImage?.url ? (
                              <img 
                                src={listing.media.featuredImage.url} 
                                alt={listing.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              getListingIcon(listing.type)
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                          <div className="text-xs text-gray-500">ID: {listing.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{listing.ownerName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(listing.status)}`}>
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.analytics?.viewCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(listing.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center space-x-3">
                        <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-amber-50 rounded text-amber-600">
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
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
        )}
        
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{listings.length > 0 ? ((pagination.currentPage - 1) * pagination.pageSize) + 1 : 0}</span> to <span className="font-medium">{((pagination.currentPage - 1) * pagination.pageSize) + listings.length}</span> of <span className="font-medium">{pagination.totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm font-medium ${
                pagination.currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
              onClick={() => pagination.currentPage > 1 && handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            
            {/* Generate page buttons */}
            {[...Array(Math.min(3, Math.ceil(pagination.totalCount / pagination.pageSize)))].map((_, index) => {
              const page = pagination.currentPage + index - (pagination.currentPage > 1 ? 1 : 0);
              
              if (page > 0 && page <= Math.ceil(pagination.totalCount / pagination.pageSize)) {
                return (
                  <button 
                    key={page}
                    className={`px-3 py-1 border border-gray-300 rounded-md text-sm font-medium ${
                      pagination.currentPage === page
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            })}
            
            <button 
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm font-medium ${
                !pagination.hasMore 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
              onClick={() => pagination.hasMore && handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;