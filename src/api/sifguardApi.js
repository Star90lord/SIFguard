const BASE_URL = 'http://localhost:8000';

// Toggle this to switch between mock and real API
const USE_MOCK = true;

// ─── Mock data imports ─────────────────────────────────────────────
import {
  mockReports,
  mockTrends,
  mockAnalysisResult,
  mockSampleBatch,
  getMockSites,
  addMockSite,
  updateMockSite,
} from '../data/mockData.js';
import {
  filterReports,
  compareReports,
  getReportSummary,
  getRiskTrendSeries,
  getAttentionReports,
  getSiteRiskOverview,
  formatReportCode,
} from '../utils/filterReports.js';

// ─── Mock helpers ───────────────────────────────────────────────────
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Real API helpers ───────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Single Report Analysis ─────────────────────────────────────────

export async function analyzeText(text) {
  if (USE_MOCK) {
    await delay(1000);
    // If text contains recognizable keywords, customize the result
    const lower = text.toLowerCase();
    if (lower.includes('confined') || lower.includes('tank')) {
      return {
        ...mockAnalysisResult,
        risk_level: 'SIF-Precursor',
        hazard: 'Confined Space',
        activity: 'Tank Cleaning',
        location: 'Rig Site A',
        barrier_failure: 'Atmospheric Monitoring',
        explanation: 'Confined space entry without verified atmospheric monitoring represents an immediate critical SIF precursor.',
      };
    }
    if (lower.includes('crane') || lower.includes('lift') || lower.includes('drop')) {
      return {
        ...mockAnalysisResult,
        risk_level: 'High',
        hazard: 'Dropped Object',
        activity: 'Lifting Operations',
        location: 'Rig Site A',
        barrier_failure: 'Rigging Inspection',
        explanation: 'Overhead lift with rigging defects poses immediate catastrophic dropped object danger.',
      };
    }
    return { ...mockAnalysisResult };
  }
  return request('/analyze/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function analyzeFile(file) {
  if (USE_MOCK) {
    await delay(1200);
    return { ...mockAnalysisResult };
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/analyze/file`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// ─── Batch Analysis Workflow ────────────────────────────────────────

/**
 * Analyzes multiple files sequentially or concurrently, emitting progress callbacks.
 * @param {Array<File|Object>} files - list of File objects or mock file items
 * @param {Object} options - { groupBySite: true, autoMerge: true, depth: 'standard' | 'detailed' }
 * @param {Function} onProgress - callback ({ current, total, currentFile, status, completedFiles })
 */
export async function analyzeFiles(files, options = {}, onProgress = null) {
  if (USE_MOCK) {
    const total = files.length;
    const results = [];
    const completedFiles = [];
    const failedFiles = [];

    // Deterministic matching to mock batch or generated reports
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const filename = file.name || file.filename || `report-0${i + 1}.pdf`;

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          currentFile: filename,
          status: 'analyzing',
          completedFiles: [...completedFiles],
          failedFiles: [...failedFiles],
          percentage: Math.round((i / total) * 100),
        });
      }

      await delay(450);

      // Check if this file simulates a failure (e.g. named fail or empty)
      if (filename.toLowerCase().includes('corrupt') || filename.toLowerCase().includes('error')) {
        failedFiles.push({
          id: `err-${Date.now()}-${i}`,
          filename,
          size: file.size ? `${(file.size / 1024).toFixed(0)} KB` : '12 KB',
          error: 'Unreadable document encoding or damaged PDF stream',
        });
        continue;
      }

      // Match sample batch if available, otherwise synthesize realistic safety record
      const sampleMatch = mockSampleBatch.find(
        (s) => s.filename.toLowerCase() === filename.toLowerCase()
      );

      let record;
      if (sampleMatch) {
        record = {
          ...sampleMatch,
          id: `batch-${Date.now()}-${i}`,
          batchId: `batch-${Date.now()}`,
          timestamp: new Date(`${sampleMatch.date}T10:00:00Z`).toISOString(),
        };
      } else {
        // Deterministically assign site based on filename or cyclic index
        const sites = ['Rig Site A', 'Rig Site B', 'Processing Unit', 'Warehouse', 'Workshop'];
        const assignedSite =
          filename.toLowerCase().includes('rig-a') || filename.toLowerCase().includes('rig_a')
            ? 'Rig Site A'
            : filename.toLowerCase().includes('rig-b') || filename.toLowerCase().includes('rig_b')
            ? 'Rig Site B'
            : filename.toLowerCase().includes('warehouse')
            ? 'Warehouse'
            : filename.toLowerCase().includes('processing')
            ? 'Processing Unit'
            : sites[i % sites.length];

        const severities = ['High', 'SIF-Precursor', 'Medium', 'Low'];
        const hazards = ['Fall', 'Confined Space', 'Dropped Object', 'Electrical', 'Vehicle Interaction'];
        const dates = ['2026-09-09', '2026-09-08', '2026-09-07', '2026-09-06'];

        const risk_level = severities[i % severities.length];
        const hazard = hazards[i % hazards.length];
        const date = dates[i % dates.length];

        record = {
          id: `batch-${Date.now()}-${i}`,
          batchId: `batch-${Date.now()}`,
          filename,
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.4 MB',
          date,
          site: assignedSite,
          location: `${assignedSite} - Operational Area`,
          report_text: `Automated safety observation from document ${filename}. Incident occurred during routine field activity at ${assignedSite}. Identified primary hazard: ${hazard}.`,
          risk_level,
          hazard,
          activity: 'Field Operations',
          barrier_failure: 'Operational Compliance',
          sif_precursor: risk_level === 'SIF-Precursor' || risk_level === 'High',
          explanation: `System classified report as ${risk_level} due to identified ${hazard} risks and potential barrier breakdown at ${assignedSite}.`,
          timestamp: new Date(`${date}T12:00:00Z`).toISOString(),
        };
      }

      results.push(record);
      completedFiles.push(filename);
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
      durationSeconds: Math.round(total * 0.45 + 1),
    };
  }

  // Real API implementation
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('options', JSON.stringify(options));

  const res = await fetch(`${BASE_URL}/analyze/batch`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Batch upload failed: ${res.status}`);
  }
  return res.json();
}

