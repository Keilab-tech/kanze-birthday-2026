import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── Heart SVG path (24×24 viewBox) ──────────────────────────────── */
const HEART_D =
  "M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z";

interface HeartCfg {
  left: string; top: string; size: number;
  color: string; circle: boolean; delay: number; bob: number;
}

/* Positions matched to the reference image */
const HEARTS: HeartCfg[] = [
  { left: "11%",  top: "18%", size: 28, color: "#7a3555", circle: false, delay: 0.3, bob: 3.4 },
  { left: "22%",  top: "47%", size: 20, color: "#c8607a", circle: false, delay: 0.8, bob: 3.9 },
  { left: "11%",  top: "71%", size: 24, color: "#7a3555", circle: false, delay: 0.5, bob: 4.2 },
  { left: "77%",  top:  "9%", size: 38, color: "#c8607a", circle: true,  delay: 0.2, bob: 3.6 },
  { left: "84%",  top: "38%", size: 20, color: "#c8607a", circle: false, delay: 0.7, bob: 3.1 },
  { left: "80%",  top: "63%", size: 24, color: "#c8607a", circle: true,  delay: 0.6, bob: 4.5 },
  { left: "58%",  top: "34%", size: 17, color: "#c8607a", circle: true,  delay: 0.4, bob: 3.7 },
  { left: "36%",  top: "52%", size: 15, color: "#c8607a", circle: true,  delay: 1.0, bob: 3.0 },
];

function FloatingHeart({ h, show }: { h: HeartCfg; show: boolean }) {
  return (
    <motion.div
      style={{
        position: "fixed", left: h.left, top: h.top,
        width: h.size, height: h.size,
        zIndex: 15, pointerEvents: "none",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      transition={{ delay: h.delay, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        style={{ width: "100%", height: "100%" }}
        animate={show ? { y: [0, -(h.size * 0.3), 0] } : {}}
        transition={{ duration: h.bob, repeat: Infinity, ease: "easeInOut", delay: h.delay + 0.8 }}
      >
        {h.circle ? (
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            border: `2px solid ${h.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" width="46%" height="46%" fill={h.color}>
              <path d={HEART_D} />
            </svg>
          </div>
        ) : (
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill={h.color}>
            <path d={HEART_D} />
          </svg>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FlowersPage() {
  const navigate = useNavigate();
  const [textPhase, setTextPhase]     = useState<0 | 1 | 2>(0);
  const [showFlowers, setShowFlowers] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextPhase(1), 350);
    const t2 = setTimeout(() => setTextPhase(2), 3100);
    const t3 = setTimeout(() => setShowFlowers(true), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        backgroundImage: "url(/images/flowers-bg.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Subtle dark overlay so text stays readable */}
      <div className="absolute inset-0" style={{ background: "rgba(8,12,22,0.18)" }} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        onClick={() => navigate("/letter")}
        data-testid="button-back-flowers"
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.7)" }}
      >←</motion.button>

      {/* Floating hearts (appear after flowers) */}
      {HEARTS.map((h, i) => (
        <FloatingHeart key={i} h={h} show={showFlowers} />
      ))}

      {/* Text sequence */}
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
                textShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.4)",
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
    </div>
  );
}
