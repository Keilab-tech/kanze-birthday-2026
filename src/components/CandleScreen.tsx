import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountdownClock from "./CountdownClock";
import Fireworks from "./Fireworks";

type Phase = "intro" | "candle" | "wish" | "waiting" | "listening" | "blown" | "fireworks" | "birthday-text" | "done";

interface CandleScreenProps {
  onComplete: () => void;
}

const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flameIntensity, setFlameIntensity] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

  // Phase timing
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("candle"), 800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "candle") return;
    const t = setTimeout(() => setPhase("wish"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "wish") return;
    const t = setTimeout(() => setPhase("waiting"), 1800);
    return () => clearTimeout(t);
  }, [phase]);

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

        if (avg > 12 && avg <= 40) {
          setFlameIntensity(Math.max(0.3, 1 - (avg - 12) / 35));
        }

        if (avg > 40) {
          setFlameIntensity(0);
          setPhase("blown");
          stream.getTracks().forEach(t => t.stop());
          audioContext.close();
          return;
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      setPhase("listening");
    }
  }, [phase]);

  // Post-blow → fireworks
  useEffect(() => {
    if (phase !== "blown") return;
    const t = setTimeout(() => setPhase("fireworks"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  const handleFireworksComplete = useCallback(() => {
    setPhase("birthday-text");
  }, []);

  useEffect(() => {
    if (phase !== "birthday-text") return;
    const t = setTimeout(() => setPhase("done"), 4000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(onComplete, 1500);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  const showCandle = ["candle", "wish", "waiting", "listening"].includes(phase);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 select-none overflow-hidden bg-candle-dark"
      onClick={phase === "waiting" ? startListening : undefined}
      style={{ cursor: phase === "waiting" ? "pointer" : "default" }}
    >
      {/* Countdown Clock */}
      <CountdownClock />

      {/* Subtle floating balloons */}
      {showCandle && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl opacity-20"
              style={{
                left: `${15 + i * 18}%`,
                animation: `balloon-float ${12 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * 2}s`,
              }}
            >
              🎈
            </div>
          ))}
        </div>
      )}

      {/* Fireworks phase */}
      {phase === "fireworks" && <Fireworks onComplete={handleFireworksComplete} />}

      {/* Birthday text after fireworks */}
      <AnimatePresence>
        {phase === "birthday-text" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="text-center px-8 space-y-4"
          >
            <h1
              className="text-5xl md:text-6xl text-glow-pink"
              style={{ color: "hsl(340, 80%, 75%)" }}
            >
              Happy Birthday Kanze 💖
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-xl"
              style={{ color: "hsl(340, 60%, 80%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              22 looks good on you.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-blow text */}
      <AnimatePresence>
        {phase === "candle" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="text-xl mb-12 px-8 text-center"
            style={{ color: "hsl(340, 60%, 80%)", fontFamily: "'Dancing Script', cursive", fontSize: "1.5rem" }}
          >
            Before Chapter 22 begins...
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "wish" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="text-xl mb-12 px-8 text-center"
            style={{ color: "hsl(340, 60%, 85%)", fontFamily: "'Dancing Script', cursive", fontSize: "1.8rem" }}
          >
            Make a wish.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Candle */}
      <AnimatePresence>
        {showCandle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative flex flex-col items-center"
          >
            {/* Flame */}
            <div className="relative mb-0.5" style={{ opacity: flameIntensity, transition: "opacity 0.15s ease" }}>
              {flameIntensity > 0 && (
                <>
                  <div
                    className="w-4 h-9 rounded-full animate-flicker"
                    style={{
                      background: "linear-gradient(to top, hsl(30, 80%, 50%), hsl(40, 90%, 65%), hsl(45, 95%, 90%))",
                      transform: `scaleY(${flameIntensity})`,
                      transition: "transform 0.15s ease",
                    }}
                  />
                  <div
                    className="absolute -inset-8 rounded-full animate-flame-glow"
                    style={{
                      background: "radial-gradient(circle, hsl(35 80% 55% / 0.2), transparent 70%)",
                    }}
                  />
                </>
              )}
            </div>
            {/* Wick */}
            <div className="w-0.5 h-2" style={{ backgroundColor: "hsl(0, 0%, 40%)" }} />
            {/* Candle body */}
            <div
              className="w-8 h-24 rounded-md"
              style={{
                background: "linear-gradient(to bottom, hsl(340, 60%, 85%), hsl(340, 50%, 75%))",
                boxShadow: "0 4px 15px hsl(340 60% 50% / 0.2)",
              }}
            />
            {/* Candle base */}
            <div
              className="w-12 h-3 rounded-b-lg"
              style={{
                background: "linear-gradient(to bottom, hsl(340, 40%, 70%), hsl(340, 35%, 60%))",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      <AnimatePresence>
        {phase === "waiting" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-12 text-sm tracking-wider"
            style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Tap to begin ✨
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "listening" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-12 text-sm tracking-wider"
            style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
          >
            Blow gently... 🌬️
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandleScreen;
