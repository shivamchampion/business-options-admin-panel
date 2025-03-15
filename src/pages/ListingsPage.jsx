import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, Search, Filter, Store, Briefcase, 
  TrendingUp, Users, Globe, Eye, Edit, Trash2, MoreVertical, X, 
  AlertCircle, Upload, Save, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getStatusColor, getInitials } from '../utils/helpers';
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';
import { validateData, getListingSchema } from '../utils/validation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

const ListingsPage = () => {
  // State Management
  const [listings, setListings] = useState([]);
  const [selectedListings, setSelectedListings] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    lastVisible: null,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    type: null,
    status: null,
    searchTerm: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal States
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedListingForAction, setSelectedListingForAction] = useState(null);
  
  // Database and Auth Contexts
  const { ListingService, IndustryService, LocationService } = useDatabase();
  const { userDetails } = useAuth();
  
  // Industries and Locations State
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Fetch Initial Data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        // Fetch industries and locations
        const [industriesData, locationsData] = await Promise.all([
          IndustryService.getAllIndustries(),
          LocationService.getCountries()
        ]);
        
        setIndustries(industriesData);
        setLocations(locationsData);
        
        // Fetch listings
        await fetchListings(true);
      } catch (err) {
        setError('Failed to load initial data');
        console.error(err);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch Listings
  const fetchListings = async (resetPagination = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ListingService.getListings(
        filters.type,
        filters.status,
        null, // industries
        filters.searchTerm,
        pagination.pageSize,
        resetPagination ? null : pagination.lastVisible
      );
      
      setListings(response.listings || []);
      setPagination(prev => ({
        ...prev,
        totalCount: response.totalCount || 0,
        lastVisible: response.lastVisible,
        currentPage: resetPagination ? 1 : prev.currentPage,
        hasMore: response.hasMore || false
      }));
    } catch (err) {
      setError('Failed to fetch listings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Filter Changes
  useEffect(() => {
    // When filters change, reset pagination and fetch listings
    const handler = setTimeout(() => {
      fetchListings(true);
    }, 500);
    
    return () => clearTimeout(handler);
  }, [filters]);
  
  // Handle Add/Edit Listing Submission
  const handleListingSubmission = async (values, { setSubmitting, resetForm }) => {
    try {
      setError(null);
      // Validate data based on listing type
      const schema = getListingSchema(values.type);
      const validation = await validateData(values, schema);
      
      if (!validation.isValid) {
        // Handle validation errors
        throw new Error(Object.values(validation.errors).join(', '));
      }
      
      // Prepare listing data
      const listingData = {
        ...values,
        status: LISTING_STATUS.DRAFT,
        ownerId: userDetails.uid
      };
      
      // Create or update listing
      const result = selectedListingForAction
        ? await ListingService.updateListing(selectedListingForAction.id, listingData)
        : await ListingService.createListing(listingData);
      
      // Refresh listings
      await fetchListings(true);
      
      // Reset form and close modal
      resetForm();
      setIsAddListingModalOpen(false);
      setSelectedListingForAction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render Listing Type Form Fields
  const renderListingTypeFields = (type, formik) => {
    switch (type) {
      case LISTING_TYPES.BUSINESS:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <Field 
                  name="businessDetails.businessType" 
                  as="select" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                >
                  <option value="">Select Business Type</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llp">Limited Liability Partnership</option>
                  <option value="private_limited">Private Limited</option>
                  <option value="public_limited">Public Limited</option>
                </Field>
                <ErrorMessage name="businessDetails.businessType" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Established Year
                </label>
                <Field 
                  type="number" 
                  name="businessDetails.establishedYear" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Year of Establishment"
                />
                <ErrorMessage name="businessDetails.establishedYear" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Selling
              </label>
              <Field 
                as="textarea" 
                name="businessDetails.sale.reasonForSelling" 
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm h-24"
                placeholder="Briefly explain the reason for selling the business"
              />
              <ErrorMessage name="businessDetails.sale.reasonForSelling" component="div" className="text-red-500 text-xs mt-1" />
            </div>
          </>
        );
      case LISTING_TYPES.FRANCHISE:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Franchise Type
                </label>
                <Field 
                  name="franchiseDetails.franchiseType" 
                  as="select" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                >
                  <option value="">Select Franchise Type</option>
                  <option value="food_and_beverage">Food & Beverage</option>
                  <option value="retail">Retail</option>
                  <option value="service">Service</option>
                  <option value="education">Education</option>
                  <option value="health_and_fitness">Health & Fitness</option>
                </Field>
                <ErrorMessage name="franchiseDetails.franchiseType" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Outlets
                </label>
                <Field 
                  type="number" 
                  name="franchiseDetails.totalOutlets" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Number of Existing Outlets"
                />
                <ErrorMessage name="franchiseDetails.totalOutlets" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Investment
                </label>
                <Field 
                  type="number" 
                  name="franchiseDetails.investment.investmentRange.min.value" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Minimum Investment"
                />
                <ErrorMessage name="franchiseDetails.investment.investmentRange.min.value" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Investment
                </label>
                <Field 
                  type="number" 
                  name="franchiseDetails.investment.investmentRange.max.value" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Maximum Investment"
                />
                <ErrorMessage name="franchiseDetails.investment.investmentRange.max.value" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>
          </>
        );
      // Add more listing type-specific fields for other types
      default:
        return null;
    }
  };
  
  // Render Add/Edit Listing Modal
  const renderAddListingModal = () => (
    <Dialog 
      open={isAddListingModalOpen} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsAddListingModalOpen(false);
          setSelectedListingForAction(null);
        }
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {selectedListingForAction ? 'Edit Listing' : 'Add New Listing'}
          </DialogTitle>
          <DialogDescription>
            Provide comprehensive details about your business listing.
          </DialogDescription>
        </DialogHeader>
        
        <Formik
          initialValues={{
            name: selectedListingForAction?.name || '',
            type: selectedListingForAction?.type || LISTING_TYPES.BUSINESS,
            description: selectedListingForAction?.description || '',
            industries: selectedListingForAction?.industries || [],
            location: {
              country: selectedListingForAction?.location?.country || '',
              state: selectedListingForAction?.location?.state || '',
              city: selectedListingForAction?.location?.city || ''
            },
            // Add type-specific details based on initial values or selected listing
            ...(selectedListingForAction?.businessDetails 
              ? { businessDetails: selectedListingForAction.businessDetails }
              : {}),
            ...(selectedListingForAction?.franchiseDetails 
              ? { franchiseDetails: selectedListingForAction.franchiseDetails }
              : {})
          }}
          validationSchema={getListingSchema(
            selectedListingForAction?.type || LISTING_TYPES.BUSINESS
          )}
          onSubmit={handleListingSubmission}
        >
          {(formik) => (
            <Form>
              <div className="space-y-6">
                {/* Base Listing Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Name
                    </label>
                    <Field 
                      type="text" 
                      name="name" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      placeholder="Enter listing name"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Type
                    </label>
                    <Field 
                      name="type" 
                      as="select" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      onChange={(e) => {
                        formik.handleChange(e);
                        // Reset type-specific fields when type changes
                        formik.setFieldValue(
                          'businessDetails', 
                          e.target.value === LISTING_TYPES.BUSINESS ? {} : null
                        );
                        formik.setFieldValue(
                          'franchiseDetails', 
                          e.target.value === LISTING_TYPES.FRANCHISE ? {} : null
                        );
                      }}
                    >
                      {Object.values(LISTING_TYPES).map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="type" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Field 
                    as="textarea" 
                    name="description" 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm h-24"
                    placeholder="Provide a detailed description of the listing"
                  />
                  <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <Field 
                      name="location.country" 
                      as="select" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    >
                      <option value="">Select Country</option>
                      {locations.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="location.country" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <Field 
                      name="location.state" 
                      as="select" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      disabled={!formik.values.location.country}
                    >
                      <option value="">Select State</option>
                      {/* Dynamically populate states based on selected country */}
                    </Field>
                    <ErrorMessage name="location.state" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Field 
                      name="location.city" 
                      as="select" 
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      disabled={!formik.values.location.state}
                    >
                      <option value="">Select City</option>
                      {/* Dynamically populate cities based on selected state */}
                    </Field>
                    <ErrorMessage name="location.city" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industries
                  </label>
                  <Field 
                    name="industries" 
                    as="select" 
                    multiple 
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm h-24"
                  >
                    {industries.map(industry => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="industries" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                {/* Type-Specific Fields */}
                {renderListingTypeFields(formik.values.type, formik)}
                
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle size={16} className="text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload a high-quality image. Recommended size: 1200x800 pixels</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="mt-6 flex justify-end space-x-4">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => {
                    setIsAddListingModalOpen(false);
                    setSelectedListingForAction(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting 
                    ? 'Saving...' 
                    : (selectedListingForAction ? 'Update Listing' : 'Create Listing')
                  }
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
  
  // Handle pagination page change
  const handlePageChange = async (newPage) => {
    if (newPage !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      // In a real implementation, you would fetch data for the new page here
      await fetchListings(newPage === 1);
    }
  };
  
  // Render Main Component
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Business Listings</h1>
          <p className="text-sm text-gray-500">
            Manage and track all your business listings across different categories
          </p>
        </div>
        <button 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => setIsAddListingModalOpen(true)}
        >
          <PlusCircle size={16} />
          Add New Listing
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center space-x-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search listings..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({
                ...prev, 
                searchTerm: e.target.value
              }))}
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={filters.type || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev, 
              type: e.target.value || null
            }))}
          >
            <option value="">All Types</option>
            {Object.values(LISTING_TYPES).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev, 
              status: e.target.value || null
            }))}
          >
            <option value="">All Statuses</option>
            {Object.values(LISTING_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          
          <button 
            className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100"
            onClick={() => fetchListings(true)}
          >
            <Filter size={16} />
          </button>
        </div>
      </div>
      
      {/* Listings Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider text-left">
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedListings.length === listings.length && listings.length > 0}
                    onChange={(e) => {
                      setSelectedListings(
                        e.target.checked ? listings.map(l => l.id) : []
                      );
                    }}
                  />
                </th>
                <th className="px-6 py-3">Listing Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No listings found. Create your first listing!
                  </td>
                </tr>
              ) : (
                listings.map(listing => (
                  <tr 
                    key={listing.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedListings.includes(listing.id)}
                        onChange={(e) => {
                          setSelectedListings(prev => 
                            e.target.checked
                              ? [...prev, listing.id]
                              : prev.filter(id => id !== listing.id)
                          );
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 mr-3">
                          {listing.media?.featuredImage?.url ? (
                            <img 
                              src={listing.media.featuredImage.url} 
                              alt={listing.name} 
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                              {getInitials(listing.name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {listing.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {listing.industries?.join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {listing.location?.city}, {listing.location?.state}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(listing.status)
                        }`}
                      >
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(listing.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                          onClick={() => {
                            setSelectedListingForAction(listing);
                            setIsAddListingModalOpen(true);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                          onClick={() => {
                            setSelectedListingForAction(listing);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => {
                if (pagination.currentPage > 1) {
                  handlePageChange(pagination.currentPage - 1);
                }
              }}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => {
                if (pagination.hasMore) {
                  handlePageChange(pagination.currentPage + 1);
                }
              }}
              disabled={!pagination.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {listings.length > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.pageSize, 
                    pagination.totalCount
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium">
                  {pagination.totalCount}
                </span>{' '}
                results
              </p>
            </div>
            <div>
              <nav 
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" 
                aria-label="Pagination"
              >
                <button 
                  onClick={() => {
                    if (pagination.currentPage > 1) {
                      handlePageChange(pagination.currentPage - 1);
                    }
                  }}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft size={20} />
                </button>
                
                {Array.from({ length: Math.min(5, Math.ceil(pagination.totalCount / pagination.pageSize)) }, (_, i) => {
                  const pageNumber = pagination.currentPage - 2 + i > 0 
                    ? pagination.currentPage - 2 + i 
                    : pagination.currentPage + i;
                  
                  if (
                    pageNumber <= 0 || 
                    pageNumber > Math.ceil(pagination.totalCount / pagination.pageSize)
                  ) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        pagination.currentPage === pageNumber
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => {
                    if (pagination.hasMore) {
                      handlePageChange(pagination.currentPage + 1);
                    }
                  }}
                  disabled={!pagination.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight size={20} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Dialog 
        open={isDeleteModalOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsDeleteModalOpen(false);
            setSelectedListingForAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedListingForAction(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={async () => {
                try {
                  if (selectedListingForAction) {
                    await ListingService.deleteListing(
                      selectedListingForAction.id, 
                      'Manual deletion by admin'
                    );
                    
                    // Refresh listings
                    await fetchListings(true);
                    
                    // Close modal
                    setIsDeleteModalOpen(false);
                    setSelectedListingForAction(null);
                  }
                } catch (err) {
                  setError('Failed to delete listing');
                  console.error(err);
                }
              }}
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Listing Modal */}
      {renderAddListingModal()}
    </div>
  );
};

export default ListingsPage;