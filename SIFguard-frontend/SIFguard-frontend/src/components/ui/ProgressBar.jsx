import React from 'react';

export default function ProgressBar({
  percentage = 0,
  label = '',
  sublabel = '',
  statusText = '',
  variant = 'blue',
  size = 'md',
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, percentage));

  const variantMap = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    red: 'bg-red-600',
  };

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || statusText) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {label && <span className="font-semibold text-slate-900">{label}</span>}
            {sublabel && <span className="text-slate-500">{sublabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            {statusText && <span className="text-slate-500 font-medium">{statusText}</span>}
            <span className="font-mono font-semibold text-slate-700">{clamped}%</span>
          </div>
        </div>
      )}

      <div
        className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightMap[size] || heightMap.md}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Analysis progress'}
      >
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${variantMap[variant] || variantMap.blue}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
