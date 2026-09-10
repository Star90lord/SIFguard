import React from 'react';
import { CheckCircle2, Download, BookmarkCheck, AlertTriangle, Building2, Clock, ShieldAlert } from 'lucide-react';
import Button from '../ui/Button';

export default function BatchSummary({
  results = [],
  durationSeconds = 14,
  onExport,
  onSaveToReports,
  className = '',
}) {
  const total = results.length;
  const siteSet = new Set(results.map((r) => r.site || r.location).filter(Boolean));
  const sitesCount = siteSet.size;

  const lowCount = results.filter((r) => r.risk_level === 'Low').length;
  const medCount = results.filter((r) => r.risk_level === 'Medium').length;
  const highCount = results.filter((r) => r.risk_level === 'High').length;
  const sifCount = results.filter((r) => r.risk_level === 'SIF-Precursor').length;

  const needsAttention = sifCount > 0 || highCount > 0;

  return (
    <div className={`p-5 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-5 ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Batch Analysis Complete
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Structured Safety Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
            <span><strong>{total}</strong> reports analyzed</span>
            <span>·</span>
            <span><strong>{sitesCount}</strong> {sitesCount === 1 ? 'facility' : 'facilities'} identified</span>
            <span>·</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock size={12} /> {durationSeconds}s runtime
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            icon={Download}
          >
            Export JSON
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSaveToReports}
            icon={BookmarkCheck}
          >
            Save to Reports
          </Button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Low Risk
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-900">{lowCount}</span>
            <span className="text-[11px] text-emerald-700">Normal</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Medium Risk
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-900">{medCount}</span>
            <span className="text-[11px] text-amber-700">Monitored</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
            High Risk
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-orange-950">{highCount}</span>
            <span className="text-[11px] text-orange-700">Supervised</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-red-50/60 border border-red-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
            <ShieldAlert size={11} /> SIF Precursor
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-950">{sifCount}</span>
            <span className="text-[11px] text-red-700 font-semibold">Priority</span>
          </div>
        </div>
      </div>

      {/* Operational Attention Alert if required */}
      {needsAttention && (
        <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200 flex items-start gap-3 text-xs">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-950">Immediate Operational Review Required</p>
            <p className="text-red-800 mt-0.5 leading-relaxed">
              Batch analysis detected {sifCount > 0 ? `${sifCount} potential SIF-precursor event(s)` : ''}
              {sifCount > 0 && highCount > 0 ? ' and ' : ''}
              {highCount > 0 ? `${highCount} elevated high-risk condition(s)` : ''}.
              Inspect the site timelines below to initiate safety stand-downs or corrective barrier audits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
