import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── helpers ─────────────────────────────────────────────────────── */
const f = (n: number) => Math.round(n * 100) / 100;

function mkPetal(cx: number, cy: number, angleRad: number, L: number) {
  const perp = angleRad + Math.PI / 2;
  const w = L * 0.42;
  const tx = cx + L * Math.cos(angleRad);
  const ty = cy + L * Math.sin(angleRad);
  const lc1x = cx + L * 0.28 * Math.cos(angleRad) + w * 0.55 * Math.cos(perp);
  const lc1y = cy + L * 0.28 * Math.sin(angleRad) + w * 0.55 * Math.sin(perp);
  const lc2x = cx + L * 0.78 * Math.cos(angleRad) + w * Math.cos(perp);
  const lc2y = cy + L * 0.78 * Math.sin(angleRad) + w * Math.sin(perp);
  const rc1x = cx + L * 0.78 * Math.cos(angleRad) - w * Math.cos(perp);
  const rc1y = cy + L * 0.78 * Math.sin(angleRad) - w * Math.sin(perp);
  const rc2x = cx + L * 0.28 * Math.cos(angleRad) - w * 0.55 * Math.cos(perp);
  const rc2y = cy + L * 0.28 * Math.sin(angleRad) - w * 0.55 * Math.sin(perp);
  return `M ${f(cx)} ${f(cy)} C ${f(lc1x)} ${f(lc1y)} ${f(lc2x)} ${f(lc2y)} ${f(tx)} ${f(ty)} C ${f(rc1x)} ${f(rc1y)} ${f(rc2x)} ${f(rc2y)} ${f(cx)} ${f(cy)}`;
}

function mkFlower(cx: number, cy: number, count: number, L: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return mkPetal(cx, cy, angle, L);
  });
}

/* ── Stars ───────────────────────────────────────────────────────── */
const STAR_COUNT = 160;

interface Star {
  id: number; x: number; y: number;
  size: number; delay: number; dur: number; base: number;
}

