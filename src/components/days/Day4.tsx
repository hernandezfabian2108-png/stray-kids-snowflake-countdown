import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@tanstack/react-router";
import { Gift, Sparkles, X } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import {
  loadDay4Progress,
  markScratched,
  saveDay4Progress,
  type Day4Progress,
} from "./day4-data";
import { MemoryGame } from "./MemoryGame";
import { ScratchDeck } from "./ScratchDeck";

type Phase = "game" | "won" | "deck";

/**
 * Day 4: a SKZOO memory game that unlocks a deck of 30 scratch-off cards.
 * Progress is kept on this device. It never touches the radio, so music keeps playing.
 */
export function Day4() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState<Day4Progress | null>(null);
  const [phase, setPhase] = useState<Phase>("game");
  const [round, setRound] = useState(0);

  useEffect(() => {
    const saved = loadDay4Progress(window.localStorage);
    setProgress(saved);
    if (saved.won) setPhase("deck");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const save = (next: Day4Progress) => {
    setProgress(next);
    saveDay4Progress(window.localStorage, next);
  };

  const win = () => {
    if (progress && !progress.won) save({ ...progress, won: true });
    setPhase("won");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el juego del día 4"
        className="candy-button grid h-28 w-28 place-items-center"
      >
        <Gift className="h-12 w-12" strokeWidth={2.5} />
      </button>

      {hydrated &&
        open &&
        progress &&
        createPortal(
          <div
            className="letter-backdrop fixed inset-0 z-[35] flex items-start justify-center overflow-y-auto px-3 pb-6 pt-16 sm:items-center sm:px-6 sm:pt-20"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Memoria navideña"
              className="radio-modal game-modal relative w-full max-w-xl p-5 sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="radio-close absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </button>

              {phase === "game" && (
                <div key={round} className="phase-in flex flex-col items-center gap-5">
                  <h2 className="game-title">Encuentra las parejas</h2>
                  <MemoryGame onWin={win} />
                </div>
              )}

              {phase === "won" && (
                <div className="phase-in flex flex-col items-center gap-5 py-6 text-center">
                  <Sparkles className="win-sparkle h-14 w-14" strokeWidth={2} />
                  <h2 className="game-title win-title">¡Lo lograste!</h2>
                  <button
                    type="button"
                    onClick={() => setPhase("deck")}
                    className="candy-button px-8 py-3 text-lg"
                  >
                    Abrir la baraja
                  </button>
                </div>
              )}

              {phase === "deck" && (
                <div className="phase-in">
                  <ScratchDeck
                    scratched={progress.scratched}
                    onScratch={(i) => save(markScratched(progress, i))}
                    onReplay={() => {
                      setRound((r) => r + 1);
                      setPhase("game");
                    }}
                  />
                </div>
              )}
            </div>
            {phase === "won" && <Confetti />}
          </div>,
          document.body,
        )}
    </>
  );
}
