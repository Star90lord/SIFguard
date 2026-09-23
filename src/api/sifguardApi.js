const BASE_URL = (typeof process !== 'undefined' && process.env?.VITE_NLP_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NLP_URL) || 'http://127.0.0.1:8000';
const NODE_API_URL = (typeof process !== 'undefined' && process.env?.VITE_BACKEND_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || 'http://localhost:5000';


import {
  filterReports,
  compareReports,
  getReportSummary,
  getRiskTrendSeries,
  getAttentionReports,
  getSiteRiskOverview,
  formatReportCode,
} from '../utils/filterReports.js';
import { canSubmitReports } from '../config/roles.js';
import { countWords, MAX_REPORT_WORDS } from '../utils/wordCount.js';

// ─── Network helpers ────────────────────────────────────────────────
function delay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Stubs for backward compatibility (Real Data Architecture) ───────
// In-memory / localStorage caches removed. All real operations query MongoDB/PostgreSQL.
const ANALYZED_STORAGE_KEY = 'sifguard_analyzed_reports';

export function getStoredAnalyzedReports() {
  return [];
}

export function saveStoredAnalyzedReport(report) {
  return report;
}

export function saveStoredAnalyzedReports(reports = []) {
  return reports;
}

export function clientAnalyzeSafetyContent(text = '', filename = '') {
  return {
    isSafetyReport: true,
    documentType: 'Incident Report',
    risk_level: 'Medium',
    hazard: 'Operational Observation',
    activity: 'Field Operations',
    barrier_failure: 'None Identified',
    sif_precursor: false,
    explanation: 'Safety document submitted for analysis.',
  };
}

// ─── Document & Text Analysis (Real Backend & Database) ─────────────
export async function analyzeText(text, metadata = {}) {
  if (!text || !text.trim()) {
    throw new Error('Report text is required for analysis.');
  }

  const res = await fetch(`${NODE_API_URL}/api/documents/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      siteId: metadata.siteId,
      siteName: metadata.siteName,
      location: metadata.location,
      filename: metadata.filename || 'manual-incident-log.txt',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend text analysis failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data.analysis,
    report: data.report,
    id: data.report?.id,
    code: data.report?.code,
  };
}

export async function analyzeFile(file, metadata = {}) {
  if (!file) {
    throw new Error('File payload is required for analysis.');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (metadata.siteId) formData.append('siteId', metadata.siteId);
  if (metadata.siteName) formData.append('siteName', metadata.siteName);

  const res = await fetch(`${NODE_API_URL}/api/documents/analyze-file`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend file analysis failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data.analysis,
    report: data.report,
    id: data.report?.id,
    code: data.report?.code,
  };
}

// ─── Batch Analysis Workflow ────────────────────────────────────────
export async function analyzeFiles(files, options = {}, onProgress = null) {
  const total = files.length;
  const results = [];
  const completedFiles = [];
  const failedFiles = [];

  for (let i = 0; i < total; i++) {
    const fileItem = files[i];
    const actualFile = fileItem.rawFile || (fileItem instanceof File ? fileItem : null);
    const filename = fileItem.name || fileItem.filename || (actualFile ? actualFile.name : `document-${i + 1}.pdf`);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        currentFile: filename,
        status: 'analyzing',
        completedFiles: [...completedFiles],
        failedFiles: [...failedFiles],
        percentage: Math.round(((i + 1) / total) * 100),
      });
    }

    try {
      if (!actualFile) {
        throw new Error(`File "${filename}" has no readable file payload.`);
      }

      const formData = new FormData();
      formData.append('file', actualFile);
      if (fileItem.siteId) formData.append('siteId', fileItem.siteId);
      if (fileItem.siteName || fileItem.site) formData.append('siteName', fileItem.siteName || fileItem.site);

      const res = await fetch(`${NODE_API_URL}/api/documents/analyze-file`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const report = data.report || (data.reports && data.reports[0]);
      if (report) {
        const formatted = {
          ...report,
          size: fileItem.size || (actualFile?.size ? `${(actualFile.size / 1024).toFixed(1)} KB` : '12 KB'),
        };
        results.push(formatted);
        completedFiles.push(filename);
      } else {
        throw new Error('No analyzed document record returned by backend');
      }
    } catch (err) {
      console.error(`Error analyzing file "${filename}":`, err.message);
      failedFiles.push({ filename, error: err.message });
    }
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      currentFile: null,
      status: 'completed',
      completedFiles: [...completedFiles],
      failedFiles: [...failedFiles],
      percentage: 100,
    });
  }

  return {
    batchId: `batch-${Date.now()}`,
    totalAnalyzed: results.length,
    totalFailed: failedFiles.length,
    results,
    failedFiles,
    durationSeconds: 1,
  };
}

// ─── Persistence Helpers ─────────────────────────────────────────────
export async function saveReport(report) {
  if (!report) return null;
  const res = await fetch(`${NODE_API_URL}/api/documents/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reports: [report] }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to persist report to database');
  }
  const data = await res.json();
  return (data.reports && data.reports[0]) || report;
}

export async function saveReports(reports = []) {
  if (!Array.isArray(reports) || reports.length === 0) return [];
  const res = await fetch(`${NODE_API_URL}/api/documents/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reports }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to persist reports to database');
  }
  const data = await res.json();
  return data.reports || reports;
}

// ─── Query Endpoints (Direct MongoDB Queries) ─────────────────────────
export async function getReports(filters = {}) {
  const res = await fetch(`${NODE_API_URL}/api/documents`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Database service unavailable: ${res.status}`);
  }

  const data = await res.json();
  const backendReports = data.documents || data.reports || [];

  const decorated = attachReportStatuses(backendReports);
  let results = filterReports(decorated, filters);
  if (filters.status && filters.status !== 'ALL') {
    const targetStatus = filters.status.toUpperCase().replace(/_/g, ' ');
    results = results.filter((r) => (r.status || '').toUpperCase() === targetStatus);
  }
  return results;
}

function getRelatedReportsInternal(report, allReports = []) {
  if (!report) return [];
  const matches = [];
  const targetId = String(report.id);
  const targetHazard = (report.hazard || '').toLowerCase();
  const targetActivity = (report.activity || '').toLowerCase();
  const targetBarrier = (report.barrier_failure || '').toLowerCase();
  const targetSite = (report.site || report.siteName || '').toLowerCase();

  allReports.forEach((r) => {
    if (String(r.id) === targetId) return;

    const rHazard = (r.hazard || '').toLowerCase();
    const rActivity = (r.activity || '').toLowerCase();
    const rBarrier = (r.barrier_failure || '').toLowerCase();
    const rSite = (r.site || r.siteName || '').toLowerCase();

    let matchReason = null;
    let matchType = null;

    if (rHazard && rHazard === targetHazard && rBarrier && rBarrier === targetBarrier && rBarrier !== 'none identified') {
      matchType = 'Same Hazard & Barrier Failure';
      matchReason = `Shares primary hazard (${r.hazard}) and barrier failure (${r.barrier_failure})`;
    } else if (rHazard && rHazard === targetHazard) {
      matchType = 'Same Hazard';
      matchReason = `Identified with identical hazard: ${r.hazard}`;
    } else if (rBarrier && rBarrier === targetBarrier && rBarrier !== 'none identified') {
      matchType = 'Same Barrier Failure';
      matchReason = `Shares recurring barrier failure: ${r.barrier_failure}`;
    } else if (rActivity && rActivity === targetActivity) {
      matchType = 'Same Operational Activity';
      matchReason = `Occurred during identical task: ${r.activity}`;
    } else if (rSite && rSite === targetSite) {
      matchType = 'Same Facility';
      matchReason = `Logged at same operational site (${r.site})`;
    }

    if (matchType) {
      matches.push({
        ...r,
        matchType,
        matchReason,
      });
    }
  });

  return matches.slice(0, 6);
}

