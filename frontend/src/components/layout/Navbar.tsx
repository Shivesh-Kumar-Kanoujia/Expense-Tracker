import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  User,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  BellOff,
  Search,
  PlusCircle,
  Settings,
  Download,
} from "lucide-react";
import type { Notification, NotificationType } from "@/context/NotificationContext";

function getTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

interface NavbarProps {
  onMenuToggle: () => void;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-success" />,
  error: <AlertCircle className="h-4 w-4 text-error" />,
  info: <Info className="h-4 w-4 text-info" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
};

const typeBorders: Record<NotificationType, string> = {
  success: "border-l-success",
  error: "border-l-error",
  info: "border-l-info",
  warning: "border-l-warning",
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onMarkRead(notification.id)}
      className={cn(
        "w-full text-left flex gap-3 px-4 py-3 transition-colors duration-fast hover:bg-bg-card-hover",
        !notification.read && "bg-accent-light/5",
        "border-l-2",
        typeBorders[notification.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{typeIcons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", notification.read ? "text-text-secondary" : "text-text font-medium")}>
          {notification.title}
        </p>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-text-muted mt-1">{timeAgo(notification.timestamp)}</p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 mt-1.5">
          <div className="h-2 w-2 rounded-full bg-accent" />
        </div>
      )}
    </button>
  );
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState({ right: 0, top: 0 });
  const [dropdownPos, setDropdownPos] = useState({ right: 0, top: 0 });
  const [hidden, setHidden] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const lastScrollY = useRef(0);
  const theme = useSyncExternalStore(subscribeToTheme, getTheme);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setHidden(true);
        setDropdownOpen(false);
        setNotifOpen(false);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !dropdownMenuRef.current?.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node) &&
        !notifMenuRef.current?.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event("storage"));
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const glowClass = "hover:shadow-[0_0_14px_-3px_var(--color-accent)]";

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-toast focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:font-medium">
        Skip to main content
      </a>
      <header
        className={cn(
          "relative h-header flex items-center justify-between px-4 lg:px-8 sticky top-0 z-sticky transition-all duration-300 glass shadow-lg",
          hidden && "translate-y-[-100%]"
        )}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50 pointer-events-none" />

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-3 -ml-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link to="/expenses" className="lg:hidden p-3 -ml-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors" aria-label="Search expenses">
            <Search className="h-5 w-5" />
          </Link>

          <div className="hidden sm:block w-[35%] min-w-[200px] max-w-md mx-2 lg:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search expenses, categories, merchants..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "w-full bg-bg-card-hover/50 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition-all duration-300",
                  searchFocused ? "border-accent ring-[3px] ring-accent/20 shadow-lg shadow-accent/5 scale-[1.02]" : "border-border hover:border-border-strong"
                )}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-card-hover rounded border border-border">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <motion.button
            onClick={toggleTheme}
            className={cn(
              "relative h-9 w-9 sm:w-[72px] rounded-full bg-bg-card-hover border border-border transition-all duration-300 flex-shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              glowClass
            )}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center justify-center h-full w-full sm:hidden">
              {theme === "light" ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-accent" />}
            </span>
            <motion.div
              className="absolute top-0.5 left-0.5 h-8 w-8 rounded-full bg-accent hidden sm:flex items-center justify-center shadow-sm"
              animate={{ x: theme === "dark" ? 38 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {theme === "light" ? (
                <Moon className="h-3.5 w-3.5 text-white" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-white" />
              )}
            </motion.div>
          </motion.button>



          {user ? (
            <>
              <Link
                to="/add"
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-fast group flex-shrink-0",
                  glowClass
                )}
              >
                <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Add</span>
              </Link>

              <div className="relative" ref={notifRef}>
                <button
                  ref={notifBtnRef}
                  onClick={() => {
                    if (!notifOpen) {
                      const rect = notifBtnRef.current?.getBoundingClientRect();
                      if (rect) {
                        setNotifPos({
                          right: window.innerWidth >= 640 ? window.innerWidth - rect.right : 16,
                          top: rect.bottom + 8,
                        });
                      }
                    }
                    setNotifOpen((p) => !p);
                  }}
                  className={cn(
                    "p-3 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent relative",
                    glowClass
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && createPortal(
                  <div
                    ref={notifMenuRef}
                    className="fixed sm:w-96 bg-bg-card border border-border rounded-xl shadow-xl z-[999]"
                    style={{
                      left: window.innerWidth < 640 ? 16 : undefined,
                      right: notifPos.right,
                      top: notifPos.top,
                    }}
                    role="menu"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-text">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                          <BellOff className="h-8 w-8 text-text-muted mb-2" />
                          <p className="text-sm text-text-secondary">No notifications yet</p>
                          <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={markAsRead}
                          />
                        ))
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  ref={profileBtnRef}
                  onClick={() => {
                    if (!dropdownOpen) {
                      const rect = profileBtnRef.current?.getBoundingClientRect();
                      if (rect) {
                        setDropdownPos({
                          right: window.innerWidth - rect.right,
                          top: rect.bottom + 8,
                        });
                      }
                    }
                    setDropdownOpen((prev) => !prev);
                  }}
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-1 py-2 rounded-lg hover:bg-bg-card-hover transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    glowClass
                  )}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                    {initials || <User className="h-4 w-4" />}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-text">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </button>

                  {dropdownOpen && createPortal(
                  <div
                    ref={dropdownMenuRef}
                    className="fixed w-48 bg-bg-card border border-border rounded-xl shadow-xl py-1 z-[999]"
                    style={{ right: dropdownPos.right, top: dropdownPos.top }}
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-bg-card-hover transition-colors duration-fast"
                      role="menuitem"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        try {
                          const { getExpenses } = await import("@/api/expenses");
                          const res = await getExpenses({ per_page: 10000, sort_field: "date", sort_order: "desc" });
                          const rows = res.expenses ?? [];
                          const csv = [
                            ["Date", "Description", "Category", "Amount"].join(","),
                            ...rows.map((e: any) =>
                              [`"${e.date}"`, `"${(e.description || "").replace(/"/g, '""')}"`, `"${e.category}"`, e.amount].join(",")
                            ),
                          ].join("\n");
                          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "expenses.csv";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {}
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-bg-card-hover transition-colors duration-fast"
                      role="menuitem"
                    >
                      <Download className="h-4 w-4" />
                      Export Data
                    </button>
                    <hr className="border-border mx-2 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error-light/20 transition-colors duration-fast"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                    </div>,
                    document.body
                  )}
                </div>
              </>
            ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors duration-fast rounded-xl hover:bg-bg-card-hover"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover shadow-md hover:shadow-lg transition-all duration-fast rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
