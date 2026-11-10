import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { STICKERS } from "@/lib/days";
import { SCRATCH_MESSAGES } from "./day4-data";
import { ScratchCard } from "./ScratchCard";

const TOTAL = SCRATCH_MESSAGES.length;

type Props = {
  scratched: number[];
  onScratch: (index: number) => void;
  onReplay: () => void;
};

/** The album of 30 scratch-off cards, browsed one at a time. */
export function ScratchDeck({ scratched, onScratch, onReplay }: Props) {
  const [index, setIndex] = useState(() => {
    const firstUnread = SCRATCH_MESSAGES.findIndex((_, i) => !scratched.includes(i));
    return firstUnread === -1 ? 0 : firstUnread;
  });
  const [dir, setDir] = useState<1 | -1>(1);

  const go = (to: number) => {
    if (to < 0 || to >= TOTAL) return;
    setDir(to >= index ? 1 : -1);
    setIndex(to);
  };
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goRef.current(index + 1);
      if (e.key === "ArrowLeft") goRef.current(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // Swipe sideways to change card (scratching on the frost doesn't count).
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(index + (dx < 0 ? 1 : -1));
  };

  const revealed = scratched.includes(index);

  return (
    <div className="deck flex flex-col items-center gap-3">
      <div className="deck-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div key={index} className="deck-slide" data-dir={dir}>
          <ScratchCard
            number={index + 1}
            message={SCRATCH_MESSAGES[index]!}
            sticker={STICKERS[index % STICKERS.length]!}
            revealed={revealed}
            onReveal={() => onScratch(index)}
          />
        </div>
      </div>

      <p className="deck-hint" data-hidden={revealed} aria-hidden={revealed}>
        Raspa la nieve
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Tarjeta anterior"
          className="radio-close grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={3} />
        </button>
        <span className="deck-counter min-w-16 text-center" aria-live="polite">
          {index + 1} / {TOTAL}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === TOTAL - 1}
          aria-label="Tarjeta siguiente"
          className="radio-close grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>

      <div className="deck-dots" role="tablist" aria-label="Tus tarjetas">
        {SCRATCH_MESSAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Tarjeta ${i + 1}${scratched.includes(i) ? ", leída" : ""}`}
            onClick={() => go(i)}
            data-read={scratched.includes(i)}
            data-current={i === index}
            className="deck-dot"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onReplay}
        aria-label="Jugar memoria otra vez"
        className="deck-replay grid h-9 w-9 place-items-center rounded-full"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
