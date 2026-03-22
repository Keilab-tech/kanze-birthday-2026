import { motion } from "framer-motion";
import { useMemo } from "react";

const HEART_PATH =
  "M12 21.593C6.37 16.054 1 11.297 1 7.191 1 3.4 4.068 2 6.281 2c1.312 0 4.151 1.018 5.719 4.955C13.569 3.018 16.407 2 17.719 2 19.932 2 23 3.389 23 7.191 23 11.297 17.63 16.054 12 21.593Z";

interface Heart {
  id: number;
  x: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  wobble: number;
  startOpacity: number;
}

const COLORS = [
  "#ffffff",
  "hsl(340,90%,88%)",
  "#ffffff",
  "hsl(330,80%,82%)",
  "hsl(350,85%,90%)",
  "#ffffff",
  "hsl(340,75%,85%)",
  "#ffffff",
];

function makeHearts(count: number): Heart[] {
  const out: Heart[] = [];
  const rng = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  for (let i = 0; i < count; i++) {
    out.push({
      id: i,
      x: `${4 + rng(i * 3 + 1) * 92}%`,
      size: 10 + rng(i * 3 + 2) * 26,
      color: COLORS[i % COLORS.length],
      duration: 6 + rng(i * 3 + 3) * 10,
      delay: -(rng(i * 7 + 5) * 14),
      wobble: (rng(i * 3 + 4) - 0.5) * 40,
      startOpacity: 0.12 + rng(i * 3 + 6) * 0.25,
    });
  }
  return out;
}

interface Props {
  count?: number;
  zIndex?: number;
}

const FloatingHearts = ({ count = 22, zIndex = 5 }: Props) => {
  const hearts = useMemo(() => makeHearts(count), [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex }}
    >
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          style={{
            position: "absolute",
            left: h.x,
            bottom: "-10%",
            width: h.size,
            height: h.size,
          }}
          animate={{
            y: [0, -(window.innerHeight * 1.2)],
            x: [0, h.wobble, 0, -h.wobble, 0],
            opacity: [0, h.startOpacity, h.startOpacity, h.startOpacity * 0.5, 0],
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.1, 0.6, 0.85, 1],
            x: {
              duration: h.duration,
              delay: h.delay,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            },
          }}
        >
          <svg
            viewBox="1 2 22 20"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={HEART_PATH} fill={h.color} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingHearts;
