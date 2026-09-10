import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Radio,
  Check,
  Building2,
  ClipboardList,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useAuth, useApp } from '../context/AppContext';
import { DEMO_USERS, DEMO_PASSWORD } from '../api/authApi';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useApp();

  // Form input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Active workflow stage hover state (subtle highlight)
  const [activeStageHover, setActiveStageHover] = useState(null);

  // Email format validation helper
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  // Pre-fill credentials from secondary demo buttons
  function handleSelectDemoUser(demoUser) {
    setEmail(demoUser.email);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setErrorMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    // Form field validation
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Please enter your operational email address.';
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = 'Please enter a valid email address format.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login({
        email: trimmedEmail,
        password,
        keepSignedIn,
      });

      // Redirect to intended route or default dashboard
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.message || 'Unable to sign in. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Workflow pipeline stages for the Safety Intelligence Panel
  const WORKFLOW_STAGES = [
    {
      id: 'report',
      code: 'REPORT',
      label: 'Report',
      subtitle: 'Field Observation',
      icon: ClipboardList,
      color: 'blue',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
      badgeBorder: 'border-blue-200 dark:border-blue-900',
      badgeText: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'detect',
      code: 'DETECT',
      label: 'Detect',
      subtitle: 'Risk Classification',
      icon: AlertTriangle,
      color: 'amber',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
      badgeBorder: 'border-amber-200 dark:border-amber-900',
      badgeText: 'text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'explain',
      code: 'EXPLAIN',
      label: 'Explain',
      subtitle: 'Precursor & Barrier AI',
      icon: ShieldAlert,
      color: 'red',
      badgeBg: 'bg-red-50 dark:bg-red-950/50',
      badgeBorder: 'border-red-200 dark:border-red-900',
      badgeText: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'act',
      code: 'ACT',
      label: 'Act',
      subtitle: 'Safeguard Control',
      icon: ShieldCheck,
      color: 'green',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      badgeBorder: 'border-emerald-200 dark:border-emerald-900',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#E9ECEF] dark:bg-[#070B12] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 lg:p-10 transition-colors duration-150 selection:bg-blue-500/20">
      {/* Top Bar: Brand Monogram & Theme Mode Toggle */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          to="/login"
          className="flex items-center gap-2.5 group focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg"
          title="SIFguard Safety Intelligence Command Center"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <ShieldAlert size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              SIFguard
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded font-mono">
              OIL HSE
            </span>
          </div>
        </Link>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-200/70 dark:hover:bg-[#111827] border border-[#CBD5E1] dark:border-[#263244] bg-white dark:bg-[#111827] transition-colors shadow-2xs text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
          <span className="hidden sm:inline font-mono text-[11px]">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </header>

      {/* Main Two-Column Industrial Command Layout */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: SIFguard Identity & Distinctive Operational Intelligence Panel */}
        <section className="lg:col-span-7 space-y-5">
          {/* Brand Heading & Operational Purpose */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/90 dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#263244] text-[11px] font-mono text-[#334155] dark:text-[#CBD5E1] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">OIL INDIA LIMITED · HSE SAFETY INTELLIGENCE</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  SIFguard
                </span>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-200/80 dark:bg-[#1a2333] text-slate-700 dark:text-[#CBD5E1] border border-slate-300/80 dark:border-[#263244]">
                  COMMAND CENTER
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#334155] dark:text-[#CBD5E1] uppercase">
                SERIOUS INJURY &amp; FATALITY GUARD
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] font-normal leading-relaxed max-w-xl">
              Safety intelligence for proactive HSE decision-making across high-risk field and facility operations.
            </p>
          </div>

          {/* SINGLE DISTINCTIVE SAFETY INTELLIGENCE OPERATIONAL PANEL */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#263244] p-5 sm:p-6 shadow-xs space-y-5">
            {/* Panel Top Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#263244]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC] font-mono">
                  SAFETY INTELLIGENCE
                </span>
              </div>

              {/* Industrial Telemetry Status Indicator */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-[#070B12] border border-[#CBD5E1] dark:border-[#263244] text-[11px] font-mono text-[#334155] dark:text-[#CBD5E1]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Industrial Telemetry Active</span>
              </div>
            </div>

            {/* Operational Metrics Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Metric 1: Sites Monitored */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0C121D] border border-[#E2E8F0] dark:border-[#1E293B] flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Facilities
                  </span>
                  <Building2 size={13} className="shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A] dark:text-[#F8FAFC] leading-none">
                  05
                </div>
                <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1 font-medium">
                  Sites monitored
                </span>
              </div>

              {/* Metric 2: Reports Evaluated */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0C121D] border border-[#E2E8F0] dark:border-[#1E293B] flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Evaluations
                  </span>
                  <ClipboardList size={13} className="shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A] dark:text-[#F8FAFC] leading-none">
                  23
                </div>
                <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1 font-medium">
                  Reports evaluated
                </span>
              </div>

              {/* Metric 3: SIF Precursor Signals */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0C121D] border border-red-200/70 dark:border-red-950/60 flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    SIF Precursor
                  </span>
                  <ShieldAlert size={13} className="shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-600 dark:text-red-400 leading-none">
                  05
                </div>
                <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1 font-medium">
                  SIF signals detected
                </span>
              </div>
            </div>

            {/* Workflow Pipeline: REPORT -> DETECT -> EXPLAIN -> ACT */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  OPERATIONAL SAFETY INTELLIGENCE FLOW
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                  Continuous HSE Cycle
                </span>
              </div>

              {/* 4 Connected Stages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isHovered = activeStageHover === stage.id;
                  return (
                    <div
                      key={stage.id}
                      onMouseEnter={() => setActiveStageHover(stage.id)}
                      onMouseLeave={() => setActiveStageHover(null)}
                      className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                        isHovered
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-[#172033] shadow-xs'
                          : 'border-[#E2E8F0] dark:border-[#263244] bg-[#F8FAFC] dark:bg-[#0A0F18]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${stage.badgeBg} ${stage.badgeBorder} ${stage.badgeText}`}>
                          {stage.code}
                        </span>
                        <Icon size={14} className={stage.iconColor} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {stage.label}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] leading-tight mt-0.5">
                          {stage.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Panel Footer Strip */}
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263244] flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Oil India Limited Operational Facilities</span>
              </span>
              <span>v2.4 HSE Baseline</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Secure Login Card */}
        <section className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-[#FFFFFF] dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#263244] p-7 sm:p-8 shadow-xs space-y-5">
            {/* Card Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                Sign in to SIFguard
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Enter your credentials to access the safety intelligence command center.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-800 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in"
                role="alert"
              >
                <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Operational Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]"
                >
                  Operational Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#94A3B8]">
                    <Mail size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: null }));
                      }
                    }}
                    placeholder="operator@oilindia.example"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-[#0A0F18] text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-600 outline-hidden transition-colors ${
                      fieldErrors.email
                        ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                        : 'border-[#CBD5E1] dark:border-[#263244] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.email && (
                  <p id="login-email-error" className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    placeholder="••••••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-[#0A0F18] text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-600 outline-hidden transition-colors ${
                      fieldErrors.password
                        ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                        : 'border-[#CBD5E1] dark:border-[#263244] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="login-password-error" className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Keep Me Signed In Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="keep-signed-in"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-[#CBD5E1] dark:border-[#263244] focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="keep-signed-in"
                  className="text-xs text-[#334155] dark:text-[#CBD5E1] cursor-pointer select-none font-medium"
                >
                  Keep me signed in on this device
                </label>
              </div>

              {/* Primary Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Development Demo Profiles (Directly visible 3-option layout) */}
            <div className="pt-3.5 border-t border-[#CBD5E1]/70 dark:border-[#263244] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  DEVELOPMENT DEMO PROFILES
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  Quick Fill
                </span>
              </div>

              {/* Compact 3-option grid: 2 on top row, 1 full-width on bottom row */}
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((demo, idx) => {
                  const isSelected = email.toLowerCase() === demo.email.toLowerCase();
                  const isFullWidth = idx === 2;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(demo)}
                      className={`p-2.5 rounded-lg text-left border transition-all text-xs flex items-center justify-between cursor-pointer ${
                        isFullWidth ? 'col-span-2' : 'col-span-1'
                      } ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 text-blue-950 dark:text-blue-100 font-semibold shadow-2xs'
                          : 'bg-slate-50/80 dark:bg-[#0E1524] border-[#CBD5E1] dark:border-[#263244] hover:border-blue-400 dark:hover:border-blue-500 text-[#334155] dark:text-[#CBD5E1]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate leading-tight">
                          {demo.name}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate mt-0.5">
                          {demo.email}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/70 flex items-center justify-center shrink-0 ml-1.5 border border-blue-300 dark:border-blue-700">
                          <Check size={11} className="text-blue-600 dark:text-blue-300 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 text-center pt-0.5">
                Demo convenience only · Selects role credentials for evaluation
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Page Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#CBD5E1]/60 dark:border-[#263244] pt-4">
        <span>© 2026 Oil India Limited (OIL). All rights reserved.</span>
        <span>SIFguard HSE Safety Intelligence Platform · Operational Command Center</span>
      </footer>

      {/* Forgot Password Modal Dialog */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/45 transition-opacity"
            onClick={() => setShowForgotPasswordModal(false)}
            aria-hidden="true"
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#263244] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#263244]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      Password Recovery
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      Oil India Limited HSE Access Control
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151E2E] border border-[#CBD5E1] dark:border-[#263244] space-y-2 text-xs">
                <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Self-service password recovery will be available in the upcoming security release.
                </p>
                <p className="text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  To reset or recover your enterprise operational credentials, please contact the Oil India Limited HSE Systems Administrator:
                </p>
                <div className="pt-1 font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  hse.admin@oilindia.example · Extension: 12345
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowForgotPasswordModal(false)}
                >
                  Understood
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
