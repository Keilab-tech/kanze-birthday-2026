import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* Capture the event as early as possible — before React mounts */
let _deferred: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferred = e as BeforeInstallPromptEvent;
});

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

type InstallStatus = "gate" | "ios-instructions" | "installed" | "installing";

interface Props {
  children: React.ReactNode;
}

export default function PWAInstallGate({ children }: Props) {
  const [status, setStatus] = useState<InstallStatus>(() =>
    isStandalone() ? "installed" : "gate"
  );

  useEffect(() => {
    const handler = () => setStatus("installed");
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  useEffect(() => {
    const check = () => { if (isStandalone()) setStatus("installed"); };
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  const handleInstall = async () => {
    if (isIOS()) { setStatus("ios-instructions"); return; }
    if (_deferred) {
      setStatus("installing");
      await _deferred.prompt();
      const { outcome } = await _deferred.userChoice;
      setStatus(outcome === "accepted" ? "installed" : "gate");
    } else {
      setStatus("ios-instructions");
    }
  };

  if (status === "installed") return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="install-gate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
        style={{
          background: "linear-gradient(160deg, hsl(340,95%,97%) 0%, hsl(350,80%,93%) 50%, hsl(20,90%,95%) 100%)",
        }}
      >
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "hsl(340 80% 85% / 0.35)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "hsl(10 80% 85% / 0.3)", filter: "blur(50px)" }} />

        <div className="relative z-10 flex flex-col items-center px-8 text-center gap-6 max-w-xs w-full">

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
          >
            <img
              src="/icon-192.png"
              alt="Kanze"
              className="w-28 h-28 rounded-[2rem] shadow-2xl"
              style={{ boxShadow: "0 12px 40px hsl(340 70% 60% / 0.35)" }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="flex flex-col gap-2"
          >
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "'Dancing Script', cursive",
                background: "linear-gradient(135deg, hsl(340,80%,50%), hsl(10,75%,58%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Kanze's Birthday
            </h1>
            <p className="text-sm leading-relaxed"
              style={{ color: "hsl(340, 40%, 45%)", fontFamily: "'Quicksand', sans-serif" }}>
              {status === "ios-instructions"
                ? "Follow the steps below to install"
                : "Install the app on your phone to open your birthday surprise 🎂"}
            </p>
          </motion.div>

          <AnimatePresence>
            {status === "ios-instructions" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-2xl p-4 text-left flex flex-col gap-3"
                style={{
                  background: "hsl(0 0% 100% / 0.7)",
                  border: "1px solid hsl(340 50% 85%)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {[
                  { n: "1", t: "Tap the Share icon at the bottom of Safari (box with arrow ↑)" },
                  { n: "2", t: 'Scroll down and tap "Add to Home Screen"' },
                  { n: "3", t: 'Tap "Add" in the top-right corner' },
                  { n: "4", t: "Open the Kanze app from your home screen 💖" },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: "hsl(340, 70%, 65%)", color: "white" }}>{n}</div>
                    <p className="text-sm leading-snug"
                      style={{ color: "hsl(340, 35%, 35%)", fontFamily: "'Quicksand', sans-serif" }}>{t}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status !== "ios-instructions" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full flex flex-col gap-3"
              >
                <motion.button
                  onClick={handleInstall}
                  disabled={status === "installing"}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white"
                  style={{
                    background: status === "installing"
                      ? "hsl(340, 40%, 70%)"
                      : "linear-gradient(135deg, hsl(340,72%,58%) 0%, hsl(350,68%,54%) 100%)",
                    boxShadow: "0 6px 24px hsl(340 70% 55% / 0.4)",
                    fontFamily: "'Quicksand', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  {status === "installing" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Installing…
                    </span>
                  ) : (isIOS() ? "How to Install ↑" : "Download & Install App")}
                </motion.button>
                <p className="text-[11px]"
                  style={{ color: "hsl(340, 30%, 60%)", fontFamily: "'Quicksand', sans-serif" }}>
                  Free · No account required · Private
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {status === "ios-instructions" && (
            <button onClick={() => setStatus("gate")} className="text-xs underline"
              style={{ color: "hsl(340, 40%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
              ← Back
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
