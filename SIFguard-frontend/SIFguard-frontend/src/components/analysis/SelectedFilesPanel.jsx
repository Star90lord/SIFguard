import React from 'react';
import { FileText, FileSpreadsheet, FileCode, Trash2, X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

function getFileIcon(filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    return <FileText size={16} className="text-red-500 shrink-0" />;
  }
  if (ext === 'docx' || ext === 'doc') {
    return <FileText size={16} className="text-blue-500 shrink-0" />;
  }
  return <FileCode size={16} className="text-slate-500 shrink-0" />;
}

export default function SelectedFilesPanel({
  files = [],
  onRemoveFile,
  onClearAll,
  duplicateNames = new Set(),
  className = '',
}) {
  if (!files.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Selected Files
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
            {files.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          <span>Clear all</span>
        </button>
      </div>

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {files.map((file, idx) => {
          const name = file.name || file.filename;
          const size = file.size
            ? typeof file.size === 'number'
              ? `${(file.size / 1024).toFixed(0)} KB`
              : file.size
            : 'Unknown size';

          const isDuplicate = duplicateNames.has(name);

          return (
            <div
              key={`${name}-${idx}`}
              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50/70 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                  {getFileIcon(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={name}>
                      {name}
                    </p>
                    {isDuplicate && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                        <AlertCircle size={10} /> Duplicate
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{size}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Remove file"
                aria-label={`Remove ${name}`}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
