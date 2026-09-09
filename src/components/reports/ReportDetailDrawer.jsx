import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  MapPin,
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  Building2,
  ChevronRight,
  ChevronLeft,
  Layers,
  ExternalLink,
  ChevronDown,
  FileText,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react';
import { RiskBadge } from '../ui/Badge';
import Button from '../ui/Button';
import { formatReportCode } from '../../utils/filterReports';

function formatEventTimestamp(report) {
  if (report.date && report.time) {
    return `${report.date} · ${report.time}`;
  }
  if (report.timestamp) {
    try {
      const d = new Date(report.timestamp);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return report.timestamp;
    }
  }
  return report.date || '—';
}

export default function ReportDetailDrawer({
  report,
  onClose,
  allReports = [],
  onSelectReport,
}) {
  const navigate = useNavigate();
  const [showOriginalNarrative, setShowOriginalNarrative] = useState(false);

  // Find index for Previous / Next navigation
  const currentIndex = report && allReports.length > 0
    ? allReports.findIndex((r) => String(r.id) === String(report.id))
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < allReports.length - 1;

  function handlePrev() {
    if (hasPrev && onSelectReport) {
      onSelectReport(allReports[currentIndex - 1]);
    }
  }

  function handleNext() {
    if (hasNext && onSelectReport) {
      onSelectReport(allReports[currentIndex + 1]);
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
    }
    if (report) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [report, onClose, hasPrev, hasNext]);

  if (!report) return null;

  const siteName = report.site || report.siteName || report.location || 'Industrial Site';
  const siteId = report.siteId || siteName.toLowerCase().replace(/\s+/g, '-');
  const reportCode = report.code || formatReportCode(report.id);
  const isSifPrecursor =
    report.risk_level === 'SIF-Precursor' ||
    report.sif_precursor === true ||
    (report.explanation && report.explanation.toLowerCase().includes('sif precursor'));

  // Find other reports from the same site
  const relatedReports = allReports
    .filter(
      (r) =>
        (r.site === siteName || r.siteId === siteId || r.location === siteName) &&
        String(r.id) !== String(report.id)
    )
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 transition-opacity duration-200 backdrop-blur-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <aside
          className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between"
          aria-label="Report Detail Drawer"
        >
          {/* Header */}
          <div className="h-16 px-5 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    {reportCode}
                  </span>
                  <RiskBadge level={report.risk_level} size="sm" />
                </div>
                {/* Site Link: Clicking site navigates to /sites/:siteId */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/sites/${siteId}`);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold mt-0.5 group"
                  title={`Open ${siteName} facility profile`}
                >
                  <Building2 size={12} className="text-blue-500 group-hover:text-blue-700" />
                  <span>{siteName}</span>
                  <ExternalLink size={10} className="opacity-70 group-hover:opacity-100" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Previous / Next Batch Navigation Controls */}
              {allReports.length > 1 && currentIndex !== -1 && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Previous report"
                    aria-label="Previous report"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] text-slate-600 font-bold whitespace-nowrap">
                    Report {currentIndex + 1} of {allReports.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Next report"
                    aria-label="Next report"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* 1. SAFETY ASSESSMENT SECTION (Visual Focus) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Safety Assessment
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  OIL Classification
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Risk Level</span>
                  <RiskBadge level={report.risk_level} size="md" />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">SIF Precursor</span>
                  {isSifPrecursor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                      <AlertOctagon size={13} className="text-rose-600" />
                      <span>Detected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                      <ShieldCheck size={13} className="text-slate-400" />
                      <span>None Detected</span>
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Primary Hazard</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {report.hazard || 'None Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Operational Activity</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {report.activity || 'General Operations'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. BARRIER FAILURE SECTION (Prominent Callout) */}
            <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-900">
                <ShieldAlert size={14} className="text-rose-600" />
                <span>Barrier Failure</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-rose-950 leading-snug">
                {report.barrier_failure || 'None Identified'}
              </p>
              <p className="text-[11px] text-rose-800/80 leading-relaxed pt-0.5">
                Physical or administrative safeguard breach recorded during task execution.
              </p>
            </div>

            {/* 3. EXPLANATION SECTION */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Classification Explanation
              </span>
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
                {report.explanation || 'System analyzed this report based on precursor criteria, hazard severity, and barrier failure.'}
              </p>
            </div>

            {/* 4. EVENT TELEMETRY & LOCATION */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Location & Timestamp
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <Calendar size={12} /> Logged Date / Time
                  </span>
                  <span className="font-semibold text-slate-800 font-mono text-[11px] sm:text-xs">
                    {formatEventTimestamp(report)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                    <MapPin size={12} /> Specific Location
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">
                    {report.location || siteName}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. ORIGINAL REPORT (Visually Secondary Expandable Section) */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowOriginalNarrative((prev) => !prev)}
                className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Original Field Report</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    (Source Narrative)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                  <span>{showOriginalNarrative ? 'Hide text' : 'Show report text'}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-150 ${
                      showOriginalNarrative ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {showOriginalNarrative ? (
                <div className="p-4 text-xs sm:text-[13px] text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/30">
                  {report.full_text || report.text_snippet || report.report_text}
                </div>
              ) : (
                <div className="px-4 py-2 text-xs text-slate-500 italic truncate bg-white">
                  "{report.text_snippet || (report.full_text || '').slice(0, 100)}..."
                </div>
              )}
            </div>

            {/* 6. RELATED OBSERVATIONS FROM THE SAME SITE */}
            {relatedReports.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Recent Events at {siteName}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/sites/${siteId}?tab=reports`);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-1.5">
                  {relatedReports.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectReport && onSelectReport(rel)}
                      className="p-2.5 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="font-mono text-[11px] text-slate-500 font-medium">
                          {rel.date} {rel.time ? `· ${rel.time}` : ''}
                        </span>
                        <RiskBadge level={rel.risk_level} size="sm" />
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-1 group-hover:text-slate-900">
                        {rel.text_snippet || rel.full_text || rel.report_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="h-16 px-5 sm:px-6 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/sites/${siteId}`);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <Building2 size={13} />
              <span>Go to {siteName} History</span>
            </button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Details
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
