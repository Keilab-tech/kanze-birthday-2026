import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Fireworks from "./Fireworks";
import { useMusic } from "@/contexts/MusicContext";

type Phase = "intro" | "candle" | "wish" | "waiting" | "listening" | "smoke-relight" | "blown" | "fireworks" | "birthday-text" | "done";

interface CandleScreenProps {
  onComplete: () => void;
}

const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flameIntensity, setFlameIntensity] = useState(1);
  const blowCountRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const { start: startMusic } = useMusic();

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
  }, [phase]);

  const blowCooldownRef = useRef(false);
  const readyForNextBlowRef = useRef(true);

  const startDetection = useCallback((analyser: AnalyserNode, stream: MediaStream, audioContext: AudioContext) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const detect = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < 7) {
        // Mic returned to quiet baseline; allow next blow trigger
        readyForNextBlowRef.current = true;
      }

      if (avg > 5 && avg <= 12) {
        setFlameIntensity(Math.max(0.3, 1 - (avg - 5) / 10));
      }

      if (avg > 12 && !blowCooldownRef.current && readyForNextBlowRef.current) {
        blowCooldownRef.current = true;
        readyForNextBlowRef.current = false;
        blowCountRef.current += 1;
        setFlameIntensity(0);

        if (blowCountRef.current >= 3) {
          setPhase("blown");
          stream.getTracks().forEach(t => t.stop());
          audioContext.close();
          return;
        } else {
          setPhase("smoke-relight");
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, []);

  // Smoke-relight phase: show smoke + message, relight visibly, then resume listening
  useEffect(() => {
    if (phase !== "smoke-relight") return;

    setFlameIntensity(0);

    const relightStep1 = setTimeout(() => setFlameIntensity(0.45), 350);
    const relightStep2 = setTimeout(() => setFlameIntensity(0.8), 650);
    const relightStep3 = setTimeout(() => setFlameIntensity(1), 900);

    // Resume listening after relight is clearly visible
    const resumeTimer = setTimeout(() => {
      blowCooldownRef.current = false;
      setPhase("listening");
      if (analyserRef.current && streamRef.current && audioContextRef.current) {
        startDetection(analyserRef.current, streamRef.current, audioContextRef.current);
      }
    }, 1800);

    return () => {
      clearTimeout(relightStep1);
      clearTimeout(relightStep2);
      clearTimeout(relightStep3);
      clearTimeout(resumeTimer);
    };
  }, [phase, startDetection]);

  // Post-blow → fireworks
  useEffect(() => {
    if (phase !== "blown") return;
    const t = setTimeout(() => setPhase("fireworks"), 1500);
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

  const showCandle = ["candle", "wish", "waiting", "listening", "smoke-relight"].includes(phase);

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 select-none overflow-hidden bg-candle-dark"
      onClick={phase === "waiting" ? startListening : undefined}
      style={{ cursor: phase === "waiting" ? "pointer" : "default" }}
    >



      {/* Fireworks phase — outside centered content for full-screen effect */}
      {phase === "fireworks" && <Fireworks onComplete={handleFireworksComplete} />}

      {/* Centered content area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-xl px-8 text-center"
              style={{ color: "hsl(340, 60%, 85%)", fontFamily: "'Dancing Script', cursive", fontSize: "1.8rem" }}
            >
              Make a wish.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Tap / Blow hints */}
        <AnimatePresence>
          {phase === "waiting" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-8 text-sm tracking-wider"
              style={{ color: "hsl(340, 50%, 70%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              Blow gently... 🌬️
            </motion.p>
          )}
        </AnimatePresence>

        {/* Smoke + Oops message */}
        <AnimatePresence>
          {phase === "smoke-relight" && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -10 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center mt-6"
            >
              {/* Smoke trail */}
              <motion.div
                initial={{ opacity: 0.8, y: 0 }}
                animate={{ opacity: 0, y: -40 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="text-3xl"
              >
                💨
              </motion.div>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
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

      {/* Candle — pinned to bottom center */}
      <AnimatePresence>
        {showCandle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-0 left-1/2 flex flex-col items-center"
            style={{ transform: "translateX(-50%)" }}
          >
            {/* Flame — 🔥 emoji */}
            <div className="relative mb-0" style={{ opacity: flameIntensity, transition: "opacity 0.3s ease" }}>
              {flameIntensity > 0 && (
                <>
                  {/* Outer magical glow pulse */}
                  <div
                    className="absolute -inset-14 rounded-full"
                    style={{
                      background: "radial-gradient(circle, hsl(35 90% 60% / 0.12), hsl(340 70% 60% / 0.06), transparent 70%)",
                      animation: "flame-pulse 2.5s ease-in-out infinite",
                    }}
                  />
                  {/* Inner warm glow pulse */}
                  <div
                    className="absolute -inset-8 rounded-full"
                    style={{
                      background: "radial-gradient(circle, hsl(35 80% 55% / 0.25), hsl(30 70% 50% / 0.1), transparent 70%)",
                      animation: "flame-pulse 1.8s ease-in-out infinite 0.4s",
                    }}
                  />
                  {/* Fire emoji flame */}
                  <div
                    className="animate-flicker text-center"
                    style={{
                      fontSize: "5.6rem",
                      transform: `scaleY(${flameIntensity})`,
                      transition: "transform 0.15s ease",
                      lineHeight: 1,
                    }}
                  >
                    🔥
                  </div>
                </>
              )}
            </div>
            {/* Wick */}
            <div className="w-1 h-4" style={{ backgroundColor: "hsl(0, 0%, 40%)", marginTop: "-8px" }} />
            {/* Candle body */}
            <div
              className="w-24 h-72 rounded-t-md"
              style={{
                background: "linear-gradient(to bottom, hsl(340, 60%, 85%), hsl(340, 50%, 75%))",
                boxShadow: "0 4px 15px hsl(340 60% 50% / 0.2)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CandleScreen;