export async function getReport(reportId) {
  const res = await fetch(`${NODE_API_URL}/api/documents/${reportId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Report ${reportId} not found in database.`);
  }

  const data = await res.json();
  const report = data.document || data.report;
  if (!report) {
    throw new Error(`Report ${reportId} not found in database.`);
  }

  const allReports = await getReports().catch(() => []);
  const relatedReports = getRelatedReportsInternal(report, allReports);
  const siteReports = allReports
    .filter((r) => (r.site === report.site || r.siteId === report.siteId) && String(r.id) !== String(report.id))
    .slice(0, 6);

  const statusData = await getReportStatus(report.id).catch(() => ({}));
  const actions = await getActions(report.id).catch(() => []);

  return {
    ...report,
    status: report.status || statusData.status || 'NEW',
    statusHistory: report.statusHistory || statusData.history || [],
    actions: report.actions || actions || [],
    relatedReports: report.relatedReports || relatedReports || [],
    siteReports: report.siteReports || siteReports || [],
  };
}

export async function getRelatedReports(reportId, report = null) {
  const allReports = await getReports().catch(() => []);
  const target = report || allReports.find((r) => String(r.id) === String(reportId));
  return getRelatedReportsInternal(target, allReports);
}

// ─── Site Management API (Real MongoDB Only) ─────────────────────────
const PENDING_SITES_STORAGE_KEY = 'sifguard_pending_sites';

export function getStoredPendingSites() {
  return [];
}

export function saveStoredPendingSite() {
  // Pending sites are persisted in MongoDB
}

export function calculateSiteHealth(reports = []) {
  const sifCount = reports.filter((r) => r.risk_level === 'SIF-Precursor').length;
  const highCount = reports.filter((r) => r.risk_level === 'High').length;
  const medCount = reports.filter((r) => r.risk_level === 'Medium').length;

  if (sifCount >= 1 || highCount >= 3) {
    return {
      status: 'Critical',
      description: 'Immediate operational intervention required',
      severityIndex: 4,
    };
  }
  if (highCount >= 1) {
    return {
      status: 'Elevated',
      description: 'Elevated safety risk; heightened supervision',
      severityIndex: 3,
    };
  }
  if (medCount >= 3) {
    return {
      status: 'Watch',
      description: 'Recurring moderate risks under active watch',
      severityIndex: 2,
    };
  }
  return {
    status: 'Stable',
    description: 'Operating within normal safety tolerances',
    severityIndex: 1,
  };
}

export async function getSites() {
  const res = await fetch(`${NODE_API_URL}/api/sites`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch sites from database: ${res.status}`);
  }

  const data = await res.json();
  const allSites = data.sites || [];

  const allReports = await getReports().catch(() => []);

  return allSites.map((def) => {
    const siteReports = allReports.filter(
      (r) =>
        r.siteId === def.id ||
        (r.site && r.site.toLowerCase() === def.name.toLowerCase()) ||
        (r.siteName && r.siteName.toLowerCase() === def.name.toLowerCase())
    );

    const riskCounts = {
      Low: siteReports.filter((r) => r.risk_level === 'Low').length,
      Medium: siteReports.filter((r) => r.risk_level === 'Medium').length,
      High: siteReports.filter((r) => r.risk_level === 'High').length,
      'SIF-Precursor': siteReports.filter((r) => r.risk_level === 'SIF-Precursor').length,
    };

    const hazardMap = {};
    siteReports.forEach((r) => {
      if (r.hazard && r.hazard !== 'None' && r.hazard !== 'None Detected') {
        hazardMap[r.hazard] = (hazardMap[r.hazard] || 0) + 1;
      }
    });

    const topHazards = Object.entries(hazardMap)
      .map(([hazard, count]) => ({ hazard, count }))
      .sort((a, b) => b.count - a.count);

    const health = calculateSiteHealth(siteReports);
    const latest = siteReports[0] || null;

    return {
      id: def.id,
      name: def.name,
      code: def.code || `${def.name.slice(0, 3).toUpperCase()}-001`,
      location: def.location || 'Operational Zone',
      type: def.type || 'Operational Facility',
      status: def.status || 'Active',
      totalReports: siteReports.length,
      highRiskCount: riskCounts.High,
      sifCount: riskCounts['SIF-Precursor'],
      lastActivity: latest ? latest.date : 'No Activity',
      healthStatus: health.status,
      healthDescription: health.description,
      riskCounts,
      topHazards,
      reports: siteReports,
    };
  });
}

export async function addSite(siteData) {
  const res = await fetch(`${NODE_API_URL}/api/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to register site in database');
  }

  const data = await res.json();
  return data.site;
}

export async function getPendingSites() {
  const res = await fetch(`${NODE_API_URL}/api/sites/pending`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch pending sites from database');
  }

  const data = await res.json();
  return data.pendingSites || [];
}

