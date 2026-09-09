import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { SiteHealthBadge, RiskBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Select from '../components/ui/Select';
import { getSiteComparison, getSites } from '../api/sifguardApi';

export default function SiteComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read sites query param: e.g. "rig-site-a,rig-site-b"
  const sitesParam = searchParams.get('sites') || '';
  const currentSiteIds = useMemo(() => {
    return sitesParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [sitesParam]);

  const [allAvailableSites, setAllAvailableSites] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time preset filter
  const [timeRange, setTimeRange] = useState('ALL');

  useEffect(() => {
    loadComparison();
  }, [sitesParam, timeRange]);

  async function loadComparison() {
    if (currentSiteIds.length < 2) {
      setLoading(false);
      setComparisonData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [compRes, sitesRes] = await Promise.all([
        getSiteComparison(currentSiteIds, { datePreset: timeRange }),
        getSites(),
      ]);
      setComparisonData(compRes);
      setAllAvailableSites(sitesRes || []);
    } catch (err) {
      setError(err.message || 'Unable to load facility comparison telemetry.');
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveSite(siteId) {
    const updated = currentSiteIds.filter((id) => id !== siteId);
    setSearchParams({ sites: updated.join(',') });
  }

  function handleAddSite(newSiteId) {
    if (!newSiteId || currentSiteIds.includes(newSiteId)) return;
    const updated = [...currentSiteIds, newSiteId];
    setSearchParams({ sites: updated.join(',') });
  }

  // Sites available to be added
  const availableToAdd = useMemo(() => {
    return allAvailableSites.filter((s) => !currentSiteIds.includes(s.id));
  }, [allAvailableSites, currentSiteIds]);

  if (currentSiteIds.length < 2) {
    return (
      <AppShell title="Site Comparison" subtitle="Cross-Facility Safety Intelligence">
        <PageContainer>
          <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <Repeat size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select at Least Two Sites</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select two or more operational facilities on the Sites directory to activate side-by-side comparison.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/sites')}>
                Go to Sites Directory
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const comparedSites = comparisonData?.sites || [];
  const keyDifferences = comparisonData?.keyDifferences || [];
  const commonPatterns = comparisonData?.commonPatterns || [];
  const recommendations = comparisonData?.recommendations || [];

  return (
    <AppShell title="Site Comparison" subtitle="Operational Safety Matrix">
      <PageContainer className="space-y-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <Link
            to="/sites"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Sites Directory</span>
          </Link>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Evaluation Period:</span>
            <Select
              size="sm"
              value={timeRange}
              onChange={(val) => setTimeRange(typeof val === 'object' && val?.target ? val.target.value : val)}
              options={[
                { value: 'ALL', label: 'All Time Records' },
                { value: 'THIS_MONTH', label: 'This Month' },
                { value: 'THIS_WEEK', label: 'Past 7 Days' },
                { value: 'TODAY', label: 'Today Only' },
              ]}
            />
          </div>
        </div>

        {/* Page Header */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Oil India Limited · HSE Facilities Benchmark
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                SITE COMPARISON
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Compare safety patterns across selected operational facilities.
              </p>
            </div>

            {/* Compared Sites Chips & Add Facility Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {currentSiteIds.map((sId) => {
                const siteObj = comparedSites.find((s) => s.id === sId);
                const sName = siteObj?.name || sId;
                return (
                  <span
                    key={sId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <Building2 size={13} className="text-slate-500" />
                    <span>{sName}</span>
                    {currentSiteIds.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(sId)}
                        className="text-slate-400 hover:text-slate-700 ml-0.5"
                        aria-label={`Remove ${sName} from comparison`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                );
              })}

              {/* Add Site dropdown (Unlimited facilities) */}
              {availableToAdd.length > 0 && (
                <div className="w-40">
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
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>Comparing {comparedSites.length} facilities</span>
          </div>
        </div>

        {/* COMPARISON MATRIX (SIDE-BY-SIDE / HORIZONTALLY SCROLLABLE) */}
        {loading ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Synthesizing cross-facility comparison...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl shadow-2xs text-xs text-red-600">
            {error}
          </div>
        ) : (
          <>
            {/* 1. PRIMARY METRICS BENCHMARK TABLE (STICKY METRIC COLUMN FOR 5+ SITES) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operational Safety Metrics
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  SIDE-BY-SIDE BENCHMARK
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4 w-48 min-w-[190px] sticky left-0 z-20 bg-slate-50 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Metric</th>
                      {comparedSites.map((site) => (
                        <th key={site.id} className="py-3 px-4 min-w-[170px] font-bold text-slate-900 border-l border-slate-100">
                          <Link
                            to={`/sites/${site.id}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <span>{site.name}</span>
                            <ChevronRight size={12} className="opacity-50" />
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400 block font-normal">
                            {site.code || 'SITE'} · {site.type}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Facility Health */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Health Status</td>
                      {comparedSites.map((s) => (
                        <td key={s.id} className="py-3 px-4 min-w-[170px] border-l border-slate-100">
                          <SiteHealthBadge status={s.healthStatus} size="sm" />
                        </td>
                      ))}
                    </tr>

                    {/* Total Reports */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Total Reports</td>
                      {comparedSites.map((s) => (
                        <td key={s.id} className="py-3 px-4 min-w-[170px] font-mono font-bold text-slate-900 text-sm border-l border-slate-100">
                          {s.totalReports}
                        </td>
                      ))}
                    </tr>

                    {/* High Risk Count */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">High Risk Observations</td>
                      {comparedSites.map((s) => (
                        <td key={s.id} className="py-3 px-4 min-w-[170px] border-l border-slate-100">
                          <span
                            className={`font-mono font-bold text-sm ${
                              s.highRiskCount > 0 ? 'text-orange-600' : 'text-slate-400'
                            }`}
                          >
                            {s.highRiskCount}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* SIF Precursors */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">SIF Precursors</td>
                      {comparedSites.map((s) => (
                        <td key={s.id} className="py-3 px-4 min-w-[170px] border-l border-slate-100">
                          {s.sifCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-xs">
                              <ShieldAlert size={12} />
                              {s.sifCount}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 font-medium">0</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Last Activity */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-700 w-48 min-w-[190px] sticky left-0 z-10 bg-white border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Last Observation</td>
                      {comparedSites.map((s) => (
                        <td key={s.id} className="py-3 px-4 min-w-[170px] font-mono text-slate-500 border-l border-slate-100">
                          {s.lastActivity}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. RISK DISTRIBUTION COMPARISON */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Risk Level Distribution
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">PROPORTIONAL BREAKDOWN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {comparedSites.map((site) => (
                  <div key={site.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{site.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{site.totalReports} total</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Low</span>
                        <span className="font-mono font-bold text-emerald-700">{site.riskCounts.Low}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Medium</span>
                        <span className="font-mono font-bold text-amber-700">{site.riskCounts.Medium}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">High</span>
                        <span className="font-mono font-bold text-orange-700">{site.riskCounts.High}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">SIF-Precursor</span>
                        <span className="font-mono font-bold text-rose-700">{site.riskCounts['SIF-Precursor']}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TOP HAZARDS & BARRIERS COMPARISON */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Hazards */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Top Hazards by Facility
                </span>
                <div className="space-y-4">
                  {comparedSites.map((s) => (
                    <div key={s.id} className="space-y-1 text-xs">
                      <span className="font-bold text-slate-900 text-[11px] block">{s.name}:</span>
                      {s.topHazards.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">No hazards recorded</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.topHazards.map((h, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {h.hazard} ({h.count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Activities */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Top Activities by Facility
                </span>
                <div className="space-y-4">
                  {comparedSites.map((s) => (
                    <div key={s.id} className="space-y-1 text-xs">
                      <span className="font-bold text-slate-900 text-[11px] block">{s.name}:</span>
                      {s.topActivities.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">No activities recorded</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.topActivities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {a.activity} ({a.count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Barriers */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Recurring Barrier Failures
                </span>
                <div className="space-y-4">
                  {comparedSites.map((s) => (
                    <div key={s.id} className="space-y-1 text-xs">
                      <span className="font-bold text-slate-900 text-[11px] block">{s.name}:</span>
                      {s.barrierFailures.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">No barrier breaches</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.barrierFailures.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/60 text-[11px]">
                              {b.barrier} ({b.count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. KEY DIFFERENCES SECTION (Step 15) */}
            <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Key Differences
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">EVIDENCE ANALYSIS</span>
              </div>

              {keyDifferences.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No significant difference identified in the selected dataset.
                </p>
              ) : (
                <div className="space-y-2">
                  {keyDifferences.map((diff, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{diff.statement}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. COMMON SAFETY PATTERNS (Step 16) */}
            <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-amber-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Common Safety Patterns
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">SHARED VULNERABILITIES</span>
              </div>

              {commonPatterns.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No common safety pattern identified across the selected facilities.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commonPatterns.map((pat, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">{pat.title}</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{pat.statement}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 6. RECOMMENDED PREVENTION (Step 17) */}
            <section className="p-6 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs space-y-3">
              <div className="border-b border-blue-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                    Recommended Prevention
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-blue-700 font-bold">CROSS-FACILITY DIRECTIVES</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-white border border-blue-100 rounded-lg text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rec.action}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{rec.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
