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
  Repeat,
  Check,
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
import Pagination from '../components/ui/Pagination';
import { getSites, addSite } from '../api/sifguardApi';

export default function Sites() {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-site comparison selection (Unlimited sites)
  const [selectedSiteIds, setSelectedSiteIds] = useState([]);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  function handleToggleSite(siteId) {
    if (selectedSiteIds.includes(siteId)) {
      setSelectedSiteIds(selectedSiteIds.filter((id) => id !== siteId));
    } else {
      setSelectedSiteIds([...selectedSiteIds, siteId]);
    }
  }

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

  // Local Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Whenever filters or search change, reset pagination to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [search, healthFilter, typeFilter, statusFilter]);

  // Paginated subset of sites: DATA -> FILTER -> SORT -> PAGINATE -> DISPLAY
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSites.slice(start, start + PAGE_SIZE);
  }, [filteredSites, currentPage, PAGE_SIZE]);

  function handleResetFilters() {
    setSearch('');
    setHealthFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  }

  return (
    <AppShell title="Sites" subtitle="Operational Site Management">
      <PageContainer maxWidth="fluid" className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#D1D5DB] dark:border-[#263244]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Facility Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-none">
              Sites
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1.5 font-normal">
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
        <div className="p-3.5 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs space-y-3">
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
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                >
                  Reset
                </Button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400 dark:text-[#94A3B8]">
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
          <div className="p-8 text-center bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl max-w-md mx-auto shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Unable to load sites</h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{error}</p>
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
            <div className="hidden md:block bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#D1D5DB] dark:border-[#263244] bg-slate-50/80 dark:bg-[#0A0F18] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      <th className="py-3 px-3 w-10 text-center">Compare</th>
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
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263244]">
                    {paginatedSites.map((site) => {
                      const isSelected = selectedSiteIds.includes(site.id);
                      return (
                        <tr
                          key={site.id}
                          onClick={() => navigate(`/sites/${site.id}`)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected ? 'bg-blue-50/40 dark:bg-blue-950/30' : 'hover:bg-slate-50/80 dark:hover:bg-[#172033]'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSite(site.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSite(site.id)}
                              aria-label={`Select ${site.name} for comparison`}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Site Name & Code */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263244] flex items-center justify-center text-slate-600 dark:text-[#CBD5E1] group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                                <Building2 size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                                    {site.name}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#172033] text-slate-600 dark:text-[#CBD5E1] border border-slate-200/80 dark:border-[#263244]">
                                    {site.code || 'SITE'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                                  {site.type || 'Operational Site'} · {site.status || 'Active'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-[#CBD5E1] font-medium">
                            {site.location}
                          </td>

                          {/* Health */}
                          <td className="py-3.5 px-4">
                            <SiteHealthBadge status={site.healthStatus} size="sm" />
                          </td>

                          {/* Reports */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-[#F8FAFC] text-sm">
                            {site.totalReports}
                          </td>

                          {/* High Risk */}
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`font-mono font-bold text-sm ${
                                site.highRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-[#94A3B8]'
                              }`}
                            >
                              {site.highRiskCount}
                            </span>
                          </td>

                          {/* SIF Precursors */}
                          <td className="py-3.5 px-4 text-right">
                            {site.sifCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-mono font-bold text-xs">
                                <ShieldAlert size={12} />
                                {site.sifCount}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 dark:text-[#94A3B8] font-medium">0</span>
                            )}
                          </td>

                          {/* Last Activity */}
                          <td className="py-3.5 px-4 text-slate-500 dark:text-[#94A3B8] font-mono text-xs">
                            {site.lastActivity}
                          </td>

                          {/* Action Chevron */}
                          <td className="py-3.5 px-3 text-right">
                            <ChevronRight
                              size={15}
                              className="text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-[#0A0F18] border-t border-[#D1D5DB] dark:border-[#263244] text-xs text-slate-500 dark:text-[#94A3B8] flex items-center justify-between">
                <span>
                  Showing {filteredSites.length} of {sites.length} operational facilities
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-[#94A3B8]">
                  Oil India Limited Safety Infrastructure
                </span>
              </div>
            </div>

            {/* Mobile Stacked Cards (Visible on screens < 768px) */}
            <div className="md:hidden space-y-3">
              {paginatedSites.map((site) => {
                const isSelected = selectedSiteIds.includes(site.id);
                return (
                  <div
                    key={site.id}
                    onClick={() => navigate(`/sites/${site.id}`)}
                    className={`p-4 bg-white dark:bg-[#111827] border rounded-xl shadow-xs transition-colors cursor-pointer space-y-3 ${
                      isSelected ? 'border-blue-300 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-950/20' : 'border-[#D1D5DB] dark:border-[#263244] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSite(site.id);
                          }}
                          className="pr-1"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSite(site.id)}
                            aria-label={`Select ${site.name} for comparison`}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-[#263244] flex items-center justify-center text-slate-600 dark:text-[#CBD5E1] shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">{site.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#172033] text-slate-600 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#263244]">
                              {site.code || 'SITE'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                            {site.location} · {site.type}
                          </p>
                        </div>
                      </div>
                      <SiteHealthBadge status={site.healthStatus} size="sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#263244] text-xs text-center">
                      <div className="p-1.5 bg-slate-50 dark:bg-[#172033] rounded">
                        <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] block">Reports</span>
                        <strong className="text-slate-900 dark:text-[#F8FAFC] font-mono text-sm">{site.totalReports}</strong>
                      </div>
                      <div className="p-1.5 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block">High Risk</span>
                        <strong className="text-amber-800 dark:text-amber-300 font-mono text-sm">{site.highRiskCount}</strong>
                      </div>
                      <div className="p-1.5 bg-rose-50/50 dark:bg-rose-950/20 rounded">
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 block">SIF</span>
                        <strong className="text-rose-800 dark:text-rose-300 font-mono text-sm">{site.sifCount}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] pt-1">
                      <span className="font-mono">Active: {site.lastActivity}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                        View Profile <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Local Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredSites.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="operational facilities"
            />
          </>
        )}

        {/* Sticky Site Comparison Launch Bar */}
        {selectedSiteIds.length > 0 && (
          <div className="sticky bottom-4 z-20 p-3.5 sm:p-4 bg-slate-900 text-white rounded-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                {selectedSiteIds.length}
              </span>
              <div>
                <span className="text-xs sm:text-sm font-bold block">
                  {selectedSiteIds.length} {selectedSiteIds.length === 1 ? 'site' : 'sites'} selected for comparison
                </span>
                <p className="text-[11px] text-slate-400">
                  {selectedSiteIds.length < 2
                    ? 'Select at least 2 facilities to activate side-by-side comparison.'
                    : 'Ready to evaluate cross-site risk distributions and safety patterns.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSiteIds([])}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Repeat}
                disabled={selectedSiteIds.length < 2}
                onClick={() => navigate(`/sites/compare?sites=${selectedSiteIds.join(',')}`)}
              >
                Compare Selected Sites
              </Button>
            </div>
          </div>
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
