/**
 * SIFguard Authentication API & Service Layer
 *
 * Real PostgreSQL Database Authentication
 */

import { normalizeRole } from '../config/roles';

const SESSION_STORAGE_KEY = 'sifguard_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const NODE_BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Normalizes user record to ensure canonical role representation
 */
function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const canonicalRole = normalizeRole(rawUser.role);
  return {
    id: String(rawUser.id),
    name: rawUser.name || 'HSE Operator',
    email: (rawUser.email || '').toLowerCase().trim(),
    phone: rawUser.phone || '',
    role: canonicalRole,
    department: rawUser.department || 'Operations Division',
    organization: rawUser.organization || 'Oil India Limited (OIL)',
    siteAccess: rawUser.siteAccess || 'ALL',
    siteIds: rawUser.siteIds || (rawUser.siteAccess === 'ALL' ? ['ALL'] : [rawUser.siteAccess || 'ALL']),
    initials: (rawUser.name || 'OP')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    defaultSite: rawUser.defaultSite || 'ALL',
    defaultRange: rawUser.defaultRange || 'THIS_MONTH',
  };
}

/**
 * Retrieves the currently persisted session from localStorage or sessionStorage
 */
export function getCurrentSession() {
  try {
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
 * Authenticates user credentials strictly against the real PostgreSQL backend.
 */
export async function login({ email, password, keepSignedIn = false }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Please provide both your operational email and password.');
  }

  const response = await fetch(`${NODE_BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Authentication failed with status ${response.status}`);
  }

  if (!data.user) {
    throw new Error('Invalid user payload received from authentication server.');
  }

  const session = {
    user: normalizeUser(data.user),
    token: data.token,
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

/**
 * Validates whether the active session has not expired
 */
export function isSessionValid() {
  const session = getCurrentSession();
  return Boolean(session?.expiresAt && session.expiresAt > Date.now());
}
