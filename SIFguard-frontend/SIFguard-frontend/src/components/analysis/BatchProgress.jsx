import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

export default function BatchProgress({
  progress = {
    current: 0,
    total: 0,
    currentFile: null,
    status: 'idle',
    completedFiles: [],
    failedFiles: [],
    percentage: 0,
  },
  files = [],
  onRetryFailed,
  className = '',
}) {
  const { current, total, currentFile, status, completedFiles = [], failedFiles = [], percentage } =
    progress;

  const isCompleted = status === 'completed';
  const hasFailures = failedFiles.length > 0;

  return (
    <div className={`p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isCompleted
              ? hasFailures
                ? 'Batch Analysis Completed with Warnings'
                : 'Batch Analysis Complete'
              : 'Analyzing Safety Reports'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompleted
              ? `${completedFiles.length} of ${total} reports successfully structured`
              : `${current} of ${total} reports processed`}
          </p>
        </div>

        {isCompleted && hasFailures && onRetryFailed && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetryFailed}
            icon={RefreshCw}
          >
            Retry Failed ({failedFiles.length})
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar
        percentage={percentage}
        variant={hasFailures && isCompleted ? 'amber' : 'blue'}
        size="md"
        statusText={isCompleted ? 'Complete' : 'Processing...'}
      />

      {/* Summary strip if failed */}
      {isCompleted && hasFailures && (
        <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>
              <strong>{completedFiles.length}</strong> reports analyzed,{' '}
              <strong>{failedFiles.length}</strong> {failedFiles.length === 1 ? 'file' : 'files'} could not be read.
            </span>
          </div>
          <span className="font-semibold text-amber-800">Requires Review</span>
        </div>
      )}

      {/* Per-file checklist */}
      <div className="pt-2 border-t border-slate-100 space-y-2 max-h-56 overflow-y-auto pr-1">
        {files.map((file, idx) => {
          const name = file.name || file.filename;
          const isDone = completedFiles.includes(name);
          const isFailed = failedFiles.some((f) => f.filename === name);
          const isCurrent = currentFile === name && !isDone && !isFailed;

          return (
            <div
              key={`${name}-${idx}`}
              className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                isCurrent
                  ? 'bg-blue-50/80 text-blue-900 font-medium'
                  : isFailed
                  ? 'bg-red-50 text-red-900'
                  : isDone
                  ? 'text-slate-700'
                  : 'text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {isDone ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : isFailed ? (
                  <AlertTriangle size={14} className="text-red-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={14} className="text-blue-600 animate-spin shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-300 shrink-0" />
                )}
                <span className="truncate" title={name}>
                  {name}
                </span>
              </div>

              <span className="text-[11px] font-mono shrink-0 ml-2">
                {isDone ? (
                  <span className="text-emerald-700 font-medium">Ready</span>
                ) : isFailed ? (
                  <span className="text-red-600 font-semibold">Error</span>
                ) : isCurrent ? (
                  <span className="text-blue-600 font-medium animate-pulse">Analyzing...</span>
                ) : (
                  <span className="text-slate-400">Queued</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
