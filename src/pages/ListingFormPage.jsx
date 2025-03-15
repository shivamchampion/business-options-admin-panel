import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { v4 as uuidv4 } from 'uuid';
import { 
  Store, Briefcase, TrendingUp, DollarSign, Globe, 
  Check, AlertCircle, X, Upload, MapPin, Calendar, 
  DollarSign as Dollar, BuildingIcon, Users, Percent, Trophy, 
  FileText, Link, Clock, Instagram, Facebook, Twitter, Linkedin,
  Plus, Trash, ChevronRight, ChevronLeft, HelpCircle, Image, File
} from 'lucide-react';

// Utility Imports
import { LISTING_TYPES, LISTING_STATUS, BUSINESS_TYPES, FRANCHISE_TYPES } from '../config/constants';
import { getListingValidationSchema } from '../utils/validation/listing-schemas';
import { useDatabase } from '@/contexts/DatabaseContext';
import { formatCurrency } from '../utils/helpers';

// UI Components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Type Icons Mapping
const TYPE_ICONS = {
  [LISTING_TYPES.BUSINESS]: Store,
  [LISTING_TYPES.FRANCHISE]: Briefcase,
  [LISTING_TYPES.STARTUP]: TrendingUp,
  [LISTING_TYPES.INVESTOR]: DollarSign,
  [LISTING_TYPES.DIGITAL_ASSET]: Globe
};

// Form section steps
const FORM_SECTIONS = {
  [LISTING_TYPES.BUSINESS]: [
    { id: 'basics', label: 'Basic Info' },
    { id: 'details', label: 'Business Details' },
    { id: 'location', label: 'Location' },
    { id: 'financials', label: 'Financials' },
    { id: 'sale', label: 'Sale Information' },
    { id: 'assets', label: 'Assets & Inventory' },
    { id: 'operations', label: 'Operations' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'media', label: 'Media & Documents' }
  ],
  [LISTING_TYPES.FRANCHISE]: [
    { id: 'basics', label: 'Basic Info' },
    { id: 'details', label: 'Franchise Details' },
    { id: 'location', label: 'Location' },
    { id: 'investment', label: 'Investment' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'support', label: 'Support & Training' },
    { id: 'performance', label: 'Performance' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'media', label: 'Media & Documents' }
  ],
  [LISTING_TYPES.STARTUP]: [
    { id: 'basics', label: 'Basic Info' },
    { id: 'details', label: 'Startup Details' },
    { id: 'team', label: 'Team & Founders' },
    { id: 'product', label: 'Product & Technology' },
    { id: 'market', label: 'Market & Competition' },
    { id: 'traction', label: 'Traction & Metrics' },
    { id: 'funding', label: 'Funding & Financials' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'media', label: 'Media & Documents' }
  ],
  [LISTING_TYPES.INVESTOR]: [
    { id: 'basics', label: 'Basic Info' },
    { id: 'details', label: 'Investor Details' },
    { id: 'investment', label: 'Investment Criteria' },
    { id: 'focus', label: 'Focus Areas' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'team', label: 'Team & Experience' },
    { id: 'process', label: 'Investment Process' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'media', label: 'Media & Documents' }
  ],
  [LISTING_TYPES.DIGITAL_ASSET]: [
    { id: 'basics', label: 'Basic Info' },
    { id: 'details', label: 'Asset Details' },
    { id: 'domain', label: 'Domain Information' },
    { id: 'technical', label: 'Technical Details' },
    { id: 'traffic', label: 'Traffic & Analytics' },
    { id: 'content', label: 'Content & Structure' },
    { id: 'financials', label: 'Financials & Revenue' },
    { id: 'sale', label: 'Sale Information' },
    { id: 'contact', label: 'Contact Info' },
    { id: 'media', label: 'Media & Documents' }
  ]
};

// Helper function to get years dropdown
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  let years = [];
  for (let year = currentYear; year >= 1980; year--) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};

