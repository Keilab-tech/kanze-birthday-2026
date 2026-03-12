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

/* ── Sway config ──────────────────────────────────────────────────── */
const SWAY_CFG = [
  { x: 157, y: 480, freq: 0.85, phase: 0,   amp: 3.0 },
  { x: 192, y: 480, freq: 0.62, phase: 1.2, amp: 3.8 },
  { x: 232, y: 480, freq: 0.77, phase: 2.5, amp: 3.0 },
];

/* ── FlowersPage ──────────────────────────────────────────────────── */
export default function FlowersPage() {
  const navigate    = useNavigate();
  const starRef     = useRef<HTMLCanvasElement>(null);
  const svgRef      = useRef<SVGSVGElement>(null);
  const swayRef0    = useRef<SVGGElement>(null);
  const swayRef1    = useRef<SVGGElement>(null);
  const swayRef2    = useRef<SVGGElement>(null);
  const swayRefs    = [swayRef0, swayRef1, swayRef2];
  const mouseRef    = useRef({ x: -9999, y: 0 });
  const animRef     = useRef(0);
  const timeRef     = useRef(0);

  const [textPhase, setTextPhase]     = useState<0 | 1 | 2>(0);
  const [showFlowers, setShowFlowers] = useState(false);
  const [allDone, setAllDone]         = useState(false); // triggers pulse+sway

  /* ── Text + sprout sequence ─────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setTextPhase(1), 350);
    const t2 = setTimeout(() => setTextPhase(2), 3000);
    const t3 = setTimeout(() => setShowFlowers(true), 4600);
    // All elements finish sprouting after ~4.5 s of showFlowers
    const t4 = setTimeout(() => setAllDone(true), 4600 + 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
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

    const far  = mkLayer(170, 0.08, 0.30, 0.04, 0.18, 2.2, 5.0);
    const mid  = mkLayer(90,  0.38, 0.85, 0.12, 0.42, 0.8, 2.2);
    const near = mkLayer(35,  0.95, 2.30, 0.40, 0.82, 0.25, 0.9);

    let t = 0, raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const stars of [far, mid, near]) {
        for (const s of stars) {
          const op = s.base * (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase)));
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`; ctx.fill();
        }
      }
      t += 0.018; raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* ── Organic sway + mouse-tilt (starts only after allDone) ─────── */
  useEffect(() => {
    if (!allDone) return;
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
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Art data ───────────────────────────────────────────────────── */
  const art = useMemo(() => {
    const makePetals = (cx: number, cy: number, np: number, L: number, w: number) =>
      [0, 1, 2].flatMap(layer =>
        Array.from({ length: np }, (_, i) => ({
          d: filledPetal(cx, cy, i * (360 / np) + layer * (360 / np / 3), L * (.82 + layer * .1), w * (.88 + layer * .08)),
          op: 0.42 + layer * .28, cx, cy,
        }))
      );

    const grass = [
      { sx:145, sy:480, a:-98,  L:60, w:8  },
      { sx:155, sy:480, a:-91,  L:74, w:10 },
      { sx:166, sy:479, a:-83,  L:54, w:7  },
      { sx:178, sy:479, a:-96,  L:78, w:11 },
      { sx:192, sy:480, a:-89,  L:67, w:9  },
      { sx:206, sy:480, a:-79,  L:62, w:9  },
      { sx:219, sy:479, a:-93,  L:72, w:10 },
      { sx:231, sy:479, a:-85,  L:57, w:8  },
      { sx:243, sy:478, a:-100, L:64, w:8  },
    ].map(g => ({ d: filledLeaf(g.sx, g.sy, g.a, g.L, g.w), sx: g.sx, sy: g.sy }));

    /* Three stems — centre (si=1), left (si=0), right (si=2) */
    const stems = [
      /* LEFT */
      {
        d: filledStem(157,480, 150,395, 132,310, 112,218, 12,5.5),
        bx: 157, by: 480,
        leaves: [
          { d: filledLeaf(136,358,-130,56,26), sx:136, sy:358, rotDir: 1  },
          { d: filledLeaf(124,285,-42, 50,23), sx:124, sy:285, rotDir: -1 },
          { d: filledLeaf(130,318,-155,38,18), sx:130, sy:318, rotDir: 1  },
        ],
        flower: { cx:112, cy:204, petals: makePetals(112,204,5,32,15), cr:9 },
        /* Timing: center=0, left=1, right=2 */
        stemDelay:  0.25,
        leafDelay:  0.90,
        petalDelay: 1.55,
      },
      /* CENTRE */
      {
        d: filledStem(192,480, 190,385, 192,280, 192,162, 15,7),
        bx: 192, by: 480,
        leaves: [
          { d: filledLeaf(192,360,-112,62,28), sx:192, sy:360, rotDir: 1  },
          { d: filledLeaf(192,278,-68, 56,25), sx:192, sy:278, rotDir: -1 },
          { d: filledLeaf(192,318,-95, 44,20), sx:192, sy:318, rotDir: 1  },
        ],
        flower: { cx:192, cy:148, petals: makePetals(192,148,7,38,18), cr:11 },
        stemDelay:  0.0,
        leafDelay:  0.65,
        petalDelay: 1.30,
      },
      /* RIGHT */
      {
        d: filledStem(232,480, 240,395, 258,310, 278,218, 12,5.5),
        bx: 232, by: 480,
        leaves: [
          { d: filledLeaf(253,352,-48, 55,25), sx:253, sy:352, rotDir: -1 },
          { d: filledLeaf(265,282,-148,50,23), sx:265, sy:282, rotDir: 1  },
          { d: filledLeaf(258,318,-22, 38,18), sx:258, sy:318, rotDir: -1 },
        ],
        flower: { cx:278, cy:204, petals: makePetals(278,204,5,32,15), cr:9 },
        stemDelay:  0.5,
        leafDelay:  1.10,
        petalDelay: 1.65,
      },
    ];

    return { grass, stems };
  }, []);

  /* ── Animation helpers ──────────────────────────────────────────── */
  /* Stem: grows upward from base — scaleY 0→1 */
  const stemAnim = (bx: number, delay: number) => ({
    initial: { scaleY: 0, opacity: 0 },
    animate: showFlowers ? { scaleY: 1, opacity: 1 } : {},
    transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${bx}px 480px` },
  });

  /* Leaf: snaps open from attachment point with slight rotation */
  const leafAnim = (sx: number, sy: number, rotDir: number, delay: number) => ({
    initial: { scale: 0, rotate: rotDir * 35, opacity: 0 },
    animate: showFlowers ? { scale: 1, rotate: 0, opacity: 1 } : {},
    transition: { duration: 0.38, delay, ease: [0.34, 1.56, 0.64, 1] as [number,number,number,number] },
    style: { transformOrigin: `${sx}px ${sy}px` },
  });

  /* Petal: blooms outward from flower centre */
  const petalAnim = (cx: number, cy: number, delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: showFlowers ? { scale: 1, opacity: 1 } : {},
    transition: { duration: 0.32, delay, ease: [0.34, 1.56, 0.64, 1] as [number,number,number,number] },
    style: { transformOrigin: `${cx}px ${cy}px` },
  });

  /* Grass blade: sprouts up from ground */
  const grassAnim = (sx: number, sy: number, delay: number) => ({
    initial: { scaleY: 0, opacity: 0 },
    animate: showFlowers ? { scaleY: 1, opacity: 1 } : {},
    transition: { duration: 0.30, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    style: { transformOrigin: `${sx}px ${sy}px` },
  });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#000" }}>

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

      {/* ── Text — top-third of screen ───────────────────────────── */}
      <div
        className="fixed inset-x-0 z-20 flex justify-center pointer-events-none"
        style={{ top: "18%" }}
      >
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

      {/* ── Flower SVG ───────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex justify-center pointer-events-none"
        style={{
          filter:
            "drop-shadow(0 0 14px rgba(255,255,255,0.55))" +
            " drop-shadow(0 0 45px rgba(255,255,255,0.20))" +
            " drop-shadow(0 0 100px rgba(255,255,255,0.09))",
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 360 490"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: 420, overflow: "visible" }}
        >
          <defs>
            {/* Cinema glow on flower heads */}
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

          {/* ── GRASS — sprouts simultaneous with bloom ── */}
          {art.grass.map((g, i) => (
            <motion.path
              key={`gr${i}`} d={g.d}
              fill={`rgba(255,255,255,${(0.38 + i * 0.025).toFixed(3)})`}
              {...grassAnim(g.sx, g.sy, 1.30 + i * 0.04)}
            />
          ))}

          {/* ── THREE STEMS with sequential sprouting ── */}
          {art.stems.map((stem, si) => (
            <g key={`sg${si}`} ref={swayRefs[si]}>

              {/* 1. STEM — grows upward from base */}
              <motion.path
                d={stem.d}
                fill={`rgba(255,255,255,${(0.80 + si * 0.06).toFixed(2)})`}
                {...stemAnim(stem.bx, stem.stemDelay)}
              />

              {/* 2. LEAVES — unfurl sequentially from stem nodes */}
              {stem.leaves.map((l, li) => (
                <motion.path
                  key={`lf${li}`} d={l.d}
                  fill="rgba(255,255,255,0.65)"
                  {...leafAnim(l.sx, l.sy, l.rotDir, stem.leafDelay + li * 0.18)}
                />
              ))}

              {/* 3. FLOWER HEAD — blooms at tip after stem is tall */}
              <g filter="url(#flowerHalo)">
                {/* Breathing pulse once all done */}
                <motion.g
                  animate={allDone ? {
                    scale:   [1, 1.07, 1, 1.05, 1],
                    opacity: [0.92, 1, 0.92, 1, 0.92],
                  } : {}}
                  transition={{
                    duration: 3.2 + si * 0.55,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: `${stem.flower.cx}px ${stem.flower.cy}px` }}
                >
                  {stem.flower.petals.map((p, pi) => (
                    <motion.path
                      key={`pt${pi}`} d={p.d}
                      fill={`rgba(255,255,255,${p.op.toFixed(2)})`}
                      {...petalAnim(p.cx, p.cy, stem.petalDelay + pi * 0.028)}
                    />
                  ))}
                  <motion.circle
                    cx={stem.flower.cx} cy={stem.flower.cy} r={stem.flower.cr}
                    fill="rgba(255,255,255,1)"
                    {...petalAnim(stem.flower.cx, stem.flower.cy, stem.petalDelay + stem.flower.petals.length * 0.028)}
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
