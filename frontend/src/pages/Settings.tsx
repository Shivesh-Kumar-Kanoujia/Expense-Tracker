import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { User, Palette, Globe, Moon, Sun, Bell, Shield, DollarSign, Smartphone, Monitor, Trash2, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { getSessions, revokeSession, revokeOtherSessions, type SessionInfo } from "@/api/auth";
import client from "@/api/client";

type Currency = "INR" | "USD" | "EUR" | "GBP";
type ThemeMode = "light" | "dark" | "system";

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
];

function SessionsList() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // silently fail — sessions are supplementary
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  if (!user) return null;

  const handleRevoke = async (id: number) => {
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("Session revoked", "success");
    } catch {
      showToast("Failed to revoke session", "error");
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await revokeOtherSessions();
      await fetchSessions();
      showToast("Other sessions revoked", "success");
    } catch {
      showToast("Failed to revoke sessions", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-bg-card-hover/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-text-secondary">No active sessions found.</p>;
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between p-4 bg-bg-card-hover/50 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-accent-light/10 text-accent flex-shrink-0">
              {s.device_info?.toLowerCase().includes("mobi") ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {s.device_info || "Unknown device"}
              </p>
              <p className="text-xs text-text-muted">
                {s.ip_address ? `${s.ip_address} · ` : ""}
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRevoke(s.id)}
            className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light/20 transition-colors flex-shrink-0"
            title="Revoke session"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {sessions.length > 1 && (
        <button
          type="button"
          onClick={handleRevokeOthers}
          className="text-xs text-text-muted hover:text-error transition-colors mt-2"
        >
          Revoke all other sessions
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("theme") as ThemeMode) || "dark");
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem("currency") as Currency) || "INR");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (theme === "system") {
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title="Settings" description="Manage your preferences" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-bg-card-hover/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold">
                  {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-text">{user.name}</p>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {user.email_verified ? (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-3.5 w-3.5" /> Email verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> Email not verified
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await client.post("/auth/resend-verification");
                          showToast("Verification email sent", "success");
                        } catch { showToast("Failed to send verification", "error"); }
                      }}
                      className="ml-1 text-accent hover:text-accent-hover inline-flex items-center gap-0.5"
                    >
                      <Send className="h-3 w-3" /> Resend
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                Account created on {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-bg-card-hover/50 rounded-lg text-center">
              <p className="text-text-secondary text-sm">
                Sign in to manage your profile settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your theme</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(["dark", "light", "system"] as ThemeMode[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-fast ${
                   theme === t
                     ? "border-accent bg-accent-light/10 text-accent"
                     : "border-border bg-bg-card-hover/30 text-text-secondary hover:border-text-muted"
                 }`}
              >
                {t === "light" ? <Sun className="h-6 w-6" /> : t === "dark" ? <Moon className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
                <span className="text-sm font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Currency</CardTitle>
              <CardDescription>Set your preferred currency</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { setCurrency(c.value); showToast(`Currency set to ${c.label}`, "success"); }}
                className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border-2 transition-all duration-fast ${
                   currency === c.value
                     ? "border-accent bg-accent-light/10 text-accent"
                     : "border-border bg-bg-card-hover/30 text-text-secondary hover:border-text-muted"
                }`}
              >
                <span className="text-xl font-bold">{c.symbol}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between p-4 bg-bg-card-hover/50 rounded-lg cursor-pointer">
            <div>
              <p className="text-sm font-medium text-text">Push Notifications</p>
              <p className="text-xs text-text-secondary">Get notified about spending updates</p>
            </div>
            <div
              role="switch"
              aria-checked={notifications}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setNotifications(!notifications); } }}
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                notifications ? "bg-accent" : "bg-text-muted/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-fast ${
                  notifications ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionsList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Account management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary mb-4">
            Your data is securely stored and encrypted. You can delete your account at any time.
          </p>
          <Button variant="danger" size="sm" disabled={!user}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
