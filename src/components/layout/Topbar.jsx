import React from 'react';
import { Bell, ChevronRight, Menu } from 'lucide-react';

export default function Topbar({ title = 'Dashboard', subtitle, onOpenMobileNav }) {
  const currentDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Context / Breadcrumb + Mobile Menu Toggle */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </span>
        <ChevronRight size={13} className="hidden sm:inline-block text-slate-300" />
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{title}</h2>
        {subtitle && (
          <span className="hidden md:inline-block text-xs text-slate-400 font-normal pl-2 border-l border-slate-200 truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Date scope stamp */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational: 09 Sep 2026</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-slate-900"
          aria-label="Alerts and notifications"
          title="Active SIF Precursor notices"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
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
