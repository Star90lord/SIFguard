import React from 'react';
import {
  Calendar,
  Building2,
  AlertTriangle,
  Briefcase,
  MapPin,
  ShieldX,
  ChevronRight,
} from 'lucide-react';
import { RiskBadge } from '../ui/Badge';

export default function AnalysisResultCard({ report, onSelectReport }) {
  if (!report) return null;

  const siteName = report.site || report.siteName || report.location || 'Operational Site';
  const displayTime = report.time || (report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);
  const formattedDate = `${report.date}${displayTime ? ` · ${displayTime}` : ''}`;

  return (
    <div
      onClick={() => onSelectReport && onSelectReport(report)}
      className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer group space-y-3"
      role="button"
      tabIndex={0}
      aria-label={`Inspect report from ${siteName} on ${formattedDate}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectReport && onSelectReport(report);
        }
      }}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-bold text-slate-700">{formattedDate}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
            <Building2 size={12} className="text-slate-400" />
            <span>{siteName}</span>
          </span>
        </div>

        <RiskBadge level={report.risk_level} size="sm" />
      </div>

      {/* Primary Hazard & Operational Attributes */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {report.hazard || 'Safety Observation'}
          </h4>
          <span className="text-xs text-slate-500 font-medium">{report.activity}</span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {report.text_snippet || report.full_text || report.report_text}
        </p>
      </div>

      {/* Location and Barrier Failure Strip */}
      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 truncate">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{report.location || siteName}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 font-medium justify-between sm:justify-end">
          <div className="flex items-center gap-1 truncate text-amber-900">
            <ShieldX size={12} className="text-amber-600 shrink-0" />
            <span className="truncate text-[11px]">
              {report.barrier_failure ? `Barrier: ${report.barrier_failure}` : 'Barrier: None'}
            </span>
          </div>
          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
          />
        </div>
      </div>
    </div>
  );
}
