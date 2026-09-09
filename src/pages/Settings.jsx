import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Building2,
  Bell,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader, CardTitle, CardSubtitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

export default function Settings() {
  const [saved, setSaved] = useState(false);

  // Form states
  const [highRiskThreshold, setHighRiskThreshold] = useState('3');
  const [sifAlertMode, setSifAlertMode] = useState('immediate');
  const [defaultSiteContext, setDefaultSiteContext] = useState('ALL');
  const [batchDepth, setBatchDepth] = useState('standard');
  const [orgUnit, setOrgUnit] = useState('Oil India Limited - Field Operations Division');

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AppShell title="Settings" subtitle="System Configuration">
      <PageContainer className="space-y-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                System Preferences
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Manage risk thresholds, notification rules, and operational intelligence parameters.
            </p>
          </div>

          {saved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <Check size={14} /> Preferences Saved
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Risk Classification Thresholds */}
          <Card
            title="Risk Classification & SIF Precursor Rules"
            subtitle="Define automatic classification rules applied during batch safety report screening."
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="SIF Precursor Notification Mode"
                    value={sifAlertMode}
                    onChange={(val) => setSifAlertMode(typeof val === 'object' && val?.target ? val.target.value : val)}
                    options={[
                      { value: 'immediate', label: 'Immediate High-Priority Flag' },
                      { value: 'digest', label: 'Daily Shift Safety Digest' },
                      { value: 'manual', label: 'Manual Safety Officer Review' },
                    ]}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Triggers immediate high-contrast attention banners upon report ingestion.
                  </p>
                </div>

                <div>
                  <Input
                    label="Elevated Site Threshold (High-Risk Reports in 30d)"
                    type="number"
                    value={highRiskThreshold}
                    onChange={(e) => setHighRiskThreshold(e.target.value)}
                    min="1"
                    max="20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Automatically elevates facility health status when threshold is exceeded.
                  </p>
                </div>
              </div>

              <div>
                <Select
                  label="Default Analysis Screening Depth"
                  value={batchDepth}
                  onChange={(val) => setBatchDepth(typeof val === 'object' && val?.target ? val.target.value : val)}
                  options={[
                    { value: 'standard', label: 'Standard Operational Screening (Recommended)' },
                    { value: 'detailed', label: 'Detailed Precursor & Barrier Decomposition' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Operational Hierarchy */}
          <Card
            title="Organizational Identity & Facility Scope"
            subtitle="Configure facility identification settings for Oil India Limited (OIL) field divisions."
          >
            <div className="space-y-4 text-xs">
              <div>
                <Input
                  label="Operating Division"
                  value={orgUnit}
                  onChange={(e) => setOrgUnit(e.target.value)}
                />
              </div>

              <div>
                <Select
                  label="Default Site Context on Launch"
                  value={defaultSiteContext}
                  onChange={(val) => setDefaultSiteContext(typeof val === 'object' && val?.target ? val.target.value : val)}
                  options={[
                    { value: 'ALL', label: 'All Sites (Corporate Overview)' },
                    { value: 'rig-site-b', label: 'Rig Site B (Assam)' },
                    { value: 'rig-site-a', label: 'Rig Site A (Assam)' },
                    { value: 'processing-unit', label: 'Processing Unit (Duliajan)' },
                    { value: 'warehouse', label: 'Warehouse (Duliajan)' },
                    { value: 'workshop', label: 'Workshop (Duliajan)' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Configuration
            </Button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
