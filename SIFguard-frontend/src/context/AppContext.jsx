import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  ROLES,
  ROLE_DEFINITIONS,
  hasPermission as checkPermission,
  normalizeRole,
} from '../config/roles';
import { getSites, updateSite as apiUpdateSite, addSite as apiAddSite } from '../api/sifguardApi';
import {
  getCurrentSession,
  login as apiLogin,
  logout as apiLogout,
} from '../api/authApi';

const AppContext = createContext(null);

const INITIAL_NOTIFICATIONS = [];

const INITIAL_PREFERENCES = {
  highRiskAlerts: true,
  sifPrecursorAlerts: true,
  barrierFailureAlerts: true,
  newReports: true,
  batchCompleted: true,
  systemUpdates: true,
};

export function AppProvider({ children }) {
  // Current user state initialized strictly from real authenticated session
  const [currentUser, setCurrentUser] = useState(() => {
    const session = getCurrentSession();
    return session?.user || null;
  });

  const isAuthenticated = Boolean(currentUser);
  const currentRole = currentUser?.role || null;

  // Centralized login action
  const login = useCallback(async ({ email, password, keepSignedIn = false }) => {
    const session = await apiLogin({ email, password, keepSignedIn });
    if (session?.user) {
      setCurrentUser(session.user);
    }
    return session;
  }, []);

  // Centralized logout action — clears session, auth, role, site scope
  const logout = useCallback(async () => {
    await apiLogout();
    setCurrentUser(null);
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notificationPreferences, setNotificationPreferences] = useState(INITIAL_PREFERENCES);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Update profile
  function updateProfile(updatedFields) {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      if (updatedFields.name) {
        const parts = updatedFields.name.trim().split(/\s+/);
        merged.initials =
          parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
      }
      return merged;
    });
  }

  // Update role on current authenticated profile
  function switchRole(targetRole) {
    setCurrentUser((prev) => (prev ? { ...prev, role: targetRole } : null));
  }

  // Notification actions
  function markAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  function togglePreference(key) {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // Theme state: 'light' | 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('sifguard-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('sifguard-theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  function toggleTheme() {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function setTheme(t) {
    if (t === 'dark' || t === 'light') setThemeState(t);
  }

  // ── Authoritative Shared Site State ──────────────────────────────
  const [sites, setSites] = useState([]);

  const refreshSites = useCallback(async () => {
    try {
      const data = await getSites();
      if (data && Array.isArray(data)) {
        setSites(data);
      }
      return data;
    } catch (err) {
      console.error('Failed to refresh sites in AppContext:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    refreshSites();
  }, [refreshSites]);

  const updateSite = useCallback(async (siteId, updatedData) => {
    try {
      const result = await apiUpdateSite(siteId, updatedData);
      const refreshed = await getSites();
      setSites(refreshed);
      return result;
    } catch (err) {
      console.error(`Failed to update site ${siteId} in AppContext:`, err);
      throw err;
    }
  }, []);

  const addSite = useCallback(async (newSiteData) => {
    try {
      const result = await apiAddSite(newSiteData);
      const refreshed = await getSites();
      setSites(refreshed);
      return result;
    } catch (err) {
      console.error('Failed to add site in AppContext:', err);
      throw err;
    }
  }, []);

  // ── Site Authorization & Scope Helpers ────────────────────────────
  const authorizedSiteIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.siteAccess === 'ALL' || (currentUser.siteIds && currentUser.siteIds.includes('ALL'))) {
      return sites.map((s) => s.id);
    }
    return currentUser.siteIds || (currentUser.siteAccess ? [currentUser.siteAccess] : []);
  }, [currentUser, sites]);

  const isAuthorizedForSite = useCallback(
    (siteId) => {
      if (!siteId) return false;
      if (!currentUser) return false;
      if (currentUser.siteAccess === 'ALL' || (currentUser.siteIds && currentUser.siteIds.includes('ALL'))) {
        return true;
      }
      return (currentUser.siteIds || []).includes(siteId) || currentUser.siteAccess === siteId;
    },
    [currentUser]
  );

  const authorizedSites = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.siteAccess === 'ALL' || (currentUser.siteIds && currentUser.siteIds.includes('ALL'))) {
      return sites;
    }
    const set = new Set(authorizedSiteIds);
    return sites.filter((s) => set.has(s.id));
  }, [currentUser, sites, authorizedSiteIds]);

  const hasUnrestrictedSiteAccess = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.siteAccess === 'ALL' || (currentUser.siteIds && currentUser.siteIds.includes('ALL'));
  }, [currentUser]);

  // Active Scope Counts for global indicator
  const activeScope = useMemo(() => {
    const total = sites.length;
    const active = sites.filter((s) => (s.status || '').toLowerCase() === 'active').length;
    const maintenance = sites.filter((s) => (s.status || '').toLowerCase() === 'maintenance').length;
    const offline = sites.filter((s) => (s.status || '').toLowerCase() === 'offline').length;
    return { total, active, maintenance, offline };
  }, [sites]);

  // RBAC Permission Checker
  const can = useCallback(
    (permissionKey) => {
      return checkPermission(currentRole, permissionKey);
    },
    [currentRole]
  );

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      currentRole,
      login,
      logout,
      roleDefinition: currentRole ? ROLE_DEFINITIONS[currentRole] || null : null,
      hasPermission: can,
      can,
      switchRole,
      updateProfile,
      // Theme
      theme,
      toggleTheme,
      setTheme,
      // Notifications
      notifications,
      unreadCount,
      notificationPreferences,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      togglePreference,
      // Shared Site State
      sites,
      setSites,
      refreshSites,
      updateSite,
      addSite,
      activeScope,
      // Site Authorization Scope
      authorizedSiteIds,
      isAuthorizedForSite,
      authorizedSites,
      hasUnrestrictedSiteAccess,
    }),
    [
      currentUser,
      isAuthenticated,
      currentRole,
      login,
      logout,
      can,
      theme,
      notifications,
      unreadCount,
      notificationPreferences,
      sites,
      refreshSites,
      updateSite,
      addSite,
      activeScope,
      authorizedSiteIds,
      isAuthorizedForSite,
      authorizedSites,
      hasUnrestrictedSiteAccess,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useAuth() {
  const {
    currentUser,
    isAuthenticated,
    currentRole,
    login,
    logout,
    roleDefinition,
    hasPermission,
    can,
    switchRole,
    updateProfile,
  } = useApp();
  return {
    currentUser,
    isAuthenticated,
    currentRole,
    login,
    logout,
    roleDefinition,
    hasPermission,
    can,
    switchRole,
    updateProfile,
  };
}

export function useAuthorization() {
  const {
    can,
    hasPermission,
    authorizedSiteIds,
    isAuthorizedForSite,
    authorizedSites,
    hasUnrestrictedSiteAccess,
    currentUser,
    currentRole,
  } = useApp();
  return {
    can,
    hasPermission,
    authorizedSiteIds,
    isAuthorizedForSite,
    authorizedSites,
    hasUnrestrictedSiteAccess,
    currentUser,
    currentRole,
  };
}

export function useSites() {
  const { sites, setSites, activeScope, updateSite, addSite, refreshSites, authorizedSites } = useApp();
  return { sites, setSites, activeScope, updateSite, addSite, refreshSites, authorizedSites };
}

export const useAppContext = useApp;
