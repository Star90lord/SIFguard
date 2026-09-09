import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to complete request',
  description = 'An error occurred while communicating with the data service. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <div
        className={`p-3.5 rounded-lg bg-red-50/80 border border-red-200 text-xs text-red-950 flex items-center justify-between gap-3 ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-600 shrink-0" />
          <span className="font-medium">{description}</span>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-8 sm:p-10 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5 max-w-md mx-auto ${className}`}
      role="alert"
    >
      <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-2xs">
        <AlertTriangle size={20} />
      </div>

      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
