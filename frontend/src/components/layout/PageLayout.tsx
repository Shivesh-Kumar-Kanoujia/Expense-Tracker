import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("max-w-container mx-auto px-4 lg:px-8 py-6 lg:py-8", className)}>
      {children}
    </div>
  );
}
