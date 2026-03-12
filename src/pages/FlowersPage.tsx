import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════ */
/*  SVG path helpers                                                    */
/* ═══════════════════════════════════════════════════════════════════ */
const ff = (n: number) => Math.round(n * 10) / 10;

/** Curved filled stem from (sx,sy)→(tx,ty), width sw */
function stemPath(sx: number, sy: number, tx: number, ty: number, sw: number) {
  const hw = sw / 2;
  const dx = tx - sx, dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * hw, ny = (dx / len) * hw;
  /* gentle S-curve control points */
  const c1x = sx + dx * 0.28 + nx * 0.15, c1y = sy + dy * 0.28 + ny * 0.15;
  const c2x = sx + dx * 0.72 - nx * 0.15, c2y = sy + dy * 0.72 - ny * 0.15;
  return [
    `M${ff(sx + nx)} ${ff(sy + ny)}`,
    `C${ff(c1x + nx)} ${ff(c1y + ny)} ${ff(c2x + nx)} ${ff(c2y + ny)} ${ff(tx + nx * 0.35)} ${ff(ty + ny * 0.35)}`,
    `L${ff(tx - nx * 0.35)} ${ff(ty - ny * 0.35)}`,
    `C${ff(c2x - nx)} ${ff(c2y - ny)} ${ff(c1x - nx)} ${ff(c1y - ny)} ${ff(sx - nx)} ${ff(sy - ny)}`,
    "Z",
  ].join(" ");
}

/** Filled oval leaf */
function leafPath(ax: number, ay: number, angleDeg: number, L: number, w: number) {
  const a = (angleDeg * Math.PI) / 180, p = a + Math.PI / 2;
  const tx = ax + L * Math.cos(a), ty = ay + L * Math.sin(a);
  const lc1x = ax + L * 0.24 * Math.cos(a) + w * 0.68 * Math.cos(p);
  const lc1y = ay + L * 0.24 * Math.sin(a) + w * 0.68 * Math.sin(p);
  const lc2x = ax + L * 0.76 * Math.cos(a) + w * 0.90 * Math.cos(p);
  const lc2y = ay + L * 0.76 * Math.sin(a) + w * 0.90 * Math.sin(p);
  const rc1x = ax + L * 0.76 * Math.cos(a) - w * 0.90 * Math.cos(p);
  const rc1y = ay + L * 0.76 * Math.sin(a) - w * 0.90 * Math.sin(p);
  const rc2x = ax + L * 0.24 * Math.cos(a) - w * 0.68 * Math.cos(p);
  const rc2y = ay + L * 0.24 * Math.sin(a) - w * 0.68 * Math.sin(p);
  return `M${ff(ax)} ${ff(ay)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(ax)} ${ff(ay)}Z`;
}

