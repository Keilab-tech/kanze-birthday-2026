import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── SVG path helpers ─────────────────────────────────────────────── */
const ff = (n: number) => Math.round(n * 10) / 10;
const toRad = (d: number) => d * Math.PI / 180;

function filledLeaf(sx: number, sy: number, angleDeg: number, L: number, w: number) {
  const a = toRad(angleDeg), p = a + Math.PI / 2;
  const tx = sx + L * Math.cos(a), ty = sy + L * Math.sin(a);
  const lc1x = sx + L * .22 * Math.cos(a) + w * .65 * Math.cos(p);
  const lc1y = sy + L * .22 * Math.sin(a) + w * .65 * Math.sin(p);
  const lc2x = sx + L * .78 * Math.cos(a) + w * .95 * Math.cos(p);
  const lc2y = sy + L * .78 * Math.sin(a) + w * .95 * Math.sin(p);
  const rc1x = sx + L * .78 * Math.cos(a) - w * .95 * Math.cos(p);
  const rc1y = sy + L * .78 * Math.sin(a) - w * .95 * Math.sin(p);
  const rc2x = sx + L * .22 * Math.cos(a) - w * .65 * Math.cos(p);
  const rc2y = sy + L * .22 * Math.sin(a) - w * .65 * Math.sin(p);
  return `M${ff(sx)} ${ff(sy)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(sx)} ${ff(sy)}Z`;
}

function filledStem(
  x1: number, y1: number, cpx1: number, cpy1: number,
  cpx2: number, cpy2: number, x2: number, y2: number, w1: number, w2: number
) {
  const h1 = w1 / 2, h2 = w2 / 2;
  return `M${ff(x1-h1)} ${ff(y1)} C${ff(cpx1-h1)} ${ff(cpy1)} ${ff(cpx2-h2)} ${ff(cpy2)} ${ff(x2-h2)} ${ff(y2)} L${ff(x2+h2)} ${ff(y2)} C${ff(cpx2+h2)} ${ff(cpy2)} ${ff(cpx1+h1)} ${ff(cpy1)} ${ff(x1+h1)} ${ff(y1)}Z`;
}

function filledPetal(cx: number, cy: number, angleDeg: number, L: number, w: number) {
  const a = toRad(angleDeg - 90), p = a + Math.PI / 2;
  const tx = cx + L * Math.cos(a), ty = cy + L * Math.sin(a);
  const lc1x = cx + L * .18 * Math.cos(a) + w * .5 * Math.cos(p);
  const lc1y = cy + L * .18 * Math.sin(a) + w * .5 * Math.sin(p);
  const lc2x = cx + L * .75 * Math.cos(a) + w * .95 * Math.cos(p);
  const lc2y = cy + L * .75 * Math.sin(a) + w * .95 * Math.sin(p);
  const rc1x = cx + L * .75 * Math.cos(a) - w * .95 * Math.cos(p);
  const rc1y = cy + L * .75 * Math.sin(a) - w * .95 * Math.sin(p);
  const rc2x = cx + L * .18 * Math.cos(a) - w * .5 * Math.cos(p);
  const rc2y = cy + L * .18 * Math.sin(a) - w * .5 * Math.sin(p);
  return `M${ff(cx)} ${ff(cy)} C${ff(lc1x)} ${ff(lc1y)} ${ff(lc2x)} ${ff(lc2y)} ${ff(tx)} ${ff(ty)} C${ff(rc1x)} ${ff(rc1y)} ${ff(rc2x)} ${ff(rc2y)} ${ff(cx)} ${ff(cy)}Z`;
}

/* ── Floating heart ───────────────────────────────────────────────── */
const HEART_PATH =
  "M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z";

interface HeartCfg {
  left: string; top: string; size: number;
  dark: boolean; circle: boolean; delay: number; bob: number;
}

const FLOAT_HEARTS: HeartCfg[] = [
  { left: "11%", top: "22%", size: 30, dark: false, circle: false, delay: 0.3, bob: 3.2 },
  { left: "20%", top: "50%", size: 20, dark: false, circle: true,  delay: 0.9, bob: 3.8 },
  { left: "13%", top: "72%", size: 25, dark: true,  circle: false, delay: 0.5, bob: 4.1 },
  { left: "73%", top: "10%", size: 38, dark: false, circle: true,  delay: 0.2, bob: 3.5 },
  { left: "83%", top: "37%", size: 22, dark: false, circle: false, delay: 0.7, bob: 3.0 },
  { left: "79%", top: "63%", size: 24, dark: false, circle: true,  delay: 0.6, bob: 4.4 },
  { left: "56%", top: "36%", size: 18, dark: false, circle: true,  delay: 0.4, bob: 3.6 },
  { left: "63%", top: "53%", size: 15, dark: false, circle: false, delay: 1.0, bob: 2.9 },
];

