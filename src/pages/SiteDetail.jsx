import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  FileSearch,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  FileText,
  TrendingUp,
  BarChart3,
  AlertOctagon,
  CheckCircle2,
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
import { SiteHealthBadge, RiskBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import { getSiteReports } from '../api/sifguardApi';
import {
  filterReports,
  getReportSummary,
  getRiskTrendSeries,
  formatReportCode,
  formatDateTime,
} from '../utils/filterReports';

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: 'overview' | 'reports' | 'history' | 'trends'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Reports tab filters
  const [reportSearch, setReportSearch] = useState('');
  const [reportRiskFilter, setReportRiskFilter] = useState('ALL');
  const [reportHazardFilter, setReportHazardFilter] = useState('ALL');

  // History tab time-range filters
  const [historyTimeRange, setHistoryTimeRange] = useState('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Trends tab time-range filters
  const [trendTimeRange, setTrendTimeRange] = useState('ALL');

  // Selected report for drawer inspection
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadSiteData();
  }, [siteId]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'reports', 'history', 'trends'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }

  async function loadSiteData() {
    setLoading(true);
    setError(null);
    try {
      const siteData = await getSiteReports(siteId);
      setSite(siteData);
    } catch (err) {
      setError(err.message || 'Operational intelligence record could not be retrieved.');
    } finally {
      setLoading(false);
    }
  }

  // All raw reports for this site
  const rawSiteReports = useMemo(() => site?.reports || [], [site]);

  // Unique hazards for filter dropdown
  const uniqueHazards = useMemo(() => {
    const set = new Set(rawSiteReports.map((r) => r.hazard).filter(Boolean));
    return Array.from(set).sort();
  }, [rawSiteReports]);

  // Filtered reports for Reports tab
  const filteredReports = useMemo(() => {
    return filterReports(rawSiteReports, {
      search: reportSearch,
      riskLevel: reportRiskFilter,
      hazard: reportHazardFilter,
      sort: 'newest',
    });
  }, [rawSiteReports, reportSearch, reportRiskFilter, reportHazardFilter]);

  // Filtered reports for History tab based on selected time range
  const filteredHistoryReports = useMemo(() => {
    return filterReports(rawSiteReports, {
      datePreset: historyTimeRange,
      startDate: historyStartDate,
      endDate: historyEndDate,
      sort: 'newest',
    });
  }, [rawSiteReports, historyTimeRange, historyStartDate, historyEndDate]);

  // Summary for History tab
  const historySummary = useMemo(() => {
    return getReportSummary(filteredHistoryReports);
  }, [filteredHistoryReports]);

  // Chronological grouping for History tab
  const historyGroups = useMemo(() => {
    const groups = {};
    filteredHistoryReports.forEach((r) => {
      const d = new Date(r.date || r.timestamp);
      const period = isNaN(d.getTime())
        ? 'Recent Events'
        : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);

      if (!groups[period]) groups[period] = [];
      groups[period].push(r);
    });

    return Object.entries(groups).map(([period, events]) => ({
      period,
      events,
    }));
  }, [filteredHistoryReports]);

  // Filtered reports for Trends tab
  const filteredTrendReports = useMemo(() => {
    return filterReports(rawSiteReports, {
      datePreset: trendTimeRange,
      sort: 'oldest',
    });
  }, [rawSiteReports, trendTimeRange]);

  const trendSummary = useMemo(() => {
    return getReportSummary(filteredTrendReports);
  }, [filteredTrendReports]);

  const trendChartSeries = useMemo(() => {
    return getRiskTrendSeries(filteredTrendReports);
  }, [filteredTrendReports]);

  // SIF precursors in the trend slice
  const sifPrecursorReports = useMemo(() => {
    return filteredTrendReports.filter(
      (r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true
    );
  }, [filteredTrendReports]);

  if (loading) {
    return (
      <AppShell title="Site Intelligence" subtitle="Facility Profile">
        <PageContainer>
          <TableSkeleton rows={8} />
        </PageContainer>
      </AppShell>
    );
  }

  if (error || !site) {
    return (
      <AppShell title="Site Intelligence" subtitle="Facility Profile">
        <PageContainer>
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Site Record Not Found</h3>
              <p className="text-xs text-slate-500 mt-1">{error || 'Unknown facility identifier.'}</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => navigate('/sites')} icon={ArrowLeft}>
                Back to Sites
              </Button>
              <Button variant="primary" onClick={loadSiteData} icon={RefreshCw}>
                Retry
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const highCount = site.highRiskCount || 0;
  const sifCount = site.sifCount || 0;
  const openAttentionCount = highCount + sifCount;

  return (
    <AppShell title={site.name} subtitle="Site Safety Intelligence">
      <PageContainer className="space-y-6">
        {/* Back Link Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/sites"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Sites Directory</span>
          </Link>

          <span className="text-[11px] font-mono text-slate-400">
            OIL Facility ID: {site.id}
          </span>
        </div>

        {/* Site Profile Header Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Facility Identity */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {site.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold text-xs">
                    {site.code || 'SITE'}
                  </span>
                  <SiteHealthBadge status={site.healthStatus} size="md" />
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    {site.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                  <span>{site.location || 'Assam'}</span>
                  <span>·</span>
                  <span>{site.type || 'Operational Site'}</span>
                  <span>·</span>
                  <span className="text-slate-600 font-medium">{site.healthDescription}</span>
                </p>
              </div>
            </div>

            {/* Actions: Analyze Reports & View Reports */}
            <div className="flex items-center gap-2.5 self-start lg:self-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleTabChange('reports')}
              >
                View Reports
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={FileSearch}
                onClick={() => navigate(`/submit?site=${site.id}`)}
              >
                Analyze Reports
              </Button>
            </div>
          </div>

          {/* Facility KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100">
            <KpiCard
              label="Reports"
              value={site.totalReports}
              description="Total observations logged"
              accent="default"
            />
            <KpiCard
              label="High Risk"
              value={highCount}
              description="Needs prompt review"
              accent="orange"
            />
            <KpiCard
              label="SIF Precursors"
              value={sifCount}
              description="Critical life-safety attention"
              accent="red"
            />
            <KpiCard
              label="Open Attention"
              value={openAttentionCount}
              description="Priority action items"
              accent={openAttentionCount > 0 ? 'orange' : 'default'}
            />
          </div>
        </div>

        {/* Navigation Tabs (Overview, Reports, History, Trends) */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-px">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('reports')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>Reports</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {rawSiteReports.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock size={13} />
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('trends')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'trends'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={13} />
            <span>Trends</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Recent High-Risk Observations */}
              <div className="lg:col-span-2 space-y-6">
                <Card
                  title="Recent High-Risk Observations"
                  subtitle="Critical precursors and high-severity events identified at this facility."
                >
                  {rawSiteReports.filter((r) => r.risk_level === 'High' || r.risk_level === 'SIF-Precursor').length > 0 ? (
                    <div className="divide-y divide-slate-100 -mx-6 -my-4">
                      {rawSiteReports
                        .filter((r) => r.risk_level === 'High' || r.risk_level === 'SIF-Precursor')
                        .slice(0, 4)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReport(r)}
                            className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start justify-between gap-4 group"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-500 font-semibold">
                                  {formatDateTime(r)}
                                </span>
                                <RiskBadge level={r.risk_level} size="sm" />
                                <span className="text-xs font-bold text-slate-800">{r.hazard}</span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed group-hover:text-slate-900">
                                {r.text_snippet || r.full_text || r.report_text}
                              </p>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                                <span>Activity: <strong className="text-slate-600">{r.activity}</strong></span>
                                <span>·</span>
                                <span>Barrier: <strong className="text-slate-600">{r.barrier_failure || 'None'}</strong></span>
                              </div>
                            </div>

                            <ChevronRight
                              size={16}
                              className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-2"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No high-risk or SIF precursor events recorded for this facility.
                    </p>
                  )}
                </Card>

                {/* General Recent Safety Activity */}
                <Card
                  title="Recent Safety Activity"
                  subtitle="Latest chronological logs and inspections from field teams."
                  action={
                    <Button variant="ghost" size="sm" onClick={() => handleTabChange('reports')}>
                      View All Reports
                    </Button>
                  }
                >
                  <div className="divide-y divide-slate-100 -mx-6 -my-4">
                    {rawSiteReports.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReport(r)}
                        className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <RiskBadge level={r.risk_level} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-slate-900">
                              {r.text_snippet || r.full_text}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {formatDateTime(r)} · {r.activity} · {r.hazard}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-blue-600 font-medium group-hover:underline flex items-center gap-0.5 shrink-0">
                          Inspect <ChevronRight size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Column: Recurring Facility Hazards & Protocol Integrity */}
              <div className="space-y-6">
                <Card
                  title="Top Hazards"
                  subtitle="Recurring hazard domains identified in report analysis."
                >
                  {site.topHazards && site.topHazards.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {site.topHazards.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-800">{item.hazard}</span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700">
                            {item.count} {item.count === 1 ? 'event' : 'events'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No recurrent hazard patterns detected.</p>
                  )}
                </Card>

                {/* Facility Safeguard Rule */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-800 text-[10px]">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span>Operational Safeguard Rule</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    High-risk events and SIF precursors trigger mandatory supervisory review and verification of primary physical barriers prior to shift continuation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS (SITE-SPECIFIC ONLY) */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Search */}
                <div className="sm:col-span-6">
                  <Input
                    placeholder="Search reports by hazard, activity, text..."
                    prefixIcon={Search}
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    size="sm"
                  />
                </div>

                {/* Risk Filter */}
                <div className="sm:col-span-3">
                  <Select
                    size="sm"
                    value={reportRiskFilter}
                    onChange={(val) => setReportRiskFilter(typeof val === 'object' && val?.target ? val.target.value : val)}
                    options={[
                      { value: 'ALL', label: 'All Risk Levels' },
                      { value: 'SIF-Precursor', label: 'SIF Precursor' },
                      { value: 'High', label: 'High Risk' },
                      { value: 'Medium', label: 'Medium Risk' },
                      { value: 'Low', label: 'Low Risk' },
                    ]}
                  />
                </div>

                {/* Hazard Filter */}
                <div className="sm:col-span-3">
                  <Select
                    size="sm"
                    value={reportHazardFilter}
                    onChange={(val) => setReportHazardFilter(typeof val === 'object' && val?.target ? val.target.value : val)}
                    options={[
                      { value: 'ALL', label: 'All Hazards' },
                      ...uniqueHazards.map((h) => ({ value: h, label: h })),
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Reports Table */}
            {filteredReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports found for this site"
                message="Try clearing your search query or adjusting the risk/hazard filters."
                actionLabel="Reset Filters"
                onAction={() => {
                  setReportSearch('');
                  setReportRiskFilter('ALL');
                  setReportHazardFilter('ALL');
                }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Report</th>
                        <th className="py-3 px-4 font-semibold">Risk</th>
                        <th className="py-3 px-4 font-semibold">Hazard</th>
                        <th className="py-3 px-4 font-semibold">Activity</th>
                        <th className="py-3 px-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((r) => {
                        const code = r.code || formatReportCode(r.id);

                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedReport(r)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                              {formatDateTime(r)}
                            </td>
                            <td className="py-3 px-4 max-w-md">
                              <span className="font-mono text-xs font-bold text-slate-700 mr-2">
                                {code}
                              </span>
                              <span className="text-xs text-slate-800 font-medium group-hover:text-blue-600 transition-colors">
                                {r.text_snippet || r.full_text || r.report_text}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <RiskBadge level={r.risk_level} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">
                              {r.hazard}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {r.activity}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <ChevronRight
                                size={15}
                                className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Showing {filteredReports.length} of {rawSiteReports.length} observations for {site.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Click any report to inspect details
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORY (UPGRADED SITE DETAIL HISTORY PER PART 3) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
              {/* History Header & Time Range Filter */}
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Safety History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Site-specific safety events over time for {site.name}.
                  </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar size={13} className="text-blue-600" />
                    <span>Time Range:</span>
                  </div>
                  <select
                    value={historyTimeRange}
                    onChange={(e) => setHistoryTimeRange(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Select history time range"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today (09 Sep 2026)</option>
                    <option value="THIS_WEEK">This Week</option>
                    <option value="THIS_MONTH">This Month</option>
                    <option value="THIS_YEAR">This Year</option>
                    <option value="CUSTOM">Custom Range...</option>
                  </select>
                </div>
              </div>

              {/* Conditional Custom Range Inputs */}
              {historyTimeRange === 'CUSTOM' && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">From:</span>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded font-mono"
                  />
                  <span className="font-semibold text-slate-700">To:</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
              )}

              {/* History Summary KPIs (Derived from Filtered Mock Data) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Reports
                  </span>
                  <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
                    {historySummary.totalReports}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    In selected period
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                    High Risk
                  </span>
                  <span className="text-xl font-bold text-amber-950 font-mono mt-0.5 block">
                    {historySummary.highCount}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Escalated events
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                    SIF Precursors
                  </span>
                  <span className="text-xl font-bold text-rose-950 font-mono mt-0.5 block">
                    {historySummary.sifCount}
                  </span>
                  <span className="text-[10px] text-rose-700 block mt-0.5">
                    Critical precursors
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Top Hazard
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate mt-1.5 block">
                    {historySummary.primaryHazard}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Predominant exposure
                  </span>
                </div>
              </div>

              {/* Chronological History Feed */}
              {historyGroups.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No chronological history in this period"
                  message="Try expanding the time range selector to view earlier facility records."
                  actionLabel="View All History"
                  onAction={() => setHistoryTimeRange('ALL')}
                />
              ) : (
                <div className="space-y-6 pt-2">
                  {historyGroups.map(({ period, events }) => (
                    <div key={period} className="space-y-3">
                      {/* Period Header */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono">
                          {period}
                        </span>
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-[11px] font-mono text-slate-400">
                          {events.length} {events.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>

                      {/* Operational Event Cards Feed */}
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        {events.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedReport(ev)}
                            className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                          >
                            {/* Left: Date / Time + Risk */}
                            <div className="flex items-center sm:items-start gap-3 sm:w-44 shrink-0">
                              <RiskBadge level={ev.risk_level} size="sm" />
                              <span className="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                                {formatDateTime(ev)}
                              </span>
                            </div>

                            {/* Middle: Hazard, Activity, Location, Barrier Failure */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                  {ev.hazard}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs text-slate-600 font-medium">
                                  {ev.activity}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 font-medium">
                                Location: <span className="text-slate-700">{ev.location || site.name}</span>
                              </p>

                              {/* Prominent Barrier Failure Callout */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium mt-1">
                                <ShieldAlert size={11} className="text-rose-600 shrink-0" />
                                <span>
                                  Barrier: <strong className="font-semibold">{ev.barrier_failure || 'None'}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Right: Action Chevron */}
                            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold shrink-0 self-end sm:self-center">
                              <span className="hidden sm:inline group-hover:underline">Inspect</span>
                              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TRENDS & TIME ANALYSIS (GENUINELY IMPLEMENTED PER PART 4) */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Header & Filter */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-600" />
                  <span>Time-Based Safety Analysis & Trends</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Longitudinal hazard patterns, barrier failure frequencies, and precursor distribution for {site.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Time Window:</span>
                <select
                  value={trendTimeRange}
                  onChange={(e) => setTrendTimeRange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  aria-label="Filter trend time window"
                >
                  <option value="ALL">All Recorded Events</option>
                  <option value="THIS_MONTH">This Month (Sep 2026)</option>
                  <option value="THIS_YEAR">This Year (2026)</option>
                </select>
              </div>
            </div>

            {/* 1. Recharts Risk Reports Over Time */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    Risk Reports Over Time
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological distribution of safety event severity ratings.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {filteredTrendReports.length} Events Analyzed
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {trendChartSeries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No trend data recorded for this time range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendChartSeries}
                      margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                      <Bar dataKey="Low" name="Low Risk" stackId="a" fill="#10b981" />
                      <Bar dataKey="Medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="High" name="High Risk" stackId="a" fill="#ea580c" />
                      <Bar dataKey="SIF-Precursor" name="SIF Precursor" stackId="a" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. Top Hazards & Top Activities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Top Hazards */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    Top Recurring Hazards
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hazard domains observed in {site.name} safety logs.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {trendSummary.topHazards.slice(0, 5).map((h) => (
                    <div key={h.hazard} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{h.hazard}</span>
                        <span className="font-mono text-slate-600 font-bold">
                          {h.count} ({h.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(8, h.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {trendSummary.topHazards.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">No hazards recorded.</p>
                  )}
                </div>
              </div>

              {/* Top Activities */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    Top Operational Activities
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Work activities during which deviations or events were logged.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {trendSummary.topActivities.slice(0, 5).map((act) => (
                    <div key={act.activity} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{act.activity}</span>
                        <span className="font-mono text-slate-600 font-bold">
                          {act.count} ({act.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-700 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(8, act.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {trendSummary.topActivities.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">No activities recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Barrier Failures Section */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    Recurring Barrier Failures
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Identified breaches in procedural, mechanical, or physical safeguards.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
                  {trendSummary.barrierFailures.length} Distinct Failure Modes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {trendSummary.barrierFailures.map((bf) => (
                  <div
                    key={bf.barrier}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1"
                  >
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {bf.barrier}
                    </span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Breach Count:</span>
                      <span className="font-mono font-bold text-slate-800">{bf.count}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-rose-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, bf.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SIF Precursor Section */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={16} className="text-rose-600" />
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    SIF Precursors — {sifPrecursorReports.length} Detected
                  </h4>
                </div>
                <span className="text-xs font-semibold text-rose-700">
                  Critical Life-Safety Alerts
                </span>
              </div>

              {sifPrecursorReports.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No SIF precursors detected in this period"
                  message="Zero fatal-potential or life-threatening barrier breakdown observations were recorded in this time range."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {sifPrecursorReports.map((sif) => (
                    <div
                      key={sif.id}
                      onClick={() => setSelectedReport(sif)}
                      className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-50/70 transition-colors cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-rose-950">
                          {formatDateTime(sif)}
                        </span>
                        <RiskBadge level={sif.risk_level} size="sm" />
                      </div>

                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-900">Hazard: {sif.hazard}</p>
                        <p className="text-slate-600">Activity: {sif.activity}</p>
                        <p className="text-rose-900 font-semibold pt-0.5">
                          Barrier: {sif.barrier_failure || 'None'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-rose-700 font-semibold pt-1 border-t border-rose-100">
                        <span>Click to inspect assessment</span>
                        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide-over Inspection Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={rawSiteReports}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />
      </PageContainer>
    </AppShell>
  );
}
