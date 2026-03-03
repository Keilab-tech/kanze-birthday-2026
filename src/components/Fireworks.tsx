import { useEffect, useRef } from "react";

interface FireworksProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
  decay: number;
}

const Fireworks = ({ onComplete }: FireworksProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = [
      "hsl(340, 80%, 75%)",
      "hsl(350, 70%, 80%)",
      "hsl(20, 80%, 85%)",
      "hsl(40, 90%, 85%)",
      "hsl(330, 60%, 70%)",
      "hsl(0, 0%, 95%)",
    ];

    const createBurst = (x: number, y: number, count: number) => {
      const actual = Math.min(count, 30);
      for (let i = 0; i < actual; i++) {
        const angle = (Math.PI * 2 * i) / actual + (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 4 + 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2.5 + 1,
          life: 0,
          decay: 0.018 + Math.random() * 0.01,
        });
      }
    };

    // Schedule multiple bursts — fewer for performance
    const bursts = [
      { time: 0, x: 0.5, y: 0.3 },
      { time: 500, x: 0.3, y: 0.25 },
      { time: 1000, x: 0.7, y: 0.35 },
      { time: 1800, x: 0.4, y: 0.2 },
      { time: 2600, x: 0.6, y: 0.28 },
    ];

    const timeouts = bursts.map(b =>
      setTimeout(() => createBurst(canvas.width * b.x, canvas.height * b.y, 50 + Math.random() * 30), b.time)
    );

    let frame = 0;
    let animId: number;
    const maxFrames = 300;

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.99;
        p.alpha -= p.decay;
        p.life++;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      frame++;
      if (frame < maxFrames || particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    };

    animate();

    const doneTimeout = setTimeout(onComplete, 5000);

    return () => {
      cancelAnimationFrame(animId);
      timeouts.forEach(clearTimeout);
      clearTimeout(doneTimeout);
    };
  }, [onComplete]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />
  );
};

export default Fireworks;
