import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/DashboardPage';
import UserRolesPage from '../pages/UserRolesPage';
import AdvisorManagementPage from '../pages/AdvisorManagementPage';
import ListingsPage from '../pages/ListingsPage';
import UsersPage from '../pages/UsersPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ContentPage from '../pages/ContentPage';
import SettingsPage from '../pages/SettingsPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="user-roles" element={<UserRolesPage />} />
          <Route path="advisors" element={<AdvisorManagementPage />} />
          <Route path="listings" element={<ListingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;