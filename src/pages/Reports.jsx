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
  Download,
  Bookmark,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import KpiCard from '../components/ui/KpiCard';
import { RiskBadge, ReportStatusBadge, PriorityBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import {
  getReports,
  getSites,
  exportReportsToCsv,
  getSavedViews,
  saveSavedView,
  deleteSavedView,
  renameSavedView,
} from '../api/sifguardApi';
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
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [hazardFilter, setHazardFilter] = useState(searchParams.get('hazard') || 'ALL');
  const [activityFilter, setActivityFilter] = useState(searchParams.get('activity') || 'ALL');
  const [datePreset, setDatePreset] = useState(searchParams.get('period') || 'ALL');
  const [specificDate, setSpecificDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');

  // Saved views state
  const [savedViews, setSavedViews] = useState([]);
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [renamingView, setRenamingView] = useState(null);
  const [renamingName, setRenamingName] = useState('');

  // Non-blocking export feedback
  const [exportFeedback, setExportFeedback] = useState(null);

  // Selected report for slide-over drawer
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadInitialData();
    loadSavedViewsData();
  }, []);

  function loadSavedViewsData() {
    setSavedViews(getSavedViews());
  }

  // Sync URL query params if they change externally
  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam) setRiskFilter(riskParam);
    const siteParam = searchParams.get('site');
    if (siteParam) setSiteFilter(siteParam);
    const priorityParam = searchParams.get('priority');
    if (priorityParam) setPriorityFilter(priorityParam);
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter(statusParam);
    const hazardParam = searchParams.get('hazard');
    if (hazardParam) setHazardFilter(hazardParam);
    const activityParam = searchParams.get('activity');
    if (activityParam) setActivityFilter(activityParam);
    const sortParam = searchParams.get('sort');
    if (sortParam) setSortOption(sortParam);
  }, [searchParams]);

  // Persist filters in URL query parameters
  useEffect(() => {
    const params = {};
    if (siteFilter !== 'ALL') params.site = siteFilter;
    if (riskFilter !== 'ALL') params.risk = riskFilter;
    if (priorityFilter !== 'ALL') params.priority = priorityFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (hazardFilter !== 'ALL') params.hazard = hazardFilter;
    if (activityFilter !== 'ALL') params.activity = activityFilter;
    if (datePreset !== 'ALL') params.period = datePreset;
    if (sortOption !== 'newest') params.sort = sortOption;
    if (search.trim()) params.search = search.trim();
    setSearchParams(params, { replace: true });
  }, [siteFilter, riskFilter, priorityFilter, statusFilter, hazardFilter, activityFilter, datePreset, sortOption, search, setSearchParams]);

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
      priority: priorityFilter,
      status: statusFilter,
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
    priorityFilter,
    statusFilter,
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
      priorityFilter !== 'ALL' ||
      statusFilter !== 'ALL' ||
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
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setHazardFilter('ALL');
    setActivityFilter('ALL');
    setDatePreset('ALL');
    setSpecificDate('');
    setStartDate('');
    setEndDate('');
    setSortOption('newest');
    setSearchParams({});
  }

  function handleResetSort() {
    setSortOption('newest');
  }

  function handleHeaderSort(field) {
    if (field === 'date') {
      setSortOption((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
    } else if (field === 'id') {
      setSortOption((prev) => (prev === 'id_asc' ? 'id_desc' : 'id_asc'));
    } else if (field === 'site') {
      setSortOption((prev) => (prev === 'site_asc' ? 'site_desc' : 'site_asc'));
    } else if (field === 'risk') {
      setSortOption((prev) => (prev === 'highest_risk' ? 'lowest_risk' : 'highest_risk'));
    } else if (field === 'priority') {
      setSortOption((prev) => (prev === 'priority' ? 'priority_asc' : 'priority'));
    } else if (field === 'status') {
      setSortOption((prev) => (prev === 'status' ? 'status_asc' : 'status'));
    } else if (field === 'hazard') {
      setSortOption((prev) => (prev === 'hazard_asc' ? 'hazard_desc' : 'hazard_asc'));
    } else if (field === 'activity') {
      setSortOption((prev) => (prev === 'activity_asc' ? 'activity_desc' : 'activity_asc'));
    }
  }

  function getHeaderIndicator(field) {
    if (field === 'date') {
      if (sortOption === 'newest') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
      if (sortOption === 'oldest') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
    } else if (field === 'id') {
      if (sortOption === 'id_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
      if (sortOption === 'id_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
    } else if (field === 'site') {
      if (sortOption === 'site_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
      if (sortOption === 'site_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
    } else if (field === 'risk') {
      if (sortOption === 'highest_risk') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
      if (sortOption === 'lowest_risk') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
    } else if (field === 'priority') {
      if (sortOption === 'priority' || sortOption === 'priority_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
      if (sortOption === 'priority_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
    } else if (field === 'status') {
      if (sortOption === 'status' || sortOption === 'status_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
      if (sortOption === 'status_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
    } else if (field === 'hazard') {
      if (sortOption === 'hazard_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
      if (sortOption === 'hazard_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
    } else if (field === 'activity') {
      if (sortOption === 'activity_asc') return <span className="text-blue-600 font-bold font-mono text-xs">↑</span>;
      if (sortOption === 'activity_desc') return <span className="text-blue-600 font-bold font-mono text-xs">↓</span>;
    }
    return <span className="text-slate-300 group-hover:text-slate-500 font-mono text-xs">↕</span>;
  }

  function handleExportCsv() {
    if (!filteredReports || filteredReports.length === 0) {
      setExportFeedback('Nothing to export.');
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }
    const siteObj = sites.find((s) => s.id === siteFilter);
    const siteStr = siteFilter === 'ALL' ? 'AllSites' : (siteObj?.name || siteFilter).replace(/\s+/g, '');
    const monthStr = new Date().toISOString().slice(0, 7);
    const filename = `SIFguard_Reports_${siteStr}_${monthStr}.csv`;
    const result = exportReportsToCsv(filteredReports, filename);
    if (result.success) {
      setExportFeedback(`Exported ${result.rowCount} reports to ${result.filename}`);
    } else {
      setExportFeedback(result.message || 'Export failed.');
    }
    setTimeout(() => setExportFeedback(null), 4000);
  }

  function handleApplySavedView(view) {
    if (!view || !view.filters) return;
    const f = view.filters;
    if (f.siteFilter !== undefined) setSiteFilter(f.siteFilter);
    if (f.riskFilter !== undefined) setRiskFilter(f.riskFilter);
    if (f.statusFilter !== undefined) setStatusFilter(f.statusFilter);
    if (f.hazardFilter !== undefined) setHazardFilter(f.hazardFilter);
    if (f.activityFilter !== undefined) setActivityFilter(f.activityFilter);
    if (f.datePreset !== undefined) setDatePreset(f.datePreset);
    if (f.sortOption !== undefined) setSortOption(f.sortOption);
    setExportFeedback(`Applied view: "${view.name}"`);
    setTimeout(() => setExportFeedback(null), 3000);
  }

  function handleSaveCurrentView(e) {
    if (e) e.preventDefault();
    if (!newViewName.trim()) return;

    const newView = saveSavedView({
      name: newViewName.trim(),
      filters: {
        siteFilter,
        riskFilter,
        statusFilter,
        hazardFilter,
        activityFilter,
        datePreset,
        sortOption,
      },
    });

    setSavedViews(getSavedViews());
    setIsSaveViewModalOpen(false);
    setNewViewName('');
    setExportFeedback(`View "${newView.name}" saved.`);
    setTimeout(() => setExportFeedback(null), 3500);
  }

  function handleDeleteSavedView(viewId) {
    deleteSavedView(viewId);
    setSavedViews(getSavedViews());
    setExportFeedback('Saved view removed.');
    setTimeout(() => setExportFeedback(null), 3000);
  }

  function handleRenameSavedView(e) {
    if (e) e.preventDefault();
    if (!renamingView || !renamingName.trim()) return;

    renameSavedView(renamingView.id, renamingName.trim());
    setSavedViews(getSavedViews());
    setRenamingView(null);
    setRenamingName('');
    setExportFeedback('Saved view renamed.');
    setTimeout(() => setExportFeedback(null), 3000);
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
              onClick={handleExportCsv}
              icon={Download}
              title="Export current filtered reports as CSV"
            >
              Export CSV
            </Button>
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

        {/* Non-blocking feedback notification banner */}
        {exportFeedback && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
              <span>{exportFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportFeedback(null)}
              className="text-blue-600 hover:text-blue-900 p-0.5"
            >
              <X size={13} />
            </button>
          </div>
        )}

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

            {/* QUICK PRESETS & SAVED VIEWS BAR */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
              {/* Top Row: Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                    <SlidersHorizontal size={12} className="text-slate-400" />
                    <span>Quick Presets:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRiskFilter('ALL');
                      setStatusFilter('ACTION REQUIRED');
                      setExportFeedback('Applied preset: Action Required');
                      setTimeout(() => setExportFeedback(null), 3000);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      statusFilter === 'ACTION REQUIRED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Action Required
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRiskFilter('SIF-Precursor');
                      setExportFeedback('Applied preset: SIF Precursors');
                      setTimeout(() => setExportFeedback(null), 3000);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      riskFilter === 'SIF-Precursor'
                        ? 'bg-red-100 text-red-900 border border-red-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    SIF Precursors
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRiskFilter('High');
                      setExportFeedback('Applied preset: High Risk');
                      setTimeout(() => setExportFeedback(null), 3000);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      riskFilter === 'High'
                        ? 'bg-orange-100 text-orange-900 border border-orange-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    High Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDatePreset('THIS_MONTH');
                      setExportFeedback('Applied preset: This Month');
                      setTimeout(() => setExportFeedback(null), 3000);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      datePreset === 'THIS_MONTH'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRiskFilter('SIF-Precursor');
                      setStatusFilter('ACTION REQUIRED');
                      setExportFeedback('Applied preset: My Attention');
                      setTimeout(() => setExportFeedback(null), 3000);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      riskFilter === 'SIF-Precursor' && statusFilter === 'ACTION REQUIRED'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    My Attention
                  </button>
                </div>

                {/* Save Current View Action */}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Bookmark}
                  onClick={() => {
                    setNewViewName('');
                    setIsSaveViewModalOpen(true);
                  }}
                  title="Save current filters as custom view"
                >
                  Save View
                </Button>
              </div>

              {/* Bottom Row: Saved Views List */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Bookmark size={11} className="text-slate-400" />
                  <span>Saved Views:</span>
                </span>
                {savedViews.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">No saved views yet.</span>
                ) : (
                  savedViews.map((sv) => (
                    <div
                      key={sv.id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:border-blue-300 transition-all text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleApplySavedView(sv)}
                        className="font-medium hover:text-blue-700 cursor-pointer"
                        title={`Apply "${sv.name}" filters`}
                      >
                        {sv.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingView(sv);
                          setRenamingName(sv.name);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded ml-0.5"
                        title="Rename view"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedView(sv.id)}
                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete view"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
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
                    <option value="newest">Date: Newest First</option>
                    <option value="oldest">Date: Oldest First</option>
                    <option value="highest_risk">Risk: Highest First</option>
                    <option value="lowest_risk">Risk: Lowest First</option>
                    <option value="priority">Priority: Immediate First</option>
                    <option value="priority_asc">Priority: Standard First</option>
                    <option value="status">Status: Action Required First</option>
                    <option value="status_asc">Status: Closed First</option>
                    <option value="site_asc">Site: A → Z</option>
                    <option value="site_desc">Site: Z → A</option>
                    <option value="hazard_asc">Hazard: A → Z</option>
                    <option value="hazard_desc">Hazard: Z → A</option>
                    <option value="activity_asc">Activity: A → Z</option>
                    <option value="activity_desc">Activity: Z → A</option>
                    <option value="id_asc">Report ID: Low to High</option>
                    <option value="id_desc">Report ID: High to Low</option>
                  </select>
                  {sortOption !== 'newest' && (
                    <button
                      type="button"
                      onClick={handleResetSort}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      title="Reset sorting to Newest First"
                    >
                      Reset sort
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Row: Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100">
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

                {/* Priority Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by task priority"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="PRIORITY">Priority</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
                    aria-label="Filter by workflow status"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">New</option>
                    <option value="UNDER REVIEW">Under Review</option>
                    <option value="ACTION REQUIRED">Action Required</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="PENDING VERIFICATION">Pending Verification</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
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

                  {priorityFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Priority: {priorityFilter}</span>
                      <button
                        type="button"
                        onClick={() => setPriorityFilter('ALL')}
                        className="hover:text-slate-900 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {statusFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <span>Status: {statusFilter.replace(/_/g, ' ')}</span>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
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
                title="No reports match the selected filters."
                message="Try clearing your search query, site, risk, priority, hazard, or date range parameters."
                actionLabel="Reset filters"
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
                          {/* Date / Time */}
                          <th
                            className="py-3 px-4 w-36 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('date')}
                            title="Click to sort by Date"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Date / Time</span>
                              {getHeaderIndicator('date')}
                            </div>
                          </th>

                          {/* Report */}
                          <th
                            className="py-3 px-4 w-28 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('id')}
                            title="Click to sort by Report ID"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Report</span>
                              {getHeaderIndicator('id')}
                            </div>
                          </th>

                          {/* Site */}
                          <th
                            className="py-3 px-4 w-36 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('site')}
                            title="Click to sort by Site"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Site</span>
                              {getHeaderIndicator('site')}
                            </div>
                          </th>

                          {/* Risk */}
                          <th
                            className="py-3 px-4 w-32 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('risk')}
                            title="Click to sort by Risk Level"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Risk</span>
                              {getHeaderIndicator('risk')}
                            </div>
                          </th>

                          {/* Priority */}
                          <th
                            className="py-3 px-4 w-28 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('priority')}
                            title="Click to sort by Priority"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Priority</span>
                              {getHeaderIndicator('priority')}
                            </div>
                          </th>

                          {/* Status */}
                          <th
                            className="py-3 px-4 w-32 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('status')}
                            title="Click to sort by Workflow Status"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Status</span>
                              {getHeaderIndicator('status')}
                            </div>
                          </th>

                          {/* Hazard */}
                          <th
                            className="py-3 px-4 w-32 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('hazard')}
                            title="Click to sort by Hazard"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Hazard</span>
                              {getHeaderIndicator('hazard')}
                            </div>
                          </th>

                          {/* Activity */}
                          <th
                            className="py-3 px-4 w-36 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleHeaderSort('activity')}
                            title="Click to sort by Activity"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Activity</span>
                              {getHeaderIndicator('activity')}
                            </div>
                          </th>

                          <th className="py-3 px-4 min-w-[160px]">Location</th>
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

                              {/* Priority */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <PriorityBadge priority={r.priority || 'STANDARD'} size="sm" />
                              </td>

                              {/* Operational Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <ReportStatusBadge status={r.status} size="sm" />
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
                          <div className="flex items-center gap-1.5">
                            <RiskBadge level={r.risk_level} size="sm" />
                            <PriorityBadge priority={r.priority || 'STANDARD'} size="xs" />
                            <ReportStatusBadge status={r.status} size="xs" />
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {r.text_snippet || r.full_text || r.report_text}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="font-mono text-slate-400">{formatDateTime(r)}</span>
                          <span className="font-semibold text-slate-700 font-sans break-words">
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

        {/* Save View Modal */}
        {isSaveViewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bookmark size={16} className="text-blue-600" />
                  <span>Save Current View</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSaveViewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCurrentView} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    View Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. Critical Fall Risks"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                    autoFocus
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-600">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Filters to be saved:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>Site: <span className="font-semibold text-slate-900">{siteFilter}</span></div>
                    <div>Risk: <span className="font-semibold text-slate-900">{riskFilter}</span></div>
                    <div>Status: <span className="font-semibold text-slate-900">{statusFilter}</span></div>
                    <div>Hazard: <span className="font-semibold text-slate-900">{hazardFilter}</span></div>
                    <div>Time: <span className="font-semibold text-slate-900">{datePreset}</span></div>
                    <div>Sort: <span className="font-semibold text-slate-900">{sortOption}</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setIsSaveViewModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={!newViewName.trim()}
                  >
                    Save View
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rename View Modal */}
        {renamingView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600" />
                  <span>Rename Saved View</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRenamingView(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRenameSavedView} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    New View Name
                  </label>
                  <input
                    type="text"
                    required
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    placeholder="Enter new name"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setRenamingView(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={!renamingName.trim()}
                  >
                    Rename
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
