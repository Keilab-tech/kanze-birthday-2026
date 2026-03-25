import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNextBirthday, getNextBirthdayAge, ordinal } from "@/utils/birthday";

interface Props {
  onUnlock: () => void;
}

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  delay: i * 0.18,
  x: 5 + (i / 16) * 90,
  size: 14 + (i % 5) * 4,
}));

const Petal = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    initial={{ y: "110vh", opacity: 0, rotate: 0 }}
    animate={{ y: "-10vh", opacity: [0, 0.7, 0.7, 0], rotate: 360 }}
    transition={{ duration: 5 + (size % 3), delay, ease: "easeOut", repeat: Infinity, repeatDelay: 4 }}
    className="absolute bottom-0 pointer-events-none"
    style={{ left: `${x}%`, width: size, height: size }}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <ellipse cx="12" cy="6" rx="4" ry="6" fill="hsl(335, 75%, 72%)" opacity="0.9" />
      <ellipse cx="6" cy="14" rx="4" ry="6" transform="rotate(-60 6 14)" fill="hsl(345, 70%, 68%)" opacity="0.85" />
      <ellipse cx="18" cy="14" rx="4" ry="6" transform="rotate(60 18 14)" fill="hsl(325, 72%, 70%)" opacity="0.85" />
    </svg>
  </motion.div>
);

const pad = (n: number) => n.toString().padStart(2, "0");

export default function BirthdayLockscreen({ onUnlock }: Props) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState<"counting" | "burst" | "gone">("counting");
  const firedRef = useRef(false);

  const calcDiff = useCallback(() => {
    // Once fired, freeze the display — stop all future updates
    if (firedRef.current) return;

    const target = getNextBirthday().getTime();
    const diff = target - Date.now();

    if (diff <= 0) {
      setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      firedRef.current = true;
      setPhase("burst");
      setTimeout(() => setPhase("gone"), 1400);
      setTimeout(onUnlock, 1600);
      return;
    }

    let r = Math.floor(diff / 1000);
    const days    = Math.floor(r / 86400); r %= 86400;
    const hours   = Math.floor(r / 3600);  r %= 3600;
    const minutes = Math.floor(r / 60);
    const seconds = r % 60;
    setTime({ days, hours, minutes, seconds });
  }, [onUnlock]);

  useEffect(() => {
    calcDiff();
    const id = setInterval(calcDiff, 1000);
    return () => clearInterval(id);
  }, [calcDiff]);

  const nextAge  = getNextBirthdayAge();

  const units = [
    { label: "DAYS", value: time.days },
    { label: "HRS",  value: time.hours },
    { label: "MIN",  value: time.minutes },
    { label: "SEC",  value: time.seconds },
  ];

  return (
    <AnimatePresence>
      {phase !== "gone" && (
        <motion.div
          key="lockscreen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ background: "linear-gradient(160deg, #0d0010 0%, #1a0025 45%, #0a000f 100%)" }}
        >
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full"
              style={{ background: "hsl(320 90% 55% / 0.14)", filter: "blur(90px)" }} />
            <div className="absolute top-2/3 left-1/4 w-56 h-56 rounded-full"
              style={{ background: "hsl(280 70% 50% / 0.10)", filter: "blur(60px)" }} />
          </div>

          {/* Floating petals */}
          {PETALS.map((p) => <Petal key={p.id} {...p} />)}

          {/* Burst circle when unlocking */}
          {phase === "burst" && (
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 20, opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{ width: 100, height: 100, background: "hsl(340, 80%, 62%)" }}
            />
          )}

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-7 px-8 w-full max-w-sm">

            {/* App icon with ripple */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.15 }}
              className="relative flex items-center justify-center"
            >
              {[0, 0.5, 1.0].map((d, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    borderColor: "hsl(330 80% 70% / 0.28)",
                    width: 92 + i * 32,
                    height: 92 + i * 32,
                  }}
                  animate={{ scale: [1, 1.3], opacity: [0.55, 0] }}
                  transition={{ duration: 2.2, delay: d, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
              <img
                src="/icon-192.png"
                alt="Kanze"
                className="w-20 h-20 rounded-[1.5rem]"
                style={{ boxShadow: "0 0 0 3px hsl(330 70% 65% / 0.4), 0 16px 48px hsl(330 80% 50% / 0.45)" }}
              />
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.7 }}
              className="flex flex-col items-center gap-0.5 text-center"
            >
              <p
                className="text-[10px] tracking-[0.32em] uppercase mb-1"
                style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
              >
                get ready for
              </p>
              <h1
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontWeight: 700,
                  fontSize: "2.4rem",
                  lineHeight: 1.1,
                  background: "linear-gradient(135deg, hsl(340,90%,80%), hsl(20,85%,75%), hsl(340,85%,75%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 18px hsl(340 80% 65% / 0.45))",
                }}
              >
                Kanze's {ordinal(nextAge)}
              </h1>
              <h2
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontWeight: 600,
                  fontSize: "1.55rem",
                  color: "hsl(340, 68%, 70%)",
                }}
              >
                Birthday ✨
              </h2>
            </motion.div>

            {/* "arrives in" label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-[10px] tracking-[0.28em] uppercase -mb-3"
              style={{ color: "hsl(340, 40%, 52%)", fontFamily: "'Quicksand', sans-serif" }}
            >
              arrives in
            </motion.p>

            {/* Countdown tiles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.6 }}
              className="flex gap-3"
            >
              {units.map((u) => (
                <div key={u.label} className="flex flex-col items-center">
                  <motion.div
                    key={u.value}
                    initial={{ y: -6, opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-2xl w-[3.8rem] h-[3.8rem] flex items-center justify-center font-extrabold tabular-nums"
                    style={{
                      fontSize: "1.5rem",
                      background: "hsl(340 18% 13% / 0.82)",
                      color: "hsl(340, 75%, 84%)",
                      border: "1px solid hsl(340 30% 28% / 0.45)",
                      boxShadow: "0 4px 22px hsl(340 70% 50% / 0.14), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {pad(u.value)}
                  </motion.div>
                  <span
                    className="text-[7px] mt-2 uppercase tracking-[0.22em]"
                    style={{ color: "hsl(340, 32%, 48%)" }}
                  >
                    {u.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 1.1 }}
              className="text-xs text-center leading-relaxed"
              style={{ color: "hsl(340, 40%, 62%)", fontFamily: "'Quicksand', sans-serif", maxWidth: 210 }}
            >
              A surprise is being prepared just for you…
            </motion.p>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
