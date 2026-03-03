import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const TARGET_DATE = new Date("2027-03-29T00:00:00");

const BirthdayCountdown = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  const calcDiff = useCallback(() => {
    const diff = TARGET_DATE.getTime() - Date.now();
    if (diff <= 0) {
      setIsPast(true);
      return;
    }
    let remaining = Math.floor(diff / 1000);
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    setTime({ days, hours, minutes, seconds });
  }, []);

  useEffect(() => {
    calcDiff();
    const interval = setInterval(calcDiff, 1000);
    return () => clearInterval(interval);
  }, [calcDiff]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const units = isPast
    ? []
    : [
        { label: "DAYS", value: time.days },
        { label: "HRS", value: time.hours },
        { label: "MIN", value: time.minutes },
        { label: "SEC", value: time.seconds },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.8 }}
      className="flex flex-col items-center gap-3"
    >
      <span
        className="text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "hsl(340, 45%, 60%)", fontFamily: "'Quicksand', sans-serif" }}
      >
        Countdown to 21 🎂
      </span>

      {isPast ? (
        <span
          className="text-sm font-medium"
          style={{ color: "hsl(340, 80%, 65%)", fontFamily: "'Dancing Script', cursive" }}
        >
          Happy 21st Birthday! 🎉
        </span>
      ) : (
        <div className="flex gap-4">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <div
                className="rounded-xl w-14 h-14 flex items-center justify-center text-xl font-extrabold tabular-nums"
                style={{
                  background: "hsl(340, 20%, 18% / 0.6)",
                  color: "hsl(340, 70%, 80%)",
                  boxShadow: "inset 0 1px 3px hsl(340 30% 10% / 0.3), 0 1px 2px hsl(0 0% 100% / 0.05)",
                  border: "1px solid hsl(340, 25%, 30% / 0.4)",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  backdropFilter: "blur(8px)",
                }}
              >
                {pad(u.value)}
              </div>
              <span
                className="text-[7px] mt-1.5 uppercase tracking-[0.2em] font-light"
                style={{ color: "hsl(340, 35%, 55% / 0.7)" }}
              >
                {u.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BirthdayCountdown;
