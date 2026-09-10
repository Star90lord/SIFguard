import React from 'react';

const ACCENT_STYLES = {
  default: {
    accentBar: 'bg-slate-300 dark:bg-slate-700',
    dot: 'bg-slate-400',
    badge: 'text-[#334155] dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#172033]',
  },
  green: {
    accentBar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800',
  },
  amber: {
    accentBar: 'bg-amber-500',
    dot: 'bg-amber-500',
    badge: 'text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800',
  },
  orange: {
    accentBar: 'bg-orange-500',
    dot: 'bg-orange-500',
    badge: 'text-orange-950 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800',
  },
  red: {
    accentBar: 'bg-red-600',
    dot: 'bg-red-600 dark:bg-rose-500',
    badge: 'text-red-950 dark:text-rose-200 bg-red-50 dark:bg-rose-950/40 border-red-200/60 dark:border-rose-800',
  },
};

export default function MetricCard({
  label,
  value,
  indicator,
  color = 'default',
  highlight = false,
  onClick,
  className = '',
}) {
  const style = ACCENT_STYLES[color] || ACCENT_STYLES.default;
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white dark:bg-[#111827] border rounded-xl p-4 sm:p-5 transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
        highlight
          ? 'border-red-300 dark:border-rose-800 shadow-sm'
          : 'border-[#D1D5DB] dark:border-[#263244] shadow-xs hover:border-slate-400 dark:hover:border-slate-600'
      } ${
        isClickable ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm group' : ''
      } ${className}`}
    >
      {/* Top indicator strip */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        {color !== 'default' && (
          <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
        )}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[32px] font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors leading-none">
          {value}
        </span>
      </div>

      {/* Context info badge/indicator */}
      {indicator && (
        <div className="pt-2 border-t border-[#D1D5DB]/60 dark:border-[#263244] flex items-center justify-between text-xs">
          <span className="text-[#64748B] dark:text-[#94A3B8]">{indicator.label}</span>
          {indicator.badge && (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${style.badge}`}
            >
              {indicator.badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
