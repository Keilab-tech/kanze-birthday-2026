import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";
import { useLocation } from "react-router-dom";
import { SkipBack, Play, Pause, SkipForward } from "lucide-react";

const BAR_COUNT = 32;

const formatTime = (s: number) => {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MusicPlayerBar = () => {
  const { toggle, isPlaying, next, prev, trackTitle, analyserNode, currentTime, duration, seek, hasStarted } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef<HTMLDivElement>(null);

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
      data = Array(BAR_COUNT).fill(0.05);
    }

    const barW = (w / BAR_COUNT) * 0.65;
    const gap = (w / BAR_COUNT) * 0.35;

    for (let i = 0; i < BAR_COUNT; i++) {
      const barH = Math.max(3, data[i] * h * 0.9);
      const x = i * (barW + gap) + gap / 2;
      const y = (h - barH) / 2;

      const gradient = ctx.createLinearGradient(x, y + barH, x, y);
      gradient.addColorStop(0, "hsl(340, 80%, 55%)");
      gradient.addColorStop(0.5, "hsl(340, 90%, 70%)");
      gradient.addColorStop(1, "hsl(350, 100%, 82%)");

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
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
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
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full max-w-[290px] mx-auto rounded-xl flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(340, 30%, 14%) 0%, hsl(340, 20%, 8%) 100%)",
          borderTop: "1px solid hsl(340, 40%, 25%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="w-full h-1 cursor-pointer group relative"
          style={{ background: "hsl(340, 20%, 20%)" }}
        >
          <div
            className="h-full transition-[width] duration-150 ease-linear relative"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, hsl(340, 80%, 55%), hsl(350, 100%, 75%))",
            }}
          >
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "hsl(350, 100%, 82%)", boxShadow: "0 0 6px hsl(340, 80%, 65%)" }}
            />
          </div>
        </div>

        {/* Main controls row */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={prev} className="p-1.5 rounded-full transition-colors" style={{ color: "hsl(340, 60%, 75%)" }} aria-label="Previous track">
              <SkipBack size={15} fill="currentColor" />
            </button>

            <button onClick={toggle} className="p-2 rounded-full transition-colors" style={{ background: "hsl(340, 80%, 65%)", color: "hsl(0, 0%, 100%)" }} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>

            <button onClick={next} className="p-1.5 rounded-full transition-colors" style={{ color: "hsl(340, 60%, 75%)" }} aria-label="Next track">
              <SkipForward size={15} fill="currentColor" />
            </button>
          </div>

          {/* Time */}
          <span className="text-[10px] tabular-nums shrink-0" style={{ color: "hsl(340, 40%, 60%)" }}>
            {formatTime(currentTime)}
          </span>

          {/* Waveform visualizer */}
          <div className="flex-1 h-8 relative overflow-hidden rounded-md"
            style={{ background: "hsl(340, 20%, 10%, 0.5)" }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          {/* Time remaining */}
          <span className="text-[10px] tabular-nums shrink-0" style={{ color: "hsl(340, 40%, 60%)" }}>
            {formatTime(duration)}
          </span>

          {/* Track name */}
          <span className="text-[10px] font-medium shrink-0 max-w-[72px] truncate" style={{ color: "hsl(340, 50%, 75%)" }}>
            {trackTitle}
          </span>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MusicPlayerBar;
