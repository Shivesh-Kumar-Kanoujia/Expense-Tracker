import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  variant = "text",
  width,
  height,
  animation = "pulse",
  className,
  ...props
}: SkeletonProps) {
  const baseStyles = "bg-text-muted/10 rounded overflow-hidden";
  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-[wave_1.5s_ease-in-out_infinite]",
    none: "",
  };

  const variantStyles = {
    text: "h-4 rounded-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: { className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-4 p-6 glass rounded-xl", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangular" width="40%" height="24px" />
        <Skeleton variant="circular" width="40px" height="40px" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width="30%" height="32px" />
        <Skeleton variant="rectangular" width="30%" height="32px" />
        <Skeleton variant="rectangular" width="30%" height="32px" />
      </div>
    </div>
  );
}

export function SkeletonChart({ type = "bar", className, ...props }: { type?: "bar" | "doughnut" } & Omit<SkeletonProps, "variant">) {
  if (type === "doughnut") {
    return (
      <div className={cn("flex flex-col items-center gap-6 py-8", className)} {...props}>
        <Skeleton variant="circular" width="200px" height="200px" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="80px" height="24px" />
          ))}
        </div>
      </div>
    );
  }

  const barHeights = [120, 80, 160, 60, 200, 100, 140];

  return (
    <div className={cn("flex items-end gap-3 py-6 px-4", className)} {...props}>
      {barHeights.map((h, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          width="100%"
          height={`${h}px`}
          className="flex-1"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: { rows?: number; columns?: number } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="px-4 py-3">
                  <Skeleton variant="text" width={col === 0 ? "100px" : "80%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}