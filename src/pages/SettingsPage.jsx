// pages/SettingsPage.jsx (Basic Stub)
import React from 'react';

const SettingsPage = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Settings</h2>
          <p className="text-sm text-gray-500">Configure your admin panel and website settings</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">General Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website Name
            </label>
            <input 
              type="text" 
              className="w-full max-w-md border border-gray-300 rounded-md py-2 px-3 text-sm"
              value="Business Options"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input 
              type="email" 
              className="w-full max-w-md border border-gray-300 rounded-md py-2 px-3 text-sm"
              value="admin@business-options.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select className="w-full max-w-md border border-gray-300 rounded-md py-2 px-3 text-sm">
              <option>(UTC+05:30) Asia/Kolkata</option>
              <option>(UTC+00:00) UTC</option>
              <option>(UTC-08:00) America/Los_Angeles</option>
              <option>(UTC-05:00) America/New_York</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select className="w-full max-w-md border border-gray-300 rounded-md py-2 px-3 text-sm">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;