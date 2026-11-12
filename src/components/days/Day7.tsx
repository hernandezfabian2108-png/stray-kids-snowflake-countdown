import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@tanstack/react-router";
import { Flame, X } from "lucide-react";
import { WishRain } from "@/components/WishRain";
import { playIgnite, playSparkle, playStrike, unlockCandleSound } from "@/lib/candle-sound";
import {
  canLightCandle,
  VELITAS_BUTTON,
  VELITAS_LETTER,
  VELITAS_SIGN,
  VELITAS_SUBTITLE,
  VELITAS_TITLE,
  VELITAS_TITLE_EMOJI,
  type Point,
} from "./day7-velitas";

/* Fixed (not random) so the sky looks the same on every visit. */
const STARS = Array.from({ length: 70 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 53.3 + (i % 7) * 11) % 100,
  size: 1 + ((i * 7) % 3),
  delay: (i * 0.37) % 4,
}));
const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 41.3 + 7) % 100,
  delay: (i * 0.9) % 12,
  duration: 9 + ((i * 5) % 7),
  size: 3 + (i % 4),
}));
const SPARKS = Array.from({ length: 14 }, (_, i) => i * (360 / 14));

const center = (r: DOMRect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const inside = (p: Point, r: DOMRect) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

/**
 * Day 7, Noche de las Velitas: strike the match, bring it to the wick,
 * the candle lights up the night and a letter unfolds. Never touches the radio.
 */
export function Day7() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir la Noche de las Velitas"
        className="velitas-mini grid h-28 w-28 place-items-center"
      >
        <Flame className="velitas-mini-flame h-12 w-12" strokeWidth={2.25} />
      </button>

      {hydrated && open && createPortal(<CandleNight onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function CandleNight({ onClose }: { onClose: () => void }) {
  const [matchLit, setMatchLit] = useState(false);
  const [matchSpent, setMatchSpent] = useState(false);
  const [candleLit, setCandleLit] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [rains, setRains] = useState(0);

  const headRef = useRef<HTMLSpanElement>(null);
  const wickRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const litRef = useRef(false);
  const candleRef = useRef(false);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    if (!showLetter) return;
    const t = window.setTimeout(
      () => letterRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      350,
    );
    return () => window.clearTimeout(t);
  }, [showLetter]);

  const strike = () => {
    if (litRef.current || matchSpent) return;
    litRef.current = true;
    setMatchLit(true);
    playStrike();
  };

  const lightCandle = () => {
    if (candleRef.current) return;
    candleRef.current = true;
    setCandleLit(true);
    playIgnite();
    later(() => {
      litRef.current = false;
      setMatchLit(false);
      setMatchSpent(true);
      setOffset({ x: 0, y: 0 });
    }, 700);
    later(() => setShowLetter(true), 1300);
  };

  const check = () => {
    const head = headRef.current?.getBoundingClientRect();
    const wick = wickRef.current?.getBoundingClientRect();
    const box = boxRef.current?.getBoundingClientRect();
    if (!head || !wick) return;
    const h = center(head);
    if (!litRef.current && box && inside(h, box)) strike();
    if (!candleRef.current && canLightCandle(litRef.current, h, center(wick))) lightCandle();
  };

  /** Glide the burning match to the wick (for a simple tap or the keyboard). */
  const carry = () => {
    const head = headRef.current?.getBoundingClientRect();
    const wick = wickRef.current?.getBoundingClientRect();
    if (!head || !wick || candleRef.current) return;
    const h = center(head);
    const w = center(wick);
    setOffset((o) => ({ x: o.x + w.x - h.x + 4, y: o.y + w.y - h.y + 2 }));
    later(lightCandle, 650);
  };

  const onMatchTap = () => {
    unlockCandleSound();
    if (matchSpent || candleRef.current) return;
    if (!litRef.current) strike();
    else carry();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (matchSpent || candleRef.current) return;
    unlockCandleSound();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    setOffset({ x: d.ox + dx, y: d.oy + dy });
    requestAnimationFrame(check);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setDragging(false);
    if (!d.moved) return onMatchTap();
    if (!candleRef.current) setOffset({ x: 0, y: 0 });
  };

  const saveWish = () => {
    unlockCandleSound();
    playSparkle();
    setRains((n) => n + 1);
  };

  return (
    <div
      className="velitas-scene fixed inset-0 z-[35] overflow-y-auto overflow-x-hidden"
      data-lit={candleLit}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden className="velitas-sky pointer-events-none fixed inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="velitas-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        {EMBERS.map((s, i) => (
          <span
            key={i}
            className="velitas-ember"
            style={{
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div aria-hidden className="velitas-warmth pointer-events-none fixed inset-0" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="radio-close fixed right-4 top-[4.5rem] z-20 grid h-10 w-10 place-items-center rounded-full"
      >
        <X className="h-5 w-5" strokeWidth={3} />
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Noche de las Velitas"
        className="relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col items-center px-4 pb-16 pt-20 sm:pt-24"
      >
        <header className="phase-in px-12 text-center sm:px-0">
          <h2 className="velitas-title">
            {VELITAS_TITLE.replace(VELITAS_TITLE_EMOJI, "").trim()}{" "}
            <span className="velitas-title-emoji">{VELITAS_TITLE_EMOJI}</span>
          </h2>
          <p className="velitas-subtitle mt-2">{VELITAS_SUBTITLE}</p>
        </header>

        <div className="velitas-stage relative mt-6 sm:mt-8" data-lit={candleLit}>
          <div aria-hidden className="velitas-glow" />

          {/* Candle on its plate */}
          <button
            type="button"
            className="candle"
            aria-label={candleLit ? "Vela encendida" : "Vela apagada"}
            onClick={() => {
              unlockCandleSound();
              if (litRef.current) carry();
            }}
          >
            <span className="candle-flame-wrap" aria-hidden>
              {candleLit && (
                <>
                  <span className="candle-halo" />
                  <span className="candle-flame" />
                  <span className="candle-core" />
                  {SPARKS.map((a) => (
                    <span key={a} className="ignite-spark" style={{ "--a": `${a}deg` } as React.CSSProperties} />
                  ))}
                </>
              )}
            </span>
            <span ref={wickRef} className="candle-wick" data-hint={matchLit && !candleLit} aria-hidden />
            <span className="candle-body" aria-hidden>
              <span className="candle-drip candle-drip-1" />
              <span className="candle-drip candle-drip-2" />
              <span className="candle-ribbon" />
            </span>
            <span className="candle-plate" aria-hidden />
          </button>

          {/* Matchbox with its striker */}
          <div ref={boxRef} className="matchbox" aria-hidden>
            <span className="matchbox-label">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="matchbox-striker" />
          </div>

          {/* The match */}
          <button
            type="button"
            aria-label={
              matchSpent ? "Fósforo usado" : matchLit ? "Acercar el fósforo a la mecha" : "Encender el fósforo"
            }
            disabled={matchSpent}
            className="match"
            data-lit={matchLit}
            data-spent={matchSpent}
            data-dragging={dragging}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(-24deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMatchTap();
              }
            }}
          >
            <span ref={headRef} className="match-head" aria-hidden>
              {matchLit && <span className="match-flame" />}
              {!matchLit && !matchSpent && <span className="match-hint" />}
              {matchSpent && <span className="match-smoke" />}
            </span>
            <span className="match-stick" aria-hidden />
          </button>
        </div>

        {showLetter && (
          <div ref={letterRef} className="velitas-letter relative mt-10 w-full max-w-xl">
            <div className="velitas-letter-text">
              {VELITAS_LETTER.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <p className="velitas-sign">{VELITAS_SIGN}</p>
            </div>
            <div className="mt-7 flex justify-center">
              <button type="button" onClick={saveWish} className="wish-button" data-saved={rains > 0}>
                <span>{VELITAS_BUTTON}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {rains > 0 && <WishRain key={rains} />}
    </div>
  );
}
