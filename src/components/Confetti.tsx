import { useEffect, useRef } from "react";

const COLOR_TOKENS = ["--bulb-red", "--bulb-gold", "--bulb-green", "--bulb-blue", "--bulb-pink", "--snow"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  wobble: number;
  color: string;
  shape: 0 | 1 | 2; // ribbon, dot, sparkle
};

/** One celebratory burst of confetti from both bottom corners. Runs once on mount. */
export function Confetti({ duration = 4200 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const css = getComputedStyle(document.documentElement);
    const colors = COLOR_TOKENS.map((t) => css.getPropertyValue(t).trim()).filter(Boolean);
    const count = reduce ? 40 : Math.min(240, Math.max(120, Math.round(W / 5)));
    const power = Math.max(13, Math.min(22, H / 38));

    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      const left = i % 2 === 0;
      const angle = ((left ? -62 : -118) * Math.PI) / 180 + (Math.random() - 0.5) * 0.7;
      const speed = power * (0.55 + Math.random() * 0.6);
      return {
        x: left ? -10 : W + 10,
        y: H * (0.8 + Math.random() * 0.15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * Math.PI * 2,
        color: colors[i % colors.length] ?? "gold",
        shape: (i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0) as Piece["shape"],
      };
    });

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, Math.min(1, (duration - t) / 900));
      for (const p of pieces) {
        p.vy += 0.32;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.wobble += 0.12;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.wobble)) + 1);
        } else if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const s = p.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        }
        ctx.restore();
      }
      if (t < duration) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-20 h-full w-full" />;
}