// Main form component
const ListingFormPage = ({ 
  id = null, 
  onSubmitSuccess = () => {}, 
  onCancel = () => {} 
}) => {
  const isEditMode = !!id;
  const { ListingService, IndustryService, LocationService } = useDatabase();

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [listingType, setListingType] = useState(LISTING_TYPES.BUSINESS);
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState({
    states: [],
    cities: {}
  });
  const [fileUploads, setFileUploads] = useState({
    featuredImage: null,
    galleryImages: [],
    documents: []
  });
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [formSections, setFormSections] = useState(FORM_SECTIONS[LISTING_TYPES.BUSINESS]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showHelpTips, setShowHelpTips] = useState(true);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [helpContent, setHelpContent] = useState({ title: '', content: '' });

  // Form initialization
  const validationSchema = getListingValidationSchema(listingType);
  
  const defaultValues = {
    id: uuidv4(),
    type: LISTING_TYPES.BUSINESS,
    status: LISTING_STATUS.DRAFT,
    name: '',
    description: '',
    shortDescription: '',
    headline: '',
    location: {
      country: 'India',
      state: '',
      city: '',
      address: '',
      pincode: '',
      landmark: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      alternatePhone: '',
      website: '',
      contactName: '',
      designation: '',
      socialMedia: {
        facebook: { url: '', handle: '', isVerified: false },
        twitter: { url: '', handle: '', isVerified: false },
        instagram: { url: '', handle: '', isVerified: false },
        linkedin: { url: '', handle: '', isVerified: false }
      }
    },
    industries: [],
    media: {
      featuredImage: {
        url: '',
        path: '',
        alt: ''
      },
      galleryImages: [],
      documents: []
    },
    seo: {
      title: '',
      description: '',
      keywords: []
    },
    // Business-specific default values
    businessDetails: {
      businessType: '',
      establishedYear: new Date().getFullYear() - 5,
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
          sunday: { open: '09:00', close: '18:00', isClosed: true }
        }
      },
      financials: {
        annualRevenue: {
          value: 0,
          currency: 'INR'
        },
        profitMargin: {
          percentage: 0
        },
        expenses: {
          rent: { value: 0, currency: 'INR' },
          payroll: { value: 0, currency: 'INR' },
          utilities: { value: 0, currency: 'INR' },
          marketing: { value: 0, currency: 'INR' },
          other: { value: 0, currency: 'INR' }
        }
      },
      assets: {
        inventory: {
          isIncluded: true,
          value: { value: 0, currency: 'INR' },
          description: ''
        },
        equipment: {
          isIncluded: true,
          value: { value: 0, currency: 'INR' },
          description: '',
          condition: 'Good'
        },
        intellectualProperty: {
          isIncluded: false,
          types: [],
          description: ''
        },
        realEstate: {
          isIncluded: false,
          isOwned: false,
          isLeased: true
        }
      },
      sale: {
        askingPrice: {
          value: 0,
          currency: 'INR',
          priceJustification: ''
        },
        reasonForSelling: '',
        isNegotiable: true,
        sellerFinancing: {
          isAvailable: false
        },
        trainingAndSupport: {
          isSupportIncluded: true,
          trainingPeriod: '1 month'
        },
        nonCompete: {
          isIncluded: true,
          duration: '2 years'
        }
      }
    },
    // Franchise-specific default values
    franchiseDetails: {
      franchiseType: '',
      franchiseBrand: '',
      establishedYear: new Date().getFullYear() - 10,
      totalOutlets: 0,
      investment: {
        investmentRange: {
          min: { value: 0, currency: 'INR' },
          max: { value: 0, currency: 'INR' }
        },
        franchiseFee: {
          value: 0,
          currency: 'INR',
          isRefundable: false
        },
        royaltyFee: {
          percentage: 0,
          structure: '',
          frequency: 'Monthly'
        },
        marketingFee: {
          percentage: 0
        }
      },
      terms: {
        contractDuration: {
          years: 5,
          hasRenewalOption: true
        },
        territoryRights: {
          isExclusive: true
        },
        spaceRequirement: {
          minArea: '',
          maxArea: ''
        }
      },
      support: {
        initialSupport: {
          hasTrainingProvided: true,
          trainingDuration: '2 weeks',
          hasSiteSelection: true,
          hasGrandOpeningSupport: true
        },
        ongoingSupport: {
          fieldSupport: {
            isAvailable: true,
            frequency: 'Monthly'
          },
          marketingSupport: {
            isAvailable: true
          },
          operationalSupport: {
            isAvailable: true,
            hasManuals: true,
            hasHelpdesk: true
          }
        }
      },
      performance: {
        salesData: {
          averageUnitSales: { value: 0, currency: 'INR' },
          salesGrowth: ''
        },
        profitability: {
          averageProfitMargin: '',
          breakEvenPeriod: '',
          paybackPeriod: ''
        }
      }
    }
  };

  const { 
    control, 
    handleSubmit, 
    setValue, 
    watch, 
    reset, 
    trigger,
    getValues,
    formState: { errors, dirtyFields, isDirty } 
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Watch for important form values to enable conditional fields
  const watchListingType = watch('type');
  const watchState = watch('location.state');
  const watchBusinessType = watch('businessDetails.businessType');
  const watchAssetsIncluded = {
    inventory: watch('businessDetails.assets.inventory.isIncluded'),
    equipment: watch('businessDetails.assets.equipment.isIncluded'),
    intellectualProperty: watch('businessDetails.assets.intellectualProperty.isIncluded'),
    realEstate: watch('businessDetails.assets.realEstate.isIncluded')
  };
  
  // Dynamic arrays for repeatable fields
  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = 
    useFieldArray({ control, name: "media.galleryImages" });
  
  const { fields: documentFields, append: appendDocument, remove: removeDocument } = 
    useFieldArray({ control, name: "media.documents" });

  // Field arrays for specific listing types
  const { fields: teamMembersFields, append: appendTeamMember, remove: removeTeamMember } = 
    useFieldArray({ control, name: "startupDetails.team.keyTeamMembers" });

  const { fields: foundersFields, append: appendFounder, remove: removeFounder } = 
    useFieldArray({ control, name: "startupDetails.team.founders" });

  // Effect to update form sections when listing type changes
  useEffect(() => {
    if (watchListingType !== listingType) {
      setListingType(watchListingType);
      setFormSections(FORM_SECTIONS[watchListingType]);
      setCurrentStep(0);
    }
  }, [watchListingType, listingType]);

  // Effect to track unsaved changes
  useEffect(() => {
    if (isDirty && !isSubmitting) {
      setHasUnsavedChanges(true);
    }
  }, [isDirty, isSubmitting]);

  // Fetch necessary data (industries, locations, listing data for edit mode)
  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        // Fetch industries
        const industriesData = await IndustryService.getIndustries();
        setIndustries(industriesData);
        
        // Fetch location data
        const locationsData = await LocationService.getLocations();
        const states = locationsData.filter(loc => loc.type === 'state');
        
        // Organize cities by state
        const citiesByState = {};
        locationsData
          .filter(loc => loc.type === 'city')
          .forEach(city => {
            const stateId = city.parentId;
            if (!citiesByState[stateId]) {
              citiesByState[stateId] = [];
            }
            citiesByState[stateId].push(city);
          });
        
        setLocations({
          states,
          cities: citiesByState
        });
        
        // If edit mode, fetch listing data
        if (isEditMode) {
          const listing = await ListingService.getListingById(id);
          if (listing) {
            // Update listing type
            setListingType(listing.type);
            setFormSections(FORM_SECTIONS[listing.type]);
            
            // Clean up and set form values
            reset(listing);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setFormError("Failed to load necessary data. Please try again.");
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [id, isEditMode, reset]);

  // Update form progress based on filled fields
  useEffect(() => {
    if (isFetchingData) return;
    
    // Simple progress calculation based on completed steps
    const totalFields = Object.keys(validationSchema.fields).length;
    const filledFields = Object.keys(dirtyFields).length;
    const progressPercentage = Math.min(Math.round((filledFields / totalFields) * 100), 100);
    
    setFormProgress(progressPercentage);
  }, [dirtyFields, validationSchema.fields, isFetchingData]);

  // Form submission handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Process uploads first if any
      if (fileUploads.featuredImage) {
        // In a real app, you would upload the file to storage here
        // For now, we'll just simulate it
        data.media.featuredImage = {
          url: URL.createObjectURL(fileUploads.featuredImage),
          path: `listings/${data.id}/featured-${fileUploads.featuredImage.name}`,
          alt: data.name,
          width: 800,
          height: 600
        };
      }

      // Handle gallery images
      if (fileUploads.galleryImages.length > 0) {
        data.media.galleryImages = fileUploads.galleryImages.map((file, index) => ({
          url: URL.createObjectURL(file),
          path: `listings/${data.id}/gallery-${index}-${file.name}`,
          alt: `${data.name} - Image ${index + 1}`,
          width: 800,
          height: 600
        }));
      }

      // Handle documents
      if (fileUploads.documents.length > 0) {
        data.media.documents = fileUploads.documents.map((file, index) => ({
          url: URL.createObjectURL(file),
          path: `listings/${data.id}/doc-${index}-${file.name}`,
          name: file.name,
          type: file.type,
          size: file.size,
          isPublic: true
        }));
      }

      // Clean up the data
      // Remove empty objects and arrays
      const cleanData = JSON.parse(JSON.stringify(data), (key, value) => {
        // Remove empty arrays
        if (Array.isArray(value) && value.length === 0) return undefined;
        
        // Remove empty objects
        if (value !== null && typeof value === 'object' && 
            Object.keys(value).length === 0) return undefined;
        
        // Remove empty strings
        if (value === "") return undefined;
        
        return value;
      });

      // Submit to service
      if (isEditMode) {
        await ListingService.updateListing(id, cleanData);
      } else {
        await ListingService.createListing(cleanData);
      }
      
      setIsDraftSaved(true);
      setHasUnsavedChanges(false);
      onSubmitSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Parse and display validation errors
      try {
        const parsedErrors = typeof error.message === 'string' ? JSON.parse(error.message) : error.message;
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

  // Save draft function
  const saveDraft = async () => {
    setIsSubmitting(true);
    try {
      const currentData = getValues();
      currentData.status = LISTING_STATUS.DRAFT;
      
      if (isEditMode) {
        await ListingService.updateListing(id, currentData);
      } else {
        await ListingService.createListing(currentData);
      }
      
      setIsDraftSaved(true);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      setFormError("Failed to save draft. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'featuredImage' && files.length > 0) {
      setFileUploads(prev => ({
        ...prev,
        featuredImage: files[0]
      }));
    } else if (type === 'galleryImages') {
      setFileUploads(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...files]
      }));
    } else if (type === 'documents') {
      setFileUploads(prev => ({
        ...prev,
        documents: [...prev.documents, ...files]
      }));
    }
  };

  // Navigation between form sections
  const goToNextStep = async () => {
    // Validate current step before proceeding
    const currentSectionId = formSections[currentStep].id;
    const isValid = await validateCurrentStep(currentSectionId);
    
    if (!isValid) {
      // Highlight errors
      setFormError(`Please fix the errors in the ${formSections[currentStep].label} section before proceeding.`);
      return;
    }
    
    if (currentStep < formSections.length - 1) {
      setCurrentStep(currentStep + 1);
      setFormError(null);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setFormError(null);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < formSections.length) {
      setCurrentStep(stepIndex);
      setFormError(null);
      window.scrollTo(0, 0);
    }
  };

  // Validate current step fields
  const validateCurrentStep = async (sectionId) => {
    let fieldsToValidate = [];
    
    // Define which fields belong to each section
    switch (sectionId) {
      case 'basics':
        fieldsToValidate = ['name', 'type', 'description', 'shortDescription', 'headline', 'industries'];
        break;
      case 'location':
        fieldsToValidate = ['location.country', 'location.state', 'location.city', 'location.address', 'location.pincode'];
        break;
      case 'contact':
        fieldsToValidate = ['contactInfo.email', 'contactInfo.phone', 'contactInfo.contactName'];
        break;
      case 'details':
        if (listingType === LISTING_TYPES.BUSINESS) {
          fieldsToValidate = ['businessDetails.businessType', 'businessDetails.establishedYear'];
        } else if (listingType === LISTING_TYPES.FRANCHISE) {
          fieldsToValidate = ['franchiseDetails.franchiseType', 'franchiseDetails.franchiseBrand', 'franchiseDetails.establishedYear'];
        }
        break;
      case 'financials':
        if (listingType === LISTING_TYPES.BUSINESS) {
          fieldsToValidate = ['businessDetails.financials.annualRevenue.value'];
        }
        break;
      case 'sale':
        if (listingType === LISTING_TYPES.BUSINESS) {
          fieldsToValidate = ['businessDetails.sale.askingPrice.value', 'businessDetails.sale.reasonForSelling'];
        }
        break;
      default:
        // For other sections or when section-specific validation is not needed
        return true;
    }
    
    // Trigger validation for the fields in this section
    const results = await Promise.all(fieldsToValidate.map(field => trigger(field)));
    
    // If any validation failed, return false
    return !results.includes(false);
  };

  // Show the help dialog with context-specific guidance
  const showHelp = (title, content) => {
    setHelpContent({ title, content });
    setOpenHelpDialog(true);
  };

  // Render form section based on current step
  const renderFormSection = () => {
    const currentSectionId = formSections[currentStep].id;
    
    switch (currentSectionId) {
      case 'basics':
        return renderBasicInfoSection();
      case 'details':
        return renderDetailsSection();
      case 'location':
        return renderLocationSection();
      case 'financials':
        return renderFinancialsSection();
      case 'sale':
        return renderSaleSection();
      case 'assets':
        return renderAssetsSection();
      case 'operations':
        return renderOperationsSection();
      case 'contact':
        return renderContactSection();
      case 'media':
        return renderMediaSection();
      case 'investment':
        return renderInvestmentSection();
      case 'terms':
        return renderTermsSection();
      case 'support':
        return renderSupportSection();
      case 'performance':
        return renderPerformanceSection();
      case 'team':
        return renderTeamSection();
      case 'product':
        return renderProductSection();
      case 'market':
        return renderMarketSection();
      case 'traction':
        return renderTractionSection();
      case 'funding':
        return renderFundingSection();
      case 'focus':
        return renderFocusSection();
      case 'portfolio':
        return renderPortfolioSection();
      case 'process':
        return renderProcessSection();
      case 'domain':
        return renderDomainSection();
      case 'technical':
        return renderTechnicalSection();
      case 'traffic':
        return renderTrafficSection();
      case 'content':
        return renderContentSection();
      default:
        return (
          <div className="flex items-center justify-center p-8">
            <p>Unknown section: {currentSectionId}</p>
          </div>
        );
    }
  };

  // Render each form section
  const renderBasicInfoSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Basic Information</h2>
            <p className="text-gray-500 text-sm">Provide the essential information about your listing</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Listing Basics Help", 
                "This section captures the essential information that will help potential buyers understand what you're offering. A clear, concise name and description are crucial for attracting interest."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Listing Type Selection */}
          <div>
            <Label htmlFor="type" className="font-medium text-gray-700">
              Listing Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {Object.values(LISTING_TYPES).map(type => {
                const Icon = TYPE_ICONS[type];
                return (
                  <Controller
                    key={type}
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Button
                        type="button"
                        variant={field.value === type ? 'default' : 'outline'}
                        onClick={() => {
                          // Confirm type change if form has values
                          if (hasUnsavedChanges && field.value !== type) {
                            if (confirm("Changing listing type will reset some form fields. Continue?")) {
                              field.onChange(type);
                            }
                          } else {
                            field.onChange(type);
                          }
                        }}
                        className="flex flex-col items-center justify-center h-24 p-2"
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <span className="text-xs text-center">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </Button>
                    )}
                  />
                );
              })}
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Listing Name */}
          <div>
            <Label htmlFor="name" className="font-medium text-gray-700">
              Listing Name <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="name"
              control={control}
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
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Headline */}
          <div>
            <Label htmlFor="headline" className="font-medium text-gray-700">
              Headline
              <span className="ml-2 text-xs text-gray-500">(Brief tagline that appears with your listing)</span>
            </Label>
            <Controller
              name="headline"
              control={control}
              render={({ field }) => (
                <Input 
                  id="headline"
                  placeholder="E.g., 'Profitable cafe in prime location' or 'Innovative tech startup seeking angel investment'"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.headline && (
              <p className="text-red-500 text-sm mt-1">{errors.headline.message}</p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <Label htmlFor="shortDescription" className="font-medium text-gray-700">
              Short Description
              <span className="ml-2 text-xs text-gray-500">(Summary shown in listing cards, max 150 characters)</span>
            </Label>
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="shortDescription"
                  placeholder="Brief summary of your listing (max 150 characters)"
                  className="mt-1 resize-none"
                  maxLength={150}
                  rows={2}
                  {...field}
                />
              )}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">
                {watch('shortDescription')?.length || 0}/150 characters
              </span>
            </div>
            {errors.shortDescription && (
              <p className="text-red-500 text-sm mt-1">{errors.shortDescription.message}</p>
            )}
          </div>

          {/* Full Description */}
          <div>
            <Label htmlFor="description" className="font-medium text-gray-700">
              Full Description <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">(Detailed information about your listing)</span>
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="description"
                  placeholder="Provide a detailed description of your business, franchise, startup, investment opportunity, or digital asset"
                  className="mt-1"
                  rows={6}
                  {...field}
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Industries */}
          <div>
            <Label htmlFor="industries" className="font-medium text-gray-700">
              Industries <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">(Select up to 3 industries that best describe your listing)</span>
            </Label>
            <Controller
              name="industries"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-1"
                    >
                      {field.value?.length
                        ? `${field.value.length} industries selected`
                        : "Select industries..."}
                      <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search industries..." />
                      <CommandEmpty>No industry found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {industries.map((industry) => (
                          <CommandItem
                            key={industry.id}
                            value={industry.id}
                            onSelect={() => {
                              const currentValues = [...(field.value || [])];
                              const isSelected = currentValues.includes(industry.id);
                              
                              if (isSelected) {
                                field.onChange(currentValues.filter(id => id !== industry.id));
                              } else if (currentValues.length < 3) {
                                field.onChange([...currentValues, industry.id]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={field.value?.includes(industry.id)}
                              className="mr-2"
                            />
                            {industry.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {watch('industries')?.map(industryId => {
                const industry = industries.find(i => i.id === industryId);
                if (!industry) return null;
                
                return (
                  <Badge key={industryId} variant="secondary" className="flex items-center gap-1">
                    {industry.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        const currentValues = watch('industries') || [];
                        setValue('industries', currentValues.filter(id => id !== industryId), { shouldDirty: true });
                      }}
                    />
                  </Badge>
                );
              })}
            </div>
            {errors.industries && (
              <p className="text-red-500 text-sm mt-1">{errors.industries.message}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsSection = () => {
    // Render different details section based on listing type
    switch (listingType) {
      case LISTING_TYPES.BUSINESS:
        return renderBusinessDetailsSection();
      case LISTING_TYPES.FRANCHISE:
        return renderFranchiseDetailsSection();
      case LISTING_TYPES.STARTUP:
        return renderStartupDetailsSection();
      case LISTING_TYPES.INVESTOR:
        return renderInvestorDetailsSection();
      case LISTING_TYPES.DIGITAL_ASSET:
        return renderDigitalAssetDetailsSection();
      default:
        return <p>Unknown listing type</p>;
    }
  };

  const renderBusinessDetailsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Business Details</h2>
            <p className="text-gray-500 text-sm">Provide specific information about your business</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Business Details Help", 
                "This section captures essential information about your business structure, operations, and legal details. Providing accurate information here helps potential buyers evaluate the business properly."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Type */}
          <div>
            <Label htmlFor="businessDetails.businessType" className="font-medium text-gray-700">
              Business Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="businessDetails.businessType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.businessDetails?.businessType && (
              <p className="text-red-500 text-sm mt-1">{errors.businessDetails.businessType.message}</p>
            )}
          </div>

          {/* Established Year */}
          <div>
            <Label htmlFor="businessDetails.establishedYear" className="font-medium text-gray-700">
              Established Year <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="businessDetails.establishedYear"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map(year => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.businessDetails?.establishedYear && (
              <p className="text-red-500 text-sm mt-1">{errors.businessDetails.establishedYear.message}</p>
            )}
          </div>

          {/* Registration Number */}
          <div>
            <Label htmlFor="businessDetails.registrationNumber" className="font-medium text-gray-700">
              Registration Number
            </Label>
            <Controller
              name="businessDetails.registrationNumber"
              control={control}
              render={({ field }) => (
                <Input 
                  id="businessDetails.registrationNumber"
                  placeholder="Enter business registration number"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.businessDetails?.registrationNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.businessDetails.registrationNumber.message}</p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <Label htmlFor="businessDetails.gstNumber" className="font-medium text-gray-700">
              GST Number
            </Label>
            <Controller
              name="businessDetails.gstNumber"
              control={control}
              render={({ field }) => (
                <Input 
                  id="businessDetails.gstNumber"
                  placeholder="Enter GST number"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.businessDetails?.gstNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.businessDetails.gstNumber.message}</p>
            )}
          </div>

          {/* PAN Number */}
          <div>
            <Label htmlFor="businessDetails.panNumber" className="font-medium text-gray-700">
              PAN Number
            </Label>
            <Controller
              name="businessDetails.panNumber"
              control={control}
              render={({ field }) => (
                <Input 
                  id="businessDetails.panNumber"
                  placeholder="Enter PAN number"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.businessDetails?.panNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.businessDetails.panNumber.message}</p>
            )}
          </div>
        </div>
        
        {/* Licenses & Certifications */}
        <div>
          <Label className="font-medium text-gray-700">
            Licenses & Certifications
          </Label>
          <Controller
            name="businessDetails.licenses"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add licenses and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Awards & Recognition */}
        <div>
          <Label className="font-medium text-gray-700">
            Awards & Recognition
          </Label>
          <Controller
            name="businessDetails.awards"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add awards and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderFranchiseDetailsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Franchise Details</h2>
            <p className="text-gray-500 text-sm">Provide specific information about your franchise opportunity</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Franchise Details Help", 
                "This section captures important information about your franchise business. Potential franchisees will use this information to evaluate your franchise opportunity."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Franchise Type */}
          <div>
            <Label htmlFor="franchiseDetails.franchiseType" className="font-medium text-gray-700">
              Franchise Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="franchiseDetails.franchiseType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select franchise type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRANCHISE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.franchiseDetails?.franchiseType && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.franchiseType.message}</p>
            )}
          </div>

          {/* Franchise Brand */}
          <div>
            <Label htmlFor="franchiseDetails.franchiseBrand" className="font-medium text-gray-700">
              Franchise Brand <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="franchiseDetails.franchiseBrand"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.franchiseBrand"
                  placeholder="Enter franchise brand name"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.franchiseDetails?.franchiseBrand && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.franchiseBrand.message}</p>
            )}
          </div>

          {/* Established Year */}
          <div>
            <Label htmlFor="franchiseDetails.establishedYear" className="font-medium text-gray-700">
              Established Year <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="franchiseDetails.establishedYear"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map(year => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.franchiseDetails?.establishedYear && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.establishedYear.message}</p>
            )}
          </div>

          {/* Total Outlets */}
          <div>
            <Label htmlFor="franchiseDetails.totalOutlets" className="font-medium text-gray-700">
              Total Outlets <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="franchiseDetails.totalOutlets"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.totalOutlets"
                  type="number"
                  placeholder="Enter total number of outlets"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
            {errors.franchiseDetails?.totalOutlets && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.totalOutlets.message}</p>
            )}
          </div>

          {/* Total Franchisees */}
          <div>
            <Label htmlFor="franchiseDetails.totalFranchisees" className="font-medium text-gray-700">
              Total Franchisees
            </Label>
            <Controller
              name="franchiseDetails.totalFranchisees"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.totalFranchisees"
                  type="number"
                  placeholder="Enter total number of franchisees"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
            {errors.franchiseDetails?.totalFranchisees && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.totalFranchisees.message}</p>
            )}
          </div>

          {/* Company Owned Units */}
          <div>
            <Label htmlFor="franchiseDetails.companyOwnedUnits" className="font-medium text-gray-700">
              Company Owned Units
            </Label>
            <Controller
              name="franchiseDetails.companyOwnedUnits"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.companyOwnedUnits"
                  type="number"
                  placeholder="Enter number of company owned units"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
            {errors.franchiseDetails?.companyOwnedUnits && (
              <p className="text-red-500 text-sm mt-1">{errors.franchiseDetails.companyOwnedUnits.message}</p>
            )}
          </div>
        </div>
        
        {/* Country of Origin */}
        <div>
          <Label htmlFor="franchiseDetails.countryOfOrigin" className="font-medium text-gray-700">
            Country of Origin
          </Label>
          <Controller
            name="franchiseDetails.countryOfOrigin"
            control={control}
            render={({ field }) => (
              <Input 
                id="franchiseDetails.countryOfOrigin"
                placeholder="Enter country of origin"
                className="mt-1"
                defaultValue="India"
                {...field}
              />
            )}
          />
        </div>
        
        {/* Awards & Recognition */}
        <div>
          <Label className="font-medium text-gray-700">
            Awards & Recognition
          </Label>
          <Controller
            name="franchiseDetails.awards"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add awards and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderStartupDetailsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Startup Details</h2>
            <p className="text-gray-500 text-sm">Provide information about your startup venture</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Startup Details Help", 
                "This section captures important information about your startup. Potential investors will use this information to evaluate your venture."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Startup Stage */}
          <div>
            <Label htmlFor="startupDetails.stage" className="font-medium text-gray-700">
              Startup Stage <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="startupDetails.stage"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select startup stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="mvp">MVP (Minimum Viable Product)</SelectItem>
                    <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="early_growth">Early Growth</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="series_b">Series B</SelectItem>
                    <SelectItem value="series_c_plus">Series C and beyond</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.startupDetails?.stage && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.stage.message}</p>
            )}
          </div>

          {/* Founded Date */}
          <div>
            <Label htmlFor="startupDetails.foundedDate" className="font-medium text-gray-700">
              Founded Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="startupDetails.foundedDate"
              control={control}
              render={({ field }) => (
                <Input 
                  id="startupDetails.foundedDate"
                  type="date"
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                  {...field}
                  value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                />
              )}
            />
            {errors.startupDetails?.foundedDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.foundedDate.message}</p>
            )}
          </div>

          {/* Registered Name */}
          <div>
            <Label htmlFor="startupDetails.registeredName" className="font-medium text-gray-700">
              Registered Company Name
            </Label>
            <Controller
              name="startupDetails.registeredName"
              control={control}
              render={({ field }) => (
                <Input 
                  id="startupDetails.registeredName"
                  placeholder="Enter legally registered name"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.startupDetails?.registeredName && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.registeredName.message}</p>
            )}
          </div>

          {/* Registration Type */}
          <div>
            <Label htmlFor="startupDetails.registrationType" className="font-medium text-gray-700">
              Registration Type
            </Label>
            <Controller
              name="startupDetails.registrationType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pvt_ltd">Private Limited</SelectItem>
                    <SelectItem value="llp">Limited Liability Partnership</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="proprietorship">Proprietorship</SelectItem>
                    <SelectItem value="one_person_company">One Person Company</SelectItem>
                    <SelectItem value="not_registered">Not Registered Yet</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.startupDetails?.registrationType && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.registrationType.message}</p>
            )}
          </div>
        </div>
        
        {/* Mission & Vision */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="startupDetails.mission" className="font-medium text-gray-700">
              Mission Statement
            </Label>
            <Controller
              name="startupDetails.mission"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.mission"
                  placeholder="Enter your startup's mission statement"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="startupDetails.vision" className="font-medium text-gray-700">
              Vision Statement
            </Label>
            <Controller
              name="startupDetails.vision"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.vision"
                  placeholder="Enter your startup's vision statement"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Problem Statement */}
        <div>
          <Label htmlFor="startupDetails.problemStatement" className="font-medium text-gray-700">
            Problem Statement <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="startupDetails.problemStatement"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="startupDetails.problemStatement"
                placeholder="Describe the problem your startup aims to solve"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
          {errors.startupDetails?.problemStatement && (
            <p className="text-red-500 text-sm mt-1">{errors.startupDetails.problemStatement.message}</p>
          )}
        </div>
      </div>
    );
  };

  const renderInvestorDetailsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Investor Details</h2>
            <p className="text-gray-500 text-sm">Provide information about your investment profile</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Investor Details Help", 
                "This section captures important information about your investment profile. Founders and business owners will use this information to determine if you're a potential match for their fundraising needs."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Type */}
          <div>
            <Label htmlFor="investorDetails.investorType" className="font-medium text-gray-700">
              Investor Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="investorDetails.investorType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select investor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="angel">Angel Investor</SelectItem>
                    <SelectItem value="vc">Venture Capital Firm</SelectItem>
                    <SelectItem value="pe">Private Equity Firm</SelectItem>
                    <SelectItem value="corporate">Corporate Investor</SelectItem>
                    <SelectItem value="family_office">Family Office</SelectItem>
                    <SelectItem value="individual">Individual Investor</SelectItem>
                    <SelectItem value="group">Investment Group</SelectItem>
                    <SelectItem value="crowdfunding">Crowdfunding Platform</SelectItem>
                    <SelectItem value="incubator">Incubator / Accelerator</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.investorDetails?.investorType && (
              <p className="text-red-500 text-sm mt-1">{errors.investorDetails.investorType.message}</p>
            )}
          </div>

          {/* Established Year */}
          <div>
            <Label htmlFor="investorDetails.establishedYear" className="font-medium text-gray-700">
              Established Year
            </Label>
            <Controller
              name="investorDetails.establishedYear"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map(year => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.investorDetails?.establishedYear && (
              <p className="text-red-500 text-sm mt-1">{errors.investorDetails.establishedYear.message}</p>
            )}
          </div>
        </div>
        
        {/* Investment Philosophy */}
        <div>
          <Label htmlFor="investorDetails.investmentPhilosophy" className="font-medium text-gray-700">
            Investment Philosophy <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="investorDetails.investmentPhilosophy"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="investorDetails.investmentPhilosophy"
                placeholder="Describe your investment approach and philosophy"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
          {errors.investorDetails?.investmentPhilosophy && (
            <p className="text-red-500 text-sm mt-1">{errors.investorDetails.investmentPhilosophy.message}</p>
          )}
        </div>
        
        {/* Experience */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">Experience</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Years of Experience */}
            <div>
              <Label htmlFor="investorDetails.experience.years" className="font-medium text-gray-700">
                Years of Experience
              </Label>
              <Controller
                name="investorDetails.experience.years"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.experience.years"
                    type="number"
                    placeholder="Enter years of investment experience"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          {/* Background Summary */}
          <div>
            <Label htmlFor="investorDetails.experience.backgroundSummary" className="font-medium text-gray-700">
              Background Summary
            </Label>
            <Controller
              name="investorDetails.experience.backgroundSummary"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="investorDetails.experience.backgroundSummary"
                  placeholder="Provide a summary of your investment background and experience"
                  className="mt-1"
                  rows={3}
                  {...field}
                />
              )}
            />
          </div>
          
          {/* Key Achievements */}
          <div>
            <Label className="font-medium text-gray-700">
              Key Achievements
            </Label>
            <Controller
              name="investorDetails.experience.keyAchievements"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add key achievements and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDigitalAssetDetailsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Digital Asset Details</h2>
            <p className="text-gray-500 text-sm">Provide information about your digital asset</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Digital Asset Details Help", 
                "This section captures important information about your digital asset. Potential buyers will use this information to evaluate your offering."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Type */}
          <div>
            <Label htmlFor="digitalAssetDetails.assetType" className="font-medium text-gray-700">
              Asset Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="digitalAssetDetails.assetType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="mobile_app">Mobile App</SelectItem>
                    <SelectItem value="online_store">Online Store / E-commerce</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="saas">SaaS (Software as a Service)</SelectItem>
                    <SelectItem value="online_marketplace">Online Marketplace</SelectItem>
                    <SelectItem value="content_site">Content Site</SelectItem>
                    <SelectItem value="domain_portfolio">Domain Portfolio</SelectItem>
                    <SelectItem value="social_media">Social Media Account/Channel</SelectItem>
                    <SelectItem value="newsletter">Newsletter / Email List</SelectItem>
                    <SelectItem value="digital_product">Digital Product</SelectItem>
                    <SelectItem value="nft">NFT or Digital Collectible</SelectItem>
                    <SelectItem value="other">Other Digital Asset</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.digitalAssetDetails?.assetType && (
              <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.assetType.message}</p>
            )}
          </div>

          {/* Platform */}
          <div>
            <Label htmlFor="digitalAssetDetails.platform" className="font-medium text-gray-700">
              Platform
            </Label>
            <Controller
              name="digitalAssetDetails.platform"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.platform"
                  placeholder="e.g., WordPress, Shopify, iOS, Android, etc."
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.digitalAssetDetails?.platform && (
              <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.platform.message}</p>
            )}
          </div>

          {/* Niche */}
          <div>
            <Label htmlFor="digitalAssetDetails.niche" className="font-medium text-gray-700">
              Niche / Category <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="digitalAssetDetails.niche"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.niche"
                  placeholder="e.g., Health & Fitness, Finance, Technology, etc."
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.digitalAssetDetails?.niche && (
              <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.niche.message}</p>
            )}
          </div>

          {/* Founded Date */}
          <div>
            <Label htmlFor="digitalAssetDetails.founded.date" className="font-medium text-gray-700">
              Founded Date
            </Label>
            <Controller
              name="digitalAssetDetails.founded.date"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.founded.date"
                  type="date"
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                  {...field}
                  value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                />
              )}
            />
            {errors.digitalAssetDetails?.founded?.date && (
              <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.founded.date.message}</p>
            )}
          </div>
        </div>
        
        {/* Age / Maturity */}
        <div>
          <Label htmlFor="digitalAssetDetails.founded.age" className="font-medium text-gray-700">
            Asset Age / Maturity
          </Label>
          <Controller
            name="digitalAssetDetails.founded.age"
            control={control}
            render={({ field }) => (
              <Input 
                id="digitalAssetDetails.founded.age"
                placeholder="e.g., 3 years and 2 months, 6 years, etc."
                className="mt-1"
                {...field}
              />
            )}
          />
          {errors.digitalAssetDetails?.founded?.age && (
            <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.founded.age.message}</p>
          )}
        </div>
      </div>
    );
  };

  const renderLocationSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Location Information</h2>
            <p className="text-gray-500 text-sm">Provide details about the location of your business or operation</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Location Information Help", 
                "Accurate location information helps potential buyers or investors understand the geographic context of your listing. This can significantly impact the perceived value based on market conditions and accessibility."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Country */}
          <div>
            <Label htmlFor="location.country" className="font-medium text-gray-700">
              Country <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="location.country"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled // Currently only supporting India
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location?.country && (
              <p className="text-red-500 text-sm mt-1">{errors.location.country.message}</p>
            )}
          </div>

          {/* State */}
          <div>
            <Label htmlFor="location.state" className="font-medium text-gray-700">
              State <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="location.state"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset city when state changes
                    setValue('location.city', '');
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.states.map(state => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location?.state && (
              <p className="text-red-500 text-sm mt-1">{errors.location.state.message}</p>
            )}
          </div>

          {/* City */}
          <div>
            <Label htmlFor="location.city" className="font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="location.city"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!watchState} // Disable if no state selected
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={watchState ? "Select city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {watchState && locations.cities[watchState]?.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location?.city && (
              <p className="text-red-500 text-sm mt-1">{errors.location.city.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Address */}
          <div>
            <Label htmlFor="location.address" className="font-medium text-gray-700">
              Address <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="location.address"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="location.address"
                  placeholder="Enter full address"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
            {errors.location?.address && (
              <p className="text-red-500 text-sm mt-1">{errors.location.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pincode */}
            <div>
              <Label htmlFor="location.pincode" className="font-medium text-gray-700">
                Pincode <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="location.pincode"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="location.pincode"
                    placeholder="Enter pincode"
                    className="mt-1"
                    maxLength={6}
                    {...field}
                  />
                )}
              />
              {errors.location?.pincode && (
                <p className="text-red-500 text-sm mt-1">{errors.location.pincode.message}</p>
              )}
            </div>

            {/* Landmark */}
            <div>
              <Label htmlFor="location.landmark" className="font-medium text-gray-700">
                Landmark
              </Label>
              <Controller
                name="location.landmark"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="location.landmark"
                    placeholder="Enter nearby landmark"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Location Visibility Note */}
        <div>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>Location Privacy</AlertTitle>
            <AlertDescription>
              For security and confidentiality, the exact address will only be shared with verified interested buyers. The city and state will be shown publicly.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  const renderFinancialsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Financial Information</h2>
            <p className="text-gray-500 text-sm">Provide details about the financial performance of your business</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Financial Information Help", 
                "Accurate financial information is crucial for potential buyers to assess the value of your business. Include details about revenue, expenses, profit margins, and growth trends. This transparency builds trust and facilitates faster deal-making."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Annual Revenue */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Annual Revenue</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessDetails.financials.annualRevenue.value" className="font-medium text-gray-700">
                Annual Revenue (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="businessDetails.financials.annualRevenue.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.annualRevenue.value"
                    type="number"
                    placeholder="Enter annual revenue in INR"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.businessDetails?.financials?.annualRevenue?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.businessDetails.financials.annualRevenue.value.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="businessDetails.financials.annualRevenue.period" className="font-medium text-gray-700">
                Period
              </Label>
              <Controller
                name="businessDetails.financials.annualRevenue.period"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FY 2023-24">FY 2023-24</SelectItem>
                      <SelectItem value="FY 2022-23">FY 2022-23</SelectItem>
                      <SelectItem value="FY 2021-22">FY 2021-22</SelectItem>
                      <SelectItem value="Last 12 months">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="businessDetails.financials.annualRevenue.isVerified"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="isRevenueVerified"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isRevenueVerified" className="text-sm">
              This revenue has been verified by an accountant
            </Label>
          </div>
        </div>
        
        {/* Monthly Revenue */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Monthly Revenue</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessDetails.financials.monthlyRevenue.value" className="font-medium text-gray-700">
                Monthly Revenue (₹)
              </Label>
              <Controller
                name="businessDetails.financials.monthlyRevenue.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.monthlyRevenue.value"
                    type="number"
                    placeholder="Enter monthly revenue in INR"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="businessDetails.financials.monthlyRevenue.trend" className="font-medium text-gray-700">
                Trend
              </Label>
              <Controller
                name="businessDetails.financials.monthlyRevenue.trend"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select trend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increasing">Increasing</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="decreasing">Decreasing</SelectItem>
                      <SelectItem value="fluctuating">Fluctuating</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Profit Margin */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Profit Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessDetails.financials.profitMargin.percentage" className="font-medium text-gray-700">
                Profit Margin (%)
              </Label>
              <Controller
                name="businessDetails.financials.profitMargin.percentage"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.profitMargin.percentage"
                    type="number"
                    placeholder="Enter profit margin percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="businessDetails.financials.profitMargin.trend" className="font-medium text-gray-700">
                Trend
              </Label>
              <Controller
                name="businessDetails.financials.profitMargin.trend"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select trend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increasing">Increasing</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="decreasing">Decreasing</SelectItem>
                      <SelectItem value="fluctuating">Fluctuating</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Expenses */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Monthly Expenses</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Rent */}
            <div>
              <Label htmlFor="businessDetails.financials.expenses.rent.value" className="font-medium text-gray-700">
                Rent
              </Label>
              <Controller
                name="businessDetails.financials.expenses.rent.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.expenses.rent.value"
                    type="number"
                    placeholder="Monthly rent"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            {/* Payroll */}
            <div>
              <Label htmlFor="businessDetails.financials.expenses.payroll.value" className="font-medium text-gray-700">
                Payroll
              </Label>
              <Controller
                name="businessDetails.financials.expenses.payroll.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.expenses.payroll.value"
                    type="number"
                    placeholder="Monthly payroll"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            {/* Utilities */}
            <div>
              <Label htmlFor="businessDetails.financials.expenses.utilities.value" className="font-medium text-gray-700">
                Utilities
              </Label>
              <Controller
                name="businessDetails.financials.expenses.utilities.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.expenses.utilities.value"
                    type="number"
                    placeholder="Monthly utilities"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>

            {/* Marketing */}
            <div>
              <Label htmlFor="businessDetails.financials.expenses.marketing.value" className="font-medium text-gray-700">
                Marketing
              </Label>
              <Controller
                name="businessDetails.financials.expenses.marketing.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.expenses.marketing.value"
                    type="number"
                    placeholder="Monthly marketing"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            {/* Other */}
            <div>
              <Label htmlFor="businessDetails.financials.expenses.other.value" className="font-medium text-gray-700">
                Other Expenses
              </Label>
              <Controller
                name="businessDetails.financials.expenses.other.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.financials.expenses.other.value"
                    type="number"
                    placeholder="Other monthly expenses"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Financial Health */}
        <div>
          <Label htmlFor="businessDetails.financials.financialHealth" className="font-medium text-gray-700">
            Overall Financial Health
          </Label>
          <Controller
            name="businessDetails.financials.financialHealth"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select financial health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="improving">Improving</SelectItem>
                  <SelectItem value="declining">Declining</SelectItem>
                  <SelectItem value="struggling">Struggling</SelectItem>
                  <SelectItem value="recovering">Recovering</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        
        {/* Revenue Streams */}
        <div>
          <Label className="font-medium text-gray-700">
            Revenue Streams
          </Label>
          <Controller
            name="businessDetails.financials.revenueStreams"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add revenue streams and press Enter (e.g., Product Sales, Services, Subscriptions)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderSaleSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Sale Information</h2>
            <p className="text-gray-500 text-sm">Provide details about the terms of sale for your business</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Sale Information Help", 
                "The sale information section is crucial for setting clear expectations with potential buyers. Be transparent about your asking price, your reasons for selling, and what terms you're flexible on. A well-structured sale section helps attract serious buyers who are aligned with your expectations."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Asking Price */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Asking Price</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessDetails.sale.askingPrice.value" className="font-medium text-gray-700">
                Asking Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="businessDetails.sale.askingPrice.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.sale.askingPrice.value"
                    type="number"
                    placeholder="Enter asking price in INR"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.businessDetails?.sale?.askingPrice?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.businessDetails.sale.askingPrice.value.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="businessDetails.sale.askingPrice.priceMultiple" className="font-medium text-gray-700">
                Price Multiple (if applicable)
              </Label>
              <Controller
                name="businessDetails.sale.askingPrice.priceMultiple"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.sale.askingPrice.priceMultiple"
                    type="number"
                    placeholder="e.g., 2.5x annual profit"
                    className="mt-1"
                    min={0}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="businessDetails.sale.isNegotiable"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="isNegotiable"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isNegotiable" className="text-sm">
              Price is negotiable
            </Label>
          </div>
          
          <div>
            <Label htmlFor="businessDetails.sale.askingPrice.priceJustification" className="font-medium text-gray-700">
              Price Justification
            </Label>
            <Controller
              name="businessDetails.sale.askingPrice.priceJustification"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="businessDetails.sale.askingPrice.priceJustification"
                  placeholder="Explain how you arrived at this asking price"
                  className="mt-1"
                  rows={3}
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Reason for Selling */}
        <div>
          <Label htmlFor="businessDetails.sale.reasonForSelling" className="font-medium text-gray-700">
            Reason for Selling <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="businessDetails.sale.reasonForSelling"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="businessDetails.sale.reasonForSelling"
                placeholder="Explain why you are selling this business"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
          {errors.businessDetails?.sale?.reasonForSelling && (
            <p className="text-red-500 text-sm mt-1">
              {errors.businessDetails.sale.reasonForSelling.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Note: Being honest about your reasons for selling builds trust with potential buyers.
          </p>
        </div>
        
        {/* Seller Financing */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Seller Financing</h3>
            <Controller
              name="businessDetails.sale.sellerFinancing.isAvailable"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watch('businessDetails.sale.sellerFinancing.isAvailable') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessDetails.sale.sellerFinancing.downPaymentPercentage" className="font-medium text-gray-700">
                    Down Payment (%)
                  </Label>
                  <Controller
                    name="businessDetails.sale.sellerFinancing.downPaymentPercentage"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="businessDetails.sale.sellerFinancing.downPaymentPercentage"
                        type="number"
                        placeholder="e.g., 25"
                        className="mt-1"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessDetails.sale.sellerFinancing.interestRate" className="font-medium text-gray-700">
                    Interest Rate (%)
                  </Label>
                  <Controller
                    name="businessDetails.sale.sellerFinancing.interestRate"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="businessDetails.sale.sellerFinancing.interestRate"
                        type="number"
                        placeholder="e.g., 8"
                        className="mt-1"
                        min={0}
                        max={100}
                        step={0.1}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDetails.sale.sellerFinancing.terms" className="font-medium text-gray-700">
                  Financing Terms
                </Label>
                <Controller
                  name="businessDetails.sale.sellerFinancing.terms"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.sale.sellerFinancing.terms"
                      placeholder="Describe your seller financing terms (e.g., payment schedule, duration, conditions)"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Training & Support */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Training & Support</h3>
            <Controller
              name="businessDetails.sale.trainingAndSupport.isSupportIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watch('businessDetails.sale.trainingAndSupport.isSupportIncluded') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessDetails.sale.trainingAndSupport.trainingPeriod" className="font-medium text-gray-700">
                    Training Period
                  </Label>
                  <Controller
                    name="businessDetails.sale.trainingAndSupport.trainingPeriod"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="businessDetails.sale.trainingAndSupport.trainingPeriod"
                        placeholder="e.g., 1 month, 2 weeks"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessDetails.sale.trainingAndSupport.trainingLocation" className="font-medium text-gray-700">
                    Training Location
                  </Label>
                  <Controller
                    name="businessDetails.sale.trainingAndSupport.trainingLocation"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="businessDetails.sale.trainingAndSupport.trainingLocation"
                        placeholder="e.g., On-site, Remote, Hybrid"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDetails.sale.trainingAndSupport.supportDetails" className="font-medium text-gray-700">
                  Support Details
                </Label>
                <Controller
                  name="businessDetails.sale.trainingAndSupport.supportDetails"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.sale.trainingAndSupport.supportDetails"
                      placeholder="Describe the training and support you will provide to the buyer"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Non-Compete Agreement */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Non-Compete Agreement</h3>
            <Controller
              name="businessDetails.sale.nonCompete.isIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watch('businessDetails.sale.nonCompete.isIncluded') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessDetails.sale.nonCompete.duration" className="font-medium text-gray-700">
                  Duration
                </Label>
                <Controller
                  name="businessDetails.sale.nonCompete.duration"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="businessDetails.sale.nonCompete.duration"
                      placeholder="e.g., 2 years"
                      className="mt-1"
                      {...field}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="businessDetails.sale.nonCompete.geographicScope" className="font-medium text-gray-700">
                  Geographic Scope
                </Label>
                <Controller
                  name="businessDetails.sale.nonCompete.geographicScope"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="businessDetails.sale.nonCompete.geographicScope"
                      placeholder="e.g., 10 km radius, Entire city"
                      className="mt-1"
                      {...field}
                    />
                  )}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="businessDetails.sale.nonCompete.terms" className="font-medium text-gray-700">
                  Terms
                </Label>
                <Controller
                  name="businessDetails.sale.nonCompete.terms"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.sale.nonCompete.terms"
                      placeholder="Describe the non-compete terms"
                      className="mt-1"
                      rows={2}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssetsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Assets & Inventory</h2>
            <p className="text-gray-500 text-sm">Provide details about the assets included in the sale</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Assets & Inventory Help", 
                "Be detailed and transparent about the assets included in the sale. This section helps buyers understand the tangible and intangible value they're receiving. Include equipment, inventory, intellectual property, real estate, and digital assets where applicable."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Inventory */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Inventory</h3>
            <Controller
              name="businessDetails.assets.inventory.isIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watchAssetsIncluded.inventory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessDetails.assets.inventory.value.value" className="font-medium text-gray-700">
                  Inventory Value (₹)
                </Label>
                <Controller
                  name="businessDetails.assets.inventory.value.value"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="businessDetails.assets.inventory.value.value"
                      type="number"
                      placeholder="Enter inventory value in INR"
                      className="mt-1"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="businessDetails.assets.inventory.description" className="font-medium text-gray-700">
                  Inventory Description
                </Label>
                <Controller
                  name="businessDetails.assets.inventory.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.assets.inventory.description"
                      placeholder="Describe the inventory included in the sale"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Equipment */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Equipment & Fixtures</h3>
            <Controller
              name="businessDetails.assets.equipment.isIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watchAssetsIncluded.equipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessDetails.assets.equipment.value.value" className="font-medium text-gray-700">
                    Equipment Value (₹)
                  </Label>
                  <Controller
                    name="businessDetails.assets.equipment.value.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="businessDetails.assets.equipment.value.value"
                        type="number"
                        placeholder="Enter equipment value in INR"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessDetails.assets.equipment.condition" className="font-medium text-gray-700">
                    Overall Condition
                  </Label>
                  <Controller
                    name="businessDetails.assets.equipment.condition"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDetails.assets.equipment.description" className="font-medium text-gray-700">
                  Equipment Description
                </Label>
                <Controller
                  name="businessDetails.assets.equipment.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.assets.equipment.description"
                      placeholder="Describe the key equipment, machinery, and fixtures included"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Intellectual Property */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Intellectual Property</h3>
            <Controller
              name="businessDetails.assets.intellectualProperty.isIncluded"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watchAssetsIncluded.intellectualProperty && (
            <div className="space-y-4">
              <div>
                <Label className="font-medium text-gray-700">
                  IP Types
                </Label>
                <Controller
                  name="businessDetails.assets.intellectualProperty.types"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {["Patents", "Trademarks", "Copyrights", "Trade Secrets", "Software", "Recipes/Formulas", "Domain Names", "Proprietary Processes"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ip-${type}`}
                            checked={field.value?.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), type]);
                              } else {
                                field.onChange(field.value?.filter(t => t !== type) || []);
                              }
                            }}
                          />
                          <Label htmlFor={`ip-${type}`} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="businessDetails.assets.intellectualProperty.description" className="font-medium text-gray-700">
                  IP Description
                </Label>
                <Controller
                  name="businessDetails.assets.intellectualProperty.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.assets.intellectualProperty.description"
                      placeholder="Describe the intellectual property included in the sale"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Real Estate */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Real Estate</h3>
            <Controller
              name="businessDetails.assets.realEstate.isIncluded"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watchAssetsIncluded.realEstate && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="businessDetails.assets.realEstate.isOwned"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <Checkbox
                        id="isOwned"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            // If owned is checked, leased should be unchecked
                            setValue('businessDetails.assets.realEstate.isLeased', false);
                          }
                        }}
                      />
                    )}
                  />
                  <Label htmlFor="isOwned" className="text-sm">
                    Owned
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="businessDetails.assets.realEstate.isLeased"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <Checkbox
                        id="isLeased"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            // If leased is checked, owned should be unchecked
                            setValue('businessDetails.assets.realEstate.isOwned', false);
                          }
                        }}
                      />
                    )}
                  />
                  <Label htmlFor="isLeased" className="text-sm">
                    Leased
                  </Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDetails.assets.realEstate.details" className="font-medium text-gray-700">
                  Property Details
                </Label>
                <Controller
                  name="businessDetails.assets.realEstate.details"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.assets.realEstate.details"
                      placeholder="Describe the property included or available for lease transfer"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
              
              {watch('businessDetails.assets.realEstate.isLeased') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessDetails.assets.realEstate.lease.expiryDate" className="font-medium text-gray-700">
                        Lease Expiry Date
                      </Label>
                      <Controller
                        name="businessDetails.assets.realEstate.lease.expiryDate"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="businessDetails.assets.realEstate.lease.expiryDate"
                            type="date"
                            className="mt-1"
                            min={new Date().toISOString().split('T')[0]}
                            {...field}
                            value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                          />
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="businessDetails.assets.realEstate.lease.monthlyRent.value" className="font-medium text-gray-700">
                        Monthly Rent (₹)
                      </Label>
                      <Controller
                        name="businessDetails.assets.realEstate.lease.monthlyRent.value"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="businessDetails.assets.realEstate.lease.monthlyRent.value"
                            type="number"
                            placeholder="Enter monthly rent in INR"
                            className="mt-1"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="businessDetails.assets.realEstate.lease.isTransferable"
                      control={control}
                      defaultValue={true}
                      render={({ field }) => (
                        <Checkbox
                          id="isTransferable"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isTransferable" className="text-sm">
                      Lease is transferable to new owner
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Digital Assets */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Digital Assets</h3>
            <Controller
              name="businessDetails.assets.digitalAssets.isIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          
          {watch('businessDetails.assets.digitalAssets.isIncluded') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="businessDetails.assets.digitalAssets.hasWebsite"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <Checkbox
                        id="hasWebsite"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasWebsite" className="text-sm">
                    Website
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="businessDetails.assets.digitalAssets.hasSocialMediaAccounts"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <Checkbox
                        id="hasSocialMediaAccounts"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasSocialMediaAccounts" className="text-sm">
                    Social Media
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="businessDetails.assets.digitalAssets.hasCustomerDatabase"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <Checkbox
                        id="hasCustomerDatabase"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasCustomerDatabase" className="text-sm">
                    Customer Database
                  </Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDetails.assets.digitalAssets.description" className="font-medium text-gray-700">
                  Digital Assets Description
                </Label>
                <Controller
                  name="businessDetails.assets.digitalAssets.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="businessDetails.assets.digitalAssets.description"
                      placeholder="Describe the digital assets included in the sale (website, social media accounts, email lists, software, etc.)"
                      className="mt-1"
                      rows={3}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Key Assets */}
        <div>
          <Label className="font-medium text-gray-700">
            Key Assets
          </Label>
          <Controller
            name="businessDetails.assets.keyAssets"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add key assets and press Enter (e.g., Specialized Equipment, Prime Location)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            List the most valuable assets included in the sale.
          </p>
        </div>
      </div>
    );
  };

  const renderOperationsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Operations</h2>
            <p className="text-gray-500 text-sm">Provide details about how the business operates</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Operations Help", 
                "This section focuses on the day-to-day operations of your business. Potential buyers want to understand staffing, business hours, locations, and other operational aspects to assess how smoothly the business runs and what changes they might need to make."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Employees */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Employees</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="businessDetails.operations.employees.count" className="font-medium text-gray-700">
                Total Employees
              </Label>
              <Controller
                name="businessDetails.operations.employees.count"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.operations.employees.count"
                    type="number"
                    placeholder="Enter total number of employees"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="businessDetails.operations.employees.fullTime" className="font-medium text-gray-700">
                Full-Time
              </Label>
              <Controller
                name="businessDetails.operations.employees.fullTime"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.operations.employees.fullTime"
                    type="number"
                    placeholder="Enter number of full-time employees"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="businessDetails.operations.employees.partTime" className="font-medium text-gray-700">
                Part-Time
              </Label>
              <Controller
                name="businessDetails.operations.employees.partTime"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="businessDetails.operations.employees.partTime"
                    type="number"
                    placeholder="Enter number of part-time employees"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Business Hours */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Business Hours</h3>
          
          <div className="space-y-3">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-28">
                  <Label className="font-medium text-gray-700 capitalize">
                    {day}
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name={`businessDetails.operations.businessHours.${day}.isClosed`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id={`${day}Closed`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor={`${day}Closed`} className="text-sm">
                    Closed
                  </Label>
                </div>
                
                {!watch(`businessDetails.operations.businessHours.${day}.isClosed`) && (
                  <div className="flex items-center space-x-2">
                    <Controller
                      name={`businessDetails.operations.businessHours.${day}.open`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`${day}Open`}
                          type="time"
                          className="w-32"
                          {...field}
                        />
                      )}
                    />
                    <span>to</span>
                    <Controller
                      name={`businessDetails.operations.businessHours.${day}.close`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`${day}Close`}
                          type="time"
                          className="w-32"
                          {...field}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Service Areas */}
        <div>
          <Label className="font-medium text-gray-700">
            Service Areas
          </Label>
          <Controller
            name="businessDetails.operations.serviceAreas"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add service areas and press Enter (e.g., North Mumbai, South Delhi)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            List the areas where your business provides services or delivers products.
          </p>
        </div>
        
        {/* Seasonality */}
        <div>
          <Label htmlFor="businessDetails.operations.seasonality" className="font-medium text-gray-700">
            Seasonality
          </Label>
          <Controller
            name="businessDetails.operations.seasonality"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select seasonality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year_round">Year-round consistent business</SelectItem>
                  <SelectItem value="seasonal_peaks">Seasonal peaks (e.g., holiday season)</SelectItem>
                  <SelectItem value="summer_peak">Summer peak season</SelectItem>
                  <SelectItem value="winter_peak">Winter peak season</SelectItem>
                  <SelectItem value="festival_peak">Festival/event-based peaks</SelectItem>
                  <SelectItem value="highly_seasonal">Highly seasonal business</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    );
  };

  const renderContactSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Contact Information</h2>
            <p className="text-gray-500 text-sm">Provide contact details for potential buyers to reach you</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Contact Information Help", 
                "Make sure your contact information is accurate and up-to-date. This is how potential buyers will reach you. Include multiple contact methods to make it easy for interested parties to connect with you in their preferred way."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <Label htmlFor="contactInfo.email" className="font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="contactInfo.email"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.email"
                  type="email"
                  placeholder="Enter contact email"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.contactInfo?.email && (
              <p className="text-red-500 text-sm mt-1">{errors.contactInfo.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="contactInfo.phone" className="font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="contactInfo.phone"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.phone"
                  type="tel"
                  placeholder="Enter contact phone"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.contactInfo?.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.contactInfo.phone.message}</p>
            )}
          </div>

          {/* Alternate Phone */}
          <div>
            <Label htmlFor="contactInfo.alternatePhone" className="font-medium text-gray-700">
              Alternate Phone
            </Label>
            <Controller
              name="contactInfo.alternatePhone"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.alternatePhone"
                  type="tel"
                  placeholder="Enter alternate phone (optional)"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="contactInfo.website" className="font-medium text-gray-700">
              Website
            </Label>
            <Controller
              name="contactInfo.website"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.website"
                  type="url"
                  placeholder="Enter website URL"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>

          {/* Contact Name */}
          <div>
            <Label htmlFor="contactInfo.contactName" className="font-medium text-gray-700">
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="contactInfo.contactName"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.contactName"
                  placeholder="Enter name of contact person"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {errors.contactInfo?.contactName && (
              <p className="text-red-500 text-sm mt-1">{errors.contactInfo.contactName.message}</p>
            )}
          </div>

          {/* Designation */}
          <div>
            <Label htmlFor="contactInfo.designation" className="font-medium text-gray-700">
              Designation
            </Label>
            <Controller
              name="contactInfo.designation"
              control={control}
              render={({ field }) => (
                <Input 
                  id="contactInfo.designation"
                  placeholder="Enter designation (e.g., Owner, Manager)"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Preferred Contact Method */}
        <div>
          <Label htmlFor="contactInfo.preferredContactMethod" className="font-medium text-gray-700">
            Preferred Contact Method
          </Label>
          <Controller
            name="contactInfo.preferredContactMethod"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select preferred contact method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="platform_messages">Platform Messages</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        
        {/* Available Hours */}
        <div>
          <Label htmlFor="contactInfo.availableHours" className="font-medium text-gray-700">
            Best Time to Contact
          </Label>
          <Controller
            name="contactInfo.availableHours"
            control={control}
            render={({ field }) => (
              <Input 
                id="contactInfo.availableHours"
                placeholder="e.g., Mon-Fri, 10 AM to 6 PM"
                className="mt-1"
                {...field}
              />
            )}
          />
        </div>
        
        {/* Social Media */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Social Media (Optional)</h3>
          
          <div className="space-y-4">
            {/* Facebook */}
            <div className="flex items-center space-x-4">
              <Facebook className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Controller
                  name="contactInfo.socialMedia.facebook.handle"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      placeholder="Facebook Page or Profile Name"
                      {...field}
                    />
                  )}
                />
              </div>
              <Controller
                name="contactInfo.socialMedia.facebook.isVerified"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="facebookVerified"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="facebookVerified" className="text-xs">
                      Verified
                    </Label>
                  </div>
                )}
              />
            </div>
            
            {/* Twitter/X */}
            <div className="flex items-center space-x-4">
              <Twitter className="h-5 w-5 text-blue-400" />
              <div className="flex-1">
                <Controller
                  name="contactInfo.socialMedia.twitter.handle"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      placeholder="Twitter/X Username (@handle)"
                      {...field}
                    />
                  )}
                />
              </div>
              <Controller
                name="contactInfo.socialMedia.twitter.isVerified"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="twitterVerified"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="twitterVerified" className="text-xs">
                      Verified
                    </Label>
                  </div>
                )}
              />
            </div>
            
            {/* Instagram */}
            <div className="flex items-center space-x-4">
              <Instagram className="h-5 w-5 text-pink-600" />
              <div className="flex-1">
                <Controller
                  name="contactInfo.socialMedia.instagram.handle"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      placeholder="Instagram Username (@handle)"
                      {...field}
                    />
                  )}
                />
              </div>
              <Controller
                name="contactInfo.socialMedia.instagram.isVerified"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="instagramVerified"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="instagramVerified" className="text-xs">
                      Verified
                    </Label>
                  </div>
                )}
              />
            </div>
            
            {/* LinkedIn */}
            <div className="flex items-center space-x-4">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <div className="flex-1">
                <Controller
                  name="contactInfo.socialMedia.linkedin.handle"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      placeholder="LinkedIn Profile Name or Company Page"
                      {...field}
                    />
                  )}
                />
              </div>
              <Controller
                name="contactInfo.socialMedia.linkedin.isVerified"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="linkedinVerified"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="linkedinVerified" className="text-xs">
                      Verified
                    </Label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Contact Privacy Note */}
        <div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Privacy Notice</AlertTitle>
            <AlertDescription>
              For your privacy, email and phone will only be shown to registered and verified users. Select which contact methods you prefer buyers to use.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  const renderMediaSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Media & Documents</h2>
            <p className="text-gray-500 text-sm">Upload photos, videos, and documents for your listing</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Media & Documents Help", 
                "High-quality visuals significantly increase buyer interest. Upload clear photos that showcase your business in the best light. Include images of your premises, equipment, products, and any other relevant aspects. Documents can include business plans, financial statements, and other supporting materials."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Featured Image */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Featured Image</h3>
          <p className="text-sm text-gray-500">
            This will be the main image displayed for your listing. Choose a high-quality, representative image.
          </p>
          
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2">
            {fileUploads.featuredImage || watch('media.featuredImage.url') ? (
              <div className="text-center">
                <div className="relative inline-block">
                  <img 
                    src={fileUploads.featuredImage ? URL.createObjectURL(fileUploads.featuredImage) : watch('media.featuredImage.url')}
                    alt="Featured preview" 
                    className="max-h-48 rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      setFileUploads(prev => ({ ...prev, featuredImage: null }));
                      setValue('media.featuredImage.url', '', { shouldDirty: true });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm mt-2">
                  {fileUploads.featuredImage?.name || 'Current featured image'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Label htmlFor="featuredImage" className="cursor-pointer">
                    <span className="text-primary font-medium">Click to upload</span>
                    <span className="text-gray-500"> or drag and drop</span>
                    <input 
                      id="featuredImage" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'featuredImage')}
                    />
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, or JPEG (max. 5MB)
                </p>
              </div>
            )}
          </div>
          
          {watch('media.featuredImage.url') && !fileUploads.featuredImage && (
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Image className="h-4 w-4 text-gray-500" />
              <p>Using existing image</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="media.featuredImage.alt" className="font-medium text-gray-700">
              Image Alt Text (for accessibility)
            </Label>
            <Controller
              name="media.featuredImage.alt"
              control={control}
              render={({ field }) => (
                <Input 
                  id="media.featuredImage.alt"
                  placeholder="Describe what's in the image"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Gallery Images */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Gallery Images</h3>
            <Label htmlFor="galleryImages" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-2 rounded-md text-xs font-medium">
              Add Images
              <input 
                id="galleryImages" 
                type="file" 
                className="sr-only" 
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, 'galleryImages')}
              />
            </Label>
          </div>
          
          <p className="text-sm text-gray-500">
            Upload additional images to showcase different aspects of your business.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {fileUploads.galleryImages.length > 0 && fileUploads.galleryImages.map((file, index) => (
              <div key={index} className="relative">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Gallery image ${index + 1}`} 
                  className="h-24 w-full object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    const newFiles = [...fileUploads.galleryImages];
                    newFiles.splice(index, 1);
                    setFileUploads(prev => ({ ...prev, galleryImages: newFiles }));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {galleryFields.map((field, index) => (
              <div key={field.id} className="relative">
                <img 
                  src={field.url} 
                  alt={field.alt || `Gallery image ${index + 1}`} 
                  className="h-24 w-full object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => removeGallery(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {fileUploads.galleryImages.length === 0 && galleryFields.length === 0 && (
              <div className="col-span-4 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500 text-sm">No gallery images yet. Add some to enhance your listing.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Documents */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Business Documents</h3>
            <Label htmlFor="documents" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-2 rounded-md text-xs font-medium">
              Add Documents
              <input 
                id="documents" 
                type="file" 
                className="sr-only" 
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={(e) => handleFileUpload(e, 'documents')}
              />
            </Label>
          </div>
          
          <p className="text-sm text-gray-500">
            Upload relevant business documents (business plan, financial statements, etc.)
          </p>
          
          <div className="space-y-2 mt-2">
            {fileUploads.documents.length > 0 && fileUploads.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between border p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <File className="h-5 w-5 text-blue-500" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newFiles = [...fileUploads.documents];
                    newFiles.splice(index, 1);
                    setFileUploads(prev => ({ ...prev, documents: newFiles }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {documentFields.map((field, index) => (
              <div key={field.id} className="flex items-center justify-between border p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <File className="h-5 w-5 text-blue-500" />
                  <span className="text-sm truncate max-w-[200px]">{field.name}</span>
                  <span className="text-xs text-gray-500">
                    ({field.type})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDocument(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {fileUploads.documents.length === 0 && documentFields.length === 0 && (
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
                <p className="text-gray-500 text-sm">No documents yet. Add relevant business documents for potential buyers.</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="documentPrivacy"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="documentPrivacy"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="documentPrivacy" className="text-sm">
              Some documents contain confidential information and should only be shared with serious buyers
            </Label>
          </div>
        </div>
        
        {/* SEO Information */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">SEO Information (Optional)</h3>
          <p className="text-sm text-gray-500">
            Optimize your listing for search engines
          </p>
          
          <div>
            <Label htmlFor="seo.title" className="font-medium text-gray-700">
              SEO Title
            </Label>
            <Controller
              name="seo.title"
              control={control}
              render={({ field }) => (
                <Input 
                  id="seo.title"
                  placeholder="Enter SEO-friendly title"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="seo.description" className="font-medium text-gray-700">
              Meta Description
            </Label>
            <Controller
              name="seo.description"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="seo.description"
                  placeholder="Enter meta description (150-160 characters for best results)"
                  className="mt-1"
                  rows={3}
                  maxLength={160}
                  {...field}
                />
              )}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">
                {watch('seo.description')?.length || 0}/160 characters
              </span>
            </div>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Keywords
            </Label>
            <Controller
              name="seo.keywords"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add keywords and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderInvestmentSection = () => {
    if (listingType === LISTING_TYPES.FRANCHISE) {
      return renderFranchiseInvestmentSection();
    } else if (listingType === LISTING_TYPES.INVESTOR) {
      return renderInvestorInvestmentSection();
    } else {
      return <p>Unsupported listing type for investment section</p>;
    }
  };

  const renderFranchiseInvestmentSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Investment Details</h2>
            <p className="text-gray-500 text-sm">Provide information about the investment required for this franchise</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Franchise Investment Help", 
                "Be clear and transparent about all costs involved in acquiring and operating your franchise. This builds trust with potential franchisees and helps them assess if the opportunity fits their budget and expected returns."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Investment Range */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Investment Range</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.investment.investmentRange.min.value" className="font-medium text-gray-700">
                Minimum Investment (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="franchiseDetails.investment.investmentRange.min.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.investmentRange.min.value"
                    type="number"
                    placeholder="Enter minimum investment amount"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.franchiseDetails?.investment?.investmentRange?.min?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.franchiseDetails.investment.investmentRange.min.value.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.investment.investmentRange.max.value" className="font-medium text-gray-700">
                Maximum Investment (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="franchiseDetails.investment.investmentRange.max.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.investmentRange.max.value"
                    type="number"
                    placeholder="Enter maximum investment amount"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.franchiseDetails?.investment?.investmentRange?.max?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.franchiseDetails.investment.investmentRange.max.value.message}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Franchise Fee */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Franchise Fee</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.investment.franchiseFee.value" className="font-medium text-gray-700">
                Franchise Fee (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="franchiseDetails.investment.franchiseFee.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.franchiseFee.value"
                    type="number"
                    placeholder="Enter franchise fee"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.franchiseDetails?.investment?.franchiseFee?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.franchiseDetails.investment.franchiseFee.value.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <Controller
                name="franchiseDetails.investment.franchiseFee.isRefundable"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="feeRefundable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="feeRefundable" className="text-sm">
                Fee is partially or fully refundable
              </Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.investment.franchiseFee.paymentTerms" className="font-medium text-gray-700">
              Payment Terms
            </Label>
            <Controller
              name="franchiseDetails.investment.franchiseFee.paymentTerms"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.investment.franchiseFee.paymentTerms"
                  placeholder="e.g., Full payment upfront, 50% upfront and 50% on signing"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Royalty Fee */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Royalty Fee</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.investment.royaltyFee.percentage" className="font-medium text-gray-700">
                Royalty Fee (%)
              </Label>
              <Controller
                name="franchiseDetails.investment.royaltyFee.percentage"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.royaltyFee.percentage"
                    type="number"
                    placeholder="Enter royalty percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.investment.royaltyFee.frequency" className="font-medium text-gray-700">
                Frequency
              </Label>
              <Controller
                name="franchiseDetails.investment.royaltyFee.frequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.investment.royaltyFee.structure" className="font-medium text-gray-700">
              Structure/Calculation
            </Label>
            <Controller
              name="franchiseDetails.investment.royaltyFee.structure"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.investment.royaltyFee.structure"
                  placeholder="e.g., Percentage of gross sales, Fixed monthly fee"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Marketing Fee */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Marketing/Advertising Fee</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.investment.marketingFee.percentage" className="font-medium text-gray-700">
                Marketing Fee (%)
              </Label>
              <Controller
                name="franchiseDetails.investment.marketingFee.percentage"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.marketingFee.percentage"
                    type="number"
                    placeholder="Enter marketing fee percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.investment.marketingFee.utilization" className="font-medium text-gray-700">
                Utilization
              </Label>
              <Controller
                name="franchiseDetails.investment.marketingFee.utilization"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.investment.marketingFee.utilization"
                    placeholder="e.g., National advertising, Local marketing"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Estimated Total Investment */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Estimated Total Investment</h3>
          
          <div>
            <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.value" className="font-medium text-gray-700">
              Total Investment (₹)
            </Label>
            <Controller
              name="franchiseDetails.investment.estimatedTotalInvestment.value"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.investment.estimatedTotalInvestment.value"
                  type="number"
                  placeholder="Enter estimated total investment"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Investment Breakdown</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.initialFranchiseFee.value" className="text-xs text-gray-600">
                    Initial Franchise Fee
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.initialFranchiseFee.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.initialFranchiseFee.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.equipment.value" className="text-xs text-gray-600">
                    Equipment & Fixtures
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.equipment.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.equipment.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.inventory.value" className="text-xs text-gray-600">
                    Initial Inventory
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.inventory.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.inventory.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.leasehold.value" className="text-xs text-gray-600">
                    Leasehold Improvements
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.leasehold.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.leasehold.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.workingCapital.value" className="text-xs text-gray-600">
                    Working Capital
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.workingCapital.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.workingCapital.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="franchiseDetails.investment.estimatedTotalInvestment.breakdown.other.value" className="text-xs text-gray-600">
                    Other Expenses
                  </Label>
                  <Controller
                    name="franchiseDetails.investment.estimatedTotalInvestment.breakdown.other.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.investment.estimatedTotalInvestment.breakdown.other.value"
                        type="number"
                        placeholder="Amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Working Capital */}
        <div>
          <Label htmlFor="franchiseDetails.investment.workingCapitalRequirement.value" className="font-medium text-gray-700">
            Working Capital Requirement (₹)
          </Label>
          <Controller
            name="franchiseDetails.investment.workingCapitalRequirement.value"
            control={control}
            render={({ field }) => (
              <Input 
                id="franchiseDetails.investment.workingCapitalRequirement.value"
                type="number"
                placeholder="Enter working capital needed"
                className="mt-1"
                min={0}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            The amount of cash needed to cover operating expenses until the business becomes profitable.
          </p>
        </div>
        
        {/* Financing Options */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Financing Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.investment.hasFranchisorFinancing"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="hasFranchisorFinancing"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="hasFranchisorFinancing" className="text-sm">
                Franchisor financing available
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.investment.hasThirdPartyFinancing"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="hasThirdPartyFinancing"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="hasThirdPartyFinancing" className="text-sm">
                Third-party financing relationships
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.investment.hasDiscountsForSpecificGroups"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="hasDiscountsForSpecificGroups"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="hasDiscountsForSpecificGroups" className="text-sm">
                Discounts for veterans/specific groups
              </Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.investment.financingDetails" className="font-medium text-gray-700">
              Financing Details
            </Label>
            <Controller
              name="franchiseDetails.investment.financingDetails"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="franchiseDetails.investment.financingDetails"
                  placeholder="Describe available financing options"
                  className="mt-1"
                  rows={3}
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderInvestorInvestmentSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Investment Criteria</h2>
            <p className="text-gray-500 text-sm">Provide details about your investment approach and requirements</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Investment Criteria Help", 
                "Clear investment criteria help founders and business owners understand if their venture matches your requirements. Be specific about your investment size, stage preferences, and expected returns to attract suitable opportunities."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Investment Capacity */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Investment Capacity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="investorDetails.investment.capacity.minInvestment.value" className="font-medium text-gray-700">
                Minimum Investment (₹) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="investorDetails.investment.capacity.minInvestment.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.investment.capacity.minInvestment.value"
                    type="number"
                    placeholder="Enter minimum investment amount"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.investorDetails?.investment?.capacity?.minInvestment?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.investorDetails.investment.capacity.minInvestment.value.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="investorDetails.investment.capacity.maxInvestment.value" className="font-medium text-gray-700">
                Maximum Investment (₹)
              </Label>
              <Controller
                name="investorDetails.investment.capacity.maxInvestment.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.investment.capacity.maxInvestment.value"
                    type="number"
                    placeholder="Enter maximum investment amount"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="investorDetails.investment.capacity.totalFundsAvailable.value" className="font-medium text-gray-700">
              Total Funds Available (₹)
            </Label>
            <Controller
              name="investorDetails.investment.capacity.totalFundsAvailable.value"
              control={control}
              render={({ field }) => (
                <Input 
                  id="investorDetails.investment.capacity.totalFundsAvailable.value"
                  type="number"
                  placeholder="Enter total funds available for investment"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
          </div>
        </div>
        
        {/* Investment Preferences */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Investment Preferences</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Typical Investment Rounds
            </Label>
            <Controller
              name="investorDetails.investment.preferences.typicalRounds"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Pre-IPO", "Buyout", "Debt", "Acquisition"].map((round) => (
                    <div key={round} className="flex items-center space-x-2">
                      <Checkbox
                        id={`round-${round}`}
                        checked={field.value?.includes(round)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), round]);
                          } else {
                            field.onChange(field.value?.filter(r => r !== round) || []);
                          }
                        }}
                      />
                      <Label htmlFor={`round-${round}`} className="text-sm">
                        {round}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="investorDetails.investment.preferences.isLeadInvestor"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="isLeadInvestor"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isLeadInvestor" className="text-sm">
              Willing to be a lead investor
            </Label>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Preferred Stake (%)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <div>
                <Label htmlFor="investorDetails.investment.preferences.stakeSought.min" className="text-xs text-gray-600">
                  Minimum Stake
                </Label>
                <Controller
                  name="investorDetails.investment.preferences.stakeSought.min"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="investorDetails.investment.preferences.stakeSought.min"
                      type="number"
                      placeholder="Min %"
                      className="mt-1"
                      min={0}
                      max={100}
                      step={0.1}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="investorDetails.investment.preferences.stakeSought.max" className="text-xs text-gray-600">
                  Maximum Stake
                </Label>
                <Controller
                  name="investorDetails.investment.preferences.stakeSought.max"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="investorDetails.investment.preferences.stakeSought.max"
                      type="number"
                      placeholder="Max %"
                      className="mt-1"
                      min={0}
                      max={100}
                      step={0.1}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="investorDetails.investment.preferences.stakeSought.isControlling"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="isControllingStake"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isControllingStake" className="text-sm">
              Seeking controlling stake
            </Label>
          </div>
          
          <div>
            <Label htmlFor="investorDetails.investment.preferences.stakeSought.preferredStructure" className="font-medium text-gray-700">
              Preferred Investment Structure
            </Label>
            <Controller
              name="investorDetails.investment.preferences.stakeSought.preferredStructure"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="convertible_note">Convertible Note</SelectItem>
                    <SelectItem value="safe">SAFE</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                    <SelectItem value="revenue_share">Revenue Share</SelectItem>
                    <SelectItem value="hybrid">Hybrid Structure</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        
        {/* Investment Timeline & Exit Strategy */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Timeline & Exit</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="investorDetails.investment.timing.investmentTimeline" className="font-medium text-gray-700">
                Investment Timeline
              </Label>
              <Controller
                name="investorDetails.investment.timing.investmentTimeline"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.investment.timing.investmentTimeline"
                    placeholder="e.g., 30-60 days"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.investment.timing.holdingPeriod" className="font-medium text-gray-700">
                Expected Holding Period
              </Label>
              <Controller
                name="investorDetails.investment.timing.holdingPeriod"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.investment.timing.holdingPeriod"
                    placeholder="e.g., 3-5 years"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Preferred Exit Strategies
            </Label>
            <Controller
              name="investorDetails.investment.timing.exitStrategy"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["IPO", "Acquisition", "Secondary Sale", "Management Buyout", "Strategic Merger", "Private Equity Sale"].map((strategy) => (
                    <div key={strategy} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exit-${strategy}`}
                        checked={field.value?.includes(strategy)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), strategy]);
                          } else {
                            field.onChange(field.value?.filter(s => s !== strategy) || []);
                          }
                        }}
                      />
                      <Label htmlFor={`exit-${strategy}`} className="text-sm">
                        {strategy}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Expected Returns */}
        <div>
          <Label htmlFor="investorDetails.investment.expectedReturns" className="font-medium text-gray-700">
            Expected Returns
          </Label>
          <Controller
            name="investorDetails.investment.expectedReturns"
            control={control}
            render={({ field }) => (
              <Input 
                id="investorDetails.investment.expectedReturns"
                placeholder="e.g., 3-5x ROI in 5 years"
                className="mt-1"
                {...field}
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your expected returns on investment, including multiples and timeframes.
          </p>
        </div>
      </div>
    );
  };

  const renderTermsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Terms & Conditions</h2>
            <p className="text-gray-500 text-sm">Provide details about the franchise agreement terms</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Terms & Conditions Help", 
                "Clear terms and conditions set expectations for franchisees. Providing transparent information about contract duration, renewal options, territory rights, and other key terms helps attract serious franchisees who are aligned with your business model."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Contract Duration */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Contract Duration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.terms.contractDuration.years" className="font-medium text-gray-700">
                Term Length (Years) <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="franchiseDetails.terms.contractDuration.years"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.terms.contractDuration.years"
                    type="number"
                    placeholder="Enter contract term in years"
                    className="mt-1"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.franchiseDetails?.terms?.contractDuration?.years && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.franchiseDetails.terms.contractDuration.years.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <Controller
                name="franchiseDetails.terms.contractDuration.hasRenewalOption"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="hasRenewalOption"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="hasRenewalOption" className="text-sm">
                Has renewal option
              </Label>
            </div>
          </div>
        </div>
        
        {/* Renewal Terms */}
        {watch('franchiseDetails.terms.contractDuration.hasRenewalOption') && (
          <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-medium text-gray-700">Renewal Terms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="franchiseDetails.terms.renewalTerms.fee.value" className="font-medium text-gray-700">
                  Renewal Fee (₹)
                </Label>
                <Controller
                  name="franchiseDetails.terms.renewalTerms.fee.value"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="franchiseDetails.terms.renewalTerms.fee.value"
                      type="number"
                      placeholder="Enter renewal fee"
                      className="mt-1"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="franchiseDetails.terms.renewalTerms.renewalPeriod" className="font-medium text-gray-700">
                  Renewal Period (Years)
                </Label>
                <Controller
                  name="franchiseDetails.terms.renewalTerms.renewalPeriod"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="franchiseDetails.terms.renewalTerms.renewalPeriod"
                      type="number"
                      placeholder="Enter renewal period in years"
                      className="mt-1"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.terms.renewalTerms.conditions" className="font-medium text-gray-700">
                Renewal Conditions
              </Label>
              <Controller
                name="franchiseDetails.terms.renewalTerms.conditions"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="franchiseDetails.terms.renewalTerms.conditions"
                    placeholder="Describe conditions for renewal (e.g., good standing, updated equipment, etc.)"
                    className="mt-1"
                    rows={2}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        )}
        
        {/* Territory Rights */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Territory Rights</h3>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="franchiseDetails.terms.territoryRights.isExclusive"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="isExclusive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isExclusive" className="text-sm">
              Exclusive territory rights
            </Label>
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.terms.territoryRights.protectionRadius" className="font-medium text-gray-700">
              Protection Radius/Area
            </Label>
            <Controller
              name="franchiseDetails.terms.territoryRights.protectionRadius"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.terms.territoryRights.protectionRadius"
                  placeholder="e.g., 5 km radius, Specific district/area"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.terms.territoryRights.expansionOptions" className="font-medium text-gray-700">
              Expansion Options
            </Label>
            <Controller
              name="franchiseDetails.terms.territoryRights.expansionOptions"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.terms.territoryRights.expansionOptions"
                  placeholder="e.g., First right of refusal for adjacent territories"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Space Requirements */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Space Requirements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.terms.spaceRequirement.minArea" className="font-medium text-gray-700">
                Minimum Area
              </Label>
              <Controller
                name="franchiseDetails.terms.spaceRequirement.minArea"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.terms.spaceRequirement.minArea"
                    placeholder="e.g., 500 sq ft"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.terms.spaceRequirement.maxArea" className="font-medium text-gray-700">
                Maximum Area
              </Label>
              <Controller
                name="franchiseDetails.terms.spaceRequirement.maxArea"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.terms.spaceRequirement.maxArea"
                    placeholder="e.g., 1500 sq ft"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.terms.spaceRequirement.location" className="font-medium text-gray-700">
              Preferred Location Type
            </Label>
            <Controller
              name="franchiseDetails.terms.spaceRequirement.location"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.terms.spaceRequirement.location"
                  placeholder="e.g., Mall, High street, Commercial area"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.terms.spaceRequirement.specialRequirements" className="font-medium text-gray-700">
              Special Requirements
            </Label>
            <Controller
              name="franchiseDetails.terms.spaceRequirement.specialRequirements"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="franchiseDetails.terms.spaceRequirement.specialRequirements"
                  placeholder="Describe any special space requirements (e.g., kitchen specifications, accessibility)"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Termination Conditions */}
        <div>
          <Label htmlFor="franchiseDetails.terms.terminationConditions" className="font-medium text-gray-700">
            Termination Conditions
          </Label>
          <Controller
            name="franchiseDetails.terms.terminationConditions"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="franchiseDetails.terms.terminationConditions"
                placeholder="Describe the conditions under which the franchise agreement can be terminated"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderSupportSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Support & Training</h2>
            <p className="text-gray-500 text-sm">Provide details about the support and training offered to franchisees</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Support & Training Help", 
                "Strong training and support programs are crucial selling points for franchise opportunities. Detail what franchisees can expect in terms of initial training, ongoing support, marketing assistance, and operational guidance to demonstrate the value you provide to franchisees."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Initial Support */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Initial Support</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="franchiseDetails.support.initialSupport.hasTrainingProvided"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Checkbox
                      id="hasTrainingProvided"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="hasTrainingProvided" className="text-sm">
                  Training provided
                </Label>
              </div>
              
              <div>
                <Label htmlFor="franchiseDetails.support.initialSupport.trainingDuration" className="font-medium text-gray-700">
                  Training Duration
                </Label>
                <Controller
                  name="franchiseDetails.support.initialSupport.trainingDuration"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="franchiseDetails.support.initialSupport.trainingDuration"
                      placeholder="e.g., 2 weeks, 1 month"
                      className="mt-1"
                      {...field}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="franchiseDetails.support.initialSupport.trainingLocation" className="font-medium text-gray-700">
                  Training Location
                </Label>
                <Controller
                  name="franchiseDetails.support.initialSupport.trainingLocation"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="franchiseDetails.support.initialSupport.trainingLocation"
                      placeholder="e.g., Head office, Online, On-site"
                      className="mt-1"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="franchiseDetails.support.initialSupport.hasSiteSelection"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Checkbox
                      id="hasSiteSelection"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="hasSiteSelection" className="text-sm">
                  Site selection assistance
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="franchiseDetails.support.initialSupport.hasConstructionSupport"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Checkbox
                      id="hasConstructionSupport"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="hasConstructionSupport" className="text-sm">
                  Construction/Fitout support
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="franchiseDetails.support.initialSupport.hasGrandOpeningSupport"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <Checkbox
                      id="hasGrandOpeningSupport"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="hasGrandOpeningSupport" className="text-sm">
                  Grand opening support
                </Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Training Content
            </Label>
            <Controller
              name="franchiseDetails.support.initialSupport.trainingContent"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add training topics and press Enter (e.g., Operations, Marketing, HR)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="franchiseDetails.support.initialSupport.preopeningSupport" className="font-medium text-gray-700">
              Pre-opening Support
            </Label>
            <Controller
              name="franchiseDetails.support.initialSupport.preopeningSupport"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="franchiseDetails.support.initialSupport.preopeningSupport"
                  placeholder="Describe the support provided before opening"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Ongoing Support */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Ongoing Support</h3>
          
          {/* Field Support */}
          <div>
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.support.ongoingSupport.fieldSupport.isAvailable"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="fieldSupportAvailable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="fieldSupportAvailable" className="text-sm font-medium">
                Field Support & Visits
              </Label>
            </div>
            
            {watch('franchiseDetails.support.ongoingSupport.fieldSupport.isAvailable') && (
              <div className="ml-6 mt-2">
                <div>
                  <Label htmlFor="franchiseDetails.support.ongoingSupport.fieldSupport.frequency" className="text-sm text-gray-700">
                    Visit Frequency
                  </Label>
                  <Controller
                    name="franchiseDetails.support.ongoingSupport.fieldSupport.frequency"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.support.ongoingSupport.fieldSupport.frequency"
                        placeholder="e.g., Monthly, Quarterly"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Marketing Support */}
          <div>
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.support.ongoingSupport.marketingSupport.isAvailable"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="marketingSupportAvailable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="marketingSupportAvailable" className="text-sm font-medium">
                Marketing Support
              </Label>
            </div>
            
            {watch('franchiseDetails.support.ongoingSupport.marketingSupport.isAvailable') && (
              <div className="ml-6 mt-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm text-gray-700">
                      Marketing Materials
                    </Label>
                    <Controller
                      name="franchiseDetails.support.ongoingSupport.marketingSupport.materials"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <TagsInput
                          placeholder="Add materials (e.g., Flyers)"
                          tags={field.value || []}
                          onTagsChange={(newTags) => field.onChange(newTags)}
                          className="mt-1"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-700">
                      Marketing Campaigns
                    </Label>
                    <Controller
                      name="franchiseDetails.support.ongoingSupport.marketingSupport.campaigns"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <TagsInput
                          placeholder="Add campaigns"
                          tags={field.value || []}
                          onTagsChange={(newTags) => field.onChange(newTags)}
                          className="mt-1"
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="franchiseDetails.support.ongoingSupport.marketingSupport.nationalAdvertising" className="text-sm text-gray-700">
                    National Advertising
                  </Label>
                  <Controller
                    name="franchiseDetails.support.ongoingSupport.marketingSupport.nationalAdvertising"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="franchiseDetails.support.ongoingSupport.marketingSupport.nationalAdvertising"
                        placeholder="Describe national advertising efforts"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Operational Support */}
          <div>
            <div className="flex items-center space-x-2">
              <Controller
                name="franchiseDetails.support.ongoingSupport.operationalSupport.isAvailable"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="operationalSupportAvailable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="operationalSupportAvailable" className="text-sm font-medium">
                Operational Support
              </Label>
            </div>
            
            {watch('franchiseDetails.support.ongoingSupport.operationalSupport.isAvailable') && (
              <div className="ml-6 mt-2 grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="franchiseDetails.support.ongoingSupport.operationalSupport.hasManuals"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <Checkbox
                        id="hasManuals"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasManuals" className="text-xs">
                    Operations Manuals
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="franchiseDetails.support.ongoingSupport.operationalSupport.hasHelpdesk"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <Checkbox
                        id="hasHelpdesk"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasHelpdesk" className="text-xs">
                    Helpdesk/Support Line
                  </Label>
                </div>
              </div>
            )}
          </div>
          
          {/* Technology Systems */}
          <div>
            <Label className="font-medium text-gray-700">
              Technology Systems Provided
            </Label>
            <Controller
              name="franchiseDetails.support.ongoingSupport.technologySystems"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add technology systems (e.g., POS, CRM, Inventory Management)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          {/* Supplier Relationships */}
          <div>
            <Label htmlFor="franchiseDetails.support.ongoingSupport.supplierRelationships" className="font-medium text-gray-700">
              Supplier Relationships
            </Label>
            <Controller
              name="franchiseDetails.support.ongoingSupport.supplierRelationships"
              control={control}
              render={({ field }) => (
                <Input 
                  id="franchiseDetails.support.ongoingSupport.supplierRelationships"
                  placeholder="Describe supplier relationships (e.g., Established network, Exclusive suppliers)"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Performance & Success Metrics</h2>
            <p className="text-gray-500 text-sm">Provide data on franchise performance and success rates</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Performance Metrics Help", 
                "Sharing realistic performance data helps prospective franchisees make informed decisions. While you should be positive about your franchise's performance, be honest and avoid making unrealistic claims. Transparency builds credibility with quality franchisee candidates."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Sales Data */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Sales Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.performance.salesData.averageUnitSales.value" className="font-medium text-gray-700">
                Average Unit Sales (₹/yr)
              </Label>
              <Controller
                name="franchiseDetails.performance.salesData.averageUnitSales.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.salesData.averageUnitSales.value"
                    type="number"
                    placeholder="Enter average annual sales per unit"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.performance.salesData.salesGrowth" className="font-medium text-gray-700">
                Sales Growth Rate
              </Label>
              <Controller
                name="franchiseDetails.performance.salesData.salesGrowth"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.salesData.salesGrowth"
                    placeholder="e.g., 15% year-over-year"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.performance.salesData.topUnitSales.value" className="font-medium text-gray-700">
                Top Unit Sales (₹/yr)
              </Label>
              <Controller
                name="franchiseDetails.performance.salesData.topUnitSales.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.salesData.topUnitSales.value"
                    type="number"
                    placeholder="Enter top-performing unit sales"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.performance.salesData.salesMaturityPeriod" className="font-medium text-gray-700">
                Sales Maturity Period
              </Label>
              <Controller
                name="franchiseDetails.performance.salesData.salesMaturityPeriod"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.salesData.salesMaturityPeriod"
                    placeholder="e.g., 18-24 months"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Profitability */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Profitability</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.performance.profitability.averageProfitMargin" className="font-medium text-gray-700">
                Average Profit Margin
              </Label>
              <Controller
                name="franchiseDetails.performance.profitability.averageProfitMargin"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.profitability.averageProfitMargin"
                    placeholder="e.g., 15-20%"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.performance.profitability.breakEvenPeriod" className="font-medium text-gray-700">
                Break-Even Period
              </Label>
              <Controller
                name="franchiseDetails.performance.profitability.breakEvenPeriod"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.profitability.breakEvenPeriod"
                    placeholder="e.g., 12-18 months"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.performance.profitability.paybackPeriod" className="font-medium text-gray-700">
                Payback Period
              </Label>
              <Controller
                name="franchiseDetails.performance.profitability.paybackPeriod"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.profitability.paybackPeriod"
                    placeholder="e.g., 3-4 years"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.performance.profitability.returnOnInvestment" className="font-medium text-gray-700">
                Return on Investment
              </Label>
              <Controller
                name="franchiseDetails.performance.profitability.returnOnInvestment"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.performance.profitability.returnOnInvestment"
                    placeholder="e.g., 25-30% annual ROI"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Success Metrics */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Success Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.successMetrics.successRate" className="font-medium text-gray-700">
                Franchisee Success Rate (%)
              </Label>
              <Controller
                name="franchiseDetails.successMetrics.successRate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.successMetrics.successRate"
                    type="number"
                    placeholder="Enter success rate percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.successMetrics.failureRate" className="font-medium text-gray-700">
                Failure Rate (%)
              </Label>
              <Controller
                name="franchiseDetails.successMetrics.failureRate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.successMetrics.failureRate"
                    type="number"
                    placeholder="Enter failure rate percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="franchiseDetails.successMetrics.franchiseeRenewals" className="font-medium text-gray-700">
                Franchisee Renewal Rate (%)
              </Label>
              <Controller
                name="franchiseDetails.successMetrics.franchiseeRenewals"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.successMetrics.franchiseeRenewals"
                    type="number"
                    placeholder="Enter renewal rate percentage"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="franchiseDetails.successMetrics.averageBreakEvenMonths" className="font-medium text-gray-700">
                Average Break-Even (Months)
              </Label>
              <Controller
                name="franchiseDetails.successMetrics.averageBreakEvenMonths"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="franchiseDetails.successMetrics.averageBreakEvenMonths"
                    type="number"
                    placeholder="Enter avg. break-even months"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Performance Disclaimer</AlertTitle>
            <AlertDescription>
              The performance metrics provided are based on historical data and existing franchisees. 
              Individual results may vary based on location, owner involvement, market conditions, 
              and other factors. These figures should not be considered as guarantees of future performance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  const renderTeamSection = () => {
    if (listingType === LISTING_TYPES.STARTUP) {
      return renderStartupTeamSection();
    } else if (listingType === LISTING_TYPES.INVESTOR) {
      return renderInvestorTeamSection();
    } else {
      return <p>Unsupported listing type for team section</p>;
    }
  };

  const renderStartupTeamSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Team & Founders</h2>
            <p className="text-gray-500 text-sm">Provide information about your startup's leadership and team</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Team & Founders Help", 
                "Investors often say they invest in people more than ideas. A strong founding team with relevant experience and complementary skills is essential for startup success. Be detailed and highlight each team member's expertise and achievements."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Founders */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Founders</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => appendFounder({
                name: '',
                role: '',
                experience: '',
                linkedin: '',
                education: '',
                expertise: []
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Founder
            </Button>
          </div>
          
          <div className="space-y-4">
            {foundersFields.map((field, index) => (
              <div key={field.id} className="border p-3 rounded-md bg-white">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Founder {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFounder(index)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor={`startupDetails.team.founders.${index}.name`}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name={`startupDetails.team.founders.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.founders.${index}.name`}
                          placeholder="Enter founder's name"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`startupDetails.team.founders.${index}.role`}>
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name={`startupDetails.team.founders.${index}.role`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.founders.${index}.role`}
                          placeholder="e.g., CEO, CTO, CMO"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <Label htmlFor={`startupDetails.team.founders.${index}.experience`}>
                    Experience <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name={`startupDetails.team.founders.${index}.experience`}
                    control={control}
                    render={({ field }) => (
                      <Textarea 
                        id={`startupDetails.team.founders.${index}.experience`}
                        placeholder="Describe relevant experience and background"
                        className="mt-1"
                        rows={2}
                        {...field}
                      />
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor={`startupDetails.team.founders.${index}.education`}>
                      Education
                    </Label>
                    <Controller
                      name={`startupDetails.team.founders.${index}.education`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.founders.${index}.education`}
                          placeholder="e.g., MBA, Stanford University"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`startupDetails.team.founders.${index}.linkedin`}>
                      LinkedIn Profile
                    </Label>
                    <Controller
                      name={`startupDetails.team.founders.${index}.linkedin`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.founders.${index}.linkedin`}
                          placeholder="LinkedIn URL"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <Label>
                    Areas of Expertise
                  </Label>
                  <Controller
                    name={`startupDetails.team.founders.${index}.expertise`}
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <TagsInput
                        placeholder="Add expertise and press Enter (e.g., Marketing, AI, Product Development)"
                        tags={field.value || []}
                        onTagsChange={(newTags) => field.onChange(newTags)}
                        className="mt-1"
                      />
                    )}
                  />
                </div>
              </div>
            ))}
            
            {foundersFields.length === 0 && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md">
                <Users className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">No founders added yet. Add founder details to enhance your listing.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendFounder({
                    name: '',
                    role: '',
                    experience: '',
                    linkedin: '',
                    education: '',
                    expertise: []
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Founder
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Team Members */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Key Team Members</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => appendTeamMember({
                name: '',
                role: '',
                experience: '',
                expertise: []
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Team Member
            </Button>
          </div>
          
          <div className="space-y-4">
            {teamMembersFields.map((field, index) => (
              <div key={field.id} className="border p-3 rounded-md bg-white">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Team Member {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeamMember(index)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor={`startupDetails.team.keyTeamMembers.${index}.name`}>
                      Name
                    </Label>
                    <Controller
                      name={`startupDetails.team.keyTeamMembers.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.keyTeamMembers.${index}.name`}
                          placeholder="Enter team member's name"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`startupDetails.team.keyTeamMembers.${index}.role`}>
                      Role
                    </Label>
                    <Controller
                      name={`startupDetails.team.keyTeamMembers.${index}.role`}
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id={`startupDetails.team.keyTeamMembers.${index}.role`}
                          placeholder="Enter team member's role"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <Label htmlFor={`startupDetails.team.keyTeamMembers.${index}.experience`}>
                    Experience
                  </Label>
                  <Controller
                    name={`startupDetails.team.keyTeamMembers.${index}.experience`}
                    control={control}
                    render={({ field }) => (
                      <Textarea 
                        id={`startupDetails.team.keyTeamMembers.${index}.experience`}
                        placeholder="Describe relevant experience"
                        className="mt-1"
                        rows={2}
                        {...field}
                      />
                    )}
                  />
                </div>
                
                <div className="mt-3">
                  <Label>
                    Areas of Expertise
                  </Label>
                  <Controller
                    name={`startupDetails.team.keyTeamMembers.${index}.expertise`}
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <TagsInput
                        placeholder="Add expertise and press Enter"
                        tags={field.value || []}
                        onTagsChange={(newTags) => field.onChange(newTags)}
                        className="mt-1"
                      />
                    )}
                  />
                </div>
              </div>
            ))}
            
            {teamMembersFields.length === 0 && (
              <p className="text-gray-500 text-sm">No key team members added yet.</p>
            )}
          </div>
        </div>
        
        {/* Team Size */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Team Size</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startupDetails.team.teamSize.total" className="font-medium text-gray-700">
                Total Team Size
              </Label>
              <Controller
                name="startupDetails.team.teamSize.total"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.team.teamSize.total"
                    type="number"
                    placeholder="Total"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.team.teamSize.fullTime" className="font-medium text-gray-700">
                Full-Time
              </Label>
              <Controller
                name="startupDetails.team.teamSize.fullTime"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.team.teamSize.fullTime"
                    type="number"
                    placeholder="Full-time"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.team.teamSize.partTime" className="font-medium text-gray-700">
                Part-Time
              </Label>
              <Controller
                name="startupDetails.team.teamSize.partTime"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.team.teamSize.partTime"
                    type="number"
                    placeholder="Part-time"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.team.teamSize.contractors" className="font-medium text-gray-700">
                Contractors
              </Label>
              <Controller
                name="startupDetails.team.teamSize.contractors"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.team.teamSize.contractors"
                    type="number"
                    placeholder="Contractors"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Advisors */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Advisors</h3>
          
          <div>
            <Controller
              name="startupDetails.team.advisors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((advisor, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Advisor name"
                          value={advisor.name || ''}
                          onChange={(e) => {
                            const newAdvisors = [...field.value];
                            newAdvisors[index] = { ...newAdvisors[index], name: e.target.value };
                            field.onChange(newAdvisors);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Expertise area"
                          value={advisor.expertise || ''}
                          onChange={(e) => {
                            const newAdvisors = [...field.value];
                            newAdvisors[index] = { ...newAdvisors[index], expertise: e.target.value };
                            field.onChange(newAdvisors);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newAdvisors = [...field.value];
                            newAdvisors.splice(index, 1);
                            field.onChange(newAdvisors);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No advisors added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value || []), { name: '', expertise: '' }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Advisor
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Hiring Plans */}
        <div>
          <Label htmlFor="startupDetails.team.hiringPlans" className="font-medium text-gray-700">
            Hiring Plans
          </Label>
          <Controller
            name="startupDetails.team.hiringPlans"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="startupDetails.team.hiringPlans"
                placeholder="Describe your hiring plans for the next 6-12 months"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
        
        {/* Culture & Values */}
        <div>
          <Label className="font-medium text-gray-700">
            Company Culture & Values
          </Label>
          <Controller
            name="startupDetails.team.cultureAndValues"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add company values and press Enter (e.g., Innovation, Integrity, Customer-First)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderInvestorTeamSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Team & Experience</h2>
            <p className="text-gray-500 text-sm">Provide information about your investment team and experience</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Team & Experience Help", 
                "A strong investment team with relevant experience builds credibility with entrepreneurs. Highlight specialized expertise, track record, and notable exits to demonstrate your value beyond just financial investment."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Key Partners/Team */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Key Partners/Team Members</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'investorDetails.team.keyPartners',
                  [
                    ...(watch('investorDetails.team.keyPartners') || []),
                    {
                      name: '',
                      position: '',
                      experience: '',
                      expertise: []
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Partner
            </Button>
          </div>
          
          <div className="space-y-4">
            <Controller
              name="investorDetails.team.keyPartners"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    field.value.map((partner, index) => (
                      <div key={index} className="border p-3 rounded-md bg-white">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Partner/Team Member {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newPartners = [...field.value];
                              newPartners.splice(index, 1);
                              field.onChange(newPartners);
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>
                              Name
                            </Label>
                            <Input 
                              placeholder="Enter name"
                              value={partner.name || ''}
                              onChange={(e) => {
                                const newPartners = [...field.value];
                                newPartners[index] = { ...newPartners[index], name: e.target.value };
                                field.onChange(newPartners);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>
                              Position
                            </Label>
                            <Input 
                              placeholder="e.g., Managing Partner, Investment Director"
                              value={partner.position || ''}
                              onChange={(e) => {
                                const newPartners = [...field.value];
                                newPartners[index] = { ...newPartners[index], position: e.target.value };
                                field.onChange(newPartners);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            Experience
                          </Label>
                          <Textarea 
                            placeholder="Describe relevant investment experience"
                            value={partner.experience || ''}
                            onChange={(e) => {
                              const newPartners = [...field.value];
                              newPartners[index] = { ...newPartners[index], experience: e.target.value };
                              field.onChange(newPartners);
                            }}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            Areas of Expertise
                          </Label>
                          <TagsInput
                            placeholder="Add expertise areas and press Enter"
                            tags={partner.expertise || []}
                            onTagsChange={(newTags) => {
                              const newPartners = [...field.value];
                              newPartners[index] = { ...newPartners[index], expertise: newTags };
                              field.onChange(newPartners);
                            }}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            LinkedIn Profile
                          </Label>
                          <Input 
                            placeholder="LinkedIn URL"
                            value={partner.linkedIn || ''}
                            onChange={(e) => {
                              const newPartners = [...field.value];
                              newPartners[index] = { ...newPartners[index], linkedIn: e.target.value };
                              field.onChange(newPartners);
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md">
                      <Users className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-center">No partners or team members added yet. Add key team members to enhance your profile.</p>
                    </div>
                  )}
                </>
              )}
            />
          </div>
        </div>
        
        {/* Advisors */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Advisors</h3>
          
          <div>
            <Controller
              name="investorDetails.team.advisors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((advisor, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Advisor name"
                          value={advisor.name || ''}
                          onChange={(e) => {
                            const newAdvisors = [...field.value];
                            newAdvisors[index] = { ...newAdvisors[index], name: e.target.value };
                            field.onChange(newAdvisors);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Expertise area"
                          value={advisor.expertise || ''}
                          onChange={(e) => {
                            const newAdvisors = [...field.value];
                            newAdvisors[index] = { ...newAdvisors[index], expertise: e.target.value };
                            field.onChange(newAdvisors);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newAdvisors = [...field.value];
                            newAdvisors.splice(index, 1);
                            field.onChange(newAdvisors);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No advisors added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value || []), { name: '', expertise: '' }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Advisor
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Domain Experts */}
        <div>
          <Label className="font-medium text-gray-700">
            Domain Experts & Resources
          </Label>
          <Controller
            name="investorDetails.team.domainExperts"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add domain experts and resources you can provide (e.g., Tech Mentors, Legal Support)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            List specialized experts and resources you have access to that can benefit portfolio companies.
          </p>
        </div>
      </div>
    );
  };

  const renderProductSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Product & Technology</h2>
            <p className="text-gray-500 text-sm">Provide details about your product, technology, and intellectual property</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Product & Technology Help", 
                "Clearly articulate your product, its development stage, and core technology. Highlight key features, technological innovations, and intellectual property. This section demonstrates your solution's viability and competitive advantages."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Product Overview */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Product Overview</h3>
          
          <div>
            <Label htmlFor="startupDetails.product.overview" className="font-medium text-gray-700">
              Product Description <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="startupDetails.product.overview"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.product.overview"
                  placeholder="Describe your product/service and how it works"
                  className="mt-1"
                  rows={4}
                  {...field}
                />
              )}
            />
            {errors.startupDetails?.product?.overview && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.product.overview.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startupDetails.product.stage" className="font-medium text-gray-700">
                Product Stage <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="startupDetails.product.stage"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select product stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept/Idea</SelectItem>
                      <SelectItem value="prototype">Prototype</SelectItem>
                      <SelectItem value="mvp">Minimum Viable Product (MVP)</SelectItem>
                      <SelectItem value="alpha">Alpha Version</SelectItem>
                      <SelectItem value="beta">Beta Version</SelectItem>
                      <SelectItem value="launched">Launched/Market Ready</SelectItem>
                      <SelectItem value="scaling">Scaling/Growth</SelectItem>
                      <SelectItem value="mature">Mature Product</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.startupDetails?.product?.stage && (
                <p className="text-red-500 text-sm mt-1">{errors.startupDetails.product.stage.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Unique Selling Points <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="startupDetails.product.uniqueSellingPoints"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add unique features and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
            {errors.startupDetails?.product?.uniqueSellingPoints && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.product.uniqueSellingPoints.message}</p>
            )}
          </div>
        </div>
        
        {/* Technology */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Technology Stack</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Tech Stack/Technologies
            </Label>
            <Controller
              name="startupDetails.product.technology.stack"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add technologies and press Enter (e.g., React, Node.js, TensorFlow)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="startupDetails.product.technology.architecture" className="font-medium text-gray-700">
              Technical Architecture
            </Label>
            <Controller
              name="startupDetails.product.technology.architecture"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.product.technology.architecture"
                  placeholder="Describe your technical architecture"
                  className="mt-1"
                  rows={2}
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Technical Innovations
            </Label>
            <Controller
              name="startupDetails.product.technology.innovations"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add key technical innovations and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
        
        {/* Intellectual Property */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Intellectual Property</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-medium text-gray-700">
                Patents Filed
              </Label>
              <Controller
                name="startupDetails.product.intellectualProperty.patents.filed"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <TagsInput
                    placeholder="Add filed patents"
                    tags={field.value || []}
                    onTagsChange={(newTags) => field.onChange(newTags)}
                    className="mt-1"
                  />
                )}
              />
            </div>
            
            <div>
              <Label className="font-medium text-gray-700">
                Patents Granted
              </Label>
              <Controller
                name="startupDetails.product.intellectualProperty.patents.granted"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <TagsInput
                    placeholder="Add granted patents"
                    tags={field.value || []}
                    onTagsChange={(newTags) => field.onChange(newTags)}
                    className="mt-1"
                  />
                )}
              />
            </div>
            
            <div>
              <Label className="font-medium text-gray-700">
                Trademarks
              </Label>
              <Controller
                name="startupDetails.product.intellectualProperty.trademarks"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <TagsInput
                    placeholder="Add trademarks"
                    tags={field.value || []}
                    onTagsChange={(newTags) => field.onChange(newTags)}
                    className="mt-1"
                  />
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="startupDetails.product.intellectualProperty.hasTradeSecrets"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="hasTradeSecrets"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="hasTradeSecrets" className="text-sm">
              Has trade secrets or proprietary technology
            </Label>
          </div>
        </div>
        
        {/* Product Roadmap */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Product Roadmap</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Current Features
            </Label>
            <Controller
              name="startupDetails.product.productRoadmap.currentFeatures"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add current features and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Planned Features</h4>
            <Controller
              name="startupDetails.product.productRoadmap.plannedFeatures"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Feature name"
                          value={feature.feature || ''}
                          onChange={(e) => {
                            const newFeatures = [...field.value];
                            newFeatures[index] = { ...newFeatures[index], feature: e.target.value };
                            field.onChange(newFeatures);
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={feature.priority || ''}
                          onValueChange={(value) => {
                            const newFeatures = [...field.value];
                            newFeatures[index] = { ...newFeatures[index], priority: value };
                            field.onChange(newFeatures);
                          }}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          type="date"
                          placeholder="Target date"
                          value={feature.targetDate ? (typeof feature.targetDate === 'string' ? feature.targetDate : feature.targetDate.toISOString().split('T')[0]) : ''}
                          onChange={(e) => {
                            const newFeatures = [...field.value];
                            newFeatures[index] = { ...newFeatures[index], targetDate: e.target.value };
                            field.onChange(newFeatures);
                          }}
                          className="w-[150px]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newFeatures = [...field.value];
                            newFeatures.splice(index, 1);
                            field.onChange(newFeatures);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No planned features added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value || []), { feature: '', priority: 'medium', targetDate: '' }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Planned Feature
                  </Button>
                </div>
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="startupDetails.product.productRoadmap.longTermVision" className="font-medium text-gray-700">
              Long-Term Vision
            </Label>
            <Controller
              name="startupDetails.product.productRoadmap.longTermVision"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.product.productRoadmap.longTermVision"
                  placeholder="Describe your long-term product vision"
                  className="mt-1"
                  rows={3}
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* User Feedback */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">User Feedback & Metrics</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              User Testimonials
            </Label>
            <Controller
              name="startupDetails.product.userFeedback.testimonials"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add user testimonials and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startupDetails.product.userFeedback.metrics.nps" className="font-medium text-gray-700">
                Net Promoter Score (NPS)
              </Label>
              <Controller
                name="startupDetails.product.userFeedback.metrics.nps"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.product.userFeedback.metrics.nps"
                    type="number"
                    placeholder="Enter NPS score"
                    className="mt-1"
                    min={-100}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.product.userFeedback.metrics.customerSatisfaction" className="font-medium text-gray-700">
                Customer Satisfaction (%)
              </Label>
              <Controller
                name="startupDetails.product.userFeedback.metrics.customerSatisfaction"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.product.userFeedback.metrics.customerSatisfaction"
                    type="number"
                    placeholder="Enter satisfaction %"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.product.userFeedback.metrics.retentionRate" className="font-medium text-gray-700">
                Retention Rate (%)
              </Label>
              <Controller
                name="startupDetails.product.userFeedback.metrics.retentionRate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.product.userFeedback.metrics.retentionRate"
                    type="number"
                    placeholder="Enter retention rate %"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMarketSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Market & Competition</h2>
            <p className="text-gray-500 text-sm">Provide details about your target market and competitive landscape</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Market & Competition Help", 
                "A thorough market analysis demonstrates your understanding of the opportunity size and competitive landscape. Be specific about your target market, provide credible market size figures, and show how you differentiate from competitors."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Target Market */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Target Market</h3>
          
          <div>
            <Label htmlFor="startupDetails.market.targetMarket" className="font-medium text-gray-700">
              Target Market Description <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="startupDetails.market.targetMarket"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="startupDetails.market.targetMarket"
                  placeholder="Describe your target market and customer personas"
                  className="mt-1"
                  rows={3}
                  {...field}
                />
              )}
            />
            {errors.startupDetails?.market?.targetMarket && (
              <p className="text-red-500 text-sm mt-1">{errors.startupDetails.market.targetMarket.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startupDetails.market.tam.value" className="font-medium text-gray-700">
                Total Addressable Market (₹)
              </Label>
              <Controller
                name="startupDetails.market.tam.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.market.tam.value"
                    type="number"
                    placeholder="Enter TAM value"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.market.sam.value" className="font-medium text-gray-700">
                Serviceable Available Market (₹)
              </Label>
              <Controller
                name="startupDetails.market.sam.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.market.sam.value"
                    type="number"
                    placeholder="Enter SAM value"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.market.som.value" className="font-medium text-gray-700">
                Serviceable Obtainable Market (₹)
              </Label>
              <Controller
                name="startupDetails.market.som.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.market.som.value"
                    type="number"
                    placeholder="Enter SOM value"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Competitors */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Competitors</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'startupDetails.market.competitors',
                  [
                    ...(watch('startupDetails.market.competitors') || []),
                    {
                      name: '',
                      differentiators: [],
                      strengths: [],
                      weaknesses: []
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Competitor
            </Button>
          </div>
          
          <div className="space-y-4">
            <Controller
              name="startupDetails.market.competitors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    field.value.map((competitor, index) => (
                      <div key={index} className="border p-3 rounded-md bg-white">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Competitor {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newCompetitors = [...field.value];
                              newCompetitors.splice(index, 1);
                              field.onChange(newCompetitors);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            Competitor Name
                          </Label>
                          <Input 
                            placeholder="Enter competitor name"
                            value={competitor.name || ''}
                            onChange={(e) => {
                              const newCompetitors = [...field.value];
                              newCompetitors[index] = { ...newCompetitors[index], name: e.target.value };
                              field.onChange(newCompetitors);
                            }}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            Your Differentiators
                          </Label>
                          <TagsInput
                            placeholder="How you differentiate from them"
                            tags={competitor.differentiators || []}
                            onTagsChange={(newTags) => {
                              const newCompetitors = [...field.value];
                              newCompetitors[index] = { ...newCompetitors[index], differentiators: newTags };
                              field.onChange(newCompetitors);
                            }}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>
                              Their Strengths
                            </Label>
                            <TagsInput
                              placeholder="Add their strengths"
                              tags={competitor.strengths || []}
                              onTagsChange={(newTags) => {
                                const newCompetitors = [...field.value];
                                newCompetitors[index] = { ...newCompetitors[index], strengths: newTags };
                                field.onChange(newCompetitors);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>
                              Their Weaknesses
                            </Label>
                            <TagsInput
                              placeholder="Add their weaknesses"
                              tags={competitor.weaknesses || []}
                              onTagsChange={(newTags) => {
                                const newCompetitors = [...field.value];
                                newCompetitors[index] = { ...newCompetitors[index], weaknesses: newTags };
                                field.onChange(newCompetitors);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No competitors added yet.</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
        
        {/* Competitive Advantage */}
        <div>
          <Label className="font-medium text-gray-700">
            Competitive Advantages
          </Label>
          <Controller
            name="startupDetails.market.competitiveAdvantage"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add your key competitive advantages and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Market Trends */}
        <div>
          <Label className="font-medium text-gray-700">
            Market Trends
          </Label>
          <Controller
            name="startupDetails.market.marketTrends"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add relevant market trends and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Regulatory Considerations */}
        <div>
          <Label htmlFor="startupDetails.market.regulatoryConsiderations" className="font-medium text-gray-700">
            Regulatory Considerations
          </Label>
          <Controller
            name="startupDetails.market.regulatoryConsiderations"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="startupDetails.market.regulatoryConsiderations"
                placeholder="Describe any regulatory considerations or challenges that may impact your business"
                className="mt-1"
                rows={2}
                {...field}
              />
            )}
          />
        </div>
        
        {/* Entry Barriers */}
        <div>
          <Label className="font-medium text-gray-700">
            Entry Barriers
          </Label>
          <Controller
            name="startupDetails.market.entryBarriers"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add barriers to entry in your market (e.g., High capital requirements, Patents, Network effects)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderTractionSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Traction & Metrics</h2>
            <p className="text-gray-500 text-sm">Provide details about your startup's progress and key metrics</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Traction & Metrics Help", 
                "Traction is evidence that your business model is working. Sharing concrete metrics and achievements helps investors gauge your startup's progress and potential. Be specific about user numbers, growth rates, partnerships, and milestones."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* User Base */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">User Base</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startupDetails.traction.userBase.total" className="font-medium text-gray-700">
                Total Users
              </Label>
              <Controller
                name="startupDetails.traction.userBase.total"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.traction.userBase.total"
                    type="number"
                    placeholder="Enter total users"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.traction.userBase.active" className="font-medium text-gray-700">
                Active Users
              </Label>
              <Controller
                name="startupDetails.traction.userBase.active"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.traction.userBase.active"
                    type="number"
                    placeholder="Enter active users"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.traction.userBase.paying" className="font-medium text-gray-700">
                Paying Users
              </Label>
              <Controller
                name="startupDetails.traction.userBase.paying"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.traction.userBase.paying"
                    type="number"
                    placeholder="Enter paying users"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Growth */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Growth</h3>
          
          <div>
            <Label htmlFor="startupDetails.traction.growth.rate" className="font-medium text-gray-700">
              Growth Rate (%)
            </Label>
            <Controller
              name="startupDetails.traction.growth.rate"
              control={control}
              render={({ field }) => (
                <Input 
                  id="startupDetails.traction.growth.rate"
                  type="number"
                  placeholder="Enter monthly/quarterly growth rate percentage"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Growth Timeline</h4>
            <Controller
              name="startupDetails.traction.growth.timeline"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((point, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          type="date"
                          placeholder="Date"
                          value={point.date ? (typeof point.date === 'string' ? point.date : point.date.toISOString().split('T')[0]) : ''}
                          onChange={(e) => {
                            const newTimeline = [...field.value];
                            newTimeline[index] = { ...newTimeline[index], date: e.target.value };
                            field.onChange(newTimeline);
                          }}
                          className="w-[150px]"
                        />
                        <Input 
                          type="number"
                          placeholder="Users"
                          value={point.users || ''}
                          onChange={(e) => {
                            const newTimeline = [...field.value];
                            newTimeline[index] = { ...newTimeline[index], users: parseInt(e.target.value) || 0 };
                            field.onChange(newTimeline);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          type="number"
                          placeholder="Revenue (₹)"
                          value={point.revenue?.value || ''}
                          onChange={(e) => {
                            const newTimeline = [...field.value];
                            newTimeline[index] = { 
                              ...newTimeline[index], 
                              revenue: { 
                                ...newTimeline[index].revenue, 
                                value: parseInt(e.target.value) || 0 
                              } 
                            };
                            field.onChange(newTimeline);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newTimeline = [...field.value];
                            newTimeline.splice(index, 1);
                            field.onChange(newTimeline);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No timeline points added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([
                        ...(field.value || []), 
                        { 
                          date: new Date().toISOString().split('T')[0], 
                          users: 0, 
                          revenue: { value: 0, currency: 'INR' } 
                        }
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Timeline Point
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Milestones */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Key Milestones</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'startupDetails.traction.milestones',
                  [
                    ...(watch('startupDetails.traction.milestones') || []),
                    {
                      title: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      isAchieved: true
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Milestone
            </Button>
          </div>
          
          <div className="space-y-4">
            <Controller
              name="startupDetails.traction.milestones"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    field.value.map((milestone, index) => (
                      <div key={index} className="flex flex-col space-y-2 border p-3 rounded-md bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={milestone.isAchieved}
                              onCheckedChange={(checked) => {
                                const newMilestones = [...field.value];
                                newMilestones[index] = { ...newMilestones[index], isAchieved: !!checked };
                                field.onChange(newMilestones);
                              }}
                            />
                            <Input 
                              placeholder="Milestone title"
                              value={milestone.title || ''}
                              onChange={(e) => {
                                const newMilestones = [...field.value];
                                newMilestones[index] = { ...newMilestones[index], title: e.target.value };
                                field.onChange(newMilestones);
                              }}
                              className="font-medium border-none p-0 h-auto shadow-none focus-visible:ring-0"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newMilestones = [...field.value];
                              newMilestones.splice(index, 1);
                              field.onChange(newMilestones);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="pl-7">
                          <Textarea 
                            placeholder="Describe this milestone"
                            value={milestone.description || ''}
                            onChange={(e) => {
                              const newMilestones = [...field.value];
                              newMilestones[index] = { ...newMilestones[index], description: e.target.value };
                              field.onChange(newMilestones);
                            }}
                            className="min-h-[60px] resize-none"
                          />
                          
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="mr-1 h-4 w-4" />
                            <Input 
                              type="date"
                              value={milestone.date ? (typeof milestone.date === 'string' ? milestone.date : milestone.date.toISOString().split('T')[0]) : ''}
                              onChange={(e) => {
                                const newMilestones = [...field.value];
                                newMilestones[index] = { ...newMilestones[index], date: e.target.value };
                                field.onChange(newMilestones);
                              }}
                              className="w-[150px] h-7 p-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No milestones added yet.</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
        
        {/* Partnerships */}
        <div>
          <Label className="font-medium text-gray-700">
            Key Partnerships
          </Label>
          <Controller
            name="startupDetails.traction.partnerships"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add key partnerships and press Enter (e.g., Microsoft for Startups, Industry leaders)"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Media & Recognition */}
        <div>
          <Label className="font-medium text-gray-700">
            Media Features & Recognition
          </Label>
          <Controller
            name="startupDetails.traction.mediaFeatures"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add press coverage, awards, and recognitions"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderFundingSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Funding & Financials</h2>
            <p className="text-gray-500 text-sm">Provide details about your startup's funding history and financial information</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Funding & Financials Help", 
                "This section provides investors with an overview of your past funding, current fundraising goals, and financial situation. Be transparent about the funds you've raised, how you plan to use new funding, and your financial projections."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Funding History */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Funding History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'startupDetails.funding.history.rounds',
                  [
                    ...(watch('startupDetails.funding.history.rounds') || []),
                    {
                      type: '',
                      date: new Date().toISOString().split('T')[0],
                      amount: { value: 0, currency: 'INR' },
                      investors: []
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Funding Round
            </Button>
          </div>
          
          <div>
            <Label htmlFor="startupDetails.funding.history.totalRaised.value" className="font-medium text-gray-700">
              Total Funding Raised (₹)
            </Label>
            <Controller
              name="startupDetails.funding.history.totalRaised.value"
              control={control}
              render={({ field }) => (
                <Input 
                  id="startupDetails.funding.history.totalRaised.value"
                  type="number"
                  placeholder="Enter total amount raised"
                  className="mt-1"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
          </div>
          
          <div className="space-y-4">
            <Controller
              name="startupDetails.funding.history.rounds"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    field.value.map((round, index) => (
                      <div key={index} className="border p-3 rounded-md bg-white">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Funding Round {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newRounds = [...field.value];
                              newRounds.splice(index, 1);
                              field.onChange(newRounds);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <Label>
                              Round Type
                            </Label>
                            <Select
                              value={round.type || ''}
                              onValueChange={(value) => {
                                const newRounds = [...field.value];
                                newRounds[index] = { ...newRounds[index], type: value };
                                field.onChange(newRounds);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select round type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                                <SelectItem value="seed">Seed</SelectItem>
                                <SelectItem value="series_a">Series A</SelectItem>
                                <SelectItem value="series_b">Series B</SelectItem>
                                <SelectItem value="series_c">Series C</SelectItem>
                                <SelectItem value="debt">Debt</SelectItem>
                                <SelectItem value="grant">Grant</SelectItem>
                                <SelectItem value="angel">Angel</SelectItem>
                                <SelectItem value="bootstrap">Bootstrap</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>
                              Date
                            </Label>
                            <Input 
                              type="date"
                              value={round.date ? (typeof round.date === 'string' ? round.date : round.date.toISOString().split('T')[0]) : ''}
                              onChange={(e) => {
                                const newRounds = [...field.value];
                                newRounds[index] = { ...newRounds[index], date: e.target.value };
                                field.onChange(newRounds);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>
                              Amount (₹)
                            </Label>
                            <Input 
                              type="number"
                              placeholder="Enter amount"
                              value={round.amount?.value || ''}
                              onChange={(e) => {
                                const newRounds = [...field.value];
                                newRounds[index] = { 
                                  ...newRounds[index], 
                                  amount: { 
                                    ...newRounds[index].amount, 
                                    value: parseInt(e.target.value) || 0 
                                  } 
                                };
                                field.onChange(newRounds);
                              }}
                              className="mt-1"
                              min={0}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label>
                              Investors
                            </Label>
                            <TagsInput
                              placeholder="Add investors and press Enter"
                              tags={round.investors || []}
                              onTagsChange={(newTags) => {
                                const newRounds = [...field.value];
                                newRounds[index] = { ...newRounds[index], investors: newTags };
                                field.onChange(newRounds);
                              }}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>
                              Valuation (₹)
                            </Label>
                            <Input 
                              type="number"
                              placeholder="Enter valuation"
                              value={round.valuation?.value || ''}
                              onChange={(e) => {
                                const newRounds = [...field.value];
                                newRounds[index] = { 
                                  ...newRounds[index], 
                                  valuation: { 
                                    ...newRounds[index].valuation, 
                                    value: parseInt(e.target.value) || 0 
                                  } 
                                };
                                field.onChange(newRounds);
                              }}
                              className="mt-1"
                              min={0}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label>
                            Lead Investor
                          </Label>
                          <Input 
                            placeholder="Enter lead investor name"
                            value={round.leadInvestor || ''}
                            onChange={(e) => {
                              const newRounds = [...field.value];
                              newRounds[index] = { ...newRounds[index], leadInvestor: e.target.value };
                              field.onChange(newRounds);
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No funding rounds added yet.</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
        
        {/* Current Fundraising */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Current Fundraising</h3>
            <Controller
              name="startupDetails.funding.current.isRaising"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label className="text-sm">
                    Currently raising
                  </Label>
                </div>
              )}
            />
          </div>
          
          {watch('startupDetails.funding.current.isRaising') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startupDetails.funding.current.targetAmount.value" className="font-medium text-gray-700">
                    Target Amount (₹)
                  </Label>
                  <Controller
                    name="startupDetails.funding.current.targetAmount.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="startupDetails.funding.current.targetAmount.value"
                        type="number"
                        placeholder="Enter target amount"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="startupDetails.funding.current.preMoney.value" className="font-medium text-gray-700">
                    Pre-Money Valuation (₹)
                  </Label>
                  <Controller
                    name="startupDetails.funding.current.preMoney.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="startupDetails.funding.current.preMoney.value"
                        type="number"
                        placeholder="Enter pre-money valuation"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startupDetails.funding.current.equity" className="font-medium text-gray-700">
                    Equity Offered (%)
                  </Label>
                  <Controller
                    name="startupDetails.funding.current.equity"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="startupDetails.funding.current.equity"
                        placeholder="e.g., 15-20%"
                        className="mt-1"
                        {...field}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="startupDetails.funding.current.minimumInvestment.value" className="font-medium text-gray-700">
                    Minimum Investment (₹)
                  </Label>
                  <Controller
                    name="startupDetails.funding.current.minimumInvestment.value"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="startupDetails.funding.current.minimumInvestment.value"
                        type="number"
                        placeholder="Enter minimum investment"
                        className="mt-1"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="startupDetails.funding.current.closingDate" className="font-medium text-gray-700">
                  Expected Closing Date
                </Label>
                <Controller
                  name="startupDetails.funding.current.closingDate"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="startupDetails.funding.current.closingDate"
                      type="date"
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                      {...field}
                      value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                    />
                  )}
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Usage of Funds</h4>
                <Controller
                  name="startupDetails.funding.current.usageOfFunds"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {field.value && field.value.length > 0 ? (
                        field.value.map((usage, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Select
                              value={usage.category || ''}
                              onValueChange={(value) => {
                                const newUsage = [...field.value];
                                newUsage[index] = { ...newUsage[index], category: value };
                                field.onChange(newUsage);
                              }}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product_development">Product Development</SelectItem>
                                <SelectItem value="marketing">Sales & Marketing</SelectItem>
                                <SelectItem value="team">Team Expansion</SelectItem>
                                <SelectItem value="operations">Operations</SelectItem>
                                <SelectItem value="research">Research & Development</SelectItem>
                                <SelectItem value="inventory">Inventory</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="international">International Expansion</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              type="number"
                              placeholder="Percentage (%)"
                              value={usage.percentage || ''}
                              onChange={(e) => {
                                const newUsage = [...field.value];
                                newUsage[index] = { ...newUsage[index], percentage: parseInt(e.target.value) || 0 };
                                field.onChange(newUsage);
                              }}
                              className="w-[120px]"
                              min={0}
                              max={100}
                            />
                            <Input 
                              type="number"
                              placeholder="Amount (₹)"
                              value={usage.amount?.value || ''}
                              onChange={(e) => {
                                const newUsage = [...field.value];
                                newUsage[index] = { 
                                  ...newUsage[index], 
                                  amount: { 
                                    ...newUsage[index].amount, 
                                    value: parseInt(e.target.value) || 0 
                                  } 
                                };
                                field.onChange(newUsage);
                              }}
                              className="flex-1"
                              min={0}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newUsage = [...field.value];
                                newUsage.splice(index, 1);
                                field.onChange(newUsage);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No fund usage breakdown added yet.</p>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          field.onChange([
                            ...(field.value || []), 
                            { 
                              category: '', 
                              percentage: 0, 
                              amount: { value: 0, currency: 'INR' } 
                            }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Category
                      </Button>
                    </div>
                  )}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="startupDetails.funding.current.documentRoom.isAvailable"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <Checkbox
                      id="documentRoomAvailable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="documentRoomAvailable" className="text-sm">
                  Data room available for serious investors
                </Label>
              </div>
            </div>
          )}
        </div>
        
        {/* Financials */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Financials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startupDetails.funding.financials.burnRate.value" className="font-medium text-gray-700">
                Monthly Burn Rate (₹)
              </Label>
              <Controller
                name="startupDetails.funding.financials.burnRate.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.funding.financials.burnRate.value"
                    type="number"
                    placeholder="Enter monthly burn rate"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.funding.financials.runway" className="font-medium text-gray-700">
                Runway
              </Label>
              <Controller
                name="startupDetails.funding.financials.runway"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.funding.financials.runway"
                    placeholder="e.g., 12 months"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="startupDetails.funding.financials.breakEvenProjection" className="font-medium text-gray-700">
                Break-Even Projection
              </Label>
              <Controller
                name="startupDetails.funding.financials.breakEvenProjection"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="startupDetails.funding.financials.breakEvenProjection"
                    type="date"
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                    {...field}
                    value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Financial Projections</h4>
            <Controller
              name="startupDetails.funding.financials.financialProjections"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((projection, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          type="number"
                          placeholder="Year"
                          value={projection.year || ''}
                          onChange={(e) => {
                            const newProjections = [...field.value];
                            newProjections[index] = { ...newProjections[index], year: parseInt(e.target.value) || 0 };
                            field.onChange(newProjections);
                          }}
                          className="w-[80px]"
                          min={new Date().getFullYear()}
                        />
                        <Input 
                          type="number"
                          placeholder="Revenue (₹)"
                          value={projection.revenue?.value || ''}
                          onChange={(e) => {
                            const newProjections = [...field.value];
                            newProjections[index] = { 
                              ...newProjections[index], 
                              revenue: { 
                                ...newProjections[index].revenue, 
                                value: parseInt(e.target.value) || 0 
                              } 
                            };
                            field.onChange(newProjections);
                          }}
                          className="flex-1"
                          min={0}
                        />
                        <Input 
                          type="number"
                          placeholder="Expenses (₹)"
                          value={projection.expenses?.value || ''}
                          onChange={(e) => {
                            const newProjections = [...field.value];
                            newProjections[index] = { 
                              ...newProjections[index], 
                              expenses: { 
                                ...newProjections[index].expenses, 
                                value: parseInt(e.target.value) || 0 
                              } 
                            };
                            field.onChange(newProjections);
                          }}
                          className="flex-1"
                          min={0}
                        />
                        <Input 
                          type="number"
                          placeholder="Profit (₹)"
                          value={projection.profit?.value || ''}
                          onChange={(e) => {
                            const newProjections = [...field.value];
                            newProjections[index] = { 
                              ...newProjections[index], 
                              profit: { 
                                ...newProjections[index].profit, 
                                value: parseInt(e.target.value) || 0 
                              } 
                            };
                            field.onChange(newProjections);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newProjections = [...field.value];
                            newProjections.splice(index, 1);
                            field.onChange(newProjections);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No financial projections added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      field.onChange([
                        ...(field.value || []), 
                        { 
                          year: currentYear + field.value.length, 
                          revenue: { value: 0, currency: 'INR' },
                          expenses: { value: 0, currency: 'INR' },
                          profit: { value: 0, currency: 'INR' } 
                        }
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Projection Year
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Financial Disclaimer */}
        <div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Financial Disclaimer</AlertTitle>
            <AlertDescription>
              All financial projections are estimates based on current growth trends and market conditions. 
              Actual results may vary. Detailed financial statements and documentation can be provided to 
              serious investors during due diligence.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  const renderFocusSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Focus Areas</h2>
            <p className="text-gray-500 text-sm">Provide details about your investment focus and criteria</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Focus Areas Help", 
                "Being clear about your investment focus helps attract relevant opportunities and saves time for both you and entrepreneurs. Specify which industries, business stages, and geographic regions you prefer to invest in."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Industry Focus */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Industry Focus</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Primary Industries
            </Label>
            <Controller
              name="investorDetails.focus.industries.primary"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="mt-1">
                  <MultiSelect
                    options={industries.map(industry => ({
                      value: industry.id,
                      label: industry.name
                    }))}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select primary industries"
                  />
                </div>
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Secondary Industries
            </Label>
            <Controller
              name="investorDetails.focus.industries.secondary"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="mt-1">
                  <MultiSelect
                    options={industries.map(industry => ({
                      value: industry.id,
                      label: industry.name
                    }))}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select secondary industries"
                  />
                </div>
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Excluded Industries
            </Label>
            <Controller
              name="investorDetails.focus.industries.excluded"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add industries you do not invest in and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
        
        {/* Business Stage */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Business Stage</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Preferred Business Stages
            </Label>
            <Controller
              name="investorDetails.focus.businessStage.preferred"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {[
                    "Idea/Concept", "Pre-Revenue", "Early Revenue", "Growth", "Mature", "Profitable",
                    "Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Buyout", "Turnaround"
                  ].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-${stage}`}
                        checked={field.value?.includes(stage)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), stage]);
                          } else {
                            field.onChange(field.value?.filter(s => s !== stage) || []);
                          }
                        }}
                      />
                      <Label htmlFor={`stage-${stage}`} className="text-sm">
                        {stage}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Excluded Business Stages
            </Label>
            <Controller
              name="investorDetails.focus.businessStage.excluded"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add business stages you do not invest in and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
        
        {/* Geographic Focus */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Geographic Focus</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Geographic Regions
            </Label>
            <Controller
              name="investorDetails.focus.geographicFocus"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add geographic regions and press Enter (e.g., Mumbai, Delhi NCR, South India)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
        
        {/* Minimum Requirements */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Minimum Requirements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="investorDetails.focus.minimumRequirements.revenue.value" className="font-medium text-gray-700">
                Minimum Revenue (₹)
              </Label>
              <Controller
                name="investorDetails.focus.minimumRequirements.revenue.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.focus.minimumRequirements.revenue.value"
                    type="number"
                    placeholder="Enter minimum revenue requirement"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.focus.minimumRequirements.customerBase" className="font-medium text-gray-700">
                Minimum Customer Base
              </Label>
              <Controller
                name="investorDetails.focus.minimumRequirements.customerBase"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.focus.minimumRequirements.customerBase"
                    type="number"
                    placeholder="Enter minimum customer requirement"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="investorDetails.focus.minimumRequirements.teamSize" className="font-medium text-gray-700">
                Minimum Team Size
              </Label>
              <Controller
                name="investorDetails.focus.minimumRequirements.teamSize"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.focus.minimumRequirements.teamSize"
                    type="number"
                    placeholder="Enter minimum team size"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.focus.minimumRequirements.marketSize" className="font-medium text-gray-700">
                Minimum Market Size
              </Label>
              <Controller
                name="investorDetails.focus.minimumRequirements.marketSize"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.focus.minimumRequirements.marketSize"
                    placeholder="e.g., ₹100 Crore TAM"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Business Criteria */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Business Criteria</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-medium text-gray-700">
                Preferred Company Size
              </Label>
              <Controller
                name="investorDetails.focus.businessCriteria.size"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <div className="space-y-2 mt-1">
                    {["Micro", "Small", "Medium", "Large"].map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`size-${size}`}
                          checked={field.value?.includes(size)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), size]);
                            } else {
                              field.onChange(field.value?.filter(s => s !== size) || []);
                            }
                          }}
                        />
                        <Label htmlFor={`size-${size}`} className="text-sm">
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.focus.businessCriteria.profitability" className="font-medium text-gray-700">
                Profitability Expectations
              </Label>
              <Controller
                name="investorDetails.focus.businessCriteria.profitability"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select expectation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profitable_now">Currently Profitable</SelectItem>
                      <SelectItem value="break_even">Break-Even</SelectItem>
                      <SelectItem value="path_to_profitability">Clear Path to Profitability</SelectItem>
                      <SelectItem value="growth_over_profit">Prioritizing Growth Over Profit</SelectItem>
                      <SelectItem value="no_requirement">No Specific Requirement</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.focus.businessCriteria.growthRate" className="font-medium text-gray-700">
                Growth Rate Expectations
              </Label>
              <Controller
                name="investorDetails.focus.businessCriteria.growthRate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.focus.businessCriteria.growthRate"
                    placeholder="e.g., >20% YoY"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Other Criteria
            </Label>
            <Controller
              name="investorDetails.focus.businessCriteria.otherCriteria"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add other business criteria and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPortfolioSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Portfolio & Track Record</h2>
            <p className="text-gray-500 text-sm">Provide details about your investment portfolio and past performance</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Portfolio & Track Record Help", 
                "Your track record is one of the most important factors entrepreneurs consider when choosing investors. Highlight your successful investments, exits, and the ways you add value beyond capital to demonstrate your expertise and capabilities."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Portfolio Overview */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Portfolio Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="investorDetails.portfolio.overview.totalInvestments" className="font-medium text-gray-700">
                Total Investments
              </Label>
              <Controller
                name="investorDetails.portfolio.overview.totalInvestments"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.portfolio.overview.totalInvestments"
                    type="number"
                    placeholder="Enter total number"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.portfolio.overview.activeInvestments" className="font-medium text-gray-700">
                Active Investments
              </Label>
              <Controller
                name="investorDetails.portfolio.overview.activeInvestments"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.portfolio.overview.activeInvestments"
                    type="number"
                    placeholder="Enter active number"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.portfolio.overview.exits" className="font-medium text-gray-700">
                Exits Completed
              </Label>
              <Controller
                name="investorDetails.portfolio.overview.exits"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.portfolio.overview.exits"
                    type="number"
                    placeholder="Enter exits number"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="investorDetails.portfolio.overview.averageReturnMultiple" className="font-medium text-gray-700">
                Average Return Multiple
              </Label>
              <Controller
                name="investorDetails.portfolio.overview.averageReturnMultiple"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="investorDetails.portfolio.overview.averageReturnMultiple"
                    type="number"
                    placeholder="e.g., 3.5x"
                    className="mt-1"
                    min={0}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Portfolio Highlights */}
        <div>
          <Label className="font-medium text-gray-700">
            Portfolio Highlights
          </Label>
          <Controller
            name="investorDetails.portfolio.highlights"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add portfolio highlights and press Enter (e.g., '3 unicorns in portfolio', 'Average IRR of 25%')"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Past Investments */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Past Investments</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'investorDetails.portfolio.pastInvestments',
                  [
                    ...(watch('investorDetails.portfolio.pastInvestments') || []),
                    {
                      companyName: '',
                      industry: '',
                      yearInvested: new Date().getFullYear() - 1,
                      status: 'active',
                      amountInvested: { value: 0, currency: 'INR' }
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Investment
            </Button>
          </div>
          
          <div className="space-y-4">
            <Controller
              name="investorDetails.portfolio.pastInvestments"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-100">
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Company</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Industry</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Year</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Status</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Amount (₹)</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {field.value.map((investment, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-3">
                                <Input 
                                  value={investment.companyName || ''}
                                  onChange={(e) => {
                                    const newInvestments = [...field.value];
                                    newInvestments[index] = { ...newInvestments[index], companyName: e.target.value };
                                    field.onChange(newInvestments);
                                  }}
                                  className="h-8 px-2"
                                  placeholder="Company name"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input 
                                  value={investment.industry || ''}
                                  onChange={(e) => {
                                    const newInvestments = [...field.value];
                                    newInvestments[index] = { ...newInvestments[index], industry: e.target.value };
                                    field.onChange(newInvestments);
                                  }}
                                  className="h-8 px-2"
                                  placeholder="Industry"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input 
                                  type="number"
                                  value={investment.yearInvested || ''}
                                  onChange={(e) => {
                                    const newInvestments = [...field.value];
                                    newInvestments[index] = { ...newInvestments[index], yearInvested: parseInt(e.target.value) || 0 };
                                    field.onChange(newInvestments);
                                  }}
                                  className="h-8 px-2 w-24"
                                  placeholder="Year"
                                  min={1980}
                                  max={new Date().getFullYear()}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Select
                                  value={investment.status || ''}
                                  onValueChange={(value) => {
                                    const newInvestments = [...field.value];
                                    newInvestments[index] = { ...newInvestments[index], status: value };
                                    field.onChange(newInvestments);
                                  }}
                                >
                                  <SelectTrigger className="h-8 px-2 w-36">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="exited">Exited</SelectItem>
                                    <SelectItem value="written_off">Written Off</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3">
                                <Input 
                                  type="number"
                                  value={investment.amountInvested?.value || ''}
                                  onChange={(e) => {
                                    const newInvestments = [...field.value];
                                    newInvestments[index] = { 
                                      ...newInvestments[index], 
                                      amountInvested: { 
                                        ...newInvestments[index].amountInvested, 
                                        value: parseInt(e.target.value) || 0 
                                      } 
                                    };
                                    field.onChange(newInvestments);
                                  }}
                                  className="h-8 px-2"
                                  placeholder="Amount"
                                  min={0}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newInvestments = [...field.value];
                                    newInvestments.splice(index, 1);
                                    field.onChange(newInvestments);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No past investments added yet.</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
        
        {/* Current Investments */}
        <div>
          <Label className="font-medium text-gray-700">
            Notable Current Investments
          </Label>
          <Controller
            name="investorDetails.portfolio.currentInvestments"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add your current notable investments and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Success Stories */}
        <div>
          <Label className="font-medium text-gray-700">
            Success Stories
          </Label>
          <Controller
            name="investorDetails.portfolio.successStories"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add success stories/notable exits and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Value Added Services */}
        <div>
          <Label className="font-medium text-gray-700">
            Value Added Services
          </Label>
          <Controller
            name="investorDetails.portfolio.valueAddedServices"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add services you provide beyond capital and press Enter"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            List the ways you help portfolio companies succeed beyond providing capital.
          </p>
        </div>
      </div>
    );
  };

  const renderProcessSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Investment Process</h2>
            <p className="text-gray-500 text-sm">Provide details about your investment evaluation and decision process</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Investment Process Help", 
                "Setting clear expectations about your investment process helps entrepreneurs understand what to expect when pitching to you. Outline your evaluation steps, timeframes, and requirements to create transparency and efficiency in your discussions."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Stages of Evaluation */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Evaluation Stages</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Stages of Evaluation
            </Label>
            <Controller
              name="investorDetails.investmentProcess.stagesOfEvaluation"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add evaluation stages and press Enter (e.g., 'Initial Screening', 'Due Diligence')"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="investorDetails.investmentProcess.typicalTimeframe" className="font-medium text-gray-700">
              Typical Timeframe
            </Label>
            <Controller
              name="investorDetails.investmentProcess.typicalTimeframe"
              control={control}
              render={({ field }) => (
                <Input 
                  id="investorDetails.investmentProcess.typicalTimeframe"
                  placeholder="e.g., 4-8 weeks from initial meeting to investment decision"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Required Documents */}
        <div>
          <Label className="font-medium text-gray-700">
            Required Documents
          </Label>
          <Controller
            name="investorDetails.investmentProcess.requiredDocuments"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TagsInput
                placeholder="Add required documents and press Enter (e.g., 'Pitch Deck', 'Financial Projections')"
                tags={field.value || []}
                onTagsChange={(newTags) => field.onChange(newTags)}
                className="mt-1"
              />
            )}
          />
        </div>
        
        {/* Initial Screening */}
        <div>
          <Label htmlFor="investorDetails.investmentProcess.initialScreening" className="font-medium text-gray-700">
            Initial Screening Process
          </Label>
          <Controller
            name="investorDetails.investmentProcess.initialScreening"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="investorDetails.investmentProcess.initialScreening"
                placeholder="Describe your initial screening process"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
        
        {/* Due Diligence */}
        <div>
          <Label htmlFor="investorDetails.investmentProcess.dueDiligence" className="font-medium text-gray-700">
            Due Diligence Process
          </Label>
          <Controller
            name="investorDetails.investmentProcess.dueDiligence"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="investorDetails.investmentProcess.dueDiligence"
                placeholder="Describe your due diligence process (e.g., financial review, market analysis, customer calls)"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
        
        {/* Post-Investment Involvement */}
        <div>
          <Label htmlFor="investorDetails.investmentProcess.postInvestmentInvolvement" className="font-medium text-gray-700">
            Post-Investment Involvement
          </Label>
          <Controller
            name="investorDetails.investmentProcess.postInvestmentInvolvement"
            control={control}
            render={({ field }) => (
              <Textarea 
                id="investorDetails.investmentProcess.postInvestmentInvolvement"
                placeholder="Describe how you work with companies after investing (e.g., board seat, regular check-ins, strategic guidance)"
                className="mt-1"
                rows={3}
                {...field}
              />
            )}
          />
        </div>
      </div>
    );
  };

  const renderDomainSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Domain Information</h2>
            <p className="text-gray-500 text-sm">Provide details about the domain name and related digital assets</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Domain Information Help", 
                "For digital asset listings, domain details are crucial. Include information about domain age, authority, registrar, and expiry to help potential buyers assess the value of the digital property."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Domain Details */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Domain Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.domainInfo.domain" className="font-medium text-gray-700">
                Domain Name <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="digitalAssetDetails.domainInfo.domain"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.domainInfo.domain"
                    placeholder="e.g., example.com"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
              {errors.digitalAssetDetails?.domainInfo?.domain && (
                <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.domainInfo.domain.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.domainInfo.registrar" className="font-medium text-gray-700">
                Registrar
              </Label>
              <Controller
                name="digitalAssetDetails.domainInfo.registrar"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.domainInfo.registrar"
                    placeholder="e.g., GoDaddy, Namecheap"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.domainInfo.expiryDate" className="font-medium text-gray-700">
                Expiry Date
              </Label>
              <Controller
                name="digitalAssetDetails.domainInfo.expiryDate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.domainInfo.expiryDate"
                    type="date"
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                    {...field}
                    value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                  />
                )}
              />
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <Controller
                name="digitalAssetDetails.domainInfo.isIncluded"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="isDomainIncluded"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isDomainIncluded" className="text-sm">
                Domain name is included in the sale
              </Label>
            </div>
          </div>
        </div>
        
        {/* Domain Metrics */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Domain Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.domainInfo.domainAuthority" className="font-medium text-gray-700">
                Domain Authority (DA)
              </Label>
              <Controller
                name="digitalAssetDetails.domainInfo.domainAuthority"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.domainInfo.domainAuthority"
                    type="number"
                    placeholder="Enter DA score (0-100)"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.domainInfo.domainRating" className="font-medium text-gray-700">
                Domain Rating (DR)
              </Label>
              <Controller
                name="digitalAssetDetails.domainInfo.domainRating"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.domainInfo.domainRating"
                    type="number"
                    placeholder="Enter DR score (0-100)"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Additional Domains */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Additional Domains</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(
                  'digitalAssetDetails.domainInfo.additionalDomains',
                  [
                    ...(watch('digitalAssetDetails.domainInfo.additionalDomains') || []),
                    {
                      domain: '',
                      purpose: '',
                      isIncluded: true
                    }
                  ]
                );
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Domain
            </Button>
          </div>
          
          <div className="space-y-4">
            <Controller
              name="digitalAssetDetails.domainInfo.additionalDomains"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <>
                  {field.value && field.value.length > 0 ? (
                    field.value.map((domain, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Domain name"
                          value={domain.domain || ''}
                          onChange={(e) => {
                            const newDomains = [...field.value];
                            newDomains[index] = { ...newDomains[index], domain: e.target.value };
                            field.onChange(newDomains);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Purpose/Usage"
                          value={domain.purpose || ''}
                          onChange={(e) => {
                            const newDomains = [...field.value];
                            newDomains[index] = { ...newDomains[index], purpose: e.target.value };
                            field.onChange(newDomains);
                          }}
                          className="flex-1"
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`domain-included-${index}`}
                            checked={domain.isIncluded}
                            onCheckedChange={(checked) => {
                              const newDomains = [...field.value];
                              newDomains[index] = { ...newDomains[index], isIncluded: !!checked };
                              field.onChange(newDomains);
                            }}
                          />
                          <Label htmlFor={`domain-included-${index}`} className="text-xs whitespace-nowrap">
                            Included
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newDomains = [...field.value];
                            newDomains.splice(index, 1);
                            field.onChange(newDomains);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No additional domains added yet.</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTechnicalSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Technical Details</h2>
            <p className="text-gray-500 text-sm">Provide technical information about the digital asset</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Technical Details Help", 
                "Technical details help buyers understand the platform's architecture, maintenance requirements, and potential for scaling. Be specific about hosting, technology stack, and code quality to demonstrate the asset's technical value."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Platform and Hosting */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Platform & Hosting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.technical.platform" className="font-medium text-gray-700">
                Platform/CMS <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="digitalAssetDetails.technical.platform"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.platform"
                    placeholder="e.g., WordPress, Shopify, Custom"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
              {errors.digitalAssetDetails?.technical?.platform && (
                <p className="text-red-500 text-sm mt-1">{errors.digitalAssetDetails.technical.platform.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.technical.hosting.provider" className="font-medium text-gray-700">
                Hosting Provider
              </Label>
              <Controller
                name="digitalAssetDetails.technical.hosting.provider"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.hosting.provider"
                    placeholder="e.g., AWS, DigitalOcean, Hostinger"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.technical.hosting.plan" className="font-medium text-gray-700">
                Hosting Plan
              </Label>
              <Controller
                name="digitalAssetDetails.technical.hosting.plan"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.hosting.plan"
                    placeholder="e.g., Shared, VPS, Dedicated"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.technical.hosting.costPerMonth.value" className="font-medium text-gray-700">
                Monthly Hosting Cost (₹)
              </Label>
              <Controller
                name="digitalAssetDetails.technical.hosting.costPerMonth.value"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.hosting.costPerMonth.value"
                    type="number"
                    placeholder="Enter monthly cost"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.technical.hosting.isIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="isHostingIncluded"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isHostingIncluded" className="text-sm">
              Hosting is included/transferable with sale
            </Label>
          </div>
        </div>
        
        {/* Tech Stack */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Technology Stack</h3>
          
          <div>
            <Label className="font-medium text-gray-700">
              Technologies Used
            </Label>
            <Controller
              name="digitalAssetDetails.technical.technology.stack"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add technologies and press Enter (e.g., PHP, MySQL, React)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Frameworks/Libraries
            </Label>
            <Controller
              name="digitalAssetDetails.technical.technology.frameworks"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add frameworks and press Enter (e.g., Laravel, Bootstrap)"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.technical.technology.cms" className="font-medium text-gray-700">
              CMS/Platform Details
            </Label>
            <Controller
              name="digitalAssetDetails.technical.technology.cms"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.technical.technology.cms"
                  placeholder="e.g., WordPress 6.2 with Elementor Pro"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Plugins/Extensions
            </Label>
            <Controller
              name="digitalAssetDetails.technical.technology.plugins"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add plugins and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.technical.technology.hasCustomDevelopment"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="hasCustomDevelopment"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="hasCustomDevelopment" className="text-sm">
              Has custom development/code
            </Label>
          </div>
        </div>
        
        {/* Mobile and Performance */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Mobile & Performance</h3>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.technical.isMobileResponsive"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="isMobileResponsive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isMobileResponsive" className="text-sm">
              Mobile responsive design
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.technical.pagespeed.mobile" className="font-medium text-gray-700">
                PageSpeed Score - Mobile
              </Label>
              <Controller
                name="digitalAssetDetails.technical.pagespeed.mobile"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.pagespeed.mobile"
                    type="number"
                    placeholder="Enter score (0-100)"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.technical.pagespeed.desktop" className="font-medium text-gray-700">
                PageSpeed Score - Desktop
              </Label>
              <Controller
                name="digitalAssetDetails.technical.pagespeed.desktop"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.technical.pagespeed.desktop"
                    type="number"
                    placeholder="Enter score (0-100)"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Security */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Security</h3>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.technical.security.hasSSL"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="hasSSL"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="hasSSL" className="text-sm">
              Has SSL certificate
            </Label>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.technical.security.dataEncryption" className="font-medium text-gray-700">
              Data Encryption
            </Label>
            <Controller
              name="digitalAssetDetails.technical.security.dataEncryption"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.technical.security.dataEncryption"
                  placeholder="e.g., AES-256 for sensitive data"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.technical.security.lastSecurityAudit" className="font-medium text-gray-700">
              Last Security Audit Date
            </Label>
            <Controller
              name="digitalAssetDetails.technical.security.lastSecurityAudit"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.technical.security.lastSecurityAudit"
                  type="date"
                  className="mt-1"
                  {...field}
                  value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''}
                />
              )}
            />
          </div>
        </div>
        
        {/* Development */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Development</h3>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.technical.development.sourcecodeIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="sourcecodeIncluded"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="sourcecodeIncluded" className="text-sm">
              Source code included in sale
            </Label>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.technical.development.documentation" className="font-medium text-gray-700">
              Documentation
            </Label>
            <Controller
              name="digitalAssetDetails.technical.development.documentation"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.technical.development.documentation"
                  placeholder="e.g., Full technical documentation, Setup guide"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.technical.development.repositoryAccess" className="font-medium text-gray-700">
              Repository Access
            </Label>
            <Controller
              name="digitalAssetDetails.technical.development.repositoryAccess"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.technical.development.repositoryAccess"
                  placeholder="e.g., GitHub, GitLab, BitBucket"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTrafficSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Traffic & Analytics</h2>
            <p className="text-gray-500 text-sm">Provide information about the digital asset's traffic and user engagement</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Traffic & Analytics Help", 
                "Traffic and user data are the lifeblood of digital assets. Detailed information about visitor numbers, sources, demographics, and engagement metrics helps buyers evaluate revenue potential and audience value."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Traffic Overview */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Traffic Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.monthlyVisitors" className="font-medium text-gray-700">
                Monthly Unique Visitors
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.monthlyVisitors"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.monthlyVisitors"
                    type="number"
                    placeholder="Enter monthly visitors"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.monthlyPageviews" className="font-medium text-gray-700">
                Monthly Pageviews
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.monthlyPageviews"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.monthlyPageviews"
                    type="number"
                    placeholder="Enter monthly pageviews"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.traffic.overview.trafficTrend" className="font-medium text-gray-700">
              Traffic Trend
            </Label>
            <Controller
              name="digitalAssetDetails.traffic.overview.trafficTrend"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select traffic trend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growing_rapidly">Growing Rapidly {` (>25% YoY)`}</SelectItem>
                    <SelectItem value="growing_steadily">Growing Steadily {` (10-25% YoY)`}</SelectItem>
                    <SelectItem value="growing_slowly">Growing Slowly {` (<10% YoY)`}</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="declining_slowly">Declining Slowly {` (<10% YoY)`}</SelectItem>
                    <SelectItem value="declining_steadily">Declining Steadily {` (10-25% YoY)`}</SelectItem>
                    <SelectItem value="declining_rapidly">Declining Rapidly {` (>25% YoY)`}</SelectItem>
                    <SelectItem value="fluctuating">Fluctuating/Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        
        {/* Traffic Sources */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Traffic Sources</h3>
          <p className="text-sm text-gray-500 mb-2">
            Enter the percentage breakdown of traffic sources
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.organic" className="font-medium text-gray-700">
                Organic Search (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.organic"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.organic"
                    type="number"
                    placeholder="% from organic search"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.direct" className="font-medium text-gray-700">
                Direct (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.direct"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.direct"
                    type="number"
                    placeholder="% from direct traffic"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.referral" className="font-medium text-gray-700">
                Referral (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.referral"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.referral"
                    type="number"
                    placeholder="% from referrals"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.social" className="font-medium text-gray-700">
                Social Media (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.social"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.social"
                    type="number"
                    placeholder="% from social media"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.email" className="font-medium text-gray-700">
                Email (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.email"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.email"
                    type="number"
                    placeholder="% from email"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.overview.trafficSources.paid" className="font-medium text-gray-700">
                Paid Ads (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.overview.trafficSources.paid"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.overview.trafficSources.paid"
                    type="number"
                    placeholder="% from paid ads"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Demographics */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Audience Demographics</h3>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Countries</h4>
            <Controller
              name="digitalAssetDetails.traffic.demographics.countries"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((country, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Country name"
                          value={country.name || ''}
                          onChange={(e) => {
                            const newCountries = [...field.value];
                            newCountries[index] = { ...newCountries[index], name: e.target.value };
                            field.onChange(newCountries);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          type="number"
                          placeholder="Percentage (%)"
                          value={country.percentage || ''}
                          onChange={(e) => {
                            const newCountries = [...field.value];
                            newCountries[index] = { ...newCountries[index], percentage: parseInt(e.target.value) || 0 };
                            field.onChange(newCountries);
                          }}
                          className="w-24"
                          min={0}
                          max={100}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newCountries = [...field.value];
                            newCountries.splice(index, 1);
                            field.onChange(newCountries);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No country data added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value || []), { name: '', percentage: 0 }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Country
                  </Button>
                </div>
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              User Interests
            </Label>
            <Controller
              name="digitalAssetDetails.traffic.demographics.interests"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add user interests and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.demographics.devices.desktop" className="font-medium text-gray-700">
                Desktop (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.demographics.devices.desktop"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.demographics.devices.desktop"
                    type="number"
                    placeholder="% desktop users"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.demographics.devices.mobile" className="font-medium text-gray-700">
                Mobile (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.demographics.devices.mobile"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.demographics.devices.mobile"
                    type="number"
                    placeholder="% mobile users"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.demographics.devices.tablet" className="font-medium text-gray-700">
                Tablet (%)
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.demographics.devices.tablet"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.demographics.devices.tablet"
                    type="number"
                    placeholder="% tablet users"
                    className="mt-1"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* User Behavior */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">User Behavior</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.behavior.bounceRate" className="font-medium text-gray-700">
                Bounce Rate
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.behavior.bounceRate"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.behavior.bounceRate"
                    placeholder="e.g., 45%, 62.5%"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.behavior.averageSessionDuration" className="font-medium text-gray-700">
                Avg. Session Duration
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.behavior.averageSessionDuration"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.behavior.averageSessionDuration"
                    placeholder="e.g., 2:45, 4 minutes"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.behavior.pagesPerSession" className="font-medium text-gray-700">
                Pages Per Session
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.behavior.pagesPerSession"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.behavior.pagesPerSession"
                    type="number"
                    placeholder="e.g., 2.5"
                    className="mt-1"
                    min={0}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.behavior.returnVisitors" className="font-medium text-gray-700">
                Return Visitor Rate
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.behavior.returnVisitors"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.behavior.returnVisitors"
                    placeholder="e.g., 35%, 40-45%"
                    className="mt-1"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* SEO */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">SEO & Keywords</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.seo.organicTraffic" className="font-medium text-gray-700">
                Monthly Organic Traffic
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.seo.organicTraffic"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.seo.organicTraffic"
                    type="number"
                    placeholder="Enter monthly organic visitors"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.traffic.seo.keywordRankings" className="font-medium text-gray-700">
                Total Keyword Rankings
              </Label>
              <Controller
                name="digitalAssetDetails.traffic.seo.keywordRankings"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.traffic.seo.keywordRankings"
                    type="number"
                    placeholder="Total keywords ranked"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Ranking Keywords</h4>
            <Controller
              name="digitalAssetDetails.traffic.seo.topKeywords"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className="space-y-3">
                  {field.value && field.value.length > 0 ? (
                    field.value.map((keyword, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Input 
                          placeholder="Keyword"
                          value={keyword.keyword || ''}
                          onChange={(e) => {
                            const newKeywords = [...field.value];
                            newKeywords[index] = { ...newKeywords[index], keyword: e.target.value };
                            field.onChange(newKeywords);
                          }}
                          className="flex-1"
                        />
                        <Input 
                          type="number"
                          placeholder="Position"
                          value={keyword.position || ''}
                          onChange={(e) => {
                            const newKeywords = [...field.value];
                            newKeywords[index] = { ...newKeywords[index], position: parseInt(e.target.value) || 0 };
                            field.onChange(newKeywords);
                          }}
                          className="w-24"
                          min={1}
                        />
                        <Input 
                          type="number"
                          placeholder="Volume"
                          value={keyword.volume || ''}
                          onChange={(e) => {
                            const newKeywords = [...field.value];
                            newKeywords[index] = { ...newKeywords[index], volume: parseInt(e.target.value) || 0 };
                            field.onChange(newKeywords);
                          }}
                          className="w-24"
                          min={0}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newKeywords = [...field.value];
                            newKeywords.splice(index, 1);
                            field.onChange(newKeywords);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No keywords added yet.</p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      field.onChange([...(field.value || []), { keyword: '', position: 0, volume: 0 }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Keyword
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
        
        {/* Analytics */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Analytics Access</h3>
          
          <div>
            <Label htmlFor="digitalAssetDetails.traffic.analytics.platform" className="font-medium text-gray-700">
              Analytics Platform
            </Label>
            <Controller
              name="digitalAssetDetails.traffic.analytics.platform"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.traffic.analytics.platform"
                  placeholder="e.g., Google Analytics, Matomo, Plausible"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.traffic.analytics.isAccessIncluded"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="isAnalyticsAccessIncluded"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isAnalyticsAccessIncluded" className="text-sm">
              Analytics access included in sale
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.traffic.analytics.historicalDataAvailable"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  id="historicalDataAvailable"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="historicalDataAvailable" className="text-sm">
              Historical data available
            </Label>
          </div>
        </div>
      </div>
    );
  };

  const renderContentSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">Content & Structure</h2>
            <p className="text-gray-500 text-sm">Provide information about the digital asset's content</p>
          </div>
          {showHelpTips && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showHelp("Content & Structure Help", 
                "Content is a valuable asset for digital properties. Detail the volume, quality, and uniqueness of your content to demonstrate its value. Also include information about content rights and multilingual capabilities."
              )}
            >
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </Button>
          )}
        </div>
        
        {/* Content Stats */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Content Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.content.totalPages" className="font-medium text-gray-700">
                Total Pages
              </Label>
              <Controller
                name="digitalAssetDetails.content.totalPages"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.content.totalPages"
                    type="number"
                    placeholder="Enter total number of pages"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.content.totalPosts" className="font-medium text-gray-700">
                Total Posts/Articles
              </Label>
              <Controller
                name="digitalAssetDetails.content.totalPosts"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.content.totalPosts"
                    type="number"
                    placeholder="Enter total posts/articles"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.content.contentQuality" className="font-medium text-gray-700">
              Content Quality
            </Label>
            <Controller
              name="digitalAssetDetails.content.contentQuality"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select content quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium (Professional, Unique)</SelectItem>
                    <SelectItem value="high">High Quality (Original, Well-written)</SelectItem>
                    <SelectItem value="good">Good Quality (Mix of Original and Curated)</SelectItem>
                    <SelectItem value="average">Average Quality</SelectItem>
                    <SelectItem value="variable">Variable Quality</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <div>
            <Label className="font-medium text-gray-700">
              Language Options
            </Label>
            <Controller
              name="digitalAssetDetails.content.languageOptions"
              control={control}
              defaultValue={['English']}
              render={({ field }) => (
                <TagsInput
                  placeholder="Add languages and press Enter"
                  tags={field.value || []}
                  onTagsChange={(newTags) => field.onChange(newTags)}
                  className="mt-1"
                />
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.content.contentUpdateFrequency" className="font-medium text-gray-700">
              Content Update Frequency
            </Label>
            <Controller
              name="digitalAssetDetails.content.contentUpdateFrequency"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.content.contentUpdateFrequency"
                  placeholder="e.g., Daily, Weekly, Monthly"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
        </div>
        
        {/* Content Rights */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Content Rights</h3>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="digitalAssetDetails.content.hasUserGeneratedContent"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="hasUserGeneratedContent"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="hasUserGeneratedContent" className="text-sm">
              Has user-generated content
            </Label>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.content.contentRights" className="font-medium text-gray-700">
              Content Rights
            </Label>
            <Controller
              name="digitalAssetDetails.content.contentRights"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select content rights status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">All Content Owned/Original</SelectItem>
                    <SelectItem value="licensed">Licensed Content (Transferable)</SelectItem>
                    <SelectItem value="mixed">Mixed (Owned & Licensed)</SelectItem>
                    <SelectItem value="cc">Creative Commons (Properly Attributed)</SelectItem>
                    <SelectItem value="public_domain">Public Domain</SelectItem>
                    <SelectItem value="user_generated">User Generated with Terms</SelectItem>
                    <SelectItem value="limited">Some Content Rights Not Included</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        
        {/* Users & Customers */}
        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-medium text-gray-700">Users & Database</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="digitalAssetDetails.users.registeredUsers" className="font-medium text-gray-700">
                Registered Users
              </Label>
              <Controller
                name="digitalAssetDetails.users.registeredUsers"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.users.registeredUsers"
                    type="number"
                    placeholder="Enter number of users"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.users.activeUsers" className="font-medium text-gray-700">
                Active Users
              </Label>
              <Controller
                name="digitalAssetDetails.users.activeUsers"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.users.activeUsers"
                    type="number"
                    placeholder="Enter number of active users"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="digitalAssetDetails.users.subscribers" className="font-medium text-gray-700">
                Email Subscribers
              </Label>
              <Controller
                name="digitalAssetDetails.users.subscribers"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="digitalAssetDetails.users.subscribers"
                    type="number"
                    placeholder="Enter number of subscribers"
                    className="mt-1"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="digitalAssetDetails.users.userGrowthRate" className="font-medium text-gray-700">
              User Growth Rate
            </Label>
            <Controller
              name="digitalAssetDetails.users.userGrowthRate"
              control={control}
              render={({ field }) => (
                <Input 
                  id="digitalAssetDetails.users.userGrowthRate"
                  placeholder="e.g., 5% per month, 25% YoY"
                  className="mt-1"
                  {...field}
                />
              )}
            />
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Database</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="digitalAssetDetails.users.customerDatabase.size" className="font-medium text-gray-700">
                  Customer Database Size
                </Label>
                <Controller
                  name="digitalAssetDetails.users.customerDatabase.size"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="digitalAssetDetails.users.customerDatabase.size"
                      type="number"
                      placeholder="Number of customer records"
                      className="mt-1"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="digitalAssetDetails.users.customerDatabase.quality" className="font-medium text-gray-700">
                  Database Quality
                </Label>
                <Controller
                  name="digitalAssetDetails.users.customerDatabase.quality"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select database quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent (Verified, Detailed)</SelectItem>
                        <SelectItem value="good">Good (Mostly Complete)</SelectItem>
                        <SelectItem value="average">Average (Basic Information)</SelectItem>
                        <SelectItem value="poor">Poor (Incomplete/Outdated)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Controller
                name="digitalAssetDetails.users.customerDatabase.isTransferable"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    id="isDatabaseTransferable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isDatabaseTransferable" className="text-sm">
                Customer database is transferable with sale
              </Label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create a custom multi-select component for industry selection
  const MultiSelect = ({ options, selected, onChange, placeholder }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            {selected?.length
              ? `${selected.length} selected`
              : placeholder || "Select options..."}
            <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    const currentValues = [...(selected || [])];
                    const isSelected = currentValues.includes(option.value);
                    
                    if (isSelected) {
                      onChange(currentValues.filter(id => id !== option.value));
                    } else {
                      onChange([...currentValues, option.value]);
                    }
                  }}
                >
                  <Checkbox
                    checked={selected?.includes(option.value)}
                    className="mr-2"
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Create a custom tags input component
  const TagsInput = ({ tags = [], onTagsChange, placeholder, className }) => {
    const [inputValue, setInputValue] = useState('');
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        if (!tags.includes(inputValue.trim())) {
          onTagsChange([...tags, inputValue.trim()]);
        }
        setInputValue('');
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        onTagsChange(tags.slice(0, -1));
      }
    };
    
    return (
      <div className={`flex flex-wrap items-center border rounded-md px-3 py-2 ${className}`}>
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="m-1 flex items-center gap-1">
            {tag}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onTagsChange(tags.filter((_, i) => i !== index))}
            />
          </Badge>
        ))}
        <input
          type="text"
          className="flex-1 outline-none border-none bg-transparent text-sm min-w-[120px] py-1"
          placeholder={tags.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  };

  // Render the form navigation and actions
  const renderFormNavigation = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          <div className="hidden md:block">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {formSections.length}
            </span>
          </div>
          
          <Button
            variant="outline"
            onClick={goToNextStep}
            disabled={currentStep === formSections.length - 1}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">&#10227;</span>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Listing'
            ) : (
              'Submit Listing'
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Main render function
  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Form Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Listing' : 'Create New Listing'}
              </h1>
              <p className="text-gray-500">
                {isEditMode
                  ? 'Update your listing information'
                  : 'Fill in the details to create your listing'}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{formProgress}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </div>
          
          {/* Section Navigation Tabs */}
          <div className="mt-6 hidden md:block">
            <ScrollArea className="w-full whitespace-nowrap pb-3">
              <div className="flex gap-1">
                {formSections.map((section, index) => (
                  <Button
                    key={section.id}
                    variant={currentStep === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToStep(index)}
                    className={`px-3 py-1 rounded-full ${currentStep === index ? "bg-blue-600 text-white" : ""}`}
                  >
                    {section.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Form Error Alert */}
      {formError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {formError}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Draft Saved Notification */}
      {isDraftSaved && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <Alert variant="success">
            <Check className="h-4 w-4" />
            <AlertTitle>Draft Saved</AlertTitle>
            <AlertDescription>
              Your listing has been saved as a draft. You can continue editing or submit it later.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Form Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderFormSection()}
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onOpenChange={setOpenHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{helpContent.title}</DialogTitle>
            <DialogDescription>
              {helpContent.content}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      
      {/* Form Navigation */}
      {renderFormNavigation()}
    </div>
  );
};

export default ListingFormPage;