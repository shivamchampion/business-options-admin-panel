import React, { useState, useEffect } from 'react';
import { 
  Store, 
  PlusCircle, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  Search
} from 'lucide-react';

// Utility and Service Imports
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';
import { ListingService } from '../services/database/listing';
import { formatCurrency, formatDate } from '../utils/helpers';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';

// Custom Components
import ListingFormPage from './ListingFormPage';

// Type and Status Styling
const TYPE_ICONS = {
  [LISTING_TYPES.BUSINESS]: Store,
  [LISTING_TYPES.FRANCHISE]: Store,
  [LISTING_TYPES.STARTUP]: Store,
  [LISTING_TYPES.INVESTOR]: Store,
  [LISTING_TYPES.DIGITAL_ASSET]: Store
};

const STATUS_COLORS = {
  [LISTING_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [LISTING_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [LISTING_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [LISTING_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [LISTING_STATUS.ARCHIVED]: 'bg-slate-100 text-slate-800'
};

const ListingsPage = () => {
  // State Management
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    searchTerm: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    hasMore: false
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch Listings
  const fetchListings = async (resetPagination = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ListingService.getListings(
        filters, 
        pagination.pageSize, 
        resetPagination ? null : pagination.lastDocument
      );

      setListings(resetPagination ? result.listings : [...listings, ...result.listings]);
      setPagination(prev => ({
        ...prev,
        hasMore: result.hasMore,
        lastDocument: result.lastDocument
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial and Filter-based Listing Fetch
  useEffect(() => {
    fetchListings(true);
  }, [filters]);

  // Handle Listing Deletion
  const handleDeleteListing = async (listingId) => {
    try {
      await ListingService.deleteListing(listingId);
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (err) {
      setError('Failed to delete listing');
    }
  };

  // Render Listing Item
  const renderListingItem = (listing) => {
    const TypeIcon = TYPE_ICONS[listing.type] || Store;

    return (
      <Card key={listing.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center">
            <TypeIcon className="h-5 w-5 mr-2" />
            <CardTitle className="text-sm font-medium">
              {listing.name}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={STATUS_COLORS[listing.status] || 'bg-gray-100'}
          >
            {listing.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-semibold">
                {listing.location?.city || 'N/A'}, {listing.location?.state || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-semibold">
                {formatCurrency(
                  listing.businessDetails?.sale?.askingPrice?.value || 
                  listing.franchiseDetails?.investment?.investmentRange?.min?.value || 
                  0
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedListing(listing);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" /> View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onSelect={() => {
                    setSelectedListing(listing);
                    setIsFormModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => handleDeleteListing(listing.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Business Listings</h1>
        <Button onClick={() => setIsFormModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Listing
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search listings..." 
            className="pl-10"
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({
              ...prev, 
              searchTerm: e.target.value
            }))}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map(renderListingItem)}
      </div>

      {/* Modals */}
      <Dialog 
        open={isFormModalOpen} 
        onOpenChange={setIsFormModalOpen}
      >
        <DialogContent className="max-w-4xl">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedListing?.name || 'Listing Details'}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected listing
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div>
              <p>{selectedListing.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p>{selectedListing.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{selectedListing.status}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingsPage;