import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Snowflake, X } from "lucide-react";

type Phase = "closed" | "opening" | "reading" | "opened";

/** A wax-sealed envelope that opens and unfolds an old paper letter. */
export function EnvelopeLetter({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (phase !== "reading") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("opened");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const open = () => {
    if (phase === "opening" || phase === "reading") return;
    if (phase === "opened") {
      setPhase("reading");
      return;
    }
    setPhase("opening");
    timer.current = window.setTimeout(() => setPhase("reading"), 1500);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        data-phase={phase}
        aria-label="Abrir la carta"
        className="envelope focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <span className="envelope-back" />
        <span className="envelope-paper" />
        <span className="envelope-front" />
        <span className="envelope-flap" />
        <span className="envelope-seal">
          <Snowflake className="h-1/2 w-1/2" strokeWidth={2.5} />
        </span>
      </button>

      {phase === "reading" &&
        createPortal(
          <div
            className="letter-backdrop fixed inset-0 z-[35] grid place-items-center p-4 pt-20"
            onClick={() => setPhase("opened")}
          >
            <article
              role="dialog"
              aria-modal="true"
              aria-label="Carta"
              className="letter-paper relative max-h-[calc(100svh-6.5rem)] w-full max-w-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPhase("opened")}
                aria-label="Cerrar carta"
                className="letter-close absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <Snowflake className="letter-corner left-4 top-4" strokeWidth={1.5} />
              <Snowflake className="letter-corner bottom-4 right-4" strokeWidth={1.5} />
              <div className="letter-text">{children}</div>
            </article>
          </div>,
          document.body,
        )}
    </>
  );
}
