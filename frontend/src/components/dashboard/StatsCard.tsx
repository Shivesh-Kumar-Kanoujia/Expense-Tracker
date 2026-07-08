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
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-text tracking-tight leading-none">{value}</p>
            <div className="flex items-center gap-2">
              {subtitle && (
                <p className="text-xs text-text-muted">{subtitle}</p>
              )}
              {trend && (
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
              )}
            </div>
          </div>
          {icon && (
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-accent-light/20 text-accent">
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
