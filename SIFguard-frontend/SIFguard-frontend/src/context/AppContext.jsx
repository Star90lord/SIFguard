import React, { createContext, useContext, useState, useMemo } from 'react';
import { ROLES, ROLE_DEFINITIONS } from '../config/roles';

const AppContext = createContext(null);

const DEFAULT_USERS = {
  [ROLES.ADMIN]: {
    name: 'HSE Administrator',
    email: 'hse.admin@oilindia.example',
    phone: '+91 94350 12345',
    role: ROLES.ADMIN,
    department: 'HSE Operations Division',
    organization: 'Oil India Limited (OIL)',
    initials: 'HA',
    defaultSite: 'ALL',
    defaultRange: 'THIS_MONTH',
  },
  [ROLES.MANAGER]: {
    name: 'HSE Manager',
    email: 'hse.manager@oilindia.example',
    phone: '+91 94350 67890',
    role: ROLES.MANAGER,
    department: 'Field Safety Monitoring',
    organization: 'Oil India Limited (OIL)',
    initials: 'HM',
    defaultSite: 'rig-site-b',
    defaultRange: 'THIS_MONTH',
  },
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
  // Current user state (defaults to Administrator)
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[ROLES.ADMIN]);

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

  // Switch role between ADMIN and MANAGER for live demo
  function switchRole(targetRole) {
    if (DEFAULT_USERS[targetRole]) {
      setCurrentUser(DEFAULT_USERS[targetRole]);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        role: targetRole,
        initials: targetRole === ROLES.ADMIN ? 'HA' : 'HM',
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

  const value = {
    currentUser,
    updateProfile,
    switchRole,
    roleDefinition: ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS[ROLES.MANAGER],
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    notificationPreferences,
    togglePreference,
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
