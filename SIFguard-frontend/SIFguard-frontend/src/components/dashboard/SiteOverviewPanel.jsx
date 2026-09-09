import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, ShieldAlert } from 'lucide-react';
import { SiteHealthBadge } from '../ui/Badge';

export default function SiteOverviewPanel({ sites = [], className = '' }) {
  if (!sites.length) return null;

  return (
    <div className={`p-5 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-700" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Site Safety Overview
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational safety posture and risk distribution across active industrial facilities
          </p>
        </div>

        <Link
          to="/reports?view=by-site"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>All Site Records</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Grid of Site Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {sites.map((site) => {
          const siteId = site.id || site.name.toLowerCase().replace(/\s+/g, '-');
          const isCritical = site.healthStatus === 'Critical';

          return (
            <div
              key={site.name}
              className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isCritical
                  ? 'bg-red-50/20 border-red-200/80 hover:border-red-300'
                  : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/90'
              }`}
            >
              <div>
                {/* Site Name & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {site.name}
                    </span>
                  </div>
                  <SiteHealthBadge status={site.healthStatus} size="sm" />
                </div>

                {/* Report count & unique days */}
                <p className="text-xs text-slate-500 mb-3">
                  <strong>{site.totalReports}</strong> reports logged · {site.uniqueDays} active days
                </p>

                {/* Risk count pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-3">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                    {site.riskCounts?.Low || 0} Low
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                    {site.riskCounts?.Medium || 0} Med
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-orange-50 text-orange-900 border border-orange-200/60 font-medium">
                    {site.riskCounts?.High || 0} High
                  </span>
                  {(site.riskCounts?.['SIF-Precursor'] || 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-900 border border-red-200/80 font-bold flex items-center gap-0.5">
                      <ShieldAlert size={10} className="text-red-600" />
                      {site.riskCounts['SIF-Precursor']} SIF
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Latest Incident + Link */}
              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 truncate mr-2">
                  {site.latestReport ? (
                    <span>
                      Latest: <strong>{site.latestReport.date}</strong> · {site.latestReport.hazard}
                    </span>
                  ) : (
                    <span>No recent activity</span>
                  )}
                </div>

                <Link
                  to={`/sites/${siteId}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 flex items-center gap-1 transition-colors"
                >
                  <span>View Site</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
