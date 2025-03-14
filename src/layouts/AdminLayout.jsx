// AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Store, Briefcase, TrendingUp,
    Database, Settings, BellRing, LogOut, Search, Menu,
    FileText, ChevronRight, Sun, Moon, Shield
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import the logo (you can change the path as needed)
import LogoImage from '../assets/logo.png';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Function to determine active tab based on current path
    const getActiveTabFromPath = (path) => {
        if (path === '/') return 'dashboard';
        return path.split('/')[1];
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromPath(location.pathname));

    // Update active tab when route changes
    useEffect(() => {
        setActiveTab(getActiveTabFromPath(location.pathname));
    }, [location.pathname]);

    const navItems = [
        {
            name: "Dashboard",
            icon: LayoutDashboard,
            id: "dashboard",
            path: "/"
        },
        {
            name: "User Roles",
            icon: Shield,
            id: "user-roles",
            path: "/user-roles"
        },
        {
            name: "Advisor Management",
            icon: Users,
            id: "advisors",
            path: "/advisors"
        },
        {
            name: "Listings",
            icon: Store,
            id: "listings",
            path: "/listings"
        },
        {
            name: "Applications",
            icon: FileText,
            id: "applications",
            path: "/applications"
        },
        {
            name: "Website Content",
            icon: Database,
            id: "content",
            path: "/content"
        },
        {
            name: "Analytics",
            icon: TrendingUp,
            id: "analytics",
            path: "/analytics"
        },
        {
            name: "Settings",
            icon: Settings,
            id: "settings",
            path: "/settings"
        }
    ];
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        // You can add logic here to apply dark mode to the entire app
    };
    
    const handleLogout = async () => {
        try {
            await logout();
            // Redirect to login page after successful logout
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Failed to log out. Please try again.');
        }
    };

    return (
        <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? 'w-72' : 'w-20'
                    } fixed h-full z-10 transition-all duration-300 ease-in-out 
        ${isDarkMode
                        ? 'bg-[#0031AC] text-white'
                        : 'bg-gradient-to-br from-[#0031AC] to-[#0045AC] text-white'
                    }`}
            >
        
    

{/* Logo & Toggle Section with optimal logo visibility */}
<div className="bg-white flex items-center justify-between p-3 h-16 border-b border-gray-200">
  {/* Logo Container - Centered and sized appropriately */}
  <div className={`flex-1 flex ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
    <div className="h-12 w-auto flex items-center justify-center overflow-visible">
      <img 
        src={LogoImage} 
        alt="Business Options Logo" 
        className={`object-contain max-h-full ${isSidebarOpen ? 'w-40' : 'w-12'}`}
      />
    </div>
  </div>
  
  {/* Toggle Button */}
  <button 
    onClick={toggleSidebar}
    className="text-[#0031AC] p-1.5 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
  >
    <Menu size={18} />
  </button>
</div>

                {/* Navigation Items */}
                <div className="px-3 py-6">
                    {isSidebarOpen && (
                        <div className="mb-4 px-3">
                            <p className="text-xs font-medium uppercase text-blue-200 opacity-80 tracking-wider">Main Menu</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center w-full py-3 px-4 rounded-lg
                  ${activeTab === item.id
                                        ? isDarkMode
                                            ? 'bg-blue-800/70 font-medium shadow-sm'
                                            : 'bg-white/15 font-medium shadow-sm'
                                        : 'hover:bg-white/10'
                                    } transition-all duration-200`}
                                onClick={() => setActiveTab(item.id)}
                            >
                                <div className={`flex items-center justify-center ${!isSidebarOpen ? 'mx-auto' : ''}`}>
                                    <item.icon size={18} className="text-white" />
                                </div>

                                {isSidebarOpen && (
                                    <div className="flex items-center justify-between flex-1 ml-3">
                                        <span className="text-sm">{item.name}</span>
                                        {activeTab === item.id && <ChevronRight size={14} className="text-blue-200" />}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Customization Section */}
                    {isSidebarOpen && (
                        <div className="mt-8 mb-4 px-3">
                            <p className="text-xs font-medium uppercase text-blue-200 opacity-80 tracking-wider">Customize</p>
                        </div>
                    )}

                    <button
                        className={`flex items-center text-white w-full py-3 px-4 rounded-lg
              hover:bg-white/10 transition-all duration-200 mt-1 ${!isSidebarOpen ? 'justify-center' : ''}`}
                        onClick={toggleDarkMode}
                    >
                        <div className="flex items-center justify-center">
                            {isDarkMode ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-white" />}
                        </div>
                        {isSidebarOpen && (
                            <span className="text-sm ml-3">
                                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        )}
                    </button>
                </div>

                {/* User Profile Section */}
                <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
                    {isSidebarOpen ? (
                        <div className="flex items-center mb-4 bg-white/10 p-3 rounded-lg">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0031AC] font-bold shadow-sm">
                                A
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">Admin User</p>
                                <p className="text-xs text-blue-200">admin@example.com</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0031AC] font-bold shadow-sm">
                                A
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <LogOut size={16} />
                        {isSidebarOpen && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300 ease-in-out`}>
                {/* Top Header */}
                <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b py-4 px-6 sticky top-0 z-10`}>
                    <div className="flex items-center justify-between">
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {navItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
                        </h1>

                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className={`pl-10 pr-4 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0031AC] focus:border-[#0031AC] w-64 transition-colors`}
                                />
                                <Search size={16} className={`absolute left-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                            </div>

                            <button className={`relative p-2 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-full transition-colors`}>
                                <BellRing size={20} />
                                <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                    3
                                </span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} min-h-[calc(100vh-65px)]`}>
                    <Outlet context={[isDarkMode, setIsDarkMode]} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;