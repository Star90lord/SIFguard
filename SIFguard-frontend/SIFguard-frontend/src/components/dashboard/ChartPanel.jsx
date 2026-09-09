import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChartPanel({
  title,
  subtitle,
  children,
  actionLink,
  actionLabel = 'View reports',
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300/80 transition-all flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {actionLink && (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight size={13} />
          </Link>
        )}
      </div>

      {/* Body / Chart area */}
      <div className="w-full flex-1 min-h-[220px]">
        {children}
      </div>
    </div>
  );
}

export function ChartTooltip({ active, payload, label, unit = 'reports' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 pointer-events-none">
      <p className="font-semibold text-slate-200 mb-0.5">{label || payload[0]?.name}</p>
      <p className="text-slate-400 font-mono">
        <span className="text-white font-bold text-sm">{payload[0]?.value}</span> {unit}
      </p>
    </div>
  );
}
