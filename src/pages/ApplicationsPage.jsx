// ApplicationsPage.jsx
import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, 
  MessageSquare, User, Briefcase, Calendar,
  MapPin, Phone, Mail, ChevronDown, ArrowRight,
  Eye, Check, X
} from 'lucide-react';

const ApplicationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Tab options
  const tabs = [
    { name: "All Applications", id: "all", count: 156 },
    { name: "New", id: "new", count: 42 },
    { name: "In Progress", id: "progress", count: 37 },
    { name: "Contacted", id: "contacted", count: 52 },
    { name: "Closed", id: "closed", count: 25 }
  ];
  
  // Status badge colors
  const statusColors = {
    "New": "bg-blue-100 text-blue-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    "Contacted": "bg-purple-100 text-purple-800",
    "Successful": "bg-green-100 text-green-800",
    "Closed": "bg-gray-100 text-gray-800",
    "Rejected": "bg-red-100 text-red-800"
  };
  
  // Mock application data
  const applications = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Applicant ${i + 1}`,
    email: `applicant${i + 1}@example.com`,
    phone: `+91 ${9876543210 - i}`,
    business: `Business Opportunity ${i + 1}`,
    type: i % 5 === 0 ? "Business" : i % 5 === 1 ? "Franchise" : i % 5 === 2 ? "Startup" : i % 5 === 3 ? "Investor" : "Digital Asset",
    status: i % 6 === 0 ? "New" : i % 6 === 1 ? "In Progress" : i % 6 === 2 ? "Contacted" : i % 6 === 3 ? "Successful" : i % 6 === 4 ? "Closed" : "Rejected",
    date: `2025-0${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 28) + 1}`,
    location: "Mumbai, India",
    investment: `₹${(Math.floor(Math.random() * 50) + 10)}L - ₹${(Math.floor(Math.random() * 50) + 60)}L`,
    notes: "Interested in exploring business opportunities in the tech sector. Looking for established businesses with good growth potential.",
    messages: Math.floor(Math.random() * 5)
  }));
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Applications & Inquiries</h2>
          <p className="text-sm text-gray-500">Manage user inquiries and instant applications</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search applications..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`text-xs font-medium px-4 py-3 whitespace-nowrap border-b-2 flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.name}
                  <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-280px)]">
            {applications.map((app) => (
              <button
                key={app.id}
                className={`w-full text-left p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                  selectedApp === app.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedApp(app.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{app.name}</p>
                      <p className="text-xs text-gray-500">{app.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[app.status]}`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{app.business}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{app.date}</span>
                  {app.messages > 0 && (
                    <div className="flex items-center">
                      <MessageSquare size={12} className="mr-1" />
                      <span>{app.messages}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {selectedApp ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-4">
                    {applications.find(a => a.id === selectedApp)?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {applications.find(a => a.id === selectedApp)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Application for {applications.find(a => a.id === selectedApp)?.business}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${
                  statusColors[applications.find(a => a.id === selectedApp)?.status]
                }`}>
                  {applications.find(a => a.id === selectedApp)?.status}
                </span>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Applicant Details</p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {applications.find(a => a.id === selectedApp)?.notes}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Business Interest</p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Briefcase size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.business}</span>
                        </div>
                        <div className="flex items-center">
                          <Filter size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">{applications.find(a => a.id === selectedApp)?.type}</span>
                        </div>
                        <div className="flex items-start">
                          <Calendar size={16} className="text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <span className="text-sm text-gray-800 block">Applied on {applications.find(a => a.id === selectedApp)?.date}</span>
                            <span className="text-xs text-gray-500">5 days ago</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ChevronDown size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-800">Investment Range: {applications.find(a => a.id === selectedApp)?.investment}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Activity Timeline</p>
                      <div className="space-y-3">
                        {[
                          { action: "Application submitted", time: "March 8, 2025 at 2:34 PM" },
                          { action: "Application reviewed by admin", time: "March 9, 2025 at 10:15 AM" },
                          { action: "Email sent to applicant", time: "March 9, 2025 at 11:30 AM" },
                          { action: "Applicant viewed email", time: "March 9, 2025 at 3:45 PM" }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
                            <div>
                              <p className="text-sm text-gray-800">{activity.action}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-800 mb-4">Communication</h4>
                  
                  <div className="space-y-4 mb-6">
                    {[
                      { 
                        sender: "System", 
                        message: "Application received for Business Opportunity 1. Awaiting review.",
                        time: "March 8, 2025 at 2:34 PM" 
                      },
                      { 
                        sender: "Admin", 
                        message: "Thank you for your interest in our business opportunity. We would like to schedule a call to discuss your application further.",
                        time: "March 9, 2025 at 11:30 AM" 
                      },
                      { 
                        sender: "Applicant", 
                        message: "Thank you for getting back to me. I'm available for a call tomorrow between 10 AM and 2 PM.",
                        time: "March 9, 2025 at 4:15 PM" 
                      }
                    ].map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.sender === 'Applicant' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-lg rounded-lg p-4 ${
                            message.sender === 'System' 
                              ? 'bg-gray-100 text-gray-700' 
                              : message.sender === 'Applicant'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{message.sender}</span>
                            <span className="text-xs opacity-70">{message.time}</span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      placeholder="Type a message..." 
                      className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm text-gray-700 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                    <div className="flex items-center justify-between p-3 border-t border-gray-200">
                      <div></div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center">
                        <span className="font-medium">Send Message</span>
                        <ArrowRight size={16} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm transition-colors">
                      <Eye size={16} />
                      <span className="font-medium">View Business</span>
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm transition-colors">
                      <MessageSquare size={16} />
                      <span className="font-medium">Send Email</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
                      <X size={16} />
                      <span className="font-medium">Reject</span>
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors">
                      <Check size={16} />
                      <span className="font-medium">Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Application Selected</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select an application from the list to view details, communicate with applicants, and manage their status.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;