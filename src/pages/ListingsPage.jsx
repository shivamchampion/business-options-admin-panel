import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, Filter, Store, Briefcase, 
  TrendingUp, Users, Globe, Eye, Edit, Trash2, MoreVertical, X, 
  AlertCircle, Upload, Download, HelpCircle, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, Clock, Calendar, CheckCircle, BarChart2, DollarSign, 
  MapPin, Layers, Star, FileText, User, Heart, MessageCircle, Activity,
  CreditCard, Send, CornerDownRight, SlidersHorizontal, CheckSquare, Menu,
  Grid, List, Kanban, InfoIcon
} from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatCurrency, getStatusColor, getInitials, truncateString } from '../utils/helpers';
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';
import { Country, State, City } from 'country-state-city';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

// Type icon mapping with distinct colors
const typeIcons = {
  business: <Store className="w-5 h-5 text-emerald-500" />,
  franchise: <Briefcase className="w-5 h-5 text-purple-500" />,
  startup: <TrendingUp className="w-5 h-5 text-orange-500" />,
  investor: <DollarSign className="w-5 h-5 text-blue-500" />,
  digital_asset: <Globe className="w-5 h-5 text-cyan-500" />
};

// Background colors for type badges
const typeBgColors = {
  business: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  franchise: 'bg-purple-50 border-purple-200 text-purple-700',
  startup: 'bg-orange-50 border-orange-200 text-orange-700',
  investor: 'bg-blue-50 border-blue-200 text-blue-700',
  digital_asset: 'bg-cyan-50 border-cyan-200 text-cyan-700'
};

// Status colors with better contrast and readability
const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  published: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  archived: 'bg-slate-100 text-slate-800 border-slate-200'
};

/**
 * Business Listings Management Page
 * 
 * A comprehensive management interface for business listings with:
 * - Dashboard metrics
 * - Advanced filtering
 * - Multi-view options (table, grid, kanban)
 * - Quick actions menu
 * - Bulk operations
 */
