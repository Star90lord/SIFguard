import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<SubmitReport />} />
          <Route path="/analyze" element={<Navigate to="/submit" replace />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/review-queue" element={<Navigate to="/review" replace />} />
          <Route path="/actions" element={<Navigate to="/review" replace />} />
          <Route path="/action-tracking" element={<Navigate to="/review" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:reportId" element={<ReportDetail />} />
          <Route path="/report/:reportId" element={<ReportDetail />} />
          <Route path="/full-report/:reportId" element={<ReportDetail />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/sites/compare" element={<SiteComparison />} />
          <Route path="/compare" element={<Navigate to="/sites/compare" replace />} />
          <Route path="/site-comparison" element={<Navigate to="/sites/compare" replace />} />
          <Route path="/sites/:siteId" element={<SiteDetail />} />
          <Route path="/compare/hazard" element={<HazardComparison />} />
          <Route path="/hazard-comparison" element={<Navigate to="/compare/hazard" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
