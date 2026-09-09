import React, { useState, useEffect, useMemo } from 'react';
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
import { analyzeFiles, analyzeText, getSites } from '../api/sifguardApi';
import { mockSampleBatch } from '../data/mockData';

export default function SubmitReport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  function handleClearAll() {
    setFiles([]);
    setBatchResults(null);
    setValidationError(null);
  }

  // Quick load 5-report sample batch
  function handleLoadSampleBatch() {
    setValidationError(null);
    setBatchResults(null);
    const sampleItems = mockSampleBatch.map((s) => ({
      ...s,
      name: s.filename,
      status: 'Ready',
    }));
    setFiles(sampleItems);
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
      <PageContainer className="space-y-6">
        {/* Page Header with Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Multi-Report Safety Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Analyze Safety Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Screen reports in batches and identify high-potential risks.
            </p>
          </div>

          {/* Load Sample Batch Button for 1-Click Evaluation */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Layers}
              onClick={handleLoadSampleBatch}
              disabled={isAnalyzing}
            >
              Load Sample Batch (5 Reports)
            </Button>
          </div>
        </div>

        {/* Site Context Selector Bar */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
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
              <span className="text-slate-500">Active screening target:</span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-bold flex items-center gap-1.5">
                <Building2 size={12} className="text-blue-600" />
                <span>Analyzing reports for: {activeSite.name}</span>
              </span>
              <button
                type="button"
                onClick={() => handleSiteContextChange('ALL')}
                className="text-xs text-slate-400 hover:text-slate-700 underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
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
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Batch successfully committed to safety reports database. Navigating...</span>
            </div>
            <ArrowRight size={14} className="text-emerald-700 animate-pulse" />
          </div>
        )}

        {/* Validation or Processing Error Display */}
        {validationError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Ingestion Warning</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload & Ingestion Section (Shown if not viewing batch results) */}
        {!batchResults && (
          <div className="space-y-5">
            {/* Upload Dropzone */}
            <UploadDropzone
              onFilesSelect={handleFilesSelect}
              className="bg-white shadow-2xs"
            />

            {/* Uploaded Reports Queue */}
            {files.length > 0 && (
              <div className="space-y-4">
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
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {files.length} {files.length === 1 ? 'report' : 'reports'} selected
                    </span>{' '}
                    ready for precursor screening
                  </div>

                  <div className="flex items-center gap-3">
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
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Risk Summary Card */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Analysis Complete
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {batchResults.results.length}{' '}
                    {batchResults.results.length === 1 ? 'report' : 'reports'} analyzed
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Precursor detection completed across {resultsBySite.length}{' '}
                    {resultsBySite.length === 1 ? 'operational site' : 'operational sites'}.
                  </p>
                </div>

                {/* Actions: Save / Analyze Another */}
                <div className="flex items-center gap-2.5">
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

              {/* Semantic Risk Badges Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Low Risk
                    </span>
                    <RiskBadge level="Low" size="sm" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-emerald-950">
                    {riskCounts.Low}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Medium Risk
                    </span>
                    <RiskBadge level="Medium" size="sm" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-amber-950">
                    {riskCounts.Medium}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-orange-50/60 border border-orange-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                      High Risk
                    </span>
                    <RiskBadge level="High" size="sm" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-orange-950">
                    {riskCounts.High}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-red-50/70 border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-800">
                      SIF-Precursor
                    </span>
                    <RiskBadge level="SIF-Precursor" size="sm" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-red-950">
                    {riskCounts['SIF-Precursor']}
                  </span>
                </div>
              </div>
            </div>

            {/* Results Grouped by SITE */}
            <div className="space-y-6">
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
                    className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4"
                  >
                    {/* Site Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                              {siteName}
                            </h3>
                            <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                              {siteReports.length} {siteReports.length === 1 ? 'report' : 'reports'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {dateSpan}
                          </p>
                        </div>
                      </div>

                      {/* Link to Site Profile */}
                      <button
                        type="button"
                        onClick={() => navigate(`/sites/${siteId}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
                      >
                        <span>View Facility Profile</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Operational Result Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
      </PageContainer>
    </AppShell>
  );
}
