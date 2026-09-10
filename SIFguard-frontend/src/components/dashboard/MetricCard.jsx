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
}) {
  const style = ACCENT_STYLES[color] || ACCENT_STYLES.default;

  return (
    <div
      className={`bg-white border rounded-xl p-4 sm:p-5 transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
        highlight
          ? 'border-red-200 shadow-xs ring-1 ring-red-500/10'
          : 'border-slate-200 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Top indicator strip */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {color !== 'default' && (
          <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
        )}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
      </div>

      {/* Subtext / Context */}
      {indicator && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {indicator}
          </span>
        </div>
      )}
    </div>
  );
}
