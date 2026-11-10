import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

const REVEAL_AT = 0.55; // share of frost removed before the card counts as read

type Props = {
  number: number;
  message: string;
  sticker: string;
  revealed: boolean;
  onReveal: () => void;
};

function token(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Paints the glittering snow layer that covers an unread card. */
function paintFrost(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const a = token("--frost-1", "white");
  const b = token("--frost-2", "lavender");
  const c = token("--frost-3", "lightblue");
  const sparkle = token("--frost-sparkle", "white");
  const gold = token("--gold", "gold");

  ctx.globalCompositeOperation = "source-over";
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, a);
  g.addColorStop(0.5, b);
  g.addColorStop(1, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // seeded random so each card's glitter pattern is stable
  let s = seed * 9301 + 49297;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = sparkle;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, 0.6 + rand() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 16; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 3 + rand() * 5;
    ctx.globalAlpha = 0.55 + rand() * 0.45;
    ctx.fillStyle = i % 3 === 0 ? gold : sparkle;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }

  // big snowflake in the middle
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = sparkle;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(3, w * 0.018);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.2;
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * R, cy + dy * R);
    for (const f of [0.5, 0.78]) {
      const px = cx + dx * R * f;
      const py = cy + dy * R * f;
      const len = R * 0.26;
      for (const side of [-1, 1]) {
        const a2 = ang + side * 0.75;
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a2) * len, py + Math.sin(a2) * len);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function ScratchCard({ number, message, sticker, revealed, onReveal }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFrost, setShowFrost] = useState(!revealed);
  const [clearing, setClearing] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const done = useRef(revealed);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    if (!showFrost) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!wrap || !canvas || !ctx) return;
    let width = 0;
    const paint = () => {
      const r = wrap.getBoundingClientRect();
      if (r.width < 1) return;
      width = r.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFrost(ctx, r.width, r.height, number);
    };
    paint();
    const ro = new ResizeObserver(() => {
      if (!done.current && Math.abs(wrap.getBoundingClientRect().width - width) > 1) paint();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [showFrost, number]);

  const ctx = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const scratch = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const c = ctx();
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    c.globalCompositeOperation = "destination-out";
    c.lineCap = "round";
    c.lineJoin = "round";
    c.lineWidth = Math.max(28, canvas.clientWidth * 0.13);
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(to.x + 0.01, to.y);
    c.stroke();
    c.globalCompositeOperation = "source-over";
    strokes.current += 1;
    if (strokes.current % 8 === 0) check();
  };

  const check = () => {
    const c = ctx();
    const canvas = canvasRef.current;
    if (!c || !canvas || done.current || canvas.width === 0) return;
    const { data } = c.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 23) {
      total++;
      if (data[i]! < 50) clear++;
    }
    if (total > 0 && clear / total >= REVEAL_AT) {
      done.current = true;
      setClearing(true);
      onRevealRef.current();
      window.setTimeout(() => setShowFrost(false), 700);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // scratching must not count as a swipe
    if (done.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointFrom(e);
    last.current = p;
    scratch(p, p);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (done.current) return;
    const p = pointFrom(e);
    // The mouse scratches just by passing over; fingers and pens scratch while touching.
    const active = e.pointerType === "mouse" || e.buttons > 0 || last.current;
    if (!active) return;
    if (last.current) scratch(last.current, p);
    last.current = p;
  };
  const onPointerEnd = () => {
    last.current = null;
    check();
  };

  return (
    <div
      ref={wrapRef}
      className="scratch-card"
      data-revealed={revealed}
      data-celebrate={clearing}
    >
      <div className="scratch-face">
        <span className="scratch-num">{number}</span>
        <p className="scratch-message">{message}</p>
        <img src={sticker} alt="" draggable={false} className="scratch-sticker" />
        {revealed && (
          <span className="scratch-badge" aria-label="Leída">
            <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
          </span>
        )}
      </div>
      {showFrost && (
        <canvas
          ref={canvasRef}
          aria-label="Raspa la nieve para descubrir el mensaje"
          className="scratch-canvas"
          data-clearing={clearing}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
        />
      )}
    </div>
  );
}
