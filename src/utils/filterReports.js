/**
 * SIFguard Reusable Report Intelligence & Filtering Utilities
 * Supports multi-dimensional filtering, time analysis, ranking, and trend aggregation.
 */

export const RISK_WEIGHTS = {
  'SIF-Precursor': 4,
  'SIF-PRECURSOR': 4,
  High: 3,
  HIGH: 3,
  Medium: 2,
  MEDIUM: 2,
  Low: 1,
  LOW: 1,
};

export const PRIORITY_WEIGHTS = {
  IMMEDIATE: 3,
  PRIORITY: 2,
  STANDARD: 1,
};

export const STATUS_WEIGHTS = {
  'ACTION REQUIRED': 7,
  'UNDER REVIEW': 6,
  'IN PROGRESS': 5,
  'PENDING VERIFICATION': 4,
  NEW: 3,
  RESOLVED: 2,
  CLOSED: 1,
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
 * Universal multi-column report comparator
 * @param {Object} a - Report A
 * @param {Object} b - Report B
 * @param {string} field - Sort field ('default' | 'date' | 'id' | 'site' | 'hazard' | 'risk' | 'priority' | 'status' | 'activity')
 * @param {string} direction - Sort direction ('asc' | 'desc')
 */
export function compareReports(a, b, field = 'default', direction = 'desc') {
  if (field === 'default') {
    // SIF-PRECURSOR -> HIGH -> Action Required -> newest
    const aRisk = RISK_WEIGHTS[a.risk_level] || 0;
    const bRisk = RISK_WEIGHTS[b.risk_level] || 0;
    const aPriority = PRIORITY_WEIGHTS[(a.priority || '').toUpperCase()] || 0;
    const bPriority = PRIORITY_WEIGHTS[(b.priority || '').toUpperCase()] || 0;
    const aIsActionReq = (a.status || '').toUpperCase() === 'ACTION REQUIRED' ? 2 : 0;
    const bIsActionReq = (b.status || '').toUpperCase() === 'ACTION REQUIRED' ? 2 : 0;

    const aScore = (aRisk === 4 ? 20 : 0) + aPriority * 5 + aRisk * 2 + aIsActionReq;
    const bScore = (bRisk === 4 ? 20 : 0) + bPriority * 5 + bRisk * 2 + bIsActionReq;

    if (aScore !== bScore) return bScore - aScore;
    const aDate = new Date(a.date || a.timestamp || 0).getTime();
    const bDate = new Date(b.date || b.timestamp || 0).getTime();
    return bDate - aDate;
  }

  let result = 0;
  if (field === 'date') {
    const aDate = new Date(a.date || a.timestamp || 0).getTime();
    const bDate = new Date(b.date || b.timestamp || 0).getTime();
    result = aDate - bDate;
  } else if (field === 'id' || field === 'report') {
    const aNum = Number(String(a.id).replace(/\D/g, '')) || 0;
    const bNum = Number(String(b.id).replace(/\D/g, '')) || 0;
    result = aNum !== bNum ? aNum - bNum : String(a.id).localeCompare(String(b.id));
  } else if (field === 'site') {
    const aSite = (a.site || a.siteName || '').toLowerCase();
    const bSite = (b.site || b.siteName || '').toLowerCase();
    result = aSite.localeCompare(bSite);
  } else if (field === 'hazard') {
    const aH = (a.hazard || '').toLowerCase();
    const bH = (b.hazard || '').toLowerCase();
    result = aH.localeCompare(bH);
  } else if (field === 'activity') {
    const aAct = (a.activity || '').toLowerCase();
    const bAct = (b.activity || '').toLowerCase();
    result = aAct.localeCompare(bAct);
  } else if (field === 'risk') {
    const aW = RISK_WEIGHTS[a.risk_level] || 0;
    const bW = RISK_WEIGHTS[b.risk_level] || 0;
    result = aW - bW;
  } else if (field === 'priority') {
    const aP = PRIORITY_WEIGHTS[(a.priority || '').toUpperCase()] || 0;
    const bP = PRIORITY_WEIGHTS[(b.priority || '').toUpperCase()] || 0;
    result = aP - bP;
  } else if (field === 'status') {
    const aS = STATUS_WEIGHTS[(a.status || '').toUpperCase().replace(/_/g, ' ')] || 0;
    const bS = STATUS_WEIGHTS[(b.status || '').toUpperCase().replace(/_/g, ' ')] || 0;
    result = aS - bS;
  }

  if (result !== 0) {
    return direction === 'desc' ? -result : result;
  }

  // Deterministic secondary tie-breaker: newest date first, then ID
  const aDate = new Date(a.date || a.timestamp || 0).getTime();
  const bDate = new Date(b.date || b.timestamp || 0).getTime();
  if (aDate !== bDate) return bDate - aDate;
  return String(a.id).localeCompare(String(b.id));
}

/**
 * Filter an array of reports based on standard multi-dimensional criteria
 */
export function filterReports(reports = [], filters = {}) {
  const {
    search = '',
    siteId = 'ALL',
    riskLevel = 'ALL',
    priority = 'ALL',
    status = 'ALL',
    hazard = 'ALL',
    activity = 'ALL',
    datePreset = 'ALL',
    specificDate = '',
    startDate = '',
    endDate = '',
    sort = 'newest',
    sortField = null,
    sortDirection = null,
  } = filters;

  const today = parseDate(SIMULATED_TODAY) || new Date();

  const filtered = reports.filter((r) => {
    // 1. Site Filter (Supports exact siteId, slugified kebab, exact name, or code)
    if (siteId && siteId !== 'ALL') {
      const norm = siteId.toLowerCase().trim();
      const matchId = r.siteId && r.siteId.toLowerCase() === norm;
      const matchKebab = r.site && r.site.toLowerCase().replace(/\s+/g, '-') === norm;
      const matchSite = r.site && r.site.toLowerCase() === norm;
      const matchSiteName = r.siteName && r.siteName.toLowerCase() === norm;
      const matchCode = r.siteCode && r.siteCode.toLowerCase() === norm;
      if (!matchId && !matchKebab && !matchSite && !matchSiteName && !matchCode) return false;
    }

    // 2. Risk Filter
    if (riskLevel && riskLevel !== 'ALL') {
      if (r.risk_level !== riskLevel) return false;
    }

    // 3. Priority Filter
    if (priority && priority !== 'ALL') {
      const targetP = priority.toUpperCase();
      if ((r.priority || '').toUpperCase() !== targetP) return false;
    }

    // 4. Status Filter
    if (status && status !== 'ALL') {
      const targetS = status.toUpperCase().replace(/_/g, ' ');
      if ((r.status || '').toUpperCase() !== targetS) return false;
    }

    // 5. Hazard Filter
    if (hazard && hazard !== 'ALL') {
      if (r.hazard !== hazard) return false;
    }

    // 6. Activity Filter
    if (activity && activity !== 'ALL') {
      if (r.activity !== activity) return false;
    }

    // 7. Date Filter
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

    // 8. Search across Report ID, Hazard, Activity, Location, Site, Text Snippet, Full Text, Barrier Failure
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

  // Resolve sort field & direction
  let finalField = sortField;
  let finalDirection = sortDirection;

  if (!finalField) {
    if (sort === 'newest') {
      finalField = 'date';
      finalDirection = 'desc';
    } else if (sort === 'oldest') {
      finalField = 'date';
      finalDirection = 'asc';
    } else if (sort === 'highest_risk') {
      finalField = 'risk';
      finalDirection = 'desc';
    } else if (sort === 'lowest_risk') {
      finalField = 'risk';
      finalDirection = 'asc';
    } else if (sort === 'priority' || sort === 'priority_desc') {
      finalField = 'priority';
      finalDirection = 'desc';
    } else if (sort === 'priority_asc') {
      finalField = 'priority';
      finalDirection = 'asc';
    } else if (sort === 'site_asc') {
      finalField = 'site';
      finalDirection = 'asc';
    } else if (sort === 'site_desc') {
      finalField = 'site';
      finalDirection = 'desc';
    } else if (sort === 'id_asc') {
      finalField = 'id';
      finalDirection = 'asc';
    } else if (sort === 'id_desc') {
      finalField = 'id';
      finalDirection = 'desc';
    } else if (sort === 'hazard_asc') {
      finalField = 'hazard';
      finalDirection = 'asc';
    } else if (sort === 'hazard_desc') {
      finalField = 'hazard';
      finalDirection = 'desc';
    } else if (sort === 'activity_asc') {
      finalField = 'activity';
      finalDirection = 'asc';
    } else if (sort === 'activity_desc') {
      finalField = 'activity';
      finalDirection = 'desc';
    } else if (sort === 'status' || sort === 'status_desc') {
      finalField = 'status';
      finalDirection = 'desc';
    } else if (sort === 'status_asc') {
      finalField = 'status';
      finalDirection = 'asc';
    } else {
      finalField = 'default';
      finalDirection = 'desc';
    }
  }

  return filtered.sort((a, b) => compareReports(a, b, finalField, finalDirection || 'desc'));
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
 * Aggregates reports by flexible time granularity (Daily, Weekly, Monthly, Yearly, Specific Date)
 * for Recharts stacked bar visualization.
 */
export function getRiskTrend(reports = [], options = {}) {
  const {
    granularity = 'DAILY', // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'SPECIFIC_DATE'
    specificDate = '',
  } = options;

  if (granularity === 'SPECIFIC_DATE') {
    const targetDate = specificDate || SIMULATED_TODAY;
    const targetParsed = parseDate(targetDate);
    const matching = reports.filter((r) => {
      const rDate = parseDate(r.date || r.timestamp);
      if (!rDate || !targetParsed) return false;
      return rDate.getTime() === targetParsed.getTime();
    });

    if (matching.length === 0) {
      return [];
    }

    const counts = { Low: 0, Medium: 0, High: 0, 'SIF-Precursor': 0, total: 0 };
    matching.forEach((r) => {
      const level = r.risk_level || 'Low';
      if (counts[level] !== undefined) counts[level] += 1;
      counts.total += 1;
    });

    const displayDate = formatDisplayDate(targetDate);
    return [
      {
        key: targetDate,
        date: targetDate,
        displayDate,
        fullPeriodLabel: displayDate,
        ...counts,
      },
    ];
  }

  const bucketMap = {};

  reports.forEach((r) => {
    const rawDate = r.date || (r.timestamp ? r.timestamp.slice(0, 10) : '2026-09-09');
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;

    let bucketKey = '';
    let displayDate = '';
    let fullPeriodLabel = '';

    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);

    if (granularity === 'YEARLY') {
      bucketKey = String(year);
      displayDate = String(year);
      fullPeriodLabel = `Year ${year}`;
    } else if (granularity === 'MONTHLY') {
      bucketKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      displayDate = monthShort;
      fullPeriodLabel = `${monthShort} ${year}`;
    } else if (granularity === 'WEEKLY') {
      // 7-day interval grouping: 01–07, 08–14, 15–21, 22–28, 29–end
      const weekNum = Math.floor((day - 1) / 7) + 1;
      const startDay = (weekNum - 1) * 7 + 1;
      const endDay = Math.min(weekNum * 7, new Date(year, month + 1, 0).getDate());

      const startStr = String(startDay).padStart(2, '0');
      const endStr = String(endDay).padStart(2, '0');

      bucketKey = `${year}-${String(month + 1).padStart(2, '0')}-w${weekNum}`;
      displayDate = `${startStr}–${endStr} ${monthShort}`;
      fullPeriodLabel = `${startStr}–${endStr} ${monthShort} ${year}`;
    } else {
      // DAILY
      bucketKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      displayDate = `${String(day).padStart(2, '0')} ${monthShort}`;
      fullPeriodLabel = `${String(day).padStart(2, '0')} ${monthShort} ${year}`;
    }

    if (!bucketMap[bucketKey]) {
      bucketMap[bucketKey] = {
        key: bucketKey,
        date: rawDate,
        displayDate,
        fullPeriodLabel,
        Low: 0,
        Medium: 0,
        High: 0,
        'SIF-Precursor': 0,
        total: 0,
      };
    }

    const level = r.risk_level || 'Low';
    if (bucketMap[bucketKey][level] !== undefined) {
      bucketMap[bucketKey][level] += 1;
    }
    bucketMap[bucketKey].total += 1;
  });

  return Object.values(bucketMap).sort((a, b) => (a.key > b.key ? 1 : -1));
}

/**
 * Backward-compatible alias for getRiskTrend
 */
export function getRiskTrendSeries(reports = [], options = {}) {
  return getRiskTrend(reports, options);
}

export function formatDisplayDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Derives explainable qualitative contributing factors and consequence statement for a report
 */
export function getContributingFactors(report) {
  if (!report) return { factors: [], whyItMatters: '' };

  const factors = [];
  const hazard = (report.hazard || '').trim();
  const activity = (report.activity || '').trim();
  const barrier = (report.barrier_failure || '').trim();
  const isSif = report.risk_level === 'SIF-Precursor' || report.sif_precursor === true;
  const isHigh = report.risk_level === 'High';

  // 1. Task/Activity factor
  if (activity && activity !== 'None' && activity !== 'General Operations') {
    factors.push(`High-consequence operational activity: ${activity}`);
  } else {
    factors.push('Active routine operational task execution');
  }

  // 2. Hazard dynamics factor
  if (hazard && hazard !== 'None') {
    const hLower = hazard.toLowerCase();
    if (hLower.includes('fall')) {
      factors.push('Elevated work positioning with gravitational potential energy');
    } else if (hLower.includes('electrical')) {
      factors.push('Proximity to energized electrical conductors or machinery');
    } else if (hLower.includes('confined')) {
      factors.push('Restricted entry enclosure with potential atmospheric or asphyxiation risk');
    } else if (hLower.includes('chemical') || hLower.includes('toxic') || hLower.includes('gas')) {
      factors.push('Hazardous hydrocarbon or toxic substance handling without verified isolation');
    } else if (hLower.includes('struck') || hLower.includes('dropped')) {
      factors.push('Overhead work zone or suspended load trajectory exposure');
    } else if (hLower.includes('vehicle') || hLower.includes('traffic')) {
      factors.push('Mobile industrial plant operation intersecting pedestrian or work zones');
    } else if (hLower.includes('pressure')) {
      factors.push('Pressurized process piping or vessel energy release vulnerability');
    } else {
      factors.push(`Unmitigated ${hazard} energy mechanism identified in work area`);
    }
  }

  // 3. Barrier safeguard factor
  if (barrier && barrier !== 'None' && barrier !== 'None Identified') {
    factors.push(`Safeguard breach: ${barrier}`);
  } else {
    factors.push('Administrative verification or pre-task safeguard not recorded');
  }

  // 4. Precursor / Severity factor
  if (isSif) {
    factors.push('SIF precursor criteria satisfied — life-threatening or permanently disabling potential');
  } else if (isHigh) {
    factors.push('High-severity classification based on unmitigated hazard consequence');
  } else {
    factors.push('Controlled operational condition requiring proactive reinforcement');
  }

  // Why this matters statement
  let whyItMatters = '';
  if (isSif) {
    whyItMatters = 'Potential for serious fatal or permanent life-altering injury if the activity continues without physical barrier re-verification.';
  } else if (isHigh) {
    whyItMatters = 'Elevated probability of severe injury, system disruption, or escalation to SIF precursor if corrective controls are delayed.';
  } else if (report.risk_level === 'Medium') {
    whyItMatters = 'Moderate injury exposure or localized asset damage if unsafe act or condition is left uncorrected.';
  } else {
    whyItMatters = 'Minor non-conformance. Addressing reinforces frontline safety compliance and prevents gradual safeguard erosion.';
  }

  return { factors, whyItMatters };
}

/**
 * Returns prioritized deterministic recommended safety actions based on report attributes
 */
export function getRecommendedSafetyActions(report) {
  if (!report) return { priority: 'STANDARD', actions: [] };

  const isSif = report.risk_level === 'SIF-Precursor' || report.sif_precursor === true;
  const isHigh = report.risk_level === 'High';
  const isMedium = report.risk_level === 'Medium';

  const priority = isSif || isHigh ? 'IMMEDIATE' : isMedium ? 'PRIORITY' : 'STANDARD';
  const hazard = (report.hazard || '').toLowerCase();
  const activity = (report.activity || '').toLowerCase();
  const barrier = (report.barrier_failure || '').toLowerCase();

  let actions = [];

  if (hazard.includes('fall') || activity.includes('scaffold') || activity.includes('height') || barrier.includes('fall')) {
    actions = [
      'Stop activity immediately until 100% fall protection and certified anchorages are physically verified.',
      'Perform mandatory structural inspection of scaffolding, work platforms, and guardrails before re-entry.',
      'Re-validate supervisor Working-at-Height permit and verify operative harness inspection tags.',
      'Record corrective action and physical verification in facility shift handover log.',
    ];
  } else if (hazard.includes('electrical') || activity.includes('electrical') || barrier.includes('isolation')) {
    actions = [
      'Apply Lockout/Tagout (LOTO) and execute physical zero-energy live-dead-live testing.',
      'Inspect physical enclosures, conduit seals, and insulation integrity on target electrical feeds.',
      'Confirm electrical work permit authorization with certified electrical supervisor.',
      'Re-brief crew on arc-flash approach boundaries and calibrated PPE compliance.',
    ];
  } else if (hazard.includes('confined') || activity.includes('confined') || barrier.includes('ventilation') || barrier.includes('entry')) {
    actions = [
      'Evacuate space immediately until calibrated four-gas atmospheric testing confirms safe oxygen and toxic limits.',
      'Establish continuous positive-pressure mechanical ventilation throughout work duration.',
      'Station a dedicated, certified entry watch observer equipped with retrieval lifeline and emergency comms.',
      'Re-authorize Confined Space Entry Permit with HSE superintendent signature.',
    ];
  } else if (hazard.includes('chemical') || hazard.includes('toxic') || hazard.includes('gas') || barrier.includes('ppe')) {
    actions = [
      'Enforce mandatory chemical-resistant PPE including positive-pressure respirators and splash protection.',
      'Inspect secondary containment, emergency eye-wash stations, and vapor extraction scrubbers.',
      'Review Safety Data Sheet (SDS) emergency handling and spill response procedure with field crew.',
      'Verify area hydrocarbon and toxic gas sensor calibration before resuming material transfer.',
    ];
  } else if (hazard.includes('struck') || hazard.includes('dropped') || activity.includes('crane') || activity.includes('lifting') || barrier.includes('exclusion')) {
    actions = [
      'Barricade and enforce a 360° exclusion zone directly below overhead operations and crane swing radii.',
      'Inspect all tool lanyards, toe-boards, and secondary retention netting across elevated structures.',
      'Re-verify crane rigging gear inspection certificates and ensure certified rigger signals.',
      'Conduct an on-the-spot drop prevention toolbox talk with all deck personnel.',
    ];
  } else if (hazard.includes('vehicle') || hazard.includes('traffic') || barrier.includes('segregation')) {
    actions = [
      'Re-establish physical barriers segregating pedestrian walkways from heavy plant transit lanes.',
      'Verify reverse alarms, proximity sensors, and high-visibility flashing beacons on all active mobile units.',
      'Assign dedicated banksman / spotter for all vehicle maneuvering in congested processing zones.',
      'Enforce strict 15 km/h site speed limits and mandatory pre-start operator inspection checklists.',
    ];
  } else {
    actions = [
      'Initiate an immediate task pause for supervisor-led on-site hazard re-assessment.',
      'Rectify identified safeguard or barrier deficiency before authorizing continuation of work.',
      'Conduct task safety review (JSA) with all frontline crew members involved.',
      'Formally document corrective action and closure verification in shift safety log.',
    ];
  }

  return { priority, actions };
}

/**
 * Returns deterministic corrective actions to address the CURRENT condition.
 * Focus: Fix the immediate hazard, safeguard breach, or unverified control.
 */
export function getCorrectiveActions(report) {
  if (!report) return [];

  const hazard = (report.hazard || '').toLowerCase();
  const barrier = (report.barrier_failure || '').toLowerCase();
  const isHighOrSif =
    report.risk_level === 'High' ||
    report.risk_level === 'SIF-Precursor' ||
    report.sif_precursor === true;

  const actions = [];

  // 1. Immediate Work Status & Physical Control
  if (isHighOrSif) {
    actions.push({
      step: 'Hold & Secure Work Area',
      detail: 'Initiate an immediate work pause and restrict personnel access to the affected zone until required controls are in place.',
      status: 'Immediate',
    });
  } else {
    actions.push({
      step: 'Address Observed Condition',
      detail: 'Remediate the observed non-compliance before continuing the immediate activity.',
      status: 'Immediate',
    });
  }

  // 2. Barrier Remediation
  if (barrier && barrier !== 'none' && barrier !== 'none identified') {
    actions.push({
      step: 'Address Barrier Breach',
      detail: `Inspect and re-establish the compromised safeguard: "${report.barrier_failure}". Ensure physical integrity is verified.`,
      status: 'Required',
    });
  } else if (hazard.includes('fall')) {
    actions.push({
      step: 'Verify Fall Safeguards',
      detail: 'Inspect anchor points, life-lines, and scaffolding guardrails before authorizing work at height.',
      status: 'Required',
    });
  } else if (hazard.includes('electrical')) {
    actions.push({
      step: 'Zero-Energy Isolation Check',
      detail: 'Verify positive lockout/tagout (LOTO) isolation and complete live-dead-live testing on affected equipment.',
      status: 'Required',
    });
  } else if (hazard.includes('confined')) {
    actions.push({
      step: 'Atmospheric Verification',
      detail: 'Re-test internal atmosphere with calibrated 4-gas detector and verify forced ventilation flow.',
      status: 'Required',
    });
  } else {
    actions.push({
      step: 'Equipment & Control Check',
      detail: `Perform physical verification of relevant safety controls for ${report.hazard || 'operational task'}.`,
      status: 'Required',
    });
  }

  // 3. Supervisor Verification
  actions.push({
    step: 'Supervisor On-Site Sign-Off',
    detail: 'HSE officer or area supervisor must conduct an on-site physical walkaround to verify control completion.',
    status: 'Verification',
  });

  // 4. Handover & Documentation
  actions.push({
    step: 'Document Corrective Completion',
    detail: 'Log corrective action, responsible authority sign-off, and photographic verification in facility shift log.',
    status: 'Documentation',
  });

  return actions;
}

/**
 * Returns deterministic preventive actions to REDUCE RECURRENCE systematically.
 * Focus: Procedural reinforcement, inspection frequency, permit verification, site-wide learning.
 */
export function getPreventiveActions(report) {
  if (!report) return [];

  const hazard = (report.hazard || '').toLowerCase();
  const activity = (report.activity || '').toLowerCase();
  const barrier = (report.barrier_failure || '').toLowerCase();

  const actions = [];

  // 1. Procedural / Permit Reinforcement
  if (hazard.includes('fall') || activity.includes('scaffold') || activity.includes('height')) {
    actions.push({
      step: 'Working at Height Permit Audit',
      detail: 'Audit height permit-to-work compliance across all active shifts and verify pre-use harness inspection tags.',
      timeline: 'Within 48h',
    });
  } else if (hazard.includes('electrical')) {
    actions.push({
      step: 'LOTO Program Reinforcement',
      detail: 'Review facility electrical isolation protocols and conduct refresher briefing on boundary isolation standards.',
      timeline: 'Within 48h',
    });
  } else if (hazard.includes('confined')) {
    actions.push({
      step: 'Confined Space Protocol Review',
      detail: 'Review calibration logs for all atmospheric testing devices and verify standby watcher certification currency.',
      timeline: 'Within 48h',
    });
  } else {
    actions.push({
      step: 'Standard Operating Procedure Review',
      detail: `Review operating procedures and risk assessments for ${report.activity || 'this activity'} with shift supervisors.`,
      timeline: 'Within 48h',
    });
  }

  // 2. Inspection Cadence
  actions.push({
    step: 'Strengthen Inspection Cadence',
    detail: `Increase formal HSE walkthrough frequency for ${report.activity || 'related operations'} to ensure sustained barrier reliability.`,
    timeline: 'Ongoing Weekly',
  });

  // 3. Targeted Toolbox Communication
  actions.push({
    step: 'Targeted Toolbox Talk',
    detail: `Conduct a site-wide safety briefing covering this specific ${report.hazard || 'hazard'} observation and required controls.`,
    timeline: 'Next Shift Briefing',
  });

  // 4. Cross-Facility Learning & Monitoring
  actions.push({
    step: 'Cross-Site Learning & Recurrence Monitoring',
    detail: `Disseminate anonymized safety learning notice across other operational rigs and monitor for recurring patterns.`,
    timeline: 'Next HSE Committee',
  });

  return actions;
}

/**
 * Computes concise executive safety brief derived dynamically from scoped dataset
 */
export function getExecutiveSafetyBrief(scopedReports = [], selectedSite = 'ALL', sites = []) {
  const totalReports = scopedReports.length;
  if (totalReports === 0) {
    return {
      hasData: false,
      totalReports: 0,
      highCount: 0,
      sifCount: 0,
      prioritySignal: 'No priority pattern identified for the selected period.',
      recommendedFocus: [],
      filterParams: {},
    };
  }

  const highCount = scopedReports.filter((r) => r.risk_level === 'High').length;
  const sifCount = scopedReports.filter((r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true).length;
  const summary = getReportSummary(scopedReports);

  const topHazard = summary.topHazards[0]?.hazard || 'Operational Hazard';
  const topActivity = summary.topActivities[0]?.activity || 'General Operations';
  const topBarrier = summary.barrierFailures[0]?.barrier || 'Safeguard Integrity';

  // Identify highest risk site if corporate/all sites
  let prioritySiteName = '';
  let prioritySiteId = selectedSite;

  if (selectedSite === 'ALL') {
    const siteCounts = {};
    scopedReports.forEach((r) => {
      const sId = r.siteId || 'unknown';
      const sName = r.site || r.siteName || sId;
      if (!siteCounts[sId]) {
        siteCounts[sId] = { id: sId, name: sName, highOrSif: 0, total: 0 };
      }
      siteCounts[sId].total += 1;
      if (r.risk_level === 'High' || r.risk_level === 'SIF-Precursor' || r.sif_precursor === true) {
        siteCounts[sId].highOrSif += 1;
      }
    });

    const sortedSites = Object.values(siteCounts).sort((a, b) => b.highOrSif - a.highOrSif || b.total - a.total);
    if (sortedSites.length > 0) {
      prioritySiteId = sortedSites[0].id;
      prioritySiteName = sortedSites[0].name;
    }
  } else {
    const siteObj = sites.find((s) => s.id === selectedSite);
    prioritySiteName = siteObj?.name || selectedSite;
  }

  // Construct priority signal narrative
  let prioritySignal = '';
  if (sifCount > 0) {
    prioritySignal = `${prioritySiteName || 'Operations'} exhibits ${sifCount} SIF precursor signal${sifCount > 1 ? 's' : ''} driven primarily by ${topHazard.toLowerCase()} risks during ${topActivity.toLowerCase()}. Recurring barrier breakdown: "${topBarrier}".`;
  } else if (highCount > 0) {
    prioritySignal = `${prioritySiteName || 'Operations'} records ${highCount} high-risk observation${highCount > 1 ? 's' : ''} involving ${topHazard.toLowerCase()} during ${topActivity.toLowerCase()}. Primary safeguard vulnerability: "${topBarrier}".`;
  } else {
    prioritySignal = `Zero SIF precursors or high-severity signals recorded in this period across ${prioritySiteName || 'operations'}. Routine ${topHazard.toLowerCase()} controls remain effective.`;
  }

  // Recommended focus areas (3 concise interventions)
  const recommendedFocus = [];
  if (topHazard.toLowerCase().includes('fall')) {
    recommendedFocus.push('Fall protection verification');
    recommendedFocus.push('Scaffold structural inspection');
    recommendedFocus.push('Supervisor height authorization');
  } else if (topHazard.toLowerCase().includes('electrical')) {
    recommendedFocus.push('LOTO zero-energy state verification');
    recommendedFocus.push('Arc flash barrier inspection');
    recommendedFocus.push('Electrical permit sign-off review');
  } else if (topHazard.toLowerCase().includes('confined')) {
    recommendedFocus.push('Calibrated multi-gas testing');
    recommendedFocus.push('Continuous ventilation monitoring');
    recommendedFocus.push('Standby observer emergency readiness');
  } else if (topHazard.toLowerCase().includes('chemical') || topHazard.toLowerCase().includes('gas')) {
    recommendedFocus.push('Toxic vapor monitoring');
    recommendedFocus.push('Impervious chemical PPE audit');
    recommendedFocus.push('SDS emergency containment briefing');
  } else {
    recommendedFocus.push(`${topHazard} barrier verification`);
    recommendedFocus.push(`${topActivity} pre-task safety briefing`);
    recommendedFocus.push('Supervisory physical walkthroughs');
  }

  // Filter params for deep link navigation to /reports
  const filterParams = {};
  if (prioritySiteId && prioritySiteId !== 'ALL') {
    filterParams.site = prioritySiteId;
  }
  if (topHazard && topHazard !== 'Operational Hazard' && topHazard !== 'None') {
    filterParams.hazard = topHazard;
  }
  if (sifCount > 0) {
    filterParams.risk = 'SIF-Precursor';
  } else if (highCount > 0) {
    filterParams.risk = 'High';
  }

  return {
    hasData: true,
    totalReports,
    highCount,
    sifCount,
    prioritySiteName,
    prioritySiteId,
    prioritySignal,
    recommendedFocus,
    filterParams,
  };
}