const ListingsPage = () => {
  // Navigation
  const navigate = useNavigate();
  
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
  
  // Enhanced filters with options from schema
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    searchTerm: '',
    industry: '',
    location: {
      country: 'IN', // Default to India
      state: '',
      city: ''
    },
    price: {
      min: '',
      max: ''
    },
    createdDateRange: {
      start: '',
      end: ''
    },
    isVerified: '',
    plan: ''
  });
  
  const [activeFilters, setActiveFilters] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });
  
  // Modal and Display States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedListingForAction, setSelectedListingForAction] = useState(null);
  const [view, setView] = useState('table'); // 'table', 'grid', 'kanban'
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  
  // Reference data
  const [industries, setIndustries] = useState([]);
  const [tags, setTags] = useState([]);
  const [plans, setPlans] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Database and Auth Contexts
  const database = useDatabase();
  const { userDetails } = useAuth();
  
  // Analytics & Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalListings: 0,
    publishedListings: 0,
    pendingListings: 0,
    recentActivity: 0,
    viewsLastWeek: 0,
    inquiriesLastWeek: 0
  });
  
  // Fetch Initial Data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [
          industriesData, 
          tagsData, 
          plansData,
          metricsData
        ] = await Promise.all([
          database.IndustryService.getAllIndustries(), // Changed from database.IndustryService.getAllIndustries()
          database.TagService.getTags(),    // Changed from database.TagService.getAllTags()
          database.PlanService.getAllPlans(),      // Changed from database.PlanService.getAllPlans()
          database.getListingMetrics?.(userDetails.uid) || { // Added fallback in case function doesn't exist
            totalListings: 0,
            publishedListings: 0,
            pendingListings: 0,
            recentActivity: 0,
            viewsLastWeek: 0,
            inquiriesLastWeek: 0
          }
        ]);
        setIndustries(industriesData || []);
        setTags(tagsData || []);
        setPlans(plansData || []);
        
        // Update states for India
        const indianStates = State.getStatesOfCountry('IN');
        setStates(indianStates);
        
        // Update metrics with real data
        setMetrics({
          totalListings: metricsData?.totalListings || 0,
          publishedListings: metricsData?.publishedListings || 0,
          pendingListings: metricsData?.pendingListings || 0,
          recentActivity: metricsData?.recentActivity || 0,
          viewsLastWeek: metricsData?.viewsLastWeek || 0,
          inquiriesLastWeek: metricsData?.inquiriesLastWeek || 0
        });
        
        // Fetch listings
        await fetchListings(true);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Update cities when state changes
  useEffect(() => {
    if (filters.location.state) {
      const citiesInState = City.getCitiesOfState('IN', filters.location.state);
      setCities(citiesInState);
    } else {
      setCities([]);
    }
  }, [filters.location.state]);
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.industry) count++;
    if (filters.location.country) count++;
    if (filters.location.state) count++;
    if (filters.location.city) count++;
    if (filters.price.min) count++;
    if (filters.price.max) count++;
    if (filters.createdDateRange.start) count++;
    if (filters.createdDateRange.end) count++;
    if (filters.isVerified !== '') count++;
    if (filters.plan) count++;
    
    setActiveFilters(count);
  }, [filters]);
  
  // Fetch Listings
  const fetchListings = async (resetPagination = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert filters to the format expected by the service
      const filterParams = {
        type: filters.type || null,
        status: filters.status || null,
        industryId: filters.industry || null,
        searchTerm: filters.searchTerm || null,
        location: {
          country: filters.location.country || null,
          state: filters.location.state || null,
          city: filters.location.city || null
        },
        priceRange: {
          min: filters.price.min || null,
          max: filters.price.max || null
        },
        dateRange: {
          start: filters.createdDateRange.start ? new Date(filters.createdDateRange.start) : null,
          end: filters.createdDateRange.end ? new Date(filters.createdDateRange.end) : null
        },
        isVerified: filters.isVerified === 'true' ? true : 
                   filters.isVerified === 'false' ? false : null,
        plan: filters.plan || null
      };
      
      const response = await database.ListingService.getListings(  // Changed from ListingService.getListings
        filterParams,
        pagination.pageSize,
        resetPagination ? null : pagination.lastVisible,
        sortConfig.key,
        sortConfig.direction
      );

      setListings(response.listings || []);
      setPagination(prev => ({
        ...prev,
        totalCount: response.totalCount || 0,
        lastVisible: response.lastVisible,
        currentPage: resetPagination ? 1 : prev.currentPage,
        hasMore: response.hasMore || false
      }));
      
      // Update metrics based on fetched data if not using a separate metrics API
      if (!metrics.totalListings && response.totalCount) {
        setMetrics(prev => ({
          ...prev,
          totalListings: response.totalCount || 0,
          publishedListings: (response.listings || []).filter(l => l.status === 'published').length,
          pendingListings: (response.listings || []).filter(l => l.status === 'pending').length,
          recentActivity: (response.listings || []).filter(l => {
            const date = new Date(l.createdAt);
            const now = new Date();
            return Math.abs(now - date) < 7 * 24 * 60 * 60 * 1000; // Within last 7 days
          }).length
        }));
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Filter Changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchListings(true);
    }, 500);
    
    return () => clearTimeout(handler);
  }, [filters.searchTerm]);
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
    
    // Re-fetch data with new sort
    fetchListings(true);
  };
  
  // Apply selected filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
    fetchListings(true);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      searchTerm: '',
      industry: '',
      location: {
        country: 'IN', // Keep India as default
        state: '',
        city: ''
      },
      price: {
        min: '',
        max: ''
      },
      createdDateRange: {
        start: '',
        end: ''
      },
      isVerified: '',
      plan: ''
    });
    fetchListings(true);
  };
  
  // Handle deletion of listing
  const handleDeleteListing = async () => {
    if (!selectedListingForAction) return;
    
    try {
      setIsLoading(true);
     await database.deleteListing(  // Changed from ListingService.deleteListing
  selectedListingForAction.id, 
  'Manual deletion by user'
);
      
      // Refresh listings
      await fetchListings(true);
      
      // Close modal
      setIsDeleteModalOpen(false);
      setSelectedListingForAction(null);
      
      // Show success notification
      alert('Listing deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedListings.length === 0) return;
    
    try {
      if (window.confirm(`Are you sure you want to delete ${selectedListings.length} listings? This action cannot be undone.`)) {
        setIsLoading(true);
        
        await Promise.all(
          selectedListings.map(id => 
            database.deleteListing(id, 'Bulk deletion by user')  // Changed from ListingService.deleteListing
          )
        );
        
        // Refresh listings
        await fetchListings(true);
        
        // Clear selection
        setSelectedListings([]);
        
        // Show success notification
        alert(`${selectedListings.length} listings deleted successfully!`);
      }
    } catch (err) {
      console.error('Error performing bulk delete:', err);
      setError('Failed to delete listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedListings.length === 0) return;
    
    try {
      setIsLoading(true);
      
      await Promise.all(
        selectedListings.map(id => 
          database.updateListingStatus(id, newStatus)  // Changed from database.updateListingStatus
        )
      );
      
      // Refresh listings
      await fetchListings(true);
      
      // Clear selection
      setSelectedListings([]);
      
      // Show success notification
      alert(`Status updated to "${newStatus}" for ${selectedListings.length} listings`);
      
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update listing status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export listings
  const handleExport = async (format) => {
    try {
      setIsLoading(true);
      
      const filterParams = {
        type: filters.type || null,
        status: filters.status || null,
        industryId: filters.industry || null,
        // Include other filters as needed
      };
      
      // If selected listings exist, only export those
      const listingIds = selectedListings.length > 0 ? selectedListings : null;
      
      const response = await database.exportListings(format, filterParams, listingIds);  // Changed from ExportService.exportListings
      
      // Handle the export response (could be a download link or blob)
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      } else if (response.blob) {
        // Create a download link for the blob
        const url = window.URL.createObjectURL(response.blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `business-listings-export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      setIsExportModalOpen(false);
      
    } catch (err) {
      console.error('Error exporting listings:', err);
      setError('Failed to export listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get type display name
  const getTypeDisplayName = (type) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };
  
  // Format location properly to avoid trailing commas
  const formatLocation = (location) => {
    if (!location) return 'N/A';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };
  
  // Get price based on listing type
  const getListingPrice = (listing) => {
    if (!listing) return 'N/A';
    
    try {
      switch (listing.type) {
        case 'business':
          return listing.businessDetails?.sale?.askingPrice?.value 
            ? formatCurrency(listing.businessDetails.sale.askingPrice.value, 'INR')
            : 'N/A';
        case 'franchise':
          return listing.franchiseDetails?.investment?.investmentRange?.min?.value
            ? `${formatCurrency(listing.franchiseDetails.investment.investmentRange.min.value, 'INR')} - ${formatCurrency(listing.franchiseDetails.investment.investmentRange.max.value || 0, 'INR')}`
            : 'N/A';
        case 'startup':
          return listing.startupDetails?.funding?.current?.targetAmount?.value
            ? formatCurrency(listing.startupDetails.funding.current.targetAmount.value, 'INR')
            : 'N/A';
        case 'investor':
          return listing.investorDetails?.investment?.capacity?.minInvestment?.value
            ? `${formatCurrency(listing.investorDetails.investment.capacity.minInvestment.value, 'INR')}+`
            : 'N/A';
        case 'digital_asset':
          return listing.digitalAssetDetails?.sale?.price?.asking?.value
            ? formatCurrency(listing.digitalAssetDetails.sale.price.asking.value, 'INR')
            : 'N/A';
        default:
          return 'N/A';
      }
    } catch (error) {
      console.error('Error getting listing price:', error);
      return 'N/A';
    }
  };
  
  // Handle pagination page change
  const handlePageChange = async (newPage) => {
    if (newPage !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      // In a real implementation, you would fetch data for the new page here
      await fetchListings(newPage === 1);
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" /> 
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
  };
  
  // Render Filter Modal
  const renderFilterModal = () => (
    <Sheet 
      open={isFilterModalOpen} 
      onOpenChange={setIsFilterModalOpen}
      side="right"
    >
      <SheetContent className="w-[400px] sm:w-[540px] p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Filter Listings</SheetTitle>
          <SheetDescription>
            Refine your listing search with advanced filters
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Listing Type Filter */}
            <div>
              <Label className="text-base font-medium">Listing Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.values(LISTING_TYPES).map(type => (
                  <Button
                    key={type}
                    variant={filters.type === type ? "default" : "outline"}
                    className={`justify-start ${filters.type === type ? "" : "border-gray-200 hover:border-gray-300"}`}
                    onClick={() => setFilters(prev => ({ ...prev, type: prev.type === type ? "" : type }))}
                  >
                    <span className="mr-2">
                      {typeIcons[type]}
                    </span>
                    {getTypeDisplayName(type)}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Status Filter */}
            <div>
              <Label className="text-base font-medium">Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.values(LISTING_STATUS).map(status => (
                  <Button
                    key={status}
                    variant={filters.status === status ? "default" : "outline"}
                    className={`justify-start ${filters.status === status ? "" : "border-gray-200 hover:border-gray-300"}`}
                    onClick={() => setFilters(prev => ({ ...prev, status: prev.status === status ? "" : status }))}
                  >
                    <Badge variant="outline" className={`mr-2 ${statusColors[status]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Industry Filter */}
            <div>
              <Label htmlFor="industry" className="text-base font-medium">Industry</Label>
              <Select
                value={filters.industry}
                onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger id="industry" className="w-full mt-2">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Location Filter */}
            <div>
              <Label className="text-base font-medium">Location</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="location-state">State</Label>
                  <Select
                    value={filters.location.state}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          state: value,
                          city: '' // Reset city when state changes
                        }
                      }));
                    }}
                  >
                    <SelectTrigger id="location-state" className="w-full mt-1">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {states.map(state => (
                        <SelectItem key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="location-city">City</Label>
                  <Select
                    value={filters.location.city}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          city: value
                        }
                      }));
                    }}
                    disabled={!filters.location.state}
                  >
                    <SelectTrigger id="location-city" className="w-full mt-1">
                      <SelectValue placeholder={filters.location.state ? "Select a city" : "Select a state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Cities</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Price Range Filter */}
            <div>
              <Label className="text-base font-medium">Price Range (₹)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="price-min">Minimum</Label>
                  <Input
                    id="price-min"
                    type="number"
                    placeholder="Min price"
                    value={filters.price.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      price: {
                        ...prev.price,
                        min: e.target.value
                      }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="price-max">Maximum</Label>
                  <Input
                    id="price-max"
                    type="number"
                    placeholder="Max price"
                    value={filters.price.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      price: {
                        ...prev.price,
                        max: e.target.value
                      }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Date Range Filter */}
            <div>
              <Label className="text-base font-medium">Creation Date Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="date-start">From</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={filters.createdDateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      createdDateRange: {
                        ...prev.createdDateRange,
                        start: e.target.value
                      }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date-end">To</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={filters.createdDateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      createdDateRange: {
                        ...prev.createdDateRange,
                        end: e.target.value
                      }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Verification Filter */}
            <div>
              <Label className="text-base font-medium">Verification Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={filters.isVerified === 'true' ? "default" : "outline"}
                  className={`justify-start ${filters.isVerified === 'true' ? "" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    isVerified: prev.isVerified === 'true' ? '' : 'true'
                  }))}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Verified
                </Button>
                <Button
                  variant={filters.isVerified === 'false' ? "default" : "outline"}
                  className={`justify-start ${filters.isVerified === 'false' ? "" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    isVerified: prev.isVerified === 'false' ? '' : 'false'
                  }))}
                >
                  <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                  Unverified
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Plan Filter */}
            <div>
              <Label htmlFor="plan" className="text-base font-medium">Subscription Plan</Label>
              <Select
                value={filters.plan}
                onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}
              >
                <SelectTrigger id="plan" className="w-full mt-2">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Plans</SelectItem>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
        
        <SheetFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          <Button onClick={() => fetchListings(true)}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
  
  // Render Delete Confirmation Modal
  const renderDeleteModal = () => (
    <Dialog 
      open={isDeleteModalOpen} 
      onOpenChange={(open) => {
        if (!open) {
          setIsDeleteModalOpen(false);
          setSelectedListingForAction(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Delete Listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this listing? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {selectedListingForAction && (
          <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 mr-3">
                {selectedListingForAction.media?.featuredImage?.url ? (
                  <img 
                    src={selectedListingForAction.media.featuredImage.url} 
                    alt={selectedListingForAction.name} 
                    className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${typeBgColors[selectedListingForAction.type]}`}>
                    {typeIcons[selectedListingForAction.type]}
                  </div>
                )}
              </div>
              <div>
                <div className="text-base font-medium text-gray-900">
                  {selectedListingForAction.name}
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-0.5">
                  {getTypeDisplayName(selectedListingForAction.type)}
                  <span className="mx-1.5">•</span>
                  <Badge variant="outline" className={statusColors[selectedListingForAction.status]}>
                    {selectedListingForAction.status.charAt(0).toUpperCase() + selectedListingForAction.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="sm:justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedListingForAction(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteListing}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Listing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Render View Listing Details Modal
  const renderViewModal = () => (
    <Dialog 
      open={isViewModalOpen} 
      onOpenChange={(open) => {
        if (!open) {
          setIsViewModalOpen(false);
          setSelectedListingForAction(null);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {selectedListingForAction && (
          <div className="flex flex-col h-full">
            {/* Header with image banner or color gradient */}
            <div 
              className={`relative w-full h-32 ${
                selectedListingForAction.media?.featuredImage?.url 
                  ? '' 
                  : `bg-gradient-to-r ${
                      selectedListingForAction.type === 'business' ? 'from-emerald-500 to-emerald-600' :
                      selectedListingForAction.type === 'franchise' ? 'from-purple-500 to-purple-600' :
                      selectedListingForAction.type === 'startup' ? 'from-orange-500 to-orange-600' :
                      selectedListingForAction.type === 'investor' ? 'from-blue-500 to-blue-600' :
                      'from-cyan-500 to-cyan-600'
                    }`
              }`}
            >
              {selectedListingForAction.media?.featuredImage?.url && (
                <img 
                  src={selectedListingForAction.media.featuredImage.url} 
                  alt={selectedListingForAction.name} 
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-2 right-2 bg-black/20 hover:bg-black/30 text-white rounded-full"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedListingForAction(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Type icon & badge */}
              <div className="absolute bottom-4 left-6">
                <Badge variant="outline" className={`${typeBgColors[selectedListingForAction.type]} px-3 py-1.5 text-sm font-medium`}>
                  <span className="mr-1.5">{typeIcons[selectedListingForAction.type]}</span>
                  {getTypeDisplayName(selectedListingForAction.type)}
                </Badge>
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 overflow-auto">
              <ScrollArea className="h-[calc(90vh-8rem)]">
                <div className="p-6">
                  {/* Listing header */}
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedListingForAction.name}
                      </h2>
                      <Badge variant="outline" className={statusColors[selectedListingForAction.status]}>
                        {selectedListingForAction.status.charAt(0).toUpperCase() + selectedListingForAction.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500">
                      {selectedListingForAction.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {formatLocation(selectedListingForAction.location)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedListingForAction.createdAt)}
                      </div>
                      
                      {selectedListingForAction.isVerified && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Verified
                        </div>
                      )}
                      
                      {selectedListingForAction.isFeatured && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-4 w-4" />
                          Featured
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Price & Investment */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedListingForAction.type === 'business' ? 'Asking Price' :
                       selectedListingForAction.type === 'franchise' ? 'Investment Range' :
                       selectedListingForAction.type === 'startup' ? 'Funding Required' :
                       selectedListingForAction.type === 'investor' ? 'Investment Capacity' :
                       'Sale Price'}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {getListingPrice(selectedListingForAction)}
                    </div>
                    
                    {selectedListingForAction.type === 'business' && 
                     selectedListingForAction.businessDetails?.sale?.isNegotiable && (
                      <div className="text-sm text-gray-500 mt-1">Price is negotiable</div>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedListingForAction.description}</p>
                  </div>
                  
                  {/* Details based on listing type */}
                  <Accordion type="single" collapsible defaultValue="type-specific" className="mb-6">
                    <AccordionItem value="type-specific">
                      <AccordionTrigger className="text-lg font-medium text-gray-900">
                        {selectedListingForAction.type === 'business' ? 'Business Details' :
                         selectedListingForAction.type === 'franchise' ? 'Franchise Details' :
                         selectedListingForAction.type === 'startup' ? 'Startup Details' :
                         selectedListingForAction.type === 'investor' ? 'Investor Details' :
                         'Digital Asset Details'}
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* Business specific content */}
                        {selectedListingForAction.type === 'business' && selectedListingForAction.businessDetails && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Business Type</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.businessType?.charAt(0).toUpperCase() + 
                                   selectedListingForAction.businessDetails.businessType?.slice(1).replace(/_/g, ' ') || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Established Year</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.establishedYear || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Employees</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.operations?.employees?.count || 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.financials?.annualRevenue?.value
                                    ? formatCurrency(selectedListingForAction.businessDetails.financials.annualRevenue.value, 'INR')
                                    : 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Profit Margin</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.financials?.profitMargin?.percentage
                                    ? `${selectedListingForAction.businessDetails.financials.profitMargin.percentage}%`
                                    : 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Reason For Selling</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.businessDetails.sale?.reasonForSelling || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Franchise specific content */}
                        {selectedListingForAction.type === 'franchise' && selectedListingForAction.franchiseDetails && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Franchise Type</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.franchiseType?.charAt(0).toUpperCase() + 
                                   selectedListingForAction.franchiseDetails.franchiseType?.slice(1).replace(/_/g, ' ') || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Outlets</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.totalOutlets || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Franchise Fee</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.investment?.franchiseFee?.value
                                    ? formatCurrency(selectedListingForAction.franchiseDetails.investment.franchiseFee.value, 'INR')
                                    : 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Royalty Fee</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.investment?.royaltyFee?.percentage
                                    ? `${selectedListingForAction.franchiseDetails.investment.royaltyFee.percentage}%`
                                    : 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Contract Duration</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.terms?.contractDuration?.years
                                    ? `${selectedListingForAction.franchiseDetails.terms.contractDuration.years} Years`
                                    : 'N/A'}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Training Provided</h4>
                                <div className="text-base text-gray-900">
                                  {selectedListingForAction.franchiseDetails.support?.initialSupport?.hasTrainingProvided ? 'Yes' : 'No'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Simplified placeholder for other listing types */}
                        {(selectedListingForAction.type === 'startup' || 
                          selectedListingForAction.type === 'investor' || 
                          selectedListingForAction.type === 'digital_asset') && (
                          <div className="text-gray-700">
                            Details for {getTypeDisplayName(selectedListingForAction.type)} are available
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  {/* Classification Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Categories & Tags</h3>
                    
                    {/* Industries */}
                    {selectedListingForAction.industries && selectedListingForAction.industries.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Industries</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedListingForAction.industries.map((industry, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {selectedListingForAction.tags && selectedListingForAction.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedListingForAction.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* If no industries or tags */}
                    {(!selectedListingForAction.industries || selectedListingForAction.industries.length === 0) && 
                     (!selectedListingForAction.tags || selectedListingForAction.tags.length === 0) && (
                      <div className="text-sm text-gray-500">No categories or tags assigned</div>
                    )}
                  </div>
                  
                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      {selectedListingForAction.contactInfo?.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Email</div>
                            <div className="text-base text-gray-900">{selectedListingForAction.contactInfo.email}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Phone */}
                      {selectedListingForAction.contactInfo?.phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Phone</div>
                            <div className="text-base text-gray-900">{selectedListingForAction.contactInfo.phone}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Website */}
                      {selectedListingForAction.contactInfo?.website && (
                        <div className="flex items-start gap-2">
                          <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Website</div>
                            <div className="text-base text-gray-900">{selectedListingForAction.contactInfo.website}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Contact Person */}
                      {selectedListingForAction.contactInfo?.contactName && (
                        <div className="flex items-start gap-2">
                          <User className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Contact Person</div>
                            <div className="text-base text-gray-900">{selectedListingForAction.contactInfo.contactName}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* If no contact information */}
                    {!selectedListingForAction.contactInfo && (
                      <div className="text-sm text-gray-500">No contact information available</div>
                    )}
                  </div>
                  
                  {/* Statistics */}
                  {selectedListingForAction.analytics && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Listing Analytics</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-medium text-gray-500">Views</div>
                          <div className="text-xl font-bold text-gray-900">{selectedListingForAction.analytics.viewCount || 0}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-medium text-gray-500">Unique Views</div>
                          <div className="text-xl font-bold text-gray-900">{selectedListingForAction.analytics.uniqueViewCount || 0}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-medium text-gray-500">Contacts</div>
                          <div className="text-xl font-bold text-gray-900">{selectedListingForAction.analytics.contactCount || 0}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-medium text-gray-500">Favorites</div>
                          <div className="text-xl font-bold text-gray-900">{selectedListingForAction.analytics.favoriteCount || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Footer with action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate(`/listings/edit/${selectedListingForAction.id}`);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Listing
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  // Logic to contact or message about listing
                  alert('Contact functionality will be implemented here');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
  
  // Render Export Modal
  const renderExportModal = () => (
    <Dialog 
      open={isExportModalOpen} 
      onOpenChange={setIsExportModalOpen}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Export Listings</DialogTitle>
          <DialogDescription>
            Choose a format to export {selectedListings.length > 0 
              ? `${selectedListings.length} selected listings` 
              : 'all filtered listings'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 my-4">
          <Button 
            variant="outline" 
            className="justify-start h-16 text-left"
            onClick={() => handleExport('csv')}
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium">CSV</div>
                <div className="text-sm text-gray-500">Spreadsheet format</div>
              </div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-16 text-left"
            onClick={() => handleExport('excel')}
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Excel</div>
                <div className="text-sm text-gray-500">XLSX format</div>
              </div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-16 text-left"
            onClick={() => handleExport('pdf')}
          >
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="font-medium">PDF</div>
                <div className="text-sm text-gray-500">Document format</div>
              </div>
            </div>
          </Button>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsExportModalOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Render listings as grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map(listing => (
        <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
          {/* Card Header with image or gradient */}
          <div 
            className={`relative h-36 ${
              listing.media?.featuredImage?.url 
                ? '' 
                : `bg-gradient-to-r ${
                    listing.type === 'business' ? 'from-emerald-500 to-emerald-600' :
                    listing.type === 'franchise' ? 'from-purple-500 to-purple-600' :
                    listing.type === 'startup' ? 'from-orange-500 to-orange-600' :
                    listing.type === 'investor' ? 'from-blue-500 to-blue-600' :
                    'from-cyan-500 to-cyan-600'
                  }`
            }`}
          >
            {listing.media?.featuredImage?.url && (
              <img 
                src={listing.media.featuredImage.url} 
                alt={listing.name} 
                className="w-full h-full object-cover"
              />
            )}
            
            <div className="absolute top-2 right-2 flex gap-1">
              {listing.isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-full p-1 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Listing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {listing.isFeatured && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-white rounded-full p-1 shadow-sm">
                        <Star className="h-4 w-4 text-amber-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Featured Listing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Type badge */}
            <div className="absolute bottom-2 left-2">
              <Badge className={`${typeBgColors[listing.type]} border`}>
                <span className="mr-1">{typeIcons[listing.type]}</span>
                {getTypeDisplayName(listing.type)}
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1" title={listing.name}>
                  {listing.name}
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {formatLocation(listing.location)}
                </div>
              </div>
              
              <Badge variant="outline" className={statusColors[listing.status]}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </Badge>
            </div>
            
            <Separator className="my-3" />
            
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-500 mb-1">
                {listing.type === 'business' ? 'Asking Price' :
                 listing.type === 'franchise' ? 'Investment' :
                 listing.type === 'startup' ? 'Funding' :
                 listing.type === 'investor' ? 'Capacity' :
                 'Price'}
              </div>
              <div className="text-lg font-semibold text-gray-900">{getListingPrice(listing)}</div>
            </div>
            
            <p className="text-sm text-gray-600 mt-3 line-clamp-2" title={listing.description}>
              {listing.description}
            </p>
          </CardContent>
          
          <CardFooter className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setSelectedListingForAction(listing);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(`/listings/edit/${listing.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Listing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setSelectedListingForAction(listing);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Listing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        // Handle status change
                        if (listing.status !== LISTING_STATUS.PUBLISHED) {
                          database.updateListingStatus(listing.id, LISTING_STATUS.PUBLISHED)
                            .then(() => fetchListings())
                            .catch(err => console.error(err));
                        }
                      }}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Publish</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="mr-2 h-4 w-4" />
                        <span>Feature</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More Actions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      ))}
      
      {listings.length === 0 && !isLoading && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <Store className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No listings found</h3>
          <p className="text-gray-500 mb-4 max-w-md">
            {activeFilters > 0 
              ? "Try adjusting your filters to see more results" 
              : "Create your first listing to get started"}
          </p>
          <Button onClick={() => navigate('/listings/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Listing
          </Button>
        </div>
      )}
    </div>
  );
  
  // Render listings as table view
  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedListings.length === listings.length && listings.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedListings(listings.map(l => l.id));
                  } else {
                    setSelectedListings([]);
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('name')}
            >
              <div className="flex items-center">
                Listing Name
                {getSortIndicator('name')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('type')}
            >
              <div className="flex items-center">
                Type
                {getSortIndicator('type')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('location.city')}
            >
              <div className="flex items-center">
                Location
                {getSortIndicator('location.city')}
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell">Price/Investment</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIndicator('status')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hidden lg:table-cell"
              onClick={() => requestSort('createdAt')}
            >
              <div className="flex items-center">
                Created At
                {getSortIndicator('createdAt')}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={8} className="h-16">
                  <Skeleton className="w-full h-10" />
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500">{error}</p>
              </TableCell>
            </TableRow>
          ) : listings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Store className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-1">No listings found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {activeFilters > 0 
                      ? "Try adjusting your filters to see more results" 
                      : "Create your first listing to get started"}
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/listings/create')}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Listing
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            listings.map(listing => (
              <TableRow key={listing.id} className="hover:bg-blue-50/30">
                <TableCell>
                  <Checkbox
                    checked={selectedListings.includes(listing.id)}
                    onCheckedChange={(checked) => {
                      setSelectedListings(prev => 
                        checked
                          ? [...prev, listing.id]
                          : prev.filter(id => id !== listing.id)
                      );
                    }}
                    aria-label={`Select ${listing.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      {listing.media?.featuredImage?.url ? (
                        <img 
                          src={listing.media.featuredImage.url} 
                          alt={listing.name} 
                          className="h-10 w-10 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-md flex items-center justify-center ${typeBgColors[listing.type]}`}>
                          {typeIcons[listing.type]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{listing.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {listing.industries?.length > 0 ? (
                          truncateString(listing.industries.join(', '), 25)
                        ) : (
                          'No industries specified'
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={typeBgColors[listing.type]}>
                      {getTypeDisplayName(listing.type)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatLocation(listing.location)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="font-medium">
                    {getListingPrice(listing)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[listing.status]}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(listing.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedListingForAction(listing);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/listings/edit/${listing.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Listing</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedListingForAction(listing);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Listing</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          // Handle status change
                          if (listing.status !== LISTING_STATUS.PUBLISHED) {
                            database.updateListingStatus(listing.id, LISTING_STATUS.PUBLISHED)
                              .then(() => fetchListings())
                              .catch(err => console.error(err));
                          }
                        }}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Publish</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          <span>Feature</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
  
  // Render kanban board view
  const renderKanbanView = () => {
    const statusGroups = {};
    
    // Group listings by status
    listings.forEach(listing => {
      if (!statusGroups[listing.status]) {
        statusGroups[listing.status] = [];
      }
      statusGroups[listing.status].push(listing);
    });
    
    const statusOrder = ['draft', 'pending', 'published', 'rejected', 'archived'];
    
    return (
      <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 overflow-x-auto pb-4">
        {statusOrder.map(status => (
          <div 
            key={status}
            className="min-w-80 w-full lg:w-80 bg-gray-50 border border-gray-200 rounded-lg flex flex-col"
          >
            {/* Column header */}
            <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className={statusColors[status]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {statusGroups[status]?.length || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Column content */}
            <ScrollArea className="flex-1 h-[calc(100vh-330px)]">
              <div className="p-3 space-y-3">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={`skeleton-${status}-${index}`} className="bg-white rounded-md p-3 border border-gray-200">
                      <Skeleton className="w-full h-20" />
                    </div>
                  ))
                ) : statusGroups[status]?.length > 0 ? (
                  statusGroups[status].map(listing => (
                    <Card key={listing.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-shrink-0 h-8 w-8 mr-2">
                            {listing.media?.featuredImage?.url ? (
                              <img 
                                src={listing.media.featuredImage.url} 
                                alt={listing.name} 
                                className="h-8 w-8 rounded-md object-cover border border-gray-200"
                              />
                            ) : (
                              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${typeBgColors[listing.type]}`}>
                                {typeIcons[listing.type]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 truncate" title={listing.name}>
                              {listing.name}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <MapPin className="h-3 w-3 mr-1" />
                              {formatLocation(listing.location)}
                            </div>
                          </div>
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedListingForAction(listing);
                                  setIsViewModalOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedListingForAction(listing);
                                  setIsDeleteModalOpen(true);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <Badge variant="outline" className={typeBgColors[listing.type]}>
                            {getTypeDisplayName(listing.type)}
                          </Badge>
                          <div className="font-medium">
                            {getListingPrice(listing)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No listings
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    );
  };
  
  // Main render
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" /> Business Listings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track all your business listings across different categories
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="hidden md:flex"
                onClick={() => setIsExportModalOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <Button onClick={() => navigate('/listings/create')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Listing
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Metrics */}
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Total Listings</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalListings}</h4>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">View all listings</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Published</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-1">{metrics.publishedListings}</h4>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">View published listings</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Pending Review</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-1">{metrics.pendingListings}</h4>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">View pending listings</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Recent Activity</p>
                  <h4 className="text-3xl font-bold text-gray-900 mt-1">{metrics.recentActivity}</h4>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">Last 7 days</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Controls & Filters */}
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, location, or industry..."
              className="pl-9 max-w-md"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View mode selector */}
            <div className="bg-white border border-gray-200 rounded-md p-1 flex">
              <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant={view === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2"
                      onClick={() => setView('table')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Table View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2"
                      onClick={() => setView('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2"
                      onClick={() => setView('kanban')}
                    >
                      <Kanban className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kanban View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Filter button */}
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {activeFilters > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {activeFilters}
                </Badge>
              )}
            </Button>
            
            {/* Bulk actions dropdown */}
            {selectedListings.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default">
                    Actions ({selectedListings.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleBulkStatusChange(LISTING_STATUS.PUBLISHED)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Publish Selected</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange(LISTING_STATUS.ARCHIVED)}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archive Selected</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsExportModalOpen(true)}
                    className="text-blue-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export Selected</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Selected</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Active filters display */}
        {activeFilters > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-wrap items-center gap-2">
            <div className="text-sm text-gray-500 mr-1">Active Filters:</div>
            
            {filters.type && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                {typeIcons[filters.type]}
                {getTypeDisplayName(filters.type)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, type: '' }))}
                />
              </Badge>
            )}
            
            {filters.status && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                />
              </Badge>
            )}
            
            {filters.industry && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                Industry: {industries.find(i => i.id === filters.industry)?.name || filters.industry}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, industry: '' }))}
                />
              </Badge>
            )}
            
            {(filters.location.state || filters.location.city) && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                Location: {filters.location.city || ''} {filters.location.state && filters.location.city ? ', ' : ''} {filters.location.state ? states.find(s => s.isoCode === filters.location.state)?.name : ''}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    location: {
                      ...prev.location,
                      state: '',
                      city: ''
                    }
                  }))}
                />
              </Badge>
            )}
            
            {(filters.price.min || filters.price.max) && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                Price: {filters.price.min ? `₹${filters.price.min}` : '0'} - {filters.price.max ? `₹${filters.price.max}` : '∞'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    price: {
                      min: '',
                      max: ''
                    }
                  }))}
                />
              </Badge>
            )}
            
            {filters.isVerified && (
              <Badge variant="outline" className="bg-white flex items-center gap-1.5">
                {filters.isVerified === 'true' ? 'Verified' : 'Unverified'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, isVerified: '' }))}
                />
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={resetFilters}
            >
              Reset all
            </Button>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading && listings.length === 0 ? (
          // Initial loading state
          <div className="mt-8 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading listings...</p>
          </div>
        ) : (
          <>
            {/* Render based on selected view */}
            {view === 'table' && renderTableView()}
            {view === 'grid' && renderGridView()}
            {view === 'kanban' && renderKanbanView()}
            
            {/* Pagination */}
            {view !== 'kanban' && listings.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
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
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modals */}
      {renderFilterModal()}
      {renderDeleteModal()}
      {renderViewModal()}
      {renderExportModal()}
    </div>
  );
};

export default ListingsPage;