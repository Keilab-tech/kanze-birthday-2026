import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── SVG path helpers ─────────────────────────────────────────────── */
const ff = (n: number) => Math.round(n * 10) / 10;
const deg = (d: number) => d * Math.PI / 180;

function filledLeaf(sx: number, sy: number, angleDeg: number, L: number, w: number) {
  const a = deg(angleDeg);
  const p = a + Math.PI / 2;
  const tx = sx + L * Math.cos(a), ty = sy + L * Math.sin(a);
  const lc1x = sx + L * 0.22 * Math.cos(a) + w * 0.65 * Math.cos(p);
  const lc1y = sy + L * 0.22 * Math.sin(a) + w * 0.65 * Math.sin(p);
  const lc2x = sx + L * 0.78 * Math.cos(a) + w * 0.95 * Math.cos(p);
  const lc2y = sy + L * 0.78 * Math.sin(a) + w * 0.95 * Math.sin(p);
  const rc1x = sx + L * 0.78 * Math.cos(a) - w * 0.95 * Math.cos(p);
  const rc1y = sy + L * 0.78 * Math.sin(a) - w * 0.95 * Math.sin(p);
  const rc2x = sx + L * 0.22 * Math.cos(a) - w * 0.65 * Math.cos(p);
  const rc2y = sy + L * 0.22 * Math.sin(a) - w * 0.65 * Math.sin(p);
  return `M${ff(sx)} ${ff(sy)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(sx)} ${ff(sy)}Z`;
}

function filledStem(
  x1: number, y1: number,
  cpx1: number, cpy1: number,
  cpx2: number, cpy2: number,
  x2: number, y2: number,
  w1: number, w2: number
) {
  const h1 = w1 / 2, h2 = w2 / 2;
  return `M${ff(x1-h1)} ${ff(y1)} C${ff(cpx1-h1)} ${ff(cpy1)} ${ff(cpx2-h2)} ${ff(cpy2)} ${ff(x2-h2)} ${ff(y2)} L${ff(x2+h2)} ${ff(y2)} C${ff(cpx2+h2)} ${ff(cpy2)} ${ff(cpx1+h1)} ${ff(cpy1)} ${ff(x1+h1)} ${ff(y1)}Z`;
}

function filledPetal(cx: number, cy: number, angleDeg: number, L: number, w: number) {
  const a = deg(angleDeg - 90);
  const p = a + Math.PI / 2;
  const tx = cx + L * Math.cos(a), ty = cy + L * Math.sin(a);
  const lc1x = cx + L * 0.18 * Math.cos(a) + w * 0.5 * Math.cos(p);
  const lc1y = cy + L * 0.18 * Math.sin(a) + w * 0.5 * Math.sin(p);
  const lc2x = cx + L * 0.75 * Math.cos(a) + w * 0.95 * Math.cos(p);
  const lc2y = cy + L * 0.75 * Math.sin(a) + w * 0.95 * Math.sin(p);
  const rc1x = cx + L * 0.75 * Math.cos(a) - w * 0.95 * Math.cos(p);
  const rc1y = cy + L * 0.75 * Math.sin(a) - w * 0.95 * Math.sin(p);
  const rc2x = cx + L * 0.18 * Math.cos(a) - w * 0.5 * Math.cos(p);
  const rc2y = cy + L * 0.18 * Math.sin(a) - w * 0.5 * Math.sin(p);
  return `M${ff(cx)} ${ff(cy)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(cx)} ${ff(cy)}Z`;
}

