import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Download,
  CheckCircle2,
  FileText,
  ExternalLink,
  Layers,
  ArrowRight,
  Clock,
  CheckSquare,
  Repeat,
  Shield,
  Filter,
  X,
  ChevronRight,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { getReport } from '../api/sifguardApi';
import {
  formatReportCode,
  formatDateTime,
  getContributingFactors,
  getRecommendedSafetyActions,
  getCorrectiveActions,
  getPreventiveActions,
} from '../utils/filterReports';
import { downloadIndividualReport } from '../utils/reportGenerator';

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(null);

  // Compare related reports modal state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [reportId]);

  async function loadReportData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getReport(reportId);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Report record not found.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!report || isDownloading) return;
    setIsDownloading(true);
    try {
      const outcome = downloadIndividualReport(report);
      if (outcome.success) {
        setDownloadFeedback(`Investigation Report downloaded: ${outcome.filename}`);
        setTimeout(() => setDownloadFeedback(null), 4500);
      } else {
        setDownloadFeedback('PDF generation could not be initiated.');
        setTimeout(() => setDownloadFeedback(null), 4500);
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadFeedback('Error compiling PDF investigation record.');
      setTimeout(() => setDownloadFeedback(null), 4500);
    } finally {
      setIsDownloading(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Safety Investigation" subtitle="Loading HSE Record...">
        <PageContainer>
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading investigation record...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (error || !report) {
    return (
      <AppShell title="Safety Investigation" subtitle="Record Error">
        <PageContainer>
          <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Report Record Not Found</h3>
              <p className="text-xs text-slate-500 mt-1">{error || `Report ${reportId} does not exist.`}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/reports')}>
                Back to Reports
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const reportCode = report.code || formatReportCode(report.id);
  const siteName = report.site || report.siteName || report.location || 'Operational Facility';
  const siteId = report.siteId || siteName.toLowerCase().replace(/\s+/g, '-');
  const siteCode = report.siteCode || (report.siteId ? report.siteId.toUpperCase() : 'OIL');
  const dateTimeStr = formatDateTime(report);

  const isSifPrecursor =
    report.risk_level === 'SIF-Precursor' ||
    report.sif_precursor === true ||
    (report.explanation && report.explanation.toLowerCase().includes('sif precursor'));

  // Derived Safety Intelligence
  const { factors, whyItMatters } = getContributingFactors(report);
  const { priority, actions: recommendedActions } = getRecommendedSafetyActions(report);
  const correctiveActions = getCorrectiveActions(report);
  const preventiveActions = getPreventiveActions(report);
  const relatedPatterns = report.relatedReports || [];
  const siteEvents = report.siteReports || [];

  // Narrative handling: complete narrative vs source excerpt
  const rawNarrative = report.full_text || report.report_text || report.text_snippet || '';
  const isExcerptOnly = !report.full_text && !report.report_text && Boolean(report.text_snippet);

  return (
    <AppShell title={`Report ${reportCode}`} subtitle="HSE Investigation Record">
      <PageContainer className="space-y-6 max-w-5xl">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Reports</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Building2}
              onClick={() => navigate(`/sites/${siteId}`)}
            >
              View Site
            </Button>
            {report.hazard && report.hazard !== 'None' && (
              <Button
                variant="secondary"
                size="sm"
                icon={Repeat}
                onClick={() => navigate(`/compare/hazard?hazard=${encodeURIComponent(report.hazard)}`)}
              >
                Compare This Hazard
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Generating PDF...' : 'Download Detailed Report'}
            </Button>
          </div>
        </div>

        {/* Download Feedback Banner */}
        {downloadFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in shadow-2xs">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{downloadFeedback}</span>
          </div>
        )}

        {/* FULL REPORT HEADER (HSE INVESTIGATION RECORD BANNER) */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Oil India Limited · HSE Investigation Record
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  REPORT {reportCode}
                </h1>
                <RiskBadge level={report.risk_level} size="lg" />
                {isSifPrecursor && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold font-mono">
                    <AlertOctagon size={14} className="text-rose-600" />
                    <span>SIF-PRECURSOR</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right">
              <Link
                to={`/sites/${siteId}`}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center md:justify-end gap-1"
              >
                <Building2 size={15} />
                <span>{siteName}</span>
              </Link>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{dateTimeStr}</p>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Primary Hazard</span>
              <span className="font-bold text-slate-900">{report.hazard || 'None Specified'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Operational Activity</span>
              <span className="font-bold text-slate-900">{report.activity || 'General Operations'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Barrier Failure</span>
              <span className="font-bold text-rose-900">{report.barrier_failure || 'None Identified'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Location</span>
              <span className="font-bold text-slate-900 truncate block">{report.location || siteName}</span>
            </div>
          </div>
        </div>

        {/* SECTION A — REPORT OVERVIEW */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <span>Section A — Report Overview</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">VERIFIED TELEMETRY</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {report.id && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Report ID</span>
                <span className="font-mono font-bold text-slate-900">{reportCode}</span>
              </div>
            )}
            {report.date && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Date</span>
                <span className="font-mono font-semibold text-slate-800">{report.date}</span>
              </div>
            )}
            {report.time && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Time</span>
                <span className="font-mono font-semibold text-slate-800">{report.time}</span>
              </div>
            )}
            {siteName && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Site</span>
                <span className="font-semibold text-slate-900">{siteName}</span>
              </div>
            )}
            {siteCode && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Site Code</span>
                <span className="font-mono font-semibold text-slate-700">{siteCode}</span>
              </div>
            )}
            {report.location && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Location</span>
                <span className="font-semibold text-slate-900">{report.location}</span>
              </div>
            )}
            {report.risk_level && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Risk</span>
                <RiskBadge level={report.risk_level} size="sm" />
              </div>
            )}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">SIF Precursor</span>
              <span className="font-bold text-slate-800">
                {isSifPrecursor ? 'Detected' : 'None Detected'}
              </span>
            </div>
            {report.hazard && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Hazard</span>
                <span className="font-semibold text-slate-900">{report.hazard}</span>
              </div>
            )}
            {report.activity && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Activity</span>
                <span className="font-semibold text-slate-900">{report.activity}</span>
              </div>
            )}
            {report.barrier_failure && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Barrier Failure</span>
                <span className="font-semibold text-rose-800">{report.barrier_failure}</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION B — ORIGINAL FIELD REPORT */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-slate-600" />
              <span>Section B — Original Field Report</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold uppercase">
              {isExcerptOnly ? 'SOURCE NARRATIVE EXCERPT' : 'COMPLETE SOURCE NARRATIVE'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
            {rawNarrative || 'No narrative text recorded for this report.'}
          </div>
        </section>

        {/* SECTION C — SAFETY CLASSIFICATION */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-600" />
              <span>Section C — Safety Classification</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">OIL METHODOLOGY</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Risk</span>
              <RiskBadge level={report.risk_level} size="sm" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">SIF Status</span>
              <span className={`font-bold ${isSifPrecursor ? 'text-rose-700' : 'text-slate-700'}`}>
                {isSifPrecursor ? 'Precursor Detected' : 'None Detected'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Hazard</span>
              <span className="font-semibold text-slate-900">{report.hazard || 'None'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Activity</span>
              <span className="font-semibold text-slate-900">{report.activity || 'General'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Barrier Failure</span>
              <span className="font-semibold text-rose-800">{report.barrier_failure || 'None'}</span>
            </div>
          </div>

          {/* Classification Explanation */}
          {report.explanation && (
            <div className="p-3.5 rounded-lg bg-blue-50/40 border border-blue-200/80 text-xs text-slate-700 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                Classification Explanation
              </span>
              <p className="leading-relaxed">{report.explanation}</p>
            </div>
          )}
        </section>

        {/* SECTION D — EXPLAINABLE RISK */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-blue-600" />
              <span>Section D — Explainable Risk</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">CONTRIBUTING DRIVERS</span>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Contributing Risk Factors
            </span>
            <ul className="space-y-2">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Why This Matters
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">{whyItMatters}</p>
          </div>
        </section>

        {/* SECTION E — RECOMMENDED SAFETY ACTIONS */}
        <section className="p-6 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-blue-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-950">
                Section E — Recommended Safety Actions
              </h2>
            </div>
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

          <div className="space-y-2.5">
            {recommendedActions.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-xs text-slate-800 leading-snug"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                  {idx + 1}
                </span>
                <span className="font-medium pt-0.5">{act}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TWO-COLUMN CORRECTIVE & PREVENTIVE ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION F — CORRECTIVE ACTION (Fix Current Condition) */}
          <section className="p-6 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-amber-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Corrective Action
                </h2>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                Fix Current Condition
              </span>
            </div>

            <p className="text-[11px] text-amber-900/80 leading-snug">
              Immediate operational interventions required to resolve the specific safeguard breach or hazard condition on site.
            </p>

            <div className="space-y-2.5">
              {correctiveActions.map((c, idx) => (
                <div key={idx} className="p-3 bg-white border border-amber-200/70 rounded-lg text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.step}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 font-semibold">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{c.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION G — PREVENTIVE ACTION (Reduce Recurrence) */}
          <section className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  Preventive Action
                </h2>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">
                Reduce Recurrence
              </span>
            </div>

            <p className="text-[11px] text-emerald-900/80 leading-snug">
              Systemic safeguards, inspection cadence improvements, and operational controls designed to prevent pattern recurrence.
            </p>

            <div className="space-y-2.5">
              {preventiveActions.map((p, idx) => (
                <div key={idx} className="p-3 bg-white border border-emerald-200/70 rounded-lg text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.step}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-semibold">
                      {p.timeline}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{p.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* SECTION H — RELATED SAFETY PATTERNS */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Section H — Related Safety Patterns
              </h2>
            </div>
            {relatedPatterns.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={Repeat}
                onClick={() => setIsCompareModalOpen(true)}
              >
                Compare Related Reports
              </Button>
            )}
          </div>

          {relatedPatterns.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center bg-slate-50 rounded-lg border border-slate-200">
              No related safety pattern identified in the current dataset.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedPatterns.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/reports/${rel.code || formatReportCode(rel.id)}`)}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 transition-all cursor-pointer group shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rel.code || formatReportCode(rel.id)}
                    </span>
                    <RiskBadge level={rel.risk_level} size="sm" />
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      <span>{rel.site || rel.siteName}</span>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <span className="font-semibold">Hazard:</span> {rel.hazard}
                    </p>
                    <p className="text-rose-800 text-[11px] line-clamp-1">
                      <span className="font-semibold">Barrier:</span> {rel.barrier_failure || 'None'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">{rel.date}</span>
                    <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION I — SITE HISTORY CONTEXT */}
        <section className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recent Events at {siteName}
              </h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Building2}
              onClick={() => navigate(`/sites/${siteId}?tab=history`)}
            >
              View Site History
            </Button>
          </div>

          {siteEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center bg-slate-50 rounded-lg border border-slate-200">
              No recent events logged for this operational site.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {siteEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/reports/${evt.code || formatReportCode(evt.id)}`)}
                  className="p-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4 text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {evt.date}
                    </span>
                    <RiskBadge level={evt.risk_level} size="sm" />
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {evt.hazard}
                      </span>
                      <span className="text-slate-500 ml-2">({evt.activity})</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMPARISON MODAL FOR RELATED REPORTS (STEP 27) */}
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-slate-950/45 transition-opacity"
              onClick={() => setIsCompareModalOpen(false)}
            />
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl max-w-4xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Repeat size={18} className="text-blue-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Compare Related Reports</h3>
                      <p className="text-xs text-slate-500">Side-by-side comparison with current investigation record</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Report</th>
                        <th className="py-2.5 px-3">Site</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Risk</th>
                        <th className="py-2.5 px-3">Hazard</th>
                        <th className="py-2.5 px-3">Activity</th>
                        <th className="py-2.5 px-3">Barrier Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Current Report Row */}
                      <tr className="bg-blue-50/40 font-semibold">
                        <td className="py-3 px-3 font-mono text-blue-900">{reportCode} (Current)</td>
                        <td className="py-3 px-3">{siteName}</td>
                        <td className="py-3 px-3 font-mono">{report.date}</td>
                        <td className="py-3 px-3"><RiskBadge level={report.risk_level} size="sm" /></td>
                        <td className="py-3 px-3">{report.hazard}</td>
                        <td className="py-3 px-3">{report.activity}</td>
                        <td className="py-3 px-3 text-rose-800">{report.barrier_failure || 'None'}</td>
                      </tr>
                      {/* Related Reports */}
                      {relatedPatterns.map((rel) => (
                        <tr key={rel.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {rel.code || formatReportCode(rel.id)}
                          </td>
                          <td className="py-3 px-3">{rel.site || rel.siteName}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{rel.date}</td>
                          <td className="py-3 px-3"><RiskBadge level={rel.risk_level} size="sm" /></td>
                          <td className="py-3 px-3 font-medium text-slate-900">{rel.hazard}</td>
                          <td className="py-3 px-3 text-slate-600">{rel.activity}</td>
                          <td className="py-3 px-3 text-rose-700">{rel.barrier_failure || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button variant="secondary" size="sm" onClick={() => setIsCompareModalOpen(false)}>
                    Close Comparison
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
