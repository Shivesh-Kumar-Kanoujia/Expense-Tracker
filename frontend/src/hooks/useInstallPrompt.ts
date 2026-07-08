import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "installPromptDismissed";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isDismissed() {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    return Date.now() - Number(val) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [promptSeen, setPromptSeen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    markDismissed();
    setDeferredPrompt(null);
    setPromptSeen(true);
  }, []);

  const showPrompt = !isInstalled && !isDismissed() && !promptSeen;

  return {
    install,
    dismiss,
    showPrompt,
    isInstallable: !!deferredPrompt,
    isIOS: isIOS(),
  };
}
