import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import Button from '../components/ui/Button';

/**
 * Unauthorized Page (403 — Access Restricted)
 *
 * Professional SIFguard-branded access denied page.
 * Shown when an authenticated user lacks the required permission
 * for a route or page.
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { currentUser, roleDefinition } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080C14] px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-center justify-center">
            <ShieldX size={32} className="text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-[#263244] bg-white dark:bg-[#111827] shadow-sm space-y-5">
          {/* Status Code */}
          <div className="flex items-center justify-center gap-2">
            <Lock size={14} className="text-slate-400 dark:text-[#94A3B8]" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-[#94A3B8] font-mono">
              403 · Access Restricted
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Access Restricted
          </h1>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Your account does not have permission to access this area.
            Contact your HSE Administrator if you believe this is an error.
          </p>

          {/* Current Role Badge */}
          {currentUser && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263244] text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8]">Signed in as</span>
              <span className="font-bold text-slate-800 dark:text-[#CBD5E1]">
                {roleDefinition?.label || currentUser.role}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={ArrowLeft}
              onClick={() => navigate('/dashboard', { replace: true })}
            >
              Return to Dashboard
            </Button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-slate-500 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 dark:text-[#64748B]">
          SIFguard · Safety Intelligence Platform · Oil India Limited
        </p>
      </div>
    </div>
  );
}
