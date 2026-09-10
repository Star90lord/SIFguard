import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitReport from './pages/SubmitReport';
import Reports from './pages/Reports';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ReportDetail from './pages/ReportDetail';
import SiteComparison from './pages/SiteComparison';
import HazardComparison from './pages/HazardComparison';
import ReviewQueue from './pages/ReviewQueue';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route (Redirects to /dashboard if already authenticated) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          {/* Root Navigation */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitReport />
              </ProtectedRoute>
            }
          />
          <Route path="/analyze" element={<Navigate to="/submit" replace />} />
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <ReviewQueue />
              </ProtectedRoute>
            }
          />
          <Route path="/review-queue" element={<Navigate to="/review" replace />} />
          <Route path="/actions" element={<Navigate to="/review" replace />} />
          <Route path="/action-tracking" element={<Navigate to="/review" replace />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:reportId"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/full-report/:reportId"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites"
            element={
              <ProtectedRoute>
                <Sites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sites/compare"
            element={
              <ProtectedRoute>
                <SiteComparison />
              </ProtectedRoute>
            }
          />
          <Route path="/compare" element={<Navigate to="/sites/compare" replace />} />
          <Route path="/site-comparison" element={<Navigate to="/sites/compare" replace />} />
          <Route
            path="/sites/:siteId"
            element={
              <ProtectedRoute>
                <SiteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare/hazard"
            element={
              <ProtectedRoute>
                <HazardComparison />
              </ProtectedRoute>
            }
          />
          <Route path="/hazard-comparison" element={<Navigate to="/compare/hazard" replace />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
