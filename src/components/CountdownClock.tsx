import { useState, useEffect, useCallback } from "react";

const TARGET_DATE = new Date("2027-03-29T00:00:00");

const CountdownClock = () => {
  const [time, setTime] = useState({ yy: 0, mo: 0, dd: 0, hh: 0, mm: 0, ss: 0 });
  const [isPast, setIsPast] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [now, setNow] = useState(new Date());

  const calcDiff = useCallback(() => {
    const current = new Date();
    setNow(current);
    const diff = TARGET_DATE.getTime() - current.getTime();
    if (diff <= 0) {
      setIsPast(true);
      return;
    }

    let remaining = diff / 1000;
    const yy = Math.floor(remaining / (365.25 * 24 * 3600));
    remaining -= yy * 365.25 * 24 * 3600;
    const mo = Math.floor(remaining / (30.44 * 24 * 3600));
    remaining -= mo * 30.44 * 24 * 3600;
    const dd = Math.floor(remaining / (24 * 3600));
    remaining -= dd * 24 * 3600;
    const hh = Math.floor(remaining / 3600);
    remaining -= hh * 3600;
    const mm = Math.floor(remaining / 60);
    const ss = Math.floor(remaining % 60);

    setTime({ yy, mo, dd, hh, mm, ss });
  }, []);

  useEffect(() => {
    calcDiff();
    const interval = setInterval(calcDiff, 1000);
    return () => clearInterval(interval);
  }, [calcDiff]);

  const handleTap = () => {
    setWiggle(true);
    setTimeout(() => setWiggle(false), 500);
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  // Analog clock angles
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  return (
    <div
      onClick={handleTap}
      className={`absolute top-4 right-4 z-30 cursor-pointer select-none ${wiggle ? "animate-wiggle" : ""}`}
    >
      <div className="relative w-20 h-20">
        {/* Clock face */}
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: "hsl(30, 50%, 65%)",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 15px hsl(30 50% 65% / 0.2), inset 0 0 10px rgba(0,0,0,0.3)",
          }}
        >
          {/* K monogram watermark */}
          <span
            className="absolute inset-0 flex items-center justify-center text-xl opacity-10"
            style={{ fontFamily: "'Dancing Script', cursive", color: "hsl(340, 80%, 75%)" }}
          >
            K
          </span>

          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "hsl(30, 50%, 65%)",
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 30}deg) translateY(-32px) translateX(-50%)`,
                transformOrigin: "center center",
                opacity: 0.6,
              }}
            />
          ))}

          {/* Hour hand */}
          <div
            className="absolute rounded-full"
            style={{
              width: 2, height: 18,
              backgroundColor: "hsl(30, 50%, 75%)",
              top: "50%", left: "50%",
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
              transformOrigin: "bottom center",
            }}
          />
          {/* Minute hand */}
          <div
            className="absolute rounded-full"
            style={{
              width: 1.5, height: 24,
              backgroundColor: "hsl(30, 50%, 80%)",
              top: "50%", left: "50%",
              transform: `translate(-50%, -100%) rotate(${minAngle}deg)`,
              transformOrigin: "bottom center",
            }}
          />
          {/* Second hand */}
          <div
            className="absolute rounded-full"
            style={{
              width: 1, height: 26,
              backgroundColor: "hsl(340, 80%, 65%)",
              top: "50%", left: "50%",
              transform: `translate(-50%, -100%) rotate(${secAngle}deg)`,
              transformOrigin: "bottom center",
              transition: "transform 0.2s ease",
            }}
          />
          {/* Center dot */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "hsl(340, 80%, 65%)",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Digital countdown below */}
        <div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5"
          style={{
            background: "rgba(20, 0, 15, 0.7)",
            backdropFilter: "blur(4px)",
            border: "1px solid hsl(340 60% 40% / 0.3)",
          }}
        >
          {isPast ? (
            <span className="text-[9px] tracking-wider" style={{ color: "hsl(340, 80%, 75%)", fontFamily: "monospace" }}>
              She's 22 🤍
            </span>
          ) : (
            <span className="text-[8px] tracking-wider" style={{ color: "hsl(340, 80%, 75%)", fontFamily: "monospace" }}>
              {pad(time.yy)}:{pad(time.mo)}:{pad(time.dd)}:{pad(time.hh)}:{pad(time.mm)}:{pad(time.ss)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountdownClock;