/* ── Component ───────────────────────────────────────────────────── */
const FlowersPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const stars: Star[] = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.4,
        delay: Math.random() * 5,
        dur: 2.5 + Math.random() * 3,
        base: 0.25 + Math.random() * 0.65,
      })),
    [],
  );

  /* Pre-compute all flower petal paths */
  const f1Petals = useMemo(() => mkFlower(118, 236, 5, 30), []);
  const f2Petals = useMemo(() => mkFlower(200, 204, 6, 35), []);
  const f3Petals = useMemo(() => mkFlower(284, 240, 5, 29), []);

  /* Framer-motion helpers */
  const stem = (delay: number) => ({
    stroke: "white" as const,
    strokeWidth: 2,
    fill: "none" as const,
    filter: "url(#glow)",
    initial: { pathLength: 0, opacity: 0 },
    animate: ready ? { pathLength: 1, opacity: 1 } : {},
    transition: {
      pathLength: { duration: 2.2, delay, ease: [0.2, 0.6, 0.4, 1.0] as [number, number, number, number] },
      opacity:   { duration: 0.4, delay },
    },
  });

  const leaf = (delay: number) => ({
    stroke: "white" as const,
    strokeWidth: 1.5,
    fill: "none" as const,
    filter: "url(#glow)",
    initial: { pathLength: 0, opacity: 0 },
    animate: ready ? { pathLength: 1, opacity: 1 } : {},
    transition: {
      pathLength: { duration: 1.1, delay, ease: "easeOut" as const },
      opacity:   { duration: 0.3, delay },
    },
  });

  const petal = (delay: number) => ({
    stroke: "white" as const,
    strokeWidth: 1.5,
    fill: "none" as const,
    filter: "url(#glow-strong)",
    initial: { pathLength: 0, opacity: 0 },
    animate: ready ? { pathLength: 1, opacity: 1 } : {},
    transition: {
      pathLength: { duration: 0.9, delay, ease: "easeOut" as const },
      opacity:   { duration: 0.25, delay },
    },
  });

  const circle = (delay: number) => ({
    stroke: "white" as const,
    strokeWidth: 1.5,
    fill: "none" as const,
    filter: "url(#glow-strong)",
    initial: { pathLength: 0, opacity: 0 },
    animate: ready ? { pathLength: 1, opacity: 1 } : {},
    transition: {
      pathLength: { duration: 0.55, delay, ease: "easeOut" as const },
      opacity:   { duration: 0.25, delay },
    },
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #04040a 0%, #07050e 60%, #06040c 100%)" }}
    >
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(6px)" }}
      >
        ←
      </motion.button>

      {/* ── Starfield ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [s.base * 0.25, s.base, s.base * 0.15, s.base * 0.8, s.base * 0.25] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── I L O V E U ────────────────────────────────────────────── */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, delay: 0.5 }}
        className="relative z-10 mt-16 text-2xl font-mono tracking-[0.55em] select-none"
        style={{
          color: "white",
          textShadow:
            "0 0 8px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.5), 0 0 55px rgba(200,200,255,0.3)",
        }}
      >
        I L O V E U
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.2 }}
        className="relative z-10 mt-3 text-xs tracking-widest"
        style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Quicksand', sans-serif" }}
      >
        always &amp; forever
      </motion.p>

      {/* ── SVG Flower cluster ─────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-xs mx-auto mt-4 flex-1 flex items-start justify-center px-4">
        <svg
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          style={{ overflow: "visible" }}
        >
          <defs>
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ══ STEMS ══════════════════════════════════════════════ */}

          {/* Stem 1 — left flower */}
          <motion.path
            d="M 140 468 C 138 440 135 405 132 370 C 129 332 120 295 118 250"
            {...stem(0)}
          />
          {/* Stem 2 — center (tallest) */}
          <motion.path
            d="M 200 468 C 200 438 200 402 200 365 C 200 316 200 268 200 218"
            {...stem(0.25)}
          />
          {/* Stem 3 — right */}
          <motion.path
            d="M 262 468 C 264 440 268 404 270 368 C 272 330 278 295 284 254"
            {...stem(0.12)}
          />

          {/* ══ LEAVES ═════════════════════════════════════════════ */}

          {/* Stem 1 leaves */}
          <motion.path
            d="M 132 368 C 112 348 80 358 74 378 C 98 366 126 371 132 368"
            {...leaf(1.6)}
          />
          <motion.path
            d="M 130 328 C 152 306 182 318 184 338 C 162 329 135 332 130 328"
            {...leaf(1.9)}
          />

          {/* Stem 2 leaves */}
          <motion.path
            d="M 200 372 C 176 352 146 364 144 384 C 168 372 196 376 200 372"
            {...leaf(1.7)}
          />
          <motion.path
            d="M 200 325 C 224 303 254 315 256 335 C 232 326 205 329 200 325"
            {...leaf(2.0)}
          />

          {/* Stem 3 leaves */}
          <motion.path
            d="M 270 368 C 248 348 218 360 216 380 C 240 368 266 372 270 368"
            {...leaf(1.65)}
          />
          <motion.path
            d="M 272 330 C 294 308 322 322 324 342 C 300 332 276 334 272 330"
            {...leaf(1.95)}
          />

          {/* ══ FLOWER 1 — left (5 petals) at (118, 236) ══════════ */}
          {f1Petals.map((d, i) => (
            <motion.path key={`f1p${i}`} d={d} {...petal(2.9 + i * 0.14)} />
          ))}
          <motion.circle cx={118} cy={236} r={7} {...circle(3.65)} />

          {/* ══ FLOWER 2 — center (6 petals) at (200, 204) ════════ */}
          {f2Petals.map((d, i) => (
            <motion.path key={`f2p${i}`} d={d} {...petal(3.1 + i * 0.16)} />
          ))}
          <motion.circle cx={200} cy={204} r={8.5} {...circle(4.08)} />

          {/* ══ FLOWER 3 — right (5 petals) at (284, 240) ════════ */}
          {f3Petals.map((d, i) => (
            <motion.path key={`f3p${i}`} d={d} {...petal(3.0 + i * 0.14)} />
          ))}
          <motion.circle cx={284} cy={240} r={7} {...circle(3.7)} />

          {/* Tiny bud extras — add depth */}
          {/* Small bud on stem 1 side-branch */}
          <motion.path
            d="M 124 295 C 104 280 92 268 96 258 C 105 262 118 275 124 295"
            {...leaf(2.3)}
          />
          <motion.circle cx={96} cy={255} r={4.5} {...circle(3.55)} />

          {/* Small bud on stem 3 side-branch */}
          <motion.path
            d="M 276 292 C 296 276 310 264 306 254 C 297 258 282 272 276 292"
            {...leaf(2.3)}
          />
          <motion.circle cx={306} cy={251} r={4.5} {...circle(3.6)} />
        </svg>
      </div>

      {/* Subtle footer glow */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(120,60,180,0.06), transparent)",
        }}
      />
    </div>
  );
};

export default FlowersPage;
