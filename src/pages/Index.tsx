import { useState, useEffect, useCallback } from "react";
import CandleScreen from "../components/CandleScreen";
import MainApp from "../components/MainApp";

const Index = () => {
  const [introComplete, setIntroComplete] = useState(() => sessionStorage.getItem("kanze_intro") === "done");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("kanze_intro", "done");
    setIntroComplete(true);
    // Trigger install prompt after intro
    if (deferredPrompt) {
      setTimeout(() => {
        deferredPrompt.prompt();
      }, 2000);
    }
  }, [deferredPrompt]);

  if (!introComplete) {
    return <CandleScreen onComplete={handleIntroComplete} />;
  }

  return <MainApp />;
};

export default Index;