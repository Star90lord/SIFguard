import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  ClipboardList,
  ShieldCheck,
  Building2,
  Radio,
  Palette,
} from 'lucide-react';

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/submit', label: 'Analyze Reports', icon: FileSearch },
  { to: '/reports', label: 'Safety Reports', icon: ClipboardList },
  { to: '/reports?view=by-site', label: 'Site Intelligence', icon: Building2 },
];

const SYSTEM_NAV = [
  { to: '/design-system', label: 'Design System', icon: Palette },
];

export default function Sidebar() {
  return (
    <aside
      className="app-sidebar fixed top-0 left-0 h-screen bg-white text-slate-900 flex flex-col z-30 border-r border-slate-200 select-none shadow-xs"
      style={{ width: '240px', maxWidth: '240px', minWidth: '240px' }}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-950">SIFguard</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">v2.5</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Safety Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        <div>
          <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Intelligence Engine
          </div>
          <nav className="space-y-1">
            {MAIN_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                    )}
                    <Icon
                      size={16}
                      className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Design & Standards
          </div>
          <nav className="space-y-1">
            {SYSTEM_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                    )}
                    <Icon
                      size={16}
                      className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Operational Context Card */}
        <div className="pt-2 border-t border-slate-200">
          <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Facility Scope
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" /> Monitored Sites
              </span>
              <span className="text-slate-900 font-bold">5 Industrial</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Radio size={13} className="text-emerald-600 animate-pulse" /> Live Telemetry
              </span>
              <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Profile Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-800">
            SO
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">Lead Safety Officer</p>
            <p className="text-[11px] text-slate-500 truncate">HSE Operations Division</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
