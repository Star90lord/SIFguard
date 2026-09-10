/**
 * SIFguard Authentication API & Service Abstraction (Step 1 Foundation)
 *
 * Provides authentication services, session management, and development demo adapter.
 * Designed for immediate backend API replacement once production auth endpoints are available.
 */

import { ROLES, normalizeRole } from '../config/roles';

const SESSION_STORAGE_KEY = 'sifguard_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Standardized Oil India Limited (OIL) development demo user profiles.
 * Canonical internal roles: ADMINISTRATOR, HSE_MANAGER, SITE_SAFETY_OFFICER.
 * Note: Clearly labeled for development and evaluation environments only.
 */
export const DEMO_USERS = [
  {
    id: 'usr-admin-001',
    name: 'HSE Administrator',
    email: 'hse.admin@oilindia.example',
    phone: '+91 94350 12345',
    role: ROLES.ADMINISTRATOR,
    department: 'HSE Operations Division',
    organization: 'Oil India Limited (OIL)',
    siteAccess: 'ALL',
    siteIds: ['ALL'],
    initials: 'HA',
    defaultSite: 'ALL',
    defaultRange: 'THIS_MONTH',
    description: 'Full administrative access across facilities, reports, user administration, and system configuration.',
  },
  {
    id: 'usr-mgr-002',
    name: 'HSE Manager',
    email: 'hse.manager@oilindia.example',
    phone: '+91 94350 67890',
    role: ROLES.HSE_MANAGER,
    department: 'Field Safety Monitoring',
    organization: 'Oil India Limited (OIL)',
    siteAccess: 'ALL',
    siteIds: ['rig-site-a', 'rig-site-b', 'processing-unit', 'warehouse', 'workshop'],
    initials: 'HM',
    defaultSite: 'ALL',
    defaultRange: 'THIS_MONTH',
    description: 'Supervisory oversight for operational safety, review queue triage, and cross-site comparison.',
  },
  {
    id: 'usr-sso-003',
    name: 'Site Safety Officer',
    email: 'safety.officer@oilindia.example',
    phone: '+91 94350 33445',
    role: ROLES.SITE_SAFETY_OFFICER,
    department: 'Drilling & Rig Operations',
    organization: 'Oil India Limited (OIL)',
    siteAccess: 'rig-site-a',
    siteIds: ['rig-site-a'],
    initials: 'SO',
    defaultSite: 'rig-site-a',
    defaultRange: 'THIS_MONTH',
    description: 'Site-level safety work, report review, site monitoring, risk analysis, and assigned corrective actions.',
  },
];

// Standard demonstration password for dev environment
export const DEMO_PASSWORD = 'password';

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes user record to ensure canonical role representation
 */
function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const canonicalRole = normalizeRole(rawUser.role);
  return {
    id: rawUser.id || `usr-${Date.now()}`,
    name: rawUser.name || 'HSE Operator',
    email: (rawUser.email || '').toLowerCase().trim(),
    phone: rawUser.phone || '',
    role: canonicalRole,
    department: rawUser.department || 'HSE Division',
    organization: rawUser.organization || 'Oil India Limited (OIL)',
    siteAccess: rawUser.siteAccess || 'ALL',
    siteIds: rawUser.siteIds || (rawUser.siteAccess === 'ALL' ? ['ALL'] : [rawUser.siteAccess || 'ALL']),
    initials: rawUser.initials || 'OP',
    defaultSite: rawUser.defaultSite || 'ALL',
    defaultRange: rawUser.defaultRange || 'THIS_MONTH',
  };
}

/**
 * Retrieves the currently persisted session from localStorage or sessionStorage
 */
export function getCurrentSession() {
  try {
    // 1. Check persistent localStorage
    const localRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localRaw) {
      const session = JSON.parse(localRaw);
      if (session?.expiresAt && session.expiresAt > Date.now() && session.user) {
        return {
          ...session,
          user: normalizeUser(session.user),
        };
      }
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    // 2. Check session-scoped sessionStorage
    const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session?.expiresAt && session.expiresAt > Date.now() && session.user) {
        return {
          ...session,
          user: normalizeUser(session.user),
        };
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to parse active session:', err);
  }
  return null;
}

/**
 * Persists session data according to the "Keep me signed in" preference
 */
function saveSession(session) {
  const serialized = JSON.stringify(session);
  try {
    if (session.keepSignedIn) {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to persist session storage:', err);
  }
}

/**
 * Clears all active session storage tokens
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session storage:', err);
  }
}

/**
 * Authenticates user credentials.
 * Simulates network latency and verifies credentials against development accounts.
 *
 * @param {Object} credentials
 * @param {string} credentials.email - Operational email address
 * @param {string} credentials.password - User secret password
 * @param {boolean} [credentials.keepSignedIn=false] - Whether to persist across browser sessions
 * @returns {Promise<Object>} Normalized session payload
 */
export async function login({ email, password, keepSignedIn = false }) {
  await delay(450); // Simulate authenticating handshake

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Please provide both your operational email and password.');
  }

  // Find matching user in development accounts
  const matchedUser =
    DEMO_USERS.find((u) => u.email.toLowerCase() === cleanEmail) ||
    (cleanEmail === 'sso.field@oilindia.example' ? DEMO_USERS.find((u) => u.role === ROLES.SITE_SAFETY_OFFICER) : null);

  // In development, accept demo password or any password of 6+ chars for recognized demo accounts
  const isPasswordValid =
    cleanPassword === DEMO_PASSWORD ||
    cleanPassword === 'oilindia2026' ||
    cleanPassword === 'sifguard123' ||
    (matchedUser && cleanPassword.length >= 6);

  if (!matchedUser || !isPasswordValid) {
    throw new Error('Unable to sign in. Please check your credentials and try again.');
  }

  const normalized = normalizeUser(matchedUser);

  const session = {
    user: normalized,
    token: `sifguard_token_${normalized.role.toLowerCase()}_${Date.now()}`,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    keepSignedIn: Boolean(keepSignedIn),
  };

  saveSession(session);
  return session;
}

/**
 * Terminates user session and removes tokens
 */
export async function logout() {
  await delay(100);
  clearSession();
  return { success: true };
}

/**
 * Refreshes the existing session token
 */
export async function refreshSession() {
  const current = getCurrentSession();
  if (!current) return null;

  const refreshed = {
    ...current,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
  };
  saveSession(refreshed);
  return refreshed;
}