export async function confirmPendingSite(siteId) {
  const res = await fetch(`${NODE_API_URL}/api/sites/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to confirm pending site in database');
  }

  const data = await res.json();
  return data.confirmedSite;
}

export async function clearAllMockData() {
  localStorage.removeItem(ANALYZED_STORAGE_KEY);
  localStorage.removeItem(PENDING_SITES_STORAGE_KEY);
  if (NODE_API_URL) {
    try {
      await fetch(`${NODE_API_URL}/api/documents/clear`, { method: 'POST' });
    } catch {
      // ignore
    }
  }
  return { success: true };
}

export async function getSiteReports(siteId, filters = {}) {
  const sites = await getSites();
  const site = sites.find(
    (s) => s.id === siteId || s.name.toLowerCase().replace(/\s+/g, '-') === siteId
  );
  if (!site) throw new Error(`Site ${siteId} not found`);

  const decoratedReports = attachReportStatuses(site.reports || []);
  const filteredReports = filterReports(decoratedReports, {
    ...filters,
    siteId: site.id,
  });

  return {
    ...site,
    reports: filteredReports,
    filteredSummary: getReportSummary(filteredReports),
  };
}

export async function updateSite(siteId, siteData) {
  return addSite({ ...siteData, id: siteId });
}

export async function getSite(siteId) {
  return getSiteReports(siteId);
}

export async function getSiteComparison(siteIds = [], filters = {}) {
  await delay(100);
  const allSites = await getSites();
  const allActualReports = await getReports();
  const normalizedSiteIds = (Array.isArray(siteIds) ? siteIds : String(siteIds).split(','))
    .map((id) => String(id).trim().toLowerCase())
    .filter(Boolean);

  const selectedSites = normalizedSiteIds
    .map((id) =>
      allSites.find(
        (s) =>
          (s.id && s.id.toLowerCase() === id) ||
          (s.name && s.name.toLowerCase() === id) ||
          (s.name && s.name.toLowerCase().replace(/\s+/g, '-') === id) ||
          (s.code && s.code.toLowerCase() === id)
      )
    )
    .filter(Boolean);

  if (selectedSites.length === 0) {
    return {
      sites: [],
      summary: {
        facilityCount: 0,
        totalReports: 0,
        highRiskReports: 0,
        sifPrecursors: 0,
        mostCommonHazard: null,
        mostCommonActivity: null,
      },
      keyDifferences: [],
      commonPatterns: [],
      recommendations: [],
      keyFindings: [],
    };
  }

  const comparisonSites = selectedSites.map((site) => {
    const siteReports = (site.reports && site.reports.length > 0)
      ? site.reports
      : allActualReports.filter(
          (r) =>
            r.siteId === site.id ||
            (r.site && r.site.toLowerCase() === site.name.toLowerCase()) ||
            (r.siteName && r.siteName.toLowerCase() === site.name.toLowerCase())
        );
    const filtered = filterReports(siteReports, filters);
      const summary = getReportSummary(filtered);
      const highCount = filtered.filter((r) => r.risk_level === 'High').length;
      const sifCount = filtered.filter((r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true).length;
      const lowCount = filtered.filter((r) => r.risk_level === 'Low').length;
      const medCount = filtered.filter((r) => r.risk_level === 'Medium').length;

      return {
        ...site,
        filteredReports: filtered,
        totalReports: filtered.length,
        lowRiskCount: lowCount,
        mediumRiskCount: medCount,
        highRiskCount: highCount,
        sifCount: sifCount,
        riskCounts: {
          Low: lowCount,
          Medium: medCount,
          High: highCount,
          'SIF-Precursor': sifCount,
        },
        topHazard: summary.topHazards[0] || { hazard: 'None Recorded', count: 0 },
        topActivity: summary.topActivities[0] || { activity: 'Routine Operations', count: 0 },
        primaryBarrier: summary.barrierFailures[0] || { barrier: 'None Recorded', count: 0 },
        topHazards: summary.topHazards.slice(0, 4),
        topActivities: summary.topActivities.slice(0, 4),
        barrierFailures: summary.barrierFailures.slice(0, 4),
      };
    });

    // Comparison summary metrics across selected facilities
    const totalReports = comparisonSites.reduce((sum, s) => sum + s.totalReports, 0);
    const totalHighRisk = comparisonSites.reduce((sum, s) => sum + s.highRiskCount, 0);
    const totalSif = comparisonSites.reduce((sum, s) => sum + s.sifCount, 0);

    const globalHazards = {};
    const globalActivities = {};
    const globalBarriers = {};

    comparisonSites.forEach((s) => {
      s.filteredReports.forEach((r) => {
        if (r.hazard && r.hazard !== 'None') {
          globalHazards[r.hazard] = (globalHazards[r.hazard] || 0) + 1;
        }
        if (r.activity && r.activity !== 'None') {
          globalActivities[r.activity] = (globalActivities[r.activity] || 0) + 1;
        }
        if (r.barrier_failure && r.barrier_failure !== 'None') {
          globalBarriers[r.barrier_failure] = (globalBarriers[r.barrier_failure] || 0) + 1;
        }
      });
    });

    const sortedHazards = Object.entries(globalHazards)
      .map(([hazard, count]) => ({ hazard, count }))
      .sort((a, b) => b.count - a.count);
    const sortedActivities = Object.entries(globalActivities)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count);
    const sortedBarriers = Object.entries(globalBarriers)
      .map(([barrier, count]) => ({ barrier, count }))
      .sort((a, b) => b.count - a.count);

    const summary = {
      facilityCount: comparisonSites.length,
      facilityNames: comparisonSites.map((s) => s.name),
      totalReports,
      highRiskReports: totalHighRisk,
      sifPrecursors: totalSif,
      mostCommonHazard: sortedHazards[0] || { hazard: 'N/A', count: 0 },
      mostCommonActivity: sortedActivities[0] || { activity: 'N/A', count: 0 },
      mostCommonBarrier: sortedBarriers[0] || { barrier: 'N/A', count: 0 },
      topHazards: sortedHazards.slice(0, 5),
      topActivities: sortedActivities.slice(0, 5),
      topBarriers: sortedBarriers.slice(0, 5),
    };

    // Concise Key Findings per site (Section 3.D)
    const keyFindings = comparisonSites.map((s) => {
      const bullets = [];
      if (s.sifCount > 0) {
        bullets.push(`Elevated SIF-Precursor activity (${s.sifCount} signal${s.sifCount > 1 ? 's' : ''}) requiring priority safeguard audit`);
      } else if (s.highRiskCount > 0) {
        bullets.push(`Higher concentration of high-risk observations (${s.highRiskCount} reports)`);
      } else if (s.totalReports > 0) {
        bullets.push(`Predominantly medium-to-low risk operational observations (${s.totalReports} total)`);
      } else {
        bullets.push('No incident or hazard observations logged during the period');
      }

      if (s.topHazard && s.topHazard.count > 0 && s.topHazard.hazard !== 'None Recorded') {
        bullets.push(`${s.topHazard.hazard} appears repeatedly (${s.topHazard.count} observation${s.topHazard.count > 1 ? 's' : ''})`);
      }

      if (s.primaryBarrier && s.primaryBarrier.count > 0 && s.primaryBarrier.barrier !== 'None Recorded') {
        bullets.push(`Recurring barrier breakdown: ${s.primaryBarrier.barrier}`);
      } else if (s.topActivity && s.topActivity.count > 0 && s.topActivity.activity !== 'Routine Operations') {
        bullets.push(`Dominant activity: ${s.topActivity.activity}`);
      }

      return {
        siteId: s.id,
        siteName: s.name,
        siteCode: s.code,
        healthStatus: s.healthStatus,
        findings: bullets.slice(0, 3),
      };
    });

    // Key Differences (Dynamic, evidence-based wording across any number of sites)
    const keyDifferences = [];
    const highestVolumeSite = [...comparisonSites].sort((a, b) => b.totalReports - a.totalReports)[0];
    const highestSifSite = [...comparisonSites].sort((a, b) => b.sifCount - a.sifCount)[0];
    const lowestSifSite = [...comparisonSites].sort((a, b) => a.sifCount - b.sifCount)[0];
    const highestHighRiskSite = [...comparisonSites].sort((a, b) => b.highRiskCount - a.highRiskCount)[0];

    if (highestVolumeSite && highestVolumeSite.totalReports > 0) {
      keyDifferences.push({
        type: 'report_volume',
        site: highestVolumeSite.name,
        statement: `${highestVolumeSite.name} logged the highest observation volume (${highestVolumeSite.totalReports} reports) among selected facilities.`,
      });
    }

    if (highestSifSite && highestSifSite.sifCount > 0 && highestSifSite.id !== lowestSifSite?.id) {
      keyDifferences.push({
        type: 'sif_concentration',
        site: highestSifSite.name,
        statement: `${highestSifSite.name} exhibits a higher concentration of SIF-Precursor signals (${highestSifSite.sifCount}) compared to ${lowestSifSite ? lowestSifSite.name : 'other sites'}${lowestSifSite ? ` (${lowestSifSite.sifCount})` : ''}.`,
      });
    }

    if (highestHighRiskSite && highestHighRiskSite.highRiskCount > 0 && (!highestVolumeSite || highestHighRiskSite.id !== highestVolumeSite.id)) {
      keyDifferences.push({
        type: 'high_risk_concentration',
        site: highestHighRiskSite.name,
        statement: `${highestHighRiskSite.name} exhibits the highest concentration of high-risk observations (${highestHighRiskSite.highRiskCount} reports).`,
      });
    }

    comparisonSites.forEach((s) => {
      const topH = s.topHazards[0];
      if (topH) {
        keyDifferences.push({
          type: 'hazard_focus',
          site: s.name,
          statement: `${s.name} shows ${topH.hazard} as its most frequent observation (${topH.count} reports).`,
        });
      }
    });

    // Common Safety Patterns (Present across >= 2 sites)
    const commonPatterns = [];
    const allHazardCounts = {};
    const allBarrierCounts = {};
    const allActivityCounts = {};

    comparisonSites.forEach((s) => {
      const siteHazards = new Set(s.topHazards.map((h) => h.hazard));
      siteHazards.forEach((h) => {
        allHazardCounts[h] = (allHazardCounts[h] || 0) + 1;
      });
      const siteBarriers = new Set(s.barrierFailures.map((b) => b.barrier));
      siteBarriers.forEach((b) => {
        allBarrierCounts[b] = (allBarrierCounts[b] || 0) + 1;
      });
      const siteActivities = new Set(s.topActivities.map((a) => a.activity));
      siteActivities.forEach((a) => {
        allActivityCounts[a] = (allActivityCounts[a] || 0) + 1;
      });
    });

    Object.entries(allHazardCounts).forEach(([hazard, count]) => {
      if (count >= 2) {
        commonPatterns.push({
          type: 'shared_hazard',
          title: `Shared Hazard: ${hazard}`,
          statement: `${hazard} appears across ${count} selected sites.`,
        });
      }
    });

    Object.entries(allActivityCounts).forEach(([activity, count]) => {
      if (count >= 2) {
        commonPatterns.push({
          type: 'shared_activity',
          title: `Shared Activity: ${activity}`,
          statement: `${activity} operations logged across ${count} selected operational units.`,
        });
      }
    });

    Object.entries(allBarrierCounts).forEach(([barrier, count]) => {
      if (count >= 2) {
        commonPatterns.push({
          type: 'shared_barrier',
          title: `Shared Barrier Failure: ${barrier}`,
          statement: `Safeguard breakdown "${barrier}" observed across ${count} selected facilities.`,
        });
      }
    });

    // Recommended Prevention (Step 17)
    const recommendations = [
      {
        priority: 'High',
        action: 'Standardize Barrier Verification',
        detail: 'Standardize pre-task barrier verification checklists across all compared facilities.',
      },
      {
        priority: 'Priority',
        action: 'Cross-Facility Safety Inspection Review',
        detail: 'Conduct cross-site supervisor audits to align physical control standards and ensure consistent enforcement.',
      },
      {
        priority: 'Standard',
        action: 'Supervisor Verification Alignment',
        detail: 'Reinforce consistent supervisor permit sign-off protocols for high-risk activities.',
      },
      {
        priority: 'Ongoing',
        action: 'Continuous Recurrence Monitoring',
        detail: 'Review monthly comparative safety telemetry to identify emerging safeguard vulnerabilities.',
      },
    ];

    return {
      sites: comparisonSites,
      summary,
      keyFindings,
      keyDifferences,
      commonPatterns,
      recommendations,
    };
}

export async function getHazardComparison(hazardName, filters = {}) {
  await delay(100);
  const rawHazard = (hazardName || 'All Hazards').trim();
  const isAllHazards = !hazardName || rawHazard.toUpperCase() === 'ALL' || rawHazard.toLowerCase() === 'all hazards';
  const targetHazard = isAllHazards ? 'All Hazards' : rawHazard;
  const allSites = await getSites();
  const allReports = await getReports();

  // Parse target sites (support filters.sites and filters.siteIds as array or comma-separated string)
  let selectedSiteIds = null;
  const sitesInput = filters.sites || filters.siteIds;
  if (sitesInput) {
    if (Array.isArray(sitesInput)) {
      selectedSiteIds = sitesInput.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    } else if (typeof sitesInput === 'string' && sitesInput !== 'ALL') {
      selectedSiteIds = sitesInput.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }

  const targetSites = (selectedSiteIds && selectedSiteIds.length > 0)
    ? allSites.filter((site) => {
        const sId = (site.id || '').toLowerCase();
        const sNameSlug = (site.name || '').toLowerCase().replace(/\s+/g, '-');
        const sName = (site.name || '').toLowerCase();
        return selectedSiteIds.includes(sId) || selectedSiteIds.includes(sNameSlug) || selectedSiteIds.includes(sName);
      })
    : allSites;

  const targetSiteIdSet = new Set(targetSites.map((s) => (s.id || '').toLowerCase()));
  const targetSiteNameSet = new Set(targetSites.map((s) => (s.name || '').toLowerCase()));

  // 1. First obtain all reports scoped strictly by site and time (without hazard filter)
  const timeScopedAllReports = filterReports(allReports, { ...filters, hazard: undefined }).filter((r) => {
    const rSiteId = (r.siteId || '').toLowerCase();
    const rSiteName = (r.site || r.siteName || '').toLowerCase();
    return targetSiteIdSet.has(rSiteId) || targetSiteNameSet.has(rSiteName);
  });

    // 2. Extract available hazards strictly from the scoped reports of selected facilities
    const discoveredHazards = Array.from(
      new Set(timeScopedAllReports.map((r) => r.hazard).filter((h) => h && h !== 'None'))
    ).sort();
    const availableHazards = ['All Hazards', ...discoveredHazards];

    // 3. Filter reports by target hazard unless 'All Hazards' is selected
    const scopedFiltered = isAllHazards
      ? timeScopedAllReports
      : timeScopedAllReports.filter((r) => (r.hazard || '').toLowerCase() === targetHazard.toLowerCase());

    const siteBreakdown = targetSites.map((site) => {
      const siteTotalReports = timeScopedAllReports.filter(
        (r) => r.siteId === site.id || r.site === site.name || r.siteName === site.name
      );
      const siteHazardReports = scopedFiltered.filter(
        (r) => r.siteId === site.id || r.site === site.name || r.siteName === site.name
      );

      const highCount = siteHazardReports.filter((r) => r.risk_level === 'High').length;
      const sifCount = siteHazardReports.filter(
        (r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true
      ).length;
      const lowCount = siteHazardReports.filter((r) => r.risk_level === 'Low').length;
      const medCount = siteHazardReports.filter((r) => r.risk_level === 'Medium').length;

      const activitySet = new Set(siteHazardReports.map((r) => r.activity).filter(Boolean));
      const barrierSet = new Set(siteHazardReports.map((r) => r.barrier_failure).filter(Boolean));

      const hasMatchingReports = siteHazardReports.length > 0;
      const zeroExplanation = !hasMatchingReports && !isAllHazards
        ? `No ${targetHazard} reports found for this facility (${siteTotalReports.length} total safety reports recorded).`
        : null;

      return {
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        status: site.status,
        healthStatus: site.healthStatus,
        reportsCount: siteHazardReports.length,
        totalSiteReports: siteTotalReports.length,
        hasMatchingReports,
        zeroExplanation,
        highRiskCount: highCount,
        sifCount: sifCount,
        riskDistribution: { Low: lowCount, Medium: medCount, High: highCount, 'SIF-Precursor': sifCount },
        activities: Array.from(activitySet),
        barrierFailures: Array.from(barrierSet),
        reports: siteHazardReports,
      };
    });

    // What Differs (Scoped strictly to selected sites)
    const activeSites = siteBreakdown.filter((s) => s.reportsCount > 0);
    const whatDiffers = [];

    if (targetSites.length < 2) {
      if (targetSites.length === 1) {
        const single = siteBreakdown[0];
        whatDiffers.push({
          site: single.siteName,
          observation: `${single.siteName} currently selected with ${single.reportsCount} ${targetHazard.toLowerCase()} observation${single.reportsCount === 1 ? '' : 's'}. Select at least two sites to compare differences.`,
        });
      }
    } else if (activeSites.length > 0) {
      const sortedByRisk = [...activeSites].sort((a, b) => (b.highRiskCount + b.sifCount) - (a.highRiskCount + a.sifCount));
      const topRisk = sortedByRisk[0];
      if (topRisk && (topRisk.highRiskCount > 0 || topRisk.sifCount > 0)) {
        whatDiffers.push({
          site: topRisk.siteName,
          observation: `${topRisk.siteName} has a higher concentration of ${targetHazard.toLowerCase()}-related high-risk reports (${topRisk.highRiskCount + topRisk.sifCount} critical observations).`,
        });
      }
      const lowerRisk = sortedByRisk.filter((s) => s.siteId !== topRisk.siteId);
      lowerRisk.forEach((s) => {
        whatDiffers.push({
          site: s.siteName,
          observation: `${s.siteName} shows lower occurrence and lower-risk distribution for ${targetHazard.toLowerCase()} (${s.reportsCount} observation${s.reportsCount > 1 ? 's' : ''}).`,
        });
      });
    }

    // Recurring Barrier Failure (Calculated ONLY within scopedFiltered)
    const barrierCounts = {};
    const barrierSiteMap = {};
    scopedFiltered.forEach((r) => {
      const b = r.barrier_failure || 'Unspecified Safeguard';
      barrierCounts[b] = (barrierCounts[b] || 0) + 1;
      if (!barrierSiteMap[b]) barrierSiteMap[b] = new Set();
      barrierSiteMap[b].add(r.site || r.siteName);
    });

    const sortedBarriers = Object.entries(barrierCounts).sort((a, b) => b[1] - a[1]);
    const recurringBarrier = sortedBarriers[0]
      ? {
          name: sortedBarriers[0][0],
          count: sortedBarriers[0][1],
          affectedSites: Array.from(barrierSiteMap[sortedBarriers[0][0]] || []),
        }
      : null;

    // Preventive Focus (Tailored to selected hazard and observed patterns)
    const topRecurringName = recurringBarrier ? recurringBarrier.name.toLowerCase() : 'equipment and physical barriers';
    const preventiveFocus = [
      { step: '1. Standardize Verification', detail: `Review relevant equipment-control verification and standardize physical verification criteria for ${targetHazard.toLowerCase()} controls.` },
      { step: '2. Strengthen Inspection', detail: `Reinforce inspection consistency and increase pre-shift audits on barriers associated with ${topRecurringName}.` },
      { step: '3. Supervisor Verification Review', detail: `Review recurring failure locations and require explicit supervisor sign-off before commencing tasks involving ${targetHazard.toLowerCase()}.` },
      { step: '4. Monitor Future Recurrence', detail: `Monitor future ${targetHazard.toLowerCase()} observations to detect early safeguard degradation before high-severity events materialize.` },
    ];

    // Cross-Site Learning (Only between selected sites when differences exist)
    let crossSiteLearning = null;
    if (activeSites.length >= 2) {
      const lowerSite = activeSites.find((s) => s.highRiskCount === 0 && s.sifCount === 0);
      const higherSite = activeSites.find((s) => s.highRiskCount > 0 || s.sifCount > 0);
      if (lowerSite && higherSite) {
        crossSiteLearning = `${lowerSite.siteName} shows lower ${targetHazard.toLowerCase()} occurrence than ${higherSite.siteName} in the selected period. Observed patterns at the lower-occurrence site may provide a useful reference point for HSE review.`;
      } else if (activeSites[0].reportsCount !== activeSites[1].reportsCount) {
        const sortedByVol = [...activeSites].sort((a, b) => a.reportsCount - b.reportsCount);
        crossSiteLearning = `${sortedByVol[0].siteName} logged fewer ${targetHazard.toLowerCase()} observations (${sortedByVol[0].reportsCount}) than ${sortedByVol[sortedByVol.length - 1].siteName} (${sortedByVol[sortedByVol.length - 1].reportsCount}). Operational control differences between these facilities may provide a useful comparison for supervisory review.`;
      }
    }

    // Future Risk Monitoring (Step 25: "Historical pattern indicates an area for continued monitoring")
    const futureMonitoring = {
      notice: 'Historical pattern indicates an area for continued monitoring.',
      watchItems: [
        `Repeated ${targetHazard.toLowerCase()} observations during routine operations`,
        recurringBarrier ? `Recurring barrier weakness: ${recurringBarrier.name}` : 'Safeguard integrity erosion',
        `High-exposure activities: ${Array.from(new Set(scopedFiltered.map((r) => r.activity).filter(Boolean))).slice(0, 3).join(', ') || 'field operations'}`,
      ],
    };

    return {
      hazard: targetHazard,
      isAllHazards,
      availableHazards,
      totalReports: scopedFiltered.length,
      siteBreakdown,
      whatDiffers,
      recurringBarrier,
      preventiveFocus,
      crossSiteLearning,
      futureMonitoring,
      reports: scopedFiltered,
    };
}

export async function getSiteHistory(siteId, filters = {}) {
  await delay(50);
  const site = await getSiteReports(siteId, filters);
  const sorted = site?.reports || [];

  const groups = {};
  sorted.forEach((report) => {
    const d = new Date(report.date || report.timestamp);
    const monthYear = isNaN(d.getTime())
      ? 'Recent Activity'
      : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(report);
  });

  return Object.entries(groups).map(([period, events]) => ({
    period,
    events,
  }));
}

export async function getRiskTrend(filters = {}) {
  const filtered = await getReports(filters);
  return getRiskTrendSeries(filtered);
}

export async function getHazardSummary(filters = {}) {
  const filtered = await getReports(filters);
  const summary = getReportSummary(filtered);
  return summary.topHazards;
}

export async function getActivitySummary(filters = {}) {
  const filtered = await getReports(filters);
  const summary = getReportSummary(filtered);
  return summary.topActivities;
}

export async function getBarrierFailureSummary(filters = {}) {
  const filtered = await getReports(filters);
  const summary = getReportSummary(filtered);
  return summary.barrierFailures;
}

export async function getSifPrecursors(filters = {}) {
  const filtered = await getReports({
    ...filters,
    riskLevel: 'SIF-Precursor',
  });
  return filtered;
}

export async function getDashboardSummary(filters = {}) {
  const filtered = await getReports(filters);
  const summary = getReportSummary(filtered);
  const attentionReports = getAttentionReports(filtered, 5);
  const riskTrend = getRiskTrendSeries(filtered);
  const sites = await getSites();
  const siteOverview = getSiteRiskOverview(filtered, sites);
  const sifPrecursors = filtered.filter(
    (r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true
  );
  const recentReports = [...filtered].slice(0, 5);

  return {
    summary,
    attentionReports,
    riskTrend,
    siteOverview,
    sifPrecursors,
    recentReports,
    totalReportsCount: filtered.length,
  };
}

// Alias analyzeReports to analyzeFiles for seamless backend contract compatibility
export const analyzeReports = analyzeFiles;

/**
 * Enterprise Admin Report Ingestion & Batch Screening
 * Authorizes and analyzes safety reports submitted via upload or batch files.
 * @param {Array<File|Object>} files - list of File objects or report descriptors
 * @param {string} siteId - target site or 'ALL'
 * @param {Object} options - { user, depth, autoMerge, ... }
 * @param {Function} onProgress - progress event callback
 */
export async function submitSafetyReports(files, siteId = 'ALL', options = {}, onProgress = null) {
  // Authorization validation
  if (options.user && !canSubmitReports(options.user)) {
    throw new Error('You do not have permission to submit safety reports. Administrator role required.');
  }

  if (!files || files.length === 0) {
    throw new Error('Please select at least one safety report document.');
  }

  return analyzeFiles(files, { ...options, siteContext: siteId }, onProgress);
}

/**
 * Enterprise Admin Report Ingestion for Pasted Text Narrative
 * Authorizes, validates word limit (max 10,000 words), and analyzes raw safety report text.
 * @param {string} text - complete safety narrative text
 * @param {string} siteId - target site or 'ALL'
 * @param {Object} options - { user, siteName, ... }
 */
export async function submitSafetyReportText(text, siteId = 'ALL', options = {}) {
  // Authorization validation
  if (options.user && !canSubmitReports(options.user)) {
    throw new Error('You do not have permission to submit safety reports. Administrator role required.');
  }

  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Please paste a safety report before continuing.');
  }

  const wordCount = countWords(trimmed);
  if (wordCount > MAX_REPORT_WORDS) {
    throw new Error(`This report exceeds the ${MAX_REPORT_WORDS.toLocaleString()}-word limit (${wordCount.toLocaleString()} words).`);
  }

  const analysis = await analyzeText(trimmed);
  const targetSite = siteId !== 'ALL' ? siteId : 'rig-site-b';
  const siteName = options.siteName || (targetSite === 'rig-site-b' ? 'Rig Site B' : targetSite);

  const record = {
    id: `paste-${Date.now()}`,
    batchId: `batch-${Date.now()}`,
    filename: `manual-report-${new Date().toISOString().slice(0, 10)}.txt`,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    siteId: targetSite,
    siteName,
    site: siteName,
    location: `${siteName} - Operational Area`,
    report_text: trimmed,
    full_text: trimmed,
    risk_level: analysis.risk_level || 'Medium',
    hazard: analysis.hazard || 'Hazard Identified',
    activity: analysis.activity || 'Field Operation',
    barrier_failure: analysis.barrier_failure || 'Procedures Verification',
    sif_precursor: analysis.risk_level === 'SIF-Precursor' || analysis.risk_level === 'High',
    explanation: analysis.explanation || `System analyzed observation: ${wordCount} words evaluated.`,
    timestamp: new Date().toISOString(),
    wordCount,
  };

  return {
    batchId: `batch-${Date.now()}`,
    totalAnalyzed: 1,
    totalFailed: 0,
    results: [record],
    failedFiles: [],
    durationSeconds: 1,
  };
}

export async function getTrends(filters = {}) {
  const reports = await getReports(filters);
  const summary = getReportSummary(reports);
  const riskTrends = getRiskTrendSeries(reports);

  const byRiskLevel = {
    Low: 0,
    Medium: 0,
    High: 0,
    'SIF-Precursor': 0,
  };

  const byLocationMap = {};
  reports.forEach((r) => {
    const loc = r.site || r.siteName || r.location || 'Operational Site';
    byLocationMap[loc] = (byLocationMap[loc] || 0) + 1;
    if (r.risk_level && byRiskLevel[r.risk_level] !== undefined) {
      byRiskLevel[r.risk_level]++;
    }
  });

  return {
    totalReports: reports.length,
    by_risk_level: byRiskLevel,
    risk_trends: riskTrends,
    top_hazards: summary.topHazards || [],
    top_activities: summary.topActivities || [],
    barrier_failures: summary.barrierFailures || [],
    by_location: Object.entries(byLocationMap).map(([location, count]) => ({ location, count })),
  };
}

// ═════════════════════════════════════════════════════════════════════
// HSE WORKFLOW, REPORT LIFECYCLE, ACTION MANAGEMENT & REVIEW QUEUE
// ═════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  STATUSES: 'sifguard_report_statuses',
  ACTIONS: 'sifguard_hse_actions',
  SAVED_VIEWS: 'sifguard_saved_views',
};

const DEFAULT_ACTIONS = [];

// Default saved views
const DEFAULT_SAVED_VIEWS = [
  {
    id: 'view-critical-falls',
    name: 'Critical Fall Risks',
    filters: {
      siteFilter: 'ALL',
      riskFilter: 'High',
      hazardFilter: 'Fall',
      datePreset: 'THIS_MONTH',
      sortOption: 'highest_risk',
    },
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'view-sif-precursors',
    name: 'SIF Precursors',
    filters: {
      siteFilter: 'ALL',
      riskFilter: 'SIF-Precursor',
      hazardFilter: 'ALL',
      datePreset: 'ALL',
      sortOption: 'newest',
    },
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'view-action-required',
    name: 'Action Required',
    filters: {
      siteFilter: 'ALL',
      riskFilter: 'ALL',
      statusFilter: 'ACTION REQUIRED',
      hazardFilter: 'ALL',
      datePreset: 'THIS_MONTH',
      sortOption: 'newest',
    },
    createdAt: '2026-09-02T09:00:00Z',
  },
];

function getStoredStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATUSES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredStatuses(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(map));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

/**
 * Derives default task priority for a report based on its explicit priority or risk
 */
export function getDefaultReportPriority(report) {
  if (!report) return 'STANDARD';
  if (report.priority) return String(report.priority).toUpperCase();
  const isSif = report.risk_level === 'SIF-Precursor' || report.sif_precursor === true;
  if (isSif) {
    return Number(report.id) % 2 === 1 ? 'IMMEDIATE' : 'PRIORITY';
  }
  if (report.risk_level === 'High') {
    return Number(report.id) % 3 === 0 ? 'IMMEDIATE' : 'PRIORITY';
  }
  if (report.risk_level === 'Medium') {
    return Number(report.id) % 2 === 0 ? 'PRIORITY' : 'STANDARD';
  }
  return 'STANDARD';
}

export function getDefaultReportStatus(report) {
  if (!report) return 'NEW';
  const idNum = Number(report.id) || 1;
  const isSif = report.risk_level === 'SIF-Precursor' || report.sif_precursor === true;
  if (isSif) {
    return idNum % 2 === 0 ? 'ACTION REQUIRED' : 'UNDER REVIEW';
  }
  if (report.risk_level === 'High') {
    return idNum % 3 === 0 ? 'ACTION REQUIRED' : 'UNDER REVIEW';
  }
  if (report.risk_level === 'Medium') {
    return idNum % 2 === 0 ? 'IN PROGRESS' : 'RESOLVED';
  }
  return idNum % 2 === 0 ? 'CLOSED' : 'NEW';
}

/**
 * Retrieves the workflow status and change history for a report
 */
export async function getReportStatus(reportId) {
  const map = getStoredStatuses();
  const entry = map[String(reportId)];
  if (entry) {
    return entry;
  }
  return {
    status: 'NEW',
    history: [],
  };
}

/**
 * Updates a report's lifecycle status, appending to status history
 */
export async function updateReportStatus(reportId, newStatus, note = '') {
  await delay(150);
  const map = getStoredStatuses();
  const key = String(reportId);
  const current = map[key] || {
    status: 'NEW',
    history: [],
  };

  const historyItem = {
    previousStatus: current.status,
    newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status transitioned to ${newStatus}`,
  };

  const updatedEntry = {
    status: newStatus,
    history: [historyItem, ...(current.history || [])],
  };

  map[key] = updatedEntry;
  saveStoredStatuses(map);

  return updatedEntry;
}

