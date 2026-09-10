import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronRight, Menu, Check, AlertOctagon, AlertTriangle, ExternalLink, X, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Topbar({ title = 'Dashboard', subtitle, onOpenMobileNav }) {
  const navigate = useNavigate();
  const { currentUser, roleDefinition, notifications, unreadCount, markAllAsRead, theme, toggleTheme } = useApp();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popoverOpen]);

  return (
    <header className="h-14 bg-white dark:bg-[#111827] border-b border-[#D1D5DB] dark:border-[#263244] px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between sticky top-0 z-20">
      {/* Context / Breadcrumb + Mobile Menu Toggle */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-1.5 -ml-1 text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
          Workspace
        </span>
        <ChevronRight size={13} className="hidden sm:inline-block text-slate-400 dark:text-slate-600" />
        <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">{title}</h2>
        {subtitle && (
          <span className="hidden md:inline-block text-xs text-[#64748B] dark:text-[#94A3B8] font-normal pl-2 border-l border-[#D1D5DB] dark:border-[#263244] truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Date scope stamp */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/70 dark:bg-[#070B12] border border-[#D1D5DB] dark:border-[#263244] rounded-md text-xs font-medium text-[#334155] dark:text-[#CBD5E1]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational: 09 Sep 2026</span>
        </div>

        {/* Theme Mode Toggle (Sun / Moon) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] transition-colors"
          title={theme === 'dark' ? 'Switch to Light Operations Theme' : 'Switch to HSE Operations Command Center Dark Theme'}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-slate-700" />
          )}
        </button>

        {/* Notifications Button & Indicator */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen((prev) => !prev)}
            className={`relative p-2 rounded-lg transition-colors border border-[#D1D5DB] dark:border-[#263244] focus-visible:outline-slate-900 ${
              popoverOpen
                ? 'bg-slate-100 dark:bg-[#172033] text-[#0F172A] dark:text-[#F8FAFC]'
                : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172033]'
            }`}
            aria-label="Alerts and notifications"
            aria-expanded={popoverOpen}
            title={`${unreadCount} unread safety notifications`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold ring-2 ring-white dark:ring-slate-900 leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Compact Notifications Popover */}
          {popoverOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
              <div className="p-3 bg-slate-50 dark:bg-[#111827] border-b border-[#D1D5DB] dark:border-[#263244] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Notifications</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {unreadCount} Unread
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                    aria-label="Close notification popover"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 space-y-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      !n.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />}
                        <span>{n.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{n.location}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{n.timestamp}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setPopoverOpen(false)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <span>Inspect</span>
                          <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Popover Footer */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-center">
                <Link
                  to="/settings?tab=notifications"
                  onClick={() => setPopoverOpen(false)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                >
                  View all notifications in Settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill (Links to Settings Profile) */}
        <Link
          to="/settings?tab=profile"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 hover:opacity-85 transition-opacity group"
          title="Open Profile Settings"
        >
          <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs group-hover:bg-blue-600 transition-colors">
            {currentUser.initials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-none">
              {roleDefinition.badgeText}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
