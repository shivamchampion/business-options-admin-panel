// Updated LoginPage.jsx to restrict access to only admin users

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS, USER_ROLES } from '../config/constants';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { login, resetPassword, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // First, authenticate the user
      const userCredential = await login(email, password);
      
      // Then check if the user has admin privileges
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      
      // Case-insensitive check for admin role
      const userRole = userData.role?.toLowerCase() || '';
      const adminRole = USER_ROLES.ADMIN.toLowerCase();
      const moderatorRole = USER_ROLES.MODERATOR.toLowerCase();
      
      console.log('Login role check:', {
        userRole,
        adminRole,
        moderatorRole
      });
      
      // Check if user has admin role
      if (userRole !== adminRole && userRole !== moderatorRole) {
        // Sign out the user if they're not an admin
        await logout();
        throw new Error('Access denied. Only administrators can log in to this panel.');
      }
      
      // If we get here, the user is an admin and will be redirected to the dashboard
      // by the AuthContext
      
    } catch (error) {
      setError(
        error.message === 'Access denied. Only administrators can log in to this panel.'
          ? error.message
          : error.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : error.code === 'auth/too-many-requests'
          ? 'Too many failed login attempts. Please try again later.'
          : 'Failed to sign in. Please check your credentials.'
      );
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setResetSent(true);
    } catch (error) {
      setError(
        error.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : 'Failed to send password reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            {/* Logo - replace with your actual logo */}
            <img 
              src="/src/logo.png" 
              alt="Business Options Logo" 
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800">
              {resetMode ? 'Reset Password' : 'Admin Login'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {resetMode 
                ? 'Enter your email to receive a reset link' 
                : 'Sign in to access the admin panel'}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-center gap-2 mb-4">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {resetSent && (
            <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4">
              <p className="text-sm">Password reset link has been sent to your email.</p>
            </div>
          )}
          
          {resetMode ? (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setResetMode(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••••"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Business Options Admin Panel &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;