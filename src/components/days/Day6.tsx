import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated, useNavigate } from "@tanstack/react-router";
import { Sparkle, Telescope, X } from "lucide-react";
import { WishRain } from "@/components/WishRain";
import { playSparkle, unlockCandleSound } from "@/lib/candle-sound";
import { COMPLETED_EVENT, loadCompletedDays, markDayCompleted } from "@/lib/completed-days";
import {
  CONSTELLATION,
  counterLabel,
  isInLens,
  loadCaught,
  OBS_INTRO,
  OBS_LETTER,
  OBS_START,
  OBS_TITLE,
  saveCaught,
  STAR_GOAL,
  WISHES,
  type Point,
} from "./day6-observatorio";

/* Fixed star field in three depths so the sky looks the same every visit. */
const LAYERS = [
  { count: 70, size: 1, speed: 5.5, depth: 4 },
  { count: 38, size: 2, speed: 4, depth: 10 },
  { count: 14, size: 3, speed: 3, depth: 18 },
].map((l, li) => ({
  ...l,
  stars: Array.from({ length: l.count }, (_, i) => ({
    left: (i * 37.7 + li * 13.1) % 100,
    top: (i * 53.3 + (i % 7) * 11 + li * 29) % 100,
    delay: ((i * 0.61 + li) % l.speed).toFixed(2),
  })),
}));

/* Faint decorative constellations in the background (percent coordinates). */
const BG_CONSTELLATIONS: Point[][] = [
  [{ x: 8, y: 22 }, { x: 14, y: 14 }, { x: 21, y: 18 }, { x: 25, y: 9 }],
  [{ x: 76, y: 16 }, { x: 83, y: 24 }, { x: 90, y: 19 }, { x: 87, y: 33 }, { x: 80, y: 30 }],
  [{ x: 10, y: 72 }, { x: 17, y: 80 }, { x: 24, y: 76 }],
  [{ x: 80, y: 70 }, { x: 86, y: 63 }, { x: 93, y: 74 }],
];

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

type Phase = "intro" | "sky" | "wish" | "finale";

type Shooter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  alpha: number;
  caught: boolean;
};
type Dust = { x: number; y: number; vx: number; vy: number; life: number };