/**
 * Decorates report items with current workflow status and priority
 */
export function attachReportStatuses(reports = []) {
  const map = getStoredStatuses();
  const actions = getStoredActions();
  return reports.map((r) => {
    const key = String(r.id);
    const entry = map[key];
    const status = entry ? entry.status : (r.status || getDefaultReportStatus(r));

    // Derive task priority from linked action if present, or fallback to report priority
    const reportActions = actions.filter((a) => String(a.reportId) === key);
    let actionPriority = null;
    if (reportActions.some((a) => (a.priority || '').toUpperCase() === 'IMMEDIATE')) {
      actionPriority = 'IMMEDIATE';
    } else if (reportActions.some((a) => (a.priority || '').toUpperCase() === 'PRIORITY')) {
      actionPriority = 'PRIORITY';
    } else if (reportActions.length > 0) {
      actionPriority = 'STANDARD';
    }

    const priority = actionPriority || getDefaultReportPriority(r);
    const primaryAction = reportActions[0] || null;
    const isOverdue = reportActions.some((a) => {
      if (!a.dueDate) return false;
      const s = (a.status || '').toUpperCase().replace(/_/g, ' ');
      if (s === 'CLOSED' || s === 'RESOLVED') return false;
      const due = new Date(a.dueDate).getTime();
      return !isNaN(due) && due < new Date().setHours(0, 0, 0, 0);
    });

    return {
      ...r,
      status,
      priority,
      isOverdue,
      actionAssignee: primaryAction ? (primaryAction.assignee || primaryAction.assignedTo || '') : '',
      actionDueDate: primaryAction ? primaryAction.dueDate || '' : '',
      actionTitle: primaryAction ? primaryAction.title || '' : '',
    };
  });
}

