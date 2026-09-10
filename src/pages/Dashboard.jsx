import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  RefreshCw,
  Building2,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Clock,
  AlertTriangle,
  FileText,
  AlertOctagon,
  BarChart3,
  ExternalLink,
  ShieldX,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ClipboardCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import MetricCard from '../components/dashboard/MetricCard';
import { RiskBadge, SiteHealthBadge } from '../components/ui/Badge';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import Pagination from '../components/ui/Pagination';
import { getSites, getReports, getActionSummary } from '../api/sifguardApi';
import { useAppContext } from '../context/AppContext';
import {
  filterReports,
  getReportSummary,
  getRiskTrend,
  getRiskTrendSeries,
  getAttentionReports,
  getSiteRiskOverview,
  getPeriodLabel,
  getExecutiveSafetyBrief,
  formatReportCode,
  formatDateTime,
  formatDisplayDate,
} from '../utils/filterReports';

function CustomRiskTrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload || {};
  const period = data.fullPeriodLabel || data.displayDate || label || '';

  const low = data.Low ?? 0;
  const medium = data.Medium ?? 0;
  const high = data.High ?? 0;
  const sif = data['SIF-Precursor'] ?? 0;
  const total = data.total ?? (low + medium + high + sif);

  return (
    <div className="bg-slate-900/95 backdrop-blur-xs text-white border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs min-w-[175px] space-y-2">
      <div className="border-b border-slate-700/70 pb-1.5 font-bold text-slate-100 flex items-center justify-between">
        <span>{period}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            Low Risk
          </span>
          <span className="font-mono font-bold text-slate-200">{low}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
            Medium Risk
          </span>
          <span className="font-mono font-bold text-slate-200">{medium}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 inline-block" />
            High Risk
          </span>
          <span className="font-mono font-bold text-slate-200">{high}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
            SIF Precursor
          </span>
          <span className="font-mono font-bold text-slate-200">{sif}</span>
        </div>
      </div>
      <div className="border-t border-slate-700/70 pt-1.5 flex items-center justify-between font-bold text-white">
        <span>Total</span>
        <span className="font-mono text-sm text-blue-400">{total}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, sites, refreshSites } = useAppContext();

  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters with URL query param support
  const [selectedSite, setSelectedSite] = useState(searchParams.get('site') || 'ALL');
  const [timeRange, setTimeRange] = useState(searchParams.get('period') || 'THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected report for slide-over drawer
  const [selectedReport, setSelectedReport] = useState(null);

  // Risk Trend Time Intelligence state
  const [trendGranularity, setTrendGranularity] = useState('DAILY');
  const [trendSpecificDate, setTrendSpecificDate] = useState('2026-09-09');

  // HSE Action Tracking Summary state
  const [actionSummary, setActionSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    pendingVerification: 0,
    closed: 0,
    priorities: {
      immediate: 0,
      priority: 0,
      standard: 0,
      ongoing: 0,
    },
  });

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update actions summary whenever selected site changes
  useEffect(() => {
    async function updateActions() {
      try {
        const actionsData = await getActionSummary(selectedSite);
        if (actionsData) {
          setActionSummary(actionsData);
        }
      } catch (err) {
        console.error('Failed to update action summary:', err);
      }
    }
    updateActions();
  }, [selectedSite]);

  // Sync URL params when state changes
  useEffect(() => {
    const params = {};
    if (selectedSite !== 'ALL') params.site = selectedSite;
    if (timeRange !== 'THIS_MONTH') params.period = timeRange;
    setSearchParams(params, { replace: true });
  }, [selectedSite, timeRange, setSearchParams]);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [reportsData, actionsData] = await Promise.all([
        getReports(),
        getActionSummary(selectedSite),
      ]);
      setAllReports(reportsData || []);
      if (actionsData) {
        setActionSummary(actionsData);
      }
      refreshSites();
    } catch (err) {
      setError(err.message || 'Unable to retrieve safety metrics.');
    } finally {
      setLoading(false);
    }
  }

  const currentSiteObj = useMemo(() => {
    if (selectedSite === 'ALL') return null;
    return sites.find((s) => s.id === selectedSite) || null;
  }, [sites, selectedSite]);

  // Scoped reports based on both selected site and time range
  const scopedReports = useMemo(() => {
    return filterReports(allReports, {
      siteId: selectedSite,
      datePreset: timeRange,
      startDate,
      endDate,
      sort: 'newest',
    });
  }, [allReports, selectedSite, timeRange, startDate, endDate]);

  // Executive summary derived dynamically from scoped dataset
  const scopedSummary = useMemo(() => {
    return getReportSummary(scopedReports);
  }, [scopedReports]);

  // Compact executive safety brief derived dynamically from scope
  const executiveBrief = useMemo(() => {
    return getExecutiveSafetyBrief(scopedReports, selectedSite, sites);
  }, [scopedReports, selectedSite, sites]);

  // High-priority reports for "Requires Attention"
  const attentionReports = useMemo(() => {
    return getAttentionReports(scopedReports, 4);
  }, [scopedReports]);

  // Trend source reports based on selected site and granularity
  const trendSourceReports = useMemo(() => {
    if (trendGranularity === 'SPECIFIC_DATE') {
      return filterReports(allReports, {
        siteId: selectedSite,
        datePreset: 'SPECIFIC_DATE',
        specificDate: trendSpecificDate,
      });
    }
    return scopedReports;
  }, [trendGranularity, allReports, selectedSite, trendSpecificDate, scopedReports]);

  // Trend series for Recharts
  const trendSeries = useMemo(() => {
    return getRiskTrend(trendSourceReports, {
      granularity: trendGranularity,
      specificDate: trendSpecificDate,
    });
  }, [trendSourceReports, trendGranularity, trendSpecificDate]);

  // Dynamic total events included in Risk Trend scope
  const trendTotalEvents = useMemo(() => {
    return trendSeries.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [trendSeries]);

  // SIF precursors in current period
  const sifPrecursorReports = useMemo(() => {
    return scopedReports.filter(
      (r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true
    );
  }, [scopedReports]);

  // Site Risk Overview table (when All Sites)
  const siteRiskList = useMemo(() => {
    return getSiteRiskOverview(scopedReports, sites);
  }, [scopedReports, sites]);

  // Local Pagination states for high-density sections
  const [sifPage, setSifPage] = useState(1);
  const SIF_PAGE_SIZE = 6;

  const [recentPage, setRecentPage] = useState(1);
  const RECENT_PAGE_SIZE = 6;

  const [siteListPage, setSiteListPage] = useState(1);
  const SITE_LIST_PAGE_SIZE = 6;

  // Reset local pagination when scope changes
  useEffect(() => {
    setSifPage(1);
    setRecentPage(1);
    setSiteListPage(1);
  }, [selectedSite, timeRange, startDate, endDate]);

  // Paginated SIF precursors: DATA -> FILTER -> SORT -> PAGINATE -> DISPLAY
  const paginatedSifReports = useMemo(() => {
    const start = (sifPage - 1) * SIF_PAGE_SIZE;
    return sifPrecursorReports.slice(start, start + SIF_PAGE_SIZE);
  }, [sifPrecursorReports, sifPage, SIF_PAGE_SIZE]);

  // Paginated Site Risk Overview
  const paginatedSiteRiskList = useMemo(() => {
    const start = (siteListPage - 1) * SITE_LIST_PAGE_SIZE;
    return siteRiskList.slice(start, start + SITE_LIST_PAGE_SIZE);
  }, [siteRiskList, siteListPage, SITE_LIST_PAGE_SIZE]);

  // Paginated recent safety activity feed
  const paginatedRecentReports = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PAGE_SIZE;
    return scopedReports.slice(start, start + RECENT_PAGE_SIZE);
  }, [scopedReports, recentPage, RECENT_PAGE_SIZE]);

  if (loading) {
    return (
      <AppShell title="Safety Intelligence" subtitle="Telemetry Overview">
        <PageContainer>
          <DashboardSkeleton />
        </PageContainer>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Safety Intelligence" subtitle="Telemetry Overview">
        <PageContainer>
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Unable to load safety intelligence
              </h3>
              <p className="text-[13px] text-slate-500 mt-1">{error}</p>
            </div>
            <Button variant="primary" onClick={loadDashboardData} icon={RefreshCw}>
              Retry Connection
            </Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const periodLabel = getPeriodLabel(timeRange, startDate, endDate);
  const totalReports = scopedSummary.totalReports;
  const highCount = scopedSummary.highCount;
  const sifCount = scopedSummary.sifCount;
  const sitesReportingCount = scopedSummary.sitesReporting;

  return (
    <AppShell title="Safety Intelligence" subtitle="Executive Dashboard">
      <PageContainer maxWidth="fluid" className="space-y-4 sm:space-y-5">
        {/* 1. DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2.5 border-b border-[#D1D5DB]/80 dark:border-[#263244]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] tracking-[0.08em]">
                Oil India Limited HSE Operations
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-none">
              Safety Intelligence Dashboard
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#334155] dark:text-[#CBD5E1] mt-1 font-normal">
              Monitor emerging safety risks and SIF precursor signals across operational sites.
            </p>
          </div>

          {/* Controls: Site Selector & Time Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Site Scope Selector */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-sm font-semibold text-[#334155] dark:text-[#CBD5E1] shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <Building2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">Site:</span>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-transparent font-semibold text-[#0F172A] dark:text-[#F8FAFC] border-none outline-none cursor-pointer pr-1 min-w-0"
                aria-label="Filter site scope"
              >
                <option value="ALL" className="dark:bg-[#172033] dark:text-[#F8FAFC]">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-[#172033] dark:text-[#F8FAFC]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selector */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-sm font-semibold text-[#334155] dark:text-[#CBD5E1] shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <Calendar size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
              <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">Time:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent font-semibold text-[#0F172A] dark:text-[#F8FAFC] border-none outline-none cursor-pointer pr-1"
                aria-label="Filter time range"
              >
                <option value="TODAY" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Today</option>
                <option value="THIS_WEEK" className="dark:bg-[#172033] dark:text-[#F8FAFC]">This Week</option>
                <option value="THIS_MONTH" className="dark:bg-[#172033] dark:text-[#F8FAFC]">This Month</option>
                <option value="THIS_YEAR" className="dark:bg-[#172033] dark:text-[#F8FAFC]">This Year</option>
                <option value="CUSTOM" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Custom Range...</option>
                <option value="ALL" className="dark:bg-[#172033] dark:text-[#F8FAFC]">All Recorded</option>
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={loadDashboardData}
              title="Refresh telemetry"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Conditional Custom Date Range Bar */}
        {timeRange === 'CUSTOM' && (
          <div className="p-2.5 sm:p-3 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-xl flex items-center gap-3 text-xs shadow-2xs">
            <span className="font-bold text-[#334155] dark:text-[#CBD5E1]">Custom Period:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] dark:text-[#94A3B8]">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] dark:text-[#94A3B8]">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>
          </div>
        )}

        {/* CONTEXT BAR */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-3 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] dark:text-[#94A3B8] uppercase text-[12px] font-bold tracking-wider">
                Scope:
              </span>
              <strong className="text-[14px] text-[#0F172A] dark:text-[#F8FAFC] font-bold">
                {currentSiteObj ? `${currentSiteObj.name} (${currentSiteObj.location})` : 'All Operational Sites'}
              </strong>
            </div>

            <span className="text-[#D1D5DB] dark:text-[#263244]">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] dark:text-[#94A3B8] uppercase text-[12px] font-bold tracking-wider">
                Period:
              </span>
              <span className="text-[14px] text-[#1E293B] dark:text-[#CBD5E1] font-semibold font-mono">{periodLabel}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] font-medium">
            {totalReports} observations evaluated
            {currentSiteObj ? ` · Health: ${currentSiteObj.healthStatus}` : ` across ${sitesReportingCount} facilities`}
          </div>
        </div>

        {/* EXECUTIVE SAFETY BRIEF */}
        <div className="rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] p-3.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
          {/* Header & Metrics Snapshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D1D5DB]/60 dark:border-[#263244]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-[12px] font-bold font-mono uppercase tracking-wider">
                Executive Safety Brief
              </span>
              <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono">
                09 SEP 2026 · {currentSiteObj ? currentSiteObj.name.toUpperCase() : 'ALL SITES'}
              </span>
            </div>

            {/* Metric summary pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] font-semibold border border-[#D1D5DB]/60 dark:border-[#263244]">
                {executiveBrief.totalReports} Reports
              </span>
              <span className="px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 font-semibold">
                {executiveBrief.highCount} High Risk
              </span>
              <span className="px-2.5 py-1 rounded-md bg-red-50 dark:bg-rose-950/40 text-red-800 dark:text-rose-300 border border-red-200 dark:border-rose-900/50 font-bold">
                {executiveBrief.sifCount} SIF Precursors
              </span>
            </div>
          </div>

          {/* Content: Priority Signal + Recommended Focus */}
          {executiveBrief.hasData && executiveBrief.totalReports > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left: Priority Signal */}
              <div className="md:col-span-6 space-y-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                  <span>Priority Safety Signal</span>
                </span>
                <p className="text-[14px] text-[#334155] dark:text-[#CBD5E1] font-medium leading-relaxed">
                  {executiveBrief.prioritySignal}
                </p>
              </div>

              {/* Center: Recommended Focus */}
              <div className="md:col-span-4 space-y-1.5 border-t md:border-t-0 md:border-l border-[#D1D5DB]/60 dark:border-[#263244] pt-2 md:pt-0 md:pl-4">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                  Recommended Operational Focus
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {executiveBrief.recommendedFocus.map((focus, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8FAFC] dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] text-[#334155] dark:text-[#CBD5E1] text-xs font-medium leading-none"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                      <span>{focus}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Action Button to Related Reports */}
              <div className="md:col-span-2 flex md:justify-end pt-1 md:pt-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => {
                    const query = new URLSearchParams();
                    if (executiveBrief.filterParams.site) query.set('site', executiveBrief.filterParams.site);
                    if (executiveBrief.filterParams.hazard) query.set('hazard', executiveBrief.filterParams.hazard);
                    if (executiveBrief.filterParams.risk) query.set('risk', executiveBrief.filterParams.risk);
                    navigate(`/reports?${query.toString()}`);
                  }}
                  className="w-full md:w-auto font-semibold"
                  aria-label="View related priority reports"
                >
                  View Related Reports
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              No priority pattern identified for the selected period.
            </div>
          )}
        </div>

        {/* 2. EXECUTIVE KPI STRIP (WITH DRILL-DOWNS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <MetricCard
            label="Total Reports"
            value={totalReports}
            indicator={currentSiteObj ? `Scoped to ${currentSiteObj.name}` : `${sitesReportingCount} sites active`}
            color="default"
            onClick={() => navigate(selectedSite === 'ALL' ? '/reports' : `/reports?site=${selectedSite}`)}
          />
          <MetricCard
            label="High Risk"
            value={highCount}
            indicator={`${totalReports > 0 ? Math.round((highCount / totalReports) * 100) : 0}% of evaluated events`}
            color="orange"
            onClick={() => navigate(selectedSite === 'ALL' ? '/reports?risk=High' : `/reports?risk=High&site=${selectedSite}`)}
          />
          <MetricCard
            label="SIF Precursors"
            value={sifCount}
            indicator={sifCount > 0 ? 'Urgent precursor action' : 'Zero detected in period'}
            color="red"
            highlight={sifCount > 0}
            onClick={() => navigate(selectedSite === 'ALL' ? '/reports?risk=SIF-Precursor' : `/reports?risk=SIF-Precursor&site=${selectedSite}`)}
          />
          <MetricCard
            label="Sites Reporting"
            value={sitesReportingCount}
            indicator={selectedSite === 'ALL' ? 'Company-wide operations' : 'Single site focus'}
            color="default"
            onClick={() => navigate('/sites')}
          />
        </div>

        {/* 2.5 COMPACT ACTION STATUS SUMMARY */}
        <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="text-base font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                Action Status
              </h3>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-normal hidden sm:inline truncate">
                Operational safety response & interventions
              </span>
            </div>
            <Link
              to="/review"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
            >
              <span>Go to Review Queue</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Open */}
            <div
              onClick={() => navigate('/review?status=OPEN')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/review?status=OPEN');
                }
              }}
              className="p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#172033] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 border border-[#D1D5DB] dark:border-[#263244] hover:border-amber-300 dark:hover:border-amber-700 rounded-lg transition-all cursor-pointer group space-y-0.5 shadow-2xs"
              title="Filter Review Queue: Open actions"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] group-hover:text-amber-800 dark:group-hover:text-amber-300">
                <span>Open</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-[24px] sm:text-[26px] font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-amber-900 dark:group-hover:text-amber-200">
                {actionSummary.open}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] group-hover:text-amber-700 dark:group-hover:text-amber-300 font-medium">
                Requires assignment &rarr;
              </div>
            </div>

            {/* In Progress */}
            <div
              onClick={() => navigate('/review?status=IN_PROGRESS')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/review?status=IN_PROGRESS');
                }
              }}
              className="p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#172033] hover:bg-blue-50/70 dark:hover:bg-blue-950/30 border border-[#D1D5DB] dark:border-[#263244] hover:border-blue-300 dark:hover:border-blue-700 rounded-lg transition-all cursor-pointer group space-y-0.5 shadow-2xs"
              title="Filter Review Queue: In Progress actions"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] group-hover:text-blue-800 dark:group-hover:text-blue-300">
                <span>In Progress</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="text-[24px] sm:text-[26px] font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-blue-900 dark:group-hover:text-blue-200">
                {actionSummary.inProgress}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium">
                Active remediation &rarr;
              </div>
            </div>

            {/* Pending Verification */}
            <div
              onClick={() => navigate('/review?status=PENDING_VERIFICATION')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/review?status=PENDING_VERIFICATION');
                }
              }}
              className="p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#172033] hover:bg-sky-50/70 dark:hover:bg-sky-950/30 border border-[#D1D5DB] dark:border-[#263244] hover:border-sky-300 dark:hover:border-sky-700 rounded-lg transition-all cursor-pointer group space-y-0.5 shadow-2xs"
              title="Filter Review Queue: Pending Verification"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] group-hover:text-sky-800 dark:group-hover:text-sky-300">
                <span>Pending Verification</span>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              </div>
              <div className="text-[24px] sm:text-[26px] font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-sky-900 dark:group-hover:text-sky-200">
                {actionSummary.pendingVerification}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] group-hover:text-sky-700 dark:group-hover:text-sky-300 font-medium">
                Awaiting sign-off &rarr;
              </div>
            </div>

            {/* Closed */}
            <div
              onClick={() => navigate('/review?status=CLOSED')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/review?status=CLOSED');
                }
              }}
              className="p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#172033] hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border border-[#D1D5DB] dark:border-[#263244] hover:border-emerald-300 dark:hover:border-emerald-700 rounded-lg transition-all cursor-pointer group space-y-0.5 shadow-2xs"
              title="Filter Review Queue: Closed actions"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                <span>Closed</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[24px] sm:text-[26px] font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-emerald-900 dark:group-hover:text-emerald-200">
                {actionSummary.closed}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-medium">
                Verified & resolved &rarr;
              </div>
            </div>
          </div>

          {/* Priority Breakdown Strip */}
          <div className="pt-2 border-t border-[#D1D5DB]/60 dark:border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-[#334155] dark:text-[#CBD5E1] font-semibold">
              <AlertOctagon size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
              <span>Priority Breakdown:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/review?priority=IMMEDIATE')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 transition-colors font-semibold text-xs cursor-pointer"
                title="View Immediate priority reports in Review Queue"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                <span>Immediate</span>
                <span className="font-mono font-bold bg-white dark:bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 ml-0.5 text-xs">
                  {actionSummary.priorities?.immediate ?? 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/review?priority=PRIORITY')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 transition-colors font-semibold text-xs cursor-pointer"
                title="View Priority reports in Review Queue"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                <span>Priority</span>
                <span className="font-mono font-bold bg-white dark:bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 ml-0.5 text-xs">
                  {actionSummary.priorities?.priority ?? 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/review?priority=STANDARD')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#334155] dark:text-[#CBD5E1] border border-[#D1D5DB] dark:border-[#263244] transition-colors font-semibold text-xs cursor-pointer"
                title="View Standard priority reports in Review Queue"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Standard</span>
                <span className="font-mono font-bold bg-white dark:bg-[#111827] px-1.5 py-0.2 rounded border border-[#D1D5DB] dark:border-[#263244] text-[#0F172A] dark:text-[#F8FAFC] ml-0.5 text-xs">
                  {actionSummary.priorities?.standard ?? 0}
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* 3. REQUIRES ATTENTION / PRIORITY SECTION */}
        <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2 gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Requires Attention
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Prioritized precursor and high-severity signals requiring operational intervention.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-[#334155] dark:text-[#CBD5E1] bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#D1D5DB] dark:border-[#263244] px-2.5 py-0.5 rounded shrink-0">
              {attentionReports.length} Priority Items
            </span>
          </div>

          {attentionReports.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
              No high-priority safety signals requiring immediate attention in this period.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {attentionReports.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedReport(item)}
                  className={`p-3 sm:p-3.5 rounded-lg border transition-colors cursor-pointer group shadow-2xs space-y-2 ${
                    item.risk_level === 'SIF-Precursor'
                      ? 'border-[#D1D5DB] dark:border-[#263244] border-l-[3px] border-l-[#DC2626] dark:border-l-[#F43F5E] bg-white dark:bg-[#172033] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'
                      : item.risk_level === 'High'
                      ? 'border-[#D1D5DB] dark:border-[#263244] border-l-[3px] border-l-[#EA580C] dark:border-l-[#FB923C] bg-white dark:bg-[#172033] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'
                      : 'border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#172033] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <RiskBadge level={item.risk_level} size="sm" />
                    <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] font-medium shrink-0">
                      {formatDateTime(item)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1 min-w-0">
                      <Building2 size={12} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                      <span className="truncate">{item.site || item.siteName}</span>
                    </p>
                    <p className="text-sm font-semibold text-[#334155] dark:text-[#CBD5E1] leading-snug">
                      {item.hazard} · <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">{item.activity}</span>
                    </p>
                  </div>

                  {item.barrier_failure && item.barrier_failure !== 'None' && (
                    <p className="text-xs font-semibold pt-1 border-t border-[#D1D5DB]/60 dark:border-[#263244] truncate text-rose-700 dark:text-rose-400">
                      Barrier: {item.barrier_failure}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8]">{formatReportCode(item.id)}</span>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                      Inspect <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. RISK TREND SECTION */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2.5">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Risk Trend</span>
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Timeline distribution of safety observations by severity classification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Compact Granularity Selector */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <label htmlFor="risk-trend-granularity" className="sr-only">
                  Risk Trend Time Granularity
                </label>
                <Clock size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                <select
                  id="risk-trend-granularity"
                  aria-label="Risk Trend Time Granularity"
                  value={trendGranularity}
                  onChange={(e) => setTrendGranularity(e.target.value)}
                  className="bg-transparent font-medium text-[#0F172A] dark:text-[#F8FAFC] border-none outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="DAILY" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Daily</option>
                  <option value="WEEKLY" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Weekly</option>
                  <option value="MONTHLY" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Monthly</option>
                  <option value="YEARLY" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Yearly</option>
                  <option value="SPECIFIC_DATE" className="dark:bg-[#172033] dark:text-[#F8FAFC]">Specific Date</option>
                </select>
              </div>

              {/* Specific Date Picker Input */}
              {trendGranularity === 'SPECIFIC_DATE' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-xs text-[#334155] dark:text-[#CBD5E1] shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                  <label htmlFor="risk-trend-date" className="sr-only">
                    Select Specific Date
                  </label>
                  <Calendar size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                  <input
                    id="risk-trend-date"
                    aria-label="Select Specific Date"
                    type="date"
                    value={trendSpecificDate}
                    onChange={(e) => setTrendSpecificDate(e.target.value)}
                    className="bg-transparent font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC] border-none outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* Dynamic Total Events */}
              <span className="text-xs font-mono font-bold text-[#334155] dark:text-[#CBD5E1] bg-[#F1F5F9] dark:bg-[#1E293B] px-2.5 py-1 rounded-md border border-[#D1D5DB] dark:border-[#263244] shrink-0">
                {trendTotalEvents} Total Events
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-60 w-full pt-1">
            {trendSeries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#D1D5DB] dark:border-[#263244] rounded-lg bg-[#F8FAFC] dark:bg-[#172033]">
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] mb-2">
                  <BarChart3 size={20} />
                </div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase tracking-wider">
                  NO SAFETY OBSERVATIONS
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm">
                  {trendGranularity === 'SPECIFIC_DATE'
                    ? `No safety observations recorded on ${formatDisplayDate(trendSpecificDate)}.`
                    : 'No safety observations found for the selected period.'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendSeries}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#263244' : '#E2E8F0'} vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                    axisLine={{ stroke: theme === 'dark' ? '#263244' : '#CBD5E1' }}
                    tickLine={false}
                    interval={trendSeries.length > 10 ? 'preserveStartEnd' : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: theme === 'dark' ? '#94A3B8' : '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomRiskTrendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: theme === 'dark' ? '#CBD5E1' : '#475569' }} />
                  <Bar dataKey="Low" name="Low Risk" stackId="a" fill={theme === 'dark' ? '#34d399' : '#10b981'} />
                  <Bar dataKey="Medium" name="Medium Risk" stackId="a" fill={theme === 'dark' ? '#fbbf24' : '#f59e0b'} />
                  <Bar dataKey="High" name="High Risk" stackId="a" fill={theme === 'dark' ? '#fb923c' : '#ea580c'} />
                  <Bar dataKey="SIF-Precursor" name="SIF Precursor" stackId="a" fill={theme === 'dark' ? '#f43f5e' : '#dc2626'} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. SITE RISK OVERVIEW (When All Sites is Selected) */}
        {selectedSite === 'ALL' && (
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Site Risk Overview
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Comparative breakdown of active facilities, calculated health index, and precursor density.
                </p>
              </div>
              <Link
                to="/sites"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                <span>View all sites</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#D1D5DB] dark:border-[#263244] bg-[#F8FAFC] dark:bg-[#0A0F18] text-[12px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Health Status</th>
                    <th className="py-2.5 px-3">Reports</th>
                    <th className="py-2.5 px-3">High Risk</th>
                    <th className="py-2.5 px-3">SIF Precursors</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]/60 dark:divide-[#263244]/60">
                  {paginatedSiteRiskList.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => navigate(`/sites/${st.id}`)}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                        <Building2 size={13} className="text-[#64748B] dark:text-[#94A3B8] group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                        <span>{st.name}</span>
                        <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">({st.location})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <SiteHealthBadge status={st.healthStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {st.totalReports}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold ${st.highRisk > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                          {st.highRisk}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold ${st.sifPrecursors > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                          {st.sifPrecursors}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs group-hover:underline inline-flex items-center gap-0.5">
                          View <ChevronRight size={12} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={siteListPage}
              totalItems={siteRiskList.length}
              pageSize={SITE_LIST_PAGE_SIZE}
              onPageChange={setSiteListPage}
              itemLabel="facilities"
              className="mt-2.5"
            />
          </div>
        )}

        {/* 6. SIF PRECURSOR SIGNALS SECTION */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertOctagon size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                SIF Precursor Signals — {sifPrecursorReports.length} Detected
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 shrink-0">
              Critical Life-Safety Alerts
            </span>
          </div>

          {sifPrecursorReports.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No SIF precursor signals detected in this period"
              message="Zero fatal-potential or life-threatening barrier breakdown observations were recorded in this operational window."
            />
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {paginatedSifReports.map((sif) => (
                  <div
                    key={sif.id}
                    onClick={() => setSelectedReport(sif)}
                    className="p-3 sm:p-3.5 rounded-lg border border-[#D1D5DB] dark:border-[#263244] border-l-[3px] border-l-[#DC2626] dark:border-l-[#F43F5E] bg-white dark:bg-[#172033] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors cursor-pointer space-y-2 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#64748B] dark:text-[#94A3B8] shrink-0">
                        {formatDateTime(sif)}
                      </span>
                      <RiskBadge level={sif.risk_level} size="sm" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC]">{sif.site || sif.siteName}</p>
                      <p className="text-sm text-[#334155] dark:text-[#CBD5E1] font-semibold leading-snug">{sif.hazard} · {sif.activity}</p>
                      <p className="text-rose-700 dark:text-rose-400 font-semibold text-xs pt-0.5">
                        Barrier: {sif.barrier_failure || 'Defect'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#D1D5DB]/60 dark:border-[#263244]">
                      <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8]">{formatReportCode(sif.id)}</span>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                        Inspect <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={sifPage}
                totalItems={sifPrecursorReports.length}
                pageSize={SIF_PAGE_SIZE}
                onPageChange={setSifPage}
                itemLabel="precursor signals"
                className="mt-2.5"
              />
            </div>
          )}
        </div>

        {/* 7 & 8. TOP HAZARDS & RISK BY ACTIVITY (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Top Recurring Hazards */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Top Recurring Hazards
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Click any hazard to investigate related safety reports.
                </p>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] font-semibold">Ranked</span>
            </div>

            <div className="space-y-2">
              {scopedSummary.topHazards.slice(0, 5).map((h) => (
                <div
                  key={h.hazard}
                  onClick={() => navigate(`/reports?hazard=${encodeURIComponent(h.hazard)}`)}
                  className="space-y-1 group cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#172033] p-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-sm text-[#334155] dark:text-[#CBD5E1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {h.hazard}
                    </span>
                    <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">
                      {h.count} ({h.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, h.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk by Operational Activity */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                  Risk by Operational Activity
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Task categories associated with reported risk events.
                </p>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] font-semibold">Ranked</span>
            </div>

            <div className="space-y-2">
              {scopedSummary.topActivities.slice(0, 5).map((act) => (
                <div
                  key={act.activity}
                  onClick={() => navigate(`/reports?activity=${encodeURIComponent(act.activity)}`)}
                  className="space-y-1 group cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#172033] p-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-sm text-[#334155] dark:text-[#CBD5E1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {act.activity}
                    </span>
                    <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] font-bold">
                      {act.count} ({act.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#334155] dark:bg-slate-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, act.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9. RECURRING BARRIER FAILURES */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2 gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                Recurring Barrier Failures
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Identified breaches in procedural, mechanical, or physical safeguards with risk associations.
              </p>
            </div>
            <span className="text-xs font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded font-semibold">
              {scopedSummary.barrierFailures.length} Failure Modes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {scopedSummary.barrierFailures.map((bf) => (
              <div
                key={bf.barrier}
                onClick={() => navigate('/reports')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/reports');
                  }
                }}
                className="p-2.5 sm:p-3 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-[#F8FAFC] dark:bg-[#172033] hover:bg-white dark:hover:bg-[#1E293B] hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer space-y-1 group shadow-2xs"
                title="Investigate safety reports with barrier failures"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {bf.barrier}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] px-1.5 py-0.5 rounded shrink-0">
                    {bf.count}
                  </span>
                </div>

                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
                  <span>Risk Severity:</span>
                  <strong className="text-xs text-[#334155] dark:text-[#CBD5E1] font-semibold font-mono">
                    {bf.riskAssociation}
                  </strong>
                </div>

                <div className="w-full bg-[#E2E8F0] dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-rose-600 dark:bg-rose-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, bf.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10. RECENT SAFETY ACTIVITY FEED */}
        <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                Recent Safety Activity
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate(selectedSite === 'ALL' ? '/reports' : `/reports?site=${selectedSite}`)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all reports</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-[#D1D5DB]/60 dark:divide-[#263244]/60 -mx-3.5 sm:-mx-4 -my-2">
            {paginatedRecentReports.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className="px-4 sm:px-5 py-2.5 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
              >
                {/* Date / Time */}
                <div className="w-36 shrink-0 font-mono text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                  {formatDateTime(r)}
                </div>

                {/* Site */}
                <div className="w-40 shrink-0 font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                  <Building2 size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                  <span className="truncate">{r.site || r.siteName}</span>
                </div>

                {/* Risk Badge */}
                <div className="w-32 shrink-0">
                  <RiskBadge level={r.risk_level} size="sm" />
                </div>

                {/* Hazard & Activity */}
                <div className="min-w-0 flex-1 truncate text-sm text-[#334155] dark:text-[#CBD5E1]">
                  <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{r.hazard}</strong>
                  <span className="text-[#64748B] dark:text-[#94A3B8] mx-1.5">·</span>
                  <span>{r.activity}</span>
                </div>

                {/* Chevron */}
                <div className="shrink-0 text-[#94A3B8] dark:text-[#64748B] group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={15} />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={recentPage}
            totalItems={scopedReports.length}
            pageSize={RECENT_PAGE_SIZE}
            onPageChange={setRecentPage}
            itemLabel="recent safety activities"
            className="mt-3"
          />
        </div>

        {/* Slide-over Inspection Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={scopedReports}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />
      </PageContainer>
    </AppShell>
  );
}
