/**
 * SIFguard Reusable Report Intelligence & Filtering Utilities
 * Supports multi-dimensional filtering, time analysis, ranking, and trend aggregation.
 */

export const RISK_WEIGHTS = {
  'SIF-Precursor': 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

// Reference current date for SIH 2026 simulation (09 Sep 2026)
export const SIMULATED_TODAY = '2026-09-09';

/**
 * Parses date string (YYYY-MM-DD or ISO) into normalized start-of-day timestamp
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Format report code like RPT-0024
 */
export function formatReportCode(id) {
  if (!id) return 'RPT-0000';
  const num = String(id).replace(/\D/g, '');
  if (!num) return `RPT-${id}`;
  return `RPT-${num.padStart(4, '0')}`;
}

/**
 * Format display date/time
 */
export function formatDateTime(report) {
  if (report.date && report.time) {
    return `${report.date} · ${report.time}`;
  }
  if (report.date) return report.date;
  if (report.timestamp) {
    try {
      const d = new Date(report.timestamp);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return report.timestamp;
    }
  }
  return '—';
}

/**
 * Filter an array of reports based on standard criteria
 */
export function filterReports(reports = [], filters = {}) {
  const {
    search = '',
    siteId = 'ALL',
    riskLevel = 'ALL',
    hazard = 'ALL',
    activity = 'ALL',
    datePreset = 'ALL',
    specificDate = '',
    startDate = '',
    endDate = '',
    sort = 'newest', // 'newest' | 'oldest' | 'highest_risk'
  } = filters;

  const today = parseDate(SIMULATED_TODAY) || new Date();

  const filtered = reports.filter((r) => {
    // 1. Site Filter
    if (siteId && siteId !== 'ALL') {
      const matchId = r.siteId === siteId;
      const matchName = r.site && r.site.toLowerCase().replace(/\s+/g, '-') === siteId.toLowerCase();
      const matchLiteral = r.site === siteId;
      if (!matchId && !matchName && !matchLiteral) return false;
    }

    // 2. Risk Filter
    if (riskLevel && riskLevel !== 'ALL') {
      if (r.risk_level !== riskLevel) return false;
    }

    // 3. Hazard Filter
    if (hazard && hazard !== 'ALL') {
      if (r.hazard !== hazard) return false;
    }

    // 4. Activity Filter
    if (activity && activity !== 'ALL') {
      if (r.activity !== activity) return false;
    }

    // 5. Date Filter
    const rDate = parseDate(r.date || r.timestamp);
    if (rDate) {
      if (datePreset === 'TODAY') {
        if (rDate.getTime() !== today.getTime()) return false;
      } else if (datePreset === 'THIS_WEEK') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        if (rDate < sevenDaysAgo || rDate > today) return false;
      } else if (datePreset === 'THIS_MONTH') {
        if (rDate.getFullYear() !== today.getFullYear() || rDate.getMonth() !== today.getMonth()) {
          return false;
        }
      } else if (datePreset === 'THIS_YEAR') {
        if (rDate.getFullYear() !== today.getFullYear()) return false;
      } else if (datePreset === 'SPECIFIC_DATE' && specificDate) {
        const target = parseDate(specificDate);
        if (target && rDate.getTime() !== target.getTime()) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate) {
          const s = parseDate(startDate);
          if (s && rDate < s) return false;
        }
        if (endDate) {
          const e = parseDate(endDate);
          if (e && rDate > e) return false;
        }
      }
    }

    // 6. Search across Report ID, Hazard, Activity, Location, Site, Text Snippet, Full Text, Barrier Failure
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const code = formatReportCode(r.id).toLowerCase();
      const idStr = String(r.id).toLowerCase();
      const hazardStr = (r.hazard || '').toLowerCase();
      const activityStr = (r.activity || '').toLowerCase();
      const locationStr = (r.location || '').toLowerCase();
      const siteStr = (r.site || r.siteName || '').toLowerCase();
      const textSnippetStr = (r.text_snippet || '').toLowerCase();
      const fullTextStr = (r.full_text || r.report_text || '').toLowerCase();
      const barrierStr = (r.barrier_failure || '').toLowerCase();
      const explanationStr = (r.explanation || '').toLowerCase();

      const matched =
        code.includes(q) ||
        idStr.includes(q) ||
        hazardStr.includes(q) ||
        activityStr.includes(q) ||
        locationStr.includes(q) ||
        siteStr.includes(q) ||
        textSnippetStr.includes(q) ||
        fullTextStr.includes(q) ||
        barrierStr.includes(q) ||
        explanationStr.includes(q);

      if (!matched) return false;
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    const aDate = new Date(a.date || a.timestamp || 0).getTime();
    const bDate = new Date(b.date || b.timestamp || 0).getTime();

    if (sort === 'highest_risk') {
      const aWeight = RISK_WEIGHTS[a.risk_level] || 0;
      const bWeight = RISK_WEIGHTS[b.risk_level] || 0;
      if (aWeight !== bWeight) return bWeight - aWeight;
      return bDate - aDate;
    }

    if (sort === 'oldest') {
      return aDate - bDate;
    }

    // Default 'newest'
    return bDate - aDate;
  });
}

