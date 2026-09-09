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

// ─── Report Lifecycle Status Badge ──────────────────────────────────
const REPORT_STATUS_MAP = {
  NEW: {
    label: 'New',
    dot: 'bg-slate-500',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  'UNDER REVIEW': {
    label: 'Under Review',
    dot: 'bg-blue-600',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  'ACTION REQUIRED': {
    label: 'Action Required',
    dot: 'bg-rose-600',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  'IN PROGRESS': {
    label: 'In Progress',
    dot: 'bg-amber-600',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  'PENDING VERIFICATION': {
    label: 'Pending Verification',
    dot: 'bg-sky-600',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-teal-600',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
        isLg ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1.5'
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
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  'ACTION REQUIRED': {
    label: 'Action Required',
    dot: 'bg-rose-600',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  'IN PROGRESS': {
    label: 'In Progress',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  'PENDING VERIFICATION': {
    label: 'Pending Verification',
    dot: 'bg-sky-500',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-teal-600',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
        isLg ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1.5'
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
    className: 'bg-rose-50 text-rose-800 border-rose-200 font-mono font-bold',
  },
  PRIORITY: {
    label: 'Priority',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-900 border-amber-200 font-mono font-bold',
  },
  STANDARD: {
    label: 'Standard',
    dot: 'bg-slate-400',
    className: 'bg-slate-100 text-slate-700 border-slate-300 font-mono font-medium',
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
        isLg ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]'
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
      className={`inline-flex items-center gap-1 border uppercase font-mono font-bold tracking-wider select-none bg-red-100 text-red-800 border-red-300 rounded ${
        isLg ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      } ${className}`}
      role="status"
      aria-label="Overdue action"
      title="Action is past due date and unresolved"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" aria-hidden="true" />
      <span>OVERDUE</span>
    </span>
  );
}