/* ── FlowersPage ──────────────────────────────────────────────────── */
const FlowersPage = () => {
  const navigate = useNavigate();
  const starRef = useRef<HTMLCanvasElement>(null);
  const [textPhase, setTextPhase] = useState<0 | 1 | 2>(0);
  const [showFlowers, setShowFlowers] = useState(false);

  /* Text sequence timing */
  useEffect(() => {
    const t1 = setTimeout(() => setTextPhase(1), 350);
    const t2 = setTimeout(() => setTextPhase(2), 3000);
    const t3 = setTimeout(() => setShowFlowers(true), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  /* Canvas starfield */
  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.2 + Math.random() * 2.4,
      freq: 0.3 + Math.random() * 2.0,
      phase: Math.random() * Math.PI * 2,
      base: 0.12 + Math.random() * 0.72,
    }));

    let t = 0, raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const op = s.base * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
        ctx.fill();
      }
      t += 0.018;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* Pre-compute all SVG paths */
  const art = useMemo(() => {
    /* Grass blades — 9 blades fanning at base */
    const grass = [
      { sx: 145, sy: 478, a: -98, L: 58, w: 7 },
      { sx: 155, sy: 480, a: -91, L: 72, w: 9 },
      { sx: 166, sy: 479, a: -84, L: 52, w: 6 },
      { sx: 178, sy: 479, a: -96, L: 76, w: 10 },
      { sx: 192, sy: 480, a: -89, L: 65, w: 8 },
      { sx: 205, sy: 480, a: -79, L: 60, w: 8 },
      { sx: 218, sy: 479, a: -93, L: 70, w: 9 },
      { sx: 230, sy: 479, a: -86, L: 55, w: 7 },
      { sx: 242, sy: 478, a: -100, L: 62, w: 7 },
    ].map(g => ({ d: filledLeaf(g.sx, g.sy, g.a, g.L, g.w), ox: g.sx, oy: g.sy }));

    /* Stems — filled ribbons, base-w → tip-w */
    const stems = [
      { d: filledStem(157, 480, 150, 395, 132, 310, 112, 218, 12, 5.5), oy: 480 },
      { d: filledStem(194, 480, 192, 385, 192, 280, 192, 162, 15, 7), oy: 480 },
      { d: filledStem(232, 480, 240, 395, 258, 310, 278, 218, 12, 5.5), oy: 480 },
    ];

    /* Leaves */
    const leaves = [
      { d: filledLeaf(136, 358, -130, 56, 26), ox: 136, oy: 358 },
      { d: filledLeaf(124, 285, -42, 50, 23), ox: 124, oy: 285 },
      { d: filledLeaf(192, 360, -112, 62, 28), ox: 192, oy: 360 },
      { d: filledLeaf(192, 278, -68, 56, 25), ox: 192, oy: 278 },
      { d: filledLeaf(253, 352, -48, 55, 25), ox: 253, oy: 352 },
      { d: filledLeaf(265, 282, -148, 50, 23), ox: 265, oy: 282 },
      /* Extra smaller leaves for lushness */
      { d: filledLeaf(130, 318, -155, 38, 18), ox: 130, oy: 318 },
      { d: filledLeaf(192, 318, -95, 44, 20), ox: 192, oy: 318 },
      { d: filledLeaf(258, 318, -22, 38, 18), ox: 258, oy: 318 },
    ];

    /* Flowers — 3 layers per flower for depth */
    const makeFlower = (cx: number, cy: number, np: number, L: number, w: number) =>
      [0, 1, 2].flatMap(layer => {
        const rot = layer * (360 / np / 3);
        const lL = L * (0.82 + layer * 0.1);
        const lW = w * (0.88 + layer * 0.08);
        const op = 0.42 + layer * 0.28;
        return Array.from({ length: np }, (_, i) => ({
          d: filledPetal(cx, cy, i * (360 / np) + rot, lL, lW),
          op, cx, cy, layer,
        }));
      });

    const flowers = [
      { cx: 112, cy: 204, petals: makeFlower(112, 204, 5, 32, 15), cr: 9 },
      { cx: 192, cy: 148, petals: makeFlower(192, 148, 7, 38, 18), cr: 11 },
      { cx: 278, cy: 204, petals: makeFlower(278, 204, 5, 32, 15), cr: 9 },
    ];

    return { grass, stems, leaves, flowers };
  }, []);

  /* Framer-motion helpers */
  const growFrom = (
    ox: number, oy: number,
    delay: number,
    type: "scale" | "scaleY" = "scale",
    duration = 0.85
  ) => ({
    initial: { opacity: 0, ...(type === "scaleY" ? { scaleY: 0 } : { scale: 0 }) },
    animate: showFlowers ? { opacity: 1, ...(type === "scaleY" ? { scaleY: 1 } : { scale: 1 }) } : {},
    transition: { duration, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${ox}px ${oy}px` },
  });

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#000" }}>

      {/* Back */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
      >←</motion.button>

      {/* Starfield canvas */}
      <canvas ref={starRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Text */}
      <div className="fixed inset-x-0 top-0 z-20 flex justify-center pt-14 pointer-events-none">
        <AnimatePresence mode="wait">
          {textPhase === 1 && (
            <motion.p
              key="t1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)",
                letterSpacing: "0.18em",
                textShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 22px rgba(255,255,255,0.35)",
              }}
            >
              I&nbsp; H a v e&nbsp; S o m e t h i n g
            </motion.p>
          )}
          {textPhase >= 2 && (
            <motion.p
              key="t2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 4.5vw, 1.75rem)",
                letterSpacing: "0.55em",
                textShadow:
                  "0 0 10px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.7), 0 0 70px rgba(255,255,255,0.35)",
              }}
            >
              I L O V E U
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Flower SVG */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex justify-center pointer-events-none"
        style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.55)) drop-shadow(0 0 40px rgba(255,255,255,0.2))" }}
      >
        <svg
          viewBox="0 0 360 490"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 420, overflow: "visible" }}
        >
          {/* ── Grass ── */}
          {art.grass.map((g, i) => (
            <motion.path
              key={`gr${i}`} d={g.d}
              fill={`rgba(255,255,255,${0.42 + i * 0.025})`}
              {...growFrom(g.ox, g.oy, i * 0.065, "scale", 0.72)}
            />
          ))}

          {/* ── Stems ── */}
          {art.stems.map((s, i) => (
            <motion.path
              key={`st${i}`} d={s.d}
              fill={`rgba(255,255,255,${0.82 + i * 0.05})`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={showFlowers ? { opacity: 1, scaleY: 1 } : {}}
              transition={{ duration: 1.3, delay: 0.45 + i * 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${180}px 480px` }}
            />
          ))}

          {/* ── Leaves ── */}
          {art.leaves.map((l, i) => (
            <motion.path
              key={`lf${i}`} d={l.d}
              fill={`rgba(255,255,255,${0.58 + i * 0.028})`}
              {...growFrom(l.ox, l.oy, 1.45 + i * 0.11, "scale", 0.88)}
            />
          ))}

          {/* ── Flower petals (back → front layers) ── */}
          {art.flowers.map((fl, fi) =>
            fl.petals.map((p, pi) => (
              <motion.path
                key={`fp${fi}-${pi}`} d={p.d}
                fill={`rgba(255,255,255,${p.op})`}
                {...growFrom(p.cx, p.cy, 2.1 + fi * 0.2 + p.layer * 0.12 + (pi % 7) * 0.055, "scale", 0.78)}
              />
            ))
          )}

          {/* ── Flower centers ── */}
          {art.flowers.map((fl, fi) => (
            <motion.circle
              key={`fc${fi}`} cx={fl.cx} cy={fl.cy} r={fl.cr}
              fill="rgba(255,255,255,1)"
              {...growFrom(fl.cx, fl.cy, 3.15 + fi * 0.18, "scale", 0.55)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default FlowersPage;
