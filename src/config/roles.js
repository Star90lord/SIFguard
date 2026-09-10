/**
 * SIFguard Centralized Frontend Role & Access Control Configuration
 * Defines granular permissions, four standardized HSE roles, user model structure,
 * and authorization helper functions for future authentication & role-based access.
 */

// ─── Granular Permissions ───────────────────────────────────────────
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  VIEW_REPORTS: 'VIEW_REPORTS',
  ANALYZE_REPORTS: 'ANALYZE_REPORTS',
  SUBMIT_REPORTS: 'SUBMIT_REPORTS',
  SUBMIT_SAFETY_REPORT: 'SUBMIT_REPORTS',
  COMPARE_SITES: 'COMPARE_SITES',
  COMPARE_HAZARDS: 'COMPARE_HAZARDS',
  MANAGE_ACTIONS: 'MANAGE_ACTIONS',
  MANAGE_SITES: 'MANAGE_SITES',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
};

// ─── Standardized HSE Roles ─────────────────────────────────────────
export const ROLES = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  HSE_MANAGER: 'HSE_MANAGER',
  SITE_SAFETY_OFFICER: 'SITE_SAFETY_OFFICER',

  // Backward-compatibility aliases for existing code
  ADMIN: 'ADMINISTRATOR',
  MANAGER: 'HSE_MANAGER',
  SSO: 'SITE_SAFETY_OFFICER',
};

// ─── Role Definitions & Capability Mappings ─────────────────────────
export const ROLE_DEFINITIONS = {
  [ROLES.ADMINISTRATOR]: {
    key: ROLES.ADMINISTRATOR,
    label: 'HSE Administrator',
    badgeText: 'Administrator',
    accessLevel: 'Full Enterprise Administration',
    description: 'Complete administrative access across users, sites, report submissions, analytics, system configuration, and audit settings.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.ANALYZE_REPORTS,
      PERMISSIONS.SUBMIT_REPORTS,
      PERMISSIONS.COMPARE_SITES,
      PERMISSIONS.COMPARE_HAZARDS,
      PERMISSIONS.MANAGE_ACTIONS,
      PERMISSIONS.MANAGE_SITES,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_SETTINGS,
    ],
    canAdminister: true,
    canSubmitReports: true,
  },
  [ROLES.HSE_MANAGER]: {
    key: ROLES.HSE_MANAGER,
    label: 'HSE Manager',
    badgeText: 'HSE Manager',
    accessLevel: 'Operational Safety Supervision',
    description: 'Operational safety oversight, dashboard, reports, review queue, site comparison, hazard comparison, and corrective actions.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.COMPARE_SITES,
      PERMISSIONS.COMPARE_HAZARDS,
      PERMISSIONS.MANAGE_ACTIONS,
      PERMISSIONS.MANAGE_SITES,
    ],
    canAdminister: false,
    canSubmitReports: false,
  },
  [ROLES.SITE_SAFETY_OFFICER]: {
    key: ROLES.SITE_SAFETY_OFFICER,
    label: 'Site Safety Officer',
    badgeText: 'Site Safety Officer',
    accessLevel: 'Site Safety Operations',
    description: 'Site-level safety work, safety report submission and review, site monitoring, risk analysis, and corrective actions.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.ANALYZE_REPORTS,
      PERMISSIONS.COMPARE_SITES,
      PERMISSIONS.COMPARE_HAZARDS,
      PERMISSIONS.MANAGE_ACTIONS,
    ],
    canAdminister: false,
    canSubmitReports: false,
  },
};

// Aliases in definition dictionary
ROLE_DEFINITIONS.ADMIN = ROLE_DEFINITIONS[ROLES.ADMINISTRATOR];
ROLE_DEFINITIONS.MANAGER = ROLE_DEFINITIONS[ROLES.HSE_MANAGER];
ROLE_DEFINITIONS.SSO = ROLE_DEFINITIONS[ROLES.SITE_SAFETY_OFFICER];

// ─── Centralized Permission & Role Utilities ────────────────────────
/**
 * Resolves a role key safely, handling legacy keys
 */
