import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  AlertOctagon,
  ShieldAlert,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import KpiCard from '../components/ui/KpiCard';
import Button from '../components/ui/Button';
import { RiskBadge, ReportStatusBadge, PriorityBadge, OverdueBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { getReviewQueue, getSites } from '../api/sifguardApi';
import { formatReportCode, formatDateTime } from '../utils/filterReports';
import Pagination from '../components/ui/Pagination';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [kpis, setKpis] = useState({
    sifCount: 0,
    highCount: 0,
    actionRequiredCount: 0,
    pendingReviewCount: 0,
    totalCount: 0,
  });
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [hazardFilter, setHazardFilter] = useState(searchParams.get('hazard') || 'ALL');
  const [datePreset, setDatePreset] = useState(searchParams.get('period') || 'ALL');
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'default');
  const [sortDirection, setSortDirection] = useState(
    searchParams.get('order') || (['site', 'hazard', 'id'].includes(searchParams.get('sort')) ? 'asc' : 'desc')
  );

  useEffect(() => {
    loadData();
  }, [siteFilter, riskFilter, priorityFilter, statusFilter, hazardFilter, datePreset, search, sortField, sortDirection]);

  // Sync URL params when filters change
  useEffect(() => {
    const params = {};
    if (siteFilter !== 'ALL') params.site = siteFilter;
    if (riskFilter !== 'ALL') params.risk = riskFilter;
    if (priorityFilter !== 'ALL') params.priority = priorityFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (hazardFilter !== 'ALL') params.hazard = hazardFilter;
    if (datePreset !== 'ALL') params.period = datePreset;
    if (sortField !== 'default') {
      params.sort = sortField;
      params.order = sortDirection;
    }
    if (search.trim()) params.search = search.trim();
    setSearchParams(params, { replace: true });
  }, [siteFilter, riskFilter, priorityFilter, statusFilter, hazardFilter, datePreset, sortField, sortDirection, search, setSearchParams]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [queueData, sitesData] = await Promise.all([
        getReviewQueue({
          site: siteFilter,
          risk: riskFilter,
          priority: priorityFilter,
          status: statusFilter,
          hazard: hazardFilter,
          datePreset,
          search,
          sortField,
          sortDirection,
        }),
        getSites(),
      ]);

      setReports(queueData.reports || []);
      setKpis(queueData.kpis || {});
      setSites(sitesData || []);
    } catch (err) {
      setError(err.message || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  }

  // Unique hazard options
  const hazardOptions = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => {
      if (r.hazard && r.hazard !== 'None') set.add(r.hazard);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Local Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Whenever filters, search, or sorting change, reset pagination to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [siteFilter, riskFilter, priorityFilter, statusFilter, hazardFilter, datePreset, search, sortField, sortDirection]);

  // Paginated subset of prioritized reports: DATA -> FILTER -> SORT -> PAGINATE -> DISPLAY
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return reports.slice(startIndex, startIndex + PAGE_SIZE);
  }, [reports, currentPage, PAGE_SIZE]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      // Sensible defaults: date, risk, priority, status default to desc; site, hazard, id default to asc
      if (['site', 'hazard', 'id'].includes(field)) {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  }

  function handleResetSort() {
    setSortField('default');
    setSortDirection('desc');
  }

  function handleResetFilters() {
    setSearch('');
    setSiteFilter('ALL');
    setRiskFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setHazardFilter('ALL');
    setDatePreset('ALL');
    setCurrentPage(1);
  }

  const hasActiveFilters = Boolean(
    search.trim() ||
      siteFilter !== 'ALL' ||
      riskFilter !== 'ALL' ||
      priorityFilter !== 'ALL' ||
      statusFilter !== 'ALL' ||
      hazardFilter !== 'ALL' ||
      datePreset !== 'ALL'
  );

  return (
    <AppShell title="HSE Review Queue" subtitle="Operational Triage & Review">
      <PageContainer maxWidth="fluid" className="space-y-4 sm:space-y-5">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#D1D5DB]/80 dark:border-[#263244]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-blue-600 dark:text-blue-400" />
                Operational HSE Workflow
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-none">
              HSE Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
              Reports requiring attention and manager review. Prioritized by life-safety severity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={loadData}
              icon={RefreshCw}
              title="Refresh queue"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/reports')}
            >
              All Reports
            </Button>
          </div>
        </div>

        {/* 1. REVIEW QUEUE KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="SIF Precursors"
            value={kpis.sifCount || 0}
            description="Highest escalation priority"
            accent="red"
            highlight={kpis.sifCount > 0}
          />
          <KpiCard
            label="High Risk"
            value={kpis.highCount || 0}
            description="Severe hazard observations"
            accent="orange"
          />
          <KpiCard
            label="Action Required"
            value={kpis.actionRequiredCount || 0}
            description="Awaiting operational action"
            accent="orange"
          />
          <KpiCard
            label="Pending Review"
            value={kpis.pendingReviewCount || 0}
            description="Under review or newly logged"
            accent="default"
          />
        </div>

        {/* 2. FILTER STRIP */}
        <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search queue by ID, hazard, activity, location or site..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-[#111827] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                aria-label="Search review queue"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] rounded"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Reset Button if active */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-800 self-end md:self-auto font-semibold"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Dropdowns - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-3 border-t border-[#D1D5DB]/60 dark:border-[#263244] text-xs">
            {/* Site */}
            <div>
              <label htmlFor="filter-site" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Site
              </label>
              <select
                id="filter-site"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label htmlFor="filter-risk" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Risk
              </label>
              <select
                id="filter-risk"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="SIF-Precursor">SIF Precursor</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

            {/* Task Priority */}
            <div>
              <label htmlFor="filter-priority" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Priority
              </label>
              <select
                id="filter-priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="PRIORITY">Priority</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>

            {/* Workflow Status */}
            <div>
              <label htmlFor="filter-status" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTION REQUIRED">Action Required</option>
                <option value="UNDER REVIEW">Under Review</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="PENDING VERIFICATION">Pending Verification</option>
                <option value="NEW">New</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Hazard */}
            <div>
              <label htmlFor="filter-hazard" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Hazard
              </label>
              <select
                id="filter-hazard"
                value={hazardFilter}
                onChange={(e) => setHazardFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Hazards</option>
                {hazardOptions.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Window */}
            <div>
              <label htmlFor="filter-period" className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] block mb-1">
                Time Window
              </label>
              <select
                id="filter-period"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today (09 Sep 2026)</option>
                <option value="THIS_WEEK">This Week (Last 7d)</option>
                <option value="THIS_MONTH">This Month (Sep 2026)</option>
                <option value="THIS_YEAR">This Year (2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. REVIEW QUEUE TABLE */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Unable to load Review Queue</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">{error}</p>
            </div>
            <Button variant="primary" onClick={loadData} icon={RefreshCw}>
              Retry
            </Button>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={hasActiveFilters ? "No reports match the selected filters." : "No reports currently require review"}
            message={
              hasActiveFilters
                ? 'No reports in the queue match the current filters. Try resetting your filter criteria.'
                : 'All safety observations have been investigated and actioned.'
            }
            actionLabel={hasActiveFilters ? 'Reset filters' : undefined}
            onAction={hasActiveFilters ? handleResetFilters : undefined}
          />
        ) : (
          <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 sm:px-5 border-b border-[#D1D5DB]/60 dark:border-[#263244] bg-[#F8FAFC] dark:bg-[#172033] flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              <span>Showing <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{reports.length}</strong> prioritized reports</span>
              <div className="flex items-center gap-3">
                {sortField !== 'default' ? (
                  <>
                    <span className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                      Sorted by: <span className="uppercase">{sortField}</span> {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetSort}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold text-xs underline cursor-pointer"
                    >
                      Reset sorting
                    </button>
                  </>
                ) : (
                  <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">Default: SIF Precursor → High Risk → Action Required</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-[#0A0F18] border-b border-[#D1D5DB] dark:border-[#263244] text-[12px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    {/* Report ID */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('id')}
                      title="Click to sort by Report ID"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Report</span>
                        {sortField === 'id' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Site */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('site')}
                      title="Click to sort by Site"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Site</span>
                        {sortField === 'site' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Hazard */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('hazard')}
                      title="Click to sort by Hazard"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Hazard</span>
                        {sortField === 'hazard' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Risk */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('risk')}
                      title="Click to sort by Risk Level (SIF-PRECURSOR → HIGH → MEDIUM → LOW)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Risk</span>
                        {sortField === 'risk' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Priority */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('priority')}
                      title="Click to sort by Priority (IMMEDIATE → PRIORITY → STANDARD)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Priority</span>
                        {sortField === 'priority' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Status */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('status')}
                      title="Click to sort by Workflow Status"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {sortField === 'status' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    {/* Date */}
                    <th
                      className="py-2.5 px-3.5 sm:px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                      onClick={() => handleSort('date')}
                      title="Click to sort by Date (Newest first on ↓)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {sortField === 'date' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-mono text-xs">↕</span>
                        )}
                      </div>
                    </th>

                    <th className="py-2.5 px-3.5 sm:px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D5DB]/60 dark:divide-[#263244]/60">
                  {paginatedReports.map((r) => {
                    const code = formatReportCode(r.id);
                    const isSif = r.risk_level === 'SIF-Precursor' || r.sif_precursor === true;

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors group ${
                          isSif
                            ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30'
                            : 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        {/* Report ID */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 font-mono font-bold whitespace-nowrap">
                          <Link
                            to={`/reports/${r.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <span>{code}</span>
                            <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        {/* Site */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                            <span className="truncate max-w-[160px]" title={r.site || r.siteName}>
                              {r.site || r.siteName}
                            </span>
                          </div>
                        </td>

                        {/* Hazard */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 font-medium text-sm text-[#0F172A] dark:text-[#CBD5E1]">
                          <span className="truncate max-w-[170px] block" title={r.hazard}>
                            {r.hazard || 'None Specified'}
                          </span>
                        </td>

                        {/* Risk */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 whitespace-nowrap">
                          <RiskBadge level={r.risk_level} size="sm" />
                        </td>

                        {/* Priority & Overdue Indicator */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <PriorityBadge priority={r.priority} size="sm" />
                            {r.isOverdue && <OverdueBadge size="sm" />}
                          </div>
                        </td>

                        {/* Lifecycle Status */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 whitespace-nowrap">
                          <ReportStatusBadge status={r.status} size="sm" />
                        </td>

                        {/* Date */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 font-mono text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                          {formatDateTime(r)}
                        </td>

                        {/* Action: Review Button */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/reports/${r.id}`)}
                            className="font-semibold shadow-xs"
                            aria-label={`Review report ${code}`}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Local Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={reports.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="prioritized reports"
            />
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
