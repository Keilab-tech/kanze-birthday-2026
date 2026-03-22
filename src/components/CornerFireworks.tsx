import { useEffect, useRef, RefObject, MutableRefObject, CSSProperties } from "react";

interface Props { active: boolean; }

const COLORS = [
  "hsl(340,90%,80%)",  // pink
  "hsl(350,80%,85%)",  // light pink
  "hsl(20,90%,85%)",   // peach
  "hsl(50,95%,82%)",   // gold
  "hsl(300,70%,80%)",  // lavender
  "hsl(0,0%,98%)",     // white
  "hsl(330,75%,72%)",  // rose
];

interface Rocket {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  trail: { x: number; y: number; a: number }[];
  burst: boolean;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  trail: { x: number; y: number }[];
}

function makeCanvas(ref: RefObject<HTMLCanvasElement>, W: number, H: number, side: "left" | "right", activeRef: MutableRefObject<boolean>) {
  const canvas = ref.current!;
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;

  const rockets: Rocket[] = [];
  const particles: Particle[] = [];
  let frame = 0;
  let animId = 0;
  let alpha = 1;

  const launchRocket = () => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    /* launch from bottom corners, angle slightly inward */
    const startX = side === "left" ? 20 + Math.random() * 40 : W - 60 + Math.random() * 40;
    const targetX = side === "left" ? 40 + Math.random() * (W * 0.6) : W * 0.4 + Math.random() * (W * 0.55);
    const targetY = 20 + Math.random() * (H * 0.45);
    const dist = Math.hypot(targetX - startX, targetY - H);
    const speed = 3.5 + Math.random() * 2;
    rockets.push({
      x: startX, y: H,
      vx: (targetX - startX) / dist * speed,
      vy: (targetY - H) / dist * speed,
      color, trail: [], burst: false,
    });
  };

  const burst = (x: number, y: number, color: string) => {
    const count = 28 + Math.floor(Math.random() * 18);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 1.2 + Math.random() * 3.2;
      const alt = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? color : alt,
        size: 1.6 + Math.random() * 2.2,
        alpha: 1,
        decay: 0.014 + Math.random() * 0.012,
        trail: [],
      });
    }
    /* star-burst secondary sparks */
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: "hsl(50,100%,90%)",
        size: 0.9 + Math.random() * 1.2,
        alpha: 0.9,
        decay: 0.022 + Math.random() * 0.015,
        trail: [],
      });
    }
  };

  const animate = () => {
    frame++;

    if (activeRef.current) {
      alpha = Math.min(1, alpha + 0.05);
    } else {
      alpha = Math.max(0, alpha - 0.03);
      if (alpha <= 0) return;
    }

    ctx.clearRect(0, 0, W, H);

    /* launch new rocket every ~80 frames alternating sides */
    if (activeRef.current && frame % 80 === 1) launchRocket();

    /* rockets */
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.trail.unshift({ x: r.x, y: r.y, a: alpha });
      if (r.trail.length > 8) r.trail.pop();
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.06; /* gravity */

      /* burst when slowing or reaching top 35% of canvas */
      if (r.y <= H * 0.38 || r.vy >= 0) {
        burst(r.x, r.y, r.color);
        rockets.splice(i, 1);
        continue;
      }

      /* draw trail */
      for (let k = 0; k < r.trail.length; k++) {
        ctx.save();
        ctx.globalAlpha = (alpha * (1 - k / r.trail.length)) * 0.7;
        ctx.fillStyle = r.color;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(r.trail[k].x, r.trail[k].y, 1.8 * (1 - k / r.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* head */
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* particles */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 4) p.trail.pop();
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.045;
      p.vx *= 0.97;
      p.alpha -= p.decay;

      if (p.alpha <= 0) { particles.splice(i, 1); continue; }

      const a = p.alpha * alpha;

      /* trail */
      for (let k = 0; k < p.trail.length; k++) {
        ctx.save();
        ctx.globalAlpha = a * (0.4 - k * 0.08);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.trail[k].x, p.trail[k].y, p.size * 0.55 * (1 - k / p.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* head */
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animId = requestAnimationFrame(animate);
  };

  launchRocket();
  animate();
  return () => cancelAnimationFrame(animId);
}

const W = 260, H = 320;

const CornerFireworks = ({ active }: Props) => {
  const leftRef  = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const cleanLeft = makeCanvas(leftRef, W, H, "left", activeRef);
    let cleanRight: (() => void) | undefined;
    /* stagger right side so they don't burst simultaneously */
    const t = setTimeout(() => {
      cleanRight = makeCanvas(rightRef, W, H, "right", activeRef);
    }, 600);
    return () => { cleanLeft(); cleanRight?.(); clearTimeout(t); };
  }, []);

  const shared: CSSProperties = {
    position: "fixed", top: 0, width: W, height: H,
    pointerEvents: "none", zIndex: 15,
  };

  return (
    <>
      <canvas ref={leftRef}  style={{ ...shared, left: 0 }} />
      <canvas ref={rightRef} style={{ ...shared, right: 0 }} />
    </>
  );
};

export default CornerFireworks;
