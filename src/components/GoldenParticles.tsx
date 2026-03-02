import { useEffect, useRef } from "react";

const GoldenParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; life: number; maxLife: number;
    }[] = [];

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy - 40,
        vx: Math.cos(angle) * speed * 0.5,
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: 1,
        life: 0,
        maxLife: 80 + Math.random() * 60,
      });
    }

    let frame = 0;
    const animate = () => {
      if (frame > 160) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.01;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.fillStyle = `hsl(40, 70%, ${60 + Math.random() * 20}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

export default GoldenParticles;
