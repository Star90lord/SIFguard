import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SubmitReport from './pages/SubmitReport';
import Reports from './pages/Reports';
import SiteDetail from './pages/SiteDetail';
import DesignSystem from './pages/DesignSystem';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit" element={<SubmitReport />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/sites/:siteId" element={<SiteDetail />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
