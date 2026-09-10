import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { ROLES, ROLE_DEFINITIONS, hasPermission as checkPermission } from '../config/roles';
import { getMockSites } from '../data/mockData';
import { getSites, updateSite as apiUpdateSite, addSite as apiAddSite } from '../api/sifguardApi';
import {
  getCurrentSession,
  login as apiLogin,
  logout as apiLogout,
  DEMO_USERS,
} from '../api/authApi';

const AppContext = createContext(null);

const DEFAULT_USERS = {
  [ROLES.ADMINISTRATOR]: DEMO_USERS[0],
  [ROLES.HSE_MANAGER]: DEMO_USERS[1],
  [ROLES.SITE_SAFETY_OFFICER]: DEMO_USERS[2],
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'SIF_PRECURSOR',
    title: 'SIF Precursor Detected',
    location: 'Rig Site B',
    message: 'Potential fall exposure identified on monkey board during drill collar transfer. Barrier failure: Fall protection not verified.',
    timestamp: '09 Sep 2026 · 14:20',
    read: false,
    severity: 'critical',
    link: '/reports?site=rig-site-b&hazard=Fall&risk=SIF-Precursor',
  },
  {
    id: 'notif-2',
    type: 'HIGH_RISK',
    title: 'High Risk Report Logged',
    location: 'Rig Site B',
    message: 'Scaffold structural non-conformance logged. Decking boards unsecured on elevated staging.',
    timestamp: '09 Sep 2026 · 11:45',
    read: false,
    severity: 'high',
    link: '/reports?site=rig-site-b&risk=High',
  },
  {
    id: 'notif-3',
    type: 'BATCH_COMPLETED',
    title: 'Batch Screening Completed',
    location: 'Multi-Site Workspace',
    message: '5 safety reports screened across Rig Site A, Rig Site B, and Workshop. 2 high-severity signals identified.',
    timestamp: '09 Sep 2026 · 10:30',
    read: false,
    severity: 'info',
    link: '/submit',
  },
  {
    id: 'notif-4',
    type: 'BARRIER_FAILURE',
    title: 'Recurring Barrier Breakdown',
    location: 'Processing Unit',
    message: 'LOTO energy isolation verification missed during centrifugal pump maintenance.',
    timestamp: '08 Sep 2026 · 16:15',
    read: true,
    severity: 'warning',
    link: '/reports?site=processing-unit',
  },
];

const INITIAL_PREFERENCES = {
  highRiskAlerts: true,
  sifPrecursorAlerts: true,
  barrierFailureAlerts: true,
  newReports: true,
  batchCompleted: true,
  systemUpdates: true,
};

export function AppProvider({ children }) {
  // Current user state initialized from session or fallback
  const [currentUser, setCurrentUser] = useState(() => {
    const session = getCurrentSession();
    if (session?.user) {
      return session.user;
    }
    try {
      const savedRole = sessionStorage.getItem('sifguard_demo_role');
      if (savedRole && DEFAULT_USERS[savedRole]) {
        return DEFAULT_USERS[savedRole];
      }
    } catch (e) {
      // sessionStorage unavailable
    }
    return null;
  });

  const isAuthenticated = Boolean(currentUser);
  const currentRole = currentUser?.role || null;

  // Centralized login action
  const login = useCallback(async ({ email, password, keepSignedIn = false }) => {
    const session = await apiLogin({ email, password, keepSignedIn });
    if (session?.user) {
      setCurrentUser(session.user);
      try {
        sessionStorage.setItem('sifguard_demo_role', session.user.role);
      } catch (e) {}
    }
    return session;
  }, []);

  // Centralized logout action
  const logout = useCallback(async () => {
    await apiLogout();
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('sifguard_demo_role');
    } catch (e) {}
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

  // Switch role between canonical DEMO_USERS for development
  function switchRole(targetRole) {
    try {
      sessionStorage.setItem('sifguard_demo_role', targetRole);
    } catch (e) {}
    const found = DEMO_USERS.find((u) => u.role === targetRole) || DEFAULT_USERS[targetRole];
    if (found) {
      setCurrentUser(found);
    } else {
      setCurrentUser((prev) => ({
        ...(prev || DEFAULT_USERS[ROLES.ADMINISTRATOR]),
        role: targetRole,
      }));
    }
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
  const [sites, setSites] = useState(() => {
    try {
      return getMockSites();
    } catch {
      return [];
    }
  });

  const refreshSites = useCallback(async () => {
    try {
      const data = await getSites();
      if (data && Array.isArray(data)) {
        setSites(data);
      }
      return data;
    } catch (err) {
      console.error('Failed to refresh sites in AppContext:', err);
    }
  }, []);

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

  // Dynamically calculated Active Scope metrics
  const activeScope = useMemo(() => {
    const total = sites.length;
    const operational = sites.filter((s) => (s.status || '').toLowerCase() === 'active').length;
    const maintenance = sites.filter((s) => (s.status || '').toLowerCase() === 'maintenance').length;
    const offline = sites.filter((s) => (s.status || '').toLowerCase() === 'offline').length;
    return {
      total,
      operational,
      maintenance,
      offline,
      telemetry: 'Active',
    };
  }, [sites]);

  const value = {
    currentUser,
    isAuthenticated,
    currentRole,
    login,
    logout,
    updateProfile,
    switchRole,
    roleDefinition: currentUser?.role
      ? ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS[ROLES.ADMINISTRATOR]
      : ROLE_DEFINITIONS[ROLES.ADMINISTRATOR],
    hasPermission: (permission) => (currentUser ? checkPermission(currentUser, permission) : false),
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    notificationPreferences,
    togglePreference,
    theme,
    toggleTheme,
    setTheme,
    // Site state & actions
    sites,
    setSites,
    activeScope,
    updateSite,
    addSite,
    refreshSites,
  };

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
    switchRole,
    updateProfile,
  };
}

export function useSites() {
  const { sites, setSites, activeScope, updateSite, addSite, refreshSites } = useApp();
  return { sites, setSites, activeScope, updateSite, addSite, refreshSites };
}

export const useAppContext = useApp;
