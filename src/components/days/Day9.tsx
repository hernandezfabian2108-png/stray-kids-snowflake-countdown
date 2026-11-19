import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@tanstack/react-router";
import { Mic2, X } from "lucide-react";
import stageImg from "@/assets/day9-concert-stage.png";
import { ConcertGame } from "./ConcertGame";
import { CONCIERTO_TITLE, LEVELS, type Level } from "./day9-concierto";

/** Day 9: a virtual SKZ concert, a rhythm game with three songs to choose from. */
export function Day9() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el concierto"
        className="concierto-mini grid h-28 w-28 place-items-center"
      >
        <Mic2 className="concierto-mini-icon h-12 w-12" strokeWidth={2.25} />
      </button>
      {hydrated &&
        open &&
        createPortal(<Concierto onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Concierto({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState<Level | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="concierto-scene fixed inset-0 z-[35] overflow-hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="radio-close fixed right-4 top-[4.5rem] z-40 grid h-10 w-10 place-items-center rounded-full"
      >
        <X className="h-5 w-5" strokeWidth={3} />
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={CONCIERTO_TITLE}
        className="h-full w-full px-3 pb-3 pt-[4.5rem]"
      >
        {level ? (
          <ConcertGame key={level.id} level={level} onExit={() => setLevel(null)} />
        ) : (
          <LevelSelect onPick={setLevel} />
        )}
      </div>
    </div>
  );
}

function LevelSelect({ onPick }: { onPick: (level: Level) => void }) {
  return (
    <div className="relative flex h-full flex-col items-center overflow-y-auto">
      <img
        src={stageImg}
        alt=""
        className="concierto-stage-bg concierto-stage-bg-dim"
        draggable={false}
      />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-2 px-2 py-4 text-center">
        <h2 className="concierto-title phase-in">{CONCIERTO_TITLE}</h2>
        <p className="concierto-subtitle">Elige una canción para empezar el concierto</p>
      </div>
      <ul className="relative z-10 grid w-full max-w-4xl grid-cols-1 gap-4 px-2 pb-6 sm:grid-cols-3">
        {LEVELS.map((level) => (
          <li key={level.id}>
            <button
              type="button"
              onClick={() => onPick(level)}
              className="concierto-card group flex w-full flex-col text-left"
            >
              <img
                src={level.cover}
                alt={`Portada de ${level.title}`}
                width={300}
                height={300}
                className="concierto-card-cover aspect-square w-full object-cover"
              />
              <span className="flex flex-col gap-1 p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="concierto-level-chip">Nivel {level.id}</span>
                  <span className="concierto-difficulty" data-level={level.id}>
                    {level.difficulty}
                  </span>
                </span>
                <span className="concierto-card-title">{level.title}</span>
                <span className="text-sm text-white/70">Stray Kids</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
