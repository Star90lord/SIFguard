import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ChevronUp, ArrowRight, ShieldAlert, Calendar } from 'lucide-react';
import { SiteHealthBadge, RiskBadge } from '../ui/Badge';
import SafetyTimeline from './SafetyTimeline';
import { calculateSiteHealth } from '../../data/mockData';

export default function SiteGroupCard({
  siteName = 'Rig Site A',
  reports = [],
  onSelectReport,
  defaultExpanded = true,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const siteId = siteName.toLowerCase().replace(/\s+/g, '-');
  const health = calculateSiteHealth(reports);
  const uniqueDays = new Set(reports.map((r) => r.date || (r.timestamp ? r.timestamp.split('T')[0] : ''))).size;

  // Severity counts
  const lowCount = reports.filter((r) => r.risk_level === 'Low').length;
  const medCount = reports.filter((r) => r.risk_level === 'Medium').length;
  const highCount = reports.filter((r) => r.risk_level === 'High').length;
  const sifCount = reports.filter((r) => r.risk_level === 'SIF-Precursor').length;

  // Latest report
  const sorted = [...reports].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
  const latest = sorted[0];

  return (
    <div className={`rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs transition-all duration-150 ${className}`}>
      {/* Site Group Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Site Title & Health */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{siteName}</h3>
                <SiteHealthBadge status={health.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>{reports.length}</strong> {reports.length === 1 ? 'report' : 'reports'} ·{' '}
                <strong>{uniqueDays}</strong> unique {uniqueDays === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to={`/sites/${siteId}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>View Site</span>
              <ArrowRight size={13} />
            </Link>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse site reports' : 'Expand site reports'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Risk Breakdown & Latest Info */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {lowCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                {lowCount} Low
              </span>
            )}
            {medCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 font-medium">
                {medCount} Medium
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-950 border border-orange-200/80 font-medium">
                {highCount} High
              </span>
            )}
            {sifCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-950 border border-red-200/80 font-bold flex items-center gap-1">
                <ShieldAlert size={11} className="text-red-600" />
                {sifCount} SIF
              </span>
            )}
          </div>

          {latest && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Latest observation:</span>
              <span className="font-medium text-slate-700">{latest.date}</span>
              {latest.hazard && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-800">{latest.hazard}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Safety Timeline Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-white">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Safety History & Timeline</span>
            <span>Newest first</span>
          </div>
          <SafetyTimeline reports={reports} onSelectReport={onSelectReport} />
        </div>
      )}
    </div>
  );
}
