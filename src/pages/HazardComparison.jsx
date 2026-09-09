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
import { getHazardComparison, getReports, getSites } from '../api/sifguardApi';

export default function HazardComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const qHazard = searchParams.get('hazard');
  const qSites = searchParams.get('sites');
  const qRange = searchParams.get('range');

  const [allHazards, setAllHazards] = useState([]);
  const [allAvailableSites, setAllAvailableSites] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(qHazard || 'Dropped Object');
  const [timeRange, setTimeRange] = useState(qRange || 'ALL');
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
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

  // Initial load of hazards and available facilities
  useEffect(() => {
    async function initData() {
      try {
        const [reports, sites] = await Promise.all([getReports(), getSites()]);
        const uniqueHazards = Array.from(new Set(reports.map((r) => r.hazard).filter(Boolean))).sort();
        setAllHazards(uniqueHazards.length > 0 ? uniqueHazards : ['Dropped Object', 'Fall', 'Confined Space', 'Electrical', 'Vehicle Interaction', 'Chemical Exposure']);
        setAllAvailableSites(sites || []);

        // Initialize selected site IDs from URL or default to all facilities
        if (qSites) {
          const parsed = qSites
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const matched = sites.filter((site) => parsed.includes(site.id) || parsed.includes(site.name.toLowerCase().replace(/\s+/g, '-')));
          if (matched.length > 0) {
            setSelectedSiteIds(matched.map((m) => m.id));
          } else {
            setSelectedSiteIds(sites.map((s) => s.id));
          }
        } else {
          setSelectedSiteIds(sites.map((s) => s.id));
        }
      } catch (err) {
        setError('Failed to initialize hazard comparison parameters.');
      }
    }
    initData();
  }, []);

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
  }, [selectedHazard, selectedSiteIds, timeRange]);

  async function loadComparisonData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHazardComparison(selectedHazard, {
        datePreset: timeRange,
        sites: selectedSiteIds,
      });
      setComparisonData(data);
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

  const whatDiffers = comparisonData?.whatDiffers || [];
  const recurringBarrier = comparisonData?.recurringBarrier || null;
  const preventiveFocus = comparisonData?.preventiveFocus || [];
  const crossSiteLearning = comparisonData?.crossSiteLearning || null;
  const futureMonitoring = comparisonData?.futureMonitoring || null;
  const totalReports = comparisonData?.totalReports || 0;

  return (
    <AppShell title={`${selectedHazard} Analysis`} subtitle="Cross-Site Hazard Intelligence">
      <PageContainer className="space-y-6">
        {/* Breadcrumb Navigation & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Reports</span>
          </Link>

          {/* Top Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Hazard Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Hazard:</span>
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
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Operational Sites
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllSites}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={handleClearSites}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
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
                            isChecked ? 'bg-blue-50/60 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSite(site.id)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>{site.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            {site.code || 'SITE'}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
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
              <span className="text-xs text-slate-500 font-medium">Period:</span>
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
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-2 animate-in fade-in">
            <span>{siteNotice}</span>
          </div>
        )}

        {/* Single Site Notice (When user selects only 1 site) */}
        {selectedSiteIds.length === 1 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2.5 shadow-2xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <span>Select at least two sites to compare differences.</span>
              <span className="text-amber-700 font-normal ml-1">
                Currently displaying individual hazard telemetry for {siteBreakdown[0]?.siteName || 'the selected facility'}. Use [ Compare Sites ] above to add operational units.
              </span>
            </div>
          </div>
        )}

        {/* Page Header Banner */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Oil India Limited · Cross-Facility Hazard Analytics
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight uppercase">
                {selectedHazard} — CROSS-SITE ANALYSIS
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Evaluate risk distribution, recurring barrier failures, and control variance for {selectedHazard} across operational facilities.
              </p>
            </div>

            {/* Summary KPI Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reports</span>
                <span className="text-lg font-bold font-mono text-slate-900">{totalReports}</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Active Sites</span>
                <span className="text-lg font-bold font-mono text-amber-800">{activeSites.length}</span>
              </div>
            </div>
          </div>

          {/* Context Scope Sub-Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span>Selected Hazard: <strong className="text-slate-800">{selectedHazard}</strong></span>
              <span>·</span>
              <span>
                Sites: <strong className="text-slate-800">{isAllSitesSelected ? 'All Operational Facilities' : selectedSiteNames}</strong>
              </span>
              <span>·</span>
              <span>Period: <strong className="text-slate-800">{timeRangeLabel}</strong></span>
            </div>

            <span className="text-slate-400">
              {selectedSiteIds.length} {selectedSiteIds.length === 1 ? 'facility' : 'facilities'} evaluated
            </span>
          </div>

          {/* Selected Site Chips & Add Site Dropdown */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Scope:</span>
            {selectedSiteIds.map((sId) => {
              const siteObj = allAvailableSites.find((s) => s.id === sId);
              const sName = siteObj?.name || sId;
              return (
                <span
                  key={sId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <Building2 size={12} className="text-slate-500" />
                  <span>{sName}</span>
                  {selectedSiteIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSite(sId)}
                      className="text-slate-400 hover:text-slate-700 ml-0.5"
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
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Aggregating cross-site hazard intelligence...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-red-600 shadow-2xs">
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {selectedHazard} Occurrence by Selected Facility
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  SITE BREAKDOWN ({selectedSiteIds.length} SITES)
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4 w-48 min-w-[190px] sticky left-0 z-20 bg-slate-50 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        Operational Facility
                      </th>
                      <th className="py-3 px-4 text-right min-w-[90px]">Reports</th>
                      <th className="py-3 px-4 text-right min-w-[90px]">High Risk</th>
                      <th className="py-3 px-4 text-right min-w-[110px]">SIF Precursors</th>
                      <th className="py-3 px-4 min-w-[160px]">Risk Distribution</th>
                      <th className="py-3 px-4 min-w-[200px]">Associated Activities</th>
                      <th className="py-3 px-4 min-w-[220px]">Associated Barrier Failures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteBreakdown.map((site) => (
                      <tr key={site.siteId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          <Link
                            to={`/sites/${site.siteId}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <span>{site.siteName}</span>
                            <ChevronRight size={12} className="opacity-40" />
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400 block font-normal">
                            {site.siteCode || 'SITE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {site.reportsCount}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={site.highRiskCount > 0 ? 'text-orange-600' : 'text-slate-400'}>
                            {site.highRiskCount}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {site.sifCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs">
                              <ShieldAlert size={12} />
                              {site.sifCount}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Risk Distribution badges */}
                        <td className="py-3 px-4">
                          {site.reportsCount === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-[10px]">
                              {site.riskDistribution.Low > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  L:{site.riskDistribution.Low}
                                </span>
                              )}
                              {site.riskDistribution.Medium > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  M:{site.riskDistribution.Medium}
                                </span>
                              )}
                              {site.riskDistribution.High > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-orange-50 text-orange-800 border border-orange-200">
                                  H:{site.riskDistribution.High}
                                </span>
                              )}
                              {site.riskDistribution['SIF-Precursor'] > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                                  SIF:{site.riskDistribution['SIF-Precursor']}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Associated Activities */}
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {site.activities.length === 0 ? (
                            <span className="text-slate-400 italic">—</span>
                          ) : (
                            site.activities.join(', ')
                          )}
                        </td>

                        {/* Associated Barrier Failures */}
                        <td className="py-3 px-4 text-rose-800 text-[11px] font-medium">
                          {site.barrierFailures.length === 0 ? (
                            <span className="text-slate-400 italic">—</span>
                          ) : (
                            site.barrierFailures.join(', ')
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TWO-COLUMN INTELLIGENCE PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION: WHAT DIFFERS? (Step 21) */}
              <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      What Differs?
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">SITE CONTRAST</span>
                </div>

                {whatDiffers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No significant site variance identified for this hazard.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {whatDiffers.map((w, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-0.5">
                        <span className="font-bold text-slate-900 block">{w.site}:</span>
                        <p className="text-slate-700 leading-relaxed text-[11px]">{w.observation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: RECURRING BARRIER FAILURE (Step 22) */}
              <section className="p-6 rounded-xl border border-rose-200 bg-rose-50/25 shadow-2xs space-y-3">
                <div className="border-b border-rose-200/80 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                      Recurring Barrier Failure
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-rose-700 font-bold">PRIMARY SAFEGUARD BREACH</span>
                </div>

                {recurringBarrier ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-white border border-rose-200 rounded-lg shadow-2xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                        Most Frequent Safeguard Breakdown
                      </span>
                      <p className="text-sm font-bold text-rose-950">{recurringBarrier.name}</p>
                      <p className="text-xs text-slate-600">
                        Identified in <strong className="text-slate-900">{recurringBarrier.count}</strong> reports across selected facilities.
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Affected Selected Facilities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recurringBarrier.affectedSites.map((siteName, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-rose-200 text-xs font-semibold text-rose-900">
                            {siteName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No recurring barrier failure identified for this hazard.
                  </p>
                )}
              </section>
            </div>

            {/* SECTION: PREVENTIVE FOCUS (Step 23) */}
            <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Preventive Focus for {selectedHazard}
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">DECISION SUPPORT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {preventiveFocus.map((pf, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <span className="font-bold text-slate-900 block">{pf.step}</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{pf.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* TWO-COLUMN: CROSS-SITE LEARNING & FUTURE RISK MONITORING */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION: CROSS-SITE LEARNING (Step 24) */}
              <section className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/25 shadow-2xs space-y-3">
                <div className="border-b border-emerald-200/80 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-emerald-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Cross-Site Learning
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">OPERATIONAL BENCHMARK</span>
                </div>

                {crossSiteLearning ? (
                  <div className="p-4 bg-white border border-emerald-200 rounded-lg text-xs space-y-1.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Comparative Review Insight
                    </span>
                    <p className="text-slate-700 leading-relaxed text-xs font-medium">
                      {crossSiteLearning}
                    </p>
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      Note: Control procedures from lower-risk sites provide reference benchmarks for supervisory review.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    A minimum of two operational sites with distinct risk profiles is required for cross-site learning comparison.
                  </p>
                )}
              </section>

              {/* SECTION: FUTURE RISK MONITORING (Step 25) */}
              <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Continue Monitoring
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">HISTORICAL INTELLIGENCE</span>
                </div>

                {futureMonitoring && (
                  <div className="space-y-2.5 text-xs">
                    <p className="font-semibold text-slate-800 text-[11px]">
                      {futureMonitoring.notice}
                    </p>
                    <ul className="space-y-1.5">
                      {futureMonitoring.watchItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700 text-[11px] leading-snug">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1">
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
