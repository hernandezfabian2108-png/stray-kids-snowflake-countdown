import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated, useNavigate } from "@tanstack/react-router";
import { Radio as RadioIcon, X } from "lucide-react";
import { RetroPlayer } from "@/components/radio/RetroPlayer";
import { useRadio } from "@/components/radio/RadioProvider";

export function Day2() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { setFullOpen } = useRadio();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setFullOpen(open);
    return () => setFullOpen(false);
  }, [open, setFullOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Closing day 2 goes back to the doors; the music keeps playing in the small radio.
  function close() {
    setOpen(false);
    navigate({ to: "/puertas" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir Radio SKZ"
        className="candy-button grid h-28 w-28 place-items-center"
      >
        <RadioIcon className="h-12 w-12" strokeWidth={2.5} />
      </button>

      {hydrated &&
        open &&
        createPortal(
          <div
            className="letter-backdrop fixed inset-0 z-[46] grid place-items-center p-3 pt-16 sm:p-6 sm:pt-20"
            onClick={close}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Radio SKZ"
              className="radio-modal relative max-h-[calc(100svh-5rem)] w-full max-w-4xl overflow-y-auto p-5 sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="radio-close absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </button>

              <div className="grid items-center gap-12 md:grid-cols-[1fr_1.05fr] md:gap-6">
                <section className="radio-note p-5 sm:p-6">
                  <h2 className="radio-note-title">¡Encendemos los motores del mes! 🎶</h2>
                  <p className="mt-3 leading-relaxed">
                    Para que no navegues por este calendario en silencio, hoy te entrego tu propia
                    Radio SKZ. Aquí tienes una selección especial de canciones para ponernos en
                    ambiente navideño y acompañarte cada día. Puedes darle Play, cambiar de canción
                    y dejarla sonando de fondo mientras exploras la página hoy o los próximos días.
                  </p>
                </section>
                <RetroPlayer />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
