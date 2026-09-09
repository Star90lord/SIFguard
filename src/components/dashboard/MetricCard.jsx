import React from 'react';

const ACCENT_STYLES = {
  default: {
    accentBar: 'bg-slate-300',
    dot: 'bg-slate-400',
    badge: 'text-slate-600 bg-slate-100',
  },
  green: {
    accentBar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
  },
  amber: {
    accentBar: 'bg-amber-500',
    dot: 'bg-amber-500',
    badge: 'text-amber-800 bg-amber-50 border-amber-200/60',
  },
  orange: {
    accentBar: 'bg-orange-500',
    dot: 'bg-orange-500',
    badge: 'text-orange-900 bg-orange-50 border-orange-200/60',
  },
  red: {
    accentBar: 'bg-red-600',
    dot: 'bg-red-600',
    badge: 'text-red-700 bg-red-50 border-red-200/60',
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
      className={`bg-white border rounded-xl p-4 sm:p-5 transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
        highlight
          ? 'border-red-300 shadow-sm ring-1 ring-red-500/15'
          : 'border-slate-300 shadow-sm hover:border-slate-400'
      } ${
        isClickable ? 'cursor-pointer hover:border-blue-300 hover:shadow-md group' : ''
      } ${className}`}
    >
      {/* Top indicator strip */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] group-hover:text-blue-700 transition-colors">
          {label}
        </span>
        {color !== 'default' && (
          <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
        )}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold tracking-tight text-[#0F172A] group-hover:text-blue-900 transition-colors">
          {value}
        </span>
      </div>

      {/* Subtext / Context */}
      {indicator && (
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-[#475569] font-medium">
            {indicator}
          </span>
          {isClickable && (
            <span className="text-[11px] text-blue-600 font-semibold group-hover:underline">
              View &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
