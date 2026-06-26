import { Outlet } from "react-router-dom";
import { PiggyBank } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)",
          backgroundSize: "30px 30px"
        }} />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-accent/10 mb-4">
            <PiggyBank className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Expense Tracker</h1>
          <p className="text-text-secondary mt-1">Manage your finances with ease</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
