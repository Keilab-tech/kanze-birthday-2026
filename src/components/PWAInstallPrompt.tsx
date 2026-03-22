import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const FLAG = "kanze-pwa-installed";

/* Capture the install prompt event as early as possible */
let _deferred: BeforeInstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferred = e as BeforeInstallPromptEvent;
});

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

/*
  Status flow:
  "gate"       → first visit, show Download button
  "waiting"    → native install prompt is open, user deciding
  "downloaded" → user accepted install, show Open App button
  "blocked"    → user already installed but opened website again → tell them to use the app
  "installed"  → running as PWA, show the real app
*/
type InstallStatus = "gate" | "waiting" | "downloaded" | "blocked" | "installed";

interface Props { children: React.ReactNode; }

export default function PWAInstallGate({ children }: Props) {
  const [status, setStatus] = useState<InstallStatus>(() => {
    if (isStandalone()) return "installed";
    if (localStorage.getItem(FLAG)) return "blocked";
    return "gate";
  });

  /* If app gets installed externally or window regains focus as standalone */
  useEffect(() => {
    const onInstalled = () => { localStorage.setItem(FLAG, "true"); setStatus("installed"); };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    const onFocus = () => { if (isStandalone()) { localStorage.setItem(FLAG, "true"); setStatus("installed"); } };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleDownload = async () => {
    if (!_deferred) {
      /* No native prompt available (already dismissed or unsupported) — mark installed anyway */
      localStorage.setItem(FLAG, "true");
      setStatus("downloaded");
      return;
    }
    setStatus("waiting");
    await _deferred.prompt();
    const { outcome } = await _deferred.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(FLAG, "true");
      setStatus("downloaded");
    } else {
      /* User cancelled — let them try again */
      setStatus("gate");
    }
  };

  /* Open the installed PWA — on Android Chrome, navigating to the origin
     triggers the installed app instead of loading in the browser */
  const handleOpenApp = () => {
    window.location.href = window.location.origin + "/";
  };

  /* Running as PWA — render app normally */
  if (status === "installed") return <>{children}</>;

  /* ─── Shared background wrapper ─── */
  return (
    <div
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

      <AnimatePresence mode="wait">

        {/* ── BLOCKED: already installed, opened website instead of app ── */}
        {status === "blocked" && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center px-8 text-center gap-6 max-w-xs w-full"
          >
            <div className="relative">
              <img src="/icon-192.png" alt="Kanze"
                className="w-28 h-28 rounded-[2rem] shadow-2xl"
                style={{ boxShadow: "0 12px 40px hsl(340 70% 60% / 0.35)" }} />
              {/* Phone icon badge */}
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "hsl(340, 70%, 62%)", boxShadow: "0 2px 12px hsl(340 60% 40% / 0.5)" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="3" stroke="white" strokeWidth="2"/>
                  <circle cx="12" cy="18" r="1" fill="white"/>
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  background: "linear-gradient(135deg, hsl(340,80%,50%), hsl(10,75%,58%))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                Kanze's Birthday
              </h1>
              <p className="text-sm leading-relaxed font-semibold"
                style={{ color: "hsl(340, 45%, 42%)", fontFamily: "'Quicksand', sans-serif" }}>
                You've already installed the app!
              </p>
              <p className="text-sm leading-relaxed"
                style={{ color: "hsl(340, 35%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
                Please open it from your home screen — the birthday surprise is only available inside the app 💖
              </p>
            </div>

            <motion.button
              onClick={handleOpenApp}
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
          </motion.div>
        )}

        {/* ── GATE / WAITING / DOWNLOADED ── */}
        {status !== "blocked" && (
          <motion.div
            key="gate-flow"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center px-8 text-center gap-6 max-w-xs w-full"
          >
            {/* App icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
            >
              <div className="relative">
                <img src="/icon-192.png" alt="Kanze"
                  className="w-28 h-28 rounded-[2rem] shadow-2xl"
                  style={{ boxShadow: "0 12px 40px hsl(340 70% 60% / 0.35)" }} />
                <AnimatePresence>
                  {status === "downloaded" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
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

            {/* Title + subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-3xl font-bold"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  background: "linear-gradient(135deg, hsl(340,80%,50%), hsl(10,75%,58%))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                Kanze's Birthday
              </h1>
              <AnimatePresence mode="wait">
                {(status === "gate" || status === "waiting") && (
                  <motion.p key="gate-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-sm leading-relaxed"
                    style={{ color: "hsl(340, 40%, 45%)", fontFamily: "'Quicksand', sans-serif" }}>
                    {status === "waiting"
                      ? "Follow the install prompt to add the app…"
                      : "Install the app on your phone to open your birthday surprise 🎂"}
                  </motion.p>
                )}
                {status === "downloaded" && (
                  <motion.p key="dl-sub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                    className="text-sm leading-relaxed font-semibold"
                    style={{ color: "hsl(142, 55%, 38%)", fontFamily: "'Quicksand', sans-serif" }}>
                    App installed successfully ✓
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action buttons */}
            <AnimatePresence mode="wait">
              {/* Download / waiting */}
              {(status === "gate" || status === "waiting") && (
                <motion.div key="dl-btn"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="w-full flex flex-col gap-3"
                >
                  <motion.button
                    onClick={handleDownload}
                    disabled={status === "waiting"}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-4 rounded-2xl font-bold text-base text-white"
                    style={{
                      background: status === "waiting"
                        ? "hsl(340, 40%, 72%)"
                        : "linear-gradient(135deg, hsl(340,72%,58%) 0%, hsl(350,68%,54%) 100%)",
                      boxShadow: "0 6px 24px hsl(340 70% 55% / 0.4)",
                      fontFamily: "'Quicksand', sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {status === "waiting" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Installing…
                      </span>
                    ) : "Download App"}
                  </motion.button>
                  <p className="text-[11px]"
                    style={{ color: "hsl(340, 30%, 60%)", fontFamily: "'Quicksand', sans-serif" }}>
                    Free · No account required · Private
                  </p>
                </motion.div>
              )}

              {/* Open App — after successful install */}
              {status === "downloaded" && (
                <motion.div key="open-btn"
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="w-full flex flex-col gap-3"
                >
                  <motion.button
                    onClick={handleOpenApp}
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
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
