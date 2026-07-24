import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Share2, Globe } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/Button";

export function InstallPrompt() {
  const { install, dismiss, showPrompt, isInstallable, isIOS } = useInstallPrompt();

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-4 bottom-6 z-toast max-w-md mx-auto"
        >
          <div className="glass rounded-2xl p-4 shadow-xl border border-border relative">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 h-6 w-6 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                {isInstallable ? (
                  <Download className="h-5 w-5 text-accent" />
                ) : (
                  <Smartphone className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">Install Expense Tracker</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {isInstallable
                    ? "Add to your home screen for quick access."
                    : "Tap Share then Add to Home Screen to install."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {isInstallable ? (
                <Button size="sm" onClick={install} fullWidth>
                  Install App
                </Button>
              ) : isIOS ? (
                <div className="flex items-center gap-1.5 text-xs text-text-muted bg-bg-card-hover/50 rounded-lg px-3 py-2 w-full">
                  <Share2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Safari Share menu <span className="hidden sm:inline">→ Add to Home Screen</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-text-muted bg-bg-card-hover/50 rounded-lg px-3 py-2 w-full">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Browser menu <span className="hidden sm:inline">→ Add to Home Screen</span></span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
