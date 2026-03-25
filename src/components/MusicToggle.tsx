import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";
import { useLocation } from "react-router-dom";
import { SkipBack, Play, Pause, SkipForward } from "lucide-react";

const BAR_COUNT = 28;

const formatTime = (s: number) => {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const STICKERS = [
  { emoji: "🎂", top: "6%",  left: "4%",  size: 22, rotate: -15 },
  { emoji: "🌈", top: "4%",  right: "6%", size: 20, rotate: 10  },
  { emoji: "🍦", top: "38%", left: "2%",  size: 18, rotate: -8  },
  { emoji: "🕶️", top: "35%", right: "3%", size: 18, rotate: 12  },
  { emoji: "🎁", bottom: "8%", left: "5%", size: 19, rotate: 8  },
  { emoji: "⭐", bottom: "10%", right: "4%", size: 18, rotate: -6 },
  { emoji: "💅", top: "65%", left: "2%",  size: 16, rotate: 5   },
  { emoji: "🧁", top: "64%", right: "3%", size: 16, rotate: -10 },
];

const useTypewriter = (text: string, speed = 55) => {
  const [displayed, setDisplayed] = useState("");
  const prevText = useRef(text);

  useEffect(() => {
    if (text === prevText.current && displayed === text) return;
    prevText.current = text;
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return displayed;
};

const MusicPlayerBar = () => {
  const { toggle, isPlaying, next, prev, trackTitle, analyserNode, currentTime, duration, seek, hasStarted } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const typedTitle = useTypewriter(trackTitle, 60);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let data: number[] = [];

    if (analyserNode && isPlaying) {
      const bufLen = analyserNode.frequencyBinCount;
      const raw = new Uint8Array(bufLen);
      analyserNode.getByteFrequencyData(raw);
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = Math.floor((i / BAR_COUNT) * bufLen);
        data.push(raw[idx] / 255);
      }
    } else {
      data = Array(BAR_COUNT).fill(0.08);
    }

    const barW = (w / BAR_COUNT) * 0.6;
    const gap  = (w / BAR_COUNT) * 0.4;

    for (let i = 0; i < BAR_COUNT; i++) {
      const barH = Math.max(4, data[i] * h * 0.9);
      const x = i * (barW + gap) + gap / 2;
      const y = (h - barH) / 2;

      const gradient = ctx.createLinearGradient(x, y + barH, x, y);
      gradient.addColorStop(0,   "hsl(340, 85%, 50%)");
      gradient.addColorStop(0.5, "hsl(345, 90%, 62%)");
      gradient.addColorStop(1,   "hsl(15,  100%, 72%)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width  = canvas.offsetWidth  * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect  = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const location = useLocation();
  const showPlayer = hasStarted && location.pathname === "/hub";

  return (
    <AnimatePresence>
      {showPlayer && (
        <motion.div
          key="music-player"
          initial={{ y: 30, opacity: 0, scale: 0.92 }}
          animate={{ y: 0,  opacity: 1, scale: 1     }}
          exit={  { y: 30, opacity: 0, scale: 0.92   }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[310px] mx-auto rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, hsl(340,75%,88%) 0%, hsl(350,72%,91%) 50%, hsl(30,85%,90%) 100%)",
            border: "2.5px solid hsl(340,60%,78%)",
            boxShadow: "0 8px 32px hsl(340 60% 65% / 0.28), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
          }}
        >
          {/* ── Sticker decorations ── */}
          {STICKERS.map((s, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1  }}
              transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 280, damping: 18 }}
              className="absolute pointer-events-none select-none leading-none"
              style={{
                fontSize: s.size,
                top:    s.top,
                left:   (s as any).left,
                right:  (s as any).right,
                bottom: (s as any).bottom,
                transform: `rotate(${s.rotate}deg)`,
                filter: "drop-shadow(0 1px 2px hsl(340 40% 50% / 0.25))",
              }}
            >
              {s.emoji}
            </motion.span>
          ))}

          {/* ── Header ── */}
          <div className="pt-4 pb-1 text-center relative z-10 px-10">
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0   }}
              transition={{ delay: 0.2 }}
              className="text-[10px] tracking-[0.28em] uppercase font-bold"
              style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif", letterSpacing: "0.22em" }}
            >
              ✨ now playing ✨
            </motion.p>

            {/* ── Typewriter track title ── */}
            <div
              className="mt-1 text-base font-extrabold leading-snug min-h-[1.5em] tracking-tight"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "1.25rem",
                color: "hsl(340, 55%, 32%)",
                textShadow: "0 1px 0 hsl(0 0% 100% / 0.6)",
              }}
            >
              {typedTitle}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "steps(1)" }}
                style={{ color: "hsl(340, 70%, 60%)" }}
              >
                |
              </motion.span>
            </div>
          </div>

          {/* ── Waveform ── */}
          <div className="relative z-10 mx-5 mt-2 rounded-2xl overflow-hidden"
            style={{ height: 40, background: "hsl(340 40% 96% / 0.5)" }}>
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          {/* ── Progress bar ── */}
          <div className="relative z-10 mx-5 mt-2.5">
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="w-full h-1.5 rounded-full cursor-pointer overflow-hidden"
              style={{ background: "hsl(340, 30%, 82%)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-150 ease-linear"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, hsl(340,80%,55%), hsl(350,100%,68%))",
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] tabular-nums" style={{ color: "hsl(340,40%,55%)", fontFamily: "'Quicksand', sans-serif" }}>
                {formatTime(currentTime)}
              </span>
              <span className="text-[9px] tabular-nums" style={{ color: "hsl(340,40%,55%)", fontFamily: "'Quicksand', sans-serif" }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="relative z-10 flex items-center justify-center gap-4 py-3">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={prev}
              className="flex items-center justify-center"
              style={{ color: "hsl(340,50%,52%)" }}
              aria-label="Previous"
            >
              <SkipBack size={19} fill="currentColor" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={toggle}
              className="flex items-center justify-center w-11 h-11 rounded-full shadow-md"
              style={{
                background: "linear-gradient(135deg, hsl(340,80%,60%), hsl(350,90%,68%))",
                color: "white",
                boxShadow: "0 4px 14px hsl(340 70% 60% / 0.4)",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause  size={18} fill="white" />
                : <Play   size={18} fill="white" style={{ marginLeft: 2 }} />
              }
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={next}
              className="flex items-center justify-center"
              style={{ color: "hsl(340,50%,52%)" }}
              aria-label="Next"
            >
              <SkipForward size={19} fill="currentColor" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MusicPlayerBar;
