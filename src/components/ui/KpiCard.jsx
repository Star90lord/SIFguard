import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export default function KpiCard({
  label,
  value,
  context,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  variant = 'default', // 'default' | 'green' | 'amber' | 'orange' | 'red'
  highlight = false,
  className = '',
  onClick,
}) {
  const accentStyles = {
    default: 'border-slate-300 bg-white hover:border-slate-400',
    green: 'border-slate-300 bg-white hover:border-emerald-300',
    amber: 'border-slate-300 bg-white hover:border-amber-300',
    orange: 'border-slate-300 bg-white hover:border-orange-300',
    red: 'border-red-300 bg-red-50/20 hover:border-red-400',
  };

  const pipStyles = {
    default: 'bg-slate-400',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    red: 'bg-red-600',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-4.5 rounded-xl border transition-all duration-150 shadow-sm ${
        accentStyles[variant] || accentStyles.default
      } ${highlight ? 'ring-1 ring-red-300/80 shadow-sm' : ''} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${className}`}
    >
      {/* Label & Indicator Pip */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
          {label}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${pipStyles[variant] || pipStyles.default} shrink-0 ${
            highlight ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Value (24–32px) */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-[28px] font-bold font-mono tracking-tight text-[#0F172A] leading-none">
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trendDirection === 'up'
                ? variant === 'red' || variant === 'orange'
                  ? 'text-red-700'
                  : 'text-emerald-700'
                : trendDirection === 'down'
                ? 'text-slate-600'
                : 'text-slate-500'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp size={12} />
            ) : trendDirection === 'down' ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            <span>{trend}</span>
          </span>
        )}
      </div>

      {/* Context string */}
      {context && (
        <p className="text-[12px] text-slate-500 font-normal mt-2 truncate flex items-center gap-1">
          {highlight && <AlertTriangle size={12} className="text-red-600 shrink-0" />}
          <span>{context}</span>
        </p>
      )}
    </div>
  );
}
