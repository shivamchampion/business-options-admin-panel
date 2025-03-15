import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Globe, 
  PlusCircle, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  Search,
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  Clock,
  MapPin,
  Calendar,
  Tag,
  HelpCircle,
  RefreshCw,
  Star,
  ChevronLeft,
  ChevronRight,
  Archive,
  Layers,
  Grid
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDatabase } from '../contexts/DatabaseContext';

// Utility and Service Imports
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';

import { formatCurrency, formatDate } from '../utils/helpers';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


// Custom Components
import ListingFormPage from './ListingFormPage';

// Type and Status Styling
const TYPE_ICONS = {
  [LISTING_TYPES.BUSINESS]: Store,
  [LISTING_TYPES.FRANCHISE]: Briefcase,
  [LISTING_TYPES.STARTUP]: TrendingUp,
  [LISTING_TYPES.INVESTOR]: DollarSign,
  [LISTING_TYPES.DIGITAL_ASSET]: Globe
};

const TYPE_NAMES = {
  [LISTING_TYPES.BUSINESS]: "Business",
  [LISTING_TYPES.FRANCHISE]: "Franchise",
  [LISTING_TYPES.STARTUP]: "Startup",
  [LISTING_TYPES.INVESTOR]: "Investor",
  [LISTING_TYPES.DIGITAL_ASSET]: "Digital Asset"
};

