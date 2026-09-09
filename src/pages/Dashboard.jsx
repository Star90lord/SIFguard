import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import MetricCard from '../components/dashboard/MetricCard';
import AttentionPanel from '../components/dashboard/AttentionPanel';
import SiteOverviewPanel from '../components/dashboard/SiteOverviewPanel';
import RiskDistribution from '../components/dashboard/RiskDistribution';
import HazardChart from '../components/dashboard/HazardChart';
import LocationChart from '../components/dashboard/LocationChart';
import ActivityChart from '../components/dashboard/ActivityChart';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { getTrends, getSites } from '../api/sifguardApi';

export default function Dashboard() {
  const [trends, setTrends] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [trendData, siteData] = await Promise.all([getTrends(), getSites()]);
      setTrends(trendData);
      setSites(siteData);
    } catch (err) {
      setError(err.message || 'Unable to retrieve safety metrics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Safety Intelligence" subtitle="Telemetry Overview">
        <DashboardSkeleton />
      </AppShell>
    );
  }

  if (error || !trends) {
    return (
      <AppShell title="Safety Intelligence" subtitle="Telemetry Overview">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg mx-auto text-center my-12 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Unable to load safety intelligence
          </h3>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <Button variant="primary" onClick={loadDashboardData} icon={RefreshCw}>
            Retry Connection
          </Button>
        </div>
      </AppShell>
    );
  }

  const totalReports = Object.values(trends.by_risk_level).reduce((a, b) => a + b, 0);
  const sifCount = trends.by_risk_level['SIF-Precursor'] || 0;
  const highCount = trends.by_risk_level['High'] || 0;
  const highPct = Math.round((highCount / totalReports) * 100);

  return (
    <AppShell title="Safety Intelligence" subtitle="Operational Overview">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operational Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Safety Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Monitor safety risks and recurring hazards across analyzed reports and operational sites.
            </p>
          </div>

          {/* Time Scope Filter */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar size={14} className="text-slate-400" />
              <span>Scope:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent font-medium text-slate-900 border-none outline-none cursor-pointer pr-1"
                aria-label="Filter time range"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last quarter</option>
                <option value="ytd">Year to date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Refined KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <MetricCard
            label="Total Reports"
            value={totalReports}
            indicator="All analyzed reports"
            color="default"
          />
          <MetricCard
            label="Low Risk"
            value={trends.by_risk_level.Low}
            indicator={`${Math.round((trends.by_risk_level.Low / totalReports) * 100)}% of total`}
            color="green"
          />
          <MetricCard
            label="Medium Risk"
            value={trends.by_risk_level.Medium}
            indicator={`${Math.round((trends.by_risk_level.Medium / totalReports) * 100)}% of total`}
            color="amber"
          />
          <MetricCard
            label="High Risk"
            value={highCount}
            indicator={`${highPct}% of reports`}
            color="orange"
          />
          <MetricCard
            label="SIF Precursors"
            value={sifCount}
            indicator="Requires attention"
            color="red"
            highlight={sifCount > 0}
          />
        </div>

        {/* Operational Attention Section */}
        {sifCount > 0 && <AttentionPanel sifCount={sifCount} />}

        {/* Site Safety Overview Section */}
        <SiteOverviewPanel sites={sites} />

        {/* Analytical Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RiskDistribution data={trends.by_risk_level} />
          <HazardChart data={trends.top_hazards} />
          <LocationChart data={trends.by_location} />
          <ActivityChart data={trends.by_activity} />
        </div>
      </div>
    </AppShell>
  );
}
