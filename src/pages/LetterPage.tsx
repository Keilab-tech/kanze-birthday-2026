import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/contexts/MusicContext";

/* ── Floating decorations – silver diamonds & soft petals ── */
const FLOATERS = [
  { id: 1,  x: 6,   y: 8,   size: 18, opacity: 0.28, delay: 0,    dur: 7,  shape: "diamond" },
  { id: 2,  x: 88,  y: 14,  size: 12, opacity: 0.22, delay: 1.2,  dur: 9,  shape: "diamond" },
  { id: 3,  x: 4,   y: 38,  size: 10, opacity: 0.18, delay: 2.5,  dur: 8,  shape: "diamond" },
  { id: 4,  x: 92,  y: 42,  size: 22, opacity: 0.20, delay: 0.8,  dur: 11, shape: "diamond" },
  { id: 5,  x: 14,  y: 62,  size: 14, opacity: 0.24, delay: 3,    dur: 7,  shape: "diamond" },
  { id: 6,  x: 84,  y: 70,  size: 16, opacity: 0.18, delay: 1.8,  dur: 10, shape: "diamond" },
  { id: 7,  x: 5,   y: 82,  size: 20, opacity: 0.22, delay: 2,    dur: 9,  shape: "diamond" },
  { id: 8,  x: 90,  y: 88,  size: 11, opacity: 0.20, delay: 0.5,  dur: 8,  shape: "diamond" },
  { id: 9,  x: 30,  y: 5,   size: 9,  opacity: 0.16, delay: 4,    dur: 12, shape: "diamond" },
  { id: 10, x: 70,  y: 3,   size: 15, opacity: 0.20, delay: 1.5,  dur: 8,  shape: "diamond" },
  { id: 11, x: 50,  y: 92,  size: 13, opacity: 0.18, delay: 3.5,  dur: 10, shape: "diamond" },
  { id: 12, x: 22,  y: 75,  size: 8,  opacity: 0.15, delay: 5,    dur: 7,  shape: "heart"   },
  { id: 13, x: 78,  y: 55,  size: 10, opacity: 0.18, delay: 2.2,  dur: 9,  shape: "heart"   },
  { id: 14, x: 60,  y: 80,  size: 8,  opacity: 0.15, delay: 4.5,  dur: 8,  shape: "heart"   },
];

const FloatingDecoration = ({
  x, y, size, opacity, delay, dur, shape,
}: (typeof FLOATERS)[0]) => (
  <motion.div
    style={{
      position: "fixed",
      left: `${x}%`, top: `${y}%`,
      width: size, height: size,
      opacity, zIndex: 1,
      pointerEvents: "none",
    }}
    animate={{ y: [0, -14, 0], rotate: shape === "diamond" ? [0, 8, -8, 0] : [0, 5, -5, 0] }}
    transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    {shape === "diamond" ? (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: "100%", height: "100%" }}>
        <path d="M12 2L22 12L12 22L2 12Z" fill="hsl(240,8%,72%)" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: "100%", height: "100%" }}>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="hsl(340,55%,78%)"
        />
      </svg>
    )}
  </motion.div>
);

/* ── Letter content ── */
const letterLines = [
  "Dear Kanze...",
  "",
  "If I could pause time, I'd choose the moments with you.",
  "",
  "You've grown into someone so beautiful — not just on the outside,",
  "but in the way you care, the way you laugh, the way you love.",
  "",
  "21 years of you in this world,",
  "and every single one of them matters.",
  "",
  "I hope this year brings you everything your heart has been whispering about.",
  "The dreams you haven't said out loud — I hope they all come true.",
  "",
  "You deserve flowers on ordinary days.",
  "You deserve people who stay.",
  "You deserve a love that feels like home.",
  "",
  "No matter where life takes us...",
  "I'm grateful it gave me you.",
];

/* Paragraph grouping for the decoration hearts */
const HEART_AT_LINES = [6, 13, 18]; // lines after which a little heart appears

