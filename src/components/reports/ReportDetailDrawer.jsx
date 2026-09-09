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
  Download,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { RiskBadge, ReportStatusBadge, PriorityBadge } from '../ui/Badge';
import Button from '../ui/Button';
import {
  formatReportCode,
  getContributingFactors,
  getRecommendedSafetyActions,
} from '../../utils/filterReports';
import { downloadIndividualReport } from '../../utils/reportGenerator';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(null);

  // Find index for Previous / Next navigation
  const currentIndex = report && allReports.length > 0
    ? allReports.findIndex((r) => String(r.id) === String(report.id))
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < allReports.length - 1;

  function handlePrev() {
    if (hasPrev && onSelectReport) {
      setDownloadFeedback(null);
      onSelectReport(allReports[currentIndex - 1]);
    }
  }

  function handleNext() {
    if (hasNext && onSelectReport) {
      setDownloadFeedback(null);
      onSelectReport(allReports[currentIndex + 1]);
    }
  }

  function handleDownload() {
    if (!report || isDownloading) return;
    setIsDownloading(true);
    try {
      const outcome = downloadIndividualReport(report);
      if (outcome.success) {
        setDownloadFeedback(`Report downloaded: ${outcome.filename}`);
        setTimeout(() => setDownloadFeedback(null), 4000);
      } else {
        setDownloadFeedback('Download could not be initiated.');
        setTimeout(() => setDownloadFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadFeedback('Error generating PDF report.');
      setTimeout(() => setDownloadFeedback(null), 4000);
    } finally {
      setIsDownloading(false);
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

  // Derived intelligence
  const { factors, whyItMatters } = getContributingFactors(report);
  const { priority, actions } = getRecommendedSafetyActions(report);

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
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                    {reportCode}
                  </span>
                  <RiskBadge level={report.risk_level} size="sm" />
                  <ReportStatusBadge status={report.status} size="sm" />
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

          {/* Quick Action Bar: Download Report & View Full Report */}
          <div className="px-5 sm:px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between gap-2.5 text-xs shrink-0">
            <span className="text-[11px] font-mono text-slate-500">
              OIL HSE Intelligence
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Download safety report"
                className="font-medium"
              >
                {isDownloading ? 'Generating...' : 'PDF'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowUpRight}
                onClick={() => {
                  onClose();
                  navigate(`/reports/${reportCode}`);
                }}
                aria-label="View Full Report"
                className="font-medium"
              >
                View Full Report
              </Button>
            </div>
          </div>

          {/* Download Feedback Toast */}
          {downloadFeedback && (
            <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-900 animate-in fade-in">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span className="truncate">{downloadFeedback}</span>
            </div>
          )}

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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Risk Level</span>
                  <RiskBadge level={report.risk_level} size="md" />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Task Priority</span>
                  <PriorityBadge priority={report.priority || 'STANDARD'} size="md" />
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

                <div className="sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Primary Hazard</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block break-words">
                    {report.hazard || 'None Specified'}
                  </span>
                  {report.hazard && report.hazard !== 'None' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/compare/hazard?hazard=${encodeURIComponent(report.hazard)}`);
                      }}
                      className="mt-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-0.5 group"
                    >
                      <span>Compare Hazard</span>
                      <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Operational Activity</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block break-words">
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
              <p className="text-xs sm:text-sm font-semibold text-rose-950 leading-snug break-words">
                {report.barrier_failure || 'None Identified'}
              </p>
              <p className="text-[11px] text-rose-800/80 leading-relaxed pt-0.5">
                Physical or administrative safeguard breach recorded during task execution.
              </p>
            </div>

            {/* 3. ENHANCEMENT 1: EXPLAINABLE RISK PANEL */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Explainable Risk Assessment
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Contributing Drivers
                </span>
              </div>

              {/* Qualitative Contributing Factors */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Contributing Risk Factors:
                </span>
                <ul className="space-y-1.5">
                  {factors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700 leading-snug"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why This Matters Callout */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Why This Matters
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {whyItMatters}
                </p>
              </div>

              {/* Classification Explanation Context */}
              {report.explanation && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Classification Note: </span>
                  <span>{report.explanation}</span>
                </div>
              )}
            </div>

            {/* 4. ENHANCEMENT 2: RECOMMENDED SAFETY ACTIONS */}
            <div className="p-4.5 rounded-xl border border-blue-200/90 bg-blue-50/30 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                    Recommended Safety Actions
                  </span>
                </div>

                {/* Priority Badge */}
                <span
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                    priority === 'IMMEDIATE'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : priority === 'PRIORITY'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  Priority: {priority}
                </span>
              </div>

              <div className="space-y-2">
                {actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-blue-100/90 shadow-2xs text-xs text-slate-800 leading-snug"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. EVENT TELEMETRY & LOCATION */}
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

            {/* 6. ORIGINAL REPORT (Visually Secondary Expandable Section) */}
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

            {/* 7. RELATED OBSERVATIONS FROM THE SAME SITE */}
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
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Download safety report"
              >
                PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowUpRight}
                onClick={() => {
                  onClose();
                  navigate(`/reports/${reportCode}`);
                }}
              >
                Full Report
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
