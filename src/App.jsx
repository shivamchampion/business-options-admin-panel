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
  const { currentUser, userDetails, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is logged in and has admin privileges
  const isAdmin = currentUser && userDetails && (
    userDetails.role === USER_ROLES.ADMIN || 
    userDetails.role === USER_ROLES.MODERATOR
  );
  
  // Show login page if not authenticated or not an admin
  if (!isAdmin) {
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