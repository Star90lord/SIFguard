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
import { getSites, getReports } from '../api/sifguardApi';
import {
  filterReports,
  getReportSummary,
  getRiskTrendSeries,
  getAttentionReports,
  getSiteRiskOverview,
  getPeriodLabel,
  formatReportCode,
  formatDateTime,
} from '../utils/filterReports';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sites, setSites] = useState([]);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      const [siteData, reportsData] = await Promise.all([
        getSites(),
        getReports(),
      ]);
      setSites(siteData || []);
      setAllReports(reportsData || []);
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

  // High-priority reports for "Requires Attention"
  const attentionReports = useMemo(() => {
    return getAttentionReports(scopedReports, 4);
  }, [scopedReports]);

  // Trend series for Recharts
  const trendSeries = useMemo(() => {
    return getRiskTrendSeries(scopedReports);
  }, [scopedReports]);

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

  // Recent 5 reports for activity feed
  const recentReports = useMemo(() => {
    return [...scopedReports].slice(0, 5);
  }, [scopedReports]);

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
              <p className="text-xs text-slate-500 mt-1">{error}</p>
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
      <PageContainer className="space-y-6">
        {/* 1. DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Oil India Limited HSE Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Safety Intelligence Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Monitor emerging safety risks and SIF precursor signals across operational sites.
            </p>
          </div>

          {/* Controls: Site Selector & Time Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Site Scope Selector */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
              <Building2 size={14} className="text-blue-600" />
              <span>Site:</span>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-transparent font-medium text-slate-900 border-none outline-none cursor-pointer pr-1"
                aria-label="Filter site scope"
              >
                <option value="ALL">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selector */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar size={14} className="text-slate-400" />
              <span>Time:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent font-medium text-slate-900 border-none outline-none cursor-pointer pr-1"
                aria-label="Filter time range"
              >
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="CUSTOM">Custom Range...</option>
                <option value="ALL">All Recorded</option>
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">Custom Period:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800"
              />
            </div>
          </div>
        )}

        {/* CONTEXT BAR */}
        <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                Scope:
              </span>
              <strong className="text-slate-900 font-bold">
                {currentSiteObj ? `${currentSiteObj.name} (${currentSiteObj.location})` : 'All Operational Sites'}
              </strong>
            </div>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                Period:
              </span>
              <span className="text-slate-800 font-semibold font-mono">{periodLabel}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {totalReports} observations evaluated
            {currentSiteObj ? ` · Health: ${currentSiteObj.healthStatus}` : ` across ${sitesReportingCount} facilities`}
          </div>
        </div>

        {/* 2. EXECUTIVE KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <MetricCard
            label="Total Reports"
            value={totalReports}
            indicator={currentSiteObj ? `Scoped to ${currentSiteObj.name}` : `${sitesReportingCount} sites active`}
            color="default"
          />
          <MetricCard
            label="High Risk"
            value={highCount}
            indicator={`${totalReports > 0 ? Math.round((highCount / totalReports) * 100) : 0}% of evaluated events`}
            color="orange"
          />
          <MetricCard
            label="SIF Precursors"
            value={sifCount}
            indicator={sifCount > 0 ? 'Urgent precursor action' : 'Zero detected in period'}
            color="red"
            highlight={sifCount > 0}
          />
          <MetricCard
            label="Sites Reporting"
            value={sitesReportingCount}
            indicator={selectedSite === 'ALL' ? 'Company-wide operations' : 'Single site focus'}
            color="default"
          />
        </div>

        {/* 3. REQUIRES ATTENTION / PRIORITY SECTION */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Requires Attention
                </h3>
                <p className="text-xs text-slate-500">
                  Prioritized precursor and high-severity signals requiring operational intervention.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {attentionReports.length} Priority Items
            </span>
          </div>

          {attentionReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No high-priority safety signals requiring immediate attention in this period.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {attentionReports.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedReport(item)}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300 transition-colors cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <RiskBadge level={item.risk_level} size="sm" />
                    <span className="font-mono text-[11px] text-slate-500 font-medium">
                      {formatDateTime(item)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                      <Building2 size={11} className="text-slate-400" />
                      <span>{item.site || item.siteName}</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-800">
                      {item.hazard} · <span className="text-slate-600 font-normal">{item.activity}</span>
                    </p>
                  </div>

                  {item.barrier_failure && item.barrier_failure !== 'None' && (
                    <p className="text-[11px] text-rose-800 font-medium truncate pt-1 border-t border-slate-200/60">
                      Barrier: {item.barrier_failure}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-blue-600 font-semibold pt-0.5">
                    <span className="font-mono text-slate-400">{formatReportCode(item.id)}</span>
                    <span className="flex items-center gap-0.5 group-hover:underline">
                      Inspect <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. RISK TREND SECTION */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                <span>Risk Trend</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Timeline distribution of safety observations by severity classification.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {scopedReports.length} Total Events
            </span>
          </div>

          <div className="h-64 w-full pt-1">
            {trendSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend observations recorded for this scope and time period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendSeries}
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Low" name="Low Risk" stackId="a" fill="#10b981" />
                  <Bar dataKey="Medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="High" name="High Risk" stackId="a" fill="#ea580c" />
                  <Bar dataKey="SIF-Precursor" name="SIF Precursor" stackId="a" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. SITE RISK OVERVIEW (When All Sites is Selected) */}
        {selectedSite === 'ALL' && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Site Risk Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative breakdown of active facilities, calculated health index, and precursor density.
                </p>
              </div>
              <Link
                to="/sites"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                <span>View all sites</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Health Status</th>
                    <th className="py-2.5 px-3">Reports</th>
                    <th className="py-2.5 px-3">High Risk</th>
                    <th className="py-2.5 px-3">SIF Precursors</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siteRiskList.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => navigate(`/sites/${st.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 size={13} className="text-slate-400 group-hover:text-blue-600" />
                        <span>{st.name}</span>
                        <span className="text-slate-400 font-normal">({st.location})</span>
                      </td>
                      <td className="py-3 px-3">
                        <SiteHealthBadge status={st.healthStatus} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {st.totalReports}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-mono font-bold ${st.highRisk > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {st.highRisk}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-mono font-bold ${st.sifPrecursors > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                          {st.sifPrecursors}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-blue-600 font-semibold text-[11px] group-hover:underline inline-flex items-center gap-0.5">
                          View <ChevronRight size={11} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SIF PRECURSOR SIGNALS SECTION */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                SIF Precursor Signals — {sifPrecursorReports.length} Detected
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-700">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sifPrecursorReports.map((sif) => (
                <div
                  key={sif.id}
                  onClick={() => setSelectedReport(sif)}
                  className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-50/80 transition-colors cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-rose-950">
                      {formatDateTime(sif)}
                    </span>
                    <RiskBadge level={sif.risk_level} size="sm" />
                  </div>

                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{sif.site || sif.siteName}</p>
                    <p className="text-slate-700 font-semibold">{sif.hazard} · {sif.activity}</p>
                    <p className="text-rose-900 font-medium text-[11px] pt-0.5">
                      Barrier: {sif.barrier_failure || 'Defect'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-rose-700 font-semibold pt-1 border-t border-rose-100">
                    <span className="font-mono text-slate-400">{formatReportCode(sif.id)}</span>
                    <span className="flex items-center gap-0.5 group-hover:underline">
                      Inspect <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7 & 8. TOP HAZARDS & RISK BY ACTIVITY (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Top Recurring Hazards */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  Top Recurring Hazards
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any hazard to investigate related safety reports.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-semibold">Ranked</span>
            </div>

            <div className="space-y-2.5">
              {scopedSummary.topHazards.slice(0, 5).map((h) => (
                <div
                  key={h.hazard}
                  onClick={() => navigate(`/reports?hazard=${encodeURIComponent(h.hazard)}`)}
                  className="space-y-1 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {h.hazard}
                    </span>
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
            </div>
          </div>

          {/* Risk by Operational Activity */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  Risk by Operational Activity
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Task categories associated with reported risk events.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-semibold">Ranked</span>
            </div>

            <div className="space-y-2.5">
              {scopedSummary.topActivities.slice(0, 5).map((act) => (
                <div
                  key={act.activity}
                  onClick={() => navigate(`/reports?activity=${encodeURIComponent(act.activity)}`)}
                  className="space-y-1 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {act.activity}
                    </span>
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
            </div>
          </div>
        </div>

        {/* 9. RECURRING BARRIER FAILURES (Differentiator) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Recurring Barrier Failures
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Identified breaches in procedural, mechanical, or physical safeguards with risk associations.
              </p>
            </div>
            <span className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
              {scopedSummary.barrierFailures.length} Failure Modes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scopedSummary.barrierFailures.map((bf) => (
              <div
                key={bf.barrier}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {bf.barrier}
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                    {bf.count}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Risk Severity:</span>
                  <strong className="text-slate-800 font-semibold font-mono">
                    {bf.riskAssociation}
                  </strong>
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

        {/* 10. RECENT SAFETY ACTIVITY FEED */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Safety Activity
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate(selectedSite === 'ALL' ? '/reports' : `/reports?site=${selectedSite}`)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all reports</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-slate-100 -mx-5 -my-2">
            {recentReports.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className="px-5 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
              >
                {/* Date / Time */}
                <div className="w-36 shrink-0 font-mono text-xs text-slate-500 font-medium">
                  {formatDateTime(r)}
                </div>

                {/* Site */}
                <div className="w-32 shrink-0 font-semibold text-xs text-slate-800 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="truncate">{r.site || r.siteName}</span>
                </div>

                {/* Risk Badge */}
                <div className="w-28 shrink-0">
                  <RiskBadge level={r.risk_level} size="sm" />
                </div>

                {/* Hazard & Activity */}
                <div className="min-w-0 flex-1 truncate text-xs text-slate-700">
                  <strong className="text-slate-900">{r.hazard}</strong>
                  <span className="text-slate-400 mx-1.5">·</span>
                  <span>{r.activity}</span>
                </div>

                {/* Chevron */}
                <div className="shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
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
