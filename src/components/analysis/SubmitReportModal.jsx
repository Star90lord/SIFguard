import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Building2,
  ShieldCheck,
  AlertOctagon,
  FileSearch,
  FileCode,
} from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import {
  countWords,
  validateWordCount,
  extractFileWordCount,
  MAX_REPORT_WORDS,
  WARN_REPORT_WORDS,
} from '../../utils/wordCount';
import { canSubmitReports } from '../../config/roles';
import { submitSafetyReports, submitSafetyReportText } from '../../api/sifguardApi';

function getFileIcon(filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    return <FileText size={16} className="text-red-500 shrink-0" />;
  }
  if (ext === 'docx' || ext === 'doc') {
    return <FileText size={16} className="text-blue-600 shrink-0" />;
  }
  return <FileCode size={16} className="text-slate-600 dark:text-slate-400 shrink-0" />;
}

export default function SubmitReportModal({
  isOpen = false,
  onClose,
  currentUser,
  sites = [],
  initialSite = 'ALL',
  onSuccess,
}) {
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active Tab: 'upload' | 'paste'
  const [activeTab, setActiveTab] = useState('upload');

  // Site assignment
  const [selectedSite, setSelectedSite] = useState(initialSite);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Paste text state
  const [pastedText, setPastedText] = useState('');

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Sync initial site context
  useEffect(() => {
    if (isOpen) {
      setSelectedSite(initialSite || 'ALL');
      setModalError(null);
    }
  }, [isOpen, initialSite]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'paste' && textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
  }, [isOpen, activeTab]);

  // Word count calculations for pasted text
  const pastedWordCount = countWords(pastedText);
  const pasteValidation = validateWordCount(pastedWordCount);
  const isPasteApproaching = pastedWordCount >= WARN_REPORT_WORDS && pastedWordCount <= MAX_REPORT_WORDS;
  const isPasteExceeded = pastedWordCount > MAX_REPORT_WORDS;

  // Check if any uploaded file exceeds word limit
  const hasOversizedFile = Object.values(fileErrors).some(Boolean);

  // Handle Drag and Drop
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileInput(e) {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }

  // File validation & intake
  async function handleIncomingFiles(incoming) {
    setModalError(null);
    const supportedExts = ['pdf', 'doc', 'docx', 'txt'];
    const valid = [];
    const invalidNames = [];

    incoming.forEach((f) => {
      const name = f.name || '';
      const ext = name.split('.').pop().toLowerCase();
      if (!supportedExts.includes(ext)) {
        invalidNames.push(name);
      } else {
        valid.push(f);
      }
    });

    if (invalidNames.length > 0) {
      setModalError(`Unsupported file format: ${invalidNames.join(', ')}. Only PDF, DOCX and TXT files are accepted.`);
    }

    if (valid.length === 0) return;

    // Filter duplicates
    const existingNames = new Set(selectedFiles.map((f) => f.name || f.filename));
    const newItems = valid.filter((f) => !existingNames.has(f.name || f.filename));

    if (newItems.length === 0 && valid.length > 0) {
      setModalError('Selected files are already in the submission list.');
      return;
    }

    // Process and extract word counts for each valid file
    const enriched = [];
    const newErrors = { ...fileErrors };

    for (const f of newItems) {
      const { wordCount, isWithinLimit, error } = await extractFileWordCount(f);
      const fileId = `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      enriched.push({
        id: fileId,
        rawFile: f,
        name: f.name,
        size: f.size ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : '1.4 MB',
        wordCount,
      });

      if (!isWithinLimit) {
        newErrors[fileId] = error || `Exceeds ${MAX_REPORT_WORDS.toLocaleString()} words.`;
      }
    }

    setSelectedFiles((prev) => [...prev, ...enriched]);
    setFileErrors(newErrors);
  }

  function handleRemoveFile(fileId) {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setFileErrors((prev) => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });
  }

  function handleClearFiles() {
    setSelectedFiles([]);
    setFileErrors({});
    setModalError(null);
  }

  function handleClearPaste() {
    setPastedText('');
    setModalError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  // Primary Submission Trigger
  async function handleSubmit() {
    setModalError(null);

    // 1. Authorization check
    if (currentUser && !canSubmitReports(currentUser)) {
      setModalError('Authorization denied: Only HSE Administrators can submit safety reports for screening.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'upload') {
        // Validation: files present
        if (selectedFiles.length === 0) {
          throw new Error('Please select at least one safety report document before analyzing.');
        }

        // Validation: word limit check
        if (hasOversizedFile) {
          throw new Error('One or more selected documents exceed the 10,000-word limit. Please remove them to continue.');
        }

        const filesToSubmit = selectedFiles.map((f) => f.rawFile || f);
        const outcome = await submitSafetyReports(filesToSubmit, selectedSite, {
          user: currentUser,
        });

        // Report row site assignment synchronization
        const selectedSiteObj = sites.find((s) => s.id === selectedSite);
        const assignedSiteName = selectedSiteObj?.name || 'Assigned Facility';

        const enrichedResults = outcome.results.map((res) => ({
          ...res,
          siteId: selectedSite !== 'ALL' ? selectedSite : res.siteId,
          siteName: selectedSite !== 'ALL' ? assignedSiteName : (res.siteName || res.site),
          site: selectedSite !== 'ALL' ? assignedSiteName : (res.site || res.siteName),
        }));

        const finalOutcome = {
          ...outcome,
          results: enrichedResults,
        };

        if (onSuccess) {
          onSuccess(
            finalOutcome,
            `${selectedFiles.length} ${selectedFiles.length === 1 ? 'safety report' : 'safety reports'} submitted and evaluated successfully.`
          );
        }

        // Reset and close modal
        setSelectedFiles([]);
        setFileErrors({});
        onClose();
      } else {
        // Paste mode
        const trimmed = pastedText.trim();
        if (!trimmed) {
          throw new Error('Please paste a safety report before continuing.');
        }

        if (isPasteExceeded) {
          throw new Error(`This report exceeds the ${MAX_REPORT_WORDS.toLocaleString()}-word limit (${pastedWordCount.toLocaleString()} words).`);
        }

        const selectedSiteObj = sites.find((s) => s.id === selectedSite);
        const assignedSiteName = selectedSiteObj?.name || 'Rig Site B';

        const outcome = await submitSafetyReportText(trimmed, selectedSite, {
          user: currentUser,
          siteName: assignedSiteName,
        });

        if (onSuccess) {
          onSuccess(outcome, 'Pasted safety observation submitted and evaluated successfully.');
        }

        // Reset and close modal
        setPastedText('');
        onClose();
      }
    } catch (err) {
      setModalError(err.message || 'Submission failed. Please verify the report details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const isAdmin = canSubmitReports(currentUser);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      {/* Backdrop click */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-[#172033] rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-[#111827]/40 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-[11px] font-bold font-mono uppercase tracking-wider">
                Admin Observation Intake
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                SIF Precursor Screening Engine
              </span>
            </div>
            <h2
              id="submit-modal-title"
              className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-tight"
            >
              Submit Safety Reports
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] mt-0.5">
              Add safety reports for SIFguard analysis via document upload or direct narrative text.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Close submission modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Permission warning if user is somehow not admin */}
          {!isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Administrator Clearance Required</strong>
                <span>
                  Observation ingestion and automated precursor screening are restricted to Administrator roles. Managers have view-only access.
                </span>
              </div>
            </div>
          )}

          {/* Validation or Submission Error Alert */}
          {modalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertOctagon size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Submission Error</span>
                <span className="mt-0.5 block">{modalError}</span>
              </div>
              <button
                type="button"
                onClick={() => setModalError(null)}
                className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 font-bold ml-1"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dual Method Tabs: [ Upload Files ] and [ Paste Report Text ] */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setModalError(null);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-[#475569] dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label="Switch to Upload Files tab"
              >
                <Upload size={14} />
                <span>Upload Files</span>
                {selectedFiles.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'upload' ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {selectedFiles.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  setModalError(null);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-[#475569] dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label="Switch to Paste Report Text tab"
              >
                <FileText size={14} />
                <span>Paste Report Text</span>
                {pastedWordCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'paste' ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {pastedWordCount}w
                  </span>
                )}
              </button>
            </div>

            {/* Site Context Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#475569] dark:text-slate-300 hidden sm:flex items-center gap-1">
                <Building2 size={13} className="text-blue-600 dark:text-blue-400" />
                <span>Site Context:</span>
              </span>
              <div className="w-44 sm:w-52">
                <Select
                  size="sm"
                  value={selectedSite}
                  onChange={(val) => setSelectedSite(typeof val === 'object' && val?.target ? val.target.value : val)}
                  disabled={isSubmitting}
                  options={[
                    { value: 'ALL', label: 'All Sites (Corporate)' },
                    ...sites.map((s) => ({
                      value: s.id,
                      label: `${s.name}`,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* TAB 1: UPLOAD FILES MODE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag & Drop Upload Dropzone */}
              <div
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 select-none ${
                  isDragOver
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 scale-[0.995]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-[#111827]/40'
                }`}
                role="button"
                tabIndex={0}
                aria-label="Upload multiple safety report documents"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 mb-2.5 shadow-xs">
                  <Upload size={20} />
                </div>

                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Upload safety reports
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 max-w-sm mx-auto mb-2.5">
                  Drag and drop files here or{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2">
                    browse files
                  </span>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    PDF · DOCX · TXT
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Max: 10,000 words per report
                  </span>
                </div>
              </div>

              {/* Selected Files Listing */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#334155] dark:text-[#CBD5E1]">
                      Selected Reports ({selectedFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="text-[#64748B] hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Clear all</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-[#172033] max-h-48 overflow-y-auto">
                    {selectedFiles.map((file) => {
                      const fileError = fileErrors[file.id];
                      return (
                        <div
                          key={file.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(file.name)}
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] dark:text-slate-400">
                                <span>{file.size}</span>
                                <span>•</span>
                                <span>~{file.wordCount ? file.wordCount.toLocaleString() : '0'} words</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {fileError ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold text-[11px]">
                                <AlertOctagon size={11} />
                                <span>Exceeds 10,000 words</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-semibold text-[11px]">
                                <CheckCircle2 size={11} />
                                <span>Valid</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Remove file"
                              aria-label={`Remove file ${file.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE TEXT MODE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="safety-report-textarea"
                  className="font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  Safety Report Text
                </label>

                <div className="flex items-center gap-2.5">
                  {/* Word Counter Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs border ${
                      isPasteExceeded
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                        : isPasteApproaching
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {pastedWordCount.toLocaleString()} / {MAX_REPORT_WORDS.toLocaleString()} words
                    {isPasteApproaching && ' · Approaching Limit'}
                    {isPasteExceeded && ' · Exceeded'}
                  </span>

                  {pastedText && (
                    <button
                      type="button"
                      onClick={handleClearPaste}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Large Textarea */}
              <div
                className={`relative rounded-xl border transition-all ${
                  isPasteExceeded
                    ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-400/40'
                    : 'border-slate-300 dark:border-slate-700 focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
                } bg-white dark:bg-[#1E293B] shadow-2xs`}
              >
                <textarea
                  id="safety-report-textarea"
                  ref={textareaRef}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="Paste the complete safety report here..."
                  rows={9}
                  disabled={isSubmitting}
                  aria-label="Safety report narrative text"
                  className="w-full px-4 py-3.5 text-[14px] leading-relaxed text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-none outline-none resize-y rounded-xl font-normal min-h-[200px]"
                />
              </div>

              {/* Character telemetry and hint */}
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 px-1 font-mono">
                <span>Narrative / Shift Log / Incident Report</span>
                <span>{pastedText.length.toLocaleString()} characters</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-[#111827]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#64748B] dark:text-slate-400">
            {activeTab === 'upload' ? (
              <span>
                {selectedFiles.length}{' '}
                {selectedFiles.length === 1 ? 'document selected' : 'documents selected'}{' '}
                · 10,000 words max/report
              </span>
            ) : (
              <span>
                {pastedWordCount === 0 ? 'Enter report text' : `${pastedWordCount.toLocaleString()} words evaluated`}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={FileSearch}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={
                !isAdmin ||
                isSubmitting ||
                (activeTab === 'upload' && (selectedFiles.length === 0 || hasOversizedFile)) ||
                (activeTab === 'paste' && (pastedWordCount === 0 || isPasteExceeded))
              }
              className="px-5 font-semibold"
            >
              {isSubmitting
                ? 'Analyzing...'
                : activeTab === 'upload'
                ? `Analyze ${selectedFiles.length > 0 ? selectedFiles.length : ''} ${selectedFiles.length === 1 ? 'Report' : 'Reports'}`
                : 'Analyze Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