export function normalizeRole(role) {
  if (!role) return ROLES.ADMINISTRATOR;
  if (role === 'ADMIN' || role === ROLES.ADMINISTRATOR) return ROLES.ADMINISTRATOR;
  if (role === 'MANAGER' || role === ROLES.HSE_MANAGER) return ROLES.HSE_MANAGER;
  if (role === 'SSO' || role === ROLES.SITE_SAFETY_OFFICER) return ROLES.SITE_SAFETY_OFFICER;
  return role;
}

/**
 * Checks if a user has a specific granular permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const normalized = normalizeRole(user.role);
  const def = ROLE_DEFINITIONS[normalized];
  if (!def || !Array.isArray(def.permissions)) return false;
  return def.permissions.includes(permission);
}

/**
 * Checks if a user matches a specific role
 */
export function hasRole(user, role) {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === normalizeRole(role);
}

/**
 * Checks if a user can access the administration console
 */
export function canAccessAdmin(user) {
  return hasPermission(user, PERMISSIONS.MANAGE_USERS);
}

/**
 * Checks if a user can submit or upload safety reports
 */
export function canSubmitReports(user) {
  return hasPermission(user, PERMISSIONS.SUBMIT_REPORTS);
}

/**
 * Provides the target navigation model corresponding to a role.
 * Prepared for the upcoming authentication phase.
 */
export function getRoleNavigation(role) {
  const norm = normalizeRole(role);

  const ALL_ITEMS = {
    dashboard: { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    review: { to: '/review', label: 'Review Queue', icon: 'ClipboardCheck' },
    reports: { to: '/reports', label: 'Safety Reports', icon: 'ClipboardList' },
    submit: { to: '/submit', label: 'Analyze Reports', icon: 'FileSearch' },
    compare: { to: '/sites/compare', label: 'Site Comparison', icon: 'Repeat' },
    sites: { to: '/sites', label: 'Sites Directory', icon: 'Building2' },
    settings: { to: '/settings', label: 'Settings', icon: 'Settings' },
    admin: { to: '/admin', label: 'Admin', icon: 'ShieldCheck' },
  };

  switch (norm) {
    case ROLES.ADMINISTRATOR:
      return [
        { title: 'Overview', items: [ALL_ITEMS.dashboard] },
        { title: 'HSE Workflow', items: [ALL_ITEMS.review, ALL_ITEMS.reports] },
        { title: 'Intelligence & Analysis', items: [ALL_ITEMS.submit, ALL_ITEMS.compare] },
        { title: 'Facilities', items: [ALL_ITEMS.sites] },
        { title: 'System', items: [ALL_ITEMS.settings, ALL_ITEMS.admin] },
      ];
    case ROLES.HSE_MANAGER:
      return [
        { title: 'Overview', items: [ALL_ITEMS.dashboard] },
        { title: 'HSE Workflow', items: [ALL_ITEMS.review, ALL_ITEMS.reports] },
        { title: 'Intelligence & Analysis', items: [ALL_ITEMS.compare] },
        { title: 'Facilities', items: [ALL_ITEMS.sites] },
        { title: 'System', items: [ALL_ITEMS.settings] },
      ];
    case ROLES.SITE_SAFETY_OFFICER:
      return [
        { title: 'Overview', items: [ALL_ITEMS.dashboard] },
        { title: 'HSE Workflow', items: [ALL_ITEMS.review, ALL_ITEMS.reports] },
        { title: 'Intelligence & Analysis', items: [ALL_ITEMS.submit, ALL_ITEMS.compare] },
        { title: 'Facilities', items: [ALL_ITEMS.sites] },
        { title: 'System', items: [ALL_ITEMS.settings] },
      ];
    default:
      return [
        { title: 'Overview', items: [ALL_ITEMS.dashboard] },
        { title: 'HSE Workflow', items: [ALL_ITEMS.reports] },
        { title: 'Facilities', items: [ALL_ITEMS.sites] },
      ];
  }
}
