import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Download,
  BookmarkCheck,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AnalysisModeSwitch from '../components/analysis/AnalysisModeSwitch';
import UploadDropzone from '../components/analysis/UploadDropzone';
import SelectedFilesPanel from '../components/analysis/SelectedFilesPanel';
import BatchOptions from '../components/analysis/BatchOptions';
import BatchProgress from '../components/analysis/BatchProgress';
import BatchSummary from '../components/analysis/BatchSummary';
import BatchSidebar from '../components/analysis/BatchSidebar';
import SiteGroupCard from '../components/analysis/SiteGroupCard';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import ReportTextarea from '../components/analysis/ReportTextarea';
import { analyzeFiles, analyzeText } from '../api/sifguardApi';
import { mockSampleBatch } from '../data/mockData';

export default function SubmitReport() {
  const navigate = useNavigate();

  // Mode state: 'upload' | 'paste' | 'sample'
  const [mode, setMode] = useState('upload');

  // Multi-file state
  const [files, setFiles] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { filename, pendingFiles }
  const [pasteText, setPasteText] = useState('');

  // Batch options
  const [groupBySite, setGroupBySite] = useState(true);
  const [autoMerge, setAutoMerge] = useState(true);
  const [depth, setDepth] = useState('standard');

  // Execution & Progress state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Selected report for slide-over drawer
  const [selectedReport, setSelectedReport] = useState(null);

  // Success notification banner
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle incoming multiple files
  function handleFilesSelect(incomingFiles) {
    setAnalysisError(null);
    const existingNames = new Set(files.map((f) => f.name || f.filename));
    const duplicates = incomingFiles.filter((f) => existingNames.has(f.name));

    if (duplicates.length > 0) {
      setDuplicateWarning({
        filename: duplicates.map((d) => d.name).join(', '),
        incomingFiles,
      });
      return;
    }

    addFiles(incomingFiles);
  }

  function addFiles(newFiles) {
    // Filter supported extensions
    const valid = newFiles.filter((f) => {
      const name = f.name || f.filename || '';
      const ext = name.split('.').pop().toLowerCase();
      return ['pdf', 'docx', 'doc', 'txt'].includes(ext);
    });

    if (valid.length < newFiles.length) {
      setAnalysisError('Some unsupported files were skipped. Supported formats: PDF, DOCX, TXT.');
    }

    setFiles((prev) => [...prev, ...valid]);
  }

  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClearAll() {
    setFiles([]);
    setProgress(null);
    setBatchResults(null);
    setAnalysisError(null);
  }

  // Load sample batch
  function handleLoadSampleBatch() {
    setFiles(mockSampleBatch);
    setAnalysisError(null);
  }

  // Execute Batch Analysis
  async function handleAnalyzeBatch() {
    if (mode === 'paste') {
      if (!pasteText.trim()) return;
      handleAnalyzePaste();
      return;
    }

    if (files.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setBatchResults(null);

    try {
      const outcome = await analyzeFiles(
        files,
        { groupBySite, autoMerge, depth },
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setBatchResults(outcome);
    } catch (err) {
      setAnalysisError(err.message || 'Batch analysis encountered an unexpected error.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Analyze single or multi-paste
  async function handleAnalyzePaste() {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setProgress({
      current: 1,
      total: 1,
      currentFile: 'Pasted Safety Text',
      status: 'analyzing',
      completedFiles: [],
      failedFiles: [],
      percentage: 50,
    });

    try {
      const res = await analyzeText(pasteText);
      const record = {
        id: `paste-${Date.now()}`,
        filename: 'manual-entry.txt',
        date: '2026-09-09',
        site: res.location || 'Rig Site A',
        location: res.location || 'Rig Site A',
        report_text: pasteText,
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
        durationSeconds: 2,
      });
      setProgress({
        current: 1,
        total: 1,
        status: 'completed',
        completedFiles: ['manual-entry.txt'],
        failedFiles: [],
        percentage: 100,
      });
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleRetryFailed() {
    if (!batchResults?.failedFiles?.length) return;
    const retryable = files.filter((f) =>
      batchResults.failedFiles.some((fail) => fail.filename === (f.name || f.filename))
    );
    // Remove corrupt naming trigger for demo retry
    const fixedFiles = retryable.map((f) => ({
      ...f,
      name: (f.name || f.filename).replace(/corrupt|error/gi, 'resolved'),
      filename: (f.name || f.filename).replace(/corrupt|error/gi, 'resolved'),
    }));
    setFiles(fixedFiles);
    handleAnalyzeBatch();
  }

  function handleResetWorkflow() {
    setFiles([]);
    setPasteText('');
    setProgress(null);
    setBatchResults(null);
    setAnalysisError(null);
    setSaveSuccess(false);
  }

  function handleExportJSON() {
    if (!batchResults) return;
    const blob = new Blob([JSON.stringify(batchResults, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sifguard-batch-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveToReports() {
    setSaveSuccess(true);
    setTimeout(() => {
      navigate('/reports?view=by-site');
    }, 1200);
  }

  // Group batch results by site
  const siteGroupMap = new Map();
  if (batchResults?.results) {
    batchResults.results.forEach((r) => {
      const site = r.site || r.location || 'Unassigned Site';
      if (!siteGroupMap.has(site)) {
        siteGroupMap.set(site, []);
      }
      siteGroupMap.get(site).push(r);
    });
  }

  const activeCount = mode === 'paste' ? (pasteText.trim() ? 1 : 0) : files.length;
  const buttonLabel = isAnalyzing
    ? `Analyzing ${activeCount} ${activeCount === 1 ? 'Report' : 'Reports'}...`
    : `Analyze ${activeCount > 0 ? activeCount : ''} ${activeCount === 1 ? 'Report' : 'Reports'}`;

  return (
    <AppShell title="Analyze Reports" subtitle="Batch Intelligence Workspace">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Primary Intelligence Pipeline
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Analyze Safety Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Upload multiple safety reports or paste raw logs to identify hazards, SIF precursors, and recurring site risks.
            </p>
          </div>

          <AnalysisModeSwitch mode={mode} onChange={(newMode) => {
            setMode(newMode);
            if (newMode === 'sample') {
              handleLoadSampleBatch();
            }
          }} />
        </div>

        {/* Duplicate Warning Modal */}
        <Modal
          isOpen={Boolean(duplicateWarning)}
          onClose={() => setDuplicateWarning(null)}
          title="Duplicate Document Detected"
          description={`The following file is already selected: ${duplicateWarning?.filename}. Would you like to keep the existing document or add it as an additional revision?`}
          confirmLabel="Add Anyway"
          cancelLabel="Skip Duplicate"
          onConfirm={() => {
            if (duplicateWarning?.incomingFiles) {
              addFiles(duplicateWarning.incomingFiles);
            }
          }}
        />

        {/* Save confirmation toast */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Batch successfully committed to Safety Intelligence database. Redirecting...</span>
            </div>
            <ArrowRight size={14} className="text-emerald-700 animate-pulse" />
          </div>
        )}

        {/* Main 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left / Primary Workspace Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Surface (If no results or user wants to reconfigure) */}
            {!batchResults && (
              <div className="space-y-4">
                {mode === 'upload' && (
                  <>
                    <UploadDropzone onFilesSelect={handleFilesSelect} />
                    <SelectedFilesPanel
                      files={files}
                      onRemoveFile={handleRemoveFile}
                      onClearAll={handleClearAll}
                    />
                  </>
                )}

                {mode === 'paste' && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider">
                        Field Incident Narrative
                      </span>
                      <span className="text-slate-500">
                        Separate multiple reports with a blank line or '---'
                      </span>
                    </div>
                    <ReportTextarea
                      value={pasteText}
                      onChange={setPasteText}
                      placeholder="Paste single or multiple safety reports here...&#10;&#10;Example:&#10;Employee was performing welding work on scaffold at 12m height on Rig Site B without harness...&#10;&#10;---&#10;&#10;Confined space entry performed inside Mud Tank 3 without atmospheric testing..."
                      disabled={isAnalyzing}
                    />
                  </div>
                )}

                {mode === 'sample' && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Pre-Configured 5-Report Incident Batch
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                        Multi-Site Incident Demo
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      This sample batch contains 5 realistic field reports spanning <strong>Rig Site A</strong>,{' '}
                      <strong>Rig Site B</strong>, and the <strong>Warehouse</strong>, including dropped objects,
                      confined space entry, scaffold height work, and pedestrian forklift interactions.
                    </p>

                    <SelectedFilesPanel
                      files={files}
                      onRemoveFile={handleRemoveFile}
                      onClearAll={handleClearAll}
                    />
                  </div>
                )}

                {/* Batch Analysis Controls */}
                {activeCount > 0 && (
                  <BatchOptions
                    groupBySite={groupBySite}
                    onToggleGroupBySite={() => setGroupBySite(!groupBySite)}
                    autoMerge={autoMerge}
                    onToggleAutoMerge={() => setAutoMerge(!autoMerge)}
                    depth={depth}
                    onChangeDepth={setDepth}
                  />
                )}

                {/* Primary CTA */}
                {activeCount > 0 && !isAnalyzing && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleAnalyzeBatch}
                      icon={FileSearch}
                      disabled={isAnalyzing}
                      className="px-6 shadow-xs"
                    >
                      {buttonLabel}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-slate-500"
                    >
                      Reset Workspace
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {analysisError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Ingestion Warning</p>
                  <p className="mt-0.5">{analysisError}</p>
                </div>
              </div>
            )}

            {/* In-Flight Batch Progress */}
            {isAnalyzing && progress && (
              <BatchProgress
                progress={progress}
                files={mode === 'paste' ? [{ name: 'manual-entry.txt' }] : files}
                onRetryFailed={handleRetryFailed}
              />
            )}

            {/* Results Section (Same-Page Memorandum & Site Groups) */}
            {batchResults && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Batch Summary Top Card */}
                <BatchSummary
                  results={batchResults.results}
                  durationSeconds={batchResults.durationSeconds}
                  onExport={handleExportJSON}
                  onSaveToReports={handleSaveToReports}
                />

                {/* Reset / Analyze Another Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Identified Site Groups
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {siteGroupMap.size} {siteGroupMap.size === 1 ? 'site' : 'sites'}
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetWorkflow}
                    icon={RotateCcw}
                  >
                    Analyze Another Batch
                  </Button>
                </div>

                {/* Chronological Site Groups */}
                <div className="space-y-4">
                  {Array.from(siteGroupMap.entries()).map(([siteName, siteReports]) => (
                    <SiteGroupCard
                      key={siteName}
                      siteName={siteName}
                      reports={siteReports}
                      onSelectReport={(r) => setSelectedReport(r)}
                      defaultExpanded={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column (1 col) */}
          <div className="space-y-4">
            <BatchSidebar
              fileCount={files.length}
              hasAnalyzed={Boolean(batchResults)}
              results={batchResults?.results || []}
            />
          </div>
        </div>

        {/* Slide-over Inspection Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={batchResults?.results || []}
          onClose={() => setSelectedReport(null)}
          onSelectReport={(r) => setSelectedReport(r)}
        />
      </div>
    </AppShell>
  );
}
