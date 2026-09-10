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
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    primary: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-medium rounded',
    md: 'px-3 py-1 text-xs font-semibold rounded-md',
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
    className: 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    description: 'Active SIF-precursors; immediate intervention required',
  },
  Elevated: {
    label: 'Elevated',
    dot: 'bg-orange-500',
    className: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    description: 'Elevated risk conditions under heightened supervision',
  },
  Watch: {
    label: 'Watch',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Multiple moderate hazards under active monitoring',
  },
  Stable: {
    label: 'Stable',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
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
          : 'px-2 py-0.5 text-xs gap-1.5'
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

// ─── Report Lifecycle Status Badge ──────────────────────────────────
const REPORT_STATUS_MAP = {
  NEW: {
    label: 'New',
    dot: 'bg-slate-500',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  'UNDER REVIEW': {
    label: 'Under Review',
    dot: 'bg-blue-600',
    className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  'ACTION REQUIRED': {
    label: 'Action Required',
    dot: 'bg-rose-600',
    className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  'IN PROGRESS': {
    label: 'In Progress',
    dot: 'bg-amber-600',
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  'PENDING VERIFICATION': {
    label: 'Pending Verification',
    dot: 'bg-sky-600',
    className: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-teal-600',
    className: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
};

export function ReportStatusBadge({
  status = 'NEW',
  size = 'sm',
  showDot = true,
  className = '',
}) {
  const normKey = (status || 'NEW').toUpperCase().replace(/_/g, ' ');
  const config = REPORT_STATUS_MAP[normKey] || REPORT_STATUS_MAP.NEW;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center border font-semibold rounded-md tracking-normal select-none transition-colors ${
        isLg ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-xs gap-1.5'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Report status: ${config.label}`}
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

// ─── Action Status Badge ────────────────────────────────────────────
const ACTION_STATUS_MAP = {
  OPEN: {
    label: 'Open',
    dot: 'bg-slate-400',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  'ACTION REQUIRED': {
    label: 'Action Required',
    dot: 'bg-rose-600',
    className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  'IN PROGRESS': {
    label: 'In Progress',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  'PENDING VERIFICATION': {
    label: 'Pending Verification',
    dot: 'bg-sky-500',
    className: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-teal-600',
    className: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
};

export function ActionStatusBadge({
  status = 'OPEN',
  size = 'sm',
  showDot = true,
  className = '',
}) {
  const normKey = (status || 'OPEN').toUpperCase().replace(/_/g, ' ');
  const config = ACTION_STATUS_MAP[normKey] || ACTION_STATUS_MAP.OPEN;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center border font-semibold rounded-md tracking-normal select-none transition-colors ${
        isLg ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-xs gap-1.5'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Action status: ${config.label}`}
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

// ─── Action & Task Priority Badge ──────────────────────────────────
const ACTION_PRIORITY_MAP = {
  IMMEDIATE: {
    label: 'Immediate',
    dot: 'bg-rose-600',
    className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-mono font-bold',
  },
  PRIORITY: {
    label: 'Priority',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-mono font-bold',
  },
  STANDARD: {
    label: 'Standard',
    dot: 'bg-slate-400',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-mono font-medium',
  },
};

export function ActionPriorityBadge({
  priority = 'STANDARD',
  size = 'sm',
  showDot = false,
  className = '',
}) {
  const normKey = (priority || 'STANDARD').toUpperCase();
  const config = ACTION_PRIORITY_MAP[normKey] || ACTION_PRIORITY_MAP.STANDARD;
  const isLg = size === 'lg' || size === 'md';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border uppercase rounded-md tracking-wider select-none ${
        isLg ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[11px]'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Task priority: ${config.label}`}
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

export const PriorityBadge = ActionPriorityBadge;

// ─── Overdue Action Detection & Badge ──────────────────────────────
export function isActionOverdue(action) {
  if (!action || !action.dueDate) return false;
  const status = (action.status || '').toUpperCase().replace(/_/g, ' ');
  if (status === 'CLOSED' || status === 'RESOLVED') return false;
  // Parse date string (e.g. YYYY-MM-DD) comparing against start of today or current timestamp
  const due = new Date(action.dueDate).getTime();
  if (isNaN(due)) return false;
  // Use today's midnight or current time: if due date is yesterday or earlier, or past due
  const now = new Date().setHours(0, 0, 0, 0);
  return due < now;
}

export function OverdueBadge({ size = 'sm', className = '' }) {
  const isLg = size === 'lg' || size === 'md';
  return (
    <span
      className={`inline-flex items-center gap-1 border uppercase font-mono font-bold tracking-wider select-none bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-200 border-red-300 dark:border-rose-700/60 rounded ${
        isLg ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'
      } ${className}`}
      role="status"
      aria-label="Overdue action"
      title="Action is past due date and unresolved"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-rose-500 shrink-0" aria-hidden="true" />
      <span>OVERDUE</span>
    </span>
  );
}

