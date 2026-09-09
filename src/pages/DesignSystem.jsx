import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Search,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Flame,
  AlertOctagon,
  Inbox,
  Clock,
  Palette,
  Eye,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import Badge, { RiskBadge, SiteHealthBadge } from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { KpiSkeleton, TableSkeleton, ChartSkeleton, CardSkeleton } from '../components/ui/Skeleton';

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState('foundations');

  // Interactive component state demos
  const [btnLoading, setBtnLoading] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testErrorInput, setTestErrorInput] = useState('Invalid value');
  const [testSelect, setTestSelect] = useState('Rig Site A');
  const [testTextarea, setTestTextarea] = useState(
    'Employee was performing maintenance on scaffold at 10m height without lifeline tether.'
  );

  const tabs = [
    { id: 'foundations', label: 'Foundations' },
    { id: 'components', label: 'Components' },
    { id: 'states', label: 'States' },
    { id: 'responsive', label: 'Responsive' },
  ];

  return (
    <AppShell title="Design System" subtitle="SIFguard UI Kit & Standards">
      <PageContainer maxWidth="7xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                OIL HSE · Design System v2.5
              </span>
            </div>
            <h1 className="text-2xl sm:text-[30px] font-bold text-slate-900 tracking-tight leading-none">
              SIFguard Design System
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Industrial safety intelligence UI kit: production-ready foundations and reusable components for clear, credible risk decisions.
            </p>
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="md" />
        </div>

        {/* ── 1. FOUNDATIONS ────────────────────────────────────────────── */}
        {activeTab === 'foundations' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Color System */}
            <Card
              title="1. Semantic Color System"
              subtitle="Restrained industrial palette. Backgrounds and chrome are neutral; vibrant semantic colors are strictly reserved for safety risk classification."
            >
              <div className="space-y-6">
                {/* Brand & Neutral Roles */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Brand & Neutral Chrome
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#2563eb] text-white">
                      <span className="text-[10px] font-mono opacity-80">Primary Action</span>
                      <p className="text-xs font-bold mt-1">#2563EB</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#1d4ed8] text-white">
                      <span className="text-[10px] font-mono opacity-80">Primary Dark</span>
                      <p className="text-xs font-bold mt-1">#1D4ED8</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#eff6ff] text-blue-900">
                      <span className="text-[10px] font-mono text-blue-600">Primary Light</span>
                      <p className="text-xs font-bold mt-1">#EFF6FF</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#f8fafc] text-slate-800">
                      <span className="text-[10px] font-mono text-slate-500">App Background</span>
                      <p className="text-xs font-bold mt-1">#F8FAFC</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#ffffff] text-slate-900 shadow-2xs">
                      <span className="text-[10px] font-mono text-slate-400">Surface White</span>
                      <p className="text-xs font-bold mt-1">#FFFFFF</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-[#e2e8f0] text-slate-800">
                      <span className="text-[10px] font-mono text-slate-500">Subtle Border</span>
                      <p className="text-xs font-bold mt-1">#E2E8F0</p>
                    </div>
                  </div>
                </div>

                {/* Safety Severity Colors */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Safety Risk Severity Tokens (Semantic Only)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border border-emerald-300 bg-[#f0fdf4] text-emerald-950">
                      <span className="text-[10px] font-mono uppercase font-semibold text-emerald-700">LOW Severity</span>
                      <p className="text-xs font-bold mt-1">#16A34A</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">Routine operational control</p>
                    </div>

                    <div className="p-3 rounded-lg border border-amber-300 bg-[#fffbeb] text-amber-950">
                      <span className="text-[10px] font-mono uppercase font-semibold text-amber-700">MEDIUM Severity</span>
                      <p className="text-xs font-bold mt-1">#D97706</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">Moderate hazard monitoring</p>
                    </div>

                    <div className="p-3 rounded-lg border border-orange-300 bg-[#fff7ed] text-orange-950">
                      <span className="text-[10px] font-mono uppercase font-semibold text-orange-700">HIGH Severity</span>
                      <p className="text-xs font-bold mt-1">#EA580C</p>
                      <p className="text-[11px] text-orange-800 mt-0.5">Elevated risk verification</p>
                    </div>

                    <div className="p-3 rounded-lg border border-red-300 bg-[#fef2f2] text-red-950 shadow-2xs">
                      <span className="text-[10px] font-mono uppercase font-semibold text-red-700">SIF-PRECURSOR</span>
                      <p className="text-xs font-bold mt-1">#DC2626</p>
                      <p className="text-[11px] text-red-800 mt-0.5">Life-threatening precursor</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Typography Hierarchy */}
            <Card
              title="2. Typography Hierarchy (Inter)"
              subtitle="Disciplined scale calibrated for high data density and comfortable readability across desktop and mobile screens."
            >
              <div className="divide-y divide-slate-100 text-slate-800">
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Page Title (28–32px)</span>
                  <span className="text-2xl sm:text-[30px] font-bold text-slate-900 tracking-tight">
                    Safety Intelligence Overview
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Section Heading (18–22px)</span>
                  <span className="text-lg sm:text-[20px] font-bold text-slate-900 tracking-tight">
                    Longitudinal Facility Timeline
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Card Heading (14–16px)</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    Recurring Hazards at Rig Site A
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Body Text (14px)</span>
                  <span className="text-sm text-slate-700 leading-relaxed max-w-xl">
                    Confined space entry performed inside Mud Tank 3 without atmospheric testing calibration logs or standby rescue attendant at portal.
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Secondary (12–13px)</span>
                  <span className="text-xs text-slate-500">
                    Verified industrial safety report logged on September 09, 2026.
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400 w-44">Metadata / Eyebrow (11–12px)</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    OPERATIONAL TELEMETRY · OIL HSE
                  </span>
                </div>
              </div>
            </Card>

            {/* Spacing, Shape & Depth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                title="3. 8px Spacing Rhythm"
                subtitle="Consistent spatial increments prevent visual clutter."
              >
                <div className="space-y-2 text-xs font-mono text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">4px</span>
                    <div className="h-4 w-1 bg-blue-600 rounded" />
                    <span>Micro gaps, badge padding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">8px</span>
                    <div className="h-4 w-2 bg-blue-600 rounded" />
                    <span>Element gaps, icon spacing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">12px</span>
                    <div className="h-4 w-3 bg-blue-600 rounded" />
                    <span>Card inner padding, input gaps</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">16px</span>
                    <div className="h-4 w-4 bg-blue-600 rounded" />
                    <span>Card padding, standard grid gap</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">24px</span>
                    <div className="h-4 w-6 bg-blue-600 rounded" />
                    <span>Section spacing, header margins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-slate-400">32px</span>
                    <div className="h-4 w-8 bg-blue-600 rounded" />
                    <span>Major page section separators</span>
                  </div>
                </div>
              </Card>

              <Card
                title="4. Shape, Borders & Depth"
                subtitle="Calm, restrained surfaces without floating glowing boxes or excessive rounding."
              >
                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span>Small controls (Buttons, Inputs)</span>
                    <span className="font-mono font-bold text-slate-800">6–8px radius</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span>Cards & Panels</span>
                    <span className="font-mono font-bold text-slate-800">10–12px radius</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span>Large Shell Containers / Modals</span>
                    <span className="font-mono font-bold text-slate-800">12–14px radius</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-between">
                    <span>Risk & Status Badges</span>
                    <span className="font-mono font-bold text-slate-800">Pill (full)</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── 2. COMPONENTS ─────────────────────────────────────────────── */}
        {activeTab === 'components' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Button System */}
            <Card
              title="Button System"
              subtitle="Semantic variants with consistent heights (32px sm, 36px md, 40px lg), focus rings, and loading states."
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button
                    variant="primary"
                    loading={btnLoading}
                    onClick={() => {
                      setBtnLoading(true);
                      setTimeout(() => setBtnLoading(false), 1500);
                    }}
                  >
                    Interactive Loading
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled Button
                  </Button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 mr-2">Sizes:</span>
                  <Button variant="secondary" size="sm">
                    Small (32px)
                  </Button>
                  <Button variant="secondary" size="md">
                    Medium (36px)
                  </Button>
                  <Button variant="secondary" size="lg">
                    Large (40px)
                  </Button>
                </div>
              </div>
            </Card>

            {/* Risk Badges */}
            <Card
              title="Risk Badges"
              subtitle="Multi-channel severity cues: semantic text, distinct icon, and high-contrast treatment readable even without color."
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <RiskBadge level="Low" size="lg" />
                  <RiskBadge level="Medium" size="lg" />
                  <RiskBadge level="High" size="lg" />
                  <RiskBadge level="SIF-Precursor" size="lg" />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 mr-2">Small / Compact:</span>
                  <RiskBadge level="Low" size="sm" />
                  <RiskBadge level="Medium" size="sm" />
                  <RiskBadge level="High" size="sm" />
                  <RiskBadge level="SIF-Precursor" size="sm" />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 mr-2">Facility Health:</span>
                  <SiteHealthBadge status="Stable" size="md" />
                  <SiteHealthBadge status="Watch" size="md" />
                  <SiteHealthBadge status="Elevated" size="md" />
                  <SiteHealthBadge status="Critical" size="md" />
                </div>
              </div>
            </Card>

            {/* Inputs, Select, Textarea */}
            <Card
              title="Form Controls System"
              subtitle="Default, focused, disabled, and error states with clear labels and helper messaging."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Search Observations"
                  icon={Search}
                  placeholder="Filter by keyword, hazard..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  helperText="Search supports full narrative matching."
                />

                <Input
                  label="Error Validation State"
                  value={testErrorInput}
                  onChange={(e) => setTestErrorInput(e.target.value)}
                  error="Incident permit number is required."
                />

                <Select
                  label="Operational Facility"
                  options={['Rig Site A', 'Rig Site B', 'Processing Unit', 'Warehouse', 'Workshop']}
                  value={testSelect}
                  onChange={setTestSelect}
                />

                <Select
                  label="Disabled Select Control"
                  options={['Option A', 'Option B']}
                  value="Option A"
                  disabled={true}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="Incident Narrative Editor"
                    value={testTextarea}
                    onChange={(e) => setTestTextarea(e.target.value)}
                    rows={3}
                    showCount={true}
                    maxLength={500}
                    helperText="Plain text narrative input with live character telemetry."
                  />
                </div>
              </div>
            </Card>

            {/* KPI Cards */}
            <Card
              title="KPI Cards"
              subtitle="Compact operational indicators communicating Value (28px font-mono), Label, Context, and optional Trend."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  label="Total Reports"
                  value={46}
                  trend="+12% this month"
                  trendDirection="up"
                  context="All analyzed reports"
                  variant="default"
                />

                <KpiCard
                  label="High Risk"
                  value={8}
                  trend="17% of total"
                  trendDirection="neutral"
                  context="Needs prompt review"
                  variant="orange"
                />

                <KpiCard
                  label="SIF Precursors"
                  value={3}
                  trend="Requires action"
                  trendDirection="up"
                  context="Critical attention"
                  variant="red"
                  highlight={true}
                />
              </div>
            </Card>

            {/* Loading Skeletons */}
            <Card
              title="Loading Skeletons"
              subtitle="Preserves final page layout structure during async fetch operations. Avoids jarring content jumps."
            >
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-mono text-slate-400 block mb-2">KPI Skeleton:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiSkeleton count={3} />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-mono text-slate-400 block mb-2">Card Skeleton:</span>
                  <CardSkeleton lines={3} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── 3. STATES ─────────────────────────────────────────────────── */}
        {activeTab === 'states' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Empty State */}
            <Card
              title="Empty State"
              subtitle="Operational guidance with a clear call-to-action when data is unavailable."
            >
              <EmptyState
                title="No safety reports yet"
                description="Analyze your first report or upload a batch to start building your safety intelligence history."
                actionLabel="Analyze Report"
                onAction={() => alert('Empty state action triggered')}
                actionIcon={Upload}
              />
            </Card>

            {/* Error States */}
            <Card
              title="Error States"
              subtitle="Calm, clear messaging for operational failures without making the entire workspace look broken."
            >
              <div className="space-y-6">
                <ErrorState
                  title="Unable to load reports"
                  description="We could not retrieve safety observations from the telemetry store. Please check your connectivity and retry."
                  onRetry={() => alert('Retry triggered')}
                />

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-mono text-slate-400 block mb-2">Compact Error Variant:</span>
                  <ErrorState
                    compact={true}
                    description="Unable to analyze this report. Unsupported document encoding detected."
                    onRetry={() => alert('Compact retry triggered')}
                  />
                </div>
              </div>
            </Card>

            {/* Disabled States */}
            <Card
              title="Disabled States"
              subtitle="Controls clearly indicate unavailability without sacrificing text legibility."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <Button variant="primary" disabled={true} className="w-full">
                  Disabled Primary Button
                </Button>

                <Input
                  label="Disabled Input"
                  value="Readonly System Parameter"
                  disabled={true}
                />

                <Select
                  label="Disabled Dropdown"
                  options={['Option 1']}
                  value="Option 1"
                  disabled={true}
                />
              </div>
            </Card>

            {/* Progress & Ingestion */}
            <Card
              title="Progress & Ingestion State"
              subtitle="Step-by-step progress bars with percentage indicators."
            >
              <div className="space-y-4 max-w-lg">
                <ProgressBar percentage={75} label="Batch Ingestion" statusText="3 of 4 analyzed" />
                <ProgressBar percentage={100} variant="emerald" label="Verification Complete" statusText="Ready" />
                <ProgressBar percentage={40} variant="amber" label="Partial Warning" statusText="Review required" />
              </div>
            </Card>
          </div>
        )}

        {/* ── 4. RESPONSIVE ─────────────────────────────────────────────── */}
        {activeTab === 'responsive' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <Card
              title="Responsive Breakpoint Standards"
              subtitle="Disciplined viewport adaptation ensures industrial operators can monitor safety on control-room monitors, laptops, or field tablets."
            >
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm">Desktop (&gt;= 1280px)</span>
                    <p className="text-slate-500">Persistent 240px white sidebar, 2-column analytical chart layouts, full table views.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">1280px+</span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm">Tablet (768px – 1279px)</span>
                    <p className="text-slate-500">Sidebar collapses into compact icons or responsive drawer; KPI grids adapt from 5 to 2–3 columns.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">768–1279px</span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm">Mobile (&lt; 768px)</span>
                    <p className="text-slate-500">Full-width vertical stack, top navigation, touch-accessible controls (min 40px height).</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">&lt; 768px</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
