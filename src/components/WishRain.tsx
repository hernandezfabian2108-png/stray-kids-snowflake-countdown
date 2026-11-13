import { useEffect, useRef } from "react";

const COLOR_TOKENS = ["--gold", "--glow-warm", "--flame", "--candy-pink", "--bulb-red"];

type Piece = {
  x: number;
  y: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  sway: number;
  phase: number;
  color: string;
  heart: boolean;
};

/** A soft shower of glowing hearts and golden sparkles falling over the whole screen. */
export function WishRain({
  duration = 5200,
  hearts = true,
  density = 1,
  colorTokens = COLOR_TOKENS,
}: {
  duration?: number;
  /** false = only sparkles. */
  hearts?: boolean;
  /** 1 = full shower, lower = subtler. */
  density?: number;
  colorTokens?: string[];
}) {
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
    const colors = colorTokens.map((t) => css.getPropertyValue(t).trim()).filter(Boolean);
    const count = Math.round((reduce ? 30 : Math.min(130, Math.max(70, Math.round(W / 10)))) * density);

    const pieces: Piece[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.9,
      vy: 1.4 + Math.random() * 2.6,
      size: 7 + Math.random() * 10,
      rot: (Math.random() - 0.5) * 0.6,
      spin: (Math.random() - 0.5) * 0.04,
      sway: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length] ?? "gold",
      heart: hearts && i % 2 === 0,
    }));

    const heart = (s: number) => {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
      ctx.fill();
    };
    const sparkle = (s: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
    };

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, Math.min(1, (duration - t) / 1200));
      for (const p of pieces) {
        p.phase += 0.03;
        p.y += p.vy;
        p.x += Math.sin(p.phase) * p.sway * 0.6;
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        if (p.heart) heart(p.size * 0.7);
        else {
          const twinkle = 0.65 + Math.abs(Math.sin(p.phase * 2)) * 0.5;
          sparkle(p.size * 0.7 * twinkle);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, hearts, density]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30 h-full w-full" />;
}
