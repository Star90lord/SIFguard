import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Filter,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Clock,
  Compass,
  X,
  Plus,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { useSites } from '../context/AppContext';
import { getHazardComparison } from '../api/sifguardApi';

export default function HazardComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sites: allAvailableSites } = useSites();

  // Read URL query parameters
  const qHazard = searchParams.get('hazard');
  const qSites = searchParams.get('sites');
  const qRange = searchParams.get('range');

  const [allHazards, setAllHazards] = useState(['All Hazards']);
  const [selectedHazard, setSelectedHazard] = useState(qHazard || 'All Hazards');
  const [timeRange, setTimeRange] = useState(qRange || 'ALL');
  const [selectedSiteIds, setSelectedSiteIds] = useState(() => {
    if (qSites) {
      return qSites
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
    return (allAvailableSites || []).map((s) => s.id);
  });
  const [isSiteSelectorOpen, setIsSiteSelectorOpen] = useState(false);
  const [siteNotice, setSiteNotice] = useState(null);

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const siteSelectorRef = useRef(null);

  // Close site selector popover on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (siteSelectorRef.current && !siteSelectorRef.current.contains(e.target)) {
        setIsSiteSelectorOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selectedSiteIds when allAvailableSites load if none selected yet
  useEffect(() => {
    if (selectedSiteIds.length === 0 && allAvailableSites.length > 0) {
      if (qSites) {
        const parsed = qSites
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const matched = allAvailableSites.filter((site) => parsed.includes(site.id) || parsed.includes(site.name.toLowerCase().replace(/\s+/g, '-')));
        setSelectedSiteIds(matched.length > 0 ? matched.map((m) => m.id) : allAvailableSites.map((s) => s.id));
      } else {
        setSelectedSiteIds(allAvailableSites.map((s) => s.id));
      }
    }
  }, [allAvailableSites.length]);

  // Sync external URL parameter changes if triggered by navigation
  useEffect(() => {
    if (qHazard && qHazard !== selectedHazard) {
      setSelectedHazard(qHazard);
    }
    if (qRange && qRange !== timeRange) {
      setTimeRange(qRange);
    }
  }, [qHazard, qRange]);

  // Load comparison data whenever hazard, sites, or time range changes
  useEffect(() => {
    if (selectedSiteIds.length === 0 && allAvailableSites.length > 0) return;
    loadComparisonData();
  }, [selectedHazard, selectedSiteIds, timeRange, allAvailableSites]);

  async function loadComparisonData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHazardComparison(selectedHazard, {
        datePreset: timeRange,
        sites: selectedSiteIds,
      });
      setComparisonData(data);
      if (data.availableHazards && Array.isArray(data.availableHazards)) {
        setAllHazards(data.availableHazards);
        // If current selectedHazard is not 'All Hazards' and not in availableHazards, reset to 'All Hazards'
        if (
          selectedHazard !== 'All Hazards' &&
          selectedHazard !== 'ALL' &&
          !data.availableHazards.includes(selectedHazard)
        ) {
          setSelectedHazard('All Hazards');
          syncUrl('All Hazards', selectedSiteIds, timeRange);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve cross-site hazard intelligence.');
    } finally {
      setLoading(false);
    }
  }

  // Helper to synchronize state to URL search parameters
  function syncUrl(hazard, sites, range) {
    const params = new URLSearchParams();
    if (hazard) params.set('hazard', hazard);
    if (sites && sites.length > 0) {
      params.set('sites', sites.join(','));
    }
    if (range && range !== 'ALL') {
      params.set('range', range);
    }
    setSearchParams(params, { replace: true });
  }

  function handleHazardChange(newHazard) {
    setSelectedHazard(newHazard);
    syncUrl(newHazard, selectedSiteIds, timeRange);
  }

  function handleTimeRangeChange(newRange) {
    setTimeRange(newRange);
    syncUrl(selectedHazard, selectedSiteIds, newRange);
  }

  function handleToggleSite(siteId) {
    if (selectedSiteIds.includes(siteId)) {
      if (selectedSiteIds.length <= 1) {
        setSiteNotice('At least one operational facility must remain selected.');
        setTimeout(() => setSiteNotice(null), 3000);
        return;
      }
      const updated = selectedSiteIds.filter((id) => id !== siteId);
      setSelectedSiteIds(updated);
      syncUrl(selectedHazard, updated, timeRange);
    } else {
      const updated = [...selectedSiteIds, siteId];
      setSelectedSiteIds(updated);
      syncUrl(selectedHazard, updated, timeRange);
    }
  }

  function handleSelectAllSites() {
    const allIds = allAvailableSites.map((s) => s.id);
    setSelectedSiteIds(allIds);
    syncUrl(selectedHazard, allIds, timeRange);
  }

  function handleClearSites() {
    if (allAvailableSites.length === 0) return;
    const single = [allAvailableSites[0].id];
    setSelectedSiteIds(single);
    syncUrl(selectedHazard, single, timeRange);
    setSiteNotice(`Focusing on ${allAvailableSites[0].name}. Select additional sites to activate cross-site comparison.`);
    setTimeout(() => setSiteNotice(null), 4000);
  }

  function handleAddSite(newSiteId) {
    if (!newSiteId || selectedSiteIds.includes(newSiteId)) return;
    const updated = [...selectedSiteIds, newSiteId];
    setSelectedSiteIds(updated);
    syncUrl(selectedHazard, updated, timeRange);
  }

  function handleRemoveSite(siteId) {
    if (selectedSiteIds.length <= 1) {
      setSiteNotice('At least one operational facility must remain selected.');
      setTimeout(() => setSiteNotice(null), 3000);
      return;
    }
    const updated = selectedSiteIds.filter((id) => id !== siteId);
    setSelectedSiteIds(updated);
    syncUrl(selectedHazard, updated, timeRange);
  }

  const unselectedSites = useMemo(() => {
    return allAvailableSites.filter((s) => !selectedSiteIds.includes(s.id));
  }, [allAvailableSites, selectedSiteIds]);

  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case 'TODAY':
        return 'Today Only';
      case 'THIS_WEEK':
        return 'Past 7 Days';
      case 'THIS_MONTH':
        return 'This Month';
      case 'THIS_YEAR':
        return 'This Year';
      case 'ALL':
      default:
        return 'All Records';
    }
  }, [timeRange]);

  const isAllSitesSelected = allAvailableSites.length > 0 && selectedSiteIds.length === allAvailableSites.length;
  const selectedSiteNames = selectedSiteIds
    .map((id) => allAvailableSites.find((s) => s.id === id)?.name || id)
    .join(', ');

  const siteBreakdown = comparisonData?.siteBreakdown || [];
  const activeSites = useMemo(() => {
    return siteBreakdown.filter((s) => s.reportsCount > 0);
  }, [siteBreakdown]);

  const [hazardTablePage, setHazardTablePage] = useState(1);
  const HAZARD_PAGE_SIZE = 8;

  useEffect(() => {
    setHazardTablePage(1);
  }, [selectedHazard, timeRange, selectedSiteIds]);

  const paginatedSiteBreakdown = useMemo(() => {
    const start = (hazardTablePage - 1) * HAZARD_PAGE_SIZE;
    return siteBreakdown.slice(start, start + HAZARD_PAGE_SIZE);
  }, [siteBreakdown, hazardTablePage]);

  const whatDiffers = comparisonData?.whatDiffers || [];
  const recurringBarrier = comparisonData?.recurringBarrier || null;
  const preventiveFocus = comparisonData?.preventiveFocus || [];
  const crossSiteLearning = comparisonData?.crossSiteLearning || null;
  const futureMonitoring = comparisonData?.futureMonitoring || null;
  const totalReports = comparisonData?.totalReports || 0;

  return (
    <AppShell title={`${selectedHazard} Analysis`} subtitle="Cross-Site Hazard Intelligence">
      <PageContainer maxWidth="fluid" className="space-y-4 sm:space-y-5">
        {/* Breadcrumb Navigation & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D1D5DB] dark:border-[#263244]">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Reports</span>
          </Link>

          {/* Top Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Hazard Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Hazard:</span>
              <div className="w-48">
                <Select
                  size="sm"
                  value={selectedHazard}
                  onChange={(val) => {
                    const h = typeof val === 'object' && val?.target ? val.target.value : val;
                    if (h) handleHazardChange(h);
                  }}
                  options={allHazards.map((h) => ({ value: h, label: h }))}
                />
              </div>
            </div>

            {/* 2. Site Selector Popover Button */}
            <div className="relative" ref={siteSelectorRef}>
              <Button
                variant="secondary"
                size="sm"
                icon={Building2}
                onClick={() => setIsSiteSelectorOpen((prev) => !prev)}
                className="text-xs font-semibold flex items-center gap-1.5"
                aria-expanded={isSiteSelectorOpen}
                aria-label="Toggle site comparison selection panel"
              >
                <span>Compare Sites ({selectedSiteIds.length})</span>
                <ChevronDown size={12} className={`transition-transform ${isSiteSelectorOpen ? 'rotate-180' : ''}`} />
              </Button>

              {/* Accessible Site Selection Popover */}
              {isSiteSelectorOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xl z-30 p-3 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263244] pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                      Operational Sites
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllSites}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={handleClearSites}
                        className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] hover:text-slate-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {allAvailableSites.map((site) => {
                      const isChecked = selectedSiteIds.includes(site.id);
                      return (
                        <label
                          key={site.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-700 dark:text-[#CBD5E1]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSite(site.id)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>{site.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-[#94A3B8] font-normal">
                            {site.code || 'SITE'}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#263244] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    <span>{selectedSiteIds.length} facilities selected</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsSiteSelectorOpen(false)}
                      className="py-1 px-2.5 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Evaluation Period Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Period:</span>
              <div className="w-36">
                <Select
                  size="sm"
                  value={timeRange}
                  onChange={(val) => {
                    const r = typeof val === 'object' && val?.target ? val.target.value : val;
                    if (r) handleTimeRangeChange(r);
                  }}
                  options={[
                    { value: 'ALL', label: 'All Records' },
                    { value: 'THIS_MONTH', label: 'This Month' },
                    { value: 'THIS_WEEK', label: 'Past 7 Days' },
                    { value: 'TODAY', label: 'Today Only' },
                    { value: 'THIS_YEAR', label: 'This Year' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Site Notice / Alert Banner */}
        {siteNotice && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 animate-in fade-in">
            <span>{siteNotice}</span>
          </div>
        )}

        {/* Single Site Notice (When user selects only 1 site) */}
        {selectedSiteIds.length === 1 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2.5 shadow-xs">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <span>Select at least two sites to compare differences.</span>
              <span className="text-amber-700 dark:text-amber-400 font-normal ml-1">
                Currently displaying individual hazard telemetry for {siteBreakdown[0]?.siteName || 'the selected facility'}. Use [ Compare Sites ] above to add operational units.
              </span>
            </div>
          </div>
        )}

        {/* Page Header Banner */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3 sm:space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-[#263244] pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Oil India Limited · Cross-Facility Hazard Analytics
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC] tracking-tight uppercase">
                {selectedHazard} — CROSS-SITE ANALYSIS
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">
                Evaluate risk distribution, recurring barrier failures, and control variance for {selectedHazard} across operational facilities.
              </p>
            </div>

            {/* Summary KPI Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-[#172033] rounded-lg border border-slate-200/80 dark:border-[#263244] text-center min-w-[85px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#94A3B8] block">Total Reports</span>
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-[#F8FAFC]">{totalReports}</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50 text-center min-w-[85px]">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Active Sites</span>
                <span className="text-base sm:text-lg font-bold font-mono text-amber-800 dark:text-amber-300">{activeSites.length}</span>
              </div>
            </div>
          </div>

          {/* Context Scope Sub-Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span>Selected Hazard: <strong className="text-slate-800 dark:text-[#F8FAFC]">{selectedHazard}</strong></span>
              <span>·</span>
              <span>
                Sites: <strong className="text-slate-800 dark:text-[#F8FAFC]">{isAllSitesSelected ? 'All Operational Facilities' : selectedSiteNames}</strong>
              </span>
              <span>·</span>
              <span>Period: <strong className="text-slate-800 dark:text-[#F8FAFC]">{timeRangeLabel}</strong></span>
            </div>

            <span className="text-slate-400 dark:text-[#94A3B8]">
              {selectedSiteIds.length} {selectedSiteIds.length === 1 ? 'facility' : 'facilities'} evaluated
            </span>
          </div>

          {/* Selected Site Chips & Add Site Dropdown */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#263244]">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mr-1">Scope:</span>
            {selectedSiteIds.map((sId) => {
              const siteObj = allAvailableSites.find((s) => s.id === sId);
              const sName = siteObj?.name || sId;
              return (
                <span
                  key={sId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263244] text-xs font-semibold text-slate-800 dark:text-[#CBD5E1]"
                >
                  <Building2 size={12} className="text-slate-500 dark:text-[#94A3B8]" />
                  <span>{sName}</span>
                  {selectedSiteIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSite(sId)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] ml-0.5"
                      aria-label={`Remove ${sName} from hazard comparison`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              );
            })}

            {/* + Add Site quick dropdown for unselected facilities */}
            {unselectedSites.length > 0 && (
              <div className="w-36">
                <Select
                  size="sm"
                  value=""
                  onChange={(val) => {
                    const id = typeof val === 'object' && val?.target ? val.target.value : val;
                    if (id) handleAddSite(id);
                  }}
                  options={[
                    { value: '', label: '+ Add Site' },
                    ...unselectedSites.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">Aggregating cross-site hazard intelligence...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl text-xs text-red-600 dark:text-red-400 shadow-xs">
            {error}
          </div>
        ) : totalReports === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={`No reports found for ${selectedHazard}`}
            message={`No safety observations recorded for "${selectedHazard}" in the selected evaluation period.`}
            actionLabel="Reset to All Time"
            onAction={() => setTimeRange('ALL')}
          />
        ) : (
          <>
            {/* 1. CROSS-SITE HAZARD COMPARISON TABLE (STICKY FACILITY COLUMN) */}
            <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-[#263244] bg-slate-50/70 dark:bg-[#0A0F18] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1]">
                  {selectedHazard} Occurrence by Selected Facility
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-[#94A3B8] font-semibold">
                  SITE BREAKDOWN ({selectedSiteIds.length} SITES)
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#0A0F18] text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 sm:px-4 w-48 min-w-[190px] sticky left-0 z-20 bg-slate-50 dark:bg-[#0A0F18] border-r border-slate-200/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        Operational Facility
                      </th>
                      <th className="py-2.5 px-3.5 sm:px-4 text-right min-w-[90px]">Reports</th>
                      <th className="py-2.5 px-3.5 sm:px-4 text-right min-w-[90px]">High Risk</th>
                      <th className="py-2.5 px-3.5 sm:px-4 text-right min-w-[110px]">SIF Precursors</th>
                      <th className="py-2.5 px-3.5 sm:px-4 min-w-[160px]">Risk Distribution</th>
                      <th className="py-2.5 px-3.5 sm:px-4 min-w-[200px]">Associated Activities</th>
                      <th className="py-2.5 px-3.5 sm:px-4 min-w-[220px]">Associated Barrier Failures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263244]">
                    {paginatedSiteBreakdown.map((site) => (
                      <tr key={site.siteId} className="hover:bg-slate-50 dark:hover:bg-[#172033] transition-colors">
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-slate-900 dark:text-[#F8FAFC] w-48 min-w-[190px] sticky left-0 z-10 bg-white dark:bg-[#111827] border-r border-slate-200/80 dark:border-[#263244] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          <Link
                            to={`/sites/${site.siteId}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1.5"
                          >
                            <span>{site.siteName}</span>
                            <ChevronRight size={12} className="opacity-40" />
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] font-normal">
                              {site.siteCode || 'SITE'}
                            </span>
                            {site.status && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                site.status === 'Active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : site.status === 'Maintenance'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-[#172033] text-slate-600 dark:text-slate-400'
                              }`}>
                                {site.status}
                              </span>
                            )}
                          </div>
                          {site.zeroExplanation && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-normal block italic mt-1 leading-snug">
                              {site.zeroExplanation}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-right font-mono font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                          <div>
                            <span>{site.reportsCount}</span>
                            {site.reportsCount === 0 && !comparisonData?.isAllHazards && (
                              <span className="block text-[10px] font-normal text-slate-400 dark:text-[#94A3B8]">
                                matching
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-right font-mono font-bold">
                          <span className={site.highRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-[#94A3B8]'}>
                            {site.highRiskCount}
                          </span>
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-right font-mono font-bold">
                          {site.sifCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs">
                              <ShieldAlert size={12} />
                              {site.sifCount}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-[#94A3B8]">0</span>
                          )}
                        </td>

                        {/* Risk Distribution badges or zero explanation */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4">
                          {site.reportsCount === 0 ? (
                            <span className="text-slate-500 dark:text-[#94A3B8] italic text-xs leading-snug block">
                              {site.zeroExplanation || 'No matching reports for selected hazard'}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              {site.riskDistribution.Low > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                                  L:{site.riskDistribution.Low}
                                </span>
                              )}
                              {site.riskDistribution.Medium > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                                  M:{site.riskDistribution.Medium}
                                </span>
                              )}
                              {site.riskDistribution.High > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-medium">
                                  H:{site.riskDistribution.High}
                                </span>
                              )}
                              {site.riskDistribution['SIF-Precursor'] > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-semibold">
                                  SIF:{site.riskDistribution['SIF-Precursor']}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Associated Activities */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-slate-700 dark:text-[#CBD5E1] text-xs">
                          {site.activities.length === 0 ? (
                            <span className="text-slate-500 dark:text-[#94A3B8] italic">—</span>
                          ) : (
                            site.activities.join(', ')
                          )}
                        </td>

                        {/* Associated Barrier Failures */}
                        <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-rose-900 dark:text-rose-300 text-xs font-medium">
                          {site.barrierFailures.length === 0 ? (
                            <span className="text-slate-500 dark:text-[#94A3B8] italic">—</span>
                          ) : (
                            site.barrierFailures.join(', ')
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Local Pagination */}
              {siteBreakdown.length > HAZARD_PAGE_SIZE && (
                <div className="px-4 py-2.5 sm:px-5 border-t border-[#D1D5DB] dark:border-[#263244] bg-slate-50/50 dark:bg-[#0A0F18]">
                  <Pagination
                    currentPage={hazardTablePage}
                    totalItems={siteBreakdown.length}
                    pageSize={HAZARD_PAGE_SIZE}
                    onPageChange={setHazardTablePage}
                    itemLabel="facilities"
                  />
                </div>
              )}
            </div>

            {/* TWO-COLUMN INTELLIGENCE PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* SECTION: WHAT DIFFERS? (Step 21) */}
              <section className="p-4 sm:p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-2.5 sm:space-y-3">
                <div className="border-b border-slate-100 dark:border-[#263244] pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                      What Differs?
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#94A3B8] font-semibold">SITE CONTRAST</span>
                </div>

                {whatDiffers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic py-2">
                    No significant site variance identified for this hazard.
                  </p>
                ) : (
                    <div className="space-y-2">
                      {whatDiffers.map((w, idx) => (
                        <div key={idx} className="p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#151E2E] rounded-lg border border-[#CBD5E1] dark:border-[#263244] text-xs space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">{w.site}:</span>
                          <p className="text-slate-700 dark:text-[#CBD5E1] leading-relaxed text-[11px]">{w.observation}</p>
                        </div>
                      ))}
                    </div>
                )}
              </section>

              {/* SECTION: RECURRING BARRIER FAILURE (Step 22) */}
              <section className="p-4 sm:p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/25 dark:bg-rose-950/20 shadow-xs space-y-2.5 sm:space-y-3">
                <div className="border-b border-rose-200/80 dark:border-rose-900/50 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-300">
                      Recurring Barrier Failure
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 font-bold">PRIMARY SAFEGUARD BREACH</span>
                </div>

                {recurringBarrier ? (
                  <div className="space-y-2.5">
                    <div className="p-3 sm:p-3.5 bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/50 rounded-lg shadow-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                        Most Frequent Safeguard Breakdown
                      </span>
                      <p className="text-sm font-bold text-rose-950 dark:text-rose-300">{recurringBarrier.name}</p>
                      <p className="text-xs text-slate-600 dark:text-[#CBD5E1]">
                        Identified in <strong className="text-slate-900 dark:text-[#F8FAFC]">{recurringBarrier.count}</strong> reports across selected facilities.
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Affected Selected Facilities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recurringBarrier.affectedSites.map((siteName, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-900 dark:text-rose-300">
                            {siteName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic py-2">
                    No recurring barrier failure identified for this hazard.
                  </p>
                )}
              </section>
            </div>

            {/* SECTION: PREVENTIVE FOCUS (Step 23) */}
            <section className="p-4 sm:p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3">
              <div className="border-b border-slate-100 dark:border-[#263244] pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-700 dark:text-blue-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                    Preventive Focus for {selectedHazard}
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-[#94A3B8] font-semibold">DECISION SUPPORT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {preventiveFocus.map((pf, idx) => (
                  <div key={idx} className="p-3 sm:p-3.5 bg-[#F8FAFC] dark:bg-[#151E2E] rounded-lg border border-[#CBD5E1] dark:border-[#263244] text-xs space-y-1 shadow-xs">
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">{pf.step}</span>
                    <p className="text-slate-600 dark:text-[#CBD5E1] text-[11px] leading-relaxed">{pf.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* TWO-COLUMN: CROSS-SITE LEARNING & FUTURE RISK MONITORING */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* SECTION: CROSS-SITE LEARNING (Step 24) */}
              <section className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/25 dark:bg-emerald-950/20 shadow-xs space-y-2.5 sm:space-y-3">
                <div className="border-b border-emerald-200/80 dark:border-emerald-900/50 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-emerald-700 dark:text-emerald-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                      Cross-Site Learning
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">OPERATIONAL BENCHMARK</span>
                </div>

                {crossSiteLearning ? (
                  <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      Comparative Review Insight
                    </span>
                    <p className="text-slate-700 dark:text-[#CBD5E1] leading-relaxed text-xs font-medium">
                      {crossSiteLearning}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] italic pt-1">
                      Note: Control procedures from lower-risk sites provide reference benchmarks for supervisory review.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic py-2">
                    A minimum of two operational sites with distinct risk profiles is required for cross-site learning comparison.
                  </p>
                )}
              </section>

              {/* SECTION: FUTURE RISK MONITORING (Step 25) */}
              <section className="p-4 sm:p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-2.5 sm:space-y-3">
                <div className="border-b border-slate-100 dark:border-[#263244] pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                      Continue Monitoring
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#94A3B8] font-semibold">HISTORICAL INTELLIGENCE</span>
                </div>

                {futureMonitoring && (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-[11px]">
                      {futureMonitoring.notice}
                    </p>
                    <ul className="space-y-1.5">
                      {futureMonitoring.watchItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-[#CBD5E1] text-[11px] leading-snug">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] italic pt-0.5">
                      Derived from historical observation trends across active Oil India Limited operational sites.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
