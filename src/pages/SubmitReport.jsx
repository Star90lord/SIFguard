import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Layers,
  ArrowRight,
  Download,
  BookmarkCheck,
  Filter,
  Check,
  Plus,
  UploadCloud,
  Lock,
  FileText,
  Sparkles,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { RiskBadge } from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import UploadDropzone from '../components/analysis/UploadDropzone';
import ReportQueue from '../components/analysis/ReportQueue';
import AnalysisResultCard from '../components/analysis/AnalysisResultCard';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import ReportTextarea from '../components/analysis/ReportTextarea';
import SubmitReportModal from '../components/analysis/SubmitReportModal';
import { analyzeFiles, analyzeText, getSites } from '../api/sifguardApi';
import { useApp } from '../context/AppContext';
import { canSubmitReports } from '../config/roles';
import { mockSampleBatch } from '../data/mockData';
import { downloadBatchSummary } from '../utils/reportGenerator';

export default function SubmitReport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useApp();
  const isAdmin = canSubmitReports(currentUser);

  // Admin submission modal state & feedback
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionToast, setSubmissionToast] = useState(null);

  // Sample Batch Preview Modal & Toast state
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleToast, setSampleToast] = useState(null);

  // Ref for smooth scrolling to queue
  const queueRef = useRef(null);

  // Monitored Sites from API
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);

  // Site Context: 'ALL' or specific siteId (e.g. 'rig-site-b')
  const initialSiteParam = searchParams.get('site') || 'ALL';
  const [siteContext, setSiteContext] = useState(initialSiteParam);

  // Mode: 'upload' | 'paste'
  const [inputMode, setInputMode] = useState('upload');

  // Multi-file queue state
  const [files, setFiles] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Execution & Progress state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  // Drawer Inspection
  const [selectedReport, setSelectedReport] = useState(null);

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Batch download state & feedback
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);
  const [downloadSummaryFeedback, setDownloadSummaryFeedback] = useState(null);

  function handleDownloadBatchSummary() {
    if (!batchResults || isDownloadingSummary) return;
    setIsDownloadingSummary(true);
    try {
      const outcome = downloadBatchSummary(batchResults);
      if (outcome.success) {
        setDownloadSummaryFeedback(`Batch summary downloaded: ${outcome.filename}`);
        setTimeout(() => setDownloadSummaryFeedback(null), 4000);
      } else {
        setDownloadSummaryFeedback('Unable to generate batch summary.');
        setTimeout(() => setDownloadSummaryFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Batch summary download error:', err);
      setDownloadSummaryFeedback('Error generating batch summary PDF.');
      setTimeout(() => setDownloadSummaryFeedback(null), 4000);
    } finally {
      setIsDownloadingSummary(false);
    }
  }

  function handleModalSuccess(newBatchResults, toastMessage) {
    setBatchResults(newBatchResults);
    setFiles([]);
    setSubmissionToast(toastMessage);
    setIsSubmitModalOpen(false);
    setTimeout(() => {
      setSubmissionToast(null);
    }, 6000);
  }

  useEffect(() => {
    async function loadSites() {
      try {
        const siteData = await getSites();
        setSites(siteData || []);
      } catch (err) {
        console.error('Failed to load sites directory:', err);
      } finally {
        setLoadingSites(false);
      }
    }
    loadSites();
  }, []);

  // Sync siteContext from query parameter if changed externally
  useEffect(() => {
    const siteParam = searchParams.get('site');
    if (siteParam) {
      setSiteContext(siteParam);
    }
  }, [searchParams]);

  function handleSiteContextChange(newSiteId) {
    setSiteContext(newSiteId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSiteId === 'ALL') {
        next.delete('site');
      } else {
        next.set('site', newSiteId);
      }
      return next;
    });

    // If a site is selected, update queued files to match this site
    if (newSiteId !== 'ALL') {
      const matchingSite = sites.find((s) => s.id === newSiteId);
      const siteName = matchingSite?.name || newSiteId;
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          siteId: newSiteId,
          siteName: siteName,
          site: siteName,
        }))
      );
    }
  }

  // Active Site Details
  const activeSite = useMemo(() => {
    if (siteContext === 'ALL') return null;
    return sites.find((s) => s.id === siteContext) || null;
  }, [sites, siteContext]);

  // Handle incoming file selection (with multi-file validation)
  function handleFilesSelect(incomingFiles) {
    setValidationError(null);

    // Validate supported formats: .pdf, .doc, .docx, .txt
    const supportedExts = ['pdf', 'doc', 'docx', 'txt'];
    const valid = [];
    const invalid = [];

    incomingFiles.forEach((f) => {
      const name = f.name || f.filename || '';
      const ext = name.split('.').pop().toLowerCase();
      if (!supportedExts.includes(ext)) {
        invalid.push(name);
      } else {
        valid.push(f);
      }
    });

    if (invalid.length > 0) {
      setValidationError(
        `Unsupported file type for: ${invalid.join(', ')}. PDF, DOCX and TXT files are supported.`
      );
    }

    if (valid.length === 0) return;

    // Check duplicates against existing queue
    const existingNames = new Set(files.map((f) => f.name || f.filename));
    const duplicates = valid.filter((f) => existingNames.has(f.name || f.filename));

    if (duplicates.length > 0) {
      setDuplicateWarning({
        filename: duplicates.map((d) => d.name || d.filename).join(', '),
        incomingFiles: valid,
      });
      return;
    }

    appendFilesToQueue(valid);
  }

  function appendFilesToQueue(newFiles) {
    // Determine default site for newly added files
    const defaultSiteId = siteContext !== 'ALL' ? siteContext : 'rig-site-b';
    const defaultSiteObj = sites.find((s) => s.id === defaultSiteId);
    const defaultSiteName = defaultSiteObj?.name || 'Rig Site B';

    const normalized = newFiles.map((f, idx) => ({
      name: f.name || f.filename || `report-${files.length + idx + 1}.pdf`,
      filename: f.name || f.filename || `report-${files.length + idx + 1}.pdf`,
      size: f.size || '1.4 MB',
      date: f.date || '09 Sep 2026',
      time: f.time || '10:00',
      siteId: f.siteId || defaultSiteId,
      siteName: f.siteName || defaultSiteName,
      site: f.site || defaultSiteName,
      status: 'Ready',
      rawFile: f,
    }));

    setFiles((prev) => [...prev, ...normalized]);
  }

  function handleUpdateFileSite(index, newSiteId) {
    const siteObj = sites.find((s) => s.id === newSiteId);
    const siteName = siteObj?.name || newSiteId;
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              siteId: newSiteId,
              siteName: siteName,
              site: siteName,
            }
          : f
      )
    );
  }

  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Computed duplicate check: whether files currently contains the mockSampleBatch
  const isSampleBatchLoaded = useMemo(() => {
    if (files.length === 0) return false;
    return mockSampleBatch.every((sample) =>
      files.some((f) => (f.name || f.filename) === sample.filename)
    );
  }, [files]);

  function handleClearAll() {
    setFiles([]);
    setBatchResults(null);
    setValidationError(null);
    setSampleToast(null);
  }

  // Open Sample Batch Preview Modal
  function handleOpenSampleModal() {
    setIsSampleModalOpen(true);
  }

  // Confirm loading or reloading 5-report sample batch
  async function handleConfirmLoadSample(reload = false) {
    setIsLoadingSample(true);
    if (reload) {
      setFiles([]);
    }
    // Subtle brief delay for smooth interaction
    await new Promise((resolve) => setTimeout(resolve, 250));

    setValidationError(null);
    setBatchResults(null);
    const sampleItems = mockSampleBatch.map((s) => ({
      ...s,
      name: s.filename,
      status: 'Ready',
    }));
    setFiles(sampleItems);
    setIsLoadingSample(false);
    setIsSampleModalOpen(false);

    setSampleToast('5 sample reports loaded successfully.');
    setTimeout(() => setSampleToast(null), 4000);

    // Smooth scroll to the Uploaded Reports Queue
    setTimeout(() => {
      if (queueRef.current) {
        queueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Execute Batch Analysis
  async function handleAnalyzeBatch() {
    if (inputMode === 'paste') {
      if (!pasteText.trim()) return;
      await handleAnalyzePaste();
      return;
    }

    if (files.length === 0) return;

    setIsAnalyzing(true);
    setValidationError(null);
    setBatchResults(null);

    // Update all files to 'Analyzing' status
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'Analyzing' })));

    try {
      const outcome = await analyzeFiles(files, {
        siteContext,
      });

      // Synchronize assigned sites from queue into the results
      const enrichedResults = outcome.results.map((res, idx) => {
        const correspondingFile = files[idx];
        if (correspondingFile) {
          return {
            ...res,
            siteId: correspondingFile.siteId || res.siteId,
            siteName: correspondingFile.siteName || res.site,
            site: correspondingFile.siteName || res.site,
            time: correspondingFile.time || res.time || '14:32',
          };
        }
        return res;
      });

      setBatchResults({
        ...outcome,
        results: enrichedResults,
      });

      // Mark files as analyzed
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'Analyzed' })));
    } catch (err) {
      setValidationError(err.message || 'Batch analysis encountered an unexpected error.');
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'Error' })));
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Analyze single or multi-paste
  async function handleAnalyzePaste() {
    setIsAnalyzing(true);
    setValidationError(null);
    try {
      const res = await analyzeText(pasteText);
      const targetSiteId = siteContext !== 'ALL' ? siteContext : 'rig-site-b';
      const targetSiteObj = sites.find((s) => s.id === targetSiteId);
      const targetSiteName = targetSiteObj?.name || 'Rig Site B';

      const record = {
        id: `paste-${Date.now()}`,
        filename: 'manual-incident-log.txt',
        date: '09 Sep 2026',
        time: '14:32',
        siteId: targetSiteId,
        siteName: targetSiteName,
        site: targetSiteName,
        location: `${targetSiteName} - North Processing Area`,
        report_text: pasteText,
        full_text: pasteText,
        risk_level: res.risk_level,
        hazard: res.hazard,
        activity: res.activity,
        barrier_failure: res.barrier_failure,
        sif_precursor: res.risk_level === 'SIF-Precursor' || res.risk_level === 'High',
        explanation: res.explanation,
        timestamp: new Date().toISOString(),
      };

      setBatchResults({
        batchId: `batch-${Date.now()}`,
        totalAnalyzed: 1,
        totalFailed: 0,
        results: [record],
        failedFiles: [],
        durationSeconds: 1,
      });
    } catch (err) {
      setValidationError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSaveToReports() {
    setSaveSuccess(true);
    setTimeout(() => {
      navigate('/reports?view=by-site');
    }, 1200);
  }

  // Dynamic count and label
  const reportCount = inputMode === 'paste' ? (pasteText.trim() ? 1 : 0) : files.length;
  const analyzeButtonText = isAnalyzing
    ? `Analyzing ${reportCount} ${reportCount === 1 ? 'Report' : 'Reports'}...`
    : `Analyze ${reportCount} ${reportCount === 1 ? 'Report' : 'Reports'}`;

  // Results grouping by Site
  const resultsBySite = useMemo(() => {
    if (!batchResults?.results) return [];
    const map = new Map();
    batchResults.results.forEach((r) => {
      const siteKey = r.siteName || r.site || 'Operational Site';
      if (!map.has(siteKey)) {
        map.set(siteKey, []);
      }
      map.get(siteKey).push(r);
    });
    return Array.from(map.entries());
  }, [batchResults]);

  // Check if results are SAME-SITE or DIFFERENT-SITES
  const isSameSiteBatch = resultsBySite.length === 1;

  // Results risk breakdown
  const riskCounts = useMemo(() => {
    if (!batchResults?.results) return { Low: 0, Medium: 0, High: 0, 'SIF-Precursor': 0 };
    return {
      Low: batchResults.results.filter((r) => r.risk_level === 'Low').length,
      Medium: batchResults.results.filter((r) => r.risk_level === 'Medium').length,
      High: batchResults.results.filter((r) => r.risk_level === 'High').length,
      'SIF-Precursor': batchResults.results.filter((r) => r.risk_level === 'SIF-Precursor').length,
    };
  }, [batchResults]);

  return (
    <AppShell title="Analyze Reports" subtitle="Multi-Report Batch Workspace">
      <PageContainer maxWidth="fluid" className="space-y-4 sm:space-y-5">
        {/* Page Header with Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-2 border-b border-[#D1D5DB] dark:border-[#263244]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Multi-Report Safety Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-none">
              Analyze Safety Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1 font-normal">
              Screen reports in batches and identify high-potential risks.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={Layers}
              onClick={handleOpenSampleModal}
              disabled={isAnalyzing}
            >
              Load Sample Batch
            </Button>
            {isAdmin ? (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsSubmitModalOpen(true)}
              >
                Submit Safety Reports
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={Lock}
                disabled={true}
                title="Submitting safety reports requires HSE Administrator permissions"
                className="opacity-70 cursor-not-allowed text-xs"
              >
                Submit Safety Reports (Admin Only)
              </Button>
            )}
          </div>
        </div>

        {/* Modal Submission Toast Feedback */}
        {submissionToast && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{submissionToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionToast(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Site Context Selector Bar */}
        <div className="p-3 sm:p-3.5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Site Context:</span>
            </span>

            <div className="w-56">
              <Select
                size="sm"
                value={siteContext}
                onChange={(val) => handleSiteContextChange(typeof val === 'object' && val?.target ? val.target.value : val)}
                disabled={isAnalyzing}
                options={[
                  { value: 'ALL', label: 'All Sites (Corporate Scope)' },
                  ...sites.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.location})`,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Active Site Context Banner Indicator */}
          {activeSite ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8]">Active screening target:</span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold flex items-center gap-1.5">
                <Building2 size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Analyzing reports for: {activeSite.name}</span>
              </span>
              <button
                type="button"
                onClick={() => handleSiteContextChange('ALL')}
                className="text-xs text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F8FAFC] underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-[#94A3B8] font-mono">
              Individual site assignment enabled per report row
            </span>
          )}
        </div>

        {/* Duplicate Warning Modal */}
        <Modal
          isOpen={Boolean(duplicateWarning)}
          onClose={() => setDuplicateWarning(null)}
          title="Duplicate Document Detected"
          description={`The following file is already selected: ${duplicateWarning?.filename}. Would you like to add it anyway?`}
          confirmLabel="Add Anyway"
          cancelLabel="Skip Duplicate"
          onConfirm={() => {
            if (duplicateWarning?.incomingFiles) {
              appendFilesToQueue(duplicateWarning.incomingFiles);
            }
          }}
        />

        {/* Save confirmation toast */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Batch successfully committed to safety reports database. Navigating...</span>
            </div>
            <ArrowRight size={14} className="text-emerald-700 dark:text-emerald-400 animate-pulse" />
          </div>
        )}

        {/* Validation or Processing Error Display */}
        {validationError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Ingestion Warning</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-700 dark:hover:text-red-200 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Intake Workspace Section (Shown if not viewing batch results) */}
        {!batchResults && (
          <div className="space-y-5">
            {files.length === 0 ? (
              isAdmin ? (
                /* Admin-Only Ingestion Hero Workspace */
                <div className="rounded-2xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] p-8 sm:p-10 shadow-xs text-center max-w-3xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-xs">
                    <UploadCloud size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold uppercase tracking-wider">
                      <Shield size={12} />
                      <span>Admin Submission Workspace</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                      Submit Safety Reports for AI Precursor Screening
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
                      Upload batches of PDF, DOCX, or TXT reports, or paste raw observation records (up to 10,000 words per report) to analyze potential Serious Injury &amp; Fatality precursors.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Plus}
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="px-6 py-2.5 text-sm font-semibold shadow-xs"
                    >
                      Submit Safety Reports
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      icon={Layers}
                      onClick={handleOpenSampleModal}
                      disabled={isAnalyzing}
                      className="px-5 py-2.5 text-sm"
                    >
                      Load Sample Batch
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-[#263244] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500 dark:text-[#94A3B8] text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-[#CBD5E1] block">PDF · DOCX · TXT</span>
                        Batch file uploads with automated text extraction
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-[#CBD5E1] block">Paste Raw Text</span>
                        Live word counter up to 10,000 words per report
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-[#CBD5E1] block">SIF Screening</span>
                        Automated precursor detection &amp; site risk assignment
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-Admin Informative Clearance Notice */
                <div className="rounded-2xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] p-8 sm:p-10 shadow-xs text-center max-w-2xl mx-auto space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-xs">
                    <Lock size={28} />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold uppercase tracking-wider">
                      <span>Restricted Function</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                      Report Submission Restricted to HSE Administrators
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
                      You are currently logged in with the role <strong className="text-slate-800 dark:text-[#CBD5E1] font-semibold">{currentUser?.role || 'HSE Manager'}</strong>. Submitting and ingesting new safety observation logs requires Administrator privileges.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="secondary"
                      size="md"
                      icon={Layers}
                      onClick={handleOpenSampleModal}
                      disabled={isAnalyzing}
                    >
                      Load Sample Batch
                    </Button>
                  </div>
                </div>
              )
            ) : (
              /* Queued Files View */
              <div ref={queueRef} className="space-y-4">
                {sampleToast && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-2xs animate-in fade-in">
                    <div className="flex items-center gap-2.5 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{sampleToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSampleToast(null)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <ReportQueue
                  files={files}
                  sites={sites}
                  selectedSiteContext={siteContext}
                  onUpdateFileSite={handleUpdateFileSite}
                  onRemoveFile={handleRemoveFile}
                  onClearAll={handleClearAll}
                  isAnalyzing={isAnalyzing}
                />

                {/* Primary Analyze Action Bar */}
                <div className="p-4 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {files.length} {files.length === 1 ? 'report' : 'reports'} selected
                    </span>{' '}
                    ready for precursor screening
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() => setIsSubmitModalOpen(true)}
                        disabled={isAnalyzing}
                      >
                        Add More Reports
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={isAnalyzing}
                    >
                      Clear Queue
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      icon={FileSearch}
                      onClick={handleAnalyzeBatch}
                      loading={isAnalyzing}
                      disabled={files.length === 0 || isAnalyzing}
                      className="px-6"
                    >
                      {analyzeButtonText}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYSIS RESULTS SECTION */}
        {batchResults && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
            {/* Header & Risk Summary Card */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-100 dark:border-[#263244]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Analysis Complete
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                    {batchResults.results.length}{' '}
                    {batchResults.results.length === 1 ? 'report' : 'reports'} analyzed
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Precursor detection completed across {resultsBySite.length}{' '}
                    {resultsBySite.length === 1 ? 'operational site' : 'operational sites'}.
                  </p>
                </div>

                {/* Actions: Download Summary / Analyze Another / Save */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadBatchSummary}
                    disabled={isDownloadingSummary}
                    icon={Download}
                    aria-label="Download batch analysis summary"
                  >
                    {isDownloadingSummary ? 'Generating PDF...' : 'Download Analysis Summary'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBatchResults(null);
                      setFiles([]);
                    }}
                    icon={RotateCcw}
                  >
                    Analyze Another Batch
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveToReports}
                    icon={BookmarkCheck}
                  >
                    Save to Reports
                  </Button>
                </div>
              </div>

              {/* Batch Download Feedback Notification */}
              {downloadSummaryFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300 animate-in fade-in">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{downloadSummaryFeedback}</span>
                </div>
              )}

              {/* Semantic Risk Badges Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Low Risk
                    </span>
                    <RiskBadge level="Low" size="sm" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-950 dark:text-emerald-100">
                    {riskCounts.Low}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Medium Risk
                    </span>
                    <RiskBadge level="Medium" size="sm" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-amber-950 dark:text-amber-100">
                    {riskCounts.Medium}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                      High Risk
                    </span>
                    <RiskBadge level="High" size="sm" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-orange-950 dark:text-orange-100">
                    {riskCounts.High}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                      SIF-Precursor
                    </span>
                    <RiskBadge level="SIF-Precursor" size="sm" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-red-950 dark:text-red-100">
                    {riskCounts['SIF-Precursor']}
                  </span>
                </div>
              </div>
            </div>

            {/* Results Grouped by SITE */}
            <div className="space-y-4 sm:space-y-5">
              {resultsBySite.map(([siteName, siteReports]) => {
                const siteId = siteReports[0]?.siteId || siteName.toLowerCase().replace(/\s+/g, '-');
                // Calculate date span for same-site or grouped header
                const sortedDates = [...siteReports].sort(
                  (a, b) => new Date(b.date) - new Date(a.date)
                );
                const latestDate = sortedDates[0]?.date;
                const earliestDate = sortedDates[sortedDates.length - 1]?.date;
                const dateSpan =
                  sortedDates.length > 1 && latestDate !== earliestDate
                    ? `${latestDate} → ${earliestDate}`
                    : latestDate;

                return (
                  <div
                    key={siteName}
                    className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-3 sm:space-y-3.5"
                  >
                    {/* Site Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#D1D5DB] dark:border-[#263244]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263244] flex items-center justify-center text-slate-700 dark:text-[#CBD5E1] shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                              {siteName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#172033] text-slate-700 dark:text-[#CBD5E1] text-xs font-mono font-bold">
                              {siteReports.length} {siteReports.length === 1 ? 'report' : 'reports'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
                            {dateSpan}
                          </p>
                        </div>
                      </div>

                      {/* Link to Site Profile */}
                      <button
                        type="button"
                        onClick={() => navigate(`/sites/${siteId}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 self-start sm:self-auto"
                      >
                        <span>View Facility Profile</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Operational Result Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {siteReports.map((report) => (
                        <AnalysisResultCard
                          key={report.id}
                          report={report}
                          onSelectReport={(r) => setSelectedReport(r)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Slide-over Report Detail Drawer with Previous / Next and Site Link */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={batchResults?.results || []}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />

        {/* Admin-Only Report Submission Modal (Upload Files & Paste Text) */}
        <SubmitReportModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          currentUser={currentUser}
          sites={sites}
          initialSite={siteContext}
          onSuccess={handleModalSuccess}
        />

        {/* Sample Batch Preview & Confirmation Modal */}
        <Modal
          isOpen={isSampleModalOpen}
          onClose={() => {
            if (!isLoadingSample) setIsSampleModalOpen(false);
          }}
          title={isSampleBatchLoaded ? 'Sample batch already loaded.' : 'Load Sample Safety Reports'}
          description={
            isSampleBatchLoaded
              ? 'A 5-report demonstration batch is currently present in your analysis queue.'
              : 'Load a realistic multi-site sample batch to explore the SIFguard analysis workflow.'
          }
          icon={Layers}
          iconBg="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60"
          iconColor="text-blue-600 dark:text-blue-400"
          maxWidth="max-w-xl"
          footer={
            isSampleBatchLoaded ? (
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263244]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSampleModalOpen(false)}
                  disabled={isLoadingSample}
                >
                  Keep Current Batch
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isLoadingSample}
                  icon={RotateCcw}
                  onClick={() => handleConfirmLoadSample(true)}
                >
                  {isLoadingSample ? 'Loading sample reports...' : 'Reload Sample Batch'}
                </Button>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263244]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSampleModalOpen(false)}
                  disabled={isLoadingSample}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isLoadingSample}
                  icon={Layers}
                  onClick={() => handleConfirmLoadSample(false)}
                >
                  {isLoadingSample ? 'Loading sample reports...' : 'Load 5 Sample Reports'}
                </Button>
              </div>
            )
          }
        >
          {isSampleBatchLoaded ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Sample batch already loaded.
                </p>
                <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  5 demonstration reports across 3 operating sites are already staged in your Uploaded Reports Queue. You can keep your active queue or reload a fresh sample batch.
                </p>
              </div>

              {/* Current Loaded Summary */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244] grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">Reports</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">5 Reports</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">Sites</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">3 Sites</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">Status</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Ready</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Concise 4-item Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244] text-center">
                  <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] block leading-tight">5</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">Reports</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244] text-center">
                  <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] block leading-tight">3</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">Sites</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244] text-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#CBD5E1] block leading-tight truncate">PDF/DOCX/TXT</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">Formats</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block leading-tight">Ready</span>
                  <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">For Analysis</span>
                </div>
              </div>

              {/* Compact Site Distribution Preview */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block mb-2">
                  Site Distribution
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244]">
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block truncate">Rig Site A</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">3 reports</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244]">
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block truncate">Rig Site B</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">1 report</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1420] border border-[#CBD5E1] dark:border-[#263244]">
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block truncate">Warehouse</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">1 report</span>
                  </div>
                </div>
              </div>

              {/* Compact Sample Report Manifest List */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block mb-2">
                  Sample Batch Manifest
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {mockSampleBatch.map((sample) => {
                    const ext = sample.filename.split('.').pop().toUpperCase();
                    return (
                      <div
                        key={sample.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0D1420] border border-slate-200/80 dark:border-[#263244] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-blue-500 shrink-0" />
                          <span className="font-mono font-medium text-slate-800 dark:text-[#CBD5E1] truncate">
                            {sample.filename.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-[#CBD5E1]">
                            {sample.siteName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {ext}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
