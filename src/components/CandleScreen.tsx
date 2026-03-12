import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Fireworks from "./Fireworks";
import { useMusic } from "@/contexts/MusicContext";

type Phase = "intro" | "candle" | "wish" | "waiting" | "listening" | "smoke-relight" | "blown" | "fireworks" | "birthday-text" | "done";

interface CandleScreenProps {
  onComplete: () => void;
}

/* ── Realistic flame ──────────────────────────────────────────────── */
const RealisticFlame = ({ intensity }: { intensity: number }) => {
  if (intensity <= 0) return null;

  const h = Math.round(44 * intensity);

  return (
    <div style={{ position: "relative", width: "28px", height: "56px" }}>
      {/* Outer ambient glow */}
      <motion.div
        animate={{ opacity: [0.5, 0.75, 0.4, 0.65], scale: [1, 1.12, 0.93, 1.06] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: -2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "38px",
          height: "52px",
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background:
            "radial-gradient(ellipse at 50% 65%, rgba(255,140,0,0.65), rgba(255,70,0,0.2) 60%, transparent 80%)",
          filter: "blur(9px)",
        }}
      />

      {/* Main flame — orange/red outer body */}
      <motion.div
        animate={{
          scaleX: [1, 0.88, 1.1, 0.93, 1.04, 1],
          skewX: ["0deg", "5deg", "-4deg", "3deg", "-1deg", "0deg"],
          scaleY: [1, 1.05, 0.95, 1.03, 0.98, 1],
        }}
        transition={{ duration: 0.95, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "18px",
          height: `${h}px`,
          borderRadius: "50% 50% 30% 30% / 55% 55% 45% 45%",
          background:
            "linear-gradient(to top, #cc1100 0%, #ff3300 10%, #ff6600 30%, #ff9900 55%, #ffcc00 78%, rgba(255,230,120,0.55) 92%, transparent)",
          opacity: intensity,
          transition: "opacity 0.3s, height 0.15s",
        }}
      />

      {/* Inner flame — yellow */}
      <motion.div
        animate={{
          scaleX: [1, 0.85, 1.07, 0.91, 1],
          scaleY: [1, 1.08, 0.92, 1.05, 1],
        }}
        transition={{ duration: 0.72, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: `${Math.round(h * 0.62)}px`,
          borderRadius: "50% 50% 20% 20% / 55% 55% 45% 45%",
          background:
            "linear-gradient(to top, #ffee00 0%, #ffff88 50%, rgba(255,255,180,0.5) 80%, transparent)",
          opacity: intensity,
        }}
      />

      {/* Core — white/pale blue at wick */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "5px",
          height: `${Math.round(h * 0.28)}px`,
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background: "linear-gradient(to top, #bbbbff, #ffffff 55%, transparent)",
          opacity: intensity,
        }}
      />
    </div>
  );
};

/* ── Smoke trail (appears after blow-out) ─────────────────────────── */
const smokeParticles = [
  { dx: 0,  delay: 0,    dur: 2.6, size: 14 },
  { dx: -9, delay: 0.18, dur: 3.1, size: 12 },
  { dx: 10, delay: 0.4,  dur: 2.9, size: 10 },
  { dx: -5, delay: 0.65, dur: 3.4, size: 16 },
  { dx: 7,  delay: 0.9,  dur: 2.7, size: 11 },
  { dx: -2, delay: 1.15, dur: 3.0, size: 13 },
];

const SmokeTrail = () => (
  <>
    {smokeParticles.map((p, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.7, y: 0, x: 0, scale: 0.35 }}
        animate={{ opacity: 0, y: -95, x: p.dx, scale: 2.4 }}
        transition={{ duration: p.dur, delay: p.delay, ease: [0.15, 0.4, 0.7, 1] }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          marginLeft: `-${p.size / 2}px`,
          width: `${p.size}px`,
          height: `${p.size + 8}px`,
          borderRadius: "50%",
          background: "rgba(200, 200, 200, 0.55)",
          filter: "blur(5px)",
        }}
      />
    ))}
  </>
);

