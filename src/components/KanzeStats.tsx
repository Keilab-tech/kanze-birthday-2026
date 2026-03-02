import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Soft Around Me", value: "1000", suffix: "%" },
  { label: "Main Character Energy", value: "Unlimited", suffix: "" },
  { label: "Fashion Sense", value: "Illegal", suffix: "" },
  { label: "Dangerous Aura", value: "Detected", suffix: "" },
  { label: "Baby Girl Mode", value: "Activated", suffix: "" },
];

const AnimatedCounter = ({ value, suffix }: { value: string; suffix: string }) => {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const num = parseInt(value);
    if (isNaN(num)) {
      // Text value — type it out
      let i = 0;
      const interval = setInterval(() => {
        setDisplay(value.slice(0, i + 1));
        i++;
        if (i >= value.length) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }

    // Number — count up
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(num * eased).toString());
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, value]);

  return (
    <div ref={ref} className="text-3xl font-bold gradient-text animate-counter-pulse">
      {display}{suffix}
    </div>
  );
};

const KanzeStats = () => {
  return (
    <section className="py-20 px-6">
      <h2 className="text-3xl font-bold text-center mb-12 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Kanze Stats
      </h2>
      <div className="max-w-md mx-auto space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 flex items-center justify-between glow-pink"
          >
            <span className="text-muted-foreground text-sm tracking-wide uppercase">
              {stat.label}
            </span>
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default KanzeStats;