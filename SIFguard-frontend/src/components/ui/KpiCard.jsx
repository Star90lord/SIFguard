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
    default: 'border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] hover:border-slate-400 dark:hover:border-slate-600',
    green: 'border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] hover:border-emerald-300',
    amber: 'border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] hover:border-amber-300',
    orange: 'border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] hover:border-orange-300',
    red: 'border-red-300 dark:border-rose-800/80 bg-white dark:bg-[#111827] hover:border-red-400',
  };

  const pipStyles = {
    default: 'bg-slate-400 dark:bg-slate-500',
    green: 'bg-emerald-600 dark:bg-emerald-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    orange: 'bg-orange-500 dark:bg-orange-400',
    red: 'bg-red-600 dark:bg-rose-500',
  };

  const textValueColors = {
    default: 'text-[#0F172A] dark:text-[#F8FAFC]',
    green: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
    orange: 'text-orange-700 dark:text-orange-400',
    red: 'text-red-700 dark:text-rose-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 shadow-xs ${
        accentStyles[variant] || accentStyles.default
      } ${highlight ? 'ring-1 ring-red-300/80 shadow-xs' : ''} ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
    >
      {/* Label & Indicator Pip */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] truncate">
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
        <span className={`text-2xl sm:text-[28px] font-bold font-mono tracking-tight leading-none ${textValueColors[variant] || textValueColors.default}`}>
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trendDirection === 'up'
                ? 'text-red-600 dark:text-rose-400'
                : trendDirection === 'down'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {trendDirection === 'up' && <TrendingUp size={12} />}
            {trendDirection === 'down' && <TrendingDown size={12} />}
            {trendDirection === 'neutral' && <Minus size={12} />}
            <span>{trend}</span>
          </span>
        )}
      </div>

      {/* Supporting Context Description */}
      {context && (
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-normal truncate">
          {context}
        </p>
      )}
    </div>
  );
}
