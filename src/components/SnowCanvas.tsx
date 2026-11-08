import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  sway: number;
  phase: number;
  alpha: number;
  life?: number;
};

/**
 * Full-screen falling snow that reacts to the pointer:
 * flakes drift away from the cursor and a tap/click throws a little burst.
 */
export function SnowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const flakes: Flake[] = [];
    const bursts: Flake[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let raf = 0;

    const makeFlake = (top = false): Flake => ({
      x: Math.random() * w,
      y: top ? -10 - Math.random() * 40 : Math.random() * h,
      r: 1.2 + Math.random() * 3.4,
      vx: 0,
      vy: 0.4 + Math.random() * 1.1,
      sway: 0.3 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.55 + Math.random() * 0.45,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(220, (w * h) / 7000));
      while (flakes.length < target) flakes.push(makeFlake());
      flakes.length = target;
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = pointer.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 4.5;
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          r: 1.5 + Math.random() * 3,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1.5,
          sway: 0,
          phase: 0,
          alpha: 1,
          life: 1,
        });
      }
    };

    const drawFlake = (f: Flake, alpha: number) => {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.2);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(0.45, `rgba(255,255,255,${alpha * 0.7})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    };

    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const R = 130;

      for (const f of flakes) {
        if (pointer.active) {
          const dx = f.x - pointer.x;
          const dy = f.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / R) * 1.6;
            f.vx += (dx / d) * force;
            f.vy += (dy / d) * force * 0.6;
          }
        }
        f.vx *= 0.94;
        f.vy += ((0.4 + f.r * 0.22) - f.vy) * 0.03;
        f.x += f.vx + Math.sin(t * f.sway + f.phase) * 0.45;
        f.y += f.vy;

        if (f.y > h + 12 || f.x < -30 || f.x > w + 30) Object.assign(f, makeFlake(true));
        drawFlake(f, f.alpha);
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        if (!b) continue;
        b.vx *= 0.96;
        b.vy = b.vy * 0.96 + 0.08;
        b.x += b.vx;
        b.y += b.vy;
        b.life = (b.life ?? 1) - 0.014;
        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        drawFlake(b, b.life);
      }

      if (pointer.active) {
        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 46);
        glow.addColorStop(0, "rgba(255,255,255,0.35)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 46, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-40" />;
}
