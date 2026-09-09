import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Briefcase, AlertTriangle, ShieldX, Building2, ChevronRight, Layers } from 'lucide-react';
import Badge, { RiskBadge } from '../ui/Badge';
import Button from '../ui/Button';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export default function ReportDetailDrawer({
  report,
  onClose,
  allReports = [],
  onSelectReport,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (report) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [report, onClose]);

  if (!report) return null;

  const site = report.site || report.location;

  // Find other reports from the same site
  const relatedReports = allReports
    .filter((r) => (r.site === site || r.location === site) && String(r.id) !== String(report.id))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between"
          aria-label="Report Detail Drawer"
        >
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Report #{report.id}
                </h3>
                <RiskBadge level={report.risk_level} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-400" />
                <span>{site || 'Industrial Site'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Grid */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 space-y-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Event Telemetry & Taxonomy
              </span>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <Calendar size={12} /> Logged Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(report.timestamp || report.date)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <AlertTriangle size={12} /> Primary Hazard
                  </span>
                  <span className="font-semibold text-slate-800">
                    {report.hazard || 'None Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <MapPin size={12} /> Specific Location
                  </span>
                  <span className="font-semibold text-slate-800">
                    {report.location || site}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <Briefcase size={12} /> Operational Activity
                  </span>
                  <span className="font-semibold text-slate-800">
                    {report.activity || 'General Operations'}
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <ShieldX size={12} /> Identified Barrier Failure
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {report.barrier_failure || 'None Identified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Original Report Narrative */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Original Field Report Narrative
              </h4>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-[13px] sm:text-sm text-slate-800 leading-relaxed font-normal shadow-2xs whitespace-pre-wrap">
                {report.full_text || report.text_snippet || report.report_text}
              </div>
            </div>

            {/* Analysis Explanation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Safety Intelligence Assessment
              </h4>
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 text-[13px] sm:text-sm text-amber-950 leading-relaxed">
                {report.explanation}
              </div>
            </div>

            {/* Related Reports from the Same Site */}
            {relatedReports.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Layers size={13} className="text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Related Observations from {site}
                  </h4>
                </div>

                <div className="space-y-2">
                  {relatedReports.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectReport && onSelectReport(rel)}
                      className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-500">{rel.date || rel.timestamp?.split('T')[0]}</span>
                        <RiskBadge level={rel.risk_level} size="sm" />
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-1 group-hover:text-slate-900">
                        {rel.text_snippet || rel.full_text}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{rel.hazard}</span>
                        <span className="text-blue-600 group-hover:underline flex items-center gap-0.5 font-medium">
                          Inspect <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="h-16 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              Classification ID: {report.id}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Details
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