/* ── Main component ───────────────────────────────────────────────── */
const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flameIntensity, setFlameIntensity] = useState(1);
  const blowCountRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const { start: startMusic } = useMusic();

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

  const startDetection = useCallback((analyser: AnalyserNode, stream: MediaStream, audioContext: AudioContext) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const detect = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < 7) readyForNextBlowRef.current = true;

      if (avg > 5 && avg <= 12) {
        setFlameIntensity(Math.max(0.3, 1 - (avg - 5) / 10));
      }

      if (avg > 12 && !blowCooldownRef.current && readyForNextBlowRef.current) {
        blowCooldownRef.current = true;
        readyForNextBlowRef.current = false;
        blowCountRef.current += 1;
        setFlameIntensity(0);

        if (blowCountRef.current >= 1) {
          setPhase("blown");
          stream.getTracks().forEach((t) => t.stop());
          audioContext.close();
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, []);

  const blowCooldownRef = useRef(false);
  const readyForNextBlowRef = useRef(true);

  const startListening = useCallback(async () => {
    if (phase !== "waiting") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setPhase("listening");
      startDetection(analyser, stream, audioContext);
    } catch {
      setPhase("listening");
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "smoke-relight") return;
    setFlameIntensity(0);
    const s1 = setTimeout(() => setFlameIntensity(0.45), 350);
    const s2 = setTimeout(() => setFlameIntensity(0.8), 650);
    const s3 = setTimeout(() => setFlameIntensity(1), 900);
    const resume = setTimeout(() => {
      blowCooldownRef.current = false;
      setPhase("listening");
      if (analyserRef.current && streamRef.current && audioContextRef.current) {
        startDetection(analyserRef.current, streamRef.current, audioContextRef.current);
      }
    }, 1800);
    return () => { clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); clearTimeout(resume); };
  }, [phase, startDetection]);

  useEffect(() => {
    if (phase !== "blown") return;
    setFlameIntensity(0);
    const t = setTimeout(() => setPhase("fireworks"), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleFireworksComplete = useCallback(() => {
    startMusic();
    setPhase("birthday-text");
  }, [startMusic]);

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

  const showCandle = ["candle", "wish", "waiting", "listening", "smoke-relight", "blown"].includes(phase);
  const isBlown = phase === "blown";

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 select-none overflow-hidden bg-candle-dark"
      onClick={phase === "waiting" ? startListening : undefined}
      style={{ cursor: phase === "waiting" ? "pointer" : "default" }}
    >
      {phase === "fireworks" && <Fireworks onComplete={handleFireworksComplete} />}

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">

        <AnimatePresence>
          {phase === "birthday-text" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="text-center px-8 space-y-4"
            >
              <h1 className="text-5xl md:text-6xl" style={{ color: "hsl(340, 80%, 75%)" }}>
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

        <AnimatePresence>
          {phase === "candle" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-xl px-8 text-center"
              style={{ color: "hsl(340, 60%, 80%)", fontFamily: "'Dancing Script', cursive", fontSize: "1.5rem" }}
            >
              Before Chapter 22 begins...
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "wish" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-xl px-8 text-center"
              style={{ color: "hsl(340, 60%, 85%)", fontFamily: "'Dancing Script', cursive", fontSize: "1.8rem" }}
            >
              Make a wish.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "waiting" && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-8 text-sm tracking-wider"
              style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              Tap to begin ✨
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "listening" && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-8 text-sm tracking-wider"
              style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              Blow gently... 🌬️
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "smoke-relight" && (
            <motion.div
              initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center mt-6"
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg mt-2"
                style={{ color: "hsl(340, 60%, 80%)", fontFamily: "'Dancing Script', cursive" }}
              >
                {blowCountRef.current === 1 ? "Oops, try that again! 😄" : "One last time! 🌬️"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cake + Candle — pinned to bottom center */}
      <AnimatePresence>
        {showCandle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute left-1/2"
            style={{ transform: "translateX(-50%)", bottom: "-60px" }}
          >
            <div className="relative" style={{ width: "480px", maxWidth: "120vw" }}>

              {/* Candle tip — reference point for flame + smoke */}
              <div
                className="absolute left-1/2"
                style={{ transform: "translateX(-50%)", top: "44px", zIndex: 4 }}
              >
                {/* Flame sits ABOVE this point (negative margin pulls it up) */}
                <div style={{ position: "relative", marginTop: "-56px", display: "flex", justifyContent: "center" }}>
                  <RealisticFlame intensity={flameIntensity} />
                </div>

                {/* Smoke rises UPWARD from this point */}
                {isBlown && (
                  <div style={{ position: "absolute", top: "-56px", left: "50%", transform: "translateX(-50%)" }}>
                    <SmokeTrail />
                  </div>
                )}

                {/* Wick */}
                <div
                  className="mx-auto"
                  style={{
                    width: "2px",
                    height: "8px",
                    background: isBlown
                      ? "linear-gradient(to bottom, #444, #222)"
                      : "linear-gradient(to bottom, #ff8800, #333)",
                    borderRadius: "1px",
                  }}
                />
              </div>

              {/* Cake image — no mask/glow when blown, subtle vignette while candle is lit */}
              <img
                src="/images/cake-final.png"
                alt="Birthday cake"
                className="w-full h-auto block"
                style={{
                  transition: "mask-image 0.8s ease, -webkit-mask-image 0.8s ease",
                  ...(isBlown ? {} : {
                    WebkitMaskImage:
                      "radial-gradient(ellipse 75% 70% at 50% 55%, black 50%, transparent 85%)",
                    maskImage:
                      "radial-gradient(ellipse 75% 70% at 50% 55%, black 50%, transparent 85%)",
                  }),
                }}
                draggable={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandleScreen;
