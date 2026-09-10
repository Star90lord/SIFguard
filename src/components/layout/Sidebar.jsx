import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  ClipboardCheck,
  ClipboardList,
  ShieldCheck,
  Building2,
  Settings,
  Radio,
  X,
  UserCheck,
  Repeat,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canAccessAdmin } from '../../config/roles';

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { currentUser, roleDefinition } = useApp();

  // Dynamically configure navigation sections based on user role
  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'HSE Workflow',
      items: [
        { to: '/review', label: 'Review Queue', icon: ClipboardCheck },
        { to: '/reports', label: 'Safety Reports', icon: ClipboardList },
      ],
    },
    {
      title: 'Intelligence & Analysis',
      items: [
        { to: '/submit', label: 'Analyze Reports', icon: FileSearch },
        { to: '/sites/compare', label: 'Site Comparison', icon: Repeat },
      ],
    },
    {
      title: 'Facilities',
      items: [
        { to: '/sites', label: 'Sites Directory', icon: Building2 },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/settings', label: 'Settings', icon: Settings },
        ...(canAccessAdmin(currentUser)
          ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }]
          : []),
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/45 z-40 lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar fixed top-0 left-0 h-screen bg-white dark:bg-[#0A0F18] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col z-50 lg:z-30 border-r border-[#D1D5DB] dark:border-[#263244] select-none shadow-xs transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: '240px', maxWidth: '240px', minWidth: '240px' }}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#0A0F18] shrink-0">
          <Link
            to="/dashboard"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            aria-label="Go to Dashboard"
            className="flex items-center gap-3 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors group focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center shrink-0 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:bg-blue-100/70 dark:group-hover:bg-blue-900/50 transition-colors">
              <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">SIFguard</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-1 py-0.2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded">
                  OIL
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Safety Intelligence</p>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-2.5 mb-1.5 text-[13px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-150 relative ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-2xs font-semibold'
                          : 'text-[#334155] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100/70 dark:hover:bg-[#111827]/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                        )}
                        <Icon
                          size={16}
                          className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}

          {/* Operational Context Card */}
          <div className="pt-2 border-t border-[#D1D5DB] dark:border-[#263244]">
            <div className="px-2.5 mb-1.5 text-[13px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Active Scope
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-slate-100/70 dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400 dark:text-slate-500" /> Monitored Sites
                </span>
                <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">5 Industrial</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Radio size={13} className="text-emerald-600 dark:text-emerald-400 animate-pulse" /> Telemetry
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operator Profile Footer */}
        <div className="p-3 border-t border-[#D1D5DB] dark:border-[#263244] bg-slate-50/60 dark:bg-[#0A0F18] shrink-0">
          <Link
            to="/settings?tab=profile"
            onClick={() => onCloseMobile && onCloseMobile()}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors group"
            title="Open Profile Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-[#172033] border border-slate-700 dark:border-[#263244] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs group-hover:bg-blue-600 transition-colors">
              {currentUser.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">{currentUser.name}</p>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] truncate">{roleDefinition.label} · OIL</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
