// pages/ContentPage.jsx
import React, { useState } from 'react';
import { 
  CheckSquare, Database, Edit, ChevronDown,
  PlusCircle, 
} from 'lucide-react';
import ContentManagement from '../components/ContentManagement';

const ContentPage = () => {
  const [activeFeatured, setActiveFeatured] = useState({
    businesses: 4,
    franchises: 3,
    startups: 2,
    investors: 2
  });
  
  const [bannerSettings, setBannerSettings] = useState({
    enabled: true,
    text: "Special offer: 50% off on Premium listing for a limited time!",
    color: "blue"
  });
  
  const handleFeaturedChange = (key, value) => {
    setActiveFeatured({
      ...activeFeatured,
      [key]: parseInt(value)
    });
  };
  
  const handleBannerSettingChange = (key, value) => {
    setBannerSettings({
      ...bannerSettings,
      [key]: key === 'enabled' ? !bannerSettings.enabled : value
    });
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Website Content Management</h2>
          <p className="text-sm text-gray-500">Manage homepage content and featured listings</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
          <CheckSquare size={16} />
          <span className="font-medium">Save Changes</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentManagement />
          
          {/* Featured Listings Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Featured Listings Management</h3>
            
            <div className="space-y-4">
              {[
                { id: 1, name: "Tech Innovation Hub", type: "Business", featured: true },
                { id: 2, name: "Fast Food Franchise", type: "Franchise", featured: true },
                { id: 3, name: "E-commerce Platform", type: "Startup", featured: false },
                { id: 4, name: "Real Estate Investment", type: "Investor", featured: true },
                { id: 5, name: "SaaS Marketing Tool", type: "Digital Asset", featured: false }
              ].map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <Database size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{listing.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{listing.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`featured-${listing.id}`} 
                        checked={listing.featured}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`featured-${listing.id}`} className="ml-2 text-sm text-gray-600">
                        Featured
                      </label>
                    </div>
                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
              <PlusCircle size={16} />
              <span>Add Featured Listing</span>
            </button>
          </div>
          
          {/* Homepage Slider */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Homepage Slider</h3>
            
            <div className="space-y-4">
              {[
                { id: 1, title: "Discover Business Opportunities", active: true },
                { id: 2, title: "Explore Franchise Options", active: true },
                { id: 3, title: "Invest in Startups", active: false }
              ].map((slide) => (
                <div key={slide.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">Slide {slide.id}</span>
                      {slide.active && (
                        <span className="inline-flex text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Edit
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                        Remove
                      </button>
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-800 mb-2">{slide.title}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">Image</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Call to Action</p>
                        <p className="text-sm text-gray-700">Explore Now</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
              <PlusCircle size={16} />
              <span>Add Slide</span>
            </button>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Featured Content</h3>
            
            <div className="space-y-4 mb-6">
              {[
                { name: "Premium Businesses", key: "businesses", count: activeFeatured.businesses },
                { name: "Top Franchises", key: "franchises", count: activeFeatured.franchises },
                { name: "Recommended Startups", key: "startups", count: activeFeatured.startups },
                { name: "Featured Investors", key: "investors", count: activeFeatured.investors }
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{feature.name}</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <ChevronDown size={16} />
                    </button>
                    <select 
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md py-1 px-3"
                      value={feature.count}
                      onChange={(e) => handleFeaturedChange(feature.key, e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="font-semibold text-gray-800 mb-4">Banner Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Banner
                </label>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="promo-banner" 
                    checked={bannerSettings.enabled}
                    onChange={() => handleBannerSettingChange('enabled')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="promo-banner" className="ml-2 text-sm text-gray-600">
                    Enable promotion banner
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Text
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Enter banner text"
                  value={bannerSettings.text}
                  onChange={(e) => handleBannerSettingChange('text', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Color
                </label>
                <select 
                  className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-md py-2 px-3"
                  value={bannerSettings.color}
                  onChange={(e) => handleBannerSettingChange('color', e.target.value)}
                >
                  <option value="blue">Blue (Default)</option>
                  <option value="green">Green (Success)</option>
                  <option value="yellow">Yellow (Warning)</option>
                  <option value="red">Red (Important)</option>
                </select>
              </div>
              
              <div className="pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className={`bg-${bannerSettings.color}-100 border border-${bannerSettings.color}-200 text-${bannerSettings.color}-800 p-3 rounded-lg`}>
                  <p className="text-sm">{bannerSettings.text}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Enter page title"
                  value="Business Options - Find Your Next Business Opportunity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm h-20"
                  placeholder="Enter meta description"
                  value="Discover top business opportunities, franchises, startups, and investment options on Business Options. Find your next venture today!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="Enter keywords"
                  value="business opportunities, franchises, startups, investments, digital assets"
                />
                <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;