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

/* ── FlowersPage ──────────────────────────────────────────────────── */
const SWAY_CFG = [
  { x: 157, y: 480, freq: 0.85, phase: 0,   amp: 3.0 },
  { x: 192, y: 480, freq: 0.62, phase: 1.2, amp: 3.8 },
  { x: 232, y: 480, freq: 0.77, phase: 2.5, amp: 3.0 },
];

export default function FlowersPage() {
  const navigate = useNavigate();
  const starRef  = useRef<HTMLCanvasElement>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const swayRefs = [
    useRef<SVGGElement>(null),
    useRef<SVGGElement>(null),
    useRef<SVGGElement>(null),
  ];
  const mouseRef = useRef({ x: -9999, y: 0 });
  const animRef  = useRef(0);
  const timeRef  = useRef(0);

  const [textPhase, setTextPhase]   = useState<0 | 1 | 2>(0);
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

  /* ── Depth-layered starfield canvas ─────────────────────────────── */
  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const layer = (
      count: number, minR: number, maxR: number,
      minOp: number, maxOp: number, minFreq: number, maxFreq: number
    ) =>
      Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r:    minR + Math.random() * (maxR - minR),
        base: minOp + Math.random() * (maxOp - minOp),
        freq: minFreq + Math.random() * (maxFreq - minFreq),
        phase: Math.random() * Math.PI * 2,
      }));

    /* Far = tiny, dim, fast flicker | Mid = medium | Near = large, bright, slow pulse */
    const far  = layer(170, 0.08, 0.32, 0.04, 0.20, 2.2, 5.0);
    const mid  = layer(100, 0.38, 0.90, 0.14, 0.48, 0.8, 2.2);
    const near = layer(40,  1.00, 2.50, 0.45, 0.90, 0.25, 0.9);

    let t = 0, raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const stars of [far, mid, near]) {
        for (const s of stars) {
          const op = s.base * (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
          ctx.fill();
        }
      }
      t += 0.018;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* ── Organic sway + mouse-tilt animation loop ───────────────────── */
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
          /* Tilt away from cursor — clamped ±4° */
          mouseTilt = Math.max(-4, Math.min(4, ((cfg.x - mx) / 110) * 2.5));
        }
        const angle = Math.sin(t * cfg.freq + cfg.phase) * cfg.amp + mouseTilt;
        swayRefs[i].current?.setAttribute(
          "transform",
          `rotate(${angle.toFixed(3)},${cfg.x},${cfg.y})`
        );
      });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [showFlowers]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Art data grouped by stem ───────────────────────────────────── */
  const art = useMemo(() => {
    const makePetals = (cx: number, cy: number, np: number, L: number, w: number) =>
      [0, 1, 2].flatMap(layer =>
        Array.from({ length: np }, (_, i) => ({
          d: filledPetal(cx, cy, i * (360 / np) + layer * (360 / np / 3), L * (.82 + layer * .1), w * (.88 + layer * .08)),
          op: 0.42 + layer * .28, cx, cy,
        }))
      );

    const grass = [
      { sx:145, sy:478, a:-98,  L:58, w:7 },
      { sx:155, sy:480, a:-91,  L:72, w:9 },
      { sx:166, sy:479, a:-84,  L:52, w:6 },
      { sx:178, sy:479, a:-96,  L:76, w:10 },
      { sx:192, sy:480, a:-89,  L:65, w:8 },
      { sx:205, sy:480, a:-79,  L:60, w:8 },
      { sx:218, sy:479, a:-93,  L:70, w:9 },
      { sx:230, sy:479, a:-86,  L:55, w:7 },
      { sx:242, sy:478, a:-100, L:62, w:7 },
    ].map(g => ({ d: filledLeaf(g.sx, g.sy, g.a, g.L, g.w), ox: g.sx, oy: g.sy }));

    const stems = [
      {
        d: filledStem(157,480, 150,395, 132,310, 112,218, 12,5.5),
        stemBase: { x: 157, y: 480 },
        leaves: [
          { d: filledLeaf(136,358,-130,56,26), ox:136, oy:358 },
          { d: filledLeaf(124,285,-42, 50,23), ox:124, oy:285 },
          { d: filledLeaf(130,318,-155,38,18), ox:130, oy:318 },
        ],
        flower: { cx:112, cy:204, petals: makePetals(112,204,5,32,15), cr:9  },
      },
      {
        d: filledStem(192,480, 190,385, 192,280, 192,162, 15,7),
        stemBase: { x: 192, y: 480 },
        leaves: [
          { d: filledLeaf(192,360,-112,62,28), ox:192, oy:360 },
          { d: filledLeaf(192,278,-68, 56,25), ox:192, oy:278 },
          { d: filledLeaf(192,318,-95, 44,20), ox:192, oy:318 },
        ],
        flower: { cx:192, cy:148, petals: makePetals(192,148,7,38,18), cr:11 },
      },
      {
        d: filledStem(232,480, 240,395, 258,310, 278,218, 12,5.5),
        stemBase: { x: 232, y: 480 },
        leaves: [
          { d: filledLeaf(253,352,-48, 55,25), ox:253, oy:352 },
          { d: filledLeaf(265,282,-148,50,23), ox:265, oy:282 },
          { d: filledLeaf(258,318,-22, 38,18), ox:258, oy:318 },
        ],
        flower: { cx:278, cy:204, petals: makePetals(278,204,5,32,15), cr:9  },
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
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#000" }}>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
      >←</motion.button>

      {/* Depth-layered starfield */}
      <canvas ref={starRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* ── Text sequence ────────────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-20 flex justify-center pt-14 pointer-events-none">
        <AnimatePresence mode="wait">

          {textPhase === 1 && (
            <motion.p
              key="t1"
              initial={{ opacity: 0, filter: "blur(14px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(14px)" }}
              transition={{ duration: 1.0 }}
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontSize: "clamp(.85rem, 2.5vw, 1.05rem)",
                letterSpacing: "0.18em",
                textShadow: "0 0 8px rgba(255,255,255,0.85), 0 0 24px rgba(255,255,255,0.35)",
              }}
            >I&nbsp; H a v e&nbsp; S o m e t h i n g</motion.p>
          )}

          {textPhase >= 2 && (
            <motion.p
              key="t2"
              /* Blur-in: starts large + blurry, resolves into sharp glowing text */
              initial={{ opacity: 0, scale: 1.65, filter: "blur(30px)" }}
              animate={{ opacity: 1, scale: 1,    filter: "blur(0px)"  }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 4.5vw, 1.75rem)",
                letterSpacing: "0.55em",
                textShadow:
                  "0 0 10px rgba(255,255,255,1), 0 0 32px rgba(255,255,255,0.7), 0 0 75px rgba(255,255,255,0.35)",
              }}
            >I L O V E U</motion.p>
          )}

        </AnimatePresence>
      </div>

      {/* ── Flower SVG ───────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex justify-center pointer-events-none"
        /* Multi-layer CSS drop-shadow: tight glow + wide foggy halo */
        style={{
          filter:
            "drop-shadow(0 0 12px rgba(255,255,255,0.55))" +
            " drop-shadow(0 0 40px rgba(255,255,255,0.20))" +
            " drop-shadow(0 0 90px rgba(255,255,255,0.09))",
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 360 490"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 420, overflow: "visible" }}
        >
          <defs>
            {/* Heavy cinema glow — used on individual flower heads */}
            <filter id="flowerHalo" x="-160%" y="-160%" width="420%" height="420%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="halo"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="9"  result="mid"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="3"  result="close"/>
              <feMerge>
                <feMergeNode in="halo"/>
                <feMergeNode in="mid"/>
                <feMergeNode in="close"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ── Grass (anchored, no sway) ── */}
          {art.grass.map((g, i) => (
            <motion.path
              key={`gr${i}`} d={g.d}
              fill={`rgba(255,255,255,${(0.38 + i * 0.025).toFixed(3)})`}
              {...bloomIn(g.ox, g.oy, i * 0.065, 0.72)}
            />
          ))}

          {/* ── Three stem groups — each rotates via JS sway ref ── */}
          {art.stems.map((stem, si) => (
            <g key={`sg${si}`} ref={swayRefs[si]}>

              {/* Stem body */}
              <motion.path
                d={stem.d}
                fill={`rgba(255,255,255,${(0.80 + si * 0.05).toFixed(2)})`}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={showFlowers ? { opacity: 1, scaleY: 1 } : {}}
                transition={{ duration: 1.3, delay: 0.45 + si * 0.14, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: `${stem.stemBase.x}px 480px` }}
              />

              {/* Leaves — slightly more transparent than petals */}
              {stem.leaves.map((l, li) => (
                <motion.path
                  key={`lf${li}`} d={l.d}
                  fill="rgba(255,255,255,0.65)"
                  {...bloomIn(l.ox, l.oy, 1.4 + si * 0.15 + li * 0.11, 0.88)}
                />
              ))}

              {/* ── Flower head: cinema glow filter + breathing pulse ── */}
              {/* Outer <g> carries the SVG filter; inner motion.g handles pulse */}
              <g filter="url(#flowerHalo)">
                <motion.g
                  /* Breathing: grows & glows on a slow looping cycle */
                  animate={showFlowers ? {
                    scale:   [1, 1.07, 1, 1.05, 1],
                    opacity: [0.90, 1,  0.90, 1,  0.90],
                  } : {}}
                  transition={{
                    duration: 3.2 + si * 0.55,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5.2 + si * 0.35, /* starts after bloom finishes */
                  }}
                  style={{ transformOrigin: `${stem.flower.cx}px ${stem.flower.cy}px` }}
                >
                  {stem.flower.petals.map((p, pi) => (
                    <motion.path
                      key={`pt${pi}`} d={p.d}
                      fill={`rgba(255,255,255,${p.op.toFixed(2)})`}
                      {...bloomIn(p.cx, p.cy, 2.1 + si * 0.22 + pi * 0.05, 0.78)}
                    />
                  ))}
                  <motion.circle
                    cx={stem.flower.cx} cy={stem.flower.cy} r={stem.flower.cr}
                    fill="rgba(255,255,255,1)"
                    {...bloomIn(stem.flower.cx, stem.flower.cy, 3.1 + si * 0.2, 0.55)}
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
