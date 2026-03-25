import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CandleScreen from "../components/CandleScreen";
import { isBirthdayToday } from "@/utils/birthday";

const Index = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<(Event & { prompt: () => void }) | null>(null);
  const [showInstall,  setShowInstall]  = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!introStarted) setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [introStarted]);

  const handleInstall = async () => {
    if (deferredPrompt) deferredPrompt.prompt();
    setShowInstall(false);
    setIntroStarted(true);
  };

  const handleSkipInstall = () => {
    setShowInstall(false);
    setIntroStarted(true);
  };

  const handleIntroComplete = useCallback(() => {
    if (deferredPrompt) setTimeout(() => deferredPrompt.prompt(), 1500);
    navigate("/hub");
  }, [deferredPrompt, navigate]);

  /* ── Auto-start after brief delay ── */
  useEffect(() => {
    if (!showInstall && !introStarted) {
      const t = setTimeout(() => {
        if (isBirthdayToday()) {
          /* Birthday: launch candle intro as normal */
          setIntroStarted(true);
        } else {
          /* Non-birthday: skip intro, go straight to hub */
          navigate("/hub", { replace: true });
        }
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [showInstall, introStarted, navigate]);

  /* Install screen */
  if (showInstall && !introStarted) {
    return (
      <div className="fixed inset-0 bg-candle-dark flex flex-col items-center justify-center px-8">
        <h1
          className="text-3xl mb-8 text-glow-pink"
          style={{ fontFamily: "'Dancing Script', cursive", color: "hsl(340, 80%, 75%)" }}
        >
          Kanze
        </h1>
        <button
          onClick={handleInstall}
          className="rounded-full py-4 px-10 text-lg font-medium shadow-xl mb-4"
          style={{
            background: "linear-gradient(135deg, hsl(340, 80%, 70%), hsl(350, 75%, 65%))",
            color: "white",
            boxShadow: "0 6px 25px hsl(340 80% 60% / 0.35)",
            fontFamily: "'Quicksand', sans-serif",
          }}
        >
          Click here to install app
        </button>
        <button
          onClick={handleSkipInstall}
          className="text-sm opacity-50 mt-2"
          style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
        >
          Skip
        </button>
      </div>
    );
  }

  /* Loading state — dark background while we decide where to go */
  if (!introStarted) {
    return <div className="fixed inset-0 bg-candle-dark" />;
  }

  /* Birthday only: full candle intro */
  return <CandleScreen onComplete={handleIntroComplete} />;
};

export default Index;
