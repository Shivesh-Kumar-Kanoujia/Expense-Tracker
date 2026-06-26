import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, options?: { action?: Toast["action"]; duration?: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = "info",
    options?: { action?: Toast["action"]; duration?: number }
  ) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    const toast: Toast = { id, message, type, ...options };
    setToasts((prev) => [...prev, toast]);

    const duration = options?.duration ?? (type === "error" ? 6000 : 4000);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-toast flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

const typeStyles = {
  success: "bg-success text-white",
  error: "bg-error text-white",
  info: "bg-info text-white",
  warning: "bg-warning text-white",
};

const typeIcons = {
  success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  info: <Info className="h-5 w-5 flex-shrink-0" />,
  warning: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border border-border/50 min-w-[300px] max-w-md",
        typeStyles[toast.type]
      )}
      role="alert"
      aria-live="assertive"
    >
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {typeIcons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-current"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/20 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}