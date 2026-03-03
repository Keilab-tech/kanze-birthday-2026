import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";
import { SkipBack, Play, Pause, SkipForward } from "lucide-react";

const BAR_COUNT = 32;

const MusicPlayerBar = () => {
  const { toggle, isPlaying, next, prev, trackTitle, analyserNode } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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
      // Sample BAR_COUNT bars from the frequency data
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = Math.floor((i / BAR_COUNT) * bufLen);
        data.push(raw[idx] / 255);
      }
    } else {
      // Idle: small flat bars
      data = Array(BAR_COUNT).fill(0.05);
    }

    const barW = (w / BAR_COUNT) * 0.65;
    const gap = (w / BAR_COUNT) * 0.35;

    for (let i = 0; i < BAR_COUNT; i++) {
      const barH = Math.max(3, data[i] * h * 0.9);
      const x = i * (barW + gap) + gap / 2;
      const y = (h - barH) / 2;

      // Gradient from rose to princess-glow (matching theme hue 340)
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-2"
        style={{
          background: "linear-gradient(180deg, hsl(340, 30%, 14%) 0%, hsl(340, 20%, 8%) 100%)",
          borderTop: "1px solid hsl(340, 40%, 25%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            className="p-2 rounded-full transition-colors"
            style={{ color: "hsl(340, 60%, 75%)" }}
            aria-label="Previous track"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={toggle}
            className="p-2.5 rounded-full transition-colors"
            style={{
              background: "hsl(340, 80%, 65%)",
              color: "hsl(0, 0%, 100%)",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>

          <button
            onClick={next}
            className="p-2 rounded-full transition-colors"
            style={{ color: "hsl(340, 60%, 75%)" }}
            aria-label="Next track"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>

        {/* Waveform visualizer */}
        <div className="flex-1 h-10 relative overflow-hidden rounded-lg"
          style={{ background: "hsl(340, 20%, 10%, 0.5)" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>

        {/* Track name */}
        <span
          className="text-xs font-medium shrink-0 max-w-[100px] truncate"
          style={{ color: "hsl(340, 50%, 75%)" }}
        >
          {trackTitle}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicPlayerBar;
