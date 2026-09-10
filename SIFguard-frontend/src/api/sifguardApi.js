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
} from '../data/mockData';

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

import {
  filterReports,
  getReportSummary,
  getRiskTrendSeries,
  getAttentionReports,
  getSiteRiskOverview,
  formatReportCode,
} from '../utils/filterReports';

// ─── Query Endpoints ────────────────────────────────────────────────

export async function getReports(filters = {}) {
  if (USE_MOCK) {
    await delay(200);
    const results = filterReports(mockReports, filters);
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

    return {
      ...report,
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

    const filteredReports = filterReports(site.reports || [], {
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
    const selectedSites = siteIds
      .map((id) => allSites.find((s) => s.id === id || s.name.toLowerCase().replace(/\s+/g, '-') === id))
      .filter(Boolean);

    if (selectedSites.length === 0) {
      return { sites: [], keyDifferences: [], commonPatterns: [], recommendations: [] };
    }

    const comparisonSites = selectedSites.map((site) => {
      const filtered = filterReports(site.reports || [], filters);
      const summary = getReportSummary(filtered);
      const highCount = filtered.filter((r) => r.risk_level === 'High').length;
      const sifCount = filtered.filter((r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true).length;
      const lowCount = filtered.filter((r) => r.risk_level === 'Low').length;
      const medCount = filtered.filter((r) => r.risk_level === 'Medium').length;

      return {
        ...site,
        filteredReports: filtered,
        totalReports: filtered.length,
        highRiskCount: highCount,
        sifCount: sifCount,
        riskCounts: {
          Low: lowCount,
          Medium: medCount,
          High: highCount,
          'SIF-Precursor': sifCount,
        },
        topHazards: summary.topHazards.slice(0, 4),
        topActivities: summary.topActivities.slice(0, 4),
        barrierFailures: summary.barrierFailures.slice(0, 4),
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

    if (highestSifSite && highestSifSite.sifCount > 0 && highestSifSite.id !== lowestSifSite.id) {
      keyDifferences.push({
        type: 'sif_concentration',
        site: highestSifSite.name,
        statement: `${highestSifSite.name} exhibits a higher concentration of SIF-Precursor signals (${highestSifSite.sifCount}) compared to ${lowestSifSite.name} (${lowestSifSite.sifCount}).`,
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


