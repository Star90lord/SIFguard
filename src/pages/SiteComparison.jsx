import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Filter,
  Layers,
  Repeat,
  X,
  Plus,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Clock,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Activity,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { SiteHealthBadge, RiskBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Select from '../components/ui/Select';
import Pagination from '../components/ui/Pagination';
import { getSiteComparison, getHazardComparison, getSites, getReports } from '../api/sifguardApi';

export default function SiteComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const sitesParam = searchParams.get('sites') || '';
  const tabParam = searchParams.get('tab') || 'overview';
  const hazardParam = searchParams.get('hazard') || 'Dropped Object';
  const rangeParam = searchParams.get('range') || 'ALL';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [selectedHazard, setSelectedHazard] = useState(hazardParam);
  const [timeRange, setTimeRange] = useState(rangeParam);

  const [allAvailableSites, setAllAvailableSites] = useState([]);
  const [allAvailableHazards, setAllAvailableHazards] = useState([]);

  // Data states for site comparison
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states for integrated hazard comparison
  const [hazardData, setHazardData] = useState(null);
  const [hazardLoading, setHazardLoading] = useState(false);
  const [hazardError, setHazardError] = useState(null);

  // Initial load of all available facilities and hazards list (ONCE on mount)
  useEffect(() => {
    let isMounted = true;
    Promise.all([getSites(), getReports()])
      .then(([sitesRes, reportsRes]) => {
        if (!isMounted) return;
        const sites = sitesRes || [];
        setAllAvailableSites(sites);

        const reports = reportsRes || [];
        const uniqueHazards = Array.from(
          new Set(reports.map((r) => r.hazard).filter((h) => h && h !== 'None'))
        ).sort();
        setAllAvailableHazards(
          uniqueHazards.length > 0
            ? uniqueHazards
            : ['Dropped Object', 'Fall', 'Confined Space', 'Electrical', 'Containment Loss', 'Chemical Exposure', 'Vehicle Interaction']
        );
      })
      .catch((err) => {
        console.error('Failed to load initial facility directory or hazards:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute current selected site IDs
  const currentSiteIds = useMemo(() => {
    if (!sitesParam) return [];
    if (sitesParam.toLowerCase() === 'all') {
      return allAvailableSites.map((s) => s.id);
    }
    return sitesParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [sitesParam, allAvailableSites]);

  // Synchronize state changes into URL search parameters
  const updateUrlParams = useCallback(
    (newSites, newTab, newHazard, newRange) => {
      const params = new URLSearchParams();
      if (newSites && newSites.length > 0) {
        params.set('sites', Array.isArray(newSites) ? newSites.join(',') : newSites);
      }
      if (newTab && newTab !== 'overview') {
        params.set('tab', newTab);
      }
      if (newHazard && newHazard !== 'Dropped Object') {
        params.set('hazard', newHazard);
      }
      if (newRange && newRange !== 'ALL') {
        params.set('range', newRange);
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Sync state if URL search parameters change externally
  useEffect(() => {
    if (tabParam !== activeTab) setActiveTab(tabParam);
    if (hazardParam !== selectedHazard) setSelectedHazard(hazardParam);
    if (rangeParam !== timeRange) setTimeRange(rangeParam);
  }, [tabParam, hazardParam, rangeParam]);

  // Main Site Comparison Data Loading
  const loadComparison = useCallback(async () => {
    if (currentSiteIds.length < 2) {
      setLoading(false);
      setComparisonData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSiteComparison(currentSiteIds, { datePreset: timeRange });
      setComparisonData(data);
    } catch (err) {
      console.error('Error building cross-site safety comparison:', err);
      setError(err.message || 'Unable to build comparison for the selected facilities.');
    } finally {
      setLoading(false);
    }
  }, [currentSiteIds.join(','), timeRange]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // Integrated Hazard Comparison Data Loading (strictly scoped to currentSiteIds)
  const loadHazardAnalysis = useCallback(async () => {
    if (currentSiteIds.length < 2 || !selectedHazard) {
      setHazardData(null);
      return;
    }

    setHazardLoading(true);
    setHazardError(null);
    try {
      const data = await getHazardComparison(selectedHazard, {
        datePreset: timeRange,
        sites: currentSiteIds,
      });
      setHazardData(data);
    } catch (err) {
      console.error(`Error loading hazard comparison for "${selectedHazard}":`, err);
      setHazardError(err.message || `Unable to retrieve cross-site analysis for ${selectedHazard}.`);
    } finally {
      setHazardLoading(false);
    }
  }, [currentSiteIds.join(','), selectedHazard, timeRange]);

  useEffect(() => {
    loadHazardAnalysis();
  }, [loadHazardAnalysis]);

  // Handlers for facility selection
  function handleRemoveSite(siteId) {
    const updated = currentSiteIds.filter((id) => id !== siteId);
    updateUrlParams(updated, activeTab, selectedHazard, timeRange);
  }

  function handleAddSite(newSiteId) {
    if (!newSiteId || currentSiteIds.includes(newSiteId)) return;
    const updated = [...currentSiteIds, newSiteId];
    updateUrlParams(updated, activeTab, selectedHazard, timeRange);
  }

  function handleSelectAllSites() {
    if (allAvailableSites.length === 0) return;
    const allIds = allAvailableSites.map((s) => s.id);
    updateUrlParams(allIds, activeTab, selectedHazard, timeRange);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    updateUrlParams(currentSiteIds, tab, selectedHazard, timeRange);
  }

  function handleHazardSelect(hazard) {
    setSelectedHazard(hazard);
    updateUrlParams(currentSiteIds, activeTab, hazard, timeRange);
  }

  function handleTimeRangeChange(val) {
    const range = typeof val === 'object' && val?.target ? val.target.value : val;
    setTimeRange(range);
    updateUrlParams(currentSiteIds, activeTab, selectedHazard, range);
  }

  // Sites available to be added
  const availableToAdd = useMemo(() => {
    return allAvailableSites.filter((s) => !currentSiteIds.includes(s.id));
  }, [allAvailableSites, currentSiteIds]);

  // Derived data
  const comparedSites = comparisonData?.sites || [];
  const summary = comparisonData?.summary || null;
  const keyDifferences = comparisonData?.keyDifferences || [];
  const commonPatterns = comparisonData?.commonPatterns || [];
  const keyFindings = comparisonData?.keyFindings || [];
  const recommendations = comparisonData?.recommendations || [];

  // Local pagination for comparison matrix
  const [matrixPage, setMatrixPage] = useState(1);
  const MATRIX_PAGE_SIZE = 8;

  // Local pagination for cross-site hazard breakdown
  const [hazardSitePage, setHazardSitePage] = useState(1);
  const HAZARD_SITE_PAGE_SIZE = 6;

  useEffect(() => {
    setMatrixPage(1);
  }, [currentSiteIds, timeRange]);

  useEffect(() => {
    setHazardSitePage(1);
  }, [selectedHazard, currentSiteIds, timeRange]);

  const paginatedComparedSites = useMemo(() => {
    const start = (matrixPage - 1) * MATRIX_PAGE_SIZE;
    return comparedSites.slice(start, start + MATRIX_PAGE_SIZE);
  }, [comparedSites, matrixPage, MATRIX_PAGE_SIZE]);

  const paginatedHazardSites = useMemo(() => {
    const breakdown = hazardData?.siteBreakdown || [];
    const start = (hazardSitePage - 1) * HAZARD_SITE_PAGE_SIZE;
    return breakdown.slice(start, start + HAZARD_SITE_PAGE_SIZE);
  }, [hazardData?.siteBreakdown, hazardSitePage, HAZARD_SITE_PAGE_SIZE]);

  // =========================================================================
  // CASE 7: NO SELECTED SITES OR LESS THAN 2 SITES
  // =========================================================================
  if (currentSiteIds.length < 2) {
    return (
      <AppShell title="Site Comparison" subtitle="Cross-Facility Safety Intelligence">
        <PageContainer>
          <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-5 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <Repeat size={24} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Operational Safety Telemetry
              </span>
              <h2 className="text-lg font-bold text-slate-900">Select Facilities to Compare</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Side-by-side benchmarking requires at least two operational facilities. Select facilities below to evaluate cross-site risk distributions, recurring barrier failures, and safety patterns.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button
                variant="primary"
                size="md"
                icon={Repeat}
                onClick={() => {
                  const targetIds = (allAvailableSites.length > 0
                    ? allAvailableSites
                    : [{ id: 'rig-site-b' }, { id: 'rig-site-a' }, { id: 'processing-unit' }]
                  )
                    .slice(0, 3)
                    .map((s) => s.id);
                  updateUrlParams(targetIds, activeTab, selectedHazard, timeRange);
                }}
              >
                Compare Top 3 Sites
              </Button>

              {allAvailableSites.length > 3 && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSelectAllSites}
                >
                  Compare All ({allAvailableSites.length}) Sites
                </Button>
              )}

              <Button
                variant="ghost"
                size="md"
                icon={ArrowLeft}
                onClick={() => navigate('/sites')}
              >
                Sites Directory
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Site Comparison" subtitle="Operational Safety Matrix">
      <PageContainer maxWidth="fluid" className="space-y-6">
        {/* Navigation & Controls Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D1D5DB]/80 dark:border-[#263244]">
          <Link
            to="/sites"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Sites Directory</span>
          </Link>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Evaluation Period:</span>
            <Select
              size="sm"
              value={timeRange}
              onChange={handleTimeRangeChange}
              options={[
                { value: 'ALL', label: 'All Time Records' },
                { value: 'THIS_MONTH', label: 'This Month' },
                { value: 'THIS_WEEK', label: 'Past 7 Days' },
                { value: 'TODAY', label: 'Today Only' },
              ]}
            />
          </div>
        </div>

        {/* Page Header with Scope Selector */}
        <div className="p-5 sm:p-6 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  Oil India Limited · HSE Facilities Benchmark
                </span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                SITE COMPARISON
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] mt-1">
                Multi-facility safety intelligence, cross-site pattern recognition, and safeguard analysis.
              </p>
            </div>

            {/* Selected Facilities Chips & Add Facility Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mr-1 hidden sm:inline">
                Scope:
              </span>
              {currentSiteIds.map((sId) => {
                const siteObj = allAvailableSites.find((s) => s.id === sId) || comparedSites.find((s) => s.id === sId);
                const sName = siteObj?.name || sId;
                return (
                  <span
                    key={sId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    <Building2 size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>{sName}</span>
                    {currentSiteIds.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(sId)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 transition-colors"
                        aria-label={`Remove ${sName} from comparison`}
                        title={`Remove ${sName}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                );
              })}

              {/* Add Site Dropdown */}
              {availableToAdd.length > 0 && (
                <div className="w-38">
                  <Select
                    size="sm"
                    value=""
                    onChange={(val) => {
                      const id = typeof val === 'object' && val?.target ? val.target.value : val;
                      if (id) handleAddSite(id);
                    }}
                    options={[
                      { value: '', label: '+ Add Site' },
                      ...availableToAdd.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                  />
                </div>
              )}

              {/* Compare All Button */}
              {availableToAdd.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAllSites}
                  className="text-xs font-semibold"
                >
                  All ({allAvailableSites.length})
                </Button>
              )}
            </div>
          </div>

          {/* Sub-header Navigation Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#070B12] rounded-xl border border-[#D1D5DB] dark:border-[#263244] text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Repeat size={14} />
                <span>Overview & Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('hazards')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'hazards'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Cross-Site Hazard Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('patterns')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Layers size={14} />
                <span>Patterns & Prevention</span>
              </button>
            </div>

            <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] font-mono flex items-center gap-2">
              <span>Evaluating <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{comparedSites.length}</strong> facilities</span>
              <span>·</span>
              <span><strong className="text-[#0F172A] dark:text-[#F8FAFC]">{summary ? summary.totalReports : 0}</strong> total observations</span>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Building cross-site safety comparison...</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">
                Correlating observation telemetry and barrier failures across selected facilities
              </p>
            </div>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-8 text-center bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/60 rounded-xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Unable to build comparison</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRetry} icon={RefreshCw}>
              Retry Comparison
            </Button>
          </div>
        ) : comparedSites.length === 0 ? (
          /* NO SITES SELECTED */
          <EmptyState
            icon={Building2}
            title="No facilities selected for comparison"
            message="Select at least one operational site to benchmark risk trends, hazard distributions, and safeguard breaches."
            actionLabel="Compare All Facilities"
            onAction={handleSelectAllSites}
          />
        ) : summary && summary.totalReports === 0 ? (
          /* NO REPORTS FOR ACTIVE FILTERS */
          <div className="p-12 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">No observations recorded</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                No safety observations were logged for the selected facilities under the active time filter (
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{timeRange}</span>).
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTimeRangeChange('ALL')}
              >
                Switch to All Time Records
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/sites')}
              >
                Back to Directory
              </Button>
            </div>
          </div>
        ) : (
          /* MAIN COMPARISON CONTENT */
          <>
            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW & COMPARISON MATRIX */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 1. COMPARISON SUMMARY (6 Metrics) */}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {/* Monitored Facilities */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        Facilities
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono leading-none">
                          {summary.facilityCount}
                        </span>
                        <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8] font-medium">operational</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate font-mono">
                        {summary.facilityNames?.slice(0, 2).join(', ')}
                        {summary.facilityNames?.length > 2 ? ` +${summary.facilityNames.length - 2}` : ''}
                      </p>
                    </div>

                    {/* Total Reports */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        Total Reports
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono leading-none">
                          {summary.totalReports}
                        </span>
                        <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">logged</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Across selected scope</p>
                    </div>

                    {/* High-Risk Reports */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        High-Risk
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl sm:text-3xl font-bold font-mono leading-none ${summary.highRiskReports > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                          {summary.highRiskReports}
                        </span>
                        <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">observations</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Elevated severity</p>
                    </div>

                    {/* SIF Precursor Signals */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        SIF Precursors
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl sm:text-3xl font-bold font-mono leading-none ${summary.sifPrecursors > 0 ? 'text-red-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {summary.sifPrecursors}
                        </span>
                        <span className="text-[12px] text-red-600 dark:text-rose-400 font-medium">signals</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Life-safety risk</p>
                    </div>

                    {/* Most Common Hazard */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        Top Hazard
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                        {summary.mostCommonHazard?.hazard || 'N/A'}
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {summary.mostCommonHazard?.count || 0} observations
                      </p>
                    </div>

                    {/* Most Common Activity */}
                    <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        Top Activity
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                        {summary.mostCommonActivity?.activity || 'N/A'}
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {summary.mostCommonActivity?.count || 0} observations
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. SITE COMPARISON MATRIX TABLE (Section 3.B - Site by site rows) */}
                <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-[#D1D5DB]/80 dark:border-[#263244] bg-slate-50 dark:bg-[#070B12] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC] block">
                        Facility Comparison Matrix
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal">
                        Individual site risk breakdown, predominant hazards, and barrier degradation
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-semibold">
                      MATRIX TABLE
                    </span>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12] text-[11px] font-bold text-[#334155] dark:text-[#CBD5E1] uppercase tracking-wider">
                          <th className="py-3 px-4 min-w-[200px] sticky left-0 z-20 bg-slate-50 dark:bg-[#070B12] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Facility
                          </th>
                          <th className="py-3 px-3 text-right font-semibold">Total Reports</th>
                          <th className="py-3 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">LOW</th>
                          <th className="py-3 px-3 text-right font-semibold text-amber-700 dark:text-amber-400">MEDIUM</th>
                          <th className="py-3 px-3 text-right font-semibold text-orange-700 dark:text-orange-400">HIGH</th>
                          <th className="py-3 px-3 text-right font-semibold text-rose-700 dark:text-rose-400">SIF-PRECURSOR</th>
                          <th className="py-3 px-4 font-semibold min-w-[150px]">Top Hazard</th>
                          <th className="py-3 px-4 font-semibold min-w-[150px]">Top Activity</th>
                          <th className="py-3 px-4 font-semibold min-w-[170px]">Primary Barrier Failure</th>
                          <th className="py-3 px-3 text-right font-semibold w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D5DB]/50 dark:divide-[#263244]">
                        {paginatedComparedSites.map((site) => (
                          <tr key={site.id} className="hover:bg-slate-50/70 dark:hover:bg-[#172033]/50 transition-colors">
                            {/* Site (Sticky) */}
                            <td className="py-3.5 px-4 sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                              <div className="flex items-center gap-2">
                                <Building2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <div>
                                  <Link
                                    to={`/sites/${site.id}`}
                                    className="font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-blue-600 dark:hover:text-blue-400 hover:underline block truncate"
                                  >
                                    {site.name}
                                  </Link>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-normal">
                                      {site.code || 'SITE'} · {site.type}
                                    </span>
                                    <SiteHealthBadge status={site.healthStatus} size="sm" />
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Total Reports */}
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] text-sm">
                              {site.totalReports}
                            </td>

                            {/* Low Risk */}
                            <td className="py-3.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                              {site.riskCounts?.Low ?? 0}
                            </td>

                            {/* Medium Risk */}
                            <td className="py-3.5 px-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                              {site.riskCounts?.Medium ?? 0}
                            </td>

                            {/* High Risk */}
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-orange-700 dark:text-orange-400">
                              {site.highRiskCount}
                            </td>

                            {/* SIF-Precursor */}
                            <td className="py-3.5 px-3 text-right">
                              {site.sifCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-rose-950/50 text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-800 font-mono font-bold text-xs">
                                  <ShieldAlert size={12} />
                                  {site.sifCount}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 dark:text-slate-500 font-medium">0</span>
                              )}
                            </td>

                            {/* Top Hazard */}
                            <td className="py-3.5 px-4 text-[#0F172A] dark:text-[#F8FAFC]">
                              {site.topHazard && site.topHazard.count > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172033] border border-[#D1D5DB]/60 dark:border-[#263244] text-[#0F172A] dark:text-[#F8FAFC] text-[11px] font-medium">
                                  {site.topHazard.hazard}
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">({site.topHazard.count})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">None logged</span>
                              )}
                            </td>

                            {/* Top Activity */}
                            <td className="py-3.5 px-4 text-[#334155] dark:text-[#CBD5E1]">
                              {site.topActivity && site.topActivity.count > 0 ? (
                                <span className="text-[11px]">
                                  {site.topActivity.activity}
                                  <span className="text-slate-400 font-mono ml-1">({site.topActivity.count})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>

                            {/* Barrier Failure */}
                            <td className="py-3.5 px-4 text-[#0F172A] dark:text-[#F8FAFC]">
                              {site.primaryBarrier && site.primaryBarrier.count > 0 && site.primaryBarrier.barrier !== 'None Recorded' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60 text-[11px] font-medium">
                                  {site.primaryBarrier.barrier}
                                  <span className="font-mono font-bold text-rose-900 dark:text-rose-200">({site.primaryBarrier.count})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Zero breaches</span>
                              )}
                            </td>

                            {/* Action Link */}
                            <td className="py-3.5 px-3 text-right">
                              <Link
                                to={`/sites/${site.id}`}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                              >
                                <span>Profile</span>
                                <ChevronRight size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={matrixPage}
                    totalItems={comparedSites.length}
                    pageSize={MATRIX_PAGE_SIZE}
                    onPageChange={setMatrixPage}
                    itemLabel="facilities"
                    className="m-3"
                  />
                </div>

                {/* 3. SIDE-BY-SIDE METRIC BENCHMARK TABLE (STICKY METRIC COLUMN) */}
                <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-[#D1D5DB]/80 dark:border-[#263244] bg-slate-50 dark:bg-[#070B12] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC] block">
                        Side-by-Side Facility Benchmark
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Horizontal comparative alignment across all {comparedSites.length} facilities
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold uppercase">
                      BENCHMARK
                    </span>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12] text-[11px] font-bold text-[#334155] dark:text-[#CBD5E1] uppercase tracking-wider">
                          <th className="py-3 px-4 w-48 min-w-[190px] sticky left-0 z-20 bg-slate-50 dark:bg-[#070B12] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Metric
                          </th>
                          {comparedSites.map((site) => (
                            <th
                              key={site.id}
                              className="py-3 px-4 min-w-[175px] font-bold text-[#0F172A] dark:text-[#F8FAFC] border-l border-[#D1D5DB]/60 dark:border-[#263244]"
                            >
                              <Link
                                to={`/sites/${site.id}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1.5"
                              >
                                <span>{site.name}</span>
                                <ChevronRight size={12} className="opacity-50" />
                              </Link>
                              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] block font-normal">
                                {site.code || 'SITE'} · {site.type}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D5DB]/50 dark:divide-[#263244]">
                        {/* Health Status */}
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Health Status
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              <SiteHealthBadge status={s.healthStatus} size="sm" />
                            </td>
                          ))}
                        </tr>

                        {/* Total Reports */}
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Total Reports
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] text-sm border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.totalReports}
                            </td>
                          ))}
                        </tr>

                        {/* High Risk Observations */}
                        <tr className="border-b border-[#D1D5DB]/60 dark:border-[#263244]">
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            High Risk Observations
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              <span
                                className={`font-mono font-bold text-sm ${
                                  s.highRiskCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-[#64748B] dark:text-[#94A3B8]'
                                }`}
                              >
                                {s.highRiskCount}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* SIF Precursors */}
                        <tr className="border-b border-[#D1D5DB]/60 dark:border-[#263244]">
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            SIF Precursors
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.sifCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-mono font-bold text-xs">
                                  <ShieldAlert size={12} />
                                  {s.sifCount}
                                </span>
                              ) : (
                                <span className="font-mono text-[#64748B] dark:text-[#94A3B8] font-medium">0</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Top Hazard */}
                        <tr className="border-b border-[#D1D5DB]/60 dark:border-[#263244]">
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Top Hazard
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] text-xs border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.topHazard?.hazard ? (
                                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                  {s.topHazard.hazard}{' '}
                                  <span className="font-mono text-[#64748B] dark:text-[#94A3B8] font-normal">({s.topHazard.count})</span>
                                </span>
                              ) : (
                                <span className="text-[#64748B] dark:text-[#94A3B8] italic">None</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Top Activity */}
                        <tr className="border-b border-[#D1D5DB]/60 dark:border-[#263244]">
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Top Activity
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] text-xs border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.topActivity?.activity ? (
                                <span className="text-[#334155] dark:text-[#CBD5E1]">
                                  {s.topActivity.activity}{' '}
                                  <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">({s.topActivity.count})</span>
                                </span>
                              ) : (
                                <span className="text-[#64748B] dark:text-[#94A3B8] italic">—</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Primary Barrier Breach */}
                        <tr className="border-b border-[#D1D5DB]/60 dark:border-[#263244]">
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Primary Barrier Failure
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] text-xs border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.primaryBarrier?.barrier && s.primaryBarrier.barrier !== 'None Recorded' ? (
                                <span className="text-rose-700 dark:text-rose-400 font-medium">
                                  {s.primaryBarrier.barrier}{' '}
                                  <span className="font-mono font-bold text-rose-900 dark:text-rose-300">({s.primaryBarrier.count})</span>
                                </span>
                              ) : (
                                <span className="text-[#64748B] dark:text-[#94A3B8] italic">Zero</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Last Observation */}
                        <tr>
                          <td className="py-3 px-4 font-semibold text-[#334155] dark:text-[#CBD5E1] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-[#D1D5DB]/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            Last Observation
                          </td>
                          {comparedSites.map((s) => (
                            <td key={s.id} className="py-3 px-4 min-w-[175px] font-mono text-xs text-[#64748B] dark:text-[#94A3B8] border-l border-[#D1D5DB]/60 dark:border-[#263244]">
                              {s.lastActivity}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. SAFETY INTERPRETATION: CONCISE KEY FINDINGS */}
                <div className="p-6 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-4">
                  <div className="border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                        Key Findings by Facility
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-semibold">
                      DATA INTERPRETATION
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {keyFindings.map((kf) => (
                      <div
                        key={kf.siteId}
                        className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#172033] border border-[#D1D5DB]/80 dark:border-[#263244] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/sites/${kf.siteId}`}
                            className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          >
                            {kf.siteName}
                          </Link>
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">{kf.siteCode}</span>
                        </div>

                        <ul className="space-y-1.5 text-xs text-[#334155] dark:text-[#CBD5E1]">
                          {kf.findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">→</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. RISK LEVEL DISTRIBUTION */}
                <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs p-5 space-y-4">
                  <div className="border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]">
                      Risk Level Distribution
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">PROPORTIONAL BREAKDOWN</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {comparedSites.map((site) => (
                      <div key={site.id} className="p-4 bg-[#F8FAFC] dark:bg-[#172033] rounded-lg border border-[#D1D5DB]/80 dark:border-[#263244] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs truncate">{site.name}</span>
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">{site.totalReports} total</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] dark:text-[#94A3B8]">Low</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{site.riskCounts?.Low ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] dark:text-[#94A3B8]">Medium</span>
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{site.riskCounts?.Medium ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] dark:text-[#94A3B8]">High</span>
                            <span className="font-mono font-bold text-orange-700 dark:text-orange-400">{site.highRiskCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] dark:text-[#94A3B8]">SIF-Precursor</span>
                            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{site.sifCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Link to Focused Hazard Comparison */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        Evaluate a Specific Hazard Across These Facilities
                      </h3>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Drill down into safe isolation, dropped objects, or falls strictly for {currentSiteIds.length} selected sites.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={SlidersHorizontal}
                    onClick={() => handleTabChange('hazards')}
                  >
                    Launch Hazard Analysis
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: INTEGRATED CROSS-SITE HAZARD ANALYSIS (Section 5)  */}
            {/* ========================================================= */}
            {activeTab === 'hazards' && (
              <div className="space-y-6">
                {/* Hazard Selection Header Card */}
                <div className="p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">
                        Cross-Site Hazard Analysis
                      </span>
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {selectedHazard.toUpperCase()} — CROSS-SITE ANALYSIS
                      </h2>
                    </div>

                    {/* Hazard Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1]">Selected Hazard:</span>
                      <div className="w-56">
                        <Select
                          size="sm"
                          value={selectedHazard}
                          onChange={(val) => {
                            const h = typeof val === 'object' && val?.target ? val.target.value : val;
                            if (h) handleHazardSelect(h);
                          }}
                          options={allAvailableHazards.map((h) => ({ value: h, label: h }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scoped Scope Notice */}
                  <div className="flex items-center justify-between text-xs text-[#334155] dark:text-[#CBD5E1]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Evaluated Scope:</span>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">
                        Analysis is strictly constrained to the {currentSiteIds.length} currently selected facilities:
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {currentSiteIds.map((id) => allAvailableSites.find((s) => s.id === id)?.name || id).join(', ')}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                      Time: {timeRange}
                    </span>
                  </div>
                </div>

                {/* Hazard Data Loading / Results */}
                {hazardLoading ? (
                  <div className="p-12 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                      Querying {selectedHazard} observations across {currentSiteIds.length} facilities...
                    </p>
                  </div>
                ) : hazardError ? (
                  <div className="p-6 text-center bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-xs text-xs text-rose-600 dark:text-rose-400">
                    {hazardError}
                  </div>
                ) : !hazardData || hazardData.siteBreakdown?.length === 0 ? (
                  <div className="p-10 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs text-xs text-[#64748B] dark:text-[#94A3B8]">
                    No data recorded for {selectedHazard} across the selected facilities.
                  </div>
                ) : (
                  <>
                    {/* Site Breakdown for this Hazard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedHazardSites.map((s) => (
                        <div
                          key={s.siteId}
                          className="p-5 bg-white dark:bg-[#111827] rounded-xl border border-[#D1D5DB] dark:border-[#263244] shadow-xs space-y-3.5"
                        >
                          <div className="flex items-center justify-between border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
                            <div>
                              <Link
                                to={`/sites/${s.siteId}`}
                                className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-sm hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                              >
                                {s.siteName}
                              </Link>
                              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] block">{s.siteCode}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-mono font-bold text-xs border border-blue-200 dark:border-blue-900/40">
                              {s.reportsCount} {s.reportsCount === 1 ? 'Report' : 'Reports'}
                            </span>
                          </div>

                          {/* Risk breakdown for this hazard */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] dark:text-[#94A3B8]">SIF Precursors:</span>
                              <span className={`font-mono font-bold ${s.sifCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                                {s.sifCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] dark:text-[#94A3B8]">High Risk:</span>
                              <span className={`font-mono font-bold ${s.highRiskCount > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                                {s.highRiskCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] dark:text-[#94A3B8]">Medium / Low:</span>
                              <span className="font-mono text-[#334155] dark:text-[#CBD5E1] font-medium">
                                {(s.riskDistribution?.Medium || 0) + (s.riskDistribution?.Low || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Recurring Barrier for this site */}
                          <div className="pt-2 border-t border-[#D1D5DB]/60 dark:border-[#263244] text-xs">
                            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                              Recurring Safeguard Breakdown:
                            </span>
                            {s.barrierFailures && s.barrierFailures.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {s.barrierFailures.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50 text-[11px]"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#64748B] dark:text-[#94A3B8] italic text-[11px]">No barrier breach logged</span>
                            )}
                          </div>

                          {/* Top activities */}
                          <div className="pt-1 text-xs">
                            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                              Associated Activities:
                            </span>
                            {s.activities && s.activities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {s.activities.map((act, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] border border-[#D1D5DB]/60 dark:border-[#263244] text-[11px]"
                                  >
                                    {act}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#64748B] dark:text-[#94A3B8] italic text-[11px]">None recorded</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={hazardSitePage}
                      totalItems={hazardData.siteBreakdown.length}
                      pageSize={HAZARD_SITE_PAGE_SIZE}
                      onPageChange={setHazardSitePage}
                      itemLabel="facilities"
                      className="mt-4"
                    />

                    {/* What Differs & Recurring Barrier for this Hazard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What Differs */}
                      <div className="p-5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-3">
                        <div className="flex items-center gap-2 border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
                          <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                            What Differs Between Sites ({selectedHazard})
                          </h3>
                        </div>
                        {hazardData.whatDiffers && hazardData.whatDiffers.length > 0 ? (
                          <div className="space-y-2">
                            {hazardData.whatDiffers.map((diff, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#CBD5E1]">
                                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">→</span>
                                <span>{diff.observation || diff.statement}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic">
                            No divergence noted in {selectedHazard} across the selected facilities.
                          </p>
                        )}
                      </div>

                      {/* Recurring Barrier Breakdown */}
                      <div className="p-5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-3">
                        <div className="flex items-center gap-2 border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2">
                          <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                            Recurring Barrier Breach ({selectedHazard})
                          </h3>
                        </div>
                        {hazardData.recurringBarrier ? (
                          <div className="space-y-2 text-xs">
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 rounded-lg">
                              <span className="font-bold text-rose-900 dark:text-rose-300 block text-xs">
                                {hazardData.recurringBarrier.name}
                              </span>
                              <span className="text-rose-700 dark:text-rose-400 text-[11px]">
                                Observed {hazardData.recurringBarrier.count} times across:{' '}
                                {hazardData.recurringBarrier.affectedSites?.join(', ')}
                              </span>
                            </div>
                            {hazardData.crossSiteLearning && (
                              <p className="text-[#334155] dark:text-[#CBD5E1] text-[11px] leading-relaxed italic">
                                {hazardData.crossSiteLearning}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic">
                            No shared barrier failure detected for {selectedHazard}.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: PATTERNS & PREVENTATIVE DIRECTIVES                */}
            {/* ========================================================= */}
            {activeTab === 'patterns' && (
              <div className="space-y-6">
                {/* What Differs Section */}
                <section className="p-6 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3">
                  <div className="border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                        What Differs Between Sites
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-semibold">EVIDENCE ANALYSIS</span>
                  </div>

                  {keyDifferences.length === 0 ? (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic py-2">
                      No significant statistical difference identified across the selected dataset.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {keyDifferences.map((diff, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                          <span>{diff.statement}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Common Safety Patterns Section */}
                <section className="p-6 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3">
                  <div className="border-b border-[#D1D5DB]/60 dark:border-[#263244] pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-amber-600 dark:text-amber-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                        Common Safety Patterns (Present Across ≥ 2 Facilities)
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-semibold">SHARED VULNERABILITIES</span>
                  </div>

                  {commonPatterns.length === 0 ? (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic py-2">
                      No common safety pattern identified across the selected facilities.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {commonPatterns.map((pat, idx) => (
                        <div key={idx} className="p-3.5 bg-[#F8FAFC] dark:bg-[#172033] rounded-lg border border-[#D1D5DB]/80 dark:border-[#263244] text-xs space-y-1">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">{pat.title}</span>
                          <p className="text-[#64748B] dark:text-[#CBD5E1] text-[11px] leading-relaxed">{pat.statement}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Recommended Prevention Directives */}
                <section className="p-6 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs space-y-3">
                  <div className="border-b border-blue-100 dark:border-blue-900/40 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-blue-700 dark:text-blue-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-300">
                        Recommended Prevention & Corrective Directives
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 font-bold">CROSS-FACILITY DIRECTIVES</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3.5 bg-white dark:bg-[#111827] border border-blue-100 dark:border-blue-900/40 rounded-lg text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{rec.action}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-[#64748B] dark:text-[#CBD5E1] text-[11px] leading-relaxed">{rec.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