/**
 * Computes safety intelligence summary for a collection of reports
 */
export function getReportSummary(reports = []) {
  const total = reports.length;
  let low = 0;
  let medium = 0;
  let high = 0;
  let sif = 0;
  const sitesSet = new Set();
  const hazardMap = {};
  const activityMap = {};
  const barrierMap = {};

  reports.forEach((r) => {
    if (r.risk_level === 'Low') low++;
    else if (r.risk_level === 'Medium') medium++;
    else if (r.risk_level === 'High') high++;
    else if (r.risk_level === 'SIF-Precursor') sif++;

    if (r.site || r.siteName || r.siteId) {
      sitesSet.add(r.site || r.siteName || r.siteId);
    }

    if (r.hazard && r.hazard !== 'None') {
      hazardMap[r.hazard] = (hazardMap[r.hazard] || 0) + 1;
    }
    if (r.activity && r.activity !== 'None') {
      activityMap[r.activity] = (activityMap[r.activity] || 0) + 1;
    }
    if (r.barrier_failure && r.barrier_failure !== 'None' && r.barrier_failure !== 'None Identified') {
      if (!barrierMap[r.barrier_failure]) {
        barrierMap[r.barrier_failure] = {
          count: 0,
          highCount: 0,
          sifCount: 0,
          mediumCount: 0,
          lowCount: 0,
        };
      }
      barrierMap[r.barrier_failure].count += 1;
      if (r.risk_level === 'High') barrierMap[r.barrier_failure].highCount += 1;
      if (r.risk_level === 'SIF-Precursor') barrierMap[r.barrier_failure].sifCount += 1;
      if (r.risk_level === 'Medium') barrierMap[r.barrier_failure].mediumCount += 1;
      if (r.risk_level === 'Low') barrierMap[r.barrier_failure].lowCount += 1;
    }
  });

  const topHazards = Object.entries(hazardMap)
    .map(([hazard, count]) => ({ hazard, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const topActivities = Object.entries(activityMap)
    .map(([activity, count]) => ({ activity, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const barrierFailures = Object.entries(barrierMap)
    .map(([barrier, stats]) => {
      const parts = [];
      if (stats.highCount > 0) parts.push(`${stats.highCount} High`);
      if (stats.sifCount > 0) parts.push(`${stats.sifCount} SIF`);
      if (parts.length === 0 && stats.mediumCount > 0) parts.push(`${stats.mediumCount} Med`);
      const riskAssociation = parts.join(' / ') || 'Standard';

      return {
        barrier,
        count: stats.count,
        highCount: stats.highCount,
        sifCount: stats.sifCount,
        riskAssociation,
        percentage: total > 0 ? Math.round((stats.count / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const primaryHazard = topHazards.length > 0 ? topHazards[0].hazard : 'None';

  return {
    totalReports: total,
    lowCount: low,
    mediumCount: medium,
    highCount: high,
    sifCount: sif,
    highRiskTotal: high + sif,
    sitesReporting: sitesSet.size,
    topHazards,
    topActivities,
    barrierFailures,
    primaryHazard,
  };
}

/**
 * Returns prioritized attention reports: SIF-Precursor, then High, then Medium
 * Excludes Low risk reports.
 */
export function getAttentionReports(reports = [], limit = 5) {
  const PRIORITY_ORDER = {
    'SIF-Precursor': 3,
    High: 2,
    Medium: 1,
    Low: 0,
  };

  const eligible = reports.filter((r) => r.risk_level !== 'Low');

  return eligible
    .sort((a, b) => {
      const aP = PRIORITY_ORDER[a.risk_level] || 0;
      const bP = PRIORITY_ORDER[b.risk_level] || 0;
      if (aP !== bP) return bP - aP;

      const aDate = new Date(a.date || a.timestamp || 0).getTime();
      const bDate = new Date(b.date || b.timestamp || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, limit);
}

/**
 * Formats a human-readable active period label for the Context Bar
 */
export function getPeriodLabel(datePreset, startDate, endDate) {
  switch (datePreset) {
    case 'TODAY':
      return '09 Sep 2026 (Today)';
    case 'THIS_WEEK':
      return '03 Sep 2026 – 09 Sep 2026 (Last 7 Days)';
    case 'THIS_MONTH':
      return '01 Sep 2026 – 09 Sep 2026 (Current Month)';
    case 'THIS_YEAR':
      return '01 Jan 2026 – 09 Sep 2026 (Year to Date)';
    case 'CUSTOM':
      if (startDate && endDate) return `${startDate} to ${endDate}`;
      if (startDate) return `Since ${startDate}`;
      if (endDate) return `Until ${endDate}`;
      return 'Custom Range';
    case 'ALL':
    default:
      return '01 Sep 2026 – 09 Sep 2026 (Operational Window)';
  }
}

/**
 * Computes site risk overview table for All Sites view
 */
export function getSiteRiskOverview(reports = [], sites = []) {
  return sites.map((site) => {
    const siteReports = reports.filter(
      (r) => r.siteId === site.id || r.site === site.name
    );

    const highCount = siteReports.filter((r) => r.risk_level === 'High').length;
    const sifCount = siteReports.filter((r) => r.risk_level === 'SIF-Precursor').length;

    return {
      id: site.id,
      name: site.name,
      location: site.location,
      healthStatus: site.healthStatus || 'Stable',
      totalReports: siteReports.length,
      highRisk: highCount,
      sifPrecursors: sifCount,
      requiresAttention: highCount > 0 || sifCount > 0,
    };
  }).sort((a, b) => (b.highRisk + b.sifPrecursors * 2) - (a.highRisk + a.sifPrecursors * 2));
}

/**
 * Aggregates reports by date for Recharts time-series visualization
 */
export function getRiskTrendSeries(reports = []) {
  const dateMap = {};

  reports.forEach((r) => {
    const rawDate = r.date || (r.timestamp ? r.timestamp.slice(0, 10) : '2026-09-09');
    if (!dateMap[rawDate]) {
      dateMap[rawDate] = {
        date: rawDate,
        displayDate: formatShortDate(rawDate),
        Low: 0,
        Medium: 0,
        High: 0,
        'SIF-Precursor': 0,
        total: 0,
      };
    }
    const level = r.risk_level || 'Low';
    if (dateMap[rawDate][level] !== undefined) {
      dateMap[rawDate][level] += 1;
    }
    dateMap[rawDate].total += 1;
  });

  // Sort ascending by date for timeline
  return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function formatShortDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return dateStr;
  }
}

