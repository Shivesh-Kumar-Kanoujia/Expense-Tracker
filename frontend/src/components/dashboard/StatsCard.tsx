import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";

interface Trend {
  direction: "up" | "down";
  value: string;
}

interface StatsCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: Trend;
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({ label, value, subtitle, trend, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden group hover:shadow-glass hover:-translate-y-1 transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-secondary">{label}</p>
            <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-text-muted">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-medium",
                    trend.direction === "up" ? "text-success" : "text-error"
                  )}
                >
                  {trend.direction === "up" ? (
                    <svg className="h-3.5 w-3.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 p-3 rounded-xl bg-accent-light/20 text-accent">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 50%)",
        }}
      />
    </Card>
  );
}
