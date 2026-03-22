import { useEffect, useRef } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
type PType = "heart" | "bigHeart" | "star" | "petal" | "dot";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; alpha: number;
  type: PType;
  life: number; maxLife: number;
  hue: number; sat: number; lit: number;
  rot: number; rotSpeed: number;
  driftFreq: number; driftAmp: number; driftPhase: number;
  twinklePhase: number; twinkleFreq: number;
  burst: boolean;
}

const MAX_PARTICLES = 50;
const BURST_EVERY   = 260;

/* ── Component ─────────────────────────────────────────────────────── */
const PinkParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const imgRef    = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    /* Pre-load Kanze photo for heart particles */
    const img = new Image();
    img.src = "/images/kanze-heart.jpeg";
    imgRef.current = img;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) =>
      (mouseRef.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMouse);

    /* ── Spawn ────────────────────────────────────────────────────── */
    const pickType = (): PType => {
      const r = Math.random();
      if (r < 0.28) return "heart";
      if (r < 0.44) return "bigHeart";
      if (r < 0.60) return "star";
      if (r < 0.78) return "petal";
      return "dot";
    };

    const spawnParticle = (x?: number, burst = false): Particle => {
      const type = burst
        ? (Math.random() < 0.6 ? "heart" : "bigHeart")
        : pickType();

      const sizes: Record<PType, [number, number]> = {
        heart:    [7, 15],
        bigHeart: [20, 42],
        star:     [5, 13],
        petal:    [9, 20],
        dot:      [2, 5],
      };
      const [mn, mx] = sizes[type];
      const hue = 315 + Math.random() * 60;

      return {
        x: x ?? Math.random() * canvas.width,
        y: canvas.height + 40,
        vx: (Math.random() - 0.5) * (burst ? 1.8 : 0.45),
        vy: -(Math.random() * 0.75 + (burst ? 1.1 : 0.22)),
        size: mn + Math.random() * (mx - mn),
        alpha: 0,
        type, burst,
        life: 0,
        maxLife: burst ? 180 + Math.random() * 100 : 340 + Math.random() * 270,
        hue,
        sat: type === "dot" ? 50 + Math.random() * 25 : 62 + Math.random() * 28,
        lit: type === "bigHeart" ? 74 + Math.random() * 16 : 68 + Math.random() * 22,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        driftFreq: 0.010 + Math.random() * 0.018,
        driftAmp:  0.45 + Math.random() * 1.35,
        driftPhase: Math.random() * Math.PI * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleFreq: 0.04 + Math.random() * 0.07,
      };
    };

    /* ── Draw helpers ─────────────────────────────────────────────── */
    const drawHeartShape = (ctx: CanvasRenderingContext2D, size: number) => {
      const s = size * 0.10;
      ctx.beginPath();
      ctx.moveTo(0, s * 3);
      ctx.bezierCurveTo( 0,    s,    -s*5, s,    -s*5, s*3);
      ctx.bezierCurveTo(-s*5,  s*6,   0,   s*9,   0,   s*10);
      ctx.bezierCurveTo( 0,    s*9,   s*5, s*6,   s*5, s*3);
      ctx.bezierCurveTo( s*5,  s,     0,   s,     0,   s*3);
      ctx.closePath();
    };

    /* Heart with Kanze photo clipped inside, glow drawn behind */
    const heartImg = (
      cx: number, cy: number, size: number,
      rot: number, alpha: number, glowR: number,
    ) => {
      const s = size * 0.10;
      const hw = s * 10;

      /* 1 — soft pink glow behind the heart */
      if (glowR > 0) {
        ctx.save();
        ctx.translate(cx, cy - s * 5);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha * 0.35;
        ctx.shadowColor = "hsl(340, 80%, 82%)";
        ctx.shadowBlur  = glowR;
        ctx.fillStyle   = "hsl(340, 70%, 80%)";
        drawHeartShape(ctx, size);
        ctx.fill();
        ctx.restore();
      }

      /* 2 — photo clipped to heart path */
      ctx.save();
      ctx.translate(cx, cy - s * 5);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;

      /* clip to heart */
      drawHeartShape(ctx, size);
      ctx.clip();

      const photo = imgRef.current;
      if (photo && photo.complete && photo.naturalWidth > 0) {
        /* Draw photo centred and covering the heart bounding box */
        ctx.drawImage(photo, -hw / 2, 0, hw, hw);
      } else {
        /* Fallback solid fill while image loads */
        ctx.fillStyle = "hsl(340, 65%, 75%)";
        ctx.fill();
      }

      ctx.restore();
    };

    /* 4-pointed star */
    const star = (
      cx: number, cy: number, size: number,
      rot: number, hue: number, sat: number, lit: number, alpha: number,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.shadowColor = `hsl(${hue},${sat}%,${Math.min(98, lit + 22)}%)`;
      ctx.shadowBlur  = size * 2.2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = `hsl(${hue},${sat}%,${lit + 10}%)`;
      for (let pass = 0; pass < 2; pass++) {
        ctx.save();
        ctx.rotate(pass * Math.PI / 4);
        const ou = size, in_ = size * 0.28;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const oa = (k / 4) * Math.PI * 2;
          const ia = oa + Math.PI / 4;
          k === 0
            ? ctx.moveTo(Math.cos(oa) * ou, Math.sin(oa) * ou)
            : ctx.lineTo(Math.cos(oa) * ou, Math.sin(oa) * ou);
          ctx.lineTo(Math.cos(ia) * in_, Math.sin(ia) * in_);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    /* Rose petal */
    const petal = (
      cx: number, cy: number, size: number,
      rot: number, hue: number, sat: number, lit: number, alpha: number,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha * 0.70;
      ctx.fillStyle   = `hsl(${hue},${sat}%,${lit}%)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.38, size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /* Dot */
    const dot = (
      cx: number, cy: number, size: number,
      hue: number, sat: number, lit: number, alpha: number,
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = `hsl(${hue},${sat}%,${lit + 12}%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /* ── Main loop ────────────────────────────────────────────────── */
    const particles: Particle[] = [];
    let frame = 0, animId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (particles.length < MAX_PARTICLES && Math.random() < 0.09)
        particles.push(spawnParticle());

      if (frame % BURST_EVERY === 0) {
        const bx = 60 + Math.random() * (canvas.width - 120);
        const n  = 6 + Math.floor(Math.random() * 5);
        for (let k = 0; k < n; k++)
          particles.push(spawnParticle(bx + (Math.random() - 0.5) * 40, true));
      }

      const { x: mx, y: my } = mouseRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.rot += p.rotSpeed;

        p.x += p.vx + Math.sin(p.life * p.driftFreq + p.driftPhase) * p.driftAmp;
        p.y += p.vy;

        if (mx > 0) {
          const dx = p.x - mx, dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 8100) {
            const d = Math.sqrt(d2);
            const f = ((90 - d) / 90) * 0.9;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }

        const fadeIn  = Math.min(p.life / 45, 1);
        const fadeOut = Math.max(0, 1 - Math.max(0, p.life - p.maxLife + 65) / 65);
        const twinkle = p.type === "star"
          ? 0.55 + 0.45 * Math.sin(p.life * p.twinkleFreq + p.twinklePhase)
          : 1.0;
        p.alpha = fadeIn * fadeOut * 0.78 * twinkle;

        if (p.life > p.maxLife || p.y < -80) {
          particles.splice(i, 1);
          continue;
        }

        switch (p.type) {
          case "heart":
            heartImg(p.x, p.y, p.size, p.rot, p.alpha, p.size * 1.0);
            break;
          case "bigHeart":
            heartImg(p.x, p.y, p.size, p.rot * 0.35, p.alpha * 0.88, p.size * 2.8);
            break;
          case "star":
            star(p.x, p.y, p.size, p.rot, p.hue, p.sat, p.lit, p.alpha);
            break;
          case "petal":
            petal(p.x, p.y, p.size, p.rot, p.hue, p.sat, p.lit, p.alpha);
            break;
          case "dot":
            dot(p.x, p.y, p.size, p.hue, p.sat, p.lit, p.alpha);
            break;
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.82 }}
    />
  );
};

export default PinkParticlesBackground;
