import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Fireworks from "./Fireworks";
import { useMusic } from "@/contexts/MusicContext";

type Phase =
  | "intro"
  | "candle"
  | "wish"
  | "waiting"
  | "listening"
  | "smoke-relight"
  | "blown"
  | "fireworks"
  | "birthday-text"
  | "done";

interface CandleScreenProps {
  onComplete: () => void;
}

/* ── Realistic CSS flame ─────────────────────────────────────────── */
const RealisticFlame = ({ intensity }: { intensity: number }) => {
  if (intensity <= 0) return null;

  const h = Math.round(48 * intensity);

  return (
    <div style={{ position: "relative", width: "30px", height: `${h + 8}px` }}>
      {/* Outer warm glow */}
      <motion.div
        animate={{ opacity: [0.45, 0.72, 0.38, 0.62], scale: [1, 1.14, 0.92, 1.08] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "42px",
          height: `${h + 10}px`,
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background:
            "radial-gradient(ellipse at 50% 68%, rgba(255,145,0,0.7), rgba(255,65,0,0.22) 58%, transparent 80%)",
          filter: "blur(10px)",
        }}
      />

      {/* Main flame — orange/red outer body */}
      <motion.div
        animate={{
          scaleX: [1, 0.87, 1.11, 0.92, 1.05, 1],
          skewX: ["0deg", "5deg", "-4deg", "3deg", "-2deg", "0deg"],
          scaleY: [1, 1.06, 0.94, 1.04, 0.97, 1],
        }}
        transition={{ duration: 0.92, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "18px",
          height: `${h}px`,
          borderRadius: "50% 50% 28% 28% / 56% 56% 44% 44%",
          background:
            "linear-gradient(to top, #bb1100 0%, #ff3300 12%, #ff6600 32%, #ff9900 58%, #ffcc00 80%, rgba(255,228,110,0.5) 93%, transparent)",
          opacity: intensity,
          transition: "opacity 0.3s, height 0.15s",
        }}
      />

      {/* Inner flame — yellow */}
      <motion.div
        animate={{
          scaleX: [1, 0.84, 1.08, 0.9, 1],
          scaleY: [1, 1.09, 0.91, 1.06, 1],
        }}
        transition={{ duration: 0.68, repeat: Infinity, ease: "easeInOut", delay: 0.13 }}
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: `${Math.round(h * 0.6)}px`,
          borderRadius: "50% 50% 20% 20% / 55% 55% 45% 45%",
          background:
            "linear-gradient(to top, #ffe500 0%, #ffff99 52%, rgba(255,255,190,0.48) 82%, transparent)",
          opacity: intensity,
        }}
      />

      {/* Core — white / pale blue at wick */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "5px",
          height: `${Math.round(h * 0.26)}px`,
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background: "linear-gradient(to top, #ccccff, #ffffff 56%, transparent)",
          opacity: intensity,
        }}
      />
    </div>
  );
};

/* ── Smoke trail — 5-second continuous wisps ─────────────────────── */
const smokeParticles = [
  { dx:  0,  delay: 0.0,  dur: 4.8, size: 14 },
  { dx: -10, delay: 0.25, dur: 5.2, size: 12 },
  { dx:  11, delay: 0.5,  dur: 4.4, size: 10 },
  { dx: -5,  delay: 0.75, dur: 5.5, size: 16 },
  { dx:  8,  delay: 1.0,  dur: 4.6, size: 11 },
  { dx: -3,  delay: 1.3,  dur: 5.0, size: 13 },
  { dx:  5,  delay: 0.15, dur: 5.8, size: 9  },
  { dx: -8,  delay: 0.65, dur: 4.2, size: 15 },
];

const SmokeTrail = () => (
  <>
    {smokeParticles.map((p, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.72, y: 0, x: 0, scale: 0.3 }}
        animate={{ opacity: 0, y: -110, x: p.dx, scale: 2.6 }}
        transition={{ duration: p.dur, delay: p.delay, ease: [0.12, 0.38, 0.65, 1] }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          marginLeft: `-${p.size / 2}px`,
          width: `${p.size}px`,
          height: `${p.size + 8}px`,
          borderRadius: "50%",
          background: "rgba(195, 195, 195, 0.58)",
          filter: "blur(6px)",
        }}
      />
    ))}
  </>
);

