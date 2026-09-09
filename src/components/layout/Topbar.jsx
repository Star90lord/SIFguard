import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronRight, Menu, Check, AlertOctagon, AlertTriangle, ExternalLink, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Topbar({ title = 'Dashboard', subtitle, onOpenMobileNav }) {
  const navigate = useNavigate();
  const { currentUser, roleDefinition, notifications, unreadCount, markAllAsRead } = useApp();
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
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">
        {/* Date scope stamp */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational: 09 Sep 2026</span>
        </div>

        {/* Notifications Button & Indicator */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen((prev) => !prev)}
            className={`relative p-2 rounded-lg transition-colors focus-visible:outline-slate-900 ${
              popoverOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            aria-label="Alerts and notifications"
            aria-expanded={popoverOpen}
            title={`${unreadCount} unread safety notifications`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold ring-2 ring-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Compact Notifications Popover */}
          {popoverOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Notifications</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
                    {unreadCount} Unread
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                    aria-label="Close notification popover"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 space-y-1 hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                        <span>{n.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.location}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                      <span>{n.timestamp}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setPopoverOpen(false)}
                          className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
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
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  to="/settings?tab=notifications"
                  onClick={() => setPopoverOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
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
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity group"
          title="Open Profile Settings"
        >
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs group-hover:bg-blue-600 transition-colors">
            {currentUser.initials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-mono text-slate-500 leading-none">
              {roleDefinition.badgeText}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
