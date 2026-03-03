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
        { label: "Days", value: time.days },
        { label: "Hrs", value: time.hours },
        { label: "Min", value: time.minutes },
        { label: "Sec", value: time.seconds },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.8 }}
      className="flex flex-col items-center gap-2"
    >
      <span
        className="text-xs tracking-widest uppercase"
        style={{ color: "hsl(340, 60%, 55%)", fontFamily: "'Quicksand', sans-serif" }}
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
        <div className="flex gap-3">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <div
                className="rounded-xl w-14 h-14 flex items-center justify-center text-lg font-bold tabular-nums"
                style={{
                  background: "hsl(340, 25%, 15%)",
                  color: "hsl(340, 80%, 75%)",
                  boxShadow:
                    "0 0 15px hsl(340 80% 60% / 0.3), 0 0 30px hsl(280 60% 50% / 0.15), inset 0 1px 0 hsl(340 40% 25%)",
                  border: "1px solid hsl(340, 40%, 25%)",
                  fontFamily: "monospace",
                }}
              >
                {pad(u.value)}
              </div>
              <span
                className="text-[9px] mt-1 uppercase tracking-wider"
                style={{ color: "hsl(340, 50%, 55%)" }}
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