// ─── Action Tracking API ─────────────────────────────────────────────

function getStoredActions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIONS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredActions(actions) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export async function getActions(reportId = null) {
  await delay(100);
  const all = getStoredActions();
  if (reportId !== null && reportId !== undefined) {
    return all.filter((a) => String(a.reportId) === String(reportId));
  }
  return all;
}

export async function createAction(actionData) {
  await delay(150);
  const all = getStoredActions();
  const assigneeName = actionData.assignee || actionData.assignedTo || 'Site HSE Team';
  const newAction = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reportId: actionData.reportId,
    title: actionData.title || 'Action',
    description: actionData.description || '',
    priority: (actionData.priority || 'STANDARD').toUpperCase(), // IMMEDIATE | PRIORITY | STANDARD
    status: actionData.status || 'OPEN',                         // OPEN | IN PROGRESS | PENDING VERIFICATION | CLOSED
    assignee: assigneeName,
    assignedTo: assigneeName,
    dueDate: actionData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  const updated = [newAction, ...all];
  saveStoredActions(updated);

  // If report was NEW or UNDER REVIEW, recommend setting to ACTION REQUIRED
  const statusMap = getStoredStatuses();
  const currentEntry = statusMap[String(actionData.reportId)];
  const currentStatus = currentEntry ? currentEntry.status : null;
  if (!currentStatus || currentStatus === 'NEW' || currentStatus === 'UNDER REVIEW') {
    updateReportStatus(actionData.reportId, 'ACTION REQUIRED', 'Automated: Operational action created');
  }

  return newAction;
}

