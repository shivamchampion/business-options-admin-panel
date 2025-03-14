// components/StatsCards.jsx
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <div className="flex items-center mt-2">
                <ArrowUpRight size={14} className="text-green-500" />
                <span className="text-xs font-medium text-green-500 ml-1">{stat.change}</span>
                <span className="text-xs text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
            <div className={`bg-${stat.color}-50 p-3 rounded-lg`}>
              <stat.icon size={24} className={`text-${stat.color}-500`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;