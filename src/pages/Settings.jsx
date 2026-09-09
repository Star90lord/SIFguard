import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Bell,
  Sliders,
  Check,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Briefcase,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useApp } from '../context/AppContext';
import { ROLES } from '../config/roles';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    updateProfile,
    roleDefinition,
    switchRole,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    notificationPreferences,
    togglePreference,
  } = useApp();

  // Active tab: 'profile' | 'notifications' | 'preferences'
  const activeTab = searchParams.get('tab') || 'profile';

  function handleTabChange(tabKey) {
    setSearchParams({ tab: tabKey }, { replace: true });
  }

  // Profile Form Local State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    department: currentUser.department,
    organization: currentUser.organization,
    defaultSite: currentUser.defaultSite,
    defaultRange: currentUser.defaultRange,
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync profile form if currentUser changes externally
  useEffect(() => {
    setProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      department: currentUser.department,
      organization: currentUser.organization,
      defaultSite: currentUser.defaultSite,
      defaultRange: currentUser.defaultRange,
    });
  }, [currentUser]);

  function handleProfileSave(e) {
    e.preventDefault();
    updateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3500);
  }

  // Operational Preferences Form State (Preserved from existing settings)
  const [highRiskThreshold, setHighRiskThreshold] = useState('3');
  const [sifAlertMode, setSifAlertMode] = useState('immediate');
  const [defaultSiteContext, setDefaultSiteContext] = useState(currentUser.defaultSite || 'ALL');
  const [batchDepth, setBatchDepth] = useState('standard');
  const [orgUnit, setOrgUnit] = useState('Oil India Limited - Field Operations Division');
  const [prefSaved, setPrefSaved] = useState(false);

  function handlePrefSave(e) {
    e.preventDefault();
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3500);
  }

  return (
    <AppShell title="Settings" subtitle="System & User Preferences">
      <PageContainer className="space-y-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operational Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Manage operator profile, safety notification preferences, and application parameters.
            </p>
          </div>

          {/* Feedback Badges */}
          {profileSaved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <Check size={14} /> Profile preferences saved
            </div>
          )}
          {prefSaved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <Check size={14} /> Operational parameters updated
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <User size={14} className={activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Bell size={14} className={activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white font-mono leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sliders size={14} className={activeTab === 'preferences' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Preferences</span>
          </button>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: PROFILE */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Identity Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Professional Initials Avatar */}
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center tracking-wider shadow-2xs shrink-0">
                  {currentUser.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                      {roleDefinition.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentUser.department} · {currentUser.organization}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Privilege: {roleDefinition.accessLevel}
                  </p>
                </div>
              </div>

              {/* Role Switcher for Hackathon Demonstration */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Demo Role:
                </span>
                {currentUser.role === ROLES.ADMIN ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => switchRole(ROLES.MANAGER)}
                    className="text-xs"
                    title="Switch to HSE Manager to test restricted access and manager navigation"
                  >
                    Switch to HSE Manager
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => switchRole(ROLES.ADMIN)}
                    className="text-xs text-blue-600 border-blue-200"
                    title="Switch to Administrator to access Administration Console"
                  >
                    Switch to Administrator
                  </Button>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <Card
              title="Personal & Operational Information"
              subtitle="Identity and contact details recorded in Oil India Limited HSE system."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Operational Role
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-between">
                    <span>{roleDefinition.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {roleDefinition.accessLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <Input
                    label="Department"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>

                <div>
                  <Input
                    label="Organization"
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, organization: e.target.value }))}
                  />
                </div>

                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Contact Telephone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </Card>

            {/* Operator Defaults */}
            <Card
              title="Session & View Defaults"
              subtitle="Personalize default filters applied when launching the SIFguard dashboard."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <Select
                    label="Default Scope on Dashboard"
                    value={profileForm.defaultSite}
                    onChange={(val) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        defaultSite: typeof val === 'object' && val?.target ? val.target.value : val,
                      }))
                    }
                    options={[
                      { value: 'ALL', label: 'All Operational Sites' },
                      { value: 'rig-site-b', label: 'Rig Site B (Assam)' },
                      { value: 'rig-site-a', label: 'Rig Site A (Assam)' },
                      { value: 'processing-unit', label: 'Processing Unit (Duliajan)' },
                    ]}
                  />
                </div>

                <div>
                  <Select
                    label="Default Reporting Window"
                    value={profileForm.defaultRange}
                    onChange={(val) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        defaultRange: typeof val === 'object' && val?.target ? val.target.value : val,
                      }))
                    }
                    options={[
                      { value: 'THIS_MONTH', label: 'This Month (Standard)' },
                      { value: 'THIS_WEEK', label: 'This Week (Last 7 Days)' },
                      { value: 'TODAY', label: 'Today (Current Shift)' },
                      { value: 'ALL', label: 'All Recorded Events' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Save Profile Button */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button type="submit" variant="primary" size="md">
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: NOTIFICATIONS */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Notification Alert Rules Preferences */}
            <Card
              title="Safety Intelligence Alert Rules"
              subtitle="Configure which operational safety signals trigger notifications and topbar alerts."
            >
              <div className="space-y-3 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                  Critical Safety Alerts
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* High Risk */}
                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 block">High-Risk Observations</span>
                      <span className="text-[11px] text-slate-500">Alert on High severity classifications</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.highRiskAlerts}
                      onChange={() => togglePreference('highRiskAlerts')}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      aria-label="Toggle high-risk observation alerts"
                    />
                  </label>

                  {/* SIF Precursor */}
                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 block">SIF Precursor Signals</span>
                      <span className="text-[11px] text-slate-500">Immediate alerts on fatal precursor detection</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.sifPrecursorAlerts}
                      onChange={() => togglePreference('sifPrecursorAlerts')}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      aria-label="Toggle SIF precursor alerts"
                    />
                  </label>

                  {/* Barrier Failure */}
                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 block">Recurring Barrier Breakdowns</span>
                      <span className="text-[11px] text-slate-500">Repeated physical or administrative breaches</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.barrierFailureAlerts}
                      onChange={() => togglePreference('barrierFailureAlerts')}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      aria-label="Toggle recurring barrier breakdown alerts"
                    />
                  </label>

                  {/* Batch Completed */}
                  <label className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 block">Batch Screening Completed</span>
                      <span className="text-[11px] text-slate-500">Notifications when multi-report screening ends</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.batchCompleted}
                      onChange={() => togglePreference('batchCompleted')}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      aria-label="Toggle batch screening completed alerts"
                    />
                  </label>
                </div>
              </div>
            </Card>

            {/* Notification History Feed */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Notification Feed
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                      {notifications.length} Total · {unreadCount} Unread
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological record of safety alerts and operational notices.
                  </p>
                </div>

                {unreadCount > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Check}
                    onClick={markAllAsRead}
                    aria-label="Mark all notifications as read"
                  >
                    Mark All as Read
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No active notifications</p>
                  <p className="text-[11px] text-slate-400">
                    All safety intelligence alerts have been acknowledged.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((notif) => {
                    const isCritical = notif.severity === 'critical';
                    const isHigh = notif.severity === 'high';
                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          notif.read
                            ? 'bg-white border-slate-200/80 text-slate-600'
                            : isCritical
                            ? 'bg-rose-50/40 border-rose-200/90 text-slate-900'
                            : isHigh
                            ? 'bg-amber-50/30 border-amber-200/80 text-slate-900'
                            : 'bg-blue-50/30 border-blue-200/80 text-slate-900'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5 shrink-0">
                              {isCritical ? (
                                <AlertOctagon size={16} className="text-rose-600" />
                              ) : isHigh ? (
                                <AlertTriangle size={16} className="text-amber-600" />
                              ) : (
                                <CheckCircle2 size={16} className="text-blue-600" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {notif.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                                  {notif.location}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                                )}
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-400 font-mono">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {notif.timestamp}
                                </span>
                                {notif.link && (
                                  <Link
                                    to={notif.link}
                                    className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                                  >
                                    <span>Inspect Observation</span>
                                    <ExternalLink size={10} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Individual read button */}
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 self-end sm:self-start px-2 py-1 rounded hover:bg-white/80 transition-colors shrink-0"
                              aria-label={`Mark ${notif.title} as read`}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: PREFERENCES (Existing Operational Parameters) */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'preferences' && (
          <form onSubmit={handlePrefSave} className="space-y-6">
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
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button type="submit" variant="primary" size="md">
                Save Configuration
              </Button>
            </div>
          </form>
        )}
      </PageContainer>
    </AppShell>
  );
}
