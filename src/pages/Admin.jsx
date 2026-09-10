import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  Sliders,
  Settings2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Activity,
  Layers,
  Database,
  Radio,
  Lock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { RiskBadge, SiteHealthBadge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import { ROLES } from '../config/roles';
import { getSites, getReports } from '../api/sifguardApi';

export default function Admin() {
  const navigate = useNavigate();
  const { currentUser, roleDefinition, switchRole } = useApp();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'sites' | 'parameters' | 'preferences'
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [sites, setSites] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadAdminData() {
      try {
        const [sitesData, reportsData] = await Promise.all([getSites(), getReports()]);
        setSites(sitesData || []);
        setReports(reportsData || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  // Compute live overview metrics
  const totalSites = sites.length;
  const totalReports = reports.length;
  const highRiskCount = reports.filter((r) => r.risk_level === 'High').length;
  const sifPrecursorCount = reports.filter(
    (r) => r.risk_level === 'SIF-Precursor' || r.sif_precursor === true
  ).length;

  // ACCESS PROTECTION: If current user is not ADMIN, show enterprise Access Restricted view
  if (currentUser.role !== ROLES.ADMIN) {
    return (
      <AppShell title="Administration" subtitle="Access Restricted">
        <PageContainer className="max-w-2xl mx-auto py-12">
          <div className="bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl p-8 text-center shadow-2xs space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-400 mx-auto">
              <Lock size={28} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                Privilege Required
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                Access Restricted
              </h1>
              <p className="text-sm text-slate-600 dark:text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                Administrator privileges are required to access system administration, access controls, and operational configurations.
              </p>
            </div>

            {/* Current user session info */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244] text-xs text-slate-700 dark:text-[#CBD5E1] flex items-center justify-between max-w-md mx-auto font-mono">
              <span className="text-slate-500 dark:text-[#94A3B8]">Current Role:</span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{roleDefinition.label} ({roleDefinition.accessLevel})</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>

              {/* Demo Helper: Allow switching back to Admin for evaluation */}
              <Button
                variant="secondary"
                size="md"
                onClick={() => switchRole(ROLES.ADMIN)}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                Switch to Administrator (Demo)
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  function handleTriggerAction(msg) {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  return (
    <AppShell title="Administration" subtitle="HSE Administration Console">
      <PageContainer className="space-y-6">
        {/* 1. Header & Operator Identity Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#D1D5DB] dark:border-[#263244]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Oil India Limited · Enterprise Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-none">
              Administration Console
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#CBD5E1] mt-1.5 font-normal">
              System administration, role-based access configuration, and operational safety parameters.
            </p>
          </div>

          {/* Role Status & Role Switcher for SIH Demonstration */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500 dark:text-[#94A3B8]">Logged in as:</span>
              <strong className="text-slate-900 dark:text-[#F8FAFC] font-bold">{currentUser.name}</strong>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                ADMIN
              </span>
            </div>

            {/* Quick Demo Switcher */}
            <button
              type="button"
              onClick={() => switchRole(ROLES.MANAGER)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-[#172033] text-xs font-semibold text-slate-600 dark:text-[#CBD5E1] transition-colors cursor-pointer"
              title="Switch role to HSE Manager to evaluate access protection"
            >
              Test as Manager
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          </div>
        )}

        {/* 2. System Overview Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Active Facilities</span>
              <Building2 size={14} className="text-slate-400 dark:text-[#94A3B8]" />
            </div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC]">{totalSites}</span>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">Monitored field sites</span>
          </div>

          <div className="p-4 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Reports in System</span>
              <FileText size={14} className="text-slate-400 dark:text-[#94A3B8]" />
            </div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC]">{totalReports}</span>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">Evaluated safety events</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 mb-1 font-semibold">
              <span>High Risk Reports</span>
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-amber-950 dark:text-amber-200">{highRiskCount}</span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">Severity classified</span>
          </div>

          <div className="p-4 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-xs">
            <div className="flex items-center justify-between text-xs text-red-800 dark:text-red-300 mb-1 font-bold">
              <span>SIF Precursors</span>
              <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-red-950 dark:text-red-200">{sifPrecursorCount}</span>
            <span className="text-[11px] text-red-700/80 dark:text-red-400/80 block mt-0.5">Fatal potential flags</span>
          </div>
        </div>

        {/* 3. Administration Navigation Tabs */}
        <div className="border-b border-[#D1D5DB] dark:border-[#263244] flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'users', label: 'User & Role Access', icon: Users },
            { id: 'sites', label: 'Site Configuration', icon: Building2 },
            { id: 'parameters', label: 'Safety Parameters', icon: Sliders },
            { id: 'preferences', label: 'System Preferences', icon: Settings2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-transparent text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-[#94A3B8]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab Content Areas */}
        {/* TAB A: USER & ROLE ACCESS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <Card
              title="User & Role Access Directory"
              subtitle="Frontend demonstration access directory for Oil India Limited HSE platform."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 dark:bg-[#070B12] border-b border-[#D1D5DB] dark:border-[#263244] text-slate-700 dark:text-[#CBD5E1] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Identity Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Access Level</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Configuration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263244]">
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-[#172033]">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">
                        HSE Administrator
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-[#94A3B8]">hse.admin@oilindia.example</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-bold font-mono text-[11px]">
                          Administrator
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-[#CBD5E1] font-medium">Full Access</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">HSE Operations Division</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTriggerAction('User configuration review mode.')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70 dark:hover:bg-[#172033]">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">
                        HSE Manager
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-[#94A3B8]">hse.manager@oilindia.example</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172033] text-slate-800 dark:text-[#CBD5E1] border border-[#D1D5DB] dark:border-[#263244] font-bold font-mono text-[11px]">
                          HSE Manager
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-[#CBD5E1] font-medium">Operational Access</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">Field Safety Monitoring</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTriggerAction('User configuration review mode.')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70 dark:hover:bg-[#172033]">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">
                        Site Safety Officer
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-[#94A3B8]">sso.field@oilindia.example</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172033] text-slate-700 dark:text-[#CBD5E1] border border-[#D1D5DB] dark:border-[#263244] font-medium font-mono text-[11px]">
                          Safety Officer
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-[#CBD5E1] font-medium">Field Logging</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">Drilling & Rig Operations</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTriggerAction('User configuration review mode.')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB B: SITE CONFIGURATION */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <Card
              title="Operational Facility Configuration"
              subtitle="Review and configure installation telemetry and operational site profiles."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 dark:bg-[#070B12] border-b border-[#D1D5DB] dark:border-[#263244] text-slate-700 dark:text-[#CBD5E1] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Facility Name</th>
                      <th className="py-2.5 px-3">Site Code</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Facility Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Health Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#263244]">
                    {sites.map((site) => (
                      <tr key={site.id} className="hover:bg-slate-50/70 dark:hover:bg-[#172033]">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{site.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-[#94A3B8]">{site.code || site.id.toUpperCase()}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">{site.location}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-[#CBD5E1]">{site.type}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {site.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <SiteHealthBadge status={site.healthStatus} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/sites/${site.id}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            <span>Profile</span>
                            <ExternalLink size={10} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB C: SAFETY PARAMETERS */}
        {activeTab === 'parameters' && (
          <div className="space-y-4">
            <Card
              title="Current Application Safety Parameters"
              subtitle="Operational taxonomies and precursor criteria active in SIFguard."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Risk Levels */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070B12] border border-[#D1D5DB] dark:border-[#263244] space-y-2">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">Risk Classification Hierarchy</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <RiskBadge level="SIF-Precursor" size="sm" />
                    <RiskBadge level="High" size="sm" />
                    <RiskBadge level="Medium" size="sm" />
                    <RiskBadge level="Low" size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] pt-1">
                    Precursor threshold triggers mandatory notification and executive escalation.
                  </p>
                </div>

                {/* Primary Hazards */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070B12] border border-[#D1D5DB] dark:border-[#263244] space-y-2">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">Monitored Hazard Taxonomies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Fall', 'Confined Space', 'Electrical', 'Chemical Exposure', 'Dropped Object', 'Vehicle Interaction'].map(
                      (h) => (
                        <span key={h} className="px-2 py-0.5 rounded bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] text-slate-700 dark:text-[#CBD5E1] text-[11px]">
                          {h}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Activities */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070B12] border border-[#D1D5DB] dark:border-[#263244] space-y-2">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">High-Consequence Activities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Scaffold Work', 'Welding', 'Maintenance', 'Lifting Operations', 'Tank Cleaning', 'Inspection'].map(
                      (a) => (
                        <span key={a} className="px-2 py-0.5 rounded bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] text-slate-700 dark:text-[#CBD5E1] text-[11px]">
                          {a}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Barrier Safeguards */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#070B12] border border-[#D1D5DB] dark:border-[#263244] space-y-2">
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">Safeguard Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Fall Protection Verification', 'Energy Isolation (LOTO)', 'Gas Testing & Ventilation', 'Exclusion Barricades', 'Permit-to-Work Authorizations'].map(
                      (b) => (
                        <span key={b} className="px-2 py-0.5 rounded bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] text-slate-700 dark:text-[#CBD5E1] text-[11px]">
                          {b}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB D: SYSTEM PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <Card
              title="System Preferences & Operational Standards"
              subtitle="Application-level configuration values for enterprise deployment."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12]">
                  <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Operational Simulation Date</span>
                  <strong className="text-slate-900 dark:text-[#F8FAFC] font-mono text-sm">09 Sep 2026</strong>
                  <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">SIH 2026 Reference Baseline</span>
                </div>

                <div className="p-3 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12]">
                  <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Default Dashboard Scope</span>
                  <strong className="text-slate-900 dark:text-[#F8FAFC] text-sm">All Operational Sites</strong>
                  <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">Company-wide overview</span>
                </div>

                <div className="p-3 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12]">
                  <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Default Time Window</span>
                  <strong className="text-slate-900 dark:text-[#F8FAFC] text-sm">This Month (Current Month)</strong>
                  <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">Standard HSE reporting cycle</span>
                </div>

                <div className="p-3 rounded-lg border border-[#D1D5DB] dark:border-[#263244] bg-slate-50 dark:bg-[#070B12]">
                  <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Display Information Density</span>
                  <strong className="text-slate-900 dark:text-[#F8FAFC] text-sm">Industrial High-Density</strong>
                  <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">HSE operational console layout</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 5. Audit Trail & System Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Recent Admin Activity */}
          <div className="p-4.5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263244] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                Recent Admin Activity
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">Audit Trail</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">Precursor detection rules reviewed</span>
                  <span className="block text-[10px] text-slate-500 dark:text-[#94A3B8]">Automated screening criteria validated</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">Today · 12:40</span>
              </div>

              <div className="p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">Rig Site B alert threshold updated</span>
                  <span className="block text-[10px] text-slate-500 dark:text-[#94A3B8]">High-risk notification mode: Immediate</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">08 Sep 2026</span>
              </div>

              <div className="p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">Facility profile provisioned (Rig Site C)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-[#94A3B8]">Assam operational area registered</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">07 Sep 2026</span>
              </div>
            </div>
          </div>

          {/* System Status Telemetry */}
          <div className="p-4.5 rounded-xl border border-[#D1D5DB] dark:border-[#263244] bg-white dark:bg-[#111827] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#263244] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                System Health & Integrations
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244]">
                <span className="text-slate-600 dark:text-[#CBD5E1] font-medium">API Integration Layer</span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Ready (Abstraction Active)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244]">
                <span className="text-slate-600 dark:text-[#CBD5E1] font-medium">Data Storage Model</span>
                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  Centralized Store
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244]">
                <span className="text-slate-600 dark:text-[#CBD5E1] font-medium">Precursor Screening Engine</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#172033] px-2 py-0.5 rounded border border-[#D1D5DB] dark:border-[#263244]">
                  Frontend Simulation
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200/80 dark:border-[#263244]">
                <span className="text-slate-600 dark:text-[#CBD5E1] font-medium">Target Environment</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-[#CBD5E1]">
                  Oil India Limited · SIH 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
