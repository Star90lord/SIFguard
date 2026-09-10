import React from 'react';
import RiskBadge from './RiskBadge';

export { RiskBadge };

// ─── General Semantic / Status Badge ────────────────────────────────
export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-red-50 text-red-900 border-red-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium rounded',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center border select-none ${sizeStyles[size] || sizeStyles.sm} ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

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

export function SiteHealthBadge({
  status = 'Stable',
  size = 'sm',
  showDot = true,
  className = '',
}) {
  const config = SITE_HEALTH_MAP[status] || SITE_HEALTH_MAP.Stable;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center border font-semibold rounded-md tracking-normal select-none transition-colors ${
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
