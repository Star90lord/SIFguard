import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { SiteHealthBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import AddSiteModal from '../components/sites/AddSiteModal';
import { getSites, addSite } from '../api/sifguardApi';

export default function Sites() {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadSitesData();
  }, []);

  async function loadSitesData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSites();
      setSites(data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve operational sites directory.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSite(newSiteData) {
    const created = await addSite(newSiteData);
    await loadSitesData();
    return created;
  }

  // Derive unique filter options
  const siteTypes = useMemo(() => {
    const types = new Set(sites.map((s) => s.type).filter(Boolean));
    return Array.from(types);
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (healthFilter !== 'ALL' && site.healthStatus !== healthFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && site.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && site.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = (site.name || '').toLowerCase().includes(q);
        const codeMatch = (site.code || '').toLowerCase().includes(q);
        const locMatch = (site.location || '').toLowerCase().includes(q);
        const typeMatch = (site.type || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || locMatch || typeMatch;
      }
      return true;
    });
  }, [sites, search, healthFilter, typeFilter, statusFilter]);

  function handleResetFilters() {
    setSearch('');
    setHealthFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  }

  return (
    <AppShell title="Sites" subtitle="Operational Site Management">
      <PageContainer className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Facility Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Sites
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Monitor safety intelligence across operational sites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Site
            </Button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="lg:col-span-5">
              <Input
                placeholder="Search sites by name, code, location..."
                prefixIcon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
              />
            </div>

            {/* Health Filter */}
            <div className="lg:col-span-2 sm:col-span-1">
              <Select
                size="sm"
                value={healthFilter}
                onChange={(val) => setHealthFilter(typeof val === 'object' && val?.target ? val.target.value : val)}
                options={[
                  { value: 'ALL', label: 'All Health' },
                  { value: 'Stable', label: 'Stable' },
                  { value: 'Watch', label: 'Watch' },
                  { value: 'Elevated', label: 'Elevated' },
                  { value: 'Critical', label: 'Critical' },
                ]}
              />
            </div>

            {/* Site Type Filter */}
            <div className="lg:col-span-2 sm:col-span-1">
              <Select
                size="sm"
                value={typeFilter}
                onChange={(val) => setTypeFilter(typeof val === 'object' && val?.target ? val.target.value : val)}
                options={[
                  { value: 'ALL', label: 'All Site Types' },
                  ...siteTypes.map((t) => ({ value: t, label: t })),
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2 sm:col-span-1">
              <Select
                size="sm"
                value={statusFilter}
                onChange={(val) => setStatusFilter(typeof val === 'object' && val?.target ? val.target.value : val)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Maintenance', label: 'Maintenance' },
                  { value: 'Standby', label: 'Standby' },
                ]}
              />
            </div>

            {/* Reset Action */}
            <div className="lg:col-span-1 flex justify-end">
              {(search || healthFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Site Table / List */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Unable to load sites</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <Button variant="primary" size="sm" icon={RefreshCw} onClick={loadSitesData}>
              Retry
            </Button>
          </div>
        ) : filteredSites.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No sites found"
            message="Try adjusting your search or filters to locate operational facilities."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            {/* Desktop Table (Visible on md and larger) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 font-semibold">Site</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                      <th className="py-3 px-4 font-semibold">Health</th>
                      <th className="py-3 px-4 font-semibold text-right">Reports</th>
                      <th className="py-3 px-4 font-semibold text-right">High Risk</th>
                      <th className="py-3 px-4 font-semibold text-right">SIF Precursors</th>
                      <th className="py-3 px-4 font-semibold">Last Activity</th>
                      <th className="py-3 px-3 w-8" aria-label="Action"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSites.map((site) => (
                      <tr
                        key={site.id}
                        onClick={() => navigate(`/sites/${site.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Site Name & Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                                  {site.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                                  {site.code || 'SITE'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {site.type || 'Operational Site'} · {site.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {site.location}
                        </td>

                        {/* Health */}
                        <td className="py-3.5 px-4">
                          <SiteHealthBadge status={site.healthStatus} size="sm" />
                        </td>

                        {/* Reports */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 text-sm">
                          {site.totalReports}
                        </td>

                        {/* High Risk */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              site.highRiskCount > 0 ? 'text-orange-600' : 'text-slate-400'
                            }`}
                          >
                            {site.highRiskCount}
                          </span>
                        </td>

                        {/* SIF Precursors */}
                        <td className="py-3.5 px-4 text-right">
                          {site.sifCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-xs">
                              <ShieldAlert size={12} />
                              {site.sifCount}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 font-medium">0</span>
                          )}
                        </td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                          {site.lastActivity}
                        </td>

                        {/* Action Chevron */}
                        <td className="py-3.5 px-3 text-right">
                          <ChevronRight
                            size={15}
                            className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Showing {filteredSites.length} of {sites.length} operational facilities
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Oil India Limited Safety Infrastructure
                </span>
              </div>
            </div>

            {/* Mobile Stacked Cards (Visible on screens < 768px) */}
            <div className="md:hidden space-y-3">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => navigate(`/sites/${site.id}`)}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{site.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {site.code || 'SITE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {site.location} · {site.type}
                        </p>
                      </div>
                    </div>
                    <SiteHealthBadge status={site.healthStatus} size="sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-center">
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 block">Reports</span>
                      <strong className="text-slate-900 font-mono text-sm">{site.totalReports}</strong>
                    </div>
                    <div className="p-1.5 bg-amber-50/50 rounded">
                      <span className="text-[10px] text-amber-700 block">High Risk</span>
                      <strong className="text-amber-800 font-mono text-sm">{site.highRiskCount}</strong>
                    </div>
                    <div className="p-1.5 bg-rose-50/50 rounded">
                      <span className="text-[10px] text-rose-700 block">SIF</span>
                      <strong className="text-rose-800 font-mono text-sm">{site.sifCount}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-mono">Active: {site.lastActivity}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      View Profile <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Site Modal */}
        <AddSiteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddSite={handleAddSite}
        />
      </PageContainer>
    </AppShell>
  );
}