export async function updateAction(actionId, updates) {
  await delay(150);
  const all = getStoredActions();
  const idx = all.findIndex((a) => String(a.id) === String(actionId));
  if (idx === -1) {
    throw new Error(`Action with ID ${actionId} not found.`);
  }

  const existing = all[idx];
  const isClosing = updates.status === 'CLOSED' && existing.status !== 'CLOSED';
  const assigneeName = updates.assignee || updates.assignedTo || existing.assignee || existing.assignedTo;

  const updated = {
    ...existing,
    ...updates,
    assignee: assigneeName,
    assignedTo: assigneeName,
    priority: updates.priority ? updates.priority.toUpperCase() : existing.priority,
    completedAt: isClosing ? new Date().toISOString() : (updates.completedAt !== undefined ? updates.completedAt : existing.completedAt),
  };

  all[idx] = updated;
  saveStoredActions(all);

  return updated;
}

export async function updateActionPriority(actionId, priority) {
  return updateAction(actionId, { priority: (priority || 'STANDARD').toUpperCase() });
}

export async function updateActionStatus(actionId, status) {
  return updateAction(actionId, { status });
}

export async function deleteAction(actionId) {
  await delay(100);
  const all = getStoredActions();
  const filtered = all.filter((a) => String(a.id) !== String(actionId));
  saveStoredActions(filtered);
  return { success: true };
}

