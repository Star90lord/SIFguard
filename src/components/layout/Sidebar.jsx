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
        className={`app-sidebar fixed top-0 left-0 h-screen bg-white text-slate-900 flex flex-col z-50 lg:z-30 border-r border-slate-200 select-none shadow-xs transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: '240px', maxWidth: '240px', minWidth: '240px' }}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-950">SIFguard</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  OIL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Safety Intelligence</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => onCloseMobile && onCloseMobile()}
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
          ))}

          {/* Operational Context Card */}
          <div className="pt-2 border-t border-slate-200">
            <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Scope
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" /> Monitored Sites
                </span>
                <span className="text-slate-900 font-bold">5 Industrial</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Radio size={13} className="text-emerald-600 animate-pulse" /> Telemetry
                </span>
                <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operator Profile Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 shrink-0">
          <Link
            to="/settings?tab=profile"
            onClick={() => onCloseMobile && onCloseMobile()}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
            title="Open Profile Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs group-hover:bg-blue-600 transition-colors">
              {currentUser.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{roleDefinition.label} · OIL</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