function FloatingHeart({ h, show }: { h: HeartCfg; show: boolean }) {
  const color = h.dark ? "hsl(340,45%,42%)" : "hsl(340,60%,68%)";
  const borderColor = "rgba(210,100,140,0.65)";

  return (
    <motion.div
      style={{ position: "fixed", left: h.left, top: h.top, width: h.size, height: h.size, zIndex: 15, pointerEvents: "none" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      transition={{ delay: h.delay, duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        style={{ width: "100%", height: "100%" }}
        animate={show ? { y: [0, -h.size * 0.28, 0] } : {}}
        transition={{ duration: h.bob, repeat: Infinity, ease: "easeInOut", delay: h.delay + 0.9 }}
      >
        {h.circle ? (
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            border: `2px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" width="46%" height="46%" fill={color}>
              <path d={HEART_PATH} />
            </svg>
          </div>
        ) : (
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill={color}>
            <path d={HEART_PATH} />
          </svg>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Sway config ──────────────────────────────────────────────────── */
const SWAY_CFG = [
  { x: 157, y: 480, freq: 0.85, phase: 0,   amp: 3.0 },
  { x: 192, y: 480, freq: 0.62, phase: 1.2, amp: 3.8 },
  { x: 232, y: 480, freq: 0.77, phase: 2.5, amp: 3.0 },
];

/* ── Petal fills per layer (outer → inner) ────────────────────────── */
const PETAL_FILL = [
  "rgba(210,125,160,0.70)",
  "rgba(232,152,178,0.86)",
  "rgba(252,190,212,0.96)",
];

/* ── FlowersPage ──────────────────────────────────────────────────── */
export default function FlowersPage() {
  const navigate = useNavigate();
  const starRef  = useRef<HTMLCanvasElement>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const swayRef0 = useRef<SVGGElement>(null);
  const swayRef1 = useRef<SVGGElement>(null);
  const swayRef2 = useRef<SVGGElement>(null);
  const swayRefs = [swayRef0, swayRef1, swayRef2];
  const mouseRef = useRef({ x: -9999, y: 0 });
  const animRef  = useRef(0);
  const timeRef  = useRef(0);

  const [textPhase, setTextPhase]     = useState<0 | 1 | 2>(0);
  const [showFlowers, setShowFlowers] = useState(false);

  /* ── Text sequence ──────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setTextPhase(1), 350);
    const t2 = setTimeout(() => setTextPhase(2), 3100);
    const t3 = setTimeout(() => setShowFlowers(true), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  /* ── Mouse / touch tracking ─────────────────────────────────────── */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  /* ── Depth-layered starfield ────────────────────────────────────── */
  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const mkLayer = (n: number, minR: number, maxR: number, minOp: number, maxOp: number, minF: number, maxF: number) =>
      Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r:    minR + Math.random() * (maxR - minR),
        base: minOp + Math.random() * (maxOp - minOp),
        freq: minF  + Math.random() * (maxF  - minF),
        phase: Math.random() * Math.PI * 2,
      }));

    const far  = mkLayer(160, 0.08, 0.30, 0.04, 0.18, 2.2, 5.0);
    const mid  = mkLayer(90,  0.38, 0.85, 0.12, 0.42, 0.8, 2.2);
    const near = mkLayer(35,  0.95, 2.30, 0.40, 0.82, 0.25, 0.9);

    let t = 0, raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const stars of [far, mid, near]) {
        for (const s of stars) {
          const op = s.base * (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,230,255,${op.toFixed(3)})`;
          ctx.fill();
        }
      }
      t += 0.018;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* ── Organic sway + mouse-tilt loop ────────────────────────────── */
  useEffect(() => {
    if (!showFlowers) return;
    const loop = () => {
      const t = (timeRef.current += 0.016);
      const svg = svgRef.current;
      SWAY_CFG.forEach((cfg, i) => {
        let mouseTilt = 0;
        if (svg && mouseRef.current.x > -9000) {
          const rect = svg.getBoundingClientRect();
          const mx = ((mouseRef.current.x - rect.left) / rect.width) * 360;
          mouseTilt = Math.max(-4, Math.min(4, ((cfg.x - mx) / 110) * 2.5));
        }
        const angle = Math.sin(t * cfg.freq + cfg.phase) * cfg.amp + mouseTilt;
        swayRefs[i].current?.setAttribute("transform", `rotate(${angle.toFixed(3)},${cfg.x},${cfg.y})`);
      });
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [showFlowers]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Art data ───────────────────────────────────────────────────── */
  const art = useMemo(() => {
    const makePetals = (cx: number, cy: number, np: number, L: number, w: number) =>
      [0, 1, 2].flatMap(layer =>
        Array.from({ length: np }, (_, i) => ({
          d: filledPetal(cx, cy, i * (360 / np) + layer * (360 / np / 3), L * (.82 + layer * .1), w * (.88 + layer * .08)),
          fill: PETAL_FILL[layer], cx, cy,
        }))
      );

    /* Grass — multiple green shades for depth */
    const grassTints = ["#143820","#1a5228","#1d5a30","#1b5030","#163f22","#1a5228","#1d5a30","#1b5228","#143820"];
    const grass = [
      { sx:145, sy:478, a:-98,  L:62, w:8 },
      { sx:154, sy:480, a:-91,  L:76, w:10 },
      { sx:165, sy:479, a:-83,  L:56, w:7 },
      { sx:177, sy:479, a:-96,  L:80, w:11 },
      { sx:192, sy:480, a:-89,  L:68, w:9 },
      { sx:206, sy:480, a:-79,  L:64, w:9 },
      { sx:219, sy:479, a:-93,  L:74, w:10 },
      { sx:231, sy:479, a:-85,  L:58, w:8 },
      { sx:243, sy:478, a:-100, L:65, w:8 },
    ].map((g, i) => ({ d: filledLeaf(g.sx, g.sy, g.a, g.L, g.w), fill: grassTints[i], ox: g.sx, oy: g.sy }));

    const leafTints = ["#1e5a32","#1a5228","#225e36","#1b4e2a","#1d5a30","#1a5028","#225e36","#1b4e2a","#1e5a32"];
    const stems = [
      {
        d: filledStem(157,480, 150,395, 132,310, 112,218, 12,5.5),
        stemFill: "#1b5228", stemBase: { x:157, y:480 },
        leaves: [
          { d: filledLeaf(136,358,-130,58,28), fill: leafTints[0], ox:136, oy:358 },
          { d: filledLeaf(124,285,-42, 52,25), fill: leafTints[1], ox:124, oy:285 },
          { d: filledLeaf(130,318,-155,40,20), fill: leafTints[2], ox:130, oy:318 },
        ],
        flower: { cx:112, cy:204, petals: makePetals(112,204,5,34,18), cr:10, crOuter:14 },
      },
      {
        d: filledStem(192,480, 190,385, 192,280, 192,162, 15,7),
        stemFill: "#1d5a30", stemBase: { x:192, y:480 },
        leaves: [
          { d: filledLeaf(192,360,-112,64,30), fill: leafTints[3], ox:192, oy:360 },
          { d: filledLeaf(192,278,-68, 58,27), fill: leafTints[4], ox:192, oy:278 },
          { d: filledLeaf(192,318,-95, 46,22), fill: leafTints[5], ox:192, oy:318 },
        ],
        flower: { cx:192, cy:148, petals: makePetals(192,148,7,40,20), cr:12, crOuter:16 },
      },
      {
        d: filledStem(232,480, 240,395, 258,310, 278,218, 12,5.5),
        stemFill: "#1b5228", stemBase: { x:232, y:480 },
        leaves: [
          { d: filledLeaf(253,352,-48, 58,27), fill: leafTints[6], ox:253, oy:352 },
          { d: filledLeaf(265,282,-148,52,25), fill: leafTints[7], ox:265, oy:282 },
          { d: filledLeaf(258,318,-22, 40,20), fill: leafTints[8], ox:258, oy:318 },
        ],
        flower: { cx:278, cy:204, petals: makePetals(278,204,5,34,18), cr:10, crOuter:14 },
      },
    ];

    return { grass, stems };
  }, []);

  /* ── Bloom entrance helper ──────────────────────────────────────── */
  const bloomIn = (cx: number, cy: number, delay: number, dur = 0.82) => ({
    initial: { opacity: 0, scale: 0 },
    animate: showFlowers ? ({ opacity: 1, scale: 1 } as object) : ({} as object),
    transition: { duration: dur, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${cx}px ${cy}px` },
  });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#0d1320" }}>

      {/* Back */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
      >←</motion.button>

      {/* Starfield */}
      <canvas ref={starRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Floating hearts */}
      {FLOAT_HEARTS.map((h, i) => (
        <FloatingHeart key={i} h={h} show={showFlowers} />
      ))}

      {/* ── Text sequence ────────────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-20 flex justify-center pt-14 pointer-events-none">
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
              animate={{ opacity: 1, scale: 1,    filter: "blur(0px)"  }}
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

      {/* ── Flower SVG ───────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex justify-center pointer-events-none"
        style={{ filter: "drop-shadow(0 0 20px rgba(240,160,180,0.25)) drop-shadow(0 0 60px rgba(240,160,180,0.10))" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 360 490"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 420, overflow: "visible" }}
        >
          <defs>
            {/* Warm golden glow — behind each flower center */}
            <filter id="warmGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            {/* Pink bloom halo — applied to full flower head group */}
            <filter id="petalHalo" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="big"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="6"  result="med"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="2"  result="tight"/>
              <feMerge>
                <feMergeNode in="big"/>
                <feMergeNode in="med"/>
                <feMergeNode in="tight"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ── Grass ── */}
          {art.grass.map((g, i) => (
            <motion.path
              key={`gr${i}`} d={g.d} fill={g.fill}
              {...bloomIn(g.ox, g.oy, i * 0.065, 0.72)}
            />
          ))}

          {/* ── Three stem groups (each with its own sway ref) ── */}
          {art.stems.map((stem, si) => (
            <g key={`sg${si}`} ref={swayRefs[si]}>

              {/* Stem body */}
              <motion.path
                d={stem.d} fill={stem.stemFill}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={showFlowers ? { opacity: 1, scaleY: 1 } : {}}
                transition={{ duration: 1.3, delay: 0.45 + si * 0.14, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: `${stem.stemBase.x}px 480px` }}
              />

              {/* Leaves */}
              {stem.leaves.map((l, li) => (
                <motion.path
                  key={`lf${li}`} d={l.d} fill={l.fill}
                  {...bloomIn(l.ox, l.oy, 1.4 + si * 0.15 + li * 0.11, 0.88)}
                />
              ))}

              {/* ── Flower head: warm glow + petals + center ── */}
              <g filter="url(#petalHalo)">
                <motion.g
                  animate={showFlowers ? { scale: [1, 1.06, 1, 1.05, 1], opacity: [0.92, 1, 0.92, 1, 0.92] } : {}}
                  transition={{ duration: 3.2 + si * 0.55, repeat: Infinity, ease: "easeInOut", delay: 5.2 + si * 0.35 }}
                  style={{ transformOrigin: `${stem.flower.cx}px ${stem.flower.cy}px` }}
                >
                  {/* Warm golden light emanating behind petals */}
                  <motion.circle
                    cx={stem.flower.cx} cy={stem.flower.cy} r={stem.flower.crOuter + 12}
                    fill="rgba(255,215,100,0.28)"
                    filter="url(#warmGlow)"
                    {...bloomIn(stem.flower.cx, stem.flower.cy, 2.0 + si * 0.2, 0.9)}
                  />

                  {/* Petals — pink, 3 layers */}
                  {stem.flower.petals.map((p, pi) => (
                    <motion.path
                      key={`pt${pi}`} d={p.d} fill={p.fill}
                      {...bloomIn(p.cx, p.cy, 2.1 + si * 0.22 + pi * 0.045, 0.78)}
                    />
                  ))}

                  {/* Center — amber ring + cream dot */}
                  <motion.circle
                    cx={stem.flower.cx} cy={stem.flower.cy} r={stem.flower.crOuter}
                    fill="rgba(230,178,55,0.95)"
                    {...bloomIn(stem.flower.cx, stem.flower.cy, 3.0 + si * 0.18, 0.55)}
                  />
                  <motion.circle
                    cx={stem.flower.cx} cy={stem.flower.cy} r={stem.flower.cr}
                    fill="rgba(255,248,200,1)"
                    {...bloomIn(stem.flower.cx, stem.flower.cy, 3.15 + si * 0.18, 0.5)}
                  />
                </motion.g>
              </g>

            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
