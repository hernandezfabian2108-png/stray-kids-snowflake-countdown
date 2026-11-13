import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Star, Ticket, X } from "lucide-react";
import { WishRain } from "@/components/WishRain";
import { playDescend, playFanfare, playGrab, playPrize, unlockArcadeSound } from "@/lib/arcade-sound";
import { COMPLETED_EVENT, markDayCompleted } from "@/lib/completed-days";
import {
  CHUTE_X,
  CLAW_DROP,
  CLAW_SUBTITLE,
  CLAW_TITLE,
  clampClaw,
  findCatch,
  isTicketFree,
  loadDay5Progress,
  PLUSHIES,
  saveDay5Progress,
  TICKET_BUTTON,
  TICKET_HEADING,
  TICKET_LETTER,
  TICKET_SIGN,
  type Day5Progress,
  type Plush,
} from "./day5-claw";

/* Fixed so the lights look the same on every visit. */
const BOKEH = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 43.7 + 5) % 100,
  top: (i * 29.3 + 11) % 100,
  size: 40 + ((i * 17) % 70),
  hue: ["--bulb-red", "--gold", "--bulb-green", "--bulb-pink"][i % 4]!,
  delay: (i * 0.6) % 6,
}));
const BULBS = Array.from({ length: 9 }, (_, i) => i);

/** Where the top of the claw sits (% of the glass height). */
const REST_TOP = 6;
const DROP_TOP = { front: 63, back: 52, floor: 69 } as const;

type Phase = "idle" | "down" | "up" | "carry" | "release" | "return";
type TicketState = "hidden" | "rising" | "card";

/**
 * Day 5: a festive SKZOO claw machine. Catch every plush to free the golden ticket,
 * which opens a love letter. Never touches the radio.
 */
