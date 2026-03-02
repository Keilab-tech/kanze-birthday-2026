import { useState, useEffect, useRef } from "react";

const SECRET_PASSWORD = "habibi";

const AnimatedCounter = ({ value, suffix, visible }: { value: string; suffix: string; visible: boolean }) => {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!visible) return;
    const num = parseInt(value);
    if (isNaN(num)) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplay(value.slice(0, i + 1));
        i++;
        if (i >= value.length) clearInterval(interval);
      }, 80);
      return () => clearInterval(interval);
    }

    const duration = 2000;
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
    <span className="text-foreground/90">
      {display}{suffix}
    </span>
  );
};

const useInView = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
};

const stats = [
  { label: "Soft Around Me", value: "1000", suffix: "%" },
  { label: "Main Character Energy", value: "Unlimited", suffix: "" },
  { label: "Fashion Sense", value: "Illegal", suffix: "" },
  { label: "Danger Level", value: "Controlled", suffix: "" },
];

const MainApp = () => {
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const section1 = useInView();
  const section2 = useInView();
  const section3 = useInView();

  useEffect(() => {
    if (section2.visible) {
      const t = setTimeout(() => setShowSecondLine(true), 1500);
      return () => clearTimeout(t);
    }
  }, [section2.visible]);

  const handleUnlock = () => {
    if (password.toLowerCase() === SECRET_PASSWORD) {
      setUnlocked(true);
      setShowInput(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="snap-container">
      {/* Section 1 — Statement */}
      <div ref={section1.ref} className="snap-section px-8">
        {section1.visible && (
          <h1 className="text-5xl md:text-6xl text-center text-foreground/80 animate-cinema-fade-in-slow leading-tight" style={{ fontWeight: 300 }}>
            21 looks different<br />on you.
          </h1>
        )}
      </div>

      {/* Section 2 — Intimate */}
      <div ref={section2.ref} className="snap-section px-8">
        <div className="text-center space-y-6">
          {section2.visible && (
            <p className="text-2xl text-foreground/50 animate-cinema-fade-in" style={{ fontWeight: 300 }}>
              Public: Untouchable.
            </p>
          )}
          {showSecondLine && (
            <p className="text-2xl text-glow-soft animate-cinema-fade-in-slow" style={{ color: "hsl(330, 100%, 65%)", fontWeight: 300 }}>
              With me: Surprisingly soft.
            </p>
          )}
        </div>
      </div>

      {/* Section 3 — Energy Metrics */}
      <div ref={section3.ref} className="snap-section px-8">
        <div className="text-center space-y-10 max-w-sm">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="animate-cinema-fade-in"
              style={{ animationDelay: `${i * 0.3}s`, opacity: section3.visible ? undefined : 0 }}
            >
              <p className="text-muted-foreground/50 text-xs tracking-[0.3em] uppercase mb-2">
                {stat.label}
              </p>
              <p className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} visible={section3.visible} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — Private Mode */}
      <div className="snap-section px-8 relative">
        <div className="text-center">
          {!unlocked && !showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="text-muted-foreground/25 text-xs tracking-[0.3em] uppercase hover:text-muted-foreground/40 transition-colors duration-700"
            >
              Private Version
            </button>
          )}

          {showInput && !unlocked && (
            <div className="animate-cinema-fade-in space-y-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder=""
                className="w-48 bg-transparent border-b border-muted-foreground/20 px-2 py-3 text-foreground/80 text-center text-sm tracking-[0.2em] focus:outline-none focus:border-muted-foreground/40 transition-colors"
                autoFocus
              />
              <div>
                <button
                  onClick={handleUnlock}
                  className="text-muted-foreground/40 text-xs tracking-[0.3em] uppercase hover:text-muted-foreground/60 transition-colors duration-500"
                >
                  Enter
                </button>
              </div>
              {error && (
                <p className="text-muted-foreground/30 text-xs animate-cinema-fade-in tracking-wide">
                  Not quite.
                </p>
              )}
            </div>
          )}

          {unlocked && (
            <div className="animate-cinema-fade-in-slow space-y-4">
              <p className="text-foreground/50 text-lg tracking-wide" style={{ fontWeight: 300 }}>
                Not everyone gets this version.
              </p>
              <div
                className="w-32 h-32 rounded-full mx-auto animate-soft-glow mt-8"
                style={{
                  background: "radial-gradient(circle, hsl(330 100% 70% / 0.08), transparent 70%)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainApp;