// ─── Query Endpoints ────────────────────────────────────────────────

export async function getReports(filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const decorated = attachReportStatuses(mockReports);
    let results = filterReports(decorated, filters);
    if (filters.status && filters.status !== 'ALL') {
      const targetStatus = filters.status.toUpperCase().replace(/_/g, ' ');
      results = results.filter((r) => (r.status || '').toUpperCase() === targetStatus);
    }
    return results;
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/reports${query ? `?${query}` : ''}`);
}

function getRelatedReportsInternal(report) {
  if (!report) return [];
  const matches = [];
  const targetId = String(report.id);
  const targetHazard = (report.hazard || '').toLowerCase();
  const targetActivity = (report.activity || '').toLowerCase();
  const targetBarrier = (report.barrier_failure || '').toLowerCase();
  const targetSite = (report.site || report.siteName || '').toLowerCase();

  mockReports.forEach((r) => {
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

  // Sort by relevance (hazard/barrier matches first)
  return matches.slice(0, 6);
}

export async function getReport(reportId) {
  if (USE_MOCK) {
    await delay(150);
    const targetStr = String(reportId).trim().toLowerCase();
    const targetNum = targetStr.replace(/\D/g, '');

    const report = mockReports.find((r) => {
      if (String(r.id).toLowerCase() === targetStr) return true;
      if (formatReportCode(r.id).toLowerCase() === targetStr) return true;
      if (r.code && r.code.toLowerCase() === targetStr) return true;
      const rNum = String(r.id).replace(/\D/g, '');
      if (targetNum && rNum && targetNum === rNum) return true;
      return false;
    });

    if (!report) throw new Error(`Report ${reportId} not found`);

    // Derived related safety patterns across data
    const relatedReports = getRelatedReportsInternal(report);

    // Recent events at the same site
    const siteReports = mockReports
      .filter((r) => (r.site === report.site || r.siteId === report.siteId) && String(r.id) !== String(report.id))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6);

    // Lifecycle status and change history
    const statusData = await getReportStatus(report.id);
    const actions = await getActions(report.id);

    return {
      ...report,
      status: statusData.status,
      statusHistory: statusData.history || [],
      actions,
      relatedReports,
      siteReports,
    };
  }
  return request(`/reports/${reportId}`);
}

export async function getRelatedReports(reportId, report = null) {
  if (USE_MOCK) {
    await delay(100);
    const baseReport = report || mockReports.find((r) => String(r.id) === String(reportId));
    return getRelatedReportsInternal(baseReport);
  }
  return request(`/reports/${reportId}/related`);
}

export async function getSites() {
  if (USE_MOCK) {
    await delay(200);
    return getMockSites();
  }
  return request('/sites');
}

export async function getSiteReports(siteId, filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const sites = getMockSites();
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
  const query = new URLSearchParams(filters).toString();
  return request(`/sites/${siteId}${query ? `?${query}` : ''}`);
}

export async function addSite(siteData) {
  if (USE_MOCK) {
    await delay(250);
    return addMockSite(siteData);
  }
  return request('/sites', {
    method: 'POST',
    body: JSON.stringify(siteData),
  });
}

export async function updateSite(siteId, siteData) {
  if (USE_MOCK) {
    await delay(250);
    return updateMockSite(siteId, siteData);
  }
  return request(`/sites/${siteId}`, {
    method: 'PUT',
    body: JSON.stringify(siteData),
  });
}

export async function getSite(siteId) {
  return getSiteReports(siteId);
}

export async function getSiteComparison(siteIds = [], filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const allSites = getMockSites();
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
        : mockReports.filter(
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
  const query = new URLSearchParams({ sites: siteIds.join(','), ...filters }).toString();
  return request(`/sites/compare?${query}`);
}

export async function getHazardComparison(hazardName, filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const targetHazard = (hazardName || 'Fall').trim();
    const allFiltered = filterReports(mockReports, { ...filters, hazard: targetHazard });
    const allSites = getMockSites();

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

    // Filter reports strictly to those belonging to targetSites
    const targetSiteIdSet = new Set(targetSites.map((s) => (s.id || '').toLowerCase()));
    const targetSiteNameSet = new Set(targetSites.map((s) => (s.name || '').toLowerCase()));

    const scopedFiltered = allFiltered.filter((r) => {
      const rSiteId = (r.siteId || '').toLowerCase();
      const rSiteName = (r.site || r.siteName || '').toLowerCase();
      return targetSiteIdSet.has(rSiteId) || targetSiteNameSet.has(rSiteName);
    });

    const siteBreakdown = targetSites.map((site) => {
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

      return {
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        reportsCount: siteHazardReports.length,
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
  const query = new URLSearchParams({ hazard: hazardName, ...filters }).toString();
  return request(`/compare/hazard?${query}`);
}

export async function getSiteHistory(siteId, filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const site = await getSiteReports(siteId, filters);
    const sorted = site.reports || [];

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
  const query = new URLSearchParams(filters).toString();
  return request(`/sites/${siteId}/history${query ? `?${query}` : ''}`);
}

export async function getRiskTrend(filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const filtered = filterReports(mockReports, filters);
    return getRiskTrendSeries(filtered);
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/trends/risk${query ? `?${query}` : ''}`);
}

