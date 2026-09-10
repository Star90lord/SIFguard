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
  if (files.length === 0) return null;

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Batch Summary Bar */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Reports
            </span>
            <span className="text-base font-mono font-bold text-slate-900">
              {files.length}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Sites
            </span>
            <span className="text-base font-mono font-bold text-slate-900">
              {distinctSitesCount}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ready
            </span>
            <span className="text-base font-mono font-bold text-blue-600">
              {readyCount}
            </span>
          </div>

          {errorCount > 0 && (
            <>
              <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">
                  Errors
                </span>
                <span className="text-base font-mono font-bold text-red-600">
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
          className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          <Trash2 size={13} />
          <span>Clear queue</span>
        </button>
      </div>

      {/* Same-Site Context Banner (if applicable) */}
      {isSingleSite && (
        <div className="px-4 py-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-950 font-medium">
            <Building2 size={14} className="text-blue-600 shrink-0" />
            <span>
              All reports associated with: <strong className="font-bold">{singleSiteName}</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 font-semibold">
            Same-Site Batch
          </span>
        </div>
      )}

      {/* Uploaded Reports Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Uploaded Reports Queue
            </h4>
            <span className="px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold font-mono">
              {files.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Verify site assignments before screening
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Site Association</th>
                <th className="py-2.5 px-4">Logged Date</th>
                <th className="py-2.5 px-3 text-center">Format</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file, idx) => {
                const name = file.name || file.filename || `report-${idx + 1}.pdf`;
                const ext = getFileExtension(name);
                const currentSiteId = file.siteId || (file.site ? file.site.toLowerCase().replace(/\s+/g, '-') : 'rig-site-b');
                const fileDate = file.date || '09 Sep 2026';
                const fileStatus = file.status || 'Ready';

                return (
                  <tr key={`${name}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    {/* Filename */}
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(name)}
                        <span className="truncate font-semibold text-slate-800" title={name}>
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
                        className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:bg-slate-50"
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
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {fileDate}
                    </td>

                    {/* Format Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono font-bold">
                        {ext}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {fileStatus === 'Analyzed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Analyzed
                        </span>
                      ) : fileStatus === 'Processing' || fileStatus === 'Analyzing' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold animate-pulse">
                          Processing
                        </span>
                      ) : fileStatus === 'Error' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                          Error
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
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
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
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
