/**
 * Main App Component
 * Sets up authentication and routing for the application
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { useAuth } from './contexts/AuthContext';
import { USER_ROLES } from './config/constants';
import './App.css';

function App() {
  const { currentUser, userDetails, loading, isAdmin } = useAuth();
  
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
  
  // Show admin panel with router, which includes the login page
  return (
    <div className="app">
      <BrowserRouter>
        <AppRouter isAuthenticated={hasAdminAccess} />
      </BrowserRouter>
    </div>
  );
}

export default App;