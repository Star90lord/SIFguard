import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileSearch,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  Calendar,
  Building2,
  AlertTriangle,
  ChevronRight,
  ArrowUpDown,
  Filter,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import KpiCard from '../components/ui/KpiCard';
import { RiskBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import { getReports, getSites } from '../api/sifguardApi';
import {
  filterReports,
  getReportSummary,
  formatReportCode,
  formatDateTime,
} from '../utils/filterReports';

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rawReports, setRawReports] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL');
  const [specificDate, setSpecificDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest' | 'highest_risk'

  // Selected report for slide-over drawer
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync URL query params if they change
  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam) setRiskFilter(riskParam);
    const siteParam = searchParams.get('site');
    if (siteParam) setSiteFilter(siteParam);
    const hazardParam = searchParams.get('hazard');
    if (hazardParam) setHazardFilter(hazardParam);
    const activityParam = searchParams.get('activity');
    if (activityParam) setActivityFilter(activityParam);
  }, [searchParams]);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [reportsData, sitesData] = await Promise.all([getReports(), getSites()]);
      setRawReports(reportsData || []);
      setSites(sitesData || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve report history.');
    } finally {
      setLoading(false);
    }
  }

  // Unique options for dropdowns
  const hazardOptions = useMemo(() => {
    const set = new Set(rawReports.map((r) => r.hazard).filter(Boolean));
    return Array.from(set).sort();
  }, [rawReports]);

  const activityOptions = useMemo(() => {
    const set = new Set(rawReports.map((r) => r.activity).filter(Boolean));
    return Array.from(set).sort();
  }, [rawReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return filterReports(rawReports, {
      search,
      siteId: siteFilter,
      riskLevel: riskFilter,
      hazard: hazardFilter,
      activity: activityFilter,
      datePreset,
      specificDate,
      startDate,
      endDate,
      sort: sortOption,
    });
  }, [
    rawReports,
    search,
    siteFilter,
    riskFilter,
    hazardFilter,
    activityFilter,
    datePreset,
    specificDate,
    startDate,
    endDate,
    sortOption,
  ]);

  // Metrics summary derived from active filtered set (or overall when no filters)
  const overallSummary = useMemo(() => getReportSummary(rawReports), [rawReports]);
  const activeSummary = useMemo(() => getReportSummary(filteredReports), [filteredReports]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    search.trim() ||
      siteFilter !== 'ALL' ||
      riskFilter !== 'ALL' ||
      hazardFilter !== 'ALL' ||
      activityFilter !== 'ALL' ||
      datePreset !== 'ALL' ||
      specificDate ||
      startDate ||
      endDate
  );

  function handleResetFilters() {
    setSearch('');
    setSiteFilter('ALL');
    setRiskFilter('ALL');
    setHazardFilter('ALL');
    setActivityFilter('ALL');
    setDatePreset('ALL');
    setSpecificDate('');
    setStartDate('');
    setEndDate('');
    setSortOption('newest');
    setSearchParams({});
  }

  return (
    <AppShell title="Safety Reports" subtitle="Report Intelligence Workspace">
      <PageContainer className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operational Safety Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Safety Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Review, filter and investigate reported safety events across operations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={loadInitialData}
              icon={RefreshCw}
              title="Refresh report records"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/submit')}
              icon={FileSearch}
            >
              Analyze Batch
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          /* Error State */
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unable to load reports</h3>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
            <Button variant="primary" onClick={loadInitialData} icon={RefreshCw}>
              Retry Connection
            </Button>
          </div>
        ) : rawReports.length === 0 ? (
          /* Global Empty State */
          <EmptyState
            icon={FileText}
            title="No safety reports logged"
            message="Upload reports or submit a batch to start building the safety intelligence record."
            actionLabel="Analyze Reports"
            onAction={() => navigate('/submit')}
          />
        ) : (
          /* Main Operational Interface */
          <div className="space-y-5">
            {/* 1. REPORT KPI STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <KpiCard
                label="Total Reports"
                value={overallSummary.totalReports}
                description="Verified safety records"
                accent="default"
              />
              <KpiCard
                label="High Risk"
                value={overallSummary.highCount}
                description="Escalated observations"
                accent="orange"
              />
              <KpiCard
                label="SIF Precursors"
                value={overallSummary.sifCount}
                description="Life-safety precursors"
                accent="red"
              />
              <KpiCard
                label="Sites Reporting"
                value={overallSummary.sitesReporting}
                description="Active operational facilities"
                accent="default"
              />
            </div>

            {/* 2. REPORT FILTER & SEARCH PANEL */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
              {/* Top Row: Search & Sort Controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[280px]">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reports by ID, hazard, activity, location, site or narrative..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    aria-label="Search safety reports"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <ArrowUpDown size={13} className="text-slate-400" />
                    <span>Sort:</span>
                  </div>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Sort reports"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest_risk">Highest Risk</option>
                  </select>
                </div>
              </div>

              {/* Bottom Row: Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
                {/* Site Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Site
                  </label>
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by site"
                  >
                    <option value="ALL">All Sites</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Risk Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Risk Level
                  </label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by risk level"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="SIF-Precursor">SIF Precursor</option>
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>

                {/* Hazard Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Hazard
                  </label>
                  <select
                    value={hazardFilter}
                    onChange={(e) => setHazardFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by hazard"
                  >
                    <option value="ALL">All Hazards</option>
                    {hazardOptions.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Activity
                  </label>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by activity"
                  >
                    <option value="ALL">All Activities</option>
                    {activityOptions.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Preset Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Time Range
                  </label>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by time range"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today (09 Sep 2026)</option>
                    <option value="THIS_WEEK">This Week (Last 7d)</option>
                    <option value="THIS_MONTH">This Month (Sep 2026)</option>
                    <option value="THIS_YEAR">This Year (2026)</option>
                    <option value="SPECIFIC_DATE">Specific Date...</option>
                    <option value="CUSTOM">Custom Range...</option>
                  </select>
                </div>
              </div>

              {/* Conditional Specific Date Input */}
              {datePreset === 'SPECIFIC_DATE' && (
                <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Calendar size={13} className="text-blue-600" />
                    <span>Select Specific Date:</span>
                  </div>
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 outline-none focus:border-blue-600"
                  />
                  <span className="text-[11px] text-slate-400">
                    (Default simulation day: 2026-09-09)
                  </span>
                </div>
              )}

              {/* Conditional Custom Date Range Inputs */}
              {datePreset === 'CUSTOM' && (
                <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Calendar size={13} className="text-blue-600" />
                    <span>Custom Date Span:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* 3. ACTIVE FILTERS REMOVABLE CHIPS */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Active:
                  </span>

                  {search.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                      <span>Query: "{search}"</span>
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="hover:text-blue-950 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {siteFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Site: {sites.find((s) => s.id === siteFilter)?.name || siteFilter}</span>
                      <button
                        type="button"
                        onClick={() => setSiteFilter('ALL')}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {riskFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Risk: {riskFilter}</span>
                      <button
                        type="button"
                        onClick={() => setRiskFilter('ALL')}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {hazardFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Hazard: {hazardFilter}</span>
                      <button
                        type="button"
                        onClick={() => setHazardFilter('ALL')}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {activityFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Activity: {activityFilter}</span>
                      <button
                        type="button"
                        onClick={() => setActivityFilter('ALL')}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {datePreset !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Time: {datePreset.replace('_', ' ')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDatePreset('ALL');
                          setSpecificDate('');
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors ml-auto"
                  >
                    <RotateCcw size={11} />
                    <span>Clear all</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. RESULT COUNT & STATUS BAR */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong className="text-slate-900 font-bold">{filteredReports.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{rawReports.length}</strong> reports
                {hasActiveFilters && ' (filtered)'}
              </span>

              {filteredReports.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-rose-600 font-bold">
                    SIF Precursors: {activeSummary.sifCount}
                  </span>
                  <span>·</span>
                  <span className="text-amber-600 font-bold">
                    High Risk: {activeSummary.highCount}
                  </span>
                  <span>·</span>
                  <span className="text-slate-500">
                    Sites: {activeSummary.sitesReporting}
                  </span>
                </div>
              )}
            </div>

            {/* 5. REPORTS PRESENTATION: DESKTOP TABLE vs MOBILE STACKED LIST */}
            {filteredReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports match your filters"
                message="Try clearing your search query, hazard, or date range parameters."
                actionLabel="Clear All Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <>
                {/* DESKTOP TABLE (Hidden on mobile < 768px) */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 select-none text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4 w-36">Date / Time</th>
                          <th className="py-3 px-4 w-28">Report</th>
                          <th className="py-3 px-4 w-36">Site</th>
                          <th className="py-3 px-4 w-32">Risk</th>
                          <th className="py-3 px-4 w-32">Hazard</th>
                          <th className="py-3 px-4 w-36">Activity</th>
                          <th className="py-3 px-4 min-w-[180px]">Location</th>
                          <th className="py-3 px-3 w-10 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReports.map((r) => {
                          const siteName = r.site || r.siteName || r.location || 'Industrial Site';
                          const code = r.code || formatReportCode(r.id);

                          return (
                            <tr
                              key={r.id}
                              onClick={() => setSelectedReport(r)}
                              className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                            >
                              {/* Date / Time */}
                              <td className="py-3 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                                {formatDateTime(r)}
                              </td>

                              {/* Report Code */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors">
                                  {code}
                                </span>
                              </td>

                              {/* Site */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Building2 size={12} className="text-slate-400" />
                                  <span>{siteName}</span>
                                </span>
                              </td>

                              {/* Risk */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <RiskBadge level={r.risk_level} size="sm" />
                              </td>

                              {/* Hazard */}
                              <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                                {r.hazard || '—'}
                              </td>

                              {/* Activity */}
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {r.activity || '—'}
                              </td>

                              {/* Location */}
                              <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                                {r.location || siteName}
                              </td>

                              {/* Action Chevron */}
                              <td className="py-3 px-3 text-right">
                                <ChevronRight
                                  size={15}
                                  className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MOBILE STACKED LIST (Visible on < 768px) */}
                <div className="md:hidden space-y-2.5">
                  {filteredReports.map((r) => {
                    const siteName = r.site || r.siteName || r.location || 'Industrial Site';
                    const code = r.code || formatReportCode(r.id);

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReport(r)}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {code}
                            </span>
                            <span className="font-semibold text-xs text-slate-900 flex items-center gap-1">
                              <Building2 size={11} className="text-slate-400" />
                              <span>{siteName}</span>
                            </span>
                          </div>
                          <RiskBadge level={r.risk_level} size="sm" />
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {r.text_snippet || r.full_text || r.report_text}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                          <span>{formatDateTime(r)}</span>
                          <span className="font-semibold text-slate-700 font-sans">
                            {r.hazard} · {r.activity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Slide-over Inspection Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={filteredReports}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />
      </PageContainer>
    </AppShell>
  );
}
