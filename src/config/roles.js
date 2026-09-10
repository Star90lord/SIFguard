/**
 * SIFguard Centralized Frontend Role & Access Control Configuration
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for:
 *   - Granular permission identifiers
 *   - Three canonical HSE roles and their capability mappings
 *   - Navigation model per role
 *   - Authorization utility functions
 *
 * Roles:
 *   ADMINISTRATOR       — Full system + HSE administration
 *   HSE_MANAGER         — Operational safety monitoring & decision support
 *   SITE_SAFETY_OFFICER — Site-level safety operations & field work
 */

// ─── Granular Permissions ───────────────────────────────────────────
export const PERMISSIONS = {
  // Dashboard & Overview
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',

  // HSE Workflow
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_REVIEW_QUEUE: 'VIEW_REVIEW_QUEUE',
  VIEW_ANALYZE_REPORTS: 'VIEW_ANALYZE_REPORTS',
  SUBMIT_REPORTS: 'SUBMIT_REPORTS',

  // Intelligence & Analysis
  VIEW_SITE_COMPARISON: 'VIEW_SITE_COMPARISON',
  VIEW_HAZARD_COMPARISON: 'VIEW_HAZARD_COMPARISON',

  // Actions
  VIEW_ACTIONS: 'VIEW_ACTIONS',
  MANAGE_ACTIONS: 'MANAGE_ACTIONS',

  // Facilities
  VIEW_SITES: 'VIEW_SITES',
  MANAGE_SITES: 'MANAGE_SITES',

  // System
  VIEW_SETTINGS: 'VIEW_SETTINGS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_ADMIN: 'VIEW_ADMIN',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_SAFETY_PARAMETERS: 'MANAGE_SAFETY_PARAMETERS',
};

// Backward-compat alias
PERMISSIONS.SUBMIT_SAFETY_REPORT = PERMISSIONS.SUBMIT_REPORTS;

// ─── Standardized HSE Roles ─────────────────────────────────────────
export const ROLES = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  HSE_MANAGER: 'HSE_MANAGER',
  SITE_SAFETY_OFFICER: 'SITE_SAFETY_OFFICER',

  // Backward-compatibility aliases
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
    description:
      'Complete administrative access across users, sites, report submissions, analytics, system configuration, and audit settings.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_REVIEW_QUEUE,
      PERMISSIONS.VIEW_ANALYZE_REPORTS,
      PERMISSIONS.SUBMIT_REPORTS,
      PERMISSIONS.VIEW_SITE_COMPARISON,
      PERMISSIONS.VIEW_HAZARD_COMPARISON,
      PERMISSIONS.VIEW_ACTIONS,
      PERMISSIONS.MANAGE_ACTIONS,
      PERMISSIONS.VIEW_SITES,
      PERMISSIONS.MANAGE_SITES,
      PERMISSIONS.VIEW_SETTINGS,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.VIEW_ADMIN,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_SAFETY_PARAMETERS,
    ],
    canAdminister: true,
    canSubmitReports: true,
  },

  [ROLES.HSE_MANAGER]: {
    key: ROLES.HSE_MANAGER,
    label: 'HSE Manager',
    badgeText: 'HSE Manager',
    accessLevel: 'Operational Safety Supervision',
    description:
      'Operational safety oversight, dashboard, reports, review queue, site comparison, hazard comparison, and corrective actions.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_REVIEW_QUEUE,
      PERMISSIONS.VIEW_ANALYZE_REPORTS,
      PERMISSIONS.VIEW_SITE_COMPARISON,
      PERMISSIONS.VIEW_HAZARD_COMPARISON,
      PERMISSIONS.VIEW_ACTIONS,
      PERMISSIONS.MANAGE_ACTIONS,
      PERMISSIONS.VIEW_SITES,
    ],
    canAdminister: false,
    canSubmitReports: false,
  },

  [ROLES.SITE_SAFETY_OFFICER]: {
    key: ROLES.SITE_SAFETY_OFFICER,
    label: 'Site Safety Officer',
    badgeText: 'Site Safety Officer',
    accessLevel: 'Site Safety Operations',
    description:
      'Site-level safety work, report review, site monitoring, risk analysis, and assigned corrective actions.',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_REVIEW_QUEUE,
      PERMISSIONS.VIEW_ANALYZE_REPORTS,
      PERMISSIONS.VIEW_ACTIONS,
      PERMISSIONS.VIEW_SITES,
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
  return hasPermission(user, PERMISSIONS.VIEW_ADMIN);
}

