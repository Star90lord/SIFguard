import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  FileSearch,
  RefreshCw,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { SiteHealthBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SafetyTimeline from '../components/analysis/SafetyTimeline';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import { getSiteReports } from '../api/sifguardApi';

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  async function loadSite() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSiteReports(siteId);
      setSite(data);
    } catch (err) {
      setError(err.message || 'Facility intelligence record could not be retrieved.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Site Intelligence" subtitle="Facility Profile">
        <div className="py-20 text-center text-xs text-slate-400">
          Loading site safety telemetry...
        </div>
      </AppShell>
    );
  }

  if (error || !site) {
    return (
      <AppShell title="Site Intelligence" subtitle="Facility Profile">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Site Record Not Found
          </h3>
          <p className="text-sm text-slate-500 mb-5">{error || 'Unknown facility identifier.'}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard')} icon={ArrowLeft}>
              Dashboard
            </Button>
            <Button variant="primary" onClick={loadSite} icon={RefreshCw}>
              Retry
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const reports = site.reports || [];
  const lowCount = site.riskCounts?.Low || 0;
  const medCount = site.riskCounts?.Medium || 0;
  const highCount = site.riskCounts?.High || 0;
  const sifCount = site.riskCounts?.['SIF-Precursor'] || 0;

  return (
    <AppShell title={site.name} subtitle="Site Safety Intelligence">
      <div className="space-y-6">
        {/* Back navigation & facility breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/submit')}
            icon={FileSearch}
          >
            Submit Incident for this Site
          </Button>
        </div>

        {/* Site Profile Header Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {site.name}
                  </h1>
                  <SiteHealthBadge status={site.healthStatus} size="md" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {site.healthDescription} · Monitored operational site
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Total Observations
                </span>
                <span className="text-base font-bold font-mono text-slate-800">
                  {site.totalReports}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Active Log Days
                </span>
                <span className="text-base font-bold font-mono text-slate-800">
                  {site.uniqueDays}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Low Risk
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-emerald-900">{lowCount}</span>
                <span className="text-[11px] text-emerald-700">Standard</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Medium Risk
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-amber-900">{medCount}</span>
                <span className="text-[11px] text-amber-700">Monitored</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-orange-50/60 border border-orange-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                High Risk
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-orange-950">{highCount}</span>
                <span className="text-[11px] text-orange-700">Elevated</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-50/70 border border-red-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                <ShieldAlert size={11} /> SIF Precursors
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-red-950">{sifCount}</span>
                <span className="text-[11px] text-red-700 font-semibold">Priority</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Top Hazards + Chronological Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left / Main: Safety Timeline */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Longitudinal Safety Timeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological record of reported observations and safety events (newest first)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {reports.length} events
              </span>
            </div>

            <SafetyTimeline
              reports={reports}
              onSelectReport={(r) => setSelectedReport(r)}
            />
          </div>

          {/* Right: Recurring Hazard Breakdown */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recurring Facility Hazards
              </h4>

              {site.topHazards && site.topHazards.length > 0 ? (
                <div className="space-y-2.5">
                  {site.topHazards.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{item.hazard}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 font-mono font-bold text-slate-700">
                        {item.count} {item.count === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No distinct hazard clustering identified.</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs text-slate-500 space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[10px]">
                Deterministic Classification
              </span>
              <p className="leading-relaxed text-[11px]">
                Facility status is assigned based on verified SIF precursor precursors and repeated high-risk events over 30-day operational windows.
              </p>
            </div>
          </div>
        </div>

        {/* Slide-over Inspection Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={reports}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />
      </div>
    </AppShell>
  );
}