const LetterPage = () => {
  const navigate  = useNavigate();
  const [visibleChars, setVisibleChars] = useState(0);
  const typeAudioCtxRef = useRef<AudioContext | null>(null);
  const [showStars, setShowStars]   = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { fadeDown, fadeUp } = useMusic();

  useEffect(() => {
    fadeDown();
    return () => { fadeUp(); };
  }, [fadeDown, fadeUp]);

  const fullText    = letterLines.join("\n");
  const totalChars  = fullText.length;

  const playKeyClick = useCallback(() => {
    try {
      if (!typeAudioCtxRef.current) typeAudioCtxRef.current = new AudioContext();
      const ctx = typeAudioCtxRef.current;
      const bufferSize = ctx.sampleRate * 0.025;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.exp(-i / (bufferSize * 0.15));
        output[i] = (Math.random() * 2 - 1) * env * 0.3;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2000 + Math.random() * 1500;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.value = 0.12 + Math.random() * 0.06;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (_e) { /* AudioContext not available */ }
  }, []);

  useEffect(() => {
    if (visibleChars >= totalChars) {
      setTimeout(() => setShowStars(true), 800);
      setTimeout(() => setShowButton(true), 2200);
      return;
    }
    const currentChar = fullText[visibleChars];
    const isNewline   = currentChar === "\n";
    const delay       = isNewline ? 220 : 42 + Math.random() * 28;
    const t = setTimeout(() => {
      if (!isNewline && currentChar !== " ") playKeyClick();
      setVisibleChars(v => v + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [visibleChars, totalChars, fullText, playKeyClick]);

  const visibleText      = fullText.slice(0, visibleChars);
  const visibleLineTexts = visibleText.split("\n");

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(160deg, hsl(345,75%,92%) 0%, hsl(350,65%,90%) 30%, hsl(340,55%,93%) 65%, hsl(30,60%,93%) 100%)",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* Floating decorations */}
      {FLOATERS.map(f => <FloatingDecoration key={f.id} {...f} />)}

      {/* "Kanze" ghost watermark */}
      <AnimatePresence>
        {showStars && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.07 }}
            transition={{ duration: 3 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <span
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: "clamp(90px,22vw,180px)",
                color: "hsl(340, 80%, 60%)",
                userSelect: "none",
              }}
            >
              Kanze
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onClick={() => navigate("/hub")}
        className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center"
        style={{
          background: "hsl(0 0% 100% / 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 2px 12px hsl(340 50% 70% / 0.22)",
          border: "1px solid hsl(340,45%,85%)",
          color: "hsl(340, 60%, 50%)",
          fontSize: 18,
        }}
        data-testid="button-letter-back"
      >
        ←
      </motion.button>

      {/* ── Letter card ── */}
      <div
        className="relative z-10 mx-auto px-7 pt-20 pb-28"
        style={{ maxWidth: 540 }}
      >
        {visibleLineTexts.map((lineText, i) => {
          const isTitle    = i === 0;
          const isCursor   = i === visibleLineTexts.length - 1;
          const isBlankLine = letterLines[i] === "";

          /* blank gap line */
          if (isBlankLine && !isCursor) {
            const afterLine = i - 1;
            const showHeart = HEART_AT_LINES.includes(afterLine);
            return (
              <div key={i} style={{ height: showHeart ? 0 : 0 }}>
                {showHeart && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{ textAlign: "left", marginTop: 6, marginBottom: 2, fontSize: 13 }}
                  >
                    💗
                  </motion.div>
                )}
                <div style={{ height: 22 }} />
              </div>
            );
          }
          if (lineText === "" && isCursor) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isTitle ? (
                <p
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "clamp(1.7rem,5vw,2.1rem)",
                    fontWeight: 700,
                    color: "hsl(340, 62%, 52%)",
                    marginBottom: "1.4rem",
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {lineText}
                  {isCursor && (
                    <span
                      style={{
                        display: "inline-block", width: 2, height: "0.9em",
                        marginLeft: 2, verticalAlign: "middle",
                        background: "hsl(340, 80%, 65%)",
                        animation: "blink 0.8s step-end infinite",
                      }}
                    />
                  )}
                </p>
              ) : (
                <p
                  style={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: "clamp(0.9rem,2.5vw,1.02rem)",
                    color: "hsl(340, 25%, 28%)",
                    lineHeight: 1.95,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {lineText}
                  {isCursor && (
                    <span
                      style={{
                        display: "inline-block", width: 2, height: "0.95em",
                        marginLeft: 2, verticalAlign: "middle",
                        background: "hsl(340, 80%, 65%)",
                        animation: "blink 0.8s step-end infinite",
                      }}
                    />
                  )}
                </p>
              )}
            </motion.div>
          );
        })}

        {/* ── Stars after letter finishes ── */}
        <AnimatePresence>
          {showStars && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
              style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 10 }}
            >
              {["✨", "⭐", "✨"].map((s, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.7], scale: [0, 1.3, 1] }}
                  transition={{ duration: 1.1, delay: i * 0.3 }}
                  style={{ fontSize: 22 }}
                >
                  {s}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "One more thing" CTA ── */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 160 }}
              style={{ marginTop: 36, display: "flex", justifyContent: "center" }}
            >
              <motion.button
                data-testid="button-one-more-thing"
                onClick={() => navigate("/flowers")}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "14px 30px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(135deg, hsl(340,80%,60%) 0%, hsl(350,75%,55%) 100%)",
                  color: "#fff",
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: "1.18rem",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  cursor: "pointer",
                  boxShadow: "0 6px 28px hsl(340 80% 60% / 0.42), 0 1px 0 hsl(0 0% 100% / 0.2) inset",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Oh, one more last thing — click here</span>
                <span style={{ fontSize: "1rem" }}>🌸</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LetterPage;