const STATUS_COLORS = {
  [LISTING_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
  [LISTING_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [LISTING_STATUS.PUBLISHED]: 'bg-green-100 text-green-800 border-green-300',
  [LISTING_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
  [LISTING_STATUS.ARCHIVED]: 'bg-slate-100 text-slate-800 border-slate-300'
};

const ListingsPage = () => {
  const navigate = useNavigate();
  const { ListingService } = useDatabase();
  // State Management
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasMore: false,
    lastDocument: null
  });
  const [currentView, setCurrentView] = useState('grid'); // 'grid', 'table', 'card'
  const [selectedListings, setSelectedListings] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    types: Object.values(LISTING_TYPES).map(type => ({
      value: type,
      label: TYPE_NAMES[type] || type,
      checked: false
    })),
    statuses: Object.values(LISTING_STATUS).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      checked: false
    })),
    priceRange: { min: 0, max: 10000000 },
    dateRange: { start: null, end: null }
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Statistics State
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    byStatus: {},
    recentlyAdded: 0,
    pendingApproval: 0,
    publishedCount: 0
  });

  // Helper functions
  const getStatusCount = (status) => {
    if (!stats.byStatus) return 0;
    return stats.byStatus[status] || 0;
  };

  const getStatusPercentage = (status) => {
    if (!stats.total || !stats.byStatus) return 0;
    const count = stats.byStatus[status] || 0;
    return (count / stats.total) * 100;
  };

  // Fetch Listings
  const fetchListings = async (resetPagination = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Apply active filters
      const activeFilters = {};
      
      // Type filters
      const selectedTypes = filterOptions.types
        .filter(t => t.checked)
        .map(t => t.value);
      if (selectedTypes.length > 0) {
        activeFilters.type = selectedTypes[0]; // API limitation: can only filter by one type
      }
      
      // Status filters
      const selectedStatuses = filterOptions.statuses
        .filter(s => s.checked)
        .map(s => s.value);
      if (selectedStatuses.length > 0) {
        activeFilters.status = selectedStatuses[0]; // API limitation: can only filter by one status
      }
      
      // Search term
      if (filters.searchTerm) {
        activeFilters.searchTerm = filters.searchTerm;
      }

      const result = await ListingService.getListings(
        activeFilters, 
        pagination.pageSize, 
        resetPagination ? null : pagination.lastDocument
      );

      // Update listings
      setListings(resetPagination ? result.listings : [...listings, ...result.listings]);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        page: resetPagination ? 1 : prev.page,
        hasMore: result.hasMore,
        lastDocument: result.lastDocument,
        totalItems: Math.max(resetPagination ? result.listings.length : listings.length + result.listings.length, prev.totalItems),
        totalPages: Math.ceil(Math.max(resetPagination ? result.listings.length : listings.length + result.listings.length, prev.totalItems) / prev.pageSize)
      }));

      // Calculate statistics
      if (resetPagination) {
        calculateStatistics(result.listings);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics from listings
  const calculateStatistics = (listingsData) => {
    const byType = {};
    const byStatus = {};
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Initialize counters
    Object.values(LISTING_TYPES).forEach(type => { byType[type] = 0 });
    Object.values(LISTING_STATUS).forEach(status => { byStatus[status] = 0 });
    
    let recentlyAdded = 0;
    
    listingsData.forEach(listing => {
      // Count by type
      if (listing.type) {
        byType[listing.type] = (byType[listing.type] || 0) + 1;
      }
      
      // Count by status
      if (listing.status) {
        byStatus[listing.status] = (byStatus[listing.status] || 0) + 1;
      }
      
      // Count recently added
      if (listing.createdAt) {
        const createdDate = listing.createdAt.toDate ? listing.createdAt.toDate() : new Date(listing.createdAt);
        if (createdDate > oneDayAgo) {
          recentlyAdded++;
        }
      }
    });
    
    setStats({
      total: listingsData.length,
      byType,
      byStatus,
      recentlyAdded,
      pendingApproval: byStatus[LISTING_STATUS.PENDING] || 0,
      publishedCount: byStatus[LISTING_STATUS.PUBLISHED] || 0
    });
  };

  // Initial and Filter-based Listing Fetch
  useEffect(() => {
    fetchListings(true);
  }, [filters.sortBy, filters.sortOrder]);

  // Handle applying filters
  const handleApplyFilters = () => {
    fetchListings(true);
    setFilterVisible(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterOptions({
      types: filterOptions.types.map(type => ({ ...type, checked: false })),
      statuses: filterOptions.statuses.map(status => ({ ...status, checked: false })),
      priceRange: { min: 0, max: 10000000 },
      dateRange: { start: null, end: null }
    });
  };

  // Handle Type Filter Toggle
  const handleTypeFilterToggle = (typeValue) => {
    setFilterOptions(prev => ({
      ...prev,
      types: prev.types.map(type => 
        type.value === typeValue ? { ...type, checked: !type.checked } : type
      )
    }));
  };

  // Handle Status Filter Toggle
  const handleStatusFilterToggle = (statusValue) => {
    setFilterOptions(prev => ({
      ...prev,
      statuses: prev.statuses.map(status => 
        status.value === statusValue ? { ...status, checked: !status.checked } : status
      )
    }));
  };

  // Handle Search
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
      fetchListings(true);
    }
  };

  // Handle Sort Change
  const handleSortChange = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle Selection Toggle
  const handleSelectionToggle = (listingId) => {
    setSelectedListings(prev => {
      if (prev.includes(listingId)) {
        return prev.filter(id => id !== listingId);
      } else {
        return [...prev, listingId];
      }
    });
  };

  // Handle Select All Toggle
  const handleSelectAllToggle = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map(listing => listing.id));
    }
  };

  // Handle Listing Deletion
  const handleDeleteListing = async () => {
    try {
      if (listingToDelete) {
        await ListingService.deleteListing(listingToDelete);
        
        // Update local state
        setListings(prev => prev.filter(listing => listing.id !== listingToDelete));
        toast.success('Listing deleted successfully');
        
        // Update statistics
        const deletedListing = listings.find(listing => listing.id === listingToDelete);
        if (deletedListing) {
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            byType: {
              ...prev.byType,
              [deletedListing.type]: prev.byType[deletedListing.type] - 1
            },
            byStatus: {
              ...prev.byStatus,
              [deletedListing.status]: prev.byStatus[deletedListing.status] - 1
            }
          }));
        }
      }
    } catch (err) {
      toast.error(`Failed to delete listing: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setListingToDelete(null);
    }
  };

  // Handle Bulk Deletion
  const handleBulkDelete = async () => {
    try {
      const promises = selectedListings.map(id => ListingService.deleteListing(id));
      await Promise.all(promises);
      
      // Update local state
      setListings(prev => prev.filter(listing => !selectedListings.includes(listing.id)));
      
      // Update statistics
      const deletedListings = listings.filter(listing => selectedListings.includes(listing.id));
      const newStats = { ...stats };
      
      deletedListings.forEach(listing => {
        newStats.total--;
        newStats.byType[listing.type]--;
        newStats.byStatus[listing.status]--;
      });
      
      setStats(newStats);
      setSelectedListings([]);
      toast.success(`Successfully deleted ${selectedListings.length} listings`);
    } catch (err) {
      toast.error(`Failed to delete listings: ${err.message}`);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (listingId, newStatus) => {
    try {
      await ListingService.updateListing(listingId, { status: newStatus });
      
      // Update local state
      setListings(prev => prev.map(listing => {
        if (listing.id === listingId) {
          // Update statistics
          const oldStatus = listing.status;
          setStats(prevStats => ({
            ...prevStats,
            byStatus: {
              ...prevStats.byStatus,
              [oldStatus]: prevStats.byStatus[oldStatus] - 1,
              [newStatus]: (prevStats.byStatus[newStatus] || 0) + 1
            }
          }));
          
          return { ...listing, status: newStatus };
        }
        return listing;
      }));
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  // Handle Pagination Change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({ ...prev, page: newPage }));
    
    // If going to a previous page, refetch with new pagination
    if (newPage < pagination.page) {
      fetchListings(true);
    } 
    // If going to a next page and we have more results, load more
    else if (newPage > pagination.page && pagination.hasMore) {
      fetchListings(false);
    }
  };

  // Export Listings
  const handleExportListings = async () => {
    try {
      setIsExporting(true);
      
      // In a real application, this would call an API endpoint to generate CSV
      // For now, we'll simulate the export with a basic CSV generation
      
      // Define headers based on common fields
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Location', 'Created Date', 
        'Price/Investment', 'Owner', 'Views', 'Contact Requests'
      ];
      
      // Transform listings to CSV rows
      const rows = listings.map(listing => [
        listing.id,
        listing.name,
        TYPE_NAMES[listing.type] || listing.type,
        listing.status,
        `${listing.location && listing.location.city ? listing.location.city : ''}, ${listing.location && listing.location.state ? listing.location.state : ''}`,
        listing.createdAt ? formatDate(listing.createdAt) : 'N/A',
        formatCurrency(
          listing.businessDetails && listing.businessDetails.sale && listing.businessDetails.sale.askingPrice && listing.businessDetails.sale.askingPrice.value ? 
          listing.businessDetails.sale.askingPrice.value : 
          (listing.franchiseDetails && listing.franchiseDetails.investment && listing.franchiseDetails.investment.investmentRange && listing.franchiseDetails.investment.investmentRange.min && listing.franchiseDetails.investment.investmentRange.min.value ? 
          listing.franchiseDetails.investment.investmentRange.min.value : 0)
        ),
        listing.ownerName || 'Unknown',
        listing.analytics && listing.analytics.viewCount ? listing.analytics.viewCount : 0,
        listing.analytics && listing.analytics.contactCount ? listing.analytics.contactCount : 0
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listings-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Listings exported successfully');
    } catch (err) {
      toast.error(`Failed to export listings: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Memoized listing filters for performance
  const filteredListings = useMemo(() => {
    return listings
      .filter(listing => {
        // Filter by search term
        if (filters.searchTerm && !listing.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
          return false;
        }
        
        // Apply current page pagination
        const startIdx = (pagination.page - 1) * pagination.pageSize;
        const endIdx = startIdx + pagination.pageSize;
        const listingIdx = listings.findIndex(l => l.id === listing.id);
        
        return listingIdx >= startIdx && listingIdx < endIdx;
      })
      .sort((a, b) => {
        // Apply sorting
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
        
        if (typeof aValue === 'string') {
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [listings, filters, pagination.page, pagination.pageSize]);

  // Render Rating Stars
  const renderRatingStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Render Price Information
  const renderPrice = (listing) => {
    let price = null;
    
    if (listing.type === LISTING_TYPES.BUSINESS && 
        listing.businessDetails && 
        listing.businessDetails.sale && 
        listing.businessDetails.sale.askingPrice && 
        listing.businessDetails.sale.askingPrice.value) {
      price = listing.businessDetails.sale.askingPrice.value;
    } else if (listing.type === LISTING_TYPES.FRANCHISE && 
               listing.franchiseDetails && 
               listing.franchiseDetails.investment && 
               listing.franchiseDetails.investment.investmentRange && 
               listing.franchiseDetails.investment.investmentRange.min && 
               listing.franchiseDetails.investment.investmentRange.min.value) {
      price = listing.franchiseDetails.investment.investmentRange.min.value;
    } else if (listing.type === LISTING_TYPES.STARTUP && 
               listing.startupDetails && 
               listing.startupDetails.funding && 
               listing.startupDetails.funding.current && 
               listing.startupDetails.funding.current.targetAmount && 
               listing.startupDetails.funding.current.targetAmount.value) {
      price = listing.startupDetails.funding.current.targetAmount.value;
    } else if (listing.type === LISTING_TYPES.DIGITAL_ASSET && 
               listing.digitalAssetDetails && 
               listing.digitalAssetDetails.sale && 
               listing.digitalAssetDetails.sale.price && 
               listing.digitalAssetDetails.sale.price.asking && 
               listing.digitalAssetDetails.sale.price.asking.value) {
      price = listing.digitalAssetDetails.sale.price.asking.value;
    }
    
    return price !== null ? formatCurrency(price) : 'N/A';
  };

  // Render Grid View
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && !listings.length ? (
          // Skeleton loaders for loading state
          Array(8).fill().map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-medium">No listings found</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              {error ? error : "Try adjusting your filters or search terms to see more results."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => {
              handleResetFilters();
              setFilters({...filters, searchTerm: ""});
              fetchListings(true);
            }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reset Filters
            </Button>
          </div>
        ) : (
          filteredListings.map(listing => {
            const TypeIcon = TYPE_ICONS[listing.type] || Store;
            
            return (
              <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardHeader className="p-0 relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="outline" className={`${STATUS_COLORS[listing.status] || 'bg-gray-100'}`}>
                      {listing.status}
                    </Badge>
                  </div>
                  <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                    {listing.media && listing.media.featuredImage && listing.media.featuredImage.url ? (
                      <img 
                        src={listing.media.featuredImage.url} 
                        alt={listing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <TypeIcon className="h-16 w-16 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="p-3 w-full">
                        <div className="flex justify-between text-white">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-xs">
                              {listing.createdAt 
                                ? formatDate(listing.createdAt)
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="text-xs">
                              {listing.analytics && listing.analytics.viewCount 
                                ? listing.analytics.viewCount 
                                : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium line-clamp-1">{listing.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {TYPE_NAMES[listing.type]}
                        </Badge>
                        {listing.location && listing.location.city && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="text-xs">{listing.location.city}, {listing.location.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedListings.includes(listing.id)}
                      onCheckedChange={() => handleSelectionToggle(listing.id)}
                      aria-label="Select listing"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{renderPrice(listing)}</p>
                    </div>
                    {listing.rating && (
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        {renderRatingStars(listing.rating.average)}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedListing(listing);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          Actions <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onSelect={() => {
                            setSelectedListing(listing);
                            setIsFormModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PUBLISHED)}
                          disabled={listing.status === LISTING_STATUS.PUBLISHED}
                        >
                          <Check className="h-4 w-4 mr-2 text-green-600" /> Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PENDING)}
                          disabled={listing.status === LISTING_STATUS.PENDING}
                        >
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" /> Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.REJECTED)}
                          disabled={listing.status === LISTING_STATUS.REJECTED}
                        >
                          <X className="h-4 w-4 mr-2 text-red-600" /> Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.ARCHIVED)}
                          disabled={listing.status === LISTING_STATUS.ARCHIVED}
                        >
                          <Archive className="h-4 w-4 mr-2 text-gray-600" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onSelect={() => {
                            setListingToDelete(listing.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // Render Table View
  const renderTableView = () => {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                  onCheckedChange={handleSelectAllToggle}
                  aria-label="Select all listings"
                />
              </TableHead>
              <TableHead 
                className="w-1/5 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSortChange('name')}
              >
                <div className="flex items-center">
                  Name
                  {filters.sortBy === 'name' && (
                    <ArrowUpDown className={`h-4 w-4 ml-2 ${
                      filters.sortOrder === 'asc' ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSortChange('createdAt')}
              >
                <div className="flex items-center">
                  Created
                  {filters.sortBy === 'createdAt' && (
                    <ArrowUpDown className={`h-4 w-4 ml-2 ${
                      filters.sortOrder === 'asc' ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !listings.length ? (
              // Skeleton loaders for loading state
              Array(5).fill().map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <p className="text-gray-500">No listings found. Try adjusting your filters.</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      handleResetFilters();
                      setFilters({...filters, searchTerm: ""});
                      fetchListings(true);
                    }}>
                      Reset Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredListings.map(listing => {
                const TypeIcon = TYPE_ICONS[listing.type] || Store;
                
                return (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedListings.includes(listing.id)}
                        onCheckedChange={() => handleSelectionToggle(listing.id)}
                        aria-label={`Select ${listing.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium truncate max-w-xs" title={listing.name}>
                        {listing.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {TYPE_NAMES[listing.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[listing.status] || 'bg-gray-100'}>
                        {listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {listing.location && listing.location.city ? (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                          {listing.location.city}, {listing.location.state}
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {listing.createdAt 
                        ? formatDate(listing.createdAt)
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{renderPrice(listing)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedListing(listing);
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
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setIsFormModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Listing</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>More Actions</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PUBLISHED)}
                              disabled={listing.status === LISTING_STATUS.PUBLISHED}
                            >
                              <Check className="h-4 w-4 mr-2 text-green-600" /> Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PENDING)}
                              disabled={listing.status === LISTING_STATUS.PENDING}
                            >
                              <Clock className="h-4 w-4 mr-2 text-yellow-600" /> Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.REJECTED)}
                              disabled={listing.status === LISTING_STATUS.REJECTED}
                            >
                              <X className="h-4 w-4 mr-2 text-red-600" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.ARCHIVED)}
                              disabled={listing.status === LISTING_STATUS.ARCHIVED}
                            >
                              <Archive className="h-4 w-4 mr-2 text-gray-600" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={() => {
                                setListingToDelete(listing.id);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render Card View
  const renderCardView = () => {
    return (
      <div className="space-y-6">
        {isLoading && !listings.length ? (
          // Skeleton loaders for loading state
          Array(5).fill().map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 w-full">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">No listings found</h3>
              <p className="text-gray-500 mt-2">
                Try adjusting your filters or search terms to see more results.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => {
                handleResetFilters();
                setFilters({...filters, searchTerm: ""});
                fetchListings(true);
              }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredListings.map(listing => {
            const TypeIcon = TYPE_ICONS[listing.type] || Store;
            
            return (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{listing.name}</h3>
                        <Checkbox
                          checked={selectedListings.includes(listing.id)}
                          onCheckedChange={() => handleSelectionToggle(listing.id)}
                          aria-label={`Select ${listing.name}`}
                          className="ml-4"
                        />
                      </div>
                      
                      <div className="flex space-x-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {TYPE_NAMES[listing.type]}
                        </Badge>
                        <Badge variant="outline" className={STATUS_COLORS[listing.status] || 'bg-gray-100'}>
                          {listing.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-500 mt-3 line-clamp-2">
                        {listing.shortDescription || listing.description || 'No description available.'}
                      </p>
                    </div>
                    
                    <div className="min-w-[80px] h-20 bg-gray-100 rounded-md flex items-center justify-center">
                      {listing.media && listing.media.featuredImage && listing.media.featuredImage.url ? (
                        <img 
                          src={listing.media.featuredImage.url} 
                          alt={listing.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <TypeIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">
                        {listing.location && listing.location.city 
                          ? `${listing.location.city}, ${listing.location.state}` 
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{renderPrice(listing)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {listing.createdAt 
                          ? formatDate(listing.createdAt)
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Views</p>
                      <p className="font-medium">
                        {listing.analytics && listing.analytics.viewCount 
                          ? listing.analytics.viewCount 
                          : 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedListing(listing);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedListing(listing);
                        setIsFormModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          More <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PUBLISHED)}
                          disabled={listing.status === LISTING_STATUS.PUBLISHED}
                        >
                          <Check className="h-4 w-4 mr-2 text-green-600" /> Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.PENDING)}
                          disabled={listing.status === LISTING_STATUS.PENDING}
                        >
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" /> Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.REJECTED)}
                          disabled={listing.status === LISTING_STATUS.REJECTED}
                        >
                          <X className="h-4 w-4 mr-2 text-red-600" /> Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(listing.id, LISTING_STATUS.ARCHIVED)}
                          disabled={listing.status === LISTING_STATUS.ARCHIVED}
                        >
                          <Archive className="h-4 w-4 mr-2 text-gray-600" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onSelect={() => {
                            setListingToDelete(listing.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // Render Statistics Cards
  const renderStatCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Listings</p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">By Listing Type</span>
              </div>
              <div className="space-y-2 mt-2">
                {Object.entries(stats.byType || {}).map(([type, count]) => (
                  <div key={type} className="text-xs flex justify-between">
                    <span className="flex items-center">
                    {(() => {
  const IconComponent = TYPE_ICONS[type];
  return IconComponent ? <IconComponent className="h-3 w-3 mr-1" /> : null;
})()}
                      {TYPE_NAMES[type] || type}
                    </span>
                    <span className="font-medium">{count || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Status Distribution</p>
                <h3 className="text-2xl font-bold mt-1">{stats.publishedCount}</h3>
                <p className="text-xs text-gray-500 mt-1">Published listings</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              {/* Draft status */}
              <div className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>Draft</span>
                  <span className="font-medium">{getStatusCount(LISTING_STATUS.DRAFT)}</span>
                </div>
                <Progress 
                  value={getStatusPercentage(LISTING_STATUS.DRAFT)}
                  className="h-1.5 w-full bg-gray-100" 
                />
              </div>
              
              {/* Pending status */}
              <div className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>Pending</span>
                  <span className="font-medium">{getStatusCount(LISTING_STATUS.PENDING)}</span>
                </div>
                <Progress 
                  value={getStatusPercentage(LISTING_STATUS.PENDING)}
                  className="h-1.5 w-full bg-gray-100" 
                />
              </div>
              
              {/* Published status */}
              <div className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>Published</span>
                  <span className="font-medium">{getStatusCount(LISTING_STATUS.PUBLISHED)}</span>
                </div>
                <Progress 
                  value={getStatusPercentage(LISTING_STATUS.PUBLISHED)}
                  className="h-1.5 w-full bg-gray-100" 
                />
              </div>
              
              {/* Rejected status */}
              <div className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>Rejected</span>
                  <span className="font-medium">{getStatusCount(LISTING_STATUS.REJECTED)}</span>
                </div>
                <Progress 
                  value={getStatusPercentage(LISTING_STATUS.REJECTED)}
                  className="h-1.5 w-full bg-gray-100" 
                />
              </div>
              
              {/* Archived status */}
              <div>
                <div className="flex justify-between text-xs">
                  <span>Archived</span>
                  <span className="font-medium">{getStatusCount(LISTING_STATUS.ARCHIVED)}</span>
                </div>
                <Progress 
                  value={getStatusPercentage(LISTING_STATUS.ARCHIVED)}
                  className="h-1.5 w-full bg-gray-100" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingApproval}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: stats.total ? `${(stats.pendingApproval / stats.total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500 ml-2">
                  {stats.total ? Math.round((stats.pendingApproval / stats.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.pendingApproval} out of {stats.total} listings require review
              </p>
              {stats.pendingApproval > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-800 hover:bg-transparent"
                  onClick={() => {
                    // Set filter to show only pending listings
                    const newFilterOptions = { ...filterOptions };
                    newFilterOptions.statuses = newFilterOptions.statuses.map(status => ({
                      ...status,
                      checked: status.value === LISTING_STATUS.PENDING
                    }));
                    setFilterOptions(newFilterOptions);
                    handleApplyFilters();
                  }}
                >
                  View pending listings
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Recently Added</p>
                <h3 className="text-2xl font-bold mt-1">{stats.recentlyAdded}</h3>
                <p className="text-xs text-gray-500 mt-1">In the last 24 hours</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <PlusCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsFormModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add New Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render View Content
  const renderViewContent = () => {
    switch(currentView) {
      case 'table':
        return renderTableView();
      case 'card':
        return renderCardView();
      case 'grid':
      default:
        return renderGridView();
    }
  };

  // Render Listing Detail in View Modal
  const renderListingDetail = (listing) => {
    if (!listing) return null;
    
    const TypeIcon = TYPE_ICONS[listing.type] || Store;
    
    // Determine which type-specific details to show
    const renderTypeSpecificDetails = () => {
      switch(listing.type) {
        case LISTING_TYPES.BUSINESS:
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Business Type</h4>
                <p>{listing.businessDetails && listing.businessDetails.businessType 
                    ? listing.businessDetails.businessType 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Established Year</h4>
                <p>{listing.businessDetails && listing.businessDetails.establishedYear 
                    ? listing.businessDetails.establishedYear 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Asking Price</h4>
                <p className="font-medium">{
                  listing.businessDetails && 
                  listing.businessDetails.sale && 
                  listing.businessDetails.sale.askingPrice && 
                  listing.businessDetails.sale.askingPrice.value
                    ? formatCurrency(listing.businessDetails.sale.askingPrice.value)
                    : 'N/A'
                }</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reason for Selling</h4>
                <p>{listing.businessDetails && 
                   listing.businessDetails.sale && 
                   listing.businessDetails.sale.reasonForSelling 
                    ? listing.businessDetails.sale.reasonForSelling 
                    : 'N/A'}</p>
              </div>
            </div>
          );
        
        case LISTING_TYPES.FRANCHISE:
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Franchise Type</h4>
                <p>{listing.franchiseDetails && listing.franchiseDetails.franchiseType 
                    ? listing.franchiseDetails.franchiseType 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Outlets</h4>
                <p>{listing.franchiseDetails && listing.franchiseDetails.totalOutlets 
                    ? listing.franchiseDetails.totalOutlets 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Investment Range</h4>
                <p className="font-medium">
                  {listing.franchiseDetails && 
                   listing.franchiseDetails.investment && 
                   listing.franchiseDetails.investment.investmentRange && 
                   listing.franchiseDetails.investment.investmentRange.min && 
                   listing.franchiseDetails.investment.investmentRange.min.value
                    ? `${formatCurrency(listing.franchiseDetails.investment.investmentRange.min.value)} - 
                       ${listing.franchiseDetails.investment.investmentRange.max && 
                         listing.franchiseDetails.investment.investmentRange.max.value
                          ? formatCurrency(listing.franchiseDetails.investment.investmentRange.max.value)
                          : formatCurrency(0)}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          );
          
        case LISTING_TYPES.STARTUP:
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Startup Stage</h4>
                <p>{listing.startupDetails && listing.startupDetails.stage 
                    ? listing.startupDetails.stage 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Funding Target</h4>
                <p className="font-medium">
                  {listing.startupDetails && 
                   listing.startupDetails.funding && 
                   listing.startupDetails.funding.current && 
                   listing.startupDetails.funding.current.targetAmount && 
                   listing.startupDetails.funding.current.targetAmount.value
                    ? formatCurrency(listing.startupDetails.funding.current.targetAmount.value)
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Founders</h4>
                <div className="space-y-2 mt-1">
                  {listing.startupDetails && 
                   listing.startupDetails.team && 
                   listing.startupDetails.team.founders && 
                   listing.startupDetails.team.founders.length
                    ? listing.startupDetails.team.founders.map((founder, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{founder.name ? founder.name.charAt(0) : "F"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{founder.name}</p>
                            <p className="text-xs text-gray-500">{founder.role}</p>
                          </div>
                        </div>
                      ))
                    : <p>No founders listed</p>
                  }
                </div>
              </div>
            </div>
          );
          
        case LISTING_TYPES.INVESTOR:
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Investor Type</h4>
                <p>{listing.investorDetails && listing.investorDetails.investorType 
                    ? listing.investorDetails.investorType 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Minimum Investment</h4>
                <p className="font-medium">
                  {listing.investorDetails && 
                   listing.investorDetails.investment && 
                   listing.investorDetails.investment.capacity && 
                   listing.investorDetails.investment.capacity.minInvestment && 
                   listing.investorDetails.investment.capacity.minInvestment.value
                    ? formatCurrency(listing.investorDetails.investment.capacity.minInvestment.value)
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Focus Industries</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {listing.investorDetails && 
                   listing.investorDetails.focus && 
                   listing.investorDetails.focus.industries && 
                   listing.investorDetails.focus.industries.primary && 
                   listing.investorDetails.focus.industries.primary.length
                    ? listing.investorDetails.focus.industries.primary.map((industry, index) => (
                        <Badge key={index} variant="outline">{industry}</Badge>
                      ))
                    : <p>No industries listed</p>
                  }
                </div>
              </div>
            </div>
          );
          
        case LISTING_TYPES.DIGITAL_ASSET:
          return (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Asset Type</h4>
                <p>{listing.digitalAssetDetails && listing.digitalAssetDetails.assetType 
                    ? listing.digitalAssetDetails.assetType 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Asking Price</h4>
                <p className="font-medium">
                  {listing.digitalAssetDetails && 
                   listing.digitalAssetDetails.sale && 
                   listing.digitalAssetDetails.sale.price && 
                   listing.digitalAssetDetails.sale.price.asking && 
                   listing.digitalAssetDetails.sale.price.asking.value
                    ? formatCurrency(listing.digitalAssetDetails.sale.price.asking.value)
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Monthly Visitors</h4>
                <p>
                  {listing.digitalAssetDetails && 
                   listing.digitalAssetDetails.traffic && 
                   listing.digitalAssetDetails.traffic.overview && 
                   listing.digitalAssetDetails.traffic.overview.monthlyVisitors
                    ? listing.digitalAssetDetails.traffic.overview.monthlyVisitors.toLocaleString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          );
          
        default:
          return <p>No additional details available for this listing type.</p>;
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TypeIcon className="h-6 w-6 mr-2 text-blue-600" />
            <h2 className="text-2xl font-bold">{listing.name}</h2>
          </div>
          <Badge variant="outline" className={STATUS_COLORS[listing.status] || 'bg-gray-100'}>
            {listing.status}
          </Badge>
        </div>
        
        <div className="h-56 bg-gray-100 rounded-md flex items-center justify-center relative">
          {listing.media && listing.media.featuredImage && listing.media.featuredImage.url ? (
            <img 
              src={listing.media.featuredImage.url} 
              alt={listing.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <TypeIcon className="h-16 w-16 text-gray-400" />
          )}
        </div>
        
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p>{TYPE_NAMES[listing.type] || listing.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    <p>
                      {listing.location && listing.location.city 
                        ? `${listing.location.city}, ${listing.location.state}` 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created</h4>
                  <p>
                    {listing.createdAt 
                      ? formatDate(listing.createdAt)
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Listed By</h4>
                  <p>{listing.ownerName || 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-700">
                {listing.description || 'No description available.'}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Type-Specific Details</h3>
              {renderTypeSpecificDetails()}
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                <p>{listing.contactInfo && listing.contactInfo.email 
                    ? listing.contactInfo.email 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                <p>{listing.contactInfo && listing.contactInfo.phone 
                    ? listing.contactInfo.phone 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Contact Person</h4>
                <p>{listing.contactInfo && listing.contactInfo.contactName 
                    ? listing.contactInfo.contactName 
                    : 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Website</h4>
                <p>
                  {listing.contactInfo && listing.contactInfo.website 
                    ? (
                        <a 
                          href={listing.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {listing.contactInfo.website}
                        </a>
                      )
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Social Media</h3>
              <div className="grid grid-cols-2 gap-4">
                {listing.contactInfo && listing.contactInfo.socialMedia 
                  ? Object.entries(listing.contactInfo.socialMedia).map(([platform, details]) => (
                    <div key={platform}>
                      <h4 className="text-sm font-medium text-gray-500 capitalize">{platform}</h4>
                      <div className="flex items-center">
                        <p>
                          {details && details.handle ? details.handle : 'N/A'}
                          {details && details.isVerified && (
                            <Check className="inline-block h-3 w-3 ml-1 text-green-600" />
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                  : <p>No social media accounts available.</p>
                }
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Views</p>
                  <p className="text-2xl font-bold">
                    {listing.analytics && listing.analytics.viewCount 
                      ? listing.analytics.viewCount 
                      : 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Unique Views</p>
                  <p className="text-2xl font-bold">
                    {listing.analytics && listing.analytics.uniqueViewCount 
                      ? listing.analytics.uniqueViewCount 
                      : 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Contacts</p>
                  <p className="text-2xl font-bold">
                    {listing.analytics && listing.analytics.contactCount 
                      ? listing.analytics.contactCount 
                      : 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Favorites</p>
                  <p className="text-2xl font-bold">
                    {listing.analytics && listing.analytics.favoriteCount 
                      ? listing.analytics.favoriteCount 
                      : 0}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {listing.analytics && 
             listing.analytics.viewsTimeline && 
             listing.analytics.viewsTimeline.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">View Timeline</h3>
                <div className="h-48 bg-gray-50 rounded-md p-4 flex items-end justify-between">
                  {listing.analytics.viewsTimeline.map((item, i) => {
                    let maxCount = 1;
                    if (listing.analytics && 
                        listing.analytics.viewsTimeline && 
                        listing.analytics.viewsTimeline.length > 0) {
                      const counts = listing.analytics.viewsTimeline.map(t => t.count || 0);
                      maxCount = Math.max(...counts, 1);
                    }
                    
                    const height = Math.max(
                      10, 
                      ((item && item.count ? item.count : 0) / maxCount) * 100
                    );
                    
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="bg-blue-500 rounded-t w-6" 
                              style={{ height: `${height}%` }}
                            ></div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {`${item && item.date ? formatDate(item.date) : 'Unknown'}: ${item && item.count ? item.count : 0} views`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Device Breakdown</h3>
              {listing.analytics && listing.analytics.deviceBreakdown ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Desktop</p>
                    <p className="font-medium">
                      {listing.analytics.deviceBreakdown.desktop || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">
                      {listing.analytics.deviceBreakdown.mobile || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tablet</p>
                    <p className="font-medium">
                      {listing.analytics.deviceBreakdown.tablet || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No device data available.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                handleStatusChange(listing.id, LISTING_STATUS.PUBLISHED);
                setIsViewModalOpen(false);
              }}
              disabled={listing.status === LISTING_STATUS.PUBLISHED}
            >
              <Check className="h-4 w-4 mr-2" /> Publish
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Status <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    handleStatusChange(listing.id, LISTING_STATUS.DRAFT);
                    setIsViewModalOpen(false);
                  }}
                  disabled={listing.status === LISTING_STATUS.DRAFT}
                >
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleStatusChange(listing.id, LISTING_STATUS.PENDING);
                    setIsViewModalOpen(false);
                  }}
                  disabled={listing.status === LISTING_STATUS.PENDING}
                >
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleStatusChange(listing.id, LISTING_STATUS.REJECTED);
                    setIsViewModalOpen(false);
                  }}
                  disabled={listing.status === LISTING_STATUS.REJECTED}
                >
                  Rejected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleStatusChange(listing.id, LISTING_STATUS.ARCHIVED);
                    setIsViewModalOpen(false);
                  }}
                  disabled={listing.status === LISTING_STATUS.ARCHIVED}
                >
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedListing(listing);
                setIsFormModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button 
              variant="default"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Business Listings</h1>
          <p className="text-gray-500">Manage all your business, franchise, startup, investor, and digital asset listings</p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setHelpModalOpen(true)}>
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help & Instructions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={handleExportListings}
                  disabled={isExporting || listings.length === 0}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export listings to CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={() => setIsFormModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {renderStatCards()}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search listings..." 
              className="pl-10"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              onKeyDown={handleSearch}
            />
          </div>
          
          <Sheet open={filterVisible} onOpenChange={setFilterVisible}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filterOptions.types.some(t => t.checked) || filterOptions.statuses.some(s => s.checked)) && (
                  <Badge className="ml-2 bg-blue-500" variant="default">
                    {filterOptions.types.filter(t => t.checked).length + 
                     filterOptions.statuses.filter(s => s.checked).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter listings by type, status, and other criteria
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Listing Type</h3>
                  <div className="space-y-2">
                    {filterOptions.types.map(type => (
                      <div key={type.value} className="flex items-center">
                        <Checkbox
                          id={`type-${type.value}`}
                          checked={type.checked}
                          onCheckedChange={() => handleTypeFilterToggle(type.value)}
                        />
                        <Label htmlFor={`type-${type.value}`} className="ml-2 text-sm">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="space-y-2">
                    {filterOptions.statuses.map(status => (
                      <div key={status.value} className="flex items-center">
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={status.checked}
                          onCheckedChange={() => handleStatusFilterToggle(status.value)}
                        />
                        <Label htmlFor={`status-${status.value}`} className="ml-2 text-sm">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between space-x-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleApplyFilters}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {selectedListings.length > 0 && (
            <div className="flex items-center space-x-2 mr-2">
              <span className="text-sm text-gray-500">
                {selectedListings.length} selected
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => setIsBulkDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
          
          <span className="hidden sm:inline-block text-gray-400">|</span>
          
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500 hidden sm:block">View:</p>
            <div className="border rounded-md p-1 flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={currentView === 'grid' ? 'default' : 'ghost'} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentView('grid')}
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
                      variant={currentView === 'table' ? 'default' : 'ghost'} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentView('table')}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
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
                      variant={currentView === 'card' ? 'default' : 'ghost'} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentView('card')}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Card View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {renderViewContent()}

      {/* Pagination */}
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Calculate which page numbers to show
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else {
                if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
              }
              
              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pageNum === pagination.page}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore || pagination.page >= pagination.totalPages || isLoading}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Add/Edit Listing Modal */}
      <Dialog 
        open={isFormModalOpen} 
        onOpenChange={setIsFormModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedListing ? 'Edit Listing' : 'Create New Listing'}
            </DialogTitle>
            <DialogDescription>
              {selectedListing 
                ? `Modify details for ${selectedListing.name}` 
                : 'Enter details for your new business listing'}
            </DialogDescription>
          </DialogHeader>
          <ListingFormPage 
            id={selectedListing?.id}
            onSubmitSuccess={() => {
              setIsFormModalOpen(false);
              fetchListings(true);
              setSelectedListing(null);
              toast.success(
                selectedListing 
                  ? 'Listing updated successfully' 
                  : 'New listing created successfully'
              );
            }}
            onCancel={() => {
              setIsFormModalOpen(false);
              setSelectedListing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Listing Modal */}
      <Dialog 
        open={isViewModalOpen} 
        onOpenChange={setIsViewModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedListing ? renderListingDetail(selectedListing) : (
            <div className="py-12 text-center">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Loading listing details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDeleteListing}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Modal */}
      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Listings</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleBulkDelete}
            >
              Delete {selectedListings.length} Listing{selectedListings.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Modal */}
      <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listings Management Help</DialogTitle>
            <DialogDescription>
              Learn how to effectively manage all your business listings in the admin panel
            </DialogDescription>
          </DialogHeader>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overview">
              <AccordionTrigger>Overview</AccordionTrigger>
              <AccordionContent>
                <p>
                  The Listings Management page allows you to view, create, edit, and manage all 
                  business listings across different categories. You can filter listings by type and status, 
                  search for specific listings, and perform bulk actions.
                </p>
                <p className="mt-2">
                  The top section provides statistics about your listings, while the main section
                  displays the listings in your preferred view format (grid, table, or card).
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="adding">
              <AccordionTrigger>Adding New Listings</AccordionTrigger>
              <AccordionContent>
                <p>To add a new listing:</p>
                <ol className="list-decimal ml-4 space-y-2 mt-2">
                  <li>Click the <span className="font-medium">Add New</span> button in the top-right corner</li>
                  <li>Select the listing type (Business, Franchise, Startup, Investor, or Digital Asset)</li>
                  <li>Fill in the required information in the form</li>
                  <li>Click <span className="font-medium">Create Listing</span> to save</li>
                </ol>
                <p className="mt-2">
                  Each listing type has different required fields. The form will automatically adapt based on 
                  the selected type.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="editing">
              <AccordionTrigger>Editing Listings</AccordionTrigger>
              <AccordionContent>
                <p>To edit an existing listing:</p>
                <ol className="list-decimal ml-4 space-y-2 mt-2">
                  <li>Find the listing you want to edit</li>
                  <li>Click the <span className="font-medium">Edit</span> button or select Edit from the actions menu</li>
                  <li>Make your changes in the form</li>
                  <li>Click <span className="font-medium">Update Listing</span> to save your changes</li>
                </ol>
                <p className="mt-2">
                  You cannot change the listing type once a listing has been created.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="status">
              <AccordionTrigger>Changing Listing Status</AccordionTrigger>
              <AccordionContent>
                <p>Listings can have the following statuses:</p>
                <ul className="list-disc ml-4 space-y-2 mt-2">
                  <li><span className="font-medium">Draft</span> - Listing is saved but not visible to users</li>
                  <li><span className="font-medium">Pending</span> - Listing is awaiting approval</li>
                  <li><span className="font-medium">Published</span> - Listing is approved and visible to users</li>
                  <li><span className="font-medium">Rejected</span> - Listing has been rejected</li>
                  <li><span className="font-medium">Archived</span> - Listing is no longer active</li>
                </ul>
                <p className="mt-2">
                  To change a listing's status, use the status dropdown in the actions menu or
                  the status buttons when viewing a listing's details.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="deleting">
              <AccordionTrigger>Deleting Listings</AccordionTrigger>
              <AccordionContent>
                <p>
                  To delete a single listing, click the Delete option in the actions menu. 
                  You will be asked to confirm before the listing is deleted.
                </p>
                <p className="mt-2">
                  To delete multiple listings:
                </p>
                <ol className="list-decimal ml-4 space-y-2 mt-2">
                  <li>Select the listings you want to delete using the checkboxes</li>
                  <li>Click the <span className="font-medium">Delete</span> button that appears when listings are selected</li>
                  <li>Confirm the deletion in the dialog that appears</li>
                </ol>
                <p className="mt-2 text-red-600">
                  Warning: Deletion is permanent and cannot be undone.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="filtering">
              <AccordionTrigger>Filtering & Searching</AccordionTrigger>
              <AccordionContent>
                <p>
                  Use the search box to quickly find listings by name or description.
                </p>
                <p className="mt-2">
                  To apply more specific filters:
                </p>
                <ol className="list-decimal ml-4 space-y-2 mt-2">
                  <li>Click the <span className="font-medium">Filters</span> button</li>
                  <li>Select the filters you want to apply (listing type, status, etc.)</li>
                  <li>Click <span className="font-medium">Apply Filters</span></li>
                </ol>
                <p className="mt-2">
                  To clear all filters, click <span className="font-medium">Reset</span> in the filter panel
                  or use the reset button that appears when no results are found.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="views">
              <AccordionTrigger>Different View Types</AccordionTrigger>
              <AccordionContent>
                <p>
                  The listings page offers three different view types:
                </p>
                <ul className="list-disc ml-4 space-y-2 mt-2">
                  <li><span className="font-medium">Grid View</span> - Visual card-based layout with images</li>
                  <li><span className="font-medium">Table View</span> - Compact tabular format with sortable columns</li>
                  <li><span className="font-medium">Card View</span> - Detailed list view with more information per listing</li>
                </ul>
                <p className="mt-2">
                  Switch between views using the view selector buttons in the top-right corner.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="exporting">
              <AccordionTrigger>Exporting Listings</AccordionTrigger>
              <AccordionContent>
                <p>
                  To export your listings to a CSV file:
                </p>
                <ol className="list-decimal ml-4 space-y-2 mt-2">
                  <li>Apply any filters if you want to export a specific subset of listings</li>
                  <li>Click the <span className="font-medium">Export</span> button in the top action bar</li>
                  <li>Wait for the export to complete</li>
                  <li>The CSV file will automatically download to your computer</li>
                </ol>
                <p className="mt-2">
                  The exported file includes all visible columns and data from your current view.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setHelpModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingsPage;