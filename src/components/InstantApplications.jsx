// components/InstantApplications.jsx
import React from 'react';

const InstantApplications = ({ applications }) => {
  // Status badge colors
  const statusColors = {
    "New": "bg-blue-100 text-blue-800",
    "Contacted": "bg-purple-100 text-purple-800",
    "In Discussion": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800"
  };
  
  return (
    <div className="p-6 space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-800">{app.name}</h3>
            <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[app.status]}`}>
              {app.status}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{app.business}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Type: {app.type}</span>
            <span>{app.date}</span>
          </div>
          <div className="mt-3 flex justify-end space-x-2">
            <button className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded">
              Dismiss
            </button>
            <button className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
              Contact
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InstantApplications;
