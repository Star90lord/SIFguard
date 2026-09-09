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
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge, { RiskBadge, SiteHealthBadge } from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import ProgressBar from '../components/ui/ProgressBar';
import MetricCard from '../components/dashboard/MetricCard';
import SafetyTimeline from '../components/analysis/SafetyTimeline';
import SiteGroupCard from '../components/analysis/SiteGroupCard';
import { TableSkeleton, ChartSkeleton } from '../components/ui/Skeleton';

export default function DesignSystem() {
  const [activeSection, setActiveSection] = useState('foundations');
  const [testInput, setTestInput] = useState('');
  const [testSelect, setTestSelect] = useState('Rig Site A');
  const [btnLoading, setBtnLoading] = useState(false);

  const sections = [
    { id: 'foundations', label: 'Foundations' },
    { id: 'ui-primitives', label: 'UI Primitives' },
    { id: 'risk-and-health', label: 'Risk & Health' },
    { id: 'operational-blocks', label: 'Operational Patterns' },
  ];

  // Sample timeline reports
  const sampleReports = [
    {
      id: 'ds-1',
      date: '2026-09-09',
      time: '09:15',
      site: 'Rig Site A',
      risk_level: 'SIF-Precursor',
      hazard: 'Confined Space',
      activity: 'Tank Cleaning',
      barrier_failure: 'Atmospheric Testing Omitted',
      text_snippet:
        'Worker entered tank without multi-gas test probe. Standby watch was not stationed at the entry portal.',
    },
    {
      id: 'ds-2',
      date: '2026-09-09',
      time: '14:20',
      site: 'Rig Site A',
      risk_level: 'High',
      hazard: 'Fall',
      activity: 'Scaffold Work',
      barrier_failure: 'PPE Non-compliance',
      text_snippet:
        'Contractor welding on 10m elevated staging without lanyard anchored to certified lifeline.',
    },
    {
      id: 'ds-3',
      date: '2026-09-07',
      time: '11:00',
      site: 'Rig Site A',
      risk_level: 'Medium',
      hazard: 'Electrical',
      activity: 'Maintenance',
      barrier_failure: 'Isolation Defect',
      text_snippet:
        'Terminal torque check performed on 480V MCC cabinet with damaged cable insulation.',
    },
  ];

  return (
    <AppShell title="Design System" subtitle="Living Industrial UI Kit">
      <div className="space-y-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Design System Specification
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              SIFguard UI Kit
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Production-ready foundations and reusable patterns for clear, credible industrial safety decisions.
            </p>
          </div>

          <Tabs
            tabs={sections}
            activeTab={activeSection}
            onChange={setActiveSection}
            size="sm"
          />
        </div>

        {/* 1. Foundations */}
        {activeSection === 'foundations' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Color Roles */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Color Palette & Roles</h3>
              <p className="text-xs text-slate-500">
                Calm, restrained neutrals dominate the visual surface. Semantic colors are strictly reserved for safety risk classification.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-slate-200 bg-[#0a0f1d] text-white">
                  <span className="text-[10px] font-mono opacity-60">Navy Chrome</span>
                  <p className="text-xs font-bold mt-1">#0A0F1D</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-[#16a34a] text-white">
                  <span className="text-[10px] font-mono opacity-80">Low Risk</span>
                  <p className="text-xs font-bold mt-1">#16A34A</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-[#d97706] text-white">
                  <span className="text-[10px] font-mono opacity-80">Medium Risk</span>
                  <p className="text-xs font-bold mt-1">#D97706</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-[#ea580c] text-white">
                  <span className="text-[10px] font-mono opacity-80">High Risk</span>
                  <p className="text-xs font-bold mt-1">#EA580C</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-[#dc2626] text-white">
                  <span className="text-[10px] font-mono opacity-80">SIF Precursor</span>
                  <p className="text-xs font-bold mt-1">#DC2626</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-[#f8fafc] text-slate-800">
                  <span className="text-[10px] font-mono text-slate-500">Surface Subtle</span>
                  <p className="text-xs font-bold mt-1">#F8FAFC</p>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Typography Scale (Inter)</h3>
              <div className="divide-y divide-slate-100 text-slate-800">
                <div className="py-3 flex items-baseline justify-between">
                  <span className="text-[11px] font-mono text-slate-400 w-32">Page Title (28px)</span>
                  <span className="text-2xl font-bold tracking-tight">Safety Intelligence</span>
                </div>
                <div className="py-3 flex items-baseline justify-between">
                  <span className="text-[11px] font-mono text-slate-400 w-32">Section Title (16px)</span>
                  <span className="text-base font-bold text-slate-900">Longitudinal Safety History</span>
                </div>
                <div className="py-3 flex items-baseline justify-between">
                  <span className="text-[11px] font-mono text-slate-400 w-32">Body Text (14px)</span>
                  <span className="text-sm text-slate-700 leading-relaxed max-w-md">
                    Worker was operating on suspended scaffold at 9 meters without harness lifeline anchorage.
                  </span>
                </div>
                <div className="py-3 flex items-baseline justify-between">
                  <span className="text-[11px] font-mono text-slate-400 w-32">Metadata / Eyebrow (11px)</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Active Operational Scope
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. UI Primitives */}
        {activeSection === 'ui-primitives' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Buttons */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Button Component Variants</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Action</Button>
                <Button
                  variant="primary"
                  loading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1500);
                  }}
                >
                  Click for Loading State
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Inputs & Selects */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Form Controls & Dropdowns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Field Report Search"
                  icon={Search}
                  placeholder="Filter by keyword..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />

                <Select
                  label="Operational Facility"
                  options={['Rig Site A', 'Rig Site B', 'Processing Unit', 'Warehouse', 'Workshop']}
                  value={testSelect}
                  onChange={setTestSelect}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Batch Progress</label>
                  <ProgressBar percentage={68} label="Ingestion" statusText="3 of 5 done" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Risk & Health Badges */}
        {activeSection === 'risk-and-health' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Semantic Risk Badges</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clear visual hierarchy with high contrast and readable text under grayscale rendering.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level="Low" size="md" />
                <RiskBadge level="Medium" size="md" />
                <RiskBadge level="High" size="md" />
                <RiskBadge level="SIF-Precursor" size="md" />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Facility Safety Health Indicators
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <SiteHealthBadge status="Stable" size="md" />
                  <SiteHealthBadge status="Watch" size="md" />
                  <SiteHealthBadge status="Elevated" size="md" />
                  <SiteHealthBadge status="Critical" size="md" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Operational Patterns */}
        {activeSection === 'operational-blocks' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* KPI Metric Cards */}
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">KPI Metric Block</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <MetricCard
                  label="Total Reports"
                  value={46}
                  indicator="All analyzed reports"
                  color="default"
                />
                <MetricCard
                  label="High Risk"
                  value={8}
                  indicator="17% of total"
                  color="orange"
                />
                <MetricCard
                  label="SIF Precursors"
                  value={3}
                  indicator="Requires attention"
                  color="red"
                  highlight={true}
                />
              </div>
            </div>

            {/* Site Group Card with Embedded Timeline */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">Site Group & Chronological Timeline</h3>
              <SiteGroupCard
                siteName="Rig Site A"
                reports={sampleReports}
                defaultExpanded={true}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
