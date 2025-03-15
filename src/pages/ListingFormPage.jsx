import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  Store, Briefcase, TrendingUp, DollarSign, Globe, 
  Save, X, AlertCircle, CheckCircle 
} from 'lucide-react';

// Utility Imports
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';
import { getListingValidationSchema } from '../utils/validation/listing-schemas';
import { ListingService } from '../services/database/listing';

// UI Components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Type Icons Mapping
const TYPE_ICONS = {
  [LISTING_TYPES.BUSINESS]: Store,
  [LISTING_TYPES.FRANCHISE]: Briefcase,
  [LISTING_TYPES.STARTUP]: TrendingUp,
  [LISTING_TYPES.INVESTOR]: DollarSign,
  [LISTING_TYPES.DIGITAL_ASSET]: Globe
};

const ListingFormPage = ({ 
  id = null, 
  onSubmitSuccess = () => {}, 
  onCancel = () => {} 
}) => {
  const isEditMode = !!id;

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [listingType, setListingType] = useState(LISTING_TYPES.BUSINESS);

  // Form Management
  const validationSchema = useMemo(() => 
    getListingValidationSchema(listingType), 
    [listingType]
  );

  const { 
    control, 
    handleSubmit, 
    setValue, 
    reset, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: LISTING_TYPES.BUSINESS,
      status: LISTING_STATUS.DRAFT,
      name: '',
      description: '',
      location: {
        country: 'IN',
        state: '',
        city: ''
      },
      contactInfo: {
        email: '',
        phone: ''
      }
    }
  });

  // Fetch existing listing for edit mode
  useEffect(() => {
    const fetchListing = async () => {
      if (isEditMode) {
        try {
          const listing = await ListingService.getListingById(id);
          if (listing) {
            reset(listing);
            setListingType(listing.type);
          }
        } catch (error) {
          setFormError('Failed to load listing');
        }
      }
    };

    fetchListing();
  }, [id, isEditMode, reset]);

  // Form Submission Handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isEditMode) {
        await ListingService.updateListing(id, data);
      } else {
        await ListingService.createListing(data);
      }
      
      onSubmitSuccess();
    } catch (error) {
      // Parse and display validation errors
      try {
        const parsedErrors = JSON.parse(error.message);
        const errorMessages = Object.entries(parsedErrors)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        setFormError(errorMessages);
      } catch {
        setFormError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render type-specific form sections
  const renderTypeSpecificFields = () => {
    switch (listingType) {
      case LISTING_TYPES.BUSINESS:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Business Type</Label>
                <Controller
                  name="businessDetails.businessType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Business Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Sole Proprietorship', 'Partnership', 'Private Limited'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.businessDetails?.businessType && (
                  <p className="text-red-500 text-sm">
                    {errors.businessDetails.businessType.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Established Year</Label>
                <Controller
                  name="businessDetails.establishedYear"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.businessDetails?.establishedYear && (
                  <p className="text-red-500 text-sm">
                    {errors.businessDetails.establishedYear.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Asking Price</Label>
              <Controller
                name="businessDetails.sale.askingPrice.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              {errors.businessDetails?.sale?.askingPrice?.value && (
                <p className="text-red-500 text-sm">
                  {errors.businessDetails.sale.askingPrice.value.message}
                </p>
              )}
            </div>
          </div>
        );
      
      case LISTING_TYPES.FRANCHISE:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Franchise Type</Label>
                <Controller
                  name="franchiseDetails.franchiseType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Franchise Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Food & Beverage', 'Retail', 'Services'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.franchiseDetails?.franchiseType && (
                  <p className="text-red-500 text-sm">
                    {errors.franchiseDetails.franchiseType.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Total Outlets</Label>
                <Controller
                  name="franchiseDetails.totalOutlets"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.franchiseDetails?.totalOutlets && (
                  <p className="text-red-500 text-sm">
                    {errors.franchiseDetails.totalOutlets.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Minimum Investment</Label>
              <Controller
                name="franchiseDetails.investment.investmentRange.min.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              {errors.franchiseDetails?.investment?.investmentRange?.min?.value && (
                <p className="text-red-500 text-sm">
                  {errors.franchiseDetails.investment.investmentRange.min.value.message}
                </p>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Listing' : 'Create New Listing'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Listing Type Selection */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.values(LISTING_TYPES).map(type => {
                const Icon = TYPE_ICONS[type];
                return (
                  <Button
                    key={type}
                    type="button"
                    variant={listingType === type ? 'default' : 'outline'}
                    onClick={() => {
                      setListingType(type);
                      setValue('type', type);
                    }}
                    className="flex flex-col items-center justify-center h-24"
                  >
                    <Icon className="h-6 w-6 mb-2" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                );
              })}
            </div>

            {/* Basic Listing Information */}
            <div className="space-y-4">
              <div>
                <Label>Listing Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label>Description</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Textarea {...field} />}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description.message}</p>
                )}
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Country</Label>
                  <Controller
                    name="location.country"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Controller
                    name="location.state"
                    control={control}
                    render={({ field }) => <Input {...field} />}
                  />
                  {errors.location?.state && (
                    <p className="text-red-500 text-sm">{errors.location.state.message}</p>
                  )}
                </div>
                <div>
                  <Label>City</Label>
                  <Controller
                    name="location.city"
                    control={control}
                    render={({ field }) => <Input {...field} />}
                  />
                  {errors.location?.city && (
                    <p className="text-red-500 text-sm">{errors.location.city.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Controller
                    name="contactInfo.email"
                    control={control}
                    render={({ field }) => <Input type="email" {...field} />}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-red-500 text-sm">{errors.contactInfo.email.message}</p>
                  )}
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Controller
                    name="contactInfo.phone"
                    control={control}
                    render={({ field }) => <Input type="tel" {...field} />}
                  />
                  {errors.contactInfo?.phone && (
                    <p className="text-red-500 text-sm">{errors.contactInfo.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Type-Specific Fields */}
              {renderTypeSpecificFields()}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isEditMode ? 'Update Listing' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingFormPage;