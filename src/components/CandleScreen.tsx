import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Fireworks from "./Fireworks";
import CornerFireworks from "./CornerFireworks";
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

/* ── Background-removed cake src ─────────────────────────────────── */
/*
 * Processes cake-final.png entirely off-screen (no DOM dependency)
 * and resolves to a data-URL with the brownish background erased.
 * The img element whose src uses this URL will show the parent div's
 * black background through the transparent pixels – clean, no glow.
 */
function useProcessedCake(src: string): string {
  const [url, setUrl] = useState(src); // fallback = original image

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 640;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);

      const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
      const d = imageData.data;

      /* Sample background colour from four corners */
      const idx = (x: number, y: number) => (y * SIZE + x) * 4;
      const corners = [idx(0,0), idx(SIZE-1,0), idx(0,SIZE-1), idx(SIZE-1,SIZE-1)];
      const bgR = Math.round(corners.reduce((s,i) => s + d[i],   0) / 4);
      const bgG = Math.round(corners.reduce((s,i) => s + d[i+1], 0) / 4);
      const bgB = Math.round(corners.reduce((s,i) => s + d[i+2], 0) / 4);

      const THRESHOLD = 68;
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i]-bgR, dg = d[i+1]-bgG, db = d[i+2]-bgB;
        if (Math.sqrt(dr*dr + dg*dg + db*db) < THRESHOLD) d[i+3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      setUrl(canvas.toDataURL("image/png"));
    };
    img.src = src;
  }, [src]);

  return url;
}

/* ── Realistic CSS flame ─────────────────────────────────────────── */
/*
 * blowLevel 0–1: how hard the user is currently blowing.
 * At 0 the flame burns normally; at 1 it thrashes wildly sideways.
 */
const RealisticFlame = ({
  intensity,
  blowLevel = 0,
}: {
  intensity: number;
  blowLevel?: number;
}) => {
  if (intensity <= 0) return null;
  const h = Math.round(65 * intensity);
  const tilt = blowLevel * 22;           // max tilt degrees
  const flickerDur = Math.max(0.18, 0.9 - blowLevel * 0.65); // faster when blowing

  return (
    /* Outer wrapper tilts the whole flame */
    <motion.div
      animate={
        blowLevel > 0.08
          ? { rotate: [-tilt * 0.5, tilt, -tilt * 0.8, tilt * 0.6, -tilt * 0.4, 0] }
          : { rotate: 0 }
      }
      transition={{
        duration: flickerDur,
        repeat: blowLevel > 0.08 ? Infinity : 0,
        ease: "easeInOut",
      }}
      style={{
        position: "relative",
        width: "40px",
        height: `${h + 10}px`,
        transformOrigin: "bottom center",
      }}
    >
      <motion.div
        animate={{ opacity: [0.45, 0.72, 0.38, 0.62], scale: [1, 1.14, 0.92, 1.08] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", bottom: 0, left: "50%",
          transform: "translateX(-50%)",
          width: "56px", height: `${h + 14}px`,
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background:
            "radial-gradient(ellipse at 50% 68%, rgba(255,145,0,0.7), rgba(255,65,0,0.22) 58%, transparent 80%)",
          filter: "blur(12px)",
        }}
      />
      <motion.div
        animate={{
          scaleX: blowLevel > 0.08
            ? [1, 0.6, 1.3, 0.7, 1.2, 1]
            : [1, 0.87, 1.11, 0.92, 1.05, 1],
          skewX: blowLevel > 0.08
            ? [`0deg`, `${tilt * 0.5}deg`, `-${tilt * 0.6}deg`, `${tilt * 0.4}deg`, `0deg`]
            : ["0deg", "5deg", "-4deg", "3deg", "-2deg", "0deg"],
          scaleY: [1, 1.06, 0.94, 1.04, 0.97, 1],
        }}
        transition={{ duration: flickerDur, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", bottom: 0, left: "50%",
          transform: "translateX(-50%)",
          width: "24px", height: `${h}px`,
          borderRadius: "50% 50% 28% 28% / 56% 56% 44% 44%",
          background:
            "linear-gradient(to top, #bb1100 0%, #ff3300 12%, #ff6600 32%, #ff9900 58%, #ffcc00 80%, rgba(255,228,110,0.5) 93%, transparent)",
          opacity: intensity,
          transition: "opacity 0.3s, height 0.15s",
        }}
      />
      <motion.div
        animate={{ scaleX: [1, 0.84, 1.08, 0.9, 1], scaleY: [1, 1.09, 0.91, 1.06, 1] }}
        transition={{ duration: 0.68, repeat: Infinity, ease: "easeInOut", delay: 0.13 }}
        style={{
          position: "absolute", bottom: 2, left: "50%",
          transform: "translateX(-50%)",
          width: "13px", height: `${Math.round(h * 0.6)}px`,
          borderRadius: "50% 50% 20% 20% / 55% 55% 45% 45%",
          background:
            "linear-gradient(to top, #ffe500 0%, #ffff99 52%, rgba(255,255,190,0.48) 82%, transparent)",
          opacity: intensity,
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 2, left: "50%",
          transform: "translateX(-50%)",
          width: "7px", height: `${Math.round(h * 0.26)}px`,
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background: "linear-gradient(to top, #ccccff, #ffffff 56%, transparent)",
          opacity: intensity,
        }}
      />
    </motion.div>
  );
};

/* ── Smoke trail ─────────────────────────────────────────────────── */
/*
 * 14 particles rise 300 px from the wick. Each follows a unique
 * curling lateral path so the column looks organic. Particles start
 * tiny (~8 px) and bloom to 80-100 px wide, mimicking real smoke
 * dissipation. Opacity peaks early then fades completely.
 */
const SMOKE_PARTICLES = [
  { delay:0.00, dur:6.0, x:[0,-10,-22,-10,-30], sz:8  },
  { delay:0.14, dur:6.5, x:[0, 12, 24, 16, 32], sz:7  },
  { delay:0.28, dur:5.8, x:[0, -5, 14,-18, 10], sz:9  },
  { delay:0.42, dur:7.0, x:[0, 18, 8, 28,  2 ], sz:6  },
  { delay:0.58, dur:6.2, x:[0,-20,-8,-30,-12], sz:9  },
  { delay:0.72, dur:6.8, x:[0,  8, 25, 5, 35 ], sz:7  },
  { delay:0.88, dur:5.5, x:[0,-15, 5,-28,  8 ], sz:8  },
  { delay:1.05, dur:7.2, x:[0, 22,-5, 32, -8 ], sz:6  },
  { delay:0.22, dur:6.3, x:[0,-8,-20,-5,-32 ], sz:9  },
  { delay:0.50, dur:5.9, x:[0, 10,-15, 22,-10], sz:7  },
  { delay:0.78, dur:6.6, x:[0,-18, 8,-25, 15 ], sz:8  },
  { delay:1.10, dur:7.5, x:[0, 5, 28,-8, 36 ], sz:7  },
  { delay:0.35, dur:6.1, x:[0,-12,-28,-6,-35 ], sz:8  },
  { delay:0.95, dur:5.7, x:[0, 16, 30, 10, 38], sz:6  },
] as const;

const SmokeTrail = () => (
  <>
    {SMOKE_PARTICLES.map((p, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 0, x: 0, scale: 0.10 }}
        animate={{
          opacity: [0, 0.52, 0.38, 0.18, 0],
          y:       [0, -75, -155, -230, -300],
          x:       p.x as unknown as number[],
          scale:   [0.10, 0.75, 1.9, 3.4, 5.2],
        }}
        transition={{
          duration: p.dur,
          delay:    p.delay,
          ease:     "easeOut",
          times:    [0, 0.18, 0.45, 0.72, 1.0],
        }}
        style={{
          position: "absolute",
          left:     "50%",
          top:      0,
          marginLeft: `${-(p.sz / 2)}px`,
          marginTop:  `${-(p.sz / 2)}px`,
          width:    `${p.sz}px`,
          height:   `${p.sz}px`,
          borderRadius: "50%",
          background:   "rgba(188,188,196,0.50)",
          filter:       "blur(9px)",
          pointerEvents:"none",
        }}
      />
    ))}
  </>
);

/* ── Main component ──────────────────────────────────────────────── */
const CandleScreen = ({ onComplete }: CandleScreenProps) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [flameIntensity, setFlameIntensity] = useState(1);
  const [blowLevel, setBlowLevel] = useState(0);  // 0–1 wiggle amount
  const blowCountRef = useRef(0);
  const blowChargeRef = useRef(0);               // sustained-blow accumulator
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const blowCooldownRef = useRef(false);
  const readyForNextBlowRef = useRef(true);
  const { playTrack } = useMusic();

  /* Processed cake src — offscreen canvas → data-URL → img */
  const cakeSrc = useProcessedCake("/images/cake-final.png");

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
      /*
       * Three zones (tuned to work on both PC and mobile):
       *   < LOW  → silence: drain charge, flame calm
       *   LOW–HIGH → gentle breath: flame wiggles, no extinguish yet
       *   > HIGH → real blow: charge accumulates; reaches NEEDED → blown out
       *
       * The charge requirement means a single loud spike (keyboard click,
       * cough) won't accidentally extinguish the flame on PC.
       */
      const LOW  = 13;    // no reaction below this
      const HIGH = 22;    // sustained-blow zone above this (lower = easier on Android)
      const NEEDED = 55;  // charge required to extinguish (~0.4–0.7 s of real blowing)

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg < LOW) {
          /* Silence — drain charge and reset */
          blowChargeRef.current = Math.max(0, blowChargeRef.current - 3);
          readyForNextBlowRef.current = true;
          setBlowLevel(0);
          setFlameIntensity(1);
        } else if (avg < HIGH) {
          /* Wiggle zone — flame reacts but charge slowly drains */
          const level = (avg - LOW) / (HIGH - LOW);
          blowChargeRef.current = Math.max(0, blowChargeRef.current - 0.5);
          setBlowLevel(level);
          setFlameIntensity(Math.max(0.65, 1 - level * 0.35));
        } else {
          /* Sustained blow — accumulate charge */
          const extra = avg - HIGH;
          blowChargeRef.current = Math.min(NEEDED + 1, blowChargeRef.current + extra * 0.8);
          setBlowLevel(1);
          setFlameIntensity(Math.max(0.25, 0.6 - (extra / 60)));

          if (
            blowChargeRef.current >= NEEDED &&
            !blowCooldownRef.current &&
            readyForNextBlowRef.current
          ) {
            blowCooldownRef.current  = true;
            readyForNextBlowRef.current = false;
            blowChargeRef.current    = 0;
            blowCountRef.current    += 1;
            setFlameIntensity(0);
            setBlowLevel(0);
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
      if (analyserRef.current && streamRef.current && audioContextRef.current)
        startDetection(analyserRef.current, streamRef.current, audioContextRef.current);
    }, 1800);
    return () => { clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); clearTimeout(resume); };
  }, [phase, startDetection]);

  useEffect(() => {
    if (phase !== "blown") return;
    setFlameIntensity(0);
    playTrack(0, 35); // "Who's Dat Girl" from 0:35 — starts immediately on blow-out
    const t = setTimeout(() => setPhase("fireworks"), 5000);
    return () => clearTimeout(t);
  }, [phase, playTrack]);

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

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
  }, []);

  const showCandle = ["candle", "wish", "waiting", "listening", "smoke-relight", "blown"].includes(phase);
  const isBlown = phase === "blown";

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 select-none overflow-hidden"
      style={{ background: "#000", cursor: phase === "waiting" ? "pointer" : "default" }}
      onClick={phase === "waiting" ? startListening : undefined}
    >
      {phase === "fireworks" && <Fireworks onComplete={handleFireworksComplete} />}

      {/* Corner fireworks — visible before music starts, fade out on blow */}
      <CornerFireworks active={!["blown","fireworks","birthday-text","done"].includes(phase)} />

      {/* Skip button */}
      {["intro","candle","wish","waiting","listening","smoke-relight"].includes(phase) && (
        <button
          data-testid="button-skip-candle"
          onClick={() => {
            /* Stop mic detection if active, then jump straight to blown phase */
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            audioContextRef.current?.close().catch(() => {});
            setPhase("blown");
          }}
          style={{
            position: "fixed", bottom: 28, right: 22, zIndex: 30,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 20,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "'Quicksand',sans-serif",
            fontSize: 13,
            letterSpacing: "0.08em",
            padding: "7px 18px",
            cursor: "pointer",
            backdropFilter: "blur(6px)",
          }}
        >
          Skip →
        </button>
      )}

      {/* ── All text – fixed top, clear of the cake ────────────────── */}
      <div className="fixed top-0 inset-x-0 z-20 flex flex-col items-center pt-16 pointer-events-none">
        <AnimatePresence>
          {phase === "waiting" && (
            <motion.p
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-sm tracking-wider text-center px-8"
              style={{ color: "hsl(340,50%,70%)", fontFamily: "'Quicksand',sans-serif" }}
            >
              Tap anywhere to begin ✨
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "listening" && (
            <motion.p
              key="listening"
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-sm tracking-wider text-center px-8"
              style={{ color: "hsl(340,50%,70%)", fontFamily: "'Quicksand',sans-serif" }}
            >
              Blow gently... 🌬️
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "birthday-text" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="text-center px-8 space-y-4"
            >
              <h1 className="text-5xl md:text-6xl flex items-center justify-center flex-wrap gap-3" style={{ color: "hsl(340,80%,75%)" }}>
                <span>Happy Birthday Kanze</span>
                <svg width="88" height="82" viewBox="0 0 100 92" style={{ display: "inline-block", verticalAlign: "middle", filter: "drop-shadow(0 4px 12px hsl(340 70% 60% / 0.5))" }}>
                  <defs>
                    <clipPath id="heartClip">
                      <path d="M 50,32 C 50,22 41,11 28,11 C 15,11 4,23 4,37 C 4,55 28,72 50,86 C 72,72 96,55 96,37 C 96,23 85,11 72,11 C 59,11 50,22 50,32 Z" />
                    </clipPath>
                  </defs>
                  <image
                    href="/images/kanze-heart.jpeg"
                    x="0" y="0" width="100" height="100"
                    clipPath="url(#heartClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </svg>
              </h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-xl"
                style={{ color: "hsl(340,60%,80%)", fontFamily: "'Quicksand',sans-serif" }}
              >
                21 looks good on you.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "candle" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="px-8 text-center"
              style={{ color: "hsl(340,60%,80%)", fontFamily: "'Dancing Script',cursive", fontSize: "1.5rem" }}
            >
              Before Chapter 21 begins...
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "wish" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="px-8 text-center"
              style={{ color: "hsl(340,60%,85%)", fontFamily: "'Dancing Script',cursive", fontSize: "1.8rem" }}
            >
              Make a wish.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "smoke-relight" && (
            <motion.div
              initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg"
                style={{ color: "hsl(340,60%,80%)", fontFamily: "'Dancing Script',cursive" }}
              >
                {blowCountRef.current === 1 ? "Oops, try that again! 😄" : "One last time! 🌬️"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cake + flame – pinned bottom-center ──────────────────── */}
      <AnimatePresence>
        {showCandle && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute left-1/2"
            style={{ transform: "translateX(-50%)", bottom: "-60px" }}
          >
            <div className="relative" style={{ width: "480px", maxWidth: "100vw" }}>

              {/* Flame + wick */}
              <div
                className="absolute left-1/2"
                style={{ transform: "translateX(-50%)", top: "28%", zIndex: 4 }}
              >
                <div style={{
                  position: "relative",
                  marginTop: isBlown ? 0 : "-80px",
                  display: "flex", justifyContent: "center",
                  transition: "margin-top 0.2s",
                }}>
                  <RealisticFlame intensity={flameIntensity} blowLevel={blowLevel} />
                </div>

                {isBlown && (
                  <div style={{
                    position: "absolute", top: "-80px",
                    left: "50%", transform: "translateX(-50%)", zIndex: 5,
                  }}>
                    <SmokeTrail />
                  </div>
                )}

                <div className="mx-auto" style={{
                  width: "2px", height: "10px",
                  background: isBlown
                    ? "linear-gradient(to bottom,#555,#222)"
                    : "linear-gradient(to bottom,#ff9900,#333)",
                  borderRadius: "1px",
                }} />
              </div>

              {/*
               * Cake image — offscreen canvas erases the brownish background
               * (stores result as a data-URL). Transparent pixels in the img
               * reveal the black parent div naturally – no mask, no glow.
               */}
              <img
                src={cakeSrc}
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
