import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("max-w-container mx-auto px-3 lg:px-8 pt-6 lg:pt-10 pb-6 lg:pb-8", className)}>
      {children}
    </div>
  );
}
