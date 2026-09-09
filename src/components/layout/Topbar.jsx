import React from 'react';
import { Bell, ShieldAlert, ChevronRight } from 'lucide-react';

export default function Topbar({ title = 'Dashboard', subtitle }) {
  const currentDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Context / Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</span>
        <ChevronRight size={13} className="text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {subtitle && (
          <span className="hidden md:inline-block text-xs text-slate-400 font-normal pl-2 border-l border-slate-200">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Date scope stamp */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational Period: {currentDate}</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-slate-900"
          aria-label="Alerts and notifications"
          title="3 SIF Precursor notices"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            SO
          </div>
          <span className="hidden lg:inline-block text-xs font-medium text-slate-700">
            HSE Operations
          </span>
        </div>
      </div>
    </header>
  );
}