/**
 * Checks if a user can submit or upload safety reports
 */
export function canSubmitReports(user) {
  return hasPermission(user, PERMISSIONS.SUBMIT_REPORTS);
}

/**
 * Checks if a user can manage sites (add/edit/change status)
 */
export function canManageSites(user) {
  return hasPermission(user, PERMISSIONS.MANAGE_SITES);
}

/**
 * Checks if a user can access the settings page
 */
export function canAccessSettings(user) {
  return hasPermission(user, PERMISSIONS.VIEW_SETTINGS);
}

/**
 * Checks if a user can manage system settings
 */
export function canManageSettings(user) {
  return hasPermission(user, PERMISSIONS.MANAGE_SETTINGS);
}

/**
 * Provides the role-aware navigation model.
 * Each item maps to a required permission for sidebar rendering.
 */
export const NAV_ITEMS = {
  dashboard: {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  review: {
    to: '/review',
    label: 'Review Queue',
    icon: 'ClipboardCheck',
    permission: PERMISSIONS.VIEW_REVIEW_QUEUE,
  },
  reports: {
    to: '/reports',
    label: 'Safety Reports',
    icon: 'ClipboardList',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  submit: {
    to: '/submit',
    label: 'Analyze Reports',
    icon: 'FileSearch',
    permission: PERMISSIONS.VIEW_ANALYZE_REPORTS,
  },
  compare: {
    to: '/sites/compare',
    label: 'Site Comparison',
    icon: 'Repeat',
    permission: PERMISSIONS.VIEW_SITE_COMPARISON,
  },
  hazard: {
    to: '/compare/hazard',
    label: 'Hazard Comparison',
    icon: 'SlidersHorizontal',
    permission: PERMISSIONS.VIEW_HAZARD_COMPARISON,
  },
  sites: {
    to: '/sites',
    label: 'Sites Directory',
    icon: 'Building2',
    permission: PERMISSIONS.VIEW_SITES,
  },
  settings: {
    to: '/settings',
    label: 'Settings',
    icon: 'Settings',
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
  admin: {
    to: '/admin',
    label: 'Admin',
    icon: 'ShieldCheck',
    permission: PERMISSIONS.VIEW_ADMIN,
  },
};

/**
 * Navigation sections definition. Each section has items with permission gates.
 */
export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [NAV_ITEMS.dashboard],
  },
  {
    title: 'HSE Workflow',
    items: [NAV_ITEMS.review, NAV_ITEMS.reports],
  },
  {
    title: 'Intelligence & Analysis',
    items: [NAV_ITEMS.submit, NAV_ITEMS.compare, NAV_ITEMS.hazard],
  },
  {
    title: 'Facilities',
    items: [NAV_ITEMS.sites],
  },
  {
    title: 'System',
    items: [NAV_ITEMS.settings, NAV_ITEMS.admin],
  },
];

/**
 * Filters nav sections to only include items the user has permission for.
 * Removes empty sections after filtering.
 */
export function getFilteredNavSections(user) {
  if (!user) return [];
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(user, item.permission)),
  })).filter((section) => section.items.length > 0);
}

/**
 * Legacy: Provides the target navigation model corresponding to a role.
 * Kept for backward compatibility — prefer getFilteredNavSections(user).
 */
export function getRoleNavigation(role) {
  const norm = normalizeRole(role);
  const fakeUser = { role: norm };
  return getFilteredNavSections(fakeUser);
}