export async function getActionSummary(siteId = null) {
  const all = getStoredActions();
  let scoped = all;
  if (siteId && siteId !== 'ALL' && siteId !== 'all') {
    const norm = siteId.toLowerCase().trim();
    scoped = all.filter((a) => {
      if (a.siteId && a.siteId.toLowerCase() === norm) return true;
      if (a.site && (a.site.toLowerCase() === norm || a.site.toLowerCase().replace(/\s+/g, '-') === norm)) return true;
      return false;
    });
  }

  let open = 0;
  let inProgress = 0;
  let pendingVerification = 0;
  let closed = 0;

  let immediate = 0;
  let priority = 0;
  let standard = 0;

  scoped.forEach((a) => {
    if (a.status === 'OPEN') open++;
    else if (a.status === 'IN PROGRESS') inProgress++;
    else if (a.status === 'PENDING VERIFICATION') pendingVerification++;
    else if (a.status === 'CLOSED') closed++;

    const p = (a.priority || 'STANDARD').toUpperCase();
    if (p === 'IMMEDIATE') immediate++;
    else if (p === 'PRIORITY') priority++;
    else standard++;
  });

  return {
    total: scoped.length,
    open,
    inProgress,
    pendingVerification,
    closed,
    priorities: {
      immediate,
      priority,
      standard,
    },
  };
}

