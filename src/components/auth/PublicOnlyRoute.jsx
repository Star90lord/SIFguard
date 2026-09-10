import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';

/**
 * PublicOnlyRoute Component (Step 1 Foundation)
 *
 * Prevents already authenticated users from seeing the /login page,
 * redirecting them automatically to /dashboard or their intended previous route.
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return children;
}
