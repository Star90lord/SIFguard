import React from 'react';
import SiteGroupCard from '../analysis/SiteGroupCard';
import { Building2, SearchX } from 'lucide-react';
import Button from '../ui/Button';

export default function SiteGroupsView({
  reports = [],
  onSelectReport,
  onResetFilters,
  className = '',
}) {
  if (!reports || reports.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <SearchX size={20} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No matching site records found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No safety observations match the current filter criteria across monitored industrial sites.
        </p>
        {onResetFilters && (
          <Button variant="secondary" size="sm" onClick={onResetFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  // Group reports deterministically by site
  const siteMap = new Map();
  reports.forEach((report) => {
    const site = report.site || report.location || 'Unassigned Site';
    if (!siteMap.has(site)) {
      siteMap.set(site, []);
    }
    siteMap.get(site).push(report);
  });

  // Sort sites: Critical first, then by total report count
  const sortedSites = Array.from(siteMap.entries()).sort((a, b) => {
    const reportsA = a[1];
    const reportsB = b[1];
    const sifA = reportsA.filter((r) => r.risk_level === 'SIF-Precursor').length;
    const sifB = reportsB.filter((r) => r.risk_level === 'SIF-Precursor').length;
    if (sifB !== sifA) return sifB - sifA;
    return reportsB.length - reportsA.length;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedSites.map(([siteName, siteReports]) => (
        <SiteGroupCard
          key={siteName}
          siteName={siteName}
          reports={siteReports}
          onSelectReport={onSelectReport}
          defaultExpanded={true}
        />
      ))}
    </div>
  );
}