/** Day 6: catch five shooting stars with the telescope to read five wishes, then a letter. */
export function Day6() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el Observatorio de los Deseos"
        className="obs-mini grid h-28 w-28 place-items-center"
      >
        <Telescope className="obs-mini-icon h-12 w-12" strokeWidth={2} />
      </button>
      {hydrated && open && createPortal(<Observatory onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Observatory({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [caught, setCaught] = useState(() => loadCaught(window.localStorage));
  const [phase, setPhase] = useState<Phase>(() => (loadCaught(window.localStorage) >= STAR_GOAL ? "finale" : "intro"));
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState<(Point & { key: number }) | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [letter, setLetter] = useState(() => loadCaught(window.localStorage) >= STAR_GOAL);
  const [done, setDone] = useState(() => loadCompletedDays(window.localStorage).includes(6));
  const [rains, setRains] = useState(0);

  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  const caughtRef = useRef(caught);
  const lens = useRef<Point>({ x: 0, y: 0 });
  const pressing = useRef(false);
  const stars = useRef<Shooter[]>([]);
  const timers = useRef<number[]>([]);
  phaseRef.current = phase;
  caughtRef.current = caught;

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Escape closes the open wish first, then the observatory.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (reading !== null) setReading(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, reading]);

  const lensRadius = () => (lensRef.current?.offsetWidth ?? 120) / 2;

  const placeLens = (p: Point) => {
    lens.current = p;
    const el = lensRef.current;
    if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    const scene = sceneRef.current;
    if (scene) {
      scene.style.setProperty("--px", ((p.x / window.innerWidth) * 2 - 1).toFixed(3));
      scene.style.setProperty("--py", ((p.y / window.innerHeight) * 2 - 1).toFixed(3));
    }
  };

  const capture = useCallback((star: Shooter) => {
    if (phaseRef.current !== "sky") return;
    star.caught = true;
    phaseRef.current = "wish";
    const next = Math.min(STAR_GOAL, caughtRef.current + 1);
    caughtRef.current = next;
    setCaught(next);
    saveCaught(window.localStorage, next);
    setFlash({ x: star.x, y: star.y, key: Date.now() });
    setPhase("wish");
    playSparkle();
    later(() => setReading(next - 1), 650);
  }, []);

  /** Try to catch the star under the lens (or any visible one, for the keyboard). */
  const tryCatch = (anywhere = false) => {
    if (phaseRef.current !== "sky") return;
    const r = lensRadius() * (anywhere ? 99 : 1) + 8;
    const hit = stars.current.find((s) => !s.caught && s.alpha > 0.4 && isInLens(lens.current, s, r));
    if (hit) capture(hit);
  };

  // Shooting stars, their golden trails and dust, drawn on one canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
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
    const gold = css.getPropertyValue("--glow-warm").trim() || "gold";
    const core = css.getPropertyValue("--snow").trim() || "white";
    const dust: Dust[] = [];
    let nextSpawn = 900;
    let last = performance.now();
    let frame = 0;

    const spawn = () => {
      const fromLeft = Math.random() < 0.5;
      const fromTop = Math.random() < 0.6;
      const x = fromTop ? W * (fromLeft ? 0.05 + Math.random() * 0.45 : 0.5 + Math.random() * 0.45) : fromLeft ? -30 : W + 30;
      const y = fromTop ? -30 : H * (0.12 + Math.random() * 0.4);
      const angle = 0.25 + Math.random() * 0.45; // radians below horizontal
      const crossing = (reduce ? 6 : 3.4) + Math.random() * 1.4; // seconds to cross the screen
      const speed = Math.hypot(W, H) / crossing;
      stars.current.push({
        x,
        y,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (fromTop ? speed * 0.25 : 0),
        len: 110 + Math.random() * 90,
        alpha: 0,
        caught: false,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      const ph = phaseRef.current;
      const moving = ph === "sky";

      if (moving) {
        nextSpawn -= dt * 1000;
        if (nextSpawn <= 0 && stars.current.filter((s) => !s.caught).length < 2) {
          spawn();
          nextSpawn = 2300 + Math.random() * 1500;
        }
      } else {
        nextSpawn = Math.max(nextSpawn, 900);
      }

      ctx.clearRect(0, 0, W, H);
      stars.current = stars.current.filter((s) => {
        if (s.caught) return false;
        if (moving) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.alpha = Math.min(1, s.alpha + dt * 3);
          if (Math.random() < 0.6) {
            dust.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.2) * 30, life: 1 });
          }
        } else {
          s.alpha -= dt * 2.5;
        }
        return s.alpha > 0 && s.x > -260 && s.x < W + 260 && s.y < H + 260;
      });

      for (const s of stars.current) {
        const v = Math.hypot(s.vx, s.vy) || 1;
        const ux = -s.vx / v;
        const uy = -s.vy / v;
        const segments = 14;
        ctx.lineCap = "round";
        ctx.strokeStyle = gold;
        for (let i = 0; i < segments; i++) {
          const a = i / segments;
          const b = (i + 1) / segments;
          ctx.globalAlpha = s.alpha * (1 - a) * 0.9;
          ctx.lineWidth = 3.2 * (1 - a) + 0.4;
          ctx.beginPath();
          ctx.moveTo(s.x + ux * s.len * a, s.y + uy * s.len * a);
          ctx.lineTo(s.x + ux * s.len * b, s.y + uy * s.len * b);
          ctx.stroke();
        }
        ctx.globalAlpha = s.alpha;
        ctx.shadowColor = gold;
        ctx.shadowBlur = 22;
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i]!;
        d.life -= dt * 1.6;
        if (d.life <= 0) {
          dust.splice(i, 1);
          continue;
        }
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        ctx.globalAlpha = d.life * 0.8;
        ctx.fillStyle = gold;
        ctx.fillRect(d.x, d.y, 1.6, 1.6);
      }
      if (dust.length > 160) dust.splice(0, dust.length - 160);
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Start with the lens in the middle of the sky.
  useEffect(() => {
    if (phase === "sky") placeLens({ x: window.innerWidth / 2, y: window.innerHeight * 0.55 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "sky" || phase === "wish"]);

  useEffect(() => {
    if (!letter) return;
    const t = window.setTimeout(() => letterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return () => window.clearTimeout(t);
  }, [letter]);

  const start = () => {
    unlockCandleSound();
    setLeaving(true);
    later(() => {
      setLeaving(false);
      setPhase("sky");
    }, 550);
  };

  const continueSky = () => {
    setReading(null);
    setFlash(null);
    if (caughtRef.current >= STAR_GOAL) {
      setPhase("finale");
      later(() => setLetter(true), 2600);
    } else {
      setPhase("sky");
    }
  };

  const complete = () => {
    unlockCandleSound();
    playSparkle();
    markDayCompleted(window.localStorage, 6);
    window.dispatchEvent(new Event(COMPLETED_EVENT));
    setDone(true);
    setRains((n) => n + 1);
    later(() => navigate({ to: "/puertas" }), 2600);
  };

  const skyActive = phase === "sky" || phase === "wish";
  const wish = reading !== null ? WISHES[reading] : undefined;

  return (
    <div
      ref={sceneRef}
      className="obs-scene fixed inset-0 z-[35] overflow-y-auto overflow-x-hidden"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={OBS_TITLE}
    >
      {/* Deep sky: nebulas, three layers of stars, faint golden constellations */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="obs-nebula obs-nebula-1" />
        <span className="obs-nebula obs-nebula-2" />
        <span className="obs-nebula obs-nebula-3" />
        {LAYERS.map((l, li) => (
          <div key={li} className="obs-layer" style={{ "--depth": `${l.depth}px` } as React.CSSProperties}>
            {l.stars.map((s, i) => (
              <span
                key={i}
                className="obs-star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: l.size,
                  height: l.size,
                  animationDuration: `${l.speed}s`,
                  animationDelay: `-${s.delay}s`,
                }}
              />
            ))}
          </div>
        ))}
        <svg className="obs-bg-lines absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {BG_CONSTELLATIONS.map((pts, i) => (
            <polyline
              key={i}
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {BG_CONSTELLATIONS.flat().map((p, i) => (
          <span key={i} className="obs-bg-dot" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${(i % 5) * 0.7}s` }} />
        ))}
      </div>

      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" />

      {/* Glass dome frame in aged bronze and gold */}
      <svg aria-hidden className="obs-dome pointer-events-none fixed inset-0 z-[5] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="obs-bronze" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--bronze-light)" />
            <stop offset="50%" stopColor="var(--bronze)" />
            <stop offset="100%" stopColor="var(--bronze-light)" />
          </linearGradient>
        </defs>
        <path className="obs-dome-corner" d="M0,0 L100,0 L100,26 C100,9 80,2.5 50,2.5 C20,2.5 0,9 0,26 Z" />
        <path className="obs-dome-rib" d="M50,2.5 C34,20 26,55 22,100" />
        <path className="obs-dome-rib" d="M50,2.5 C66,20 74,55 78,100" />
        <path className="obs-dome-rib" d="M50,2.5 L50,100" />
        <path className="obs-dome-ring" d="M0,58 C25,52 75,52 100,58" />
        <path className="obs-dome-arch" d="M1,100 L1,26 C1,10 20,3.5 50,3.5 C80,3.5 99,10 99,26 L99,100" stroke="url(#obs-bronze)" />
        <path className="obs-dome-arch-thin" d="M2.4,100 L2.4,27 C2.4,12 21,5.5 50,5.5 C79,5.5 97.6,12 97.6,27 L97.6,100" />
      </svg>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="obs-close fixed right-4 top-[4.5rem] z-30 grid h-10 w-10 place-items-center rounded-full"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {skyActive && (
        <div className="obs-counter fixed left-1/2 top-[4.6rem] z-20 -translate-x-1/2" aria-live="polite">
          <span>{counterLabel(caught)}</span>
          <span className="flex gap-1.5" aria-hidden>
            {WISHES.map((_, i) => (
              <span key={i} className="obs-counter-dot" data-on={i < caught} />
            ))}
          </span>
        </div>
      )}

      {/* The sky you aim the telescope at */}
      {skyActive && (
        <div
          className="obs-aim fixed inset-0 z-[8]"
          data-active={phase === "sky"}
          tabIndex={0}
          aria-label="Cielo: apunta el telescopio a una estrella fugaz y tócala"
          onPointerMove={(e) => {
            placeLens({ x: e.clientX, y: e.clientY });
            if (pressing.current && e.pointerType !== "mouse") tryCatch();
          }}
          onPointerDown={(e) => {
            unlockCandleSound();
            pressing.current = true;
            placeLens({ x: e.clientX, y: e.clientY });
            tryCatch();
          }}
          onPointerUp={() => (pressing.current = false)}
          onPointerCancel={() => (pressing.current = false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tryCatch(true);
            }
          }}
        />
      )}

      {skyActive && (
        <div ref={lensRef} aria-hidden className="obs-lens pointer-events-none fixed left-0 top-0 z-[9]">
          <div className="obs-lens-glass" />
          <svg className="obs-lens-ring" viewBox="-60 -60 120 120">
            <circle r="57" className="obs-lens-outer" />
            <g className="obs-lens-ticks">
              {TICKS.map((a) => (
                <line key={a} x1="0" y1="-57" x2="0" y2={a % 45 === 0 ? -48 : a % 15 === 0 ? -51 : -54} transform={`rotate(${a})`} />
              ))}
            </g>
            {[0, 90, 180, 270].map((a) => (
              <text key={a} transform={`rotate(${a}) translate(0 -42)`} textAnchor="middle" dominantBaseline="middle">
                {a}°
              </text>
            ))}
          </svg>
          <svg className="obs-lens-cross" viewBox="-60 -60 120 120">
            <circle r="34" />
            <line x1="-30" y1="0" x2="-8" y2="0" />
            <line x1="8" y1="0" x2="30" y2="0" />
            <line x1="0" y1="-30" x2="0" y2="-8" />
            <line x1="0" y1="8" x2="0" y2="30" />
            <circle r="1.6" className="obs-lens-dot" />
          </svg>
        </div>
      )}

      {flash && (
        <span key={flash.key} aria-hidden className="obs-flash pointer-events-none fixed z-[10]" style={{ left: flash.x, top: flash.y }}>
          <span className="obs-flash-ring" />
          <Sparkle className="obs-flash-star" strokeWidth={0} fill="currentColor" />
        </span>
      )}

      {/* Intro card */}
      {phase === "intro" && (
        <div className="relative z-10 grid min-h-full place-items-center px-4 pb-12 pt-24">
          <div className="obs-card obs-intro w-full max-w-lg text-center" data-leaving={leaving}>
            <Telescope className="obs-intro-icon mx-auto h-9 w-9" strokeWidth={1.75} />
            <h2 className="obs-title mt-3">{OBS_TITLE}</h2>
            <p className="obs-body mt-4">{OBS_INTRO}</p>
            <button type="button" onClick={start} className="obs-button mt-7" disabled={leaving}>
              {OBS_START}
            </button>
          </div>
        </div>
      )}

      {/* Finale: the constellation, the letter, the five wishes again */}
      {phase === "finale" && (
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col items-center px-4 pb-16 pt-24">
          <svg className="obs-constellation w-[min(92vw,560px)]" viewBox="0 0 320 200" aria-hidden>
            <polyline
              points={CONSTELLATION.map((p) => `${p.x},${p.y}`).join(" ")}
              pathLength={1}
              className="obs-constellation-line"
            />
            {CONSTELLATION.map((p, i) => (
              <g key={i} className="obs-constellation-star" style={{ "--i": i } as React.CSSProperties} transform={`translate(${p.x} ${p.y})`}>
                <circle r="9" className="obs-constellation-halo" />
                <path d="M0,-7 Q0,0 7,0 Q0,0 0,7 Q0,0 -7,0 Q0,0 0,-7 Z" />
              </g>
            ))}
          </svg>

          {letter && (
            <div ref={letterRef} className="obs-card obs-letter mt-6 w-full max-w-xl scroll-mt-24">
              <p className="obs-letter-text">{OBS_LETTER}</p>

              <div className="obs-menu mt-8">
                {WISHES.map((w, i) => (
                  <button key={w.title} type="button" onClick={() => setReading(i)} className="obs-chip" aria-label={`Volver a leer: ${w.title}`}>
                    <Sparkle className="h-3.5 w-3.5" strokeWidth={0} fill="currentColor" />
                    <span>{w.title}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button type="button" onClick={complete} className="obs-button" data-done={done}>
                  {done ? "Día 6 completado" : "Completar el Día 6"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A wish, floating over the paused sky */}
      {wish && reading !== null && (
        <div
          className="obs-wish-backdrop fixed inset-0 z-[25] grid place-items-center overflow-y-auto p-4 pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget && phase === "finale") setReading(null);
          }}
        >
          <article key={reading} className="obs-card obs-wish w-full max-w-md text-center" aria-live="polite">
            <p className="obs-wish-label">
              <Sparkle className="h-4 w-4" strokeWidth={0} fill="currentColor" />
              {wish.label}
            </p>
            <h3 className="obs-wish-title mt-2">{wish.title}</h3>
            <p className="obs-body mt-4">{wish.text}</p>
            <button type="button" onClick={phase === "finale" ? () => setReading(null) : continueSky} className="obs-button mt-6" autoFocus>
              {phase === "finale" ? "Cerrar" : "Continuar"}
            </button>
          </article>
        </div>
      )}

      {rains > 0 && <WishRain key={rains} hearts={false} density={0.5} duration={4000} colorTokens={["--gold", "--glow-warm", "--snow"]} />}
    </div>
  );
}
