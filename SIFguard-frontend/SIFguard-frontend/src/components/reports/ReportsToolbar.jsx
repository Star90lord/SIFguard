import React from 'react';
import { Search, X, RotateCcw, Layers, Table } from 'lucide-react';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';

export default function ReportsToolbar({
  viewMode = 'by-site',
  onViewModeChange,
  search,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  hazardFilter,
  onHazardFilterChange,
  locationFilter,
  onLocationFilterChange,
  riskOptions = [],
  hazardOptions = [],
  locationOptions = [],
  totalCount = 0,
  filteredCount = 0,
  onResetFilters,
}) {
  const hasActiveFilters = Boolean(
    search || riskFilter || hazardFilter || locationFilter
  );

  const viewTabs = [
    { id: 'by-site', label: 'By Site', icon: Layers },
    { id: 'by-report', label: 'By Report', icon: Table },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Top Row: View Switch + Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tabs
            tabs={viewTabs}
            activeTab={viewMode}
            onChange={onViewModeChange}
            size="sm"
          />

          <div className="hidden sm:block h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search reports, hazards, sites, barrier failures..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
              aria-label="Search reports"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Risk Level"
            options={riskOptions}
            value={riskFilter}
            onChange={onRiskFilterChange}
            placeholder="All"
          />
          <Select
            label="Hazard"
            options={hazardOptions}
            value={hazardFilter}
            onChange={onHazardFilterChange}
            placeholder="All"
          />
          <Select
            label="Location"
            options={locationOptions}
            value={locationFilter}
            onChange={onLocationFilterChange}
            placeholder="All"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              icon={RotateCcw}
              className="text-slate-500 hover:text-slate-900 text-xs py-1.5"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Counter bar */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-900 font-semibold">{filteredCount}</strong> of{' '}
          <strong className="text-slate-900 font-semibold">{totalCount}</strong> verified safety records
        </span>
        {hasActiveFilters && (
          <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Filters Active
          </span>
        )}
      </div>
    </div>
  );
}
