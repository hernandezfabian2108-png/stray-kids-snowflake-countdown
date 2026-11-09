import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Snowflake, X } from "lucide-react";
import { STICKERS } from "@/lib/days";
import { BOOK_PAGES, BOOK_TITLE } from "./day3-pages";

const LEAVES = BOOK_PAGES.length + 1; // cover + pages

/** Day 3: a mini book she can leaf through, with a 3D page turn. */
export function Day3() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0); // leaf showing on the right; 0 = closed cover

  const next = useCallback(() => setPage((p) => Math.min(p + 1, LEAVES - 1)), []);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  // Taps and swipes on the book: swipe or tap the left side to go back, right side to go on.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = down.current;
    down.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      if (dx < 0) next();
      else prev();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spread = rect.width > rect.height; // two pages visible side by side
    const split = spread ? 0.5 : 0.35;
    if (page > 0 && e.clientX - rect.left < rect.width * split) prev();
    else next();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el mini libro"
        className="minibook focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <span className="minibook-title">{BOOK_TITLE}</span>
        <Snowflake className="minibook-flake" strokeWidth={1.75} />
      </button>

      {hydrated &&
        open &&
        createPortal(
          <div
            className="letter-backdrop fixed inset-0 z-[35] flex flex-col items-center justify-center gap-4 px-4 pb-4 pt-16"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar el libro"
              className="radio-close fixed right-4 top-[4.5rem] z-10 grid h-10 w-10 place-items-center rounded-full"
            >
              <X className="h-5 w-5" strokeWidth={3} />
            </button>

            <div
              role="dialog"
              aria-modal="true"
              aria-label={BOOK_TITLE}
              className="book flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="book-viewport">
                <div className="book-stage" data-open={page > 0}>
                  {Array.from({ length: LEAVES }, (_, i) => {
                    const turned = i < page;
                    const content = i === 0 ? null : BOOK_PAGES[i - 1];
                    return (
                      <div
                        key={i}
                        className="book-leaf"
                        data-turned={turned}
                        aria-hidden={i !== page}
                        style={{ zIndex: turned ? i + 1 : LEAVES - i }}
                      >
                        <div className={`book-face book-front ${i === 0 ? "book-cover" : "book-paper"}`}>
                          {content ? (
                            <div className="book-page">
                              <h3 className="book-page-title">{content.title}</h3>
                              <p className="book-page-text">{content.text}</p>
                              <span className="book-page-num">{i}</span>
                            </div>
                          ) : (
                            <div className="book-cover-frame">
                              <Snowflake className="book-cover-flake" strokeWidth={1.5} />
                              <h2 className="book-cover-title">{BOOK_TITLE}</h2>
                              <Snowflake className="book-cover-flake" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="book-face book-back book-paper">
                          <div className="book-back-art">
                            <img
                              src={STICKERS[i % STICKERS.length]}
                              alt=""
                              draggable={false}
                              className="book-back-sticker"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  aria-hidden
                  className="book-touch absolute inset-0 z-[60] cursor-pointer"
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={prev}
                  disabled={page === 0}
                  aria-label="Página anterior"
                  className="radio-close grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={3} />
                </button>
                <span className="book-counter min-w-16 text-center" aria-live="polite">
                  {page === 0 ? "" : `${page} / ${BOOK_PAGES.length}`}
                </span>
                <button
                  type="button"
                  onClick={next}
                  disabled={page === LEAVES - 1}
                  aria-label="Página siguiente"
                  className="radio-close grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
