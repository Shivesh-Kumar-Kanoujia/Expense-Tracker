import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Chatbot from "@/components/Chatbot";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Layout() {
  const { loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-80">
          <Skeleton variant="rectangular" height="40px" width="200px" className="mx-auto" />
          <div className="space-y-2">
            {[100, 80, 60].map((w, i) => (
              <Skeleton key={i} variant="text" width={`${w}%`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        collapsed ? "lg:ml-sidebar-collapsed" : "lg:ml-sidebar"
      )}>
        <Navbar onMenuToggle={() => setMobileOpen((p) => !p)} />
        <main id="main-content" className="flex-1 pb-24">
          <ErrorBoundary>
            <PageLayout>
              <Outlet />
            </PageLayout>
          </ErrorBoundary>
        </main>
      </div>
      <Chatbot />
      <InstallPrompt />
    </div>
  );
}