export async function getHazardSummary(filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const filtered = filterReports(mockReports, filters);
    const summary = getReportSummary(filtered);
    return summary.topHazards;
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/trends/hazards${query ? `?${query}` : ''}`);
}

export async function getActivitySummary(filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const filtered = filterReports(mockReports, filters);
    const summary = getReportSummary(filtered);
    return summary.topActivities;
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/trends/activities${query ? `?${query}` : ''}`);
}

export async function getBarrierFailureSummary(filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const filtered = filterReports(mockReports, filters);
    const summary = getReportSummary(filtered);
    return summary.barrierFailures;
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/trends/barriers${query ? `?${query}` : ''}`);
}

export async function getSifPrecursors(filters = {}) {
  if (USE_MOCK) {
    await delay(150);
    const filtered = filterReports(mockReports, {
      ...filters,
      riskLevel: 'SIF-Precursor',
    });
    return filtered;
  }
  const query = new URLSearchParams(filters).toString();
  return request(`/reports/sif-precursors${query ? `?${query}` : ''}`);
}

export async function getDashboardSummary(filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const filtered = filterReports(mockReports, filters);
    const summary = getReportSummary(filtered);
    const attentionReports = getAttentionReports(filtered, 5);
    const riskTrend = getRiskTrendSeries(filtered);
    const sites = getMockSites();
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
  const query = new URLSearchParams(filters).toString();
  return request(`/dashboard/summary${query ? `?${query}` : ''}`);
}

// Alias analyzeReports to analyzeFiles for seamless backend contract compatibility
export const analyzeReports = analyzeFiles;

export async function getTrends() {
  if (USE_MOCK) {
    await delay(200);
    return { ...mockTrends };
  }
  return request('/trends');
}

// ═════════════════════════════════════════════════════════════════════
// HSE WORKFLOW, REPORT LIFECYCLE, ACTION MANAGEMENT & REVIEW QUEUE
// ═════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  STATUSES: 'sifguard_report_statuses',
  ACTIONS: 'sifguard_hse_actions',
  SAVED_VIEWS: 'sifguard_saved_views',
};

// Default initial action seeds with explicit priorities (IMMEDIATE, PRIORITY, STANDARD)
const DEFAULT_ACTIONS = [
  {
    id: 'act-101',
    reportId: 1,
    title: 'Stop activity until fall protection is verified',
    description: 'Halt all derrick operations on Rig Site A until secondary inertia reel and safety net are certified.',
    priority: 'IMMEDIATE',
    status: 'OPEN',
    assignee: 'HSE Supervisor',
    assignedTo: 'HSE Supervisor',
    dueDate: '2026-09-10',
    createdAt: '2026-09-09T09:30:00Z',
    completedAt: null,
  },
  {
    id: 'act-102',
    reportId: 1,
    title: 'Verify overhead casing clamp dampers',
    description: 'Inspect vibration dampener hardware and install tethered safety cable on 4-inch casing clamp.',
    priority: 'PRIORITY',
    status: 'IN PROGRESS',
    assignee: 'Rig Maintenance Lead',
    assignedTo: 'Rig Maintenance Lead',
    dueDate: '2026-09-11',
    createdAt: '2026-09-09T09:45:00Z',
    completedAt: null,
  },
  {
    id: 'act-103',
    reportId: 3,
    title: 'Re-calibrate atmospheric multi-gas monitors',
    description: 'Recalibrate toxic vapor detectors for Mud Tank 3 and replace expired calibration certificate.',
    priority: 'IMMEDIATE',
    status: 'PENDING VERIFICATION',
    assignee: 'Site Safety Officer',
    assignedTo: 'Site Safety Officer',
    dueDate: '2026-09-09',
    createdAt: '2026-09-08T11:30:00Z',
    completedAt: null,
  },
  {
    id: 'act-104',
    reportId: 2,
    title: 'Install certified 3000 PSI bypass flange',
    description: 'Replace temporary hose clamp with hydro-tested forged steel flange on pump discharge.',
    priority: 'STANDARD',
    status: 'CLOSED',
    assignee: 'Piping Specialist',
    assignedTo: 'Piping Specialist',
    dueDate: '2026-09-09',
    createdAt: '2026-09-09T14:45:00Z',
    completedAt: '2026-09-09T17:00:00Z',
  },
  {
    id: 'act-105',
    reportId: 4,
    title: 'LOTO boundary audit on 480V distribution bus',
    description: 'Audit lockout procedure on secondary standby circuit before maintenance resumes.',
    priority: 'PRIORITY',
    status: 'OPEN',
    assignee: 'Lead Electrician',
    assignedTo: 'Lead Electrician',
    dueDate: '2026-09-12',
    createdAt: '2026-09-07T17:00:00Z',
    completedAt: null,
  },
  {
    id: 'act-106',
    reportId: 10,
    title: 'Unlock and lockwire MGS flare line block valve',
    description: 'Remove unauthorized lock on mud gas separator flare discharge line and restore open path to flare.',
    priority: 'IMMEDIATE',
    status: 'OPEN',
    assignee: 'Rig Superintendent',
    assignedTo: 'Rig Superintendent',
    dueDate: '2026-09-09',
    createdAt: '2026-09-08T10:00:00Z',
    completedAt: null,
  },
  {
    id: 'act-107',
    reportId: 18,
    title: 'Cancel unpermitted hot work & issue formal PTW',
    description: 'Stop all welding on crude column bypass until gas testing passes and hot work permit is signed.',
    priority: 'IMMEDIATE',
    status: 'OPEN',
    assignee: 'Plant Operations Lead',
    assignedTo: 'Plant Operations Lead',
    dueDate: '2026-09-09',
    createdAt: '2026-09-09T11:45:00Z',
    completedAt: null,
  },
  {
    id: 'act-108',
    reportId: 25,
    title: 'Service automatic dock lock trailer restraint on Bay 2',
    description: 'Repair defective hydraulic dock lock and enforce mandatory wheel chocking protocol.',
    priority: 'IMMEDIATE',
    status: 'IN PROGRESS',
    assignee: 'Warehouse Manager',
    assignedTo: 'Warehouse Manager',
    dueDate: '2026-09-10',
    createdAt: '2026-09-08T16:00:00Z',
    completedAt: null,
  },
  {
    id: 'act-109',
    reportId: 32,
    title: 'Install polycarbonate ballistic shatter shield on hydro-test bench',
    description: 'Mandate shatter shield enclosure on 10,000 PSI test cell before pressurized testing resumes.',
    priority: 'IMMEDIATE',
    status: 'OPEN',
    assignee: 'Mechanical Workshop Head',
    assignedTo: 'Mechanical Workshop Head',
    dueDate: '2026-09-10',
    createdAt: '2026-09-09T13:30:00Z',
    completedAt: null,
  },
  {
    id: 'act-110',
    reportId: 5,
    title: 'Replace frayed crane hoist wire rope',
    description: 'De-rig damaged 12-ton hoist cable with 3 broken strands and recertify with proof load test.',
    priority: 'PRIORITY',
    status: 'IN PROGRESS',
    assignee: 'Lifting Specialist',
    assignedTo: 'Lifting Specialist',
    dueDate: '2026-09-11',
    createdAt: '2026-09-05T11:00:00Z',
    completedAt: null,
  },
  {
    id: 'act-111',
    reportId: 27,
    title: 'Re-rate and de-stack pallet racking Row G',
    description: 'Unload overweight steel valves from Level 3 and reinforce vertical upright post.',
    priority: 'PRIORITY',
    status: 'PENDING VERIFICATION',
    assignee: 'Logistics Supervisor',
    assignedTo: 'Logistics Supervisor',
    dueDate: '2026-09-07',
    createdAt: '2026-09-03T17:00:00Z',
    completedAt: null,
  },
  {
    id: 'act-112',
    reportId: 28,
    title: 'Replenish and test eyewash station fluid',
    description: 'Flush and refill gravity-fed eyewash unit at battery charging bay.',
    priority: 'STANDARD',
    status: 'CLOSED',
    assignee: 'Facility Maintenance',
    assignedTo: 'Facility Maintenance',
    dueDate: '2026-09-03',
    createdAt: '2026-09-02T10:00:00Z',
    completedAt: '2026-09-02T14:00:00Z',
  },
];

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
  const found = mockReports.find((r) => String(r.id) === String(reportId));
  const status = getDefaultReportStatus(found);
  return {
    status,
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
    status: getDefaultReportStatus(mockReports.find((r) => String(r.id) === key)),
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
      localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(DEFAULT_ACTIONS));
      return [...DEFAULT_ACTIONS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_ACTIONS];
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
      const rep = mockReports.find((r) => String(r.id) === String(a.reportId));
      if (rep) {
        if (rep.siteId && rep.siteId.toLowerCase() === norm) return true;
        if (rep.site && (rep.site.toLowerCase() === norm || rep.site.toLowerCase().replace(/\s+/g, '-') === norm)) return true;
      }
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
  await delay(200);
  // Get all reports decorated with their current workflow status and priority
  const decorated = attachReportStatuses(mockReports);

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


