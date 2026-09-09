import React from 'react';

export default function AnalysisField({ label, value, icon: Icon }) {
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        {Icon && <Icon size={13} className="text-slate-400" />}
        <span>{label}</span>
      </div>
      <p className="text-sm sm:text-[15px] font-semibold text-slate-900 leading-snug">
        {value || '—'}
      </p>
    </div>
  );
}
