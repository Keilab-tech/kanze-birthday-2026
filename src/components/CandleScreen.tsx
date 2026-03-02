import { useEffect, useRef, useState, useCallback } from "react";
import GoldenParticles from "./GoldenParticles";

type Phase = "intro" | "candle" | "waiting" | "listening" | "blown" | "message1" | "message2" | "message3" | "done";

interface CandleScreenProps {
  onComplete: () => void;
}

const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showWishText, setShowWishText] = useState(false);
  const [flameIntensity, setFlameIntensity] = useState(1);
  const [showParticles, setShowParticles] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const firedRef = useRef(false);

  // Phase 1: Intro text sequence
  useEffect(() => {
    if (phase !== "intro") return;
    const t1 = setTimeout(() => setPhase("candle"), 800);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (phase !== "candle") return;
    const t = setTimeout(() => setShowWishText(true), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!showWishText) return;
    const t = setTimeout(() => setPhase("waiting"), 1500);
    return () => clearTimeout(t);
  }, [showWishText]);

  // Tap to activate mic
  const startListening = useCallback(async () => {
    if (phase !== "waiting") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      setPhase("listening");

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        // React to sound before extinguishing
        if (avg > 15 && avg <= 40) {
          setFlameIntensity(Math.max(0.4, 1 - (avg - 15) / 40));
        }

        if (avg > 40) {
          setFlameIntensity(0);
          setPhase("blown");
          setShowParticles(true);
          stream.getTracks().forEach((t) => t.stop());
          audioContext.close();
          return;
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      // If mic denied, still allow progression
      setPhase("listening");
    }
  }, [phase]);

  // Post-blow sequence
  useEffect(() => {
    if (phase === "blown" && !firedRef.current) {
      firedRef.current = true;
      setTimeout(() => setPhase("message1"), 2000);
      setTimeout(() => setPhase("message2"), 5000);
      setTimeout(() => setPhase("message3"), 8000);
      setTimeout(() => setPhase("done"), 11000);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  const showCandle = phase === "candle" || phase === "waiting" || phase === "listening";
  const showPreText = phase === "candle" || phase === "waiting" || phase === "listening";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 select-none"
      onClick={phase === "waiting" ? startListening : undefined}
      style={{ cursor: phase === "waiting" ? "pointer" : "default" }}
    >
      {showParticles && <GoldenParticles />}

      {/* Pre-blow text */}
      {showPreText && (
        <div className="text-center mb-16 px-8" style={{ opacity: phase === "candle" && !showWishText ? 0 : 1 }}>
          <p
            className="text-foreground/60 text-xl leading-relaxed animate-cinema-fade-in"
            style={{ animationDelay: "0s" }}
          >
            Before Chapter 21 begins...
          </p>
          {showWishText && (
            <p
              className="text-foreground/60 text-xl mt-4 animate-cinema-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              Make a wish.
            </p>
          )}
        </div>
      )}

      {/* Candle */}
      {showCandle && (
        <div className="relative flex flex-col items-center animate-cinema-fade-in">
          {/* Flame */}
          <div className="relative mb-0.5" style={{ opacity: flameIntensity, transition: "opacity 0.15s ease" }}>
            {flameIntensity > 0 && (
              <>
                <div
                  className="w-3 h-7 rounded-full animate-flicker"
                  style={{
                    background: "linear-gradient(to top, hsl(30, 80%, 50%), hsl(40, 90%, 65%), hsl(45, 95%, 85%))",
                    transform: `scaleY(${flameIntensity})`,
                    transition: "transform 0.15s ease",
                  }}
                />
                <div
                  className="absolute -inset-6 rounded-full animate-flame-glow"
                  style={{
                    background: "radial-gradient(circle, hsl(35 80% 55% / 0.15), transparent 70%)",
                  }}
                />
              </>
            )}
          </div>
          {/* Wick */}
          <div className="w-0.5 h-2 bg-foreground/30" />
          {/* Candle body */}
          <div
            className="w-5 h-20 rounded-sm"
            style={{ background: "linear-gradient(to bottom, hsl(0 0% 85%), hsl(0 0% 75%))" }}
          />
        </div>
      )}

      {/* Tap hint */}
      {phase === "waiting" && (
        <p className="text-muted-foreground/40 text-xs mt-12 tracking-[0.3em] uppercase animate-cinema-fade-in">
          Tap to begin
        </p>
      )}

      {phase === "listening" && (
        <p className="text-muted-foreground/30 text-xs mt-12 tracking-[0.3em] uppercase animate-cinema-fade-in">
          Blow gently...
        </p>
      )}

      {/* Post-blow messages */}
      {phase === "message1" && (
        <div className="animate-cinema-fade-in-slow text-center px-8">
          <h1 className="text-5xl text-foreground/90 text-glow-soft" style={{ fontWeight: 300 }}>
            Happy 21st, Kanze.
          </h1>
        </div>
      )}

      {phase === "message2" && (
        <div className="animate-cinema-fade-in-slow text-center px-8">
          <p className="text-foreground/50 text-xl" style={{ fontWeight: 300 }}>
            That's a powerful wish.
          </p>
        </div>
      )}

      {phase === "message3" && (
        <div className="animate-cinema-fade-in-slow text-center px-8">
          <p className="text-foreground/40 text-lg tracking-wide" style={{ fontWeight: 300 }}>
            Let's see what 21 does with it.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandleScreen;
