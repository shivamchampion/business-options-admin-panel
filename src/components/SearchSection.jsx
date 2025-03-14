// components/SearchSection.jsx
import React from 'react';
import { Search, Filter } from 'lucide-react';

const SearchSection = () => {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 py-12">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Find the Perfect Business Opportunity
          </h1>
          
          <div className="relative">
            <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-300 focus-within:border-blue-500">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for businesses, franchises, startups..."
                  className="w-full pl-12 pr-4 py-4 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="hidden sm:flex items-center px-4 border-l border-gray-200">
                <Filter className="text-gray-400 mr-2" size={18} />
                <select className="appearance-none bg-transparent text-gray-700 py-3 focus:outline-none pr-8">
                  <option>All Categories</option>
                  <option>Businesses</option>
                  <option>Franchises</option>
                  <option>Startups</option>
                  <option>Investments</option>
                </select>
              </div>
              <button className="bg-gradient-to-r from-[#0031AC] to-[#0045AC] text-white px-6 py-4 font-medium hover:from-[#002798] hover:to-[#003D98] transition-all duration-200">
                Search
              </button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-gray-600 font-medium">Popular:</span>
              {['Tech Startups', 'Food Franchises', 'E-commerce', 'Healthcare', 'Education'].map((tag) => (
                <a 
                  key={tag}
                  href="#" 
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;