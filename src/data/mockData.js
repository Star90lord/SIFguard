// src/data/mockData.js
// REAL DATA ONLY: All mock and demonstration datasets removed.
// All components query the live database through real backend APIs.

export const mockAnalysisResult = null;
export const mockSampleBatch = [];
export const mockReports = [];
export const mockTrends = {
  totalReports: 0,
  by_risk_level: {
    Low: 0,
    Medium: 0,
    High: 0,
    'SIF-Precursor': 0,
  },
  risk_trends: [],
  top_hazards: [],
  top_activities: [],
  barrier_failures: [],
  by_location: [],
};

export function addMockSite() {
  return null;
}

export function updateMockSite() {
  return null;
}

export function getMockSites() {
  return [];
}