export function Day5() {
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
        aria-label="Abrir la máquina de garra"
        className="claw-mini grid h-28 w-28 place-items-center"
      >
        <Ticket className="claw-mini-icon h-12 w-12" strokeWidth={2.25} />
      </button>

      {hydrated && open && createPortal(<ClawMachine onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ClawMachine({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState<Day5Progress>({ caught: [], saved: false });
  const [clawX, setClawX] = useState(54);
  const [top, setTop] = useState(REST_TOP);
  const [phase, setPhase] = useState<Phase>("idle");
  const [closed, setClosed] = useState(false);
  const [held, setHeld] = useState<Plush | null>(null);
  const [falling, setFalling] = useState<Plush | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [ticket, setTicket] = useState<TicketState>("hidden");
  const [dragging, setDragging] = useState(false);
  const [rains, setRains] = useState(0);

  const glassRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(54);
  const busy = useRef(false);
  const progressRef = useRef(progress);
  const hold = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const stopHold = () => {
    if (hold.current !== null) window.clearInterval(hold.current);
    hold.current = null;
  };

  useEffect(() => {
    const saved = loadDay5Progress(window.localStorage);
    progressRef.current = saved;
    setProgress(saved);
    if (isTicketFree(saved.caught)) setTicket("rising");
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      stopHold();
    };
  }, []);

  useEffect(() => {
    if (ticket !== "card") return;
    const t = window.setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return () => window.clearTimeout(t);
  }, [ticket]);

  const moveTo = useCallback((x: number) => {
    if (busy.current) return;
    xRef.current = clampClaw(x);
    setClawX(xRef.current);
  }, []);

  const save = (next: Day5Progress) => {
    progressRef.current = next;
    setProgress(next);
    saveDay5Progress(window.localStorage, next);
  };

  const drop = useCallback(() => {
    if (busy.current || isTicketFree(progressRef.current.caught)) return;
    busy.current = true;
    stopHold();
    unlockArcadeSound();
    const startX = xRef.current;
    const target = findCatch(startX, progressRef.current.caught);

    setPhase("down");
    setClosed(false);
    setTop(target ? DROP_TOP[target.row] : DROP_TOP.floor);
    playDescend();

    later(() => {
      setClosed(true);
      playGrab(!!target);
      if (target) setHeld(target);
    }, 900);
    later(() => {
      setPhase("up");
      setTop(REST_TOP);
    }, 1250);
    later(() => {
      if (!target) {
        setClosed(false);
        setPhase("idle");
        busy.current = false;
        return;
      }
      setPhase("carry");
      xRef.current = CHUTE_X;
      setClawX(CHUTE_X);
    }, 2150);
    if (!target) return;
    later(() => {
      setPhase("release");
      setClosed(false);
      setHeld(null);
      setFalling(target);
    }, 2950);
    later(() => {
      setFalling(null);
      const caught = [...progressRef.current.caught, target.id];
      save({ ...progressRef.current, caught });
      setFresh(target.id);
      playPrize();
      setPhase("return");
      xRef.current = clampClaw(startX);
      setClawX(xRef.current);
      if (isTicketFree(caught)) {
        later(() => {
          setTicket("rising");
          playFanfare();
        }, 1200);
      }
    }, 3550);
    later(() => {
      setPhase("idle");
      busy.current = false;
    }, 4300);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ticket !== "hidden") return;
      if (e.key === "ArrowLeft") moveTo(xRef.current - 4);
      else if (e.key === "ArrowRight") moveTo(xRef.current + 4);
      else if (e.key === "ArrowDown") drop();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ticket, moveTo, drop]);

  /* Drag anywhere on the glass to slide the claw. */
  const xFromPointer = (clientX: number) => {
    const r = glassRef.current?.getBoundingClientRect();
    return r ? ((clientX - r.left) / r.width) * 100 : xRef.current;
  };
  const onGlassDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy.current) return;
    unlockArcadeSound();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    moveTo(xFromPointer(e.clientX));
  };
  const onGlassMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) moveTo(xFromPointer(e.clientX));
  };
  const onGlassUp = () => setDragging(false);

  /* Hold an arrow to keep the claw moving. */
  const startHold = (dir: -1 | 1) => {
    if (busy.current) return;
    unlockArcadeSound();
    stopHold();
    moveTo(xRef.current + dir * 1.5);
    hold.current = window.setInterval(() => moveTo(xRef.current + dir * 1.1), 16);
  };
  const arrowProps = (dir: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      startHold(dir);
    },
    onPointerUp: stopHold,
    onPointerCancel: stopHold,
    onLostPointerCapture: stopHold,
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) moveTo(xRef.current + dir * 5); // keyboard
    },
  });

  const keepPrize = () => {
    unlockArcadeSound();
    playPrize();
    save({ ...progressRef.current, saved: true });
    markDayCompleted(window.localStorage, 5);
    window.dispatchEvent(new Event(COMPLETED_EVENT));
    setRains((n) => n + 1);
  };

  const caught = progress.caught;
  const inGlass = PLUSHIES.filter((p) => !caught.includes(p.id) && held?.id !== p.id && falling?.id !== p.id);
  const moving = phase === "carry" || phase === "return";
  const free = isTicketFree(caught);

  return (
    <div
      className="claw-scene fixed inset-0 z-[35] overflow-y-auto overflow-x-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0">
        {BOKEH.map((b, i) => (
          <span
            key={i}
            className="claw-bokeh"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              background: `var(${b.hue})`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="radio-close fixed right-4 top-[4.5rem] z-50 grid h-10 w-10 place-items-center rounded-full"
      >
        <X className="h-5 w-5" strokeWidth={3} />
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={CLAW_TITLE}
        className="relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col items-center px-4 pb-14 pt-20 sm:pt-24"
      >
        <header className="phase-in px-12 text-center sm:px-0">
          <h2 className="claw-title">{CLAW_TITLE}</h2>
          <p className="claw-subtitle mx-auto mt-2 max-w-md">{CLAW_SUBTITLE}</p>
        </header>

        {/* The machine */}
        <div className="claw-cabinet phase-in mt-6">
          <div className="claw-marquee" aria-hidden>
            {BULBS.map((i) => (
              <span key={i} className="claw-bulb" style={{ animationDelay: `${(i % 2) * 0.45}s` }} />
            ))}
            <Star className="claw-marquee-star" strokeWidth={2.5} />
          </div>

          <div
            ref={glassRef}
            className="claw-glass"
            data-dragging={dragging}
            onPointerDown={onGlassDown}
            onPointerMove={onGlassMove}
            onPointerUp={onGlassUp}
            onPointerCancel={onGlassUp}
          >
            <span className="claw-rail" aria-hidden />

            {/* Golden ticket, buried under the pile */}
            <span className="claw-ticket-buried" data-free={free} aria-hidden>
              <Star className="h-[45%] w-[45%]" strokeWidth={2.5} />
            </span>

            {inGlass.map((p, i) => (
              <img
                key={p.id}
                src={p.img}
                alt=""
                draggable={false}
                className="claw-plush"
                data-row={p.row}
                style={{ left: `${p.x}%`, animationDelay: `${-i * 0.7}s` }}
              />
            ))}

            <span className="claw-chute" aria-hidden />

            {falling && (
              <img
                src={falling.img}
                alt=""
                draggable={false}
                className="claw-falling"
                style={{ left: `${CHUTE_X}%` }}
              />
            )}

            {/* The claw */}
            <span
              aria-hidden
              className="claw-cable"
              style={{
                left: `${clawX}%`,
                height: `${top - 2}%`,
                transition: `left ${moving ? 0.75 : dragging ? 0.12 : 0.06}s ease-out, height 0.85s ease-in-out`,
              }}
            />
            <span
              aria-hidden
              className="claw-head"
              data-closed={closed}
              data-busy={phase !== "idle"}
              style={{
                left: `${clawX}%`,
                top: `${top}%`,
                transition: `left ${moving ? 0.75 : dragging ? 0.12 : 0.06}s ease-out, top 0.85s ease-in-out`,
              }}
            >
              <span className="claw-hub" />
              <span className="claw-arm claw-arm-l" />
              <span className="claw-arm claw-arm-r" />
              {held && <img src={held.img} alt="" draggable={false} className="claw-held" />}
            </span>

            <span className="claw-shine" aria-hidden />
          </div>

          <div className="claw-panel">
            <button type="button" aria-label="Mover la garra a la izquierda" className="claw-arrow" {...arrowProps(-1)}>
              <ChevronLeft className="h-7 w-7" strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={drop}
              disabled={phase !== "idle" || free}
              className="claw-drop"
            >
              {CLAW_DROP}
            </button>
            <button type="button" aria-label="Mover la garra a la derecha" className="claw-arrow" {...arrowProps(1)}>
              <ChevronRight className="h-7 w-7" strokeWidth={3} />
            </button>
          </div>
          <span className="claw-door" aria-hidden />
        </div>

        {/* Counter + collection */}
        <div
          className="claw-tray phase-in mt-5"
          aria-label={`Peluches atrapados: ${caught.length} de ${PLUSHIES.length}`}
        >
          <span className="claw-count" aria-hidden>
            {caught.length} / {PLUSHIES.length}
          </span>
          <div className="flex gap-1.5 sm:gap-2" aria-hidden>
            {PLUSHIES.map((p) => {
              const got = caught.includes(p.id);
              return (
                <span key={p.id} className="claw-slot" data-got={got}>
                  {got && (
                    <img
                      src={p.img}
                      alt=""
                      draggable={false}
                      className={fresh === p.id ? "claw-slot-img claw-slot-new" : "claw-slot-img"}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* The golden ticket rises */}
      {ticket !== "hidden" && (
        <div className="ticket-overlay fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-center px-4 pb-14 pt-24">
            {ticket === "rising" && (
              <div className="flex flex-col items-center gap-6">
                <button
                  type="button"
                  className="golden-ticket"
                  aria-label="Abrir el Ticket Dorado"
                  onClick={() => {
                    unlockArcadeSound();
                    playFanfare();
                    setTicket("card");
                  }}
                >
                  <span className="golden-ticket-rays" aria-hidden />
                  <span className="golden-ticket-body">
                    <Star className="h-7 w-7" strokeWidth={2.5} />
                    <span className="golden-ticket-word">Ticket Dorado</span>
                    <Star className="h-7 w-7" strokeWidth={2.5} />
                  </span>
                </button>
                <p className="ticket-invite">Tócalo para abrirlo</p>
              </div>
            )}

            {ticket === "card" && (
              <div ref={cardRef} className="ticket-card w-full max-w-xl">
                <p className="ticket-heading">{TICKET_HEADING}</p>
                <span className="ticket-rule" aria-hidden />
                <div className="ticket-text">
                  {TICKET_LETTER.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                  <p className="ticket-sign">{TICKET_SIGN}</p>
                </div>
                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    onClick={keepPrize}
                    className="ticket-button"
                    data-saved={progress.saved}
                    aria-pressed={progress.saved}
                  >
                    {TICKET_BUTTON}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {rains > 0 && (
        <WishRain key={rains} hearts={false} density={0.45} duration={4200} colorTokens={["--gold", "--glow-warm"]} />
      )}
    </div>
  );
}
