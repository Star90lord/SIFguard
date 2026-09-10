import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import { PERMISSIONS } from './config/roles';
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

          {/* ── Protected Application Routes ─────────────────────────── */}

          {/* All roles: Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_DASHBOARD}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* All roles: Analyze Reports (submit restricted at action level) */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_ANALYZE_REPORTS}>
                <SubmitReport />
              </ProtectedRoute>
            }
          />
          <Route path="/analyze" element={<Navigate to="/submit" replace />} />

          {/* All roles: Review Queue */}
          <Route
            path="/review"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REVIEW_QUEUE}>
                <ReviewQueue />
              </ProtectedRoute>
            }
          />
          <Route path="/review-queue" element={<Navigate to="/review" replace />} />
          <Route path="/actions" element={<Navigate to="/review" replace />} />
          <Route path="/action-tracking" element={<Navigate to="/review" replace />} />

          {/* All roles: Safety Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:reportId"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/full-report/:reportId"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                <ReportDetail />
              </ProtectedRoute>
            }
          />

          {/* All roles: Sites Directory */}
          <Route
            path="/sites"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_SITES}>
                <Sites />
              </ProtectedRoute>
            }
          />

          {/* Admin + Manager: Site Comparison */}
          <Route
            path="/sites/compare"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_SITE_COMPARISON}>
                <SiteComparison />
              </ProtectedRoute>
            }
          />
          <Route path="/compare" element={<Navigate to="/sites/compare" replace />} />
          <Route path="/site-comparison" element={<Navigate to="/sites/compare" replace />} />

          {/* All roles: Site Detail (manage actions enforced at component level) */}
          <Route
            path="/sites/:siteId"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_SITES}>
                <SiteDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin + Manager: Hazard Comparison */}
          <Route
            path="/compare/hazard"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_HAZARD_COMPARISON}>
                <HazardComparison />
              </ProtectedRoute>
            }
          />
          <Route path="/hazard-comparison" element={<Navigate to="/compare/hazard" replace />} />

          {/* Admin only: Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Admin only: Admin console */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_ADMIN}>
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
