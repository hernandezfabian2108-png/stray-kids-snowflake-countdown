import { useEffect, useRef, useState } from "react";
import { Snowflake } from "lucide-react";
import { createMemoryDeck, MEMORY_FACES } from "./day4-data";

/** 8 cards, 4 SKZOO pairs. Calls onWin once every pair is found. */
export function MemoryGame({ onWin }: { onWin: () => void }) {
  const [cards] = useState(() => createMemoryDeck(MEMORY_FACES.length));
  const [flipped, setFlipped] = useState<number[]>([]); // board positions face up, not yet matched
  const [matched, setMatched] = useState<number[]>([]); // faces already paired
  const [shake, setShake] = useState<number[]>([]);
  const locked = useRef(false);
  const timers = useRef<number[]>([]);
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    if (matched.length !== MEMORY_FACES.length) return;
    const t = window.setTimeout(() => onWinRef.current(), 750);
    return () => window.clearTimeout(t);
  }, [matched]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const flip = (pos: number) => {
    const card = cards[pos];
    if (!card || locked.current || flipped.includes(pos) || matched.includes(card.face)) return;
    const next = [...flipped, pos];
    setFlipped(next);
    if (next.length < 2) return;

    locked.current = true;
    const [a, b] = next as [number, number];
    if (cards[a]!.face === cards[b]!.face) {
      later(() => {
        setMatched((m) => [...m, card.face]);
        setFlipped([]);
        locked.current = false;
      }, 420);
    } else {
      later(() => setShake([a, b]), 650);
      later(() => {
        setFlipped([]);
        setShake([]);
        locked.current = false;
      }, 1050);
    }
  };

  return (
    <div className="memory-board" role="grid" aria-label="Tablero de memoria">
      {cards.map((card, pos) => {
        const isMatched = matched.includes(card.face);
        const faceUp = isMatched || flipped.includes(pos);
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => flip(pos)}
            aria-label={faceUp ? "Carta descubierta" : `Voltear carta ${pos + 1}`}
            disabled={isMatched}
            data-flipped={faceUp}
            data-matched={isMatched}
            data-shake={shake.includes(pos)}
            className="memory-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
            style={{ "--i": pos } as React.CSSProperties}
          >
            <span className="memory-inner">
              <span className="memory-side memory-back">
                <Snowflake className="memory-back-flake" strokeWidth={2} />
              </span>
              <span className="memory-side memory-face">
                <img src={MEMORY_FACES[card.face]} alt="" draggable={false} className="memory-img" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
