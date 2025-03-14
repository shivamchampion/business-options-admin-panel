/**
 * Main App Component
 * Sets up authentication and routing for the application
 */
import React from 'react';
import AppRouter from './components/AppRouter';
import LoginPage from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { USER_ROLES } from './config/constants';
import './App.css';

function App() {
  const { currentUser, userDetails, loading, isAdmin } = useAuth();
  
  console.log("App rendering with:", { 
    currentUser: currentUser?.email, 
    userDetails, 
    loading,
    isAdmin: currentUser && userDetails ? isAdmin() : 'waiting for data'
  });
  
  // Show loading state
  if (loading || (currentUser && !userDetails)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is logged in and has admin privileges using the isAdmin function
  // For development purposes, we'll allow admin@businessoptions.in to access regardless of stored role
  const hasAdminAccess = currentUser && (
    isAdmin() || (import.meta.env.DEV && currentUser.email === 'admin@businessoptions.in')
  );
  
  // For easier debugging, log the authorization check
  if (currentUser && userDetails) {
    console.log('Authorization check:', {
      currentUser: currentUser.email,
      userRole: userDetails.role,
      adminRole: USER_ROLES.ADMIN,
      moderatorRole: USER_ROLES.MODERATOR,
      isAdmin: hasAdminAccess
    });
  }
  
  // Show login page if not authenticated or not an admin
  if (!hasAdminAccess) {
    return <LoginPage />;
  }
  
  // Show admin panel if authenticated and authorized
  return (
    <div className="app">
      <AppRouter />
    </div>
  );
}

export default App;