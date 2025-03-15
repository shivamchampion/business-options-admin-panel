import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Store, Briefcase, TrendingUp, DollarSign, Globe, Save, X, ArrowLeft,
    ChevronRight, AlertCircle, CheckCircle
    , HelpCircle, ImagePlus, FileText,
    MapPin, Calendar, CreditCard, Layers, Phone, Clock,
    Eye
} from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { validateData, getListingSchema } from '../utils/validation';
import { slugify, formatCurrency, formatDate } from '../utils/helpers';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Type-specific icons with colors
const typeIcons = {
    business: <Store className="w-5 h-5 text-emerald-500" />,
    franchise: <Briefcase className="w-5 h-5 text-purple-500" />,
    startup: <TrendingUp className="w-5 h-5 text-orange-500" />,
    investor: <DollarSign className="w-5 h-5 text-blue-500" />,
    digital_asset: <Globe className="w-5 h-5 text-cyan-500" />
};

// Type-specific background colors
const typeBgColors = {
    business: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    franchise: 'bg-purple-50 text-purple-700 border-purple-200',
    startup: 'bg-orange-50 text-orange-700 border-orange-200',
    investor: 'bg-blue-50 text-blue-700 border-blue-200',
    digital_asset: 'bg-cyan-50 text-cyan-700 border-cyan-200'
};

// Status colors
const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    published: 'bg-green-50 text-green-800 border-green-200',
    rejected: 'bg-red-50 text-red-800 border-red-200',
    archived: 'bg-slate-100 text-slate-800 border-slate-200'
};

/**
 * ListingFormPage Component
 * 
 * A comprehensive form page for creating and editing listings
 * with type-specific forms, form validation, and multi-step interface
 */
const ListingFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // State Management
    const [activeStep, setActiveStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [listingType, setListingType] = useState(LISTING_TYPES.BUSINESS);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [listingData, setListingData] = useState(null);
    const [formProgress, setFormProgress] = useState(0);

    // Reference data
    const [industries, setIndustries] = useState([]);
    const [tags, setTags] = useState([]);
    const [plans, setPlans] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    // File upload states
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Services from context
    const {
        ListingService,
        IndustryService,
        TagService,
        PlanService,
        MediaService
    } = useDatabase();
    const { userDetails } = useAuth();

    // Form steps
    const formSteps = [
        { id: 'basic', title: 'Basic Info', icon: <Info className="h-4 w-4" /> },
        { id: 'details', title: 'Listing Details', icon: <FileText className="h-4 w-4" /> },
        { id: 'specific', title: getTypeSpecificStepTitle(listingType), icon: typeIcons[listingType] },
        { id: 'media', title: 'Media & Documents', icon: <ImagePlus className="h-4 w-4" /> },
        { id: 'contact', title: 'Contact Info', icon: <Mail className="h-4 w-4" /> },
        { id: 'pricing', title: 'Pricing & Terms', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'preview', title: 'Review & Submit', icon: <CheckCircle className="h-4 w-4" /> }
    ];

    // Create form instance
    const methods = useForm({
        defaultValues: getDefaultFormValues(),
        resolver: yupResolver(getFormValidationSchema())
    });

    // Extract form utilities
    const {
        handleSubmit,
        reset,
        formState: { errors, isDirty, isValid },
        watch,
        setValue,
        getValues,
        trigger
    } = methods;

    // Watch key values for reactivity
    const watchedType = watch('type');
    const watchedState = watch('location.state');
    const watchedPlan = watch('plan');

    // Watch all fields to calculate progress
    const allFields = watch();

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setError(null);

                // Fetch reference data in parallel
                const [
                    industriesData,
                    tagsData,
                    plansData,
                ] = await Promise.all([
                    IndustryService.getAllIndustries(),
                    TagService.getAllTags(),
                    PlanService.getAllPlans(),
                ]);

                setIndustries(industriesData || []);
                setTags(tagsData || []);
                setPlans(plansData || []);

                // Set Indian states
                const indianStates = State.getStatesOfCountry('IN');
                setStates(indianStates);

                // For edit mode, fetch the listing data
                if (isEditMode) {
                    const listing = await ListingService.getListingById(id);

                    if (!listing) {
                        setError('Listing not found');
                        return;
                    }

                    setListingType(listing.type);
                    setListingData(listing);

                    // Set cities based on the listing's state
                    if (listing.location?.state) {
                        const citiesInState = City.getCitiesOfState('IN', listing.location.state);
                        setCities(citiesInState);
                    }

                    // Set featured image preview if exists
                    if (listing.media?.featuredImage?.url) {
                        setFeaturedImagePreview(listing.media.featuredImage.url);
                    }

                    // Set gallery images if they exist
                    if (listing.media?.galleryImages?.length > 0) {
                        setGalleryImages(listing.media.galleryImages);
                    }

                    // Set documents if they exist
                    if (listing.media?.documents?.length > 0) {
                        setDocuments(listing.media.documents);
                    }

                    // Reset form with listing data
                    reset(transformListingToFormData(listing));
                }

            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError('Failed to load data. Please try again later.');
            }
        };

        fetchInitialData();
    }, [id, isEditMode, reset]);

    // Update cities when state changes
    useEffect(() => {
        if (watchedState) {
            const citiesInState = City.getCitiesOfState('IN', watchedState);
            setCities(citiesInState);
        } else {
            setCities([]);
        }
    }, [watchedState]);

    // Update listing type and schema when type changes
    useEffect(() => {
        if (watchedType !== listingType) {
            setListingType(watchedType);
        }
    }, [watchedType, listingType]);

    // Calculate form progress
    useEffect(() => {
        const calculateProgress = () => {
            // Implement logic to calculate form progress based on filled fields
            // This is a simplified version - in a real app you'd want a more sophisticated calculation
            const requiredFields = [
                'name', 'type', 'description', 'status', 'location.country', 'location.state',
                'contactInfo.email', 'contactInfo.phone'
            ];

            // Add type-specific required fields
            if (watchedType === 'business') {
                requiredFields.push(
                    'businessDetails.businessType',
                    'businessDetails.establishedYear',
                    'businessDetails.sale.askingPrice.value',
                    'businessDetails.sale.reasonForSelling'
                );
            } else if (watchedType === 'franchise') {
                requiredFields.push(
                    'franchiseDetails.franchiseType',
                    'franchiseDetails.investment.investmentRange.min.value',
                    'franchiseDetails.investment.franchiseFee.value'
                );
            }
            // Add other type-specific fields as needed

            // Count completed required fields
            let completedFields = 0;

            requiredFields.forEach(fieldPath => {
                const pathParts = fieldPath.split('.');
                let value = allFields;

                for (const part of pathParts) {
                    value = value?.[part];
                    if (value === undefined) break;
                }

                if (value !== undefined && value !== null && value !== '') {
                    completedFields++;
                }
            });

            // Add extra progress for uploaded media
            if (featuredImageFile || featuredImagePreview) completedFields++;
            if (galleryImages.length > 0) completedFields++;

            const progress = Math.min(
                100,
                Math.round((completedFields / (requiredFields.length + 2)) * 100)
            );

            setFormProgress(progress);
        };

        calculateProgress();
    }, [allFields, featuredImageFile, featuredImagePreview, galleryImages.length, watchedType]);

    // Get default form values
    function getDefaultFormValues() {
        return {
            name: '',
            type: LISTING_TYPES.BUSINESS,
            description: '',
            shortDescription: '',
            status: LISTING_STATUS.DRAFT,
            slug: '',
            industries: [],
            tags: [],
            location: {
                country: 'IN', // Default to India
                state: '',
                city: '',
                address: '',
                pincode: ''
            },
            contactInfo: {
                email: userDetails?.email || '',
                phone: '',
                alternatePhone: '',
                website: '',
                contactName: userDetails?.displayName || '',
                designation: '',
                preferredContactMethod: 'email'
            },
            plan: '',
            isFeatured: false,
            isVerified: false,
            // Business specific fields
            businessDetails: {
                businessType: '',
                establishedYear: new Date().getFullYear(),
                registrationNumber: '',
                gstNumber: '',
                panNumber: '',
                operations: {
                    employees: {
                        count: 0,
                        fullTime: 0,
                        partTime: 0
                    },
                    businessHours: {
                        monday: { open: '09:00', close: '18:00', isClosed: false },
                        tuesday: { open: '09:00', close: '18:00', isClosed: false },
                        wednesday: { open: '09:00', close: '18:00', isClosed: false },
                        thursday: { open: '09:00', close: '18:00', isClosed: false },
                        friday: { open: '09:00', close: '18:00', isClosed: false },
                        saturday: { open: '09:00', close: '18:00', isClosed: false },
                        sunday: { open: '', close: '', isClosed: true }
                    }
                },
                financials: {
                    annualRevenue: {
                        value: '',
                        currency: 'INR'
                    },
                    profitMargin: {
                        percentage: ''
                    }
                },
                sale: {
                    askingPrice: {
                        value: '',
                        currency: 'INR'
                    },
                    reasonForSelling: '',
                    isNegotiable: true
                }
            },
            // Franchise specific fields
            franchiseDetails: {
                franchiseType: '',
                totalOutlets: 0,
                establishedYear: new Date().getFullYear(),
                investment: {
                    investmentRange: {
                        min: { value: '', currency: 'INR' },
                        max: { value: '', currency: 'INR' }
                    },
                    franchiseFee: {
                        value: '',
                        currency: 'INR'
                    },
                    royaltyFee: {
                        percentage: ''
                    }
                },
                terms: {
                    contractDuration: {
                        years: 5
                    },
                    territoryRights: {
                        isExclusive: false
                    }
                },
                support: {
                    initialSupport: {
                        hasTrainingProvided: true,
                        trainingDuration: ''
                    },
                    ongoingSupport: {
                        isAvailable: true
                    }
                }
            }
            // Other type-specific fields would be added here
        };
    }

    // Transform API listing data to form data structure
    function transformListingToFormData(listing) {
        if (!listing) return getDefaultFormValues();

        return {
            // Base fields
            id: listing.id,
            name: listing.name || '',
            type: listing.type || LISTING_TYPES.BUSINESS,
            description: listing.description || '',
            shortDescription: listing.shortDescription || '',
            status: listing.status || LISTING_STATUS.DRAFT,
            slug: listing.slug || '',
            industries: listing.industries || [],
            tags: listing.tags || [],
            location: listing.location || {
                country: 'IN',
                state: '',
                city: '',
                address: '',
                pincode: ''
            },
            contactInfo: listing.contactInfo || {
                email: userDetails?.email || '',
                phone: '',
                alternatePhone: '',
                website: '',
                contactName: userDetails?.displayName || '',
                designation: '',
                preferredContactMethod: 'email'
            },
            plan: listing.plan || '',
            isFeatured: listing.isFeatured || false,
            isVerified: listing.isVerified || false,

            // Type-specific fields
            ...getTypeSpecificFormData(listing)
        };
    }

    // Get type-specific form data from a listing
    function getTypeSpecificFormData(listing) {
        const result = {};

        if (listing.type === LISTING_TYPES.BUSINESS && listing.businessDetails) {
            result.businessDetails = listing.businessDetails;
        } else if (listing.type === LISTING_TYPES.FRANCHISE && listing.franchiseDetails) {
            result.franchiseDetails = listing.franchiseDetails;
        } else if (listing.type === LISTING_TYPES.STARTUP && listing.startupDetails) {
            result.startupDetails = listing.startupDetails;
        } else if (listing.type === LISTING_TYPES.INVESTOR && listing.investorDetails) {
            result.investorDetails = listing.investorDetails;
        } else if (listing.type === LISTING_TYPES.DIGITAL_ASSET && listing.digitalAssetDetails) {
            result.digitalAssetDetails = listing.digitalAssetDetails;
        }

        return result;
    }

    // Get validation schema based on listing type
    function getFormValidationSchema() {
        // This would pull in the appropriate schema from your validation utilities
        // For simplicity, we're returning a basic schema here
        return yup.object().shape({
            name: yup.string().required('Listing name is required').min(3, 'Name must be at least 3 characters'),
            type: yup.string().required('Listing type is required'),
            description: yup.string().required('Description is required').min(50, 'Description must be at least 50 characters'),
            'location.country': yup.string().required('Country is required'),
            'location.state': yup.string().required('State is required'),
            'contactInfo.email': yup.string().email('Invalid email').required('Email is required'),
            'contactInfo.phone': yup.string().required('Phone number is required')
            // Other validations would be added conditionally based on type
        });
    }

    // Get title for type-specific step
    function getTypeSpecificStepTitle(type) {
        switch (type) {
            case LISTING_TYPES.BUSINESS:
                return 'Business Details';
            case LISTING_TYPES.FRANCHISE:
                return 'Franchise Details';
            case LISTING_TYPES.STARTUP:
                return 'Startup Details';
            case LISTING_TYPES.INVESTOR:
                return 'Investor Details';
            case LISTING_TYPES.DIGITAL_ASSET:
                return 'Digital Asset Details';
            default:
                return 'Specific Details';
        }
    }

    // Handle form submission
    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true);
            setError(null);

            // Generate slug if not provided
            if (!data.slug) {
                data.slug = slugify(data.name);
            }

            // Handle file uploads
            let mediaData = { ...listingData?.media };

            // Upload featured image if changed
            if (featuredImageFile) {
                const featuredImageResult = await MediaService.uploadListingImage(featuredImageFile);
                if (featuredImageResult?.url) {
                    mediaData.featuredImage = featuredImageResult;
                }
            }

            // Prepare final listing data
            const listingPayload = {
                ...data,
                media: mediaData,
                ownerId: userDetails.uid,
                ownerName: userDetails.displayName
            };

            // Create or update listing
            let result;
            if (isEditMode) {
                result = await ListingService.updateListing(id, listingPayload);
                setSuccessMessage("Listing updated successfully");
            } else {
                result = await ListingService.createListing(listingPayload);
                setSuccessMessage("Listing created successfully");
            }

            // Navigate back to listings page after a short delay
            setTimeout(() => {
                navigate('/listings');
            }, 2000);

        } catch (err) {
            console.error('Error submitting listing:', err);
            setError(err.message || 'An error occurred while saving the listing');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Navigate between form steps
    const goToStep = async (stepIndex) => {
        // Validate current step before proceeding to next
        if (stepIndex > activeStep) {
            const currentStepFields = getFieldsForStep(activeStep);
            const isValid = await trigger(currentStepFields);

            if (!isValid) {
                // Show validation errors
                return;
            }
        }

        setActiveStep(stepIndex);
        window.scrollTo(0, 0);
    };

    // Get field names for the current step (for validation)
    const getFieldsForStep = (step) => {
        switch (step) {
            case 0: // Basic info
                return ['name', 'type', 'description', 'shortDescription', 'status'];
            case 1: // Listing details
                return ['industries', 'tags', 'location.country', 'location.state', 'location.city', 'location.address', 'location.pincode'];
            case 2: // Type-specific
                if (listingType === LISTING_TYPES.BUSINESS) {
                    return ['businessDetails.businessType', 'businessDetails.establishedYear', 'businessDetails.registrationNumber'];
                } else if (listingType === LISTING_TYPES.FRANCHISE) {
                    return ['franchiseDetails.franchiseType', 'franchiseDetails.totalOutlets'];
                }
                // Add other types
                return [];
            case 3: // Media & documents
                return []; // No validation needed
            case 4: // Contact info
                return ['contactInfo.email', 'contactInfo.phone', 'contactInfo.contactName'];
            case 5: // Pricing & terms
                if (listingType === LISTING_TYPES.BUSINESS) {
                    return ['businessDetails.sale.askingPrice.value', 'businessDetails.sale.reasonForSelling'];
                } else if (listingType === LISTING_TYPES.FRANCHISE) {
                    return ['franchiseDetails.investment.investmentRange.min.value', 'franchiseDetails.investment.franchiseFee.value'];
                }
                // Add other types
                return [];
            default:
                return [];
        }
    };

    // Handle file selection for featured image
    const handleFeaturedImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFeaturedImageFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setFeaturedImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Handle adding gallery images
    const handleGalleryImageAdd = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Preview images
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));

        setGalleryImages(prev => [...prev, ...newImages]);
    };

    // Handle document upload
    const handleDocumentAdd = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newDocuments = files.map(file => ({
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            isPublic: true
        }));

        setDocuments(prev => [...prev, ...newDocuments]);
    };

    // Remove a gallery image
    const removeGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    // Remove a document
    const removeDocument = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    // Get type display name
    const getTypeDisplayName = (type) => {
        if (!type) return 'N/A';
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    };

    // Render the step indicator
    const renderStepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {formSteps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`flex flex-col items-center ${index < formSteps.length - 1 ? 'w-full' : ''
                            }`}
                    >
                        <div className="flex items-center w-full">
                            <div
                                className={`rounded-full transition-colors flex items-center justify-center ${index < activeStep
                                        ? 'bg-green-500 text-white'
                                        : index === activeStep
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    } w-10 h-10 flex-shrink-0`}
                                onClick={() => index <= activeStep && goToStep(index)}
                            >
                                {index < activeStep ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    step.icon || (index + 1)
                                )}
                            </div>
                            {index < formSteps.length - 1 && (
                                <div
                                    className={`h-1 flex-1 ${index < activeStep ? 'bg-green-500' : 'bg-gray-200'
                                        } transition-colors duration-300`}
                                ></div>
                            )}
                        </div>
                        <span
                            className={`text-xs mt-2 hidden md:block ${index === activeStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                                }`}
                        >
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>
            <div className="md:hidden mt-2">
                <span className="text-sm font-medium text-blue-600">
                    Step {activeStep + 1}: {formSteps[activeStep].title}
                </span>
            </div>
        </div>
    );

    // Render the basic info step
    const renderBasicInfoStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

            {/* Listing Name */}
            <div>
                <Label htmlFor="name" className="text-base">
                    Listing Name <span className="text-red-500">*</span>
                </Label>
                <Controller
                    name="name"
                    control={methods.control}
                    render={({ field }) => (
                        <Input
                            id="name"
                            placeholder="Enter a descriptive name for your listing"
                            className="mt-1"
                            {...field}
                        />
                    )}
                />
                {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
            </div>

            {/* Listing Type */}
            <div>
                <Label htmlFor="type" className="text-base">
                    Listing Type <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-1">
                    {Object.values(LISTING_TYPES).map(type => (
                        <Controller
                            key={type}
                            name="type"
                            control={methods.control}
                            render={({ field }) => (
                                <Button
                                    type="button"
                                    variant={field.value === type ? 'default' : 'outline'}
                                    className={`transition-colors justify-start px-3 py-6 h-auto`}
                                    onClick={() => {
                                        field.onChange(type);
                                        setListingType(type);
                                    }}
                                >
                                    <div className="flex flex-col items-center text-center w-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${field.value === type
                                                ? 'bg-white/20'
                                                : typeBgColors[type]
                                            }`}>
                                            {typeIcons[type]}
                                        </div>
                                        <span>{getTypeDisplayName(type)}</span>
                                    </div>
                                </Button>
                            )}
                        />
                    ))}
                </div>
                {errors.type && (
                    <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <Label htmlFor="description" className="text-base">
                    Description <span className="text-red-500">*</span>
                </Label>
                <Controller
                    name="description"
                    control={methods.control}
                    render={({ field }) => (
                        <Textarea
                            id="description"
                            placeholder="Provide a detailed description of your listing"
                            className="mt-1"
                            rows={6}
                            {...field}
                        />
                    )}
                />
                {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Min. 50 characters. Include key information about your listing to attract potential buyers/investors.
                </p>
            </div>

            {/* Short Description */}
            <div>
                <Label htmlFor="shortDescription" className="text-base">
                    Short Description
                </Label>
                <Controller
                    name="shortDescription"
                    control={methods.control}
                    render={({ field }) => (
                        <Textarea
                            id="shortDescription"
                            placeholder="A brief summary of your listing (displayed in search results)"
                            className="mt-1"
                            rows={2}
                            {...field}
                        />
                    )}
                />
                {errors.shortDescription && (
                    <p className="text-sm text-red-500 mt-1">{errors.shortDescription.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Max. 150 characters. This will be displayed in search results and listing previews.
                </p>
            </div>

            {/* Status */}
            <div>
                <Label htmlFor="status" className="text-base">Status</Label>
                <Controller
                    name="status"
                    control={methods.control}
                    render={({ field }) => (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                            <Button
                                type="button"
                                variant={field.value === LISTING_STATUS.DRAFT ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === LISTING_STATUS.DRAFT ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange(LISTING_STATUS.DRAFT)}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full bg-gray-400 mr-2`}></div>
                                    Draft
                                </div>
                            </Button>

                            <Button
                                type="button"
                                variant={field.value === LISTING_STATUS.PENDING ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === LISTING_STATUS.PENDING ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange(LISTING_STATUS.PENDING)}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full bg-amber-400 mr-2`}></div>
                                    Pending Review
                                </div>
                            </Button>

                            <Button
                                type="button"
                                variant={field.value === LISTING_STATUS.PUBLISHED ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === LISTING_STATUS.PUBLISHED ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange(LISTING_STATUS.PUBLISHED)}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full bg-green-500 mr-2`}></div>
                                    Published
                                </div>
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* Custom URL Slug */}
            <div>
                <div className="flex justify-between items-center">
                    <Label htmlFor="slug" className="text-base">Custom URL</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="px-2 h-7">
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p className="max-w-xs">
                                    Customize your listing's URL for better searchability.
                                    Leave blank to auto-generate from the listing name.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-center mt-1">
                    <span className="p-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-500 text-sm">
                        businessoptions.com/listings/
                    </span>
                    <Controller
                        name="slug"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="slug"
                                placeholder="your-listing-name"
                                className="rounded-l-none"
                                {...field}
                            />
                        )}
                    />
                </div>
                {errors.slug && (
                    <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Use lowercase letters, numbers, and hyphens only. No spaces.
                </p>
            </div>
        </div>
    );

    // Render listing details step
    const renderListingDetailsStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Listing Details</h2>

            {/* Industries */}
            <div>
                <Label htmlFor="industries" className="text-base">
                    Industries <span className="text-red-500">*</span>
                </Label>
                <Controller
                    name="industries"
                    control={methods.control}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                            isMulti
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select industries" />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map(industry => (
                                    <SelectItem key={industry.id} value={industry.id}>
                                        {industry.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.industries && (
                    <p className="text-sm text-red-500 mt-1">{errors.industries.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Select up to 3 industries that best describe your listing.
                </p>
            </div>

            {/* Tags */}
            <div>
                <Label htmlFor="tags" className="text-base">Tags</Label>
                <Controller
                    name="tags"
                    control={methods.control}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                            isMulti
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select tags" />
                            </SelectTrigger>
                            <SelectContent>
                                {tags.map(tag => (
                                    <SelectItem key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.tags && (
                    <p className="text-sm text-red-500 mt-1">{errors.tags.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Add relevant tags to improve discoverability.
                </p>
            </div>

            {/* Location */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Location <span className="text-red-500">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Country */}
                    <div>
                        <Label htmlFor="location.country">Country</Label>
                        <Controller
                            name="location.country"
                            control={methods.control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                    disabled // We're defaulting to India for this implementation
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN">India</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.location?.country && (
                            <p className="text-sm text-red-500 mt-1">{errors.location.country.message}</p>
                        )}
                    </div>

                    {/* State */}
                    <div>
                        <Label htmlFor="location.state">State</Label>
                        <Controller
                            name="location.state"
                            control={methods.control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map(state => (
                                            <SelectItem key={state.isoCode} value={state.isoCode}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.location?.state && (
                            <p className="text-sm text-red-500 mt-1">{errors.location.state.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* City */}
                    <div>
                        <Label htmlFor="location.city">City</Label>
                        <Controller
                            name="location.city"
                            control={methods.control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                    disabled={!watchedState}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={watchedState ? "Select city" : "Select state first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map(city => (
                                            <SelectItem key={city.name} value={city.name}>
                                                {city.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.location?.city && (
                            <p className="text-sm text-red-500 mt-1">{errors.location.city.message}</p>
                        )}
                    </div>

                    {/* Pincode */}
                    <div>
                        <Label htmlFor="location.pincode">PIN Code</Label>
                        <Controller
                            name="location.pincode"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    id="location.pincode"
                                    placeholder="e.g., 400001"
                                    className="mt-1"
                                    {...field}
                                />
                            )}
                        />
                        {errors.location?.pincode && (
                            <p className="text-sm text-red-500 mt-1">{errors.location.pincode.message}</p>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div>
                    <Label htmlFor="location.address">Address</Label>
                    <Controller
                        name="location.address"
                        control={methods.control}
                        render={({ field }) => (
                            <Textarea
                                id="location.address"
                                placeholder="Enter complete address"
                                className="mt-1"
                                rows={3}
                                {...field}
                            />
                        )}
                    />
                    {errors.location?.address && (
                        <p className="text-sm text-red-500 mt-1">{errors.location.address.message}</p>
                    )}
                </div>
            </div>

            {/* Subscription Plan */}
            <div>
                <Label htmlFor="plan" className="text-base">Subscription Plan</Label>
                <Controller
                    name="plan"
                    control={methods.control}
                    render={({ field }) => (
                        <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3"
                        >
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${field.value === plan.id
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => field.onChange(plan.id)}
                                >
                                    <RadioGroupItem
                                        value={plan.id}
                                        id={`plan-${plan.id}`}
                                        className="sr-only"
                                    />
                                    <div className="flex justify-between items-start">
                                        <Label
                                            htmlFor={`plan-${plan.id}`}
                                            className="font-medium text-gray-900 cursor-pointer"
                                        >
                                            {plan.name}
                                        </Label>
                                        {plan.display?.isRecommended && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                                Recommended
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{plan.shortDescription}</p>
                                    <div className="mt-2 font-medium">
                                        {formatCurrency(plan.pricing?.amount || 0, 'INR')}
                                        <span className="text-sm text-gray-500 font-normal">
                                            /{plan.pricing?.billingCycle || 'month'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                />
                {errors.plan && (
                    <p className="text-sm text-red-500 mt-1">{errors.plan.message}</p>
                )}
            </div>
        </div>
    );

    // Render contact info step
    const renderContactInfoStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="contactInfo.contactName" className="text-base">
                        Contact Person <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="contactInfo.contactName"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.contactName"
                                placeholder="Full name"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.contactName && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.contactName.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="contactInfo.designation" className="text-base">
                        Designation
                    </Label>
                    <Controller
                        name="contactInfo.designation"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.designation"
                                placeholder="e.g., Owner, CEO, Manager"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.designation && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.designation.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="contactInfo.email" className="text-base">
                        Email <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="contactInfo.email"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.email"
                                type="email"
                                placeholder="contact@example.com"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.email.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="contactInfo.phone" className="text-base">
                        Phone <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="contactInfo.phone"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.phone"
                                placeholder="+91 12345 67890"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.phone.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="contactInfo.alternatePhone" className="text-base">
                        Alternate Phone
                    </Label>
                    <Controller
                        name="contactInfo.alternatePhone"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.alternatePhone"
                                placeholder="+91 98765 43210"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.alternatePhone && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.alternatePhone.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="contactInfo.website" className="text-base">
                        Website
                    </Label>
                    <Controller
                        name="contactInfo.website"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                id="contactInfo.website"
                                placeholder="https://www.example.com"
                                className="mt-1"
                                {...field}
                            />
                        )}
                    />
                    {errors.contactInfo?.website && (
                        <p className="text-sm text-red-500 mt-1">{errors.contactInfo.website.message}</p>
                    )}
                </div>
            </div>

            <div>
                <Label htmlFor="contactInfo.preferredContactMethod" className="text-base">
                    Preferred Contact Method
                </Label>
                <Controller
                    name="contactInfo.preferredContactMethod"
                    control={methods.control}
                    render={({ field }) => (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                            <Button
                                type="button"
                                variant={field.value === 'email' ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === 'email' ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange('email')}
                            >
                                <Mail className="mr-2 h-4 w-4" /> Email
                            </Button>

                            <Button
                                type="button"
                                variant={field.value === 'phone' ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === 'phone' ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange('phone')}
                            >
                                <Phone className="mr-2 h-4 w-4" /> Phone
                            </Button>

                            <Button
                                type="button"
                                variant={field.value === 'whatsapp' ? 'default' : 'outline'}
                                className={`transition-colors ${field.value === 'whatsapp' ? '' : 'border-gray-200'}`}
                                onClick={() => field.onChange('whatsapp')}
                            >
                                <img
                                    src="/assets/whatsapp-icon.svg"
                                    alt="WhatsApp"
                                    className="w-4 h-4 mr-2"
                                />
                                WhatsApp
                            </Button>
                        </div>
                    )}
                />
            </div>

            <Alert variant="outline" className="bg-blue-50 border-blue-200 mt-4">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-600">Contact Privacy</AlertTitle>
                <AlertDescription className="text-gray-600">
                    Contact information will only be visible to registered users who have verified their accounts.
                    You can always update your contact preferences in your account settings.
                </AlertDescription>
            </Alert>
        </div>
    );

    // Render media and documents step
    const renderMediaStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Media & Documents</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Featured Image */}
                <div>
                    <Label className="text-base">Featured Image</Label>

                    {featuredImagePreview ? (
                        <div className="mt-2 border rounded-lg overflow-hidden relative">
                            <img
                                src={featuredImagePreview}
                                alt="Featured Preview"
                                className="w-full h-48 object-cover"
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                    setFeaturedImagePreview(null);
                                    setFeaturedImageFile(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-48 bg-gray-50">
                            <Label
                                htmlFor="featured-image-upload"
                                className="cursor-pointer text-center p-4 flex flex-col items-center"
                            >
                                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-700">
                                    Click to upload
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    SVG, PNG, JPG or GIF (max. 2MB)
                                </span>
                            </Label>
                            <Input
                                id="featured-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFeaturedImageChange}
                            />
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        This image will be used as the main image for your listing.
                        Recommended size: 1200 x 800 pixels.
                    </p>
                </div>

                {/* Gallery Images */}
                <div>
                    <div className="flex justify-between items-center">
                        <Label className="text-base">Gallery Images</Label>
                        <Label
                            htmlFor="gallery-image-upload"
                            className="text-xs text-blue-600 cursor-pointer"
                        >
                            + Add Images
                        </Label>
                        <Input
                            id="gallery-image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleGalleryImageAdd}
                        />
                    </div>

                    <div className="mt-2 border rounded-lg p-2 min-h-[12rem] bg-gray-50">
                        {galleryImages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {galleryImages.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={image.preview || image.url}
                                            alt={`Gallery ${index + 1}`}
                                            className="h-20 w-full object-cover rounded-md"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-5 w-5 absolute top-1 right-1 p-0"
                                            onClick={() => removeGalleryImage(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8">
                                <Layers className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">
                                    No gallery images added
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Add up to 10 images showcasing your business, products, or services.
                    </p>
                </div>
            </div>

            {/* Documents */}
            <div>
                <div className="flex justify-between items-center">
                    <Label className="text-base">Documents</Label>
                    <Label
                        htmlFor="document-upload"
                        className="text-xs text-blue-600 cursor-pointer"
                    >
                        + Add Document
                    </Label>
                    <Input
                        id="document-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        className="hidden"
                        onChange={handleDocumentAdd}
                    />
                </div>

                <div className="mt-2 border rounded-lg p-2 min-h-12 bg-gray-50">
                    {documents.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="w-16 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{doc.name}</TableCell>
                                        <TableCell>{doc.type.split('/')[1]?.toUpperCase() || doc.type}</TableCell>
                                        <TableCell>{Math.round(doc.size / 1024)} KB</TableCell>
                                        <TableCell>
                                            <Controller
                                                name={`documents[${index}].isPublic`}
                                                control={methods.control}
                                                defaultValue={doc.isPublic}
                                                render={({ field }) => (
                                                    <div className="flex items-center">
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            id={`doc-public-${index}`}
                                                        />
                                                        <Label
                                                            htmlFor={`doc-public-${index}`}
                                                            className="ml-2 text-xs"
                                                        >
                                                            {field.value ? "Public" : "Private"}
                                                        </Label>
                                                    </div>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => removeDocument(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">
                                No documents added
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Upload important documents like business reports, financial statements, brochures, etc.
                    Maximum file size: 5MB per document.
                </p>
            </div>

            <Alert variant="outline" className="bg-amber-50 border-amber-200 mt-4">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-600">Important</AlertTitle>
                <AlertDescription className="text-gray-600">
                    For security purposes, remove any sensitive personal information from documents before uploading.
                    Private documents will only be visible to approved buyers/investors.
                </AlertDescription>
            </Alert>
        </div>
    );

    // Render business details step
    const renderBusinessDetailsStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Type */}
                <div>
                    <Label htmlFor="businessDetails.businessType" className="text-base">
                        Business Type <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="businessDetails.businessType"
                        control={methods.control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                                    <SelectItem value="partnership">Partnership</SelectItem>
                                    <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                                    <SelectItem value="private_limited">Private Limited Company</SelectItem>
                                    <SelectItem value="public_limited">Public Limited Company</SelectItem>
                                    <SelectItem value="one_person_company">One Person Company</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.businessDetails?.businessType && (
                        <p className="text-sm text-red-500 mt-1">{errors.businessDetails.businessType.message}</p>
                    )}
                </div>

                {/* Established Year */}
                <div>
                    <Label htmlFor="businessDetails.establishedYear" className="text-base">
                        Established Year <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="businessDetails.establishedYear"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                className="mt-1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                            />
                        )}
                    />
                    {errors.businessDetails?.establishedYear && (
                        <p className="text-sm text-red-500 mt-1">{errors.businessDetails.establishedYear.message}</p>
                    )}
                </div>
            </div>

            {/* Registration Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Registration Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="businessDetails.registrationNumber">
                            Registration Number
                        </Label>
                        <Controller
                            name="businessDetails.registrationNumber"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    className="mt-1"
                                    placeholder="e.g., CIN number"
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="businessDetails.gstNumber">
                            GST Number
                        </Label>
                        <Controller
                            name="businessDetails.gstNumber"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    className="mt-1"
                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="businessDetails.panNumber">
                            PAN Number
                        </Label>
                        <Controller
                            name="businessDetails.panNumber"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    className="mt-1"
                                    placeholder="e.g., ABCDE1234F"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Operations */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Operations</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <Label htmlFor="businessDetails.operations.employees.count">
                            Total Employees
                        </Label>
                        <Controller
                            name="businessDetails.operations.employees.count"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="businessDetails.operations.employees.fullTime">
                            Full-Time
                        </Label>
                        <Controller
                            name="businessDetails.operations.employees.fullTime"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="businessDetails.operations.employees.partTime">
                            Part-Time
                        </Label>
                        <Controller
                            name="businessDetails.operations.employees.partTime"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Business Hours */}
                <Label className="block mb-2">Business Hours</Label>
                <div className="border rounded-lg divide-y">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day} className="p-3 flex items-center justify-between">
                            <div className="w-32 font-medium capitalize">{day}</div>

                            <div className="flex items-center flex-1">
                                <Controller
                                    name={`businessDetails.operations.businessHours.${day}.isClosed`}
                                    control={methods.control}
                                    render={({ field }) => (
                                        <div className="flex items-center">
                                            <Checkbox
                                                id={`closed-${day}`}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                            <Label
                                                htmlFor={`closed-${day}`}
                                                className="ml-2 text-sm"
                                            >
                                                Closed
                                            </Label>
                                        </div>
                                    )}
                                />

                                {!watch(`businessDetails.operations.businessHours.${day}.isClosed`) && (
                                    <div className="flex items-center ml-6 space-x-2">
                                        <Controller
                                            name={`businessDetails.operations.businessHours.${day}.open`}
                                            control={methods.control}
                                            render={({ field }) => (
                                                <Input
                                                    type="time"
                                                    className="w-32"
                                                    {...field}
                                                />
                                            )}
                                        />
                                        <span>to</span>
                                        <Controller
                                            name={`businessDetails.operations.businessHours.${day}.close`}
                                            control={methods.control}
                                            render={({ field }) => (
                                                <Input
                                                    type="time"
                                                    className="w-32"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Financial Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="businessDetails.financials.annualRevenue.value">
                            Annual Revenue (₹)
                        </Label>
                        <Controller
                            name="businessDetails.financials.annualRevenue.value"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    placeholder="e.g., 1000000"
                                    {...field}
                                />
                            )}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the annual revenue in Indian Rupees.
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="businessDetails.financials.profitMargin.percentage">
                            Profit Margin (%)
                        </Label>
                        <Controller
                            name="businessDetails.financials.profitMargin.percentage"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="mt-1"
                                    placeholder="e.g., 15"
                                    {...field}
                                />
                            )}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the profit margin as a percentage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render franchise details step
    const renderFranchiseDetailsStep = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Franchise Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Franchise Type */}
                <div>
                    <Label htmlFor="franchiseDetails.franchiseType" className="text-base">
                        Franchise Type <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="franchiseDetails.franchiseType"
                        control={methods.control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select franchise type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="food_and_beverage">Food & Beverage</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="education">Education & Training</SelectItem>
                                    <SelectItem value="health_and_wellness">Health & Wellness</SelectItem>
                                    <SelectItem value="services">Services</SelectItem>
                                    <SelectItem value="automotive">Automotive</SelectItem>
                                    <SelectItem value="convenience_store">Convenience Store</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.franchiseDetails?.franchiseType && (
                        <p className="text-sm text-red-500 mt-1">{errors.franchiseDetails.franchiseType.message}</p>
                    )}
                </div>

                {/* Total Outlets */}
                <div>
                    <Label htmlFor="franchiseDetails.totalOutlets" className="text-base">
                        Total Outlets
                    </Label>
                    <Controller
                        name="franchiseDetails.totalOutlets"
                        control={methods.control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                min="0"
                                className="mt-1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                            />
                        )}
                    />
                    {errors.franchiseDetails?.totalOutlets && (
                        <p className="text-sm text-red-500 mt-1">{errors.franchiseDetails.totalOutlets.message}</p>
                    )}
                </div>
            </div>

            {/* Investment Details */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Investment Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <Label htmlFor="franchiseDetails.investment.investmentRange.min.value">
                            Minimum Investment (₹) <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name="franchiseDetails.investment.investmentRange.min.value"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    placeholder="e.g., 1000000"
                                    {...field}
                                />
                            )}
                        />
                        {errors.franchiseDetails?.investment?.investmentRange?.min?.value && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.franchiseDetails.investment.investmentRange.min.value.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="franchiseDetails.investment.investmentRange.max.value">
                            Maximum Investment (₹)
                        </Label>
                        <Controller
                            name="franchiseDetails.investment.investmentRange.max.value"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    placeholder="e.g., 2000000"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="franchiseDetails.investment.franchiseFee.value">
                            Franchise Fee (₹) <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name="franchiseDetails.investment.franchiseFee.value"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    className="mt-1"
                                    placeholder="e.g., 500000"
                                    {...field}
                                />
                            )}
                        />
                        {errors.franchiseDetails?.investment?.franchiseFee?.value && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.franchiseDetails.investment.franchiseFee.value.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="franchiseDetails.investment.royaltyFee.percentage">
                            Royalty Fee (%)
                        </Label>
                        <Controller
                            name="franchiseDetails.investment.royaltyFee.percentage"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="mt-1"
                                    placeholder="e.g., 5"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Terms & Conditions */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Terms & Conditions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <Label htmlFor="franchiseDetails.terms.contractDuration.years">
                            Contract Duration (Years)
                        </Label>
                        <Controller
                            name="franchiseDetails.terms.contractDuration.years"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="1"
                                    className="mt-1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                />
                            )}
                        />
                    </div>

                    <div className="flex items-center space-x-2 mt-8">
                        <Controller
                            name="franchiseDetails.terms.territoryRights.isExclusive"
                            control={methods.control}
                            render={({ field }) => (
                                <>
                                    <Checkbox
                                        id="territory-exclusive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label
                                        htmlFor="territory-exclusive"
                                        className="text-sm"
                                    >
                                        Exclusive Territory Rights
                                    </Label>
                                </>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Training & Support */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Training & Support</h3>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="franchiseDetails.support.initialSupport.hasTrainingProvided"
                            control={methods.control}
                            render={({ field }) => (
                                <>
                                    <Checkbox
                                        id="training-provided"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label
                                        htmlFor="training-provided"
                                        className="text-sm"
                                    >
                                        Training Provided to Franchisees
                                    </Label>
                                </>
                            )}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Controller
                            name="franchiseDetails.support.ongoingSupport.isAvailable"
                            control={methods.control}
                            render={({ field }) => (
                                <>
                                    <Checkbox
                                        id="ongoing-support"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label
                                        htmlFor="ongoing-support"
                                        className="text-sm"
                                    >
                                        Ongoing Support Available
                                    </Label>
                                </>
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="franchiseDetails.support.initialSupport.trainingDuration">
                            Training Duration
                        </Label>
                        <Controller
                            name="franchiseDetails.support.initialSupport.trainingDuration"
                            control={methods.control}
                            render={({ field }) => (
                                <Input
                                    className="mt-1"
                                    placeholder="e.g., 2 weeks, 1 month"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // Render pricing and investment step - this will be different based on listing type
    const renderPricingStep = () => {
        switch (listingType) {
            case LISTING_TYPES.BUSINESS:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Pricing & Sale Terms</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="businessDetails.sale.askingPrice.value" className="text-base">
                                    Asking Price (₹) <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="businessDetails.sale.askingPrice.value"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            className="mt-1"
                                            placeholder="Enter asking price"
                                            {...field}
                                        />
                                    )}
                                />
                                {errors.businessDetails?.sale?.askingPrice?.value && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.businessDetails.sale.askingPrice.value.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 mt-8">
                                <Controller
                                    name="businessDetails.sale.isNegotiable"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <>
                                            <Checkbox
                                                id="price-negotiable"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                            <Label
                                                htmlFor="price-negotiable"
                                                className="text-sm"
                                            >
                                                Price is negotiable
                                            </Label>
                                        </>
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="businessDetails.sale.reasonForSelling" className="text-base">
                                Reason for Selling <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="businessDetails.sale.reasonForSelling"
                                control={methods.control}
                                render={({ field }) => (
                                    <Textarea
                                        className="mt-1"
                                        rows={4}
                                        placeholder="Explain why you are selling this business"
                                        {...field}
                                    />
                                )}
                            />
                            {errors.businessDetails?.sale?.reasonForSelling && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.businessDetails.sale.reasonForSelling.message}
                                </p>
                            )}
                        </div>

                        <Alert variant="outline" className="bg-blue-50 border-blue-200 mt-4">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-600">Pricing Tips</AlertTitle>
                            <AlertDescription className="text-gray-600">
                                <ul className="list-disc pl-4 space-y-1 mt-2">
                                    <li>Consider using a professional business valuation service.</li>
                                    <li>Standard pricing multiples for small businesses range from 3-6 times annual profit.</li>
                                    <li>Be realistic with your asking price to attract serious buyers.</li>
                                    <li>Include clear information about what is included in the sale price.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                );

            case LISTING_TYPES.FRANCHISE:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Franchise Fee & Investment</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="franchiseDetails.investment.franchiseFee.value" className="text-base">
                                    Franchise Fee (₹) <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="franchiseDetails.investment.franchiseFee.value"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            className="mt-1"
                                            placeholder="Enter one-time franchise fee"
                                            {...field}
                                        />
                                    )}
                                />
                                {errors.franchiseDetails?.investment?.franchiseFee?.value && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.franchiseDetails.investment.franchiseFee.value.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="franchiseDetails.investment.royaltyFee.percentage" className="text-base">
                                    Royalty Fee (%)
                                </Label>
                                <Controller
                                    name="franchiseDetails.investment.royaltyFee.percentage"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="mt-1"
                                            placeholder="Enter royalty percentage"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="franchiseDetails.investment.investmentRange.min.value" className="text-base">
                                    Minimum Investment (₹) <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="franchiseDetails.investment.investmentRange.min.value"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            className="mt-1"
                                            placeholder="Minimum total investment required"
                                            {...field}
                                        />
                                    )}
                                />
                                {errors.franchiseDetails?.investment?.investmentRange?.min?.value && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.franchiseDetails.investment.investmentRange.min.value.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="franchiseDetails.investment.investmentRange.max.value" className="text-base">
                                    Maximum Investment (₹)
                                </Label>
                                <Controller
                                    name="franchiseDetails.investment.investmentRange.max.value"
                                    control={methods.control}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            className="mt-1"
                                            placeholder="Maximum total investment required"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <Alert variant="outline" className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-600">Pricing settings</AlertTitle>
                            <AlertDescription className="text-gray-600">
                                Pricing configuration for {getTypeDisplayName(listingType)} listings
                                is currently in development.
                            </AlertDescription>
                        </Alert>
                    </div>
                );
        }
    };

    // Render review & submit step
    const renderReviewStep = () => {
        const formData = getValues();

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>

                <Alert variant={formProgress < 100 ? "destructive" : "success"} className="mb-6">
                    {formProgress < 100 ? (
                        <>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Complete Your Listing</AlertTitle>
                            <AlertDescription>
                                Your listing is {formProgress}% complete. We recommend filling out all fields
                                for better visibility and faster approval.
                            </AlertDescription>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Ready to Submit</AlertTitle>
                            <AlertDescription>
                                Your listing is complete and ready to be submitted.
                            </AlertDescription>
                        </>
                    )}
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Listing Summary</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="h-4 w-4 mr-1" /> Preview
                            </Button>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Listing Name</h4>
                                <p className="text-base text-gray-900">{formData.name}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                                <div className="flex items-center">
                                    <Badge className={typeBgColors[formData.type]}>
                                        {typeIcons[formData.type]}
                                        <span className="ml-1">{getTypeDisplayName(formData.type)}</span>
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                                <Badge className={statusColors[formData.status]}>
                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                </Badge>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                                <p className="text-base text-gray-900">
                                    {formData.location.city} {formData.location.state && `, ${formData.location.state}`}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Asking Price</h4>
                                <p className="text-base text-gray-900 font-medium">
                                    {formData.type === LISTING_TYPES.BUSINESS && formData.businessDetails?.sale?.askingPrice?.value && (
                                        formatCurrency(formData.businessDetails.sale.askingPrice.value, 'INR')
                                    )}
                                    {formData.type === LISTING_TYPES.FRANCHISE && formData.franchiseDetails?.investment?.franchiseFee?.value && (
                                        formatCurrency(formData.franchiseDetails.investment.franchiseFee.value, 'INR')
                                    )}
                                </p>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                            <p className="text-base text-gray-900">
                                {formData.description.length > 200
                                    ? formData.description.substring(0, 200) + '...'
                                    : formData.description}
                            </p>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                                <p className="text-base text-gray-900">{formData.contactInfo.contactName}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                                <p className="text-base text-gray-900">{formData.contactInfo.email}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                                <p className="text-base text-gray-900">{formData.contactInfo.phone}</p>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Featured Image</h4>
                                <div>
                                    {featuredImagePreview ? (
                                        <img
                                            src={featuredImagePreview}
                                            alt="Featured Image"
                                            className="h-20 w-20 object-cover rounded-md border border-gray-200"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center">
                                            <ImagePlus className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Gallery Images</h4>
                                <p className="text-base text-gray-900">{galleryImages.length} images uploaded</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Documents</h4>
                                <p className="text-base text-gray-900">{documents.length} documents uploaded</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium text-gray-900 mb-4">Submission Details</h3>

                    <div className="space-y-4">
                        {/* Current Status */}
                        <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Status</h4>
                                <p className="text-sm text-gray-500">
                                    Your listing will be submitted as: {' '}
                                    <Badge className={statusColors[formData.status]}>
                                        {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                    </Badge>
                                </p>
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                                <Eye className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Visibility</h4>
                                <p className="text-sm text-gray-500">
                                    {formData.status === LISTING_STATUS.PUBLISHED ? (
                                        'Your listing will be immediately visible to all users.'
                                    ) : formData.status === LISTING_STATUS.PENDING ? (
                                        'Your listing requires admin approval before becoming visible.'
                                    ) : (
                                        'Your listing will be saved as a draft and won\'t be visible to other users.'
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Approval Timeline */}
                        {formData.status === LISTING_STATUS.PENDING && (
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                                    <Clock className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Approval Timeline</h4>
                                    <p className="text-sm text-gray-500">
                                        Listing approval typically takes 24-48 hours.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Terms */}
                        <div className="flex items-start pt-2">
                            <Controller
                                name="termsAccepted"
                                control={methods.control}
                                defaultValue={false}
                                render={({ field }) => (
                                    <Checkbox
                                        id="terms"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="mt-1 mr-3"
                                    />
                                )}
                            />
                            <div>
                                <Label
                                    htmlFor="terms"
                                    className="font-medium text-gray-900"
                                >
                                    Accept Terms & Conditions
                                </Label>
                                <p className="text-sm text-gray-500">
                                    I confirm that all the information provided is accurate and I have the authority to list this {formData.type}.
                                    I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render the type-specific step content
    const renderTypeSpecificStep = () => {
        switch (listingType) {
            case LISTING_TYPES.BUSINESS:
                return renderBusinessDetailsStep();
            case LISTING_TYPES.FRANCHISE:
                return renderFranchiseDetailsStep();
            // Add other type-specific renderers as needed
            default:
                return (
                    <div className="text-center py-8">
                        <Alert variant="outline" className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-600">Under Development</AlertTitle>
                            <AlertDescription className="text-gray-600">
                                Detailed form for {getTypeDisplayName(listingType)} is currently in development.
                                Please fill out the basic information for now.
                            </AlertDescription>
                        </Alert>
                    </div>
                );
        }
    };

    // Render the current step content
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return renderBasicInfoStep();
            case 1:
                return renderListingDetailsStep();
            case 2:
                return renderTypeSpecificStep();
            case 3:
                return renderMediaStep();
            case 4:
                return renderContactInfoStep();
            case 5:
                return renderPricingStep();
            case 6:
                return renderReviewStep();
            default:
                return null;
        }
    };

    // Render preview modal
    const renderPreviewModal = () => (
        <Dialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
        >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <div className="flex flex-col h-full">
                    {/* Header with image banner or color gradient */}
                    <div
                        className={`relative w-full h-48 ${featuredImagePreview
                                ? ''
                                : `bg-gradient-to-r ${listingType === 'business' ? 'from-emerald-500 to-emerald-600' :
                                    listingType === 'franchise' ? 'from-purple-500 to-purple-600' :
                                        listingType === 'startup' ? 'from-orange-500 to-orange-600' :
                                            listingType === 'investor' ? 'from-blue-500 to-blue-600' :
                                                'from-cyan-500 to-cyan-600'
                                }`
                            }`}
                    >
                        {featuredImagePreview && (
                            <img
                                src={featuredImagePreview}
                                alt="Listing Preview"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-black/20 hover:bg-black/30 text-white rounded-full"
                            onClick={() => setPreviewOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>

                        {/* Type badge */}
                        <div className="absolute bottom-4 left-6">
                            <Badge variant="outline" className={`${typeBgColors[listingType]} px-3 py-1.5 text-sm font-medium`}>
                                <span className="mr-1.5">{typeIcons[listingType]}</span>
                                {getTypeDisplayName(listingType)}
                            </Badge>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 overflow-auto">
                        <ScrollArea className="h-[calc(90vh-12rem)]">
                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {watch('name') || 'Listing Name'}
                                        </h2>
                                        <Badge variant="outline" className={statusColors[watch('status')]}>
                                            {watch('status').charAt(0).toUpperCase() + watch('status').slice(1)}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500">
                                        {watch('location.city') && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {watch('location.city')}{watch('location.state') ? `, ${watch('location.state')}` : ''}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(new Date())}
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Investment */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {listingType === 'business' ? 'Asking Price' :
                                            listingType === 'franchise' ? 'Investment Range' :
                                                listingType === 'startup' ? 'Funding Required' :
                                                    listingType === 'investor' ? 'Investment Capacity' :
                                                        'Sale Price'}
                                    </h3>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {listingType === 'business' && watch('businessDetails.sale.askingPrice.value') &&
                                            formatCurrency(watch('businessDetails.sale.askingPrice.value'), 'INR')}

                                        {listingType === 'franchise' && watch('franchiseDetails.investment.investmentRange.min.value') &&
                                            `${formatCurrency(watch('franchiseDetails.investment.investmentRange.min.value'), 'INR')} - 
                      ${watch('franchiseDetails.investment.investmentRange.max.value') ?
                                                formatCurrency(watch('franchiseDetails.investment.investmentRange.max.value'), 'INR') :
                                                formatCurrency(watch('franchiseDetails.investment.investmentRange.min.value') * 1.5, 'INR')}`}
                                    </div>

                                    {listingType === 'business' && watch('businessDetails.sale.isNegotiable') && (
                                        <div className="text-sm text-gray-500 mt-1">Price is negotiable</div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-700 whitespace-pre-line">{watch('description')}</p>
                                </div>

                                {/* Type-specific details section */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {listingType === 'business' ? 'Business Details' :
                                            listingType === 'franchise' ? 'Franchise Details' :
                                                listingType === 'startup' ? 'Startup Details' :
                                                    listingType === 'investor' ? 'Investor Details' :
                                                        'Digital Asset Details'}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        {listingType === 'business' && (
                                            <>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Business Type</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('businessDetails.businessType')?.charAt(0).toUpperCase() +
                                                            watch('businessDetails.businessType')?.slice(1).replace(/_/g, ' ') || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Established Year</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('businessDetails.establishedYear') || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Employees</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('businessDetails.operations.employees.count') || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Reason for Selling</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('businessDetails.sale.reasonForSelling') || 'N/A'}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {listingType === 'franchise' && (
                                            <>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Franchise Type</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('franchiseDetails.franchiseType')?.charAt(0).toUpperCase() +
                                                            watch('franchiseDetails.franchiseType')?.slice(1).replace(/_/g, ' ') || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Outlets</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('franchiseDetails.totalOutlets') || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Franchise Fee</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('franchiseDetails.investment.franchiseFee.value')
                                                            ? formatCurrency(watch('franchiseDetails.investment.franchiseFee.value'), 'INR')
                                                            : 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Royalty Fee</h4>
                                                    <div className="text-base text-gray-900">
                                                        {watch('franchiseDetails.investment.royaltyFee.percentage')
                                                            ? `${watch('franchiseDetails.investment.royaltyFee.percentage')}%`
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Default placeholders for other listing types */}
                                        {(listingType !== 'business' && listingType !== 'franchise') && (
                                            <div className="col-span-2 text-center py-2">
                                                <p className="text-gray-500">Preview of detailed information available after submission</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                                            <div className="text-base text-gray-900">
                                                {watch('contactInfo.contactName') || 'N/A'}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                                            <div className="text-base text-gray-900">
                                                {watch('contactInfo.email') || 'N/A'}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                                            <div className="text-base text-gray-900">
                                                {watch('contactInfo.phone') || 'N/A'}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Website</h4>
                                            <div className="text-base text-gray-900">
                                                {watch('contactInfo.website') || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Gallery Preview */}
                                {galleryImages.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Gallery</h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                            {galleryImages.map((image, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={image.preview || image.url}
                                                        alt={`Gallery ${index + 1}`}
                                                        className="h-24 w-full object-cover rounded-md"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer with note */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-500 italic">
                            This is a preview of how your listing will appear to users. Some features may look different on the live site.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    // Render exit confirmation dialog
    const renderExitConfirmDialog = () => (
        <Dialog
            open={isExitConfirmOpen}
            onOpenChange={setIsExitConfirmOpen}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Unsaved Changes</DialogTitle>
                    <DialogDescription>
                        You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex justify-between gap-3 sm:justify-end mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsExitConfirmOpen(false)}
                    >
                        Continue Editing
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => navigate('/listings')}
                    >
                        Discard Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Main render
    return (
        <FormProvider {...methods}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Form Progress: {formProgress}%
                        </span>
                        <span className="text-sm text-gray-500">
                            {formProgress < 100 ? 'Keep going!' : 'Complete!'}
                        </span>
                    </div>
                    <Progress value={formProgress} className="h-2" />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (isDirty) {
                                    setIsExitConfirmOpen(true);
                                } else {
                                    navigate('/listings');
                                }
                            }}
                            className="mr-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Listing' : 'Create New Listing'}
                        </h1>
                    </div>
                    <div className="hidden md:block">
                        <Button
                            variant="outline"
                            className="mr-2"
                            onClick={() => {
                                if (isDirty) {
                                    setIsExitConfirmOpen(true);
                                } else {
                                    navigate('/listings');
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        {isEditMode && (
                            <Button
                                variant="outline"
                                className="mr-2"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Listing'}
                        </Button>
                    </div>
                </div>

                {/* Display error or success message */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" className="mb-6 bg-green-50 border-green-200 text-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-600">Success</AlertTitle>
                        <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Form Content */}
                <Card>
                    <CardContent className="pt-6 px-6 pb-6">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {renderStepContent()}
                        </form>
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={() => activeStep > 0 && goToStep(activeStep - 1)}
                        disabled={activeStep === 0}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>

                    {activeStep < formSteps.length - 1 ? (
                        <Button
                            onClick={() => goToStep(activeStep + 1)}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Listing'}
                        </Button>
                    )}
                </div>

                {/* Mobile action buttons */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between md:hidden">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (isDirty) {
                                setIsExitConfirmOpen(true);
                            } else {
                                navigate('/listings');
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>

                {/* Modals */}
                {renderPreviewModal()}
                {renderExitConfirmDialog()}
            </div>
        </FormProvider>
    );
};

export default ListingFormPage;