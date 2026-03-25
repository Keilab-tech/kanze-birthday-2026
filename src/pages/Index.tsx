import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CandleScreen from "../components/CandleScreen";
import BirthdayLockscreen from "../components/BirthdayLockscreen";
import { isBirthdayAhead, isBirthdayToday, isBirthdayOver } from "@/utils/birthday";

type Phase = "loading" | "locked" | "candle" | "redirect";

const Index = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<(Event & { prompt: () => void }) | null>(null);
  const [showInstall,  setShowInstall]  = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
      if (phase === "loading") setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [phase]);

  const handleInstall = async () => {
    if (deferredPrompt) deferredPrompt.prompt();
    setShowInstall(false);
    startApp();
  };

  const handleSkipInstall = () => {
    setShowInstall(false);
    startApp();
  };

  const startApp = useCallback(() => {
    if (isBirthdayAhead()) {
      setPhase("locked");
    } else if (isBirthdayToday()) {
      setPhase("candle");
    } else {
      // Birthday is over — go straight to hub
      setPhase("redirect");
    }
  }, []);

  /* Auto-start after brief loading delay */
  useEffect(() => {
    if (!showInstall && phase === "loading") {
      const t = setTimeout(startApp, 1200);
      return () => clearTimeout(t);
    }
  }, [showInstall, phase, startApp]);

  /* Redirect phase */
  useEffect(() => {
    if (phase === "redirect") {
      navigate("/hub", { replace: true });
    }
  }, [phase, navigate]);

  const handleIntroComplete = useCallback(() => {
    if (deferredPrompt) setTimeout(() => deferredPrompt.prompt(), 1500);
    navigate("/hub");
  }, [deferredPrompt, navigate]);

  /* Install prompt */
  if (showInstall && phase === "loading") {
    return (
      <div className="fixed inset-0 bg-candle-dark flex flex-col items-center justify-center px-8">
        <h1
          className="text-3xl mb-8"
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

  /* Initial dark loading */
  if (phase === "loading" || phase === "redirect") {
    return <div className="fixed inset-0 bg-candle-dark" />;
  }

  /* Pre-birthday lockscreen */
  if (phase === "locked") {
    return <BirthdayLockscreen onUnlock={() => setPhase("candle")} />;
  }

  /* Birthday — full candle intro */
  return <CandleScreen onComplete={handleIntroComplete} />;
};

export default Index;
