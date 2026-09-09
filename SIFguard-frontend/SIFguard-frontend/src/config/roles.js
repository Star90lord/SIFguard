/**
 * SIFguard Centralized Frontend Role & Access Control Configuration
 * Defines access privileges and helper functions for HSE Manager and Administrator roles.
 * Note: Frontend demonstration layer for SIH 2026.
 */

export const ROLES = {
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
};

export const ROLE_DEFINITIONS = {
  [ROLES.MANAGER]: {
    key: ROLES.MANAGER,
    label: 'HSE Manager',
    badgeText: 'HSE Manager',
    accessLevel: 'Operational Access',
    description: 'Operational safety monitoring, reporting, barrier review, and hazard intervention.',
    canAdminister: false,
  },
  [ROLES.ADMIN]: {
    key: ROLES.ADMIN,
    label: 'Administrator',
    badgeText: 'Administrator',
    accessLevel: 'Full Access',
    description: 'System administration, site configuration, safety classification parameters, and role directory.',
    canAdminister: true,
  },
};

/**
 * Checks if a user has a specific role
 */
export function hasRole(user, role) {
  if (!user || !user.role) return false;
  return user.role === role;
}

/**
 * Checks if a user can access administration console
 */
export function canAccessAdmin(user) {
  if (!user || !user.role) return false;
  return user.role === ROLES.ADMIN;
}
