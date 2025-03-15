import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import UserRolesPage from '../pages/UserRolesPage';
import AdvisorManagementPage from '../pages/AdvisorManagementPage';
import ListingsPage from '../pages/ListingsPage';
import ListingFormPage from '../pages/ListingFormPage'; // Import the new form page
import UsersPage from '../pages/UsersPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ContentPage from '../pages/ContentPage';
import SettingsPage from '../pages/SettingsPage';

const AppRouter = ({ isAuthenticated }) => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Protected admin routes */}
      <Route path="/" element={
        isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<DashboardPage />} />
        <Route path="user-roles" element={<UserRolesPage />} />
        <Route path="advisors" element={<AdvisorManagementPage />} />
        
        {/* Listings routes */}
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/create" element={<ListingFormPage />} />
        <Route path="listings/edit/:id" element={<ListingFormPage />} />
        
        <Route path="users" element={<UsersPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all - redirect to login or dashboard based on authentication */}
      <Route path="*" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

export default AppRouter;