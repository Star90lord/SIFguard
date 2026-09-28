import React, { useMemo } from 'react';
import {
  FileText,
  FileCode,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

function getFileExtension(filename = '') {
  return filename.split('.').pop().toUpperCase() || 'FILE';
}

function getFileIcon(filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    return <FileText size={15} className="text-red-500 shrink-0" />;
  }
  if (ext === 'docx' || ext === 'doc') {
    return <FileText size={15} className="text-blue-600 shrink-0" />;
  }
  return <FileCode size={15} className="text-slate-600 shrink-0" />;
}

export default function ReportQueue({
  files = [],
  sites = [],
  selectedSiteContext = 'ALL',
  onUpdateFileSite,
  onRemoveFile,
  onClearAll,
  isAnalyzing = false,
  className = '',
}) {
  // Compute distinct sites count in queue
  const distinctSitesCount = useMemo(() => {
    const siteIds = new Set(files.map((f) => f.siteId || f.site || 'unassigned'));
    return siteIds.size;
  }, [files]);

  // Compute stats
  const readyCount = files.filter((f) => (f.status || 'Ready') === 'Ready').length;
  const errorCount = files.filter((f) => f.status === 'Error').length;

  // Determine if all files are from the SAME site
  const isSingleSite = distinctSitesCount === 1 && files[0]?.siteName;
  const singleSiteName = isSingleSite ? (files[0]?.siteName || files[0]?.site) : null;

  if (files.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Batch Summary Bar */}
      <div className="p-3.5 bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#263244] rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block">
              Reports
            </span>
            <span className="text-base font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
              {files.length}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-[#263244]" aria-hidden="true" />

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block">
              Sites
            </span>
            <span className="text-base font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
              {distinctSitesCount}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-[#263244]" aria-hidden="true" />

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block">
              Ready
            </span>
            <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">
              {readyCount}
            </span>
          </div>

          {errorCount > 0 && (
            <>
              <div className="h-6 w-px bg-slate-200 dark:bg-[#263244]" aria-hidden="true" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 dark:text-red-400 block">
                  Errors
                </span>
                <span className="text-base font-mono font-bold text-red-600 dark:text-red-400">
                  {errorCount}
                </span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClearAll}
          disabled={isAnalyzing}
          className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Clear queue</span>
        </button>
      </div>

      {/* Same-Site Context Banner (if applicable) */}
      {isSingleSite && (
        <div className="px-4 py-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-medium">
            <Building2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              All reports associated with: <strong className="font-bold">{singleSiteName}</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 font-semibold">
            Same-Site Batch
          </span>
        </div>
      )}

      {/* Uploaded Reports Queue Table */}
      <div className="bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#CBD5E1] dark:border-[#263244] bg-[#F8FAFC] dark:bg-[#0D1420] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC]">
              Uploaded Reports Queue
            </h4>
            <span className="px-2 py-0.2 rounded-full bg-slate-200/80 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] text-[10px] font-bold font-mono">
              {files.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">
            Verify site assignments before screening
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#263244] bg-[#F8FAFC]/50 dark:bg-[#0D1420]/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Site Association</th>
                <th className="py-2.5 px-4">Logged Date</th>
                <th className="py-2.5 px-3 text-center">Format</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263244]">
              {files.map((file, idx) => {
                const name = file.name || file.filename || `report-${idx + 1}.pdf`;
                const ext = getFileExtension(name);
                const currentSiteId = file.siteId || (file.site ? file.site.toLowerCase().replace(/\s+/g, '-') : 'rig-site-b');
                const fileDate = file.date || '09 Sep 2026';
                const fileStatus = file.status || 'Ready';

                return (
                  <tr key={`${name}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-[#151E2E] transition-colors">
                    {/* Filename */}
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-[#F8FAFC] max-w-xs truncate">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(name)}
                        <span className="truncate font-semibold text-slate-800 dark:text-[#F8FAFC]" title={name}>
                          {name}
                        </span>
                      </div>
                    </td>

                    {/* Site Association Selector */}
                    <td className="py-3 px-4">
                      <select
                        value={currentSiteId}
                        onChange={(e) => onUpdateFileSite(idx, e.target.value)}
                        disabled={isAnalyzing}
                        className="text-xs bg-white dark:bg-[#0A0F18] border border-[#CBD5E1] dark:border-[#263244] rounded-md px-2.5 py-1 text-slate-800 dark:text-[#F8FAFC] font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:bg-slate-50 dark:disabled:bg-[#111827]"
                        aria-label={`Site for ${name}`}
                      >
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                      {fileDate}
                    </td>

                    {/* Format Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#263244] text-[10px] font-mono font-bold">
                        {ext}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {fileStatus === 'Analyzed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                          Analyzed
                        </span>
                      ) : fileStatus === 'Processing' || fileStatus === 'Analyzing' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold animate-pulse">
                          Processing
                        </span>
                      ) : fileStatus === 'Error' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-bold">
                          Error
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#263244] text-[10px] font-semibold">
                          Ready
                        </span>
                      )}
                    </td>

                    {/* Remove Action */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRemoveFile(idx)}
                        disabled={isAnalyzing}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#172033] disabled:opacity-40 transition-colors cursor-pointer"
                        title="Remove report from queue"
                        aria-label={`Remove ${name}`}
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
