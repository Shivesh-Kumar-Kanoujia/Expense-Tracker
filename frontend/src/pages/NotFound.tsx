import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={
        <svg className="w-32 h-32 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      }
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      action={{
        label: "Back to dashboard",
        onClick: () => navigate("/", { replace: true }),
        variant: "primary",
      }}
    />
  );
}