/** Single filled petal from centre */
function petalPath(cx: number, cy: number, angleDeg: number, L: number, w: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180, p = a + Math.PI / 2;
  const tx = cx + L * Math.cos(a), ty = cy + L * Math.sin(a);
  const lc1x = cx + L * 0.20 * Math.cos(a) + w * 0.55 * Math.cos(p);
  const lc1y = cy + L * 0.20 * Math.sin(a) + w * 0.55 * Math.sin(p);
  const lc2x = cx + L * 0.78 * Math.cos(a) + w * 0.92 * Math.cos(p);
  const lc2y = cy + L * 0.78 * Math.sin(a) + w * 0.92 * Math.sin(p);
  const rc1x = cx + L * 0.78 * Math.cos(a) - w * 0.92 * Math.cos(p);
  const rc1y = cy + L * 0.78 * Math.sin(a) - w * 0.92 * Math.sin(p);
  const rc2x = cx + L * 0.20 * Math.cos(a) - w * 0.55 * Math.cos(p);
  const rc2y = cy + L * 0.20 * Math.sin(a) - w * 0.55 * Math.sin(p);
  return `M${ff(cx)} ${ff(cy)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(cx)} ${ff(cy)}Z`;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  10-flower definitions                                               */
/*  sx=stem base x, tx/ty=flower tip, sw=stem width, r=petal radius,  */
/*  pN=petal count, hue=petal colour, cHue=centre hue                  */
/* ═══════════════════════════════════════════════════════════════════ */
const FDEFS = [
  { sx:  20, tx:  16, ty: 438, sw: 2.8, r:  7, pN: 4, hue:  50, cHue: 38  },
  { sx:  57, tx:  50, ty: 370, sw: 3.8, r: 10, pN: 5, hue: 270, cHue: 285 },
  { sx:  95, tx:  85, ty: 294, sw: 5.2, r: 13, pN: 6, hue: 340, cHue: 355 },
  { sx: 133, tx: 121, ty: 220, sw: 7.2, r: 17, pN: 7, hue:  30, cHue:  48 },
  { sx: 170, tx: 167, ty: 158, sw: 9.2, r: 21, pN: 8, hue: 350, cHue:  12 },
  { sx: 208, tx: 215, ty: 148, sw: 9.4, r: 22, pN: 8, hue:  55, cHue:  42 },
  { sx: 246, tx: 254, ty: 212, sw: 7.2, r: 17, pN: 7, hue: 280, cHue: 298 },
  { sx: 283, tx: 296, ty: 290, sw: 5.2, r: 13, pN: 6, hue: 330, cHue: 350 },
  { sx: 318, tx: 330, ty: 367, sw: 3.8, r: 10, pN: 5, hue:  40, cHue:  28 },
  { sx: 345, tx: 354, ty: 430, sw: 2.8, r:  7, pN: 4, hue: 200, cHue: 218 },
] as const;

/* Sprouting order: centre-outward */
const SPROUT_ORDER = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];

/* Per-flower timing */
const flowerDelays = FDEFS.map((_, i) => {
  const order   = SPROUT_ORDER.indexOf(i);
  const stemDel = order * 0.20;
  const leafDel = stemDel + 0.70;
  const petDel  = leafDel + 0.38;
  return { stem: stemDel, leaf: leafDel, petal: petDel };
});

/* Sway config (amp inversely proportional to size = outer flowers sway more) */
const SWAY_CFG = FDEFS.map((f, i) => ({
  x: f.sx, y: 480,
  freq:  0.42 + Math.abs(Math.sin(i * 1.9)) * 0.28,
  phase: i * 0.65,
  amp:   Math.max(1.2, 5.2 - f.r * 0.13),
}));

/* ═══════════════════════════════════════════════════════════════════ */
/*  Pollen particle type                                                */
/* ═══════════════════════════════════════════════════════════════════ */
interface PollenParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  life: number; maxLife: number;
  hue: number;
  alpha: number;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  FlowersPage component                                               */
