import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  X,
  Menu,
  BarChart3,
  Settings,
  Receipt,
  Target,
} from "lucide-react";

const navSections = [
  {
    label: "Main",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/add", label: "Add Expense", icon: PlusCircle },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/categories", label: "Categories", icon: ListOrdered },
      { to: "/budgets", label: "Budgets", icon: Target },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted select-none">
      {label}
    </p>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-bg-card/70 backdrop-blur-glass border-r border-border flex flex-col transition-all duration-300",
          "lg:static lg:z-auto",
          collapsed ? "w-sidebar-collapsed" : "w-sidebar",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center h-header px-4 border-b border-border gap-3 flex-shrink-0">
          <motion.img layoutId="app-logo" src="/logo-Expense2.png" alt="Expense Tracker" transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="h-7 w-7 flex-shrink-0 object-contain" />
          {!collapsed && (
            <span className="font-bold text-text text-lg tracking-tight truncate">
              Expense Tracker
            </span>
          )}
          <button
            onClick={mobileOpen ? onMobileClose : onToggle}
            className="ml-auto lg:flex p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-1">
              <SectionLabel label={section.label} collapsed={collapsed} />
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card",
                      isActive
                        ? "text-primary bg-accent-light/15"
                        : "text-text-secondary hover:text-text hover:bg-bg-card-hover"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="sidebarIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-bg-card border border-border rounded-md text-xs text-text whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                          {item.label}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
