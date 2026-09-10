import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';

/**
 * ProtectedRoute Component (Step 1 Foundation)
 *
 * Gating wrapper that ensures only authenticated users can access application pages.
 * Unauthenticated access attempts redirect to /login and preserve destination in location.state.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