/* ═══════════════════════════════════════════════════════════════════ */
export default function FlowersPage() {
  const navigate        = useNavigate();
  const starRef         = useRef<HTMLCanvasElement>(null);
  const pollenRef       = useRef<HTMLCanvasElement>(null);
  const svgRef          = useRef<SVGSVGElement>(null);
  const swayGroupRefs   = useRef<(SVGGElement | null)[]>(Array(10).fill(null));
  const mouseRef        = useRef({ x: -9999, y: 0 });
  const animRef         = useRef(0);
  const pollenAnimRef   = useRef(0);
  const timeRef         = useRef(0);
  const showFlowersRef  = useRef(false);

  const [textPhase,   setTextPhase]   = useState<0 | 1 | 2>(0);
  const [showFlowers, setShowFlowers] = useState(false);
  const [allDone,     setAllDone]     = useState(false);

  /* ── Timing sequence ─────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setTextPhase(1), 350);
    const t2 = setTimeout(() => setTextPhase(2), 3000);
    const t3 = setTimeout(() => { setShowFlowers(true); showFlowersRef.current = true; }, 4600);
    const t4 = setTimeout(() => setAllDone(true), 4600 + 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  /* ── Mouse tracking ──────────────────────────────────────────────── */
  useEffect(() => {
    const onM = (e: MouseEvent) => (mouseRef.current = { x: e.clientX, y: e.clientY });
    const onT = (e: TouchEvent) => {
      if (e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    window.addEventListener("mousemove", onM);
    window.addEventListener("touchmove", onT, { passive: true });
    return () => { window.removeEventListener("mousemove", onM); window.removeEventListener("touchmove", onT); };
  }, []);

  /* ── Cinematic night sky ──────────────────────────────────────────── */
  useEffect(() => {
    const canvas = starRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    /* Star layers */
    const mkLayer = (n: number, minR: number, maxR: number, minOp: number, maxOp: number, minF: number, maxF: number) =>
      Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r:    minR + Math.random() * (maxR - minR),
        base: minOp + Math.random() * (maxOp - minOp),
        freq: minF  + Math.random() * (maxF  - minF),
        phase: Math.random() * Math.PI * 2,
        hue:  Math.random() < 0.12 ? 200 + Math.random() * 40 : 0, // few blue-white stars
      }));

    const far    = mkLayer(280, 0.06, 0.28, 0.03, 0.16, 2.0, 5.5);
    const mid    = mkLayer(130, 0.35, 0.82, 0.10, 0.40, 0.7, 2.0);
    const near   = mkLayer(55,  0.90, 2.20, 0.35, 0.78, 0.2, 0.85);
    const bright = mkLayer(10,  2.50, 4.00, 0.65, 1.00, 0.08, 0.28);

    /* Nebula blobs: (cx, cy, rx, ry, r, g, b, maxA) */
    const nebulae = [
      { cx: 0.12, cy: 0.18, rx: 280, ry: 200, r: 20,  g: 10,  b: 55,  a: 0.22 },
      { cx: 0.85, cy: 0.12, rx: 240, ry: 180, r: 45,  g: 12,  b: 80,  a: 0.18 },
      { cx: 0.55, cy: 0.35, rx: 320, ry: 220, r: 12,  g: 8,   b: 40,  a: 0.12 },
      { cx: 0.72, cy: 0.60, rx: 200, ry: 160, r: 60,  g: 20,  b: 65,  a: 0.10 },
    ];

    /* Shooting-star state */
    type Shoot = { sx: number; sy: number; vx: number; vy: number; life: number; maxLife: number };
    let shoot: Shoot | null = null;
    let shootCooldown = 200 + Math.floor(Math.random() * 240);

    let t = 0, raf = 0;

    const draw = () => {
      const w = canvas.width, h = canvas.height;

      /* Sky gradient background */
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0,   "#000008");
      bg.addColorStop(0.5, "#030010");
      bg.addColorStop(1,   "#06000e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* Nebula */
      nebulae.forEach(n => {
        ctx.save();
        ctx.translate(n.cx * w, n.cy * h);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        grad.addColorStop(0, `rgba(${n.r},${n.g},${n.b},${n.a})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.scale(n.rx, n.ry);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      /* Stars */
      for (const layers of [far, mid, near, bright]) {
        for (const s of layers) {
          const op = s.base * (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)));
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          if (s.hue) {
            ctx.fillStyle = `hsla(${s.hue},60%,90%,${op.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
          }
          ctx.fill();
        }
      }

      /* Bright-star sparkle cross */
      bright.forEach(s => {
        const op = s.base * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)) * 0.55;
        ctx.save();
        ctx.globalAlpha = op;
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.lineWidth = 0.5;
        const len = s.r * 4;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
        ctx.restore();
      });

      /* Shooting star */
      shootCooldown--;
      if (shootCooldown <= 0 && !shoot) {
        const angle = -(25 + Math.random() * 25) * Math.PI / 180;
        const speed = 14 + Math.random() * 10;
        shoot = {
          sx: Math.random() * w * 0.6,
          sy: Math.random() * h * 0.35,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: 14 + Math.floor(Math.random() * 10),
        };
        shootCooldown = 280 + Math.floor(Math.random() * 320);
      }
      if (shoot) {
        const { sx, sy, vx, vy, life, maxLife } = shoot;
        const progress = life / maxLife;
        const headX = sx + vx * life, headY = sy + vy * life;
        const tailX = headX - vx * 10, tailY = headY - vy * 10;
        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(255,255,255,${(1 - progress).toFixed(2)})`);
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.restore();
        shoot.life++;
        if (shoot.life > maxLife) shoot = null;
      }

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* ── Pollen particles from flower tips ───────────────────────────── */
  useEffect(() => {
    const canvas = pollenRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles: PollenParticle[] = [];
    let frameCount = 0;
    let elapsedSinceShow = 0; // frames since showFlowers

    /* Map SVG viewBox coords → screen */
    const tipScreen = (tx: number, ty: number) => {
      const svgW  = Math.min(window.innerWidth, 420);
      const svgH  = svgW * (490 / 360);
      const scale = svgW / 360;
      const offX  = (window.innerWidth - svgW) / 2;
      const offY  = window.innerHeight - svgH;
      return { x: offX + tx * scale, y: offY + ty * scale };
    };

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      if (showFlowersRef.current) elapsedSinceShow++;

      /* Spawn pollen once each flower has bloomed */
      if (elapsedSinceShow > 0) {
        FDEFS.forEach((f, fi) => {
          const petalDelayFrames = Math.ceil(flowerDelays[fi].petal * 60) + 25;
          if (elapsedSinceShow < petalDelayFrames) return;
          /* Larger flowers emit more pollen */
          const emitRate = f.r > 18 ? 0.25 : f.r > 12 ? 0.12 : 0.06;
          if (Math.random() > emitRate) return;
          const tip = tipScreen(f.tx, f.ty);
          particles.push({
            x: tip.x + (Math.random() - 0.5) * f.r * 0.6,
            y: tip.y + (Math.random() - 0.5) * f.r * 0.4,
            vx: (Math.random() - 0.5) * 0.65,
            vy: -(Math.random() * 0.55 + 0.18),
            r:  1.2 + Math.random() * 2.2,
            life: 0,
            maxLife: 90 + Math.floor(Math.random() * 100),
            hue: f.hue,
            alpha: 0,
          });
        });
      }

      /* Draw pollen */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.055 + i) * 0.35;
        p.y += p.vy;

        const fadeIn  = Math.min(p.life / 18, 1);
        const fadeOut = Math.max(0, 1 - Math.max(0, p.life - p.maxLife + 25) / 25);
        p.alpha = fadeIn * fadeOut * 0.75;

        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = `hsl(${p.hue}, 85%, 80%)`;
        ctx.shadowBlur  = p.r * 4;
        ctx.fillStyle   = `hsl(${p.hue}, 75%, 88%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Organic sway (after allDone) ───────────────────────────────── */
  useEffect(() => {
    if (!allDone) return;
    const loop = () => {
      const t = (timeRef.current += 0.016);
      const svg = svgRef.current;
      SWAY_CFG.forEach((cfg, i) => {
        let mouseTilt = 0;
        if (svg && mouseRef.current.x > -9000) {
          const rect = svg.getBoundingClientRect();
          const mx   = ((mouseRef.current.x - rect.left) / rect.width) * 360;
          mouseTilt  = Math.max(-3.5, Math.min(3.5, ((cfg.x - mx) / 130) * 2.2));
        }
        const angle = Math.sin(t * cfg.freq + cfg.phase) * cfg.amp + mouseTilt;
        swayGroupRefs.current[i]?.setAttribute("transform", `rotate(${angle.toFixed(3)},${cfg.x},${cfg.y})`);
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [allDone]);

  /* ── Art: 10 flowers + grass ─────────────────────────────────────── */
  const art = useMemo(() => {
    /* Grass blades (deterministic positions) */
    const seed = (n: number) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
    const grass = Array.from({ length: 22 }, (_, i) => {
      const sx = 6 + i * 16;
      const sy = 480;
      const a  = -88 + seed(i * 3) * 22 - 11;
      const L  = 38 + seed(i * 3 + 1) * 40;
      const w  = 5  + seed(i * 3 + 2) * 5;
      return { d: leafPath(sx, sy, a, L, w), sx, sy };
    });

    /* Flowers */
    const flowers = FDEFS.map((f, i) => {
      const sy = 480;
      const dx = f.tx - f.sx, dy = f.ty - sy;
      const stemLen = Math.sqrt(dx * dx + dy * dy);
      const stemAngle = Math.atan2(dy, dx) * (180 / Math.PI); // typically ~-80 to -100

      const lScale = f.sw / 5;

      /* Leaves — 2 for medium+, 1 for small */
      const leaves: { d: string; ax: number; ay: number; rotDir: number }[] = [];
      const addLeaf = (t: number, side: 1 | -1) => {
        const ax = f.sx + t * dx, ay = sy + t * dy;
        const ang = stemAngle + side * 68;
        const L   = stemLen * 0.22 * lScale;
        const w   = stemLen * 0.10 * lScale;
        leaves.push({ d: leafPath(ax, ay, ang, L, w), ax, ay, rotDir: side });
      };
      addLeaf(0.65, 1);
      if (f.r >= 10) addLeaf(0.38, -1);

      /* Petals — 2 layers */
      const petals: { d: string; op: number; cx: number; cy: number }[] = [];
      const cx = f.tx, cy = f.ty;
      [0, 1].forEach(layer => {
        for (let p = 0; p < f.pN; p++) {
          const ang = (p / f.pN) * 360 + layer * (180 / f.pN);
          const L   = f.r * (0.88 + layer * 0.14);
          const w   = f.r * (0.46 + layer * 0.06);
          petals.push({ d: petalPath(cx, cy, ang, L, w), op: 0.55 + layer * 0.38, cx, cy });
        }
      });

      return { ...f, i, stemD: stemPath(f.sx, sy, f.tx, f.ty, f.sw), leaves, petals, cx: f.tx, cy: f.ty };
    });

    return { grass, flowers };
  }, []);

  /* ── Framer Motion animation props ───────────────────────────────── */
  const stemAnim  = (sx: number, delay: number) => ({
    initial: { scaleY: 0, opacity: 0 },
    animate: showFlowers ? { scaleY: 1, opacity: 1 } : {},
    transition: { duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${sx}px 480px` },
  });

  const leafAnim  = (ax: number, ay: number, rotDir: number, delay: number) => ({
    initial: { scale: 0, rotate: rotDir * 38, opacity: 0 },
    animate: showFlowers ? { scale: 1, rotate: 0, opacity: 1 } : {},
    transition: { duration: 0.36, delay, ease: [0.34, 1.56, 0.64, 1] as [number,number,number,number] },
    style: { transformOrigin: `${ax}px ${ay}px` },
  });

  const petalAnim = (cx: number, cy: number, delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: showFlowers ? { scale: 1, opacity: 1 } : {},
    transition: { duration: 0.30, delay, ease: [0.34, 1.56, 0.64, 1] as [number,number,number,number] },
    style: { transformOrigin: `${cx}px ${cy}px` },
  });

  const grassAnim = (sx: number, sy: number, delay: number) => ({
    initial: { scaleY: 0, opacity: 0 },
    animate: showFlowers ? { scaleY: 1, opacity: 1 } : {},
    transition: { duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${sx}px ${sy}px` },
  });

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#000008" }}>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
      >←</motion.button>

      {/* Night sky canvas */}
      <canvas ref={starRef}  className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Pollen canvas */}
      <canvas ref={pollenRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 15 }} />

      {/* ── "I L O V E U" text ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 z-20 flex justify-center pointer-events-none" style={{ top: "18%" }}>
        <AnimatePresence mode="wait">
          {textPhase === 1 && (
            <motion.p key="t1"
              initial={{ opacity: 0, filter: "blur(14px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(14px)" }}
              transition={{ duration: 1.0 }}
              style={{
                color: "#fff", fontFamily: "monospace",
                fontSize: "clamp(.85rem,2.5vw,1.05rem)", letterSpacing: "0.18em",
                textShadow: "0 0 8px rgba(255,255,255,0.85), 0 0 24px rgba(255,255,255,0.35)",
              }}
            >I&nbsp; H a v e&nbsp; S o m e t h i n g</motion.p>
          )}
          {textPhase >= 2 && (
            <motion.p key="t2"
              initial={{ opacity: 0, scale: 1.65, filter: "blur(30px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                color: "#fff", fontFamily: "monospace", fontWeight: 700,
                fontSize: "clamp(1.2rem,4.5vw,1.75rem)", letterSpacing: "0.55em",
                textShadow: "0 0 10px rgba(255,255,255,1), 0 0 32px rgba(255,255,255,0.7), 0 0 75px rgba(255,255,255,0.35)",
              }}
            >I L O V E U</motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Flower SVG ──────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 flex justify-center pointer-events-none" style={{ zIndex: 10 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 360 490"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 420, overflow: "visible" }}
        >
          <defs>
            {/* Per-flower glow filter — colour comes from the fill itself */}
            <filter id="flwGlow" x="-180%" y="-180%" width="460%" height="460%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="big"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="6"  result="mid"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="2"  result="tight"/>
              <feMerge>
                <feMergeNode in="big"/><feMergeNode in="mid"/>
                <feMergeNode in="tight"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Leaf vein highlight */}
            <filter id="leafGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* GRASS */}
          {art.grass.map((g, i) => (
            <motion.path
              key={`gr${i}`} d={g.d}
              fill={`hsl(${122 + (i % 4) * 4}, ${50 + (i % 3) * 5}%, ${28 + (i % 4) * 3}%)`}
              {...grassAnim(g.sx, g.sy, 1.35 + i * 0.03)}
            />
          ))}

          {/* 10 FLOWERS */}
          {art.flowers.map((fl, fi) => {
            const delays = flowerDelays[fi];
            const petalHue  = fl.hue;
            const centerHue = fl.cHue;

            return (
              <g
                key={`fl${fi}`}
                ref={(el) => { swayGroupRefs.current[fi] = el; }}
              >
                {/* 1. STEM — green, grows from base */}
                <motion.path
                  d={fl.stemD}
                  fill={`hsl(125, ${52 + fi * 0.5}%, ${24 + fi * 0.3}%)`}
                  {...stemAnim(fl.sx, delays.stem)}
                />

                {/* 2. LEAVES — green, snap open */}
                {fl.leaves.map((l, li) => (
                  <motion.path
                    key={`lf${li}`} d={l.d}
                    fill={`hsl(${120 + li * 8}, 55%, ${30 + li * 4}%)`}
                    filter="url(#leafGlow)"
                    {...leafAnim(l.ax, l.ay, l.rotDir, delays.leaf + li * 0.17)}
                  />
                ))}

                {/* 3. FLOWER HEAD — coloured, blooms */}
                <g filter="url(#flwGlow)">
                  <motion.g
                    animate={allDone ? {
                      scale:   [1, 1.08, 1, 1.06, 1],
                      opacity: [0.93, 1, 0.93, 1, 0.93],
                    } : {}}
                    transition={{ duration: 3.0 + fi * 0.38, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: `${fl.cx}px ${fl.cy}px` }}
                  >
                    {/* Petals */}
                    {fl.petals.map((p, pi) => (
                      <motion.path
                        key={`pt${pi}`} d={p.d}
                        fill={`hsla(${petalHue}, 80%, 84%, ${p.op.toFixed(2)})`}
                        {...petalAnim(p.cx, p.cy, delays.petal + pi * 0.026)}
                      />
                    ))}
                    {/* Centre */}
                    <motion.circle
                      cx={fl.cx} cy={fl.cy} r={fl.r * 0.38}
                      fill={`hsl(${centerHue}, 92%, 68%)`}
                      {...petalAnim(fl.cx, fl.cy, delays.petal + fl.petals.length * 0.026)}
                    />
                    {/* Centre highlight */}
                    <motion.circle
                      cx={fl.cx - fl.r * 0.09} cy={fl.cy - fl.r * 0.09} r={fl.r * 0.14}
                      fill="rgba(255,255,255,0.55)"
                      {...petalAnim(fl.cx, fl.cy, delays.petal + fl.petals.length * 0.026 + 0.05)}
                    />
                  </motion.g>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
