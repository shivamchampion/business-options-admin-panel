/**
 * Main entry point for the React application
 * Sets up context providers and renders the App component
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import './index.css';

// Create root and render app with providers
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <DatabaseProvider>
        <App />
      </DatabaseProvider>
    </AuthProvider>
  </StrictMode>,
);