import { useEffect, useRef } from "react";

interface Props { active: boolean; }

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  trail: { x: number; y: number }[];
}

const W = 240, H = 200;
const COLORS = ["#ffffff", "#ffd6ec", "#ffb3d9", "#ffe066", "#ffcba4", "#d4b8ff"];

const CornerFireworks = ({ active }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    canvas.width  = W;
    canvas.height = H;

    const sparks: Spark[] = [];
    let frame = 0;
    let animId = 0;
    let alpha = 0; // canvas-level fade

    const burst = () => {
      /* random position within the top-right corner area */
      const bx = 30 + Math.random() * (W - 60);
      const by = 22 + Math.random() * (H - 50);
      const n  = 9 + Math.floor(Math.random() * 7);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = 0.6 + Math.random() * 1.6;
        sparks.push({
          x: bx, y: by,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 38 + Math.random() * 28,
          color,
          size: 1.2 + Math.random() * 1.6,
          trail: [],
        });
      }
    };

    const animate = () => {
      frame++;

      /* fade canvas in/out */
      if (activeRef.current) {
        alpha = Math.min(1, alpha + 0.06);
      } else {
        alpha = Math.max(0, alpha - 0.04);
        if (alpha <= 0) return; /* stop loop naturally */
      }

      ctx.clearRect(0, 0, W, H);

      /* launch a new burst every ~60 frames while active */
      if (activeRef.current && frame % 60 === 1) burst();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        /* keep a 3-point trail */
        s.trail.unshift({ x: s.x, y: s.y });
        if (s.trail.length > 3) s.trail.pop();

        s.x  += s.vx;
        s.y  += s.vy;
        s.vy += 0.028; /* soft gravity */
        s.vx *= 0.98;
        s.life++;

        const t = s.life / s.maxLife;
        if (t >= 1) { sparks.splice(i, 1); continue; }

        const a = (1 - t) * alpha;

        /* trail */
        for (let k = 0; k < s.trail.length; k++) {
          ctx.save();
          ctx.globalAlpha = a * (0.35 - k * 0.1);
          ctx.fillStyle   = s.color;
          ctx.beginPath();
          ctx.arc(s.trail[k].x, s.trail[k].y, s.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        /* head */
        ctx.save();
        ctx.globalAlpha  = a;
        ctx.fillStyle    = s.color;
        ctx.shadowColor  = s.color;
        ctx.shadowBlur   = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    burst(); /* first burst immediately */
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: W,
        height: H,
        pointerEvents: "none",
        zIndex: 15,
      }}
    />
  );
};

export default CornerFireworks;
