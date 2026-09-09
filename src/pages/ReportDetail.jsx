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
  Plus,
  Edit3,
  Trash2,
  Play,
  Check,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import {
  RiskBadge,
  ReportStatusBadge,
  ActionStatusBadge,
  ActionPriorityBadge,
  OverdueBadge,
  isActionOverdue,
} from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  getReport,
  updateReportStatus,
  createAction,
  updateAction,
  deleteAction,
  getActions,
} from '../api/sifguardApi';
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

  // Workflow status & history state
  const [reportStatus, setReportStatus] = useState('NEW');
  const [statusHistory, setStatusHistory] = useState([]);
  const [statusFeedback, setStatusFeedback] = useState(null);

  // HSE Actions state
  const [actions, setActions] = useState([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    priority: 'STANDARD',
    assignedTo: 'HSE Supervisor',
    dueDate: '',
    status: 'OPEN',
  });
  const [actionFeedback, setActionFeedback] = useState(null);

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
      setReportStatus(data.status || 'NEW');
      setStatusHistory(data.statusHistory || []);
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message || 'Report record not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!report || newStatus === reportStatus) return;
    try {
      const updated = await updateReportStatus(report.id, newStatus);
      setReportStatus(updated.status);
      setStatusHistory(updated.history || []);
      setStatusFeedback(`Report status updated to ${newStatus}`);
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }

  function handleOpenActionModal(actionToEdit = null, prefilledTitle = '') {
    if (actionToEdit) {
      setEditingAction(actionToEdit);
      setActionForm({
        title: actionToEdit.title || '',
        description: actionToEdit.description || '',
        priority: actionToEdit.priority || 'STANDARD',
        assignedTo: actionToEdit.assignedTo || 'HSE Supervisor',
        dueDate: actionToEdit.dueDate || '',
        status: actionToEdit.status || 'OPEN',
      });
    } else {
      setEditingAction(null);
      const defaultDue = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
      const defaultPri = report?.risk_level === 'SIF-Precursor' ? 'IMMEDIATE' : report?.risk_level === 'High' ? 'PRIORITY' : 'STANDARD';
      setActionForm({
        title: prefilledTitle || '',
        description: '',
        priority: defaultPri,
        assignedTo: 'HSE Supervisor',
        dueDate: defaultDue,
        status: 'OPEN',
      });
    }
    setIsActionModalOpen(true);
  }

  async function handleSaveAction(e) {
    if (e) e.preventDefault();
    if (!actionForm.title.trim()) return;

    try {
      if (editingAction) {
        const updated = await updateAction(editingAction.id, actionForm);
        setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setActionFeedback(`Action "${updated.title}" updated.`);
      } else {
        const created = await createAction({
          ...actionForm,
          reportId: report.id,
        });
        setActions((prev) => [created, ...prev]);
        setActionFeedback(`Action "${created.title}" assigned.`);
        if (reportStatus === 'NEW' || reportStatus === 'UNDER REVIEW') {
          setReportStatus('ACTION REQUIRED');
        }
      }
      setIsActionModalOpen(false);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Action save failed:', err);
    }
  }

  async function handleDeleteAction(actionId) {
    try {
      await deleteAction(actionId);
      setActions((prev) => prev.filter((a) => a.id !== actionId));
      setActionFeedback('Action removed.');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error('Action delete failed:', err);
    }
  }

  async function handleTransitionAction(action, nextStatus) {
    try {
      const updated = await updateAction(action.id, { status: nextStatus });
      setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setActionFeedback(`Action status set to ${nextStatus.replace(/_/g, ' ')}.`);

      const remainingActions = actions.filter((a) => a.id !== action.id);
      const allClosed = nextStatus === 'CLOSED' && remainingActions.every((a) => a.status === 'CLOSED');
      if (allClosed && reportStatus !== 'RESOLVED' && reportStatus !== 'CLOSED') {
        setActionFeedback('All assigned actions completed. Report can now be marked Resolved.');
      }
      setTimeout(() => setActionFeedback(null), 4500);
    } catch (err) {
      console.error('Action transition failed:', err);
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

          {/* OPERATIONAL STATUS & WORKFLOW BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Report Status:
              </span>
              <ReportStatusBadge status={reportStatus} size="md" />
              <div className="relative inline-block">
                <label htmlFor="report-status-select" className="sr-only">Change Report Status</label>
                <select
                  id="report-status-select"
                  aria-label="Change Report Status"
                  value={reportStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-md text-slate-800 shadow-2xs hover:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="NEW">New</option>
                  <option value="UNDER REVIEW">Under Review</option>
                  <option value="ACTION REQUIRED">Action Required</option>
                  <option value="IN PROGRESS">In Progress</option>
                  <option value="PENDING VERIFICATION">Pending Verification</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {statusFeedback && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 size={13} /> {statusFeedback}
              </span>
            )}
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

        {/* SECTION E — HSE ACTION TRACKING & INTERVENTIONS */}
        <section className="p-6 rounded-xl border border-blue-200/80 bg-white shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-700" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Section E — HSE Action Tracking & Interventions
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Track operational response, assignees, and verification milestones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenActionModal(null)}
              >
                Add Action
              </Button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                {actionFeedback}
              </span>
              {reportStatus !== 'RESOLVED' && reportStatus !== 'CLOSED' && actions.length > 0 && actions.every(a => a.status === 'CLOSED') && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('RESOLVED')}
                  className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors cursor-pointer"
                >
                  Mark Report Resolved
                </button>
              )}
            </div>
          )}

          {/* Tracked Actions List */}
          {actions.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <CheckSquare size={24} className="text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                No actions have been created for this report.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Convert a recommended safety intervention below or create a custom task to begin operational tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((act) => {
                const isOpen = act.status === 'OPEN';
                const isInProgress = act.status === 'IN PROGRESS';
                const isPendingVerification = act.status === 'PENDING VERIFICATION';
                const isClosed = act.status === 'CLOSED';

                return (
                  <div
                    key={act.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all space-y-3.5 shadow-2xs ${
                      isClosed
                        ? 'bg-slate-50/80 border-slate-200 text-slate-600'
                        : isPendingVerification
                        ? 'bg-sky-50/40 border-sky-200'
                        : isInProgress
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Task
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 break-words leading-snug">
                          {act.title}
                        </h4>
                        {act.description && (
                          <p className="text-xs text-slate-600 leading-relaxed break-words pt-0.5">
                            {act.description}
                          </p>
                        )}
                      </div>

                      {/* Action transition & edit buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start">
                        {(isOpen || act.status === 'ACTION REQUIRED') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Play}
                            onClick={() => handleTransitionAction(act, 'IN PROGRESS')}
                            className="text-amber-800 border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 font-semibold"
                          >
                            Start Action
                          </Button>
                        )}
                        {isInProgress && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Clock}
                            onClick={() => handleTransitionAction(act, 'PENDING VERIFICATION')}
                            className="text-sky-800 border-sky-200 bg-sky-50/60 hover:bg-sky-100/60 font-semibold"
                          >
                            Submit for Verification
                          </Button>
                        )}
                        {isPendingVerification && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Check}
                              onClick={() => handleTransitionAction(act, 'RESOLVED')}
                              className="text-teal-800 border-teal-200 bg-teal-50 hover:bg-teal-100 font-semibold"
                            >
                              Mark Resolved
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Check}
                              onClick={() => handleTransitionAction(act, 'CLOSED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
                            >
                              Verify & Close
                            </Button>
                          </>
                        )}
                        {act.status === 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            onClick={() => handleTransitionAction(act, 'CLOSED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
                          >
                            Close Action
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(act)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit action"
                          aria-label="Edit action"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAction(act.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete action"
                          aria-label="Delete action"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Task Attributes Grid (Priority, Status, Assignee, Due Date) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Priority
                        </span>
                        <ActionPriorityBadge priority={act.priority} size="sm" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Status
                        </span>
                        <ActionStatusBadge status={act.status} size="sm" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Assignee
                        </span>
                        <span className="font-semibold text-slate-800 break-words block">
                          {act.assignee || act.assignedTo || 'Site HSE Team'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Due Date
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-slate-700 font-medium block">
                            {act.dueDate || '—'}
                          </span>
                          {isActionOverdue(act) && <OverdueBadge size="sm" />}
                        </div>
                        {act.completedAt && (
                          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                            Verified: {new Date(act.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommended Interventions with 1-click track conversion */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recommended Interventions (from Analysis)
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Priority: {priority}
              </span>
            </div>

            <div className="space-y-2">
              {recommendedActions.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800"
                >
                  <div className="flex items-start gap-2.5 leading-snug">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5">{act}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(null, act)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    <Plus size={12} />
                    <span>Track as Action</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATUS HISTORY SECTION (Rendered only when history events exist) */}
        {statusHistory.length > 0 && (
          <section className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                <span>Status History</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{statusHistory.length} status events recorded</span>
            </div>
            <div className="space-y-2">
              {statusHistory.map((hist, idx) => {
                const dateObj = new Date(hist.timestamp);
                const dateFormatted = !isNaN(dateObj.getTime())
                  ? `${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                  : hist.timestamp;

                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-mono text-slate-500 text-[11px]">{dateFormatted}</span>
                      <span className="font-bold text-slate-900">{hist.newStatus}</span>
                    </div>
                    {hist.note && <span className="text-[11px] text-slate-500 italic">{hist.note}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

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

        {/* ACTION CREATION & EDITING MODAL */}
        {isActionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingAction ? 'Edit HSE Action' : 'Create Operational Action'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAction} className="p-5 space-y-4 text-xs">
                {/* Action Title */}
                <div>
                  <label htmlFor="action-title" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Action Title *
                  </label>
                  <input
                    id="action-title"
                    type="text"
                    required
                    value={actionForm.title}
                    onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                    placeholder="e.g., Stop activity until fall protection is verified"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="action-desc" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Description & Verification Criteria
                  </label>
                  <textarea
                    id="action-desc"
                    rows={3}
                    value={actionForm.description}
                    onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                    placeholder="Specific operational instructions or required engineering sign-offs..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                  />
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="action-priority" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Priority
                    </label>
                    <select
                      id="action-priority"
                      value={actionForm.priority}
                      onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="PRIORITY">Priority</option>
                      <option value="STANDARD">Standard</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="action-status" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Status
                    </label>
                    <select
                      id="action-status"
                      value={actionForm.status}
                      onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="OPEN">Open</option>
                      <option value="ACTION REQUIRED">Action Required</option>
                      <option value="IN PROGRESS">In Progress</option>
                      <option value="PENDING VERIFICATION">Pending Verification</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Assigned To & Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="action-assigned" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Assigned To
                    </label>
                    <input
                      id="action-assigned"
                      type="text"
                      value={actionForm.assignedTo}
                      onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })}
                      placeholder="e.g., HSE Supervisor"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="action-due" className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Due Date
                    </label>
                    <input
                      id="action-due"
                      type="date"
                      value={actionForm.dueDate}
                      onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsActionModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!actionForm.title.trim()}
                  >
                    {editingAction ? 'Update Action' : 'Create Action'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