/* ── Main component ──────────────────────────────────────────────── */
const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flameIntensity, setFlameIntensity] = useState(1);
  const blowCountRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const blowCooldownRef = useRef(false);
  const readyForNextBlowRef = useRef(true);
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

  const startDetection = useCallback(
    (analyser: AnalyserNode, stream: MediaStream, audioContext: AudioContext) => {
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
    },
    [],
  );

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
    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(resume);
    };
  }, [phase, startDetection]);

  /* After blow: show smoke for 5 seconds, then fireworks */
  useEffect(() => {
    if (phase !== "blown") return;
    setFlameIntensity(0);
    const t = setTimeout(() => setPhase("fireworks"), 5000);
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

  const showCandle = [
    "candle",
    "wish",
    "waiting",
    "listening",
    "smoke-relight",
    "blown",
  ].includes(phase);

  const isBlown = phase === "blown";

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 select-none overflow-hidden bg-candle-dark"
      onClick={phase === "waiting" ? startListening : undefined}
      style={{ cursor: phase === "waiting" ? "pointer" : "default" }}
    >
      {phase === "fireworks" && <Fireworks onComplete={handleFireworksComplete} />}

      {/* Centered text area */}
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
              <h1
                className="text-5xl md:text-6xl"
                style={{ color: "hsl(340, 80%, 75%)" }}
              >
                Happy Birthday Kanze 💖
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-xl"
                style={{
                  color: "hsl(340, 60%, 80%)",
                  fontFamily: "'Quicksand', sans-serif",
                }}
              >
                22 looks good on you.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "candle" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-xl px-8 text-center"
              style={{
                color: "hsl(340, 60%, 80%)",
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.5rem",
              }}
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
              className="text-xl px-8 text-center"
              style={{
                color: "hsl(340, 60%, 85%)",
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.8rem",
              }}
            >
              Make a wish.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "waiting" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-8 text-sm tracking-wider"
              style={{
                color: "hsl(340, 50%, 70%)",
                fontFamily: "'Quicksand', sans-serif",
              }}
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
              className="mt-8 text-sm tracking-wider"
              style={{
                color: "hsl(340, 50%, 70%)",
                fontFamily: "'Quicksand', sans-serif",
              }}
            >
              Blow gently... 🌬️
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "smoke-relight" && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -10 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center mt-6"
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg mt-2"
                style={{
                  color: "hsl(340, 60%, 80%)",
                  fontFamily: "'Dancing Script', cursive",
                }}
              >
                {blowCountRef.current === 1
                  ? "Oops, try that again! 😄"
                  : "One last time! 🌬️"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cake + candle — pinned bottom-center ─────────────────── */}
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
            <div
              className="relative"
              style={{ width: "480px", maxWidth: "100vw" }}
            >
              {/*
               * Candle reference point — sits exactly on the strawberries.
               * Flame renders ABOVE (negative margin pulls it up).
               * Smoke renders from the same point upward when blown.
               * Wick renders BELOW.
               *
               * top: ~28% from the image top positions the tip at the
               * peak of the top-tier strawberries.
               * (Image is 1024×1024 square; container displays at 480×480px)
               */}
              <div
                className="absolute left-1/2"
                style={{
                  transform: "translateX(-50%)",
                  top: "28%",
                  zIndex: 4,
                }}
              >
                {/* Flame — above reference point */}
                <div
                  style={{
                    position: "relative",
                    marginTop: isBlown ? 0 : "-60px",
                    display: "flex",
                    justifyContent: "center",
                    transition: "margin-top 0.2s",
                  }}
                >
                  <RealisticFlame intensity={flameIntensity} />
                </div>

                {/* Smoke — rises from the wick tip when blown */}
                {isBlown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-60px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 5,
                    }}
                  >
                    <SmokeTrail />
                  </div>
                )}

                {/* Wick */}
                <div
                  className="mx-auto"
                  style={{
                    width: "2px",
                    height: "9px",
                    background: isBlown
                      ? "linear-gradient(to bottom, #555, #222)"
                      : "linear-gradient(to bottom, #ff9900, #333)",
                    borderRadius: "1px",
                  }}
                />
              </div>

              {/* Cake image — no mask, no glow, pure image at all times */}
              <img
                src="/images/cake-final.png"
                alt="Birthday cake"
                className="w-full h-auto block"
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
