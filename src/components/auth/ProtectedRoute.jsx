import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import Unauthorized from '../../pages/Unauthorized';

/**
 * ProtectedRoute Component
 *
 * Guards routes with two levels of protection:
 *  1. Authentication — unauthenticated users are redirected to /login
 *  2. Authorization  — authenticated users without the required permission see a 403 page
 *
 * @param {Object} props
 * @param {string} [props.permission] - Required permission identifier (from PERMISSIONS)
 * @param {React.ReactNode} props.children - Route content to render when authorized
 */
export default function ProtectedRoute({ permission, children }) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();

  // Gate 1: Authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Gate 2: Authorization (if a permission is required)
  if (permission && !can(permission)) {
    return <Unauthorized />;
  }

  return children;
}