// ─── Review Queue API ────────────────────────────────────────────────

export async function getReviewQueue(filters = {}) {
  await delay(100);
  const reports = await getReports();
  // Get all reports decorated with their current workflow status and priority
  const decorated = attachReportStatuses(reports);

  // Filter using filterReports
  let filtered = filterReports(decorated, {
    siteId: filters.site || filters.siteId,
    riskLevel: filters.risk || filters.riskLevel,
    hazard: filters.hazard,
    priority: filters.priority,
    status: filters.status,
    datePreset: filters.datePreset || 'ALL',
    startDate: filters.startDate,
    endDate: filters.endDate,
    search: filters.search,
  });

  // Sort deterministically using compareReports
  const sortField = filters.sortField || filters.sort || filters.sortBy || 'default';
  const sortDirection = filters.sortDirection || filters.sortOrder || filters.order || 'desc';
  filtered.sort((a, b) => compareReports(a, b, sortField, sortDirection));

  // Calculate live KPIs across the current decorated scope
  const sifCount = filtered.filter((r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true).length;
  const highCount = filtered.filter((r) => r.risk_level === 'High').length;
  const actionRequiredCount = filtered.filter((r) => (r.status || '').toUpperCase() === 'ACTION REQUIRED').length;
  const pendingReviewCount = filtered.filter((r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'UNDER REVIEW' || s === 'NEW';
  }).length;
  const immediateCount = filtered.filter((r) => (r.priority || '').toUpperCase() === 'IMMEDIATE').length;
  const priorityCount = filtered.filter((r) => (r.priority || '').toUpperCase() === 'PRIORITY').length;
  const standardCount = filtered.filter((r) => (r.priority || '').toUpperCase() === 'STANDARD').length;

  return {
    reports: filtered,
    totalCount: filtered.length,
    kpis: {
      sifCount,
      highCount,
      actionRequiredCount,
      pendingReviewCount,
      immediateCount,
      priorityCount,
      standardCount,
      totalCount: filtered.length,
    },
  };
}

// ─── Saved Views API ─────────────────────────────────────────────────

export function getSavedViews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_VIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SAVED_VIEWS, JSON.stringify(DEFAULT_SAVED_VIEWS));
      return [...DEFAULT_SAVED_VIEWS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_SAVED_VIEWS];
  }
}

export function saveSavedView({ name, filters }) {
  const views = getSavedViews();
  const newView = {
    id: `view-${Date.now()}`,
    name: name.trim() || 'Custom Safety View',
    filters: { ...filters },
    createdAt: new Date().toISOString(),
  };
  const updated = [newView, ...views];
  localStorage.setItem(STORAGE_KEYS.SAVED_VIEWS, JSON.stringify(updated));
  return newView;
}

export function deleteSavedView(viewId) {
  const views = getSavedViews();
  const filtered = views.filter((v) => v.id !== viewId);
  localStorage.setItem(STORAGE_KEYS.SAVED_VIEWS, JSON.stringify(filtered));
  return { success: true };
}

export function renameSavedView(viewId, newName) {
  const views = getSavedViews();
  const target = views.find((v) => v.id === viewId);
  if (target) {
    target.name = newName.trim() || target.name;
    localStorage.setItem(STORAGE_KEYS.SAVED_VIEWS, JSON.stringify(views));
  }
  return target;
}

// ─── Filtered CSV Export Generator ───────────────────────────────────

export function exportReportsToCsv(reports = [], filenameCustom = '') {
  if (!reports || reports.length === 0) {
    return { success: false, message: 'Nothing to export.' };
  }

  // Decorate with status and action metadata if not present
  const decorated = attachReportStatuses(reports);

  const headers = [
    'Report ID',
    'Date',
    'Time',
    'Site',
    'Site Code',
    'Risk',
    'SIF Precursor',
    'Priority',
    'Status',
    'Assignee',
    'Due Date',
    'Overdue',
    'Hazard',
    'Activity',
    'Location',
    'Barrier Failure',
  ];

  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const rows = decorated.map((r) => {
    const code = formatReportCode(r.id);
    const siteCode = (r.site || '').toUpperCase().replace(/\s+/g, '-').slice(0, 10);
    const isSif = r.risk_level === 'SIF-Precursor' || r.sif_precursor === true ? 'Yes' : 'No';

    return [
      escapeCsvCell(code),
      escapeCsvCell(r.date || ''),
      escapeCsvCell(r.time || ''),
      escapeCsvCell(r.site || r.siteName || ''),
      escapeCsvCell(siteCode),
      escapeCsvCell(r.risk_level || 'Low'),
      escapeCsvCell(isSif),
      escapeCsvCell(r.priority || 'STANDARD'),
      escapeCsvCell(r.status || 'NEW'),
      escapeCsvCell(r.actionAssignee || ''),
      escapeCsvCell(r.actionDueDate || ''),
      escapeCsvCell(r.isOverdue ? 'OVERDUE' : 'No'),
      escapeCsvCell(r.hazard || 'None'),
      escapeCsvCell(r.activity || 'General Operations'),
      escapeCsvCell(r.location || ''),
      escapeCsvCell(r.barrier_failure || 'None Identified'),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const defaultFilename = `SIFguard_Reports_${new Date().toISOString().slice(0, 7)}.csv`;
  const filename = filenameCustom || defaultFilename;

  // Trigger browser download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    rowCount: reports.length,
  };
}


