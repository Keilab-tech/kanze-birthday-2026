import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* BeforeInstallPromptEvent is not in the TS DOM lib yet */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Status = "idle" | "showing" | "ios" | "hidden";

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window.navigator as unknown as { standalone?: boolean }).standalone;

export default function PWAInstallPrompt() {
  const [status, setStatus]       = useState<Status>("idle");
  const [deferredEvt, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    /* Already installed → don't show */
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    /* iOS — no beforeinstallprompt; show manual instructions */
    if (isIOS()) {
      const timer = setTimeout(() => setStatus("ios"), 1800);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setStatus("showing");
    };
    window.addEventListener("beforeinstallprompt", handler);

    /* Show iOS-style message in case event never fires (some desktop browsers) */
    const fallback = setTimeout(() => {
      setStatus((s) => (s === "idle" ? "showing" : s));
    }, 2200);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredEvt) {
      await deferredEvt.prompt();
      const { outcome } = await deferredEvt.userChoice;
      if (outcome === "accepted") setStatus("hidden");
      else setStatus("hidden");
    } else {
      /* Fallback: nothing to prompt — hide */
      setStatus("hidden");
    }
  };

  const dismiss = () => setStatus("hidden");

  if (installed || status === "hidden" || status === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="pwa-prompt"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none"
        style={{ maxWidth: 460, margin: "0 auto", left: 0, right: 0 }}
      >
        <div
          className="w-full rounded-3xl px-5 py-4 flex items-center gap-4 pointer-events-auto"
          style={{
            background: "linear-gradient(135deg, hsl(340,60%,14%) 0%, hsl(280,45%,12%) 100%)",
            border: "1px solid hsl(340,50%,35%)",
            boxShadow: "0 8px 40px hsl(340,60%,20% / 0.55), 0 0 0 1px hsl(340,40%,20% / 0.4)",
          }}
        >
          {/* App icon */}
          <img
            src="/icon-192.png"
            alt="Kanze"
            className="w-14 h-14 rounded-2xl flex-shrink-0"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
          />

          {/* Text */}
          <div className="flex-1 min-w-0">
            {status === "ios" ? (
              <>
                <p className="font-semibold text-sm" style={{ color: "hsl(340,85%,85%)" }}>
                  Install Kanze App
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: "hsl(340,40%,70%)" }}>
                  Tap <span style={{ color: "#fff" }}>Share ↑</span> then{" "}
                  <span style={{ color: "#fff" }}>"Add to Home Screen"</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm" style={{ color: "hsl(340,85%,85%)" }}>
                  Install Kanze App
                </p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(340,40%,70%)" }}>
                  Add to your home screen for the full experience
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {status !== "ios" && (
              <button
                onClick={handleInstall}
                data-testid="button-pwa-install"
                className="rounded-xl px-4 py-1.5 text-xs font-bold transition-opacity hover:opacity-85"
                style={{
                  background: "linear-gradient(135deg, hsl(340,70%,60%), hsl(300,60%,55%))",
                  color: "#fff",
                  boxShadow: "0 2px 10px hsl(340,60%,40% / 0.5)",
                }}
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              data-testid="button-pwa-dismiss"
              className="rounded-xl px-4 py-1 text-xs transition-opacity hover:opacity-75"
              style={{ color: "hsl(340,30%,60%)" }}
            >
              Later
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
