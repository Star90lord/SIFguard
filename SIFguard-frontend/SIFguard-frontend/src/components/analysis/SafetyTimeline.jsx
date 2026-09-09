import React from 'react';
import { Calendar, Clock, AlertOctagon, ChevronRight } from 'lucide-react';
import { RiskBadge } from '../ui/Badge';

/**
 * Formats ISO date string into human-friendly representation, e.g. "Sep 08, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown Date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function SafetyTimeline({
  reports = [],
  onSelectReport,
  className = '',
}) {
  if (!reports || reports.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No recorded incidents for this operational period.
      </div>
    );
  }

  // 1. Sort reports chronologically: newest first
  const sorted = [...reports].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.date).getTime();
    const timeB = new Date(b.timestamp || b.date).getTime();
    return timeB - timeA;
  });

  // 2. Group reports by date (Same Site + Same Date clustering)
  const dateGroups = [];
  const groupMap = new Map();

  sorted.forEach((report) => {
    const dStr = report.date || (report.timestamp ? report.timestamp.split('T')[0] : '2026-09-09');
    if (!groupMap.has(dStr)) {
      const newGroup = { date: dStr, items: [] };
      groupMap.set(dStr, newGroup);
      dateGroups.push(newGroup);
    }
    groupMap.get(dStr).items.push(report);
  });

  return (
    <div className={`relative pl-4 sm:pl-6 space-y-6 ${className}`}>
      {/* Vertical Spine Line */}
      <div
        className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-px bg-slate-200"
        aria-hidden="true"
      />

      {dateGroups.map((group, gIdx) => {
        const hasMultiple = group.items.length > 1;

        return (
          <div key={group.date} className="relative space-y-3">
            {/* Date Milestone Marker */}
            <div className="flex items-center gap-2 -ml-4 sm:-ml-6">
              <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 tracking-tight">
                  {formatDate(group.date)}
                </span>
                {hasMultiple && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200/80">
                    {group.items.length} incidents
                  </span>
                )}
              </div>
            </div>

            {/* Incident Items for this Date */}
            <div className="space-y-2.5 ml-2">
              {group.items.map((report, rIdx) => {
                const isSif = report.risk_level === 'SIF-Precursor';

                return (
                  <div
                    key={report.id || `${group.date}-${rIdx}`}
                    onClick={() => onSelectReport && onSelectReport(report)}
                    className={`group relative p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                      isSif
                        ? 'bg-red-50/20 border-red-200/80 hover:border-red-300 hover:bg-red-50/40'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                    } shadow-2xs`}
                  >
                    {/* Top Row: Risk + Hazard + Action */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={report.risk_level} size="sm" />
                        {report.hazard && (
                          <span className="text-xs font-semibold text-slate-800">
                            {report.hazard}
                          </span>
                        )}
                        {report.activity && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="text-slate-300">·</span>
                            {report.activity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-blue-600 shrink-0 font-medium transition-colors">
                        {report.time && (
                          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                            <Clock size={11} /> {report.time}
                          </span>
                        )}
                        <span>View</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>

                    {/* Report Text Narrative Snippet */}
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {report.text_snippet || report.report_text || report.full_text}
                    </p>

                    {/* Barrier failure footnote if exists */}
                    {report.barrier_failure && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <AlertOctagon size={11} className={isSif ? 'text-red-500' : 'text-slate-400'} />
                        <span>
                          Barrier: <strong className="text-slate-700 font-medium">{report.barrier_failure}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
