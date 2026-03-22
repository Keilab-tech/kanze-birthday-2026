import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _deferred: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferred = e as BeforeInstallPromptEvent;
});

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

type InstallStatus = "gate" | "downloaded" | "installed";

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

  const handleDownload = async () => {
    /* Fire native install prompt in background if available — don't wait on it */
    if (_deferred) {
      _deferred.prompt().catch(() => {});
    }
    /* Always immediately show the "downloaded" confirmation */
    setStatus("downloaded");
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
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "hsl(340 80% 85% / 0.35)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "hsl(10 80% 85% / 0.3)", filter: "blur(50px)" }} />

        <div className="relative z-10 flex flex-col items-center px-8 text-center gap-6 max-w-xs w-full">

          {/* App icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
          >
            <div className="relative">
              <img
                src="/icon-192.png"
                alt="Kanze"
                className="w-28 h-28 rounded-[2rem] shadow-2xl"
                style={{ boxShadow: "0 12px 40px hsl(340 70% 60% / 0.35)" }}
              />
              <AnimatePresence>
                {status === "downloaded" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
                    className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(142, 72%, 50%)", boxShadow: "0 2px 12px hsl(142 60% 40% / 0.5)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Title + message */}
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

            <AnimatePresence mode="wait">
              {status === "gate" && (
                <motion.p
                  key="gate-msg"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(340, 40%, 45%)", fontFamily: "'Quicksand', sans-serif" }}
                >
                  Install the app on your phone to open your birthday surprise 🎂
                </motion.p>
              )}
              {status === "downloaded" && (
                <motion.p
                  key="downloaded-msg"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm leading-relaxed font-semibold"
                  style={{ color: "hsl(142, 55%, 38%)", fontFamily: "'Quicksand', sans-serif" }}
                >
                  App downloaded successfully ✓
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Buttons */}
          <AnimatePresence mode="wait">
            {status === "gate" && (
              <motion.div
                key="gate-btn"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full flex flex-col gap-3"
              >
                <motion.button
                  onClick={handleDownload}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white"
                  style={{
                    background: "linear-gradient(135deg, hsl(340,72%,58%) 0%, hsl(350,68%,54%) 100%)",
                    boxShadow: "0 6px 24px hsl(340 70% 55% / 0.4)",
                    fontFamily: "'Quicksand', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  Download App
                </motion.button>
                <p className="text-[11px]"
                  style={{ color: "hsl(340, 30%, 60%)", fontFamily: "'Quicksand', sans-serif" }}>
                  Free · No account required · Private
                </p>
              </motion.div>
            )}

            {status === "downloaded" && (
              <motion.div
                key="open-btn"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-full flex flex-col gap-3"
              >
                <motion.button
                  onClick={() => setStatus("installed")}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white"
                  style={{
                    background: "linear-gradient(135deg, hsl(340,72%,58%) 0%, hsl(350,68%,54%) 100%)",
                    boxShadow: "0 6px 24px hsl(340 70% 55% / 0.4)",
                    fontFamily: "'Quicksand', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  Open App 💖
                </motion.button>
                <p className="text-[11px]"
                  style={{ color: "hsl(340, 30%, 60%)", fontFamily: "'Quicksand', sans-serif" }}>
                  Tap to begin your birthday experience
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
