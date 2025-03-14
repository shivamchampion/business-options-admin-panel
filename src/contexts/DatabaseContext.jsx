/**
 * Database Context
 * Provides access to database services throughout the application
 */
import React, { createContext, useContext } from 'react';
import * as DatabaseServices from '../services/database';

// Create the context
const DatabaseContext = createContext();

/**
 * Hook for using the database context
 * @returns {Object} Database services
 */
export function useDatabase() {
  return useContext(DatabaseContext);
}

/**
 * Database Provider Component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export function DatabaseProvider({ children }) {
  // Expose all database services through the context
  const value = {
    ...DatabaseServices
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}