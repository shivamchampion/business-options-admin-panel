import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Info, AlertTriangle, 
  Upload, Plus, Trash2, Eye, X, HelpCircle, CheckCircle,
  MapPin, Building, DollarSign, Users, Briefcase, Calendar,
  PieChart, BarChart2, FileText, Globe, Store, ChevronDown,
  ChevronUp, Phone, Image
} from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { LISTING_TYPES, LISTING_STATUS } from '../config/constants';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { slugify, formatCurrency } from '../utils/helpers';

const AddListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get listing ID from URL if it exists
  const isEditMode = !!id;
  
  const { ListingService, IndustryService, LocationService } = useDatabase();
  const { userDetails } = useAuth();
  
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState({
    countries: [],
    states: [],
    cities: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageFiles, setImageFiles] = useState({
    featuredImage: null,
    galleryImages: []
  });
  const [imagePreview, setImagePreview] = useState({
    featuredImage: null,
    galleryImages: []
  });
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    contact: true,
    details: true,
    financials: true,
    operations: true,
    assets: true,
    sale: true,
    media: true
  });
  const [formProgress, setFormProgress] = useState(0);
  const [existingListing, setExistingListing] = useState(null);
  
  // Maximum number of steps in the form
  const MAX_STEPS = 5;
  
  // Fetch initial data (industries, countries)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch industries and countries in parallel
        const [industriesData, countriesData] = await Promise.all([
          IndustryService.getAllIndustries(),
          LocationService.getCountries()
        ]);
        
        setIndustries(industriesData);
        setLocations(prev => ({
          ...prev,
          countries: countriesData
        }));
        
        // If in edit mode, fetch the existing listing
        if (isEditMode) {
          const listingData = await ListingService.getListingById(id);
          
          if (!listingData) {
            setError('Listing not found');
            navigate('/listings');
            return;
          }
          
          setExistingListing(listingData);
          
          // Load states and cities for the existing listing
          if (listingData.location?.country) {
            const states = await LocationService.getStatesByCountry(listingData.location.country);
            setLocations(prev => ({
              ...prev,
              states
            }));
            
            if (listingData.location?.state) {
              const cities = await LocationService.getCitiesByState(listingData.location.state);
              setLocations(prev => ({
                ...prev,
                cities
              }));
            }
          }
          
          // Set image previews for existing media
          if (listingData.media?.featuredImage?.url) {
            setImagePreview(prev => ({
              ...prev,
              featuredImage: listingData.media.featuredImage.url
            }));
          }
          
          if (listingData.media?.galleryImages && listingData.media.galleryImages.length > 0) {
            setImagePreview(prev => ({
              ...prev,
              galleryImages: listingData.media.galleryImages.map(img => img.url)
            }));
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load initial data. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEditMode, navigate]);
  
  // Handle image uploads
  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type and size
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
    
    if (!isValidType) {
      setError('Please upload only JPEG, PNG, or WebP images.');
      return;
    }
    
    if (!isValidSize) {
      setError('Image file size should be less than 5MB.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (type === 'featuredImage') {
        setImageFiles(prev => ({ ...prev, featuredImage: file }));
        setImagePreview(prev => ({ ...prev, featuredImage: e.target.result }));
      } else if (type === 'galleryImages') {
        setImageFiles(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, file]
        }));
        setImagePreview(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, e.target.result]
        }));
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  // Remove gallery image
  const removeGalleryImage = (index) => {
    setImageFiles(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Instead of uploading, we'll store image data in base64 format
      // For a real application, you would upload these to storage
      
      // Prepare media data using the image previews (which are base64 strings)
      const media = {
        featuredImage: imagePreview.featuredImage ? {
          url: imagePreview.featuredImage, // In real app, this would be a storage URL
          path: `listings/${slugify(values.name)}/featured`, // This would be the storage path
          alt: values.name
        } : null,
        galleryImages: imagePreview.galleryImages.map((preview, i) => ({
          url: preview, // In real app, this would be a storage URL
          path: `listings/${slugify(values.name)}/gallery_${i}`, // This would be the storage path
          alt: `${values.name} - Image ${i + 1}`
        })),
        totalImages: imagePreview.galleryImages.length + (imagePreview.featuredImage ? 1 : 0)
      };
      
      // Prepare listing data with the media
      const listingData = {
        ...values,
        media,
        status: isEditMode ? existingListing.status : LISTING_STATUS.DRAFT
      };
      
      // Create or update the listing
      if (isEditMode) {
        await ListingService.updateListing(id, listingData);
        setSuccess(`Listing updated successfully!`);
      } else {
        await ListingService.createListing(listingData);
        setSuccess(`Listing created successfully! It will be reviewed by our team before being published.`);
      }
      
      setIsLoading(false);
      
      // Reset form and navigate back to listings after a delay
      setTimeout(() => {
        resetForm();
        navigate('/listings');
      }, 3000);
      
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} listing: ${err.message}`);
      setIsLoading(false);
      setSubmitting(false);
    }
  };
  
  // Calculate form progress based on filled fields
  const calculateProgress = (values) => {
    const requiredFields = [
      'name', 'type', 'description', 'industries', 
      'location.country', 'location.state', 'location.city'
    ];
    
    // Count filled required fields
    const filledRequiredFields = requiredFields.filter(field => {
      const fieldParts = field.split('.');
      let value = values;
      
      for (const part of fieldParts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          return false;
        }
      }
      
      // Check if the value is non-empty
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      return value !== null && value !== '';
    });
    
    // Calculate basic progress based on required fields
    let progress = (filledRequiredFields.length / requiredFields.length) * 50;
    
    // Add progress for type-specific fields
    if (values.type === LISTING_TYPES.BUSINESS) {
      const businessFields = [
        'businessDetails.businessType',
        'businessDetails.establishedYear',
        'businessDetails.sale.reasonForSelling'
      ];
      
      const filledBusinessFields = businessFields.filter(field => {
        const fieldParts = field.split('.');
        let value = values;
        
        for (const part of fieldParts) {
          if (value && value[part] !== undefined) {
            value = value[part];
          } else {
            return false;
          }
        }
        
        return value !== null && value !== '';
      });
      
      progress += (filledBusinessFields.length / businessFields.length) * 30;
    } else if (values.type === LISTING_TYPES.FRANCHISE) {
      const franchiseFields = [
        'franchiseDetails.franchiseType',
        'franchiseDetails.totalOutlets',
        'franchiseDetails.investment.investmentRange.min.value'
      ];
      
      const filledFranchiseFields = franchiseFields.filter(field => {
        const fieldParts = field.split('.');
        let value = values;
        
        for (const part of fieldParts) {
          if (value && value[part] !== undefined) {
            value = value[part];
          } else {
            return false;
          }
        }
        
        return value !== null && value !== '';
      });
      
      progress += (filledFranchiseFields.length / franchiseFields.length) * 30;
    }
    
    // Add progress for media
    if (imagePreview.featuredImage) {
      progress += 10;
    }
    
    if (imagePreview.galleryImages.length > 0) {
      progress += 10;
    }
    
    return Math.min(Math.round(progress), 100);
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Get states for the selected country
  const loadStatesForCountry = async (countryId) => {
    try {
      const states = await LocationService.getStatesByCountry(countryId);
      setLocations(prev => ({
        ...prev,
        states,
        cities: [] // Reset cities when country changes
      }));
    } catch (err) {
      setError('Failed to load states. Please try again.');
    }
  };
  
  // Get cities for the selected state
  const loadCitiesForState = async (stateId) => {
    try {
      const cities = await LocationService.getCitiesByState(stateId);
      setLocations(prev => ({
        ...prev,
        cities
      }));
    } catch (err) {
      setError('Failed to load cities. Please try again.');
    }
  };
  
  // Render steps navigation
  const renderStepsNav = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Listing' : 'Create New Listing'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/listings')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Listings
        </button>
      </div>
      
      <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`h-1 w-12 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <div className={`h-1 w-12 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            3
          </div>
          <div className={`h-1 w-12 ${currentStep > 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            4
          </div>
          <div className={`h-1 w-12 ${currentStep > 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            5
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${formProgress}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-600">{formProgress}%</span>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-2 text-xs text-gray-500">
        {currentStep === 1 && 'Basic Information'}
        {currentStep === 2 && 'Business Details'}
        {currentStep === 3 && 'Location & Contact'}
        {currentStep === 4 && 'Media & Gallery'}
        {currentStep === 5 && 'Review & Submit'}
      </div>
    </div>
  );
  
  // Show loading state while fetching listing data
  if (isEditMode && !existingListing && isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Edit Listing</h1>
          <button
            type="button"
            onClick={() => navigate('/listings')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Listings
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {renderStepsNav()}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Formik
        initialValues={isEditMode && existingListing ? {
          name: existingListing.name || '',
          type: existingListing.type || LISTING_TYPES.BUSINESS,
          description: existingListing.description || '',
          shortDescription: existingListing.shortDescription || '',
          industries: existingListing.industries || [],
          location: {
            country: existingListing.location?.country || 'india',
            state: existingListing.location?.state || '',
            city: existingListing.location?.city || '',
            address: existingListing.location?.address || '',
            pincode: existingListing.location?.pincode || ''
          },
          contactInfo: {
            email: existingListing.contactInfo?.email || userDetails?.email || '',
            phone: existingListing.contactInfo?.phone || '',
            alternatePhone: existingListing.contactInfo?.alternatePhone || '',
            website: existingListing.contactInfo?.website || '',
            contactName: existingListing.contactInfo?.contactName || userDetails?.displayName || '',
            preferredContactMethod: existingListing.contactInfo?.preferredContactMethod || 'email'
          },
          // Business-specific fields
          businessDetails: existingListing.businessDetails || {
            businessType: '',
            entityType: '',
            establishedYear: new Date().getFullYear() - 2,
            registrationNumber: '',
            gstNumber: '',
            panNumber: '',
            employees: {
              count: 0,
              fullTime: 0,
              partTime: 0
            },
            operations: {
              serviceAreas: [],
              operationalYears: 0
            },
            financials: {
              annualRevenue: {
                value: 0,
                currency: 'INR'
              },
              monthlyRevenue: {
                value: 0,
                currency: 'INR'
              },
              profitMargin: {
                percentage: 0
              },
              expenses: {
                rent: {
                  value: 0,
                  currency: 'INR'
                },
                payroll: {
                  value: 0,
                  currency: 'INR'
                },
                utilities: {
                  value: 0,
                  currency: 'INR'
                },
                marketing: {
                  value: 0,
                  currency: 'INR'
                },
                other: {
                  value: 0,
                  currency: 'INR'
                }
              }
            },
            assets: {
              inventory: {
                isIncluded: true,
                value: {
                  value: 0,
                  currency: 'INR'
                },
                description: ''
              },
              equipment: {
                isIncluded: true,
                value: {
                  value: 0,
                  currency: 'INR'
                },
                description: '',
                condition: 'good'
              },
              realEstate: {
                isIncluded: false,
                isOwned: false,
                isLeased: true,
                details: '',
                lease: {
                  monthlyRent: {
                    value: 0,
                    currency: 'INR'
                  }
                }
              }
            },
            sale: {
              askingPrice: {
                value: 0,
                currency: 'INR'
              },
              reasonForSelling: '',
              isNegotiable: true,
              sellerFinancing: {
                isAvailable: false
              },
              trainingAndSupport: {
                isSupportIncluded: true,
                trainingPeriod: '1 month'
              }
            },
            customers: {
              customerBase: '',
              keyAccounts: []
            }
          },
          // Franchise-specific fields
          franchiseDetails: existingListing.franchiseDetails || {
            franchiseType: '',
            totalOutlets: 0,
            companyOwnedUnits: 0,
            establishedYear: new Date().getFullYear() - 5,
            investment: {
              investmentRange: {
                min: {
                  value: 0,
                  currency: 'INR'
                },
                max: {
                  value: 0,
                  currency: 'INR'
                }
              },
              franchiseFee: {
                value: 0,
                currency: 'INR',
                isRefundable: false
              },
              royaltyFee: {
                percentage: 0
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
                  frequency: 'monthly'
                },
                marketingSupport: {
                  isAvailable: true
                }
              }
            }
          },
          agreeToTerms: true // Pre-checked for edit mode
        } : {
          name: '',
          type: LISTING_TYPES.BUSINESS,
          description: '',
          shortDescription: '',
          industries: [],
          location: {
            country: 'india', // Default to India
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
            preferredContactMethod: 'email'
          },
          // Business-specific fields
          businessDetails: {
            businessType: '',
            entityType: '',
            establishedYear: new Date().getFullYear() - 2, // Default to 2 years ago
            registrationNumber: '',
            gstNumber: '',
            panNumber: '',
            employees: {
              count: 0,
              fullTime: 0,
              partTime: 0
            },
            operations: {
              serviceAreas: [],
              operationalYears: 0
            },
            financials: {
              annualRevenue: {
                value: 0,
                currency: 'INR'
              },
              monthlyRevenue: {
                value: 0,
                currency: 'INR'
              },
              profitMargin: {
                percentage: 0
              },
              expenses: {
                rent: {
                  value: 0,
                  currency: 'INR'
                },
                payroll: {
                  value: 0,
                  currency: 'INR'
                },
                utilities: {
                  value: 0,
                  currency: 'INR'
                },
                marketing: {
                  value: 0,
                  currency: 'INR'
                },
                other: {
                  value: 0,
                  currency: 'INR'
                }
              }
            },
            assets: {
              inventory: {
                isIncluded: true,
                value: {
                  value: 0,
                  currency: 'INR'
                },
                description: ''
              },
              equipment: {
                isIncluded: true,
                value: {
                  value: 0,
                  currency: 'INR'
                },
                description: '',
                condition: 'good'
              },
              realEstate: {
                isIncluded: false,
                isOwned: false,
                isLeased: true,
                details: '',
                lease: {
                  monthlyRent: {
                    value: 0,
                    currency: 'INR'
                  }
                }
              }
            },
            sale: {
              askingPrice: {
                value: 0,
                currency: 'INR'
              },
              reasonForSelling: '',
              isNegotiable: true,
              sellerFinancing: {
                isAvailable: false
              },
              trainingAndSupport: {
                isSupportIncluded: true,
                trainingPeriod: '1 month'
              }
            },
            customers: {
              customerBase: '',
              keyAccounts: []
            }
          },
          // Franchise-specific fields
          franchiseDetails: {
            franchiseType: '',
            totalOutlets: 0,
            companyOwnedUnits: 0,
            establishedYear: new Date().getFullYear() - 5, // Default to 5 years ago
            investment: {
              investmentRange: {
                min: {
                  value: 0,
                  currency: 'INR'
                },
                max: {
                  value: 0,
                  currency: 'INR'
                }
              },
              franchiseFee: {
                value: 0,
                currency: 'INR',
                isRefundable: false
              },
              royaltyFee: {
                percentage: 0
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
                  frequency: 'monthly'
                },
                marketingSupport: {
                  isAvailable: true
                }
              }
            }
          },
          agreeToTerms: false
        }}
        onSubmit={handleSubmit}
        validate={(values) => {
          // Update form progress
          setFormProgress(calculateProgress(values));
          
          // Validation will be done with Yup schemas
          return {};
        }}
      >
        {(formik) => (
          <Form className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Basic Information</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Listing Name <span className="text-red-500">*</span>
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g., Premium Restaurant for Sale in Mumbai"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Listing Type <span className="text-red-500">*</span>
                      </label>
                      <Field
                        id="type"
                        name="type"
                        as="select"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                          formik.handleChange(e);
                        }}
                      >
                        {Object.entries(LISTING_TYPES).map(([key, value]) => (
                          <option key={key} value={value}>
                            {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="type" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>
                  
                  <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description (Summary) <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="shortDescription"
                      name="shortDescription"
                      as="textarea"
                      rows="2"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief overview of your listing (100-150 characters)"
                    />
                    <ErrorMessage name="shortDescription" component="div" className="text-red-500 text-xs mt-1" />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {formik.values.shortDescription.length}/150
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <Field
                      id="description"
                      name="description"
                      as="textarea"
                      rows="6"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide comprehensive details about your business, its strengths, unique features, and why someone should be interested"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1" />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {formik.values.description.length}/2000 (minimum 200 characters)
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="industries" className="block text-sm font-medium text-gray-700 mb-1">
                      Industries <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Field
                        id="industries"
                        name="industries"
                        as="select"
                        multiple
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      >
                        {industries.map(industry => (
                          <option key={industry.id} value={industry.id}>
                            {industry.name}
                          </option>
                        ))}
                      </Field>
                      <div className="text-xs text-gray-500 mt-1">
                        Hold Ctrl (or Cmd on Mac) to select multiple industries
                      </div>
                    </div>
                    <ErrorMessage name="industries" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      Next: Business Details
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Business Details</h2>
                
                {formik.values.type === LISTING_TYPES.BUSINESS && (
                  <div className="space-y-6">
                    {/* Business Type Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleSection('basic')}
                      >
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium">Basic Business Information</h3>
                        </div>
                        {expandedSections.basic ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      
                      {expandedSections.basic && (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="businessDetails.businessType" className="block text-sm font-medium text-gray-700 mb-1">
                                Business Type <span className="text-red-500">*</span>
                              </label>
                              <Field
                                id="businessDetails.businessType"
                                name="businessDetails.businessType"
                                as="select"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Type</option>
                                <option value="retail">Retail</option>
                                <option value="restaurant">Restaurant</option>
                                <option value="service">Service</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="ecommerce">E-Commerce</option>
                                <option value="technology">Technology</option>
                                <option value="education">Education</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="construction">Construction</option>
                                <option value="consulting">Consulting</option>
                                <option value="hospitality">Hospitality</option>
                                <option value="other">Other</option>
                              </Field>
                              <ErrorMessage name="businessDetails.businessType" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.entityType" className="block text-sm font-medium text-gray-700 mb-1">
                                Entity Type
                              </label>
                              <Field
                                id="businessDetails.entityType"
                                name="businessDetails.entityType"
                                as="select"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Entity Type</option>
                                <option value="sole_proprietorship">Sole Proprietorship</option>
                                <option value="partnership">Partnership</option>
                                <option value="llp">Limited Liability Partnership</option>
                                <option value="private_limited">Private Limited</option>
                                <option value="public_limited">Public Limited</option>
                                <option value="one_person_company">One Person Company</option>
                              </Field>
                              <ErrorMessage name="businessDetails.entityType" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.establishedYear" className="block text-sm font-medium text-gray-700 mb-1">
                                Established Year <span className="text-red-500">*</span>
                              </label>
                              <Field
                                id="businessDetails.establishedYear"
                                name="businessDetails.establishedYear"
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage name="businessDetails.establishedYear" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="businessDetails.registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Registration Number
                              </label>
                              <Field
                                id="businessDetails.registrationNumber"
                                name="businessDetails.registrationNumber"
                                type="text"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Business registration number"
                              />
                              <ErrorMessage name="businessDetails.registrationNumber" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.gstNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                GST Number
                              </label>
                              <Field
                                id="businessDetails.gstNumber"
                                name="businessDetails.gstNumber"
                                type="text"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="GST registration number"
                              />
                              <ErrorMessage name="businessDetails.gstNumber" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.panNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                PAN Number
                              </label>
                              <Field
                                id="businessDetails.panNumber"
                                name="businessDetails.panNumber"
                                type="text"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="PAN number"
                              />
                              <ErrorMessage name="businessDetails.panNumber" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Operations Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleSection('operations')}
                      >
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium">Operations & Team</h3>
                        </div>
                        {expandedSections.operations ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      
                      {expandedSections.operations && (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="businessDetails.employees.count" className="block text-sm font-medium text-gray-700 mb-1">
                                Total Employees
                              </label>
                              <Field
                                id="businessDetails.employees.count"
                                name="businessDetails.employees.count"
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage name="businessDetails.employees.count" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.employees.fullTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Full-Time Employees
                              </label>
                              <Field
                                id="businessDetails.employees.fullTime"
                                name="businessDetails.employees.fullTime"
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage name="businessDetails.employees.fullTime" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.employees.partTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Part-Time Employees
                              </label>
                              <Field
                                id="businessDetails.employees.partTime"
                                name="businessDetails.employees.partTime"
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage name="businessDetails.employees.partTime" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="businessDetails.operations.serviceAreas" className="block text-sm font-medium text-gray-700 mb-1">
                              Service Areas
                            </label>
                            <FieldArray name="businessDetails.operations.serviceAreas">
                              {({ push, remove, form }) => (
                                <div>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {form.values.businessDetails.operations.serviceAreas.map((area, index) => (
                                      <div key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center text-sm">
                                        {area}
                                        <button
                                          type="button"
                                          onClick={() => remove(index)}
                                          className="ml-2 text-blue-500 hover:text-blue-700"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                                      placeholder="Add a service area"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                          e.preventDefault();
                                          push(e.target.value.trim());
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                      onClick={(e) => {
                                        const input = e.target.previousSibling;
                                        if (input.value.trim()) {
                                          push(input.value.trim());
                                          input.value = '';
                                        }
                                      }}
                                    >
                                      <Plus size={20} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </FieldArray>
                            <div className="text-xs text-gray-500 mt-1">
                              Press Enter to add each service area (e.g., Mumbai, Maharashtra, Pan India)
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="businessDetails.operations.operationalYears" className="block text-sm font-medium text-gray-700 mb-1">
                              Years in Operation
                            </label>
                            <Field
                              id="businessDetails.operations.operationalYears"
                              name="businessDetails.operations.operationalYears"
                              type="number"
                              min="0"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage name="businessDetails.operations.operationalYears" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Financials Section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleSection('financials')}
                      >
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium">Financial Information</h3>
                        </div>
                        {expandedSections.financials ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      
                      {expandedSections.financials && (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="businessDetails.financials.annualRevenue.value" className="block text-sm font-medium text-gray-700 mb-1">
                                Annual Revenue (₹)
                              </label>
                              <Field
                                id="businessDetails.financials.annualRevenue.value"
                                name="businessDetails.financials.annualRevenue.value"
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Annual revenue in rupees"
                              />
                              <ErrorMessage name="businessDetails.financials.annualRevenue.value" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            
                            <div>
                              <label htmlFor="businessDetails.financials.monthlyRevenue.value" className="block text-sm font-medium text-gray-700 mb-1">
                                Monthly Revenue (₹)
                              </label>
                              <Field
                                id="businessDetails.financials.monthlyRevenue.value"
                                name="businessDetails.financials.monthlyRevenue.value"
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Monthly revenue in rupees"
                              />
                              <ErrorMessage name="businessDetails.financials.monthlyRevenue.value" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="businessDetails.financials.profitMargin.percentage" className="block text-sm font-medium text-gray-700 mb-1">
                              Profit Margin (%)
                            </label>
                            <Field
                              id="businessDetails.financials.profitMargin.percentage"
                              name="businessDetails.financials.profitMargin.percentage"
                              type="number"
                              min="0"
                              max="100"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Profit margin percentage"
                            />
                            <ErrorMessage name="businessDetails.financials.profitMargin.percentage" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                          
                          <div>
                            <p className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses (₹)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="businessDetails.financials.expenses.rent.value" className="block text-sm text-gray-600 mb-1">
                                  Rent
                                </label>
                                <Field
                                  id="businessDetails.financials.expenses.rent.value"
                                  name="businessDetails.financials.expenses.rent.value"
                                  type="number"
                                  min="0"
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="businessDetails.financials.expenses.payroll.value" className="block text-sm text-gray-600 mb-1">
                                  Payroll
                                </label>
                                <Field
                                  id="businessDetails.financials.expenses.payroll.value"
                                  name="businessDetails.financials.expenses.payroll.value"
                                  type="number"
                                  min="0"
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Rest of the component for different listing types */}
              </div>
            )}
            
            {/* Add other steps here */}
            
            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Review & Submit</h2>
                
                <div className="space-y-6">
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      Please review all information carefully before submitting. Once submitted, your listing will be reviewed by our team before being published.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-6">
                    {/* Basic Information Summary */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 font-medium">Basic Information</div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Listing Name</p>
                            <p className="text-sm">{formik.values.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Listing Type</p>
                            <p className="text-sm capitalize">{formik.values.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Short Description</p>
                          <p className="text-sm">{formik.values.shortDescription}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Media Preview */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 font-medium">Media</div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-4">
                          {imagePreview.featuredImage && (
                            <div className="relative">
                              <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br-lg">Featured</div>
                              <img 
                                src={imagePreview.featuredImage} 
                                alt="Featured Preview" 
                                className="w-24 h-24 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                          
                          {imagePreview.galleryImages.map((preview, index) => (
                            <img 
                              key={index}
                              src={preview} 
                              alt={`Gallery ${index + 1}`} 
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          ))}
                          
                          {!imagePreview.featuredImage && imagePreview.galleryImages.length === 0 && (
                            <p className="text-sm text-gray-500">No images uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and conditions */}
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Field
                        id="agreeToTerms"
                        name="agreeToTerms"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                        I confirm that all the information provided is accurate and I have the authority to list this business. I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                      </label>
                    </div>
                    <ErrorMessage name="agreeToTerms" component="div" className="text-red-500 text-xs" />
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formik.values.agreeToTerms}
                      className={`px-6 py-3 bg-blue-600 text-white rounded-md flex items-center ${
                        isLoading || !formik.values.agreeToTerms ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isEditMode ? 'Updating...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          {isEditMode ? 'Update Listing' : 'Submit Listing'}
                          <Check size={16} className="ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation between steps */}
            {currentStep === 2 && (
              <div className="p-6 pt-0 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Next: Location & Contact
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="p-6 pt-0 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Next: Media & Gallery
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            )}
            
            {currentStep === 4 && (
  <div className="p-6 pt-0 flex justify-between">
    <button
      type="button"
      onClick={() => setCurrentStep(3)}
      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
    >
      <ArrowLeft size={16} className="mr-2" />
      Back
    </button>
    <button
      type="button"
      onClick={() => setCurrentStep(5)}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
    >
      Next: Review & Submit
      <ArrowRight size={16} className="ml-2" />
    </button>
  </div>
)}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddListingPage;