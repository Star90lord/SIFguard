import React from 'react';

const RISK_MAP = {
  Low: {
    label: 'LOW',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    meaning: 'Standard operational risk',
  },
  Medium: {
    label: 'MEDIUM',
    dot: 'bg-amber-600',
    className: 'bg-amber-50 text-amber-900 border-amber-200',
    meaning: 'Moderate hazard requiring standard controls',
  },
  High: {
    label: 'HIGH',
    dot: 'bg-orange-600',
    className: 'bg-orange-50 text-orange-950 border-orange-200',
    meaning: 'Elevated safety risk requiring verification',
  },
  'SIF-Precursor': {
    label: 'SIF-PRECURSOR',
    dot: 'bg-red-600',
    className: 'bg-red-50 text-red-950 border-red-200',
    meaning: 'Potential Serious Injury or Fatality precursor',
  },
};

export default function Badge({ level = 'Low', size = 'sm', showDot = true, className = '' }) {
  const config = RISK_MAP[level] || RISK_MAP.Low;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center border font-semibold rounded-md tracking-wider transition-colors ${
        isLg
          ? 'px-2.5 py-1 text-xs gap-1.5'
          : 'px-2 py-0.5 text-[11px] gap-1.5'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
      title={config.meaning}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}

export { Badge as RiskBadge };

// ─── Site Health Status Badge ───────────────────────────────────────
const SITE_HEALTH_MAP = {
  Critical: {
    label: 'Critical',
    dot: 'bg-red-600',
    className: 'bg-red-50 text-red-800 border-red-200',
    description: 'Active SIF-precursors; immediate intervention required',
  },
  Elevated: {
    label: 'Elevated',
    dot: 'bg-orange-500',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
    description: 'Elevated risk conditions under heightened supervision',
  },
  Watch: {
    label: 'Watch',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Multiple moderate hazards under active monitoring',
  },
  Stable: {
    label: 'Stable',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Operations within standard safety limits',
  },
};

export function SiteHealthBadge({ status = 'Stable', size = 'sm', showDot = true, className = '' }) {
  const config = SITE_HEALTH_MAP[status] || SITE_HEALTH_MAP.Stable;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center border font-semibold rounded-md tracking-normal transition-colors ${
        isLg
          ? 'px-2.5 py-1 text-xs gap-1.5'
          : 'px-2 py-0.5 text-[11px] gap-1.5'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Site status: ${config.label}`}
      title={config.description}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
