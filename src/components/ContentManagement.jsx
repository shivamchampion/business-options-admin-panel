// components/ContentManagement.jsx
import React, { useState } from 'react';
import { Database, Edit, CheckSquare } from 'lucide-react';

const ContentManagement = () => {
  const [sections, setSections] = useState([
    { name: "Header & Navigation", active: true },
    { name: "Search Section", active: true },
    { name: "Featured Businesses", active: true },
    { name: "Popular Franchises", active: true },
    { name: "Trending Startups", active: false },
    { name: "Top Investors", active: true },
    { name: "Latest Digital Assets", active: false },
    { name: "Testimonials", active: true },
    { name: "Blog Posts", active: true },
    { name: "Newsletter Subscription", active: true },
    { name: "Footer", active: true }
  ]);

  const toggleSection = (index) => {
    const updatedSections = [...sections];
    updatedSections[index].active = !updatedSections[index].active;
    setSections(updatedSections);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Homepage Sections</h3>
      
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded">
                <Database size={16} className="text-blue-600" />
              </div>
              <span className="font-medium text-gray-800">{section.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id={`section-${index}`} 
                  checked={section.active}
                  onChange={() => toggleSection(index)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`section-${index}`} className="ml-2 text-sm text-gray-600">
                  {section.active ? 'Visible' : 'Hidden'}
                </label>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
          <CheckSquare size={16} />
          <span className="font-medium">Save Changes</span>
        </button>
      </div>
    </div>
  );
};

export default ContentManagement;