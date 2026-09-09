import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSearch, RefreshCw } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import ReportsToolbar from '../components/reports/ReportsToolbar';
import ReportsTable from '../components/reports/ReportsTable';
import SiteGroupsView from '../components/reports/SiteGroupsView';
import ReportDetailDrawer from '../components/reports/ReportDetailDrawer';
import { TableSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { getReports } from '../api/sifguardApi';

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View switch: Default to 'by-site' per SIFguard intelligence standard
  const initialView = searchParams.get('view') === 'by-report' ? 'by-report' : 'by-site';
  const [viewMode, setViewMode] = useState(initialView);

  // Filters
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || '');
  const [hazardFilter, setHazardFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Sync riskFilter if query param changes
  useEffect(() => {
    const riskParam = searchParams.get('risk');
    if (riskParam) {
      setRiskFilter(riskParam);
    }
    const viewParam = searchParams.get('view');
    if (viewParam && (viewParam === 'by-site' || viewParam === 'by-report')) {
      setViewMode(viewParam);
    }
  }, [searchParams]);

  function handleViewModeChange(newView) {
    setViewMode(newView);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', newView);
      return next;
    });
  }

  // Selected report for drawer
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  async function loadReportsData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve report history.');
    } finally {
      setLoading(false);
    }
  }

  // Derive unique filter options
  const riskLevels = useMemo(
    () => [...new Set(reports.map((r) => r.risk_level))].filter(Boolean),
    [reports]
  );
  const hazards = useMemo(
    () => [...new Set(reports.map((r) => r.hazard))].filter(Boolean),
    [reports]
  );
  const locations = useMemo(
    () => [...new Set(reports.map((r) => r.site || r.location))].filter(Boolean),
    [reports]
  );

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (riskFilter && r.risk_level !== riskFilter) return false;
      if (hazardFilter && r.hazard !== hazardFilter) return false;
      if (locationFilter && (r.site !== locationFilter && r.location !== locationFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const textMatch = (r.text_snippet || '').toLowerCase().includes(q);
        const fullTextMatch = (r.full_text || r.report_text || '').toLowerCase().includes(q);
        const hazardMatch = (r.hazard || '').toLowerCase().includes(q);
        const siteMatch = (r.site || r.location || '').toLowerCase().includes(q);
        const activityMatch = (r.activity || '').toLowerCase().includes(q);
        const barrierMatch = (r.barrier_failure || '').toLowerCase().includes(q);
        return textMatch || fullTextMatch || hazardMatch || siteMatch || activityMatch || barrierMatch;
      }
      return true;
    });
  }, [reports, search, riskFilter, hazardFilter, locationFilter]);

  function handleResetFilters() {
    setSearch('');
    setRiskFilter('');
    setHazardFilter('');
    setLocationFilter('');
  }

  return (
    <AppShell title="Safety Reports" subtitle="Incident Archive">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operational Log Database
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Safety Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Review analyzed safety observations organized by site, date, and risk severity.
            </p>
          </div>

          <div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/submit')}
              icon={FileSearch}
            >
              Analyze New Batch
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          /* Error State */
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto text-center my-12 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Unable to load reports
            </h3>
            <p className="text-sm text-slate-500 mb-5">{error}</p>
            <Button variant="primary" onClick={loadReportsData} icon={RefreshCw}>
              Retry
            </Button>
          </div>
        ) : reports.length === 0 ? (
          /* Global Empty State */
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3.5">
              <FileSearch size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No safety reports yet
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Analyze your first report or upload a batch to build your safety intelligence history.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/submit')}
              icon={FileSearch}
            >
              Analyze Batch
            </Button>
          </div>
        ) : (
          /* Active Content */
          <div className="space-y-4">
            {/* Toolbar */}
            <ReportsToolbar
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              search={search}
              onSearchChange={setSearch}
              riskFilter={riskFilter}
              onRiskFilterChange={setRiskFilter}
              hazardFilter={hazardFilter}
              onHazardFilterChange={setHazardFilter}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
              riskOptions={riskLevels}
              hazardOptions={hazards}
              locationOptions={locations}
              totalCount={reports.length}
              filteredCount={filteredReports.length}
              onResetFilters={handleResetFilters}
            />

            {/* Empty Filter State or View Mode Component */}
            {filteredReports.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  No reports match your filters
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Try adjusting your search criteria, hazard type, or location filters.
                </p>
                <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === 'by-site' ? (
              /* By Site View (Grouped with Timelines) */
              <SiteGroupsView
                reports={filteredReports}
                onSelectReport={setSelectedReport}
                onResetFilters={handleResetFilters}
              />
            ) : (
              /* By Report View (Tabular) */
              <ReportsTable
                reports={filteredReports}
                onViewReport={setSelectedReport}
              />
            )}
          </div>
        )}

        {/* Detail Slide-over Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          allReports={reports}
          onClose={() => setSelectedReport(null)}
          onSelectReport={setSelectedReport}
        />
      </div>
    </AppShell>
  );
}
