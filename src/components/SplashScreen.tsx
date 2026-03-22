import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onDone: () => void;
}

/* Floating petal particle */
const Petal = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    initial={{ y: "110vh", x, opacity: 0, rotate: 0 }}
    animate={{ y: "-10vh", opacity: [0, 0.8, 0.8, 0], rotate: 360 }}
    transition={{ duration: 3.5, delay, ease: "easeOut" }}
    className="absolute bottom-0 pointer-events-none"
    style={{ left: `${x}%`, width: size, height: size }}
  >
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <ellipse cx="12" cy="6" rx="4" ry="6"
        fill={`hsl(${330 + Math.random() * 30}, 80%, 75%)`} opacity="0.9" />
      <ellipse cx="6" cy="14" rx="4" ry="6" transform="rotate(-60 6 14)"
        fill={`hsl(${340 + Math.random() * 20}, 75%, 70%)`} opacity="0.85" />
      <ellipse cx="18" cy="14" rx="4" ry="6" transform="rotate(60 18 14)"
        fill={`hsl(${320 + Math.random() * 30}, 78%, 72%)`} opacity="0.85" />
    </svg>
  </motion.div>
);

const PETALS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  delay: i * 0.13,
  x: Math.random() * 95,
  size: 16 + Math.random() * 18,
}));

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 5000; // ms total

  useEffect(() => {
    /* Animate progress bar */
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setProgress(Math.min(elapsed / DURATION, 1));
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), DURATION - 400);
    const t3 = setTimeout(onDone, DURATION + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "out" ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d0010 0%, #1a0025 45%, #0a000f 100%)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
              style={{ background: "hsl(320 90% 55% / 0.18)", filter: "blur(80px)" }} />
            <div className="absolute top-2/3 left-1/3 w-64 h-64 rounded-full"
              style={{ background: "hsl(280 70% 50% / 0.12)", filter: "blur(60px)" }} />
          </div>

          {/* Floating petals */}
          {PETALS.map((p) => <Petal key={p.id} {...p} />)}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-8">

            {/* Icon with ripple rings */}
            <div className="relative flex items-center justify-center">
              {/* Ripple rings */}
              {[0, 0.4, 0.8].map((d, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{ borderColor: "hsl(330 80% 70% / 0.35)", width: 112 + i * 36, height: 112 + i * 36 }}
                  animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, delay: d, repeat: Infinity, ease: "easeOut" }}
                />
              ))}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
              >
                <img
                  src="/icon-192.png"
                  alt="Kanze"
                  className="w-28 h-28 rounded-[2rem]"
                  style={{
                    boxShadow: "0 0 0 3px hsl(330 70% 65% / 0.4), 0 16px 48px hsl(330 80% 50% / 0.5)",
                  }}
                />
              </motion.div>
            </div>

            {/* Name */}
            <div className="flex flex-col items-center gap-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
                className="text-4xl font-bold"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  background: "linear-gradient(135deg, hsl(340,90%,80%), hsl(20,85%,75%), hsl(340,85%,75%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 18px hsl(340 80% 65% / 0.6))",
                }}
              >
                Kanze's Birthday
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="text-sm tracking-widest uppercase"
                style={{ color: "hsl(340 60% 65%)", fontFamily: "'Quicksand', sans-serif", letterSpacing: "0.2em" }}
              >
                A surprise just for you
              </motion.p>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="w-48 h-[3px] rounded-full overflow-hidden"
              style={{ background: "hsl(330 40% 30%)", transformOrigin: "left" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, hsl(340,80%,65%), hsl(20,85%,70%))",
                  boxShadow: "0 0 10px hsl(340 80% 65% / 0.8)",
                }}
              />
            </motion.div>

          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
