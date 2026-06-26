import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "accent";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  dotColor?: string;
}

const variantStyles = {
  default: "bg-text-muted/10 text-text",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-error-light text-error",
  info: "bg-info-light text-info",
  outline: "bg-transparent border border-border text-text-secondary",
  accent: "bg-accent-light text-accent",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = "default", size = "md", dot = false, dotColor, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full transition-colors duration-fast",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("rounded-full flex-shrink-0", {
              "w-1.5 h-1.5": size === "sm",
              "w-2 h-2": size === "md",
              "w-2.5 h-2.5": size === "lg",
            })}
            style={{ backgroundColor: dotColor || "currentColor" }}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";