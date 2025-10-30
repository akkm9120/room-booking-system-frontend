import React from 'react';
import { Navigate } from 'react-router-dom';
import { useVisitorAuth } from '../contexts/VisitorAuthContext';

const VisitorProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useVisitorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/visitor/login" replace />;
  }

  return children;
};

export default VisitorProtectedRoute;