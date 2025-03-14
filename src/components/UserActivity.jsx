
// components/UserActivity.jsx
import React from 'react';
import { BarChart3 } from 'lucide-react';

const UserActivity = ({ activityData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3">Page</th>
            <th className="px-6 py-3">Visits</th>
            <th className="px-6 py-3">Interaction Rate</th>
            <th className="px-6 py-3">Conversion</th>
            <th className="px-6 py-3">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {activityData.map((activity, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                {activity.page}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.visits.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${activity.interaction}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">{activity.interaction}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.conversion}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <BarChart3 
                  size={20} 
                  className={index % 2 === 0 ? "text-green-500" : "text-amber-500"} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserActivity;
