import { useEffect, useRef, useState, useCallback } from "react";
import Confetti from "./Confetti";

type Phase = "idle" | "listening" | "blown" | "message1" | "message2" | "message3" | "done";

const useBlownSequence = (phase: Phase, setPhase: (p: Phase) => void) => {
  const firedRef = useRef(false);
  useEffect(() => {
    if (phase === "blown" && !firedRef.current) {
      firedRef.current = true;
      setTimeout(() => setPhase("message1"), 1500);
      setTimeout(() => setPhase("message2"), 4000);
      setTimeout(() => setPhase("message3"), 6500);
      setTimeout(() => setPhase("done"), 9500);
    }
  }, [phase, setPhase]);
};

interface CandleScreenProps {
  onComplete: () => void;
}

const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flameVisible, setFlameVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setPhase("listening");

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg > 45) {
          setFlameVisible(false);
          setPhase("blown");
          stream.getTracks().forEach((t) => t.stop());
          audioContext.close();
          return;
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      // If mic denied, allow tap to blow
      setPhase("listening");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  useBlownSequence(phase, setPhase);

  useEffect(() => {
    if (phase === "blown") setShowConfetti(true);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(onComplete, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const handleTapBlow = () => {
    if (phase === "listening") {
      setFlameVisible(false);
      setPhase("blown");
      audioContextRef.current?.close();
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 select-none"
      onClick={phase === "idle" ? startListening : phase === "listening" ? handleTapBlow : undefined}
    >
      {showConfetti && <Confetti />}

      {/* Prompt text */}
      {phase === "idle" && (
        <div className="animate-cinema-fade-in text-center mb-16 px-8">
          <p className="text-muted-foreground text-sm tracking-widest uppercase mb-2">Tap to begin</p>
        </div>
      )}

      {/* Pre-blow text */}
      {(phase === "idle" || phase === "listening") && (
        <div className="animate-cinema-fade-in text-center mb-12 px-8">
          <p className="text-foreground/80 text-lg leading-relaxed italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            Before Chapter 21 begins…
          </p>
          <p className="text-foreground/80 text-lg mt-2 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            Make a wish.
          </p>
        </div>
      )}

      {/* Candle */}
      {(phase === "idle" || phase === "listening") && (
        <div className="relative flex flex-col items-center">
          {/* Flame */}
          {flameVisible && (
            <div className="relative mb-1">
              <div
                className="w-4 h-8 rounded-full animate-flicker animate-flame-glow"
                style={{
                  background: "linear-gradient(to top, hsl(30, 100%, 60%), hsl(45, 100%, 70%), hsl(45, 100%, 90%))",
                }}
              />
              <div className="absolute -inset-4 rounded-full animate-soft-glow" style={{
                background: "radial-gradient(circle, hsl(30 100% 60% / 0.3), transparent 70%)",
              }} />
            </div>
          )}
          {/* Candle body */}
          <div className="w-6 h-24 rounded-sm" style={{
            background: "linear-gradient(to bottom, hsl(0 0% 90%), hsl(0 0% 80%))",
          }} />
          <div className="w-10 h-2 rounded-b-sm" style={{
            background: "hsl(0 0% 70%)",
          }} />
        </div>
      )}

      {phase === "listening" && (
        <p className="text-muted-foreground text-xs mt-8 tracking-widest uppercase animate-cinema-fade-in">
          Blow to extinguish… or tap
        </p>
      )}

      {/* Messages after blow */}
      {phase === "message1" && (
        <div className="animate-cinema-fade-in text-center px-8">
          <h1 className="text-4xl font-bold text-glow" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(330, 100%, 59%)" }}>
            Happy 21st, Kanze.
          </h1>
        </div>
      )}

      {phase === "message2" && (
        <div className="animate-cinema-fade-in text-center px-8">
          <p className="text-foreground/80 text-xl italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            That's a powerful wish.
          </p>
        </div>
      )}

      {phase === "message3" && (
        <div className="animate-cinema-fade-in text-center px-8">
          <p className="text-foreground/70 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Let's see what 21 does with it.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandleScreen;