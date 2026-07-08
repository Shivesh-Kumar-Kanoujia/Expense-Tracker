import React, { useState, useCallback, useMemo } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

let notifId = 0;

function generateId() {
  return `notif-${++notifId}-${Date.now()}`;
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "seed-1",
    title: "Monthly report ready",
    message: "Your spending summary for this month is available. Check your dashboard for details.",
    type: "info",
    timestamp: new Date(),
    read: false,
  },
  {
    id: "seed-2",
    title: "Budget alert: Food category",
    message: "You've used 85% of your monthly Food budget. Consider reducing dining expenses.",
    type: "warning",
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: "seed-3",
    title: "Expense reminder",
    message: "You haven't added any expenses today. Tap here to add your daily expenses.",
    type: "info",
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

  const addNotification = useCallback(
    (title: string, message: string, type: NotificationType = "info") => {
      const id = generateId();
      setNotifications((prev) => [
        { id, title, message, type, timestamp: new Date(), read: false },
        ...prev,
      ]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = React.useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
