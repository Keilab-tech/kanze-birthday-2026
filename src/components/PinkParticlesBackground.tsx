import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: "circle" | "heart" | "sparkle";
  life: number;
  maxLife: number;
  hue: number;
}

const PinkParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    const maxParticles = 40;

    const spawnParticle = (): Particle => {
      const type = Math.random() < 0.15 ? "heart" : Math.random() < 0.3 ? "sparkle" : "circle";
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.8 + 0.3),
        size: type === "heart" ? 8 + Math.random() * 6 : Math.random() * 3 + 1,
        alpha: 0,
        type,
        life: 0,
        maxLife: 300 + Math.random() * 200,
        hue: 340 + Math.random() * 30 - 15,
      };
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const s = size / 10;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 3);
      ctx.bezierCurveTo(x, y, x - s * 5, y, x - s * 5, y + s * 3);
      ctx.bezierCurveTo(x - s * 5, y + s * 6, x, y + s * 9, x, y + s * 10);
      ctx.bezierCurveTo(x, y + s * 9, x + s * 5, y + s * 6, x + s * 5, y + s * 3);
      ctx.bezierCurveTo(x + s * 5, y, x, y, x, y + s * 3);
      ctx.closePath();
      ctx.fill();
    };

    const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.stroke();
      }
    };

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles.length < maxParticles && Math.random() < 0.1) {
        particles.push(spawnParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(p.life * 0.02) * 0.3;
        p.y += p.vy;
        p.life++;

        const fadeIn = Math.min(p.life / 30, 1);
        const fadeOut = Math.max(0, 1 - (p.life - p.maxLife + 60) / 60);
        p.alpha = fadeIn * fadeOut * 0.5;

        if (p.life > p.maxLife || p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === "heart") {
          ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, 1)`;
          drawHeart(ctx, p.x, p.y, p.size);
        } else if (p.type === "sparkle") {
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 80%, 1)`;
          ctx.lineWidth = 0.5;
          drawSparkle(ctx, p.x, p.y, p.size * 2);
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 60%, 80%, 1)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default PinkParticlesBackground;
