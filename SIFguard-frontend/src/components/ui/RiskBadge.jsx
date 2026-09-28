import React from 'react';

const RISK_CONFIG = {
  Low: {
    label: 'LOW',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50/80 text-emerald-900 border-emerald-300/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    description: 'Standard operational risk; routine controls in place',
  },
  Medium: {
    label: 'MEDIUM',
    dot: 'bg-amber-500',
    className: 'bg-amber-50/80 text-amber-900 border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    description: 'Moderate hazard requiring supervisory awareness',
  },
  High: {
    label: 'HIGH',
    dot: 'bg-orange-500',
    className: 'bg-orange-50/80 text-orange-950 border-orange-300/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/80',
    description: 'Elevated risk requiring active verification and control',
  },
  'SIF-Precursor': {
    label: 'SIF-PRECURSOR',
    dot: 'bg-red-600 dark:bg-rose-500',
    className: 'bg-red-50 text-red-950 border-red-300 font-bold dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-700',
    description: 'Potential Serious Injury or Fatality precursor; immediate review required',
  },
};

export default function RiskBadge({
  level = 'Low',
  size = 'sm',
  showDot = true,
  className = '',
}) {
  const normalizedKey =
    level === 'SIF' || level === 'SIF-Precursor' || level === 'SIF Precursor' || level === 'sif'
      ? 'SIF-Precursor'
      : level === 'High' || level === 'high'
      ? 'High'
      : level === 'Medium' || level === 'medium' || level === 'Med'
      ? 'Medium'
      : 'Low';

  const config = RISK_CONFIG[normalizedKey] || RISK_CONFIG.Low;
  const isLg = size === 'lg';
  const isMd = size === 'md';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase border transition-colors select-none rounded-md ${
        isLg
          ? 'px-3 py-1 text-xs gap-1.5'
          : isMd
          ? 'px-2.5 py-0.5 text-xs gap-1.5'
          : 'px-2 py-0.5 text-[11px] gap-1.5'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
      title={config.description}
    >
      {showDot && (
        <span
          className={`w-2 h-2 rounded-full ${config.dot} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
