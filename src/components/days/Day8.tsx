import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated, useNavigate } from "@tanstack/react-router";
import { Guitar, X } from "lucide-react";
import sceneImg from "@/assets/day8-serenata-scene.jpg";
import { WishRain } from "@/components/WishRain";
import { useRadio } from "@/components/radio/RadioProvider";
import { COMPLETED_EVENT, markDayCompleted } from "@/lib/completed-days";
import { playSparkle, unlockCandleSound } from "@/lib/candle-sound";
import { createSpotifyPlayer, type SpotifyController, type SpotifyPlayback } from "@/lib/spotify-embed";
import { PixelSprite } from "./PixelSprite";
import {
  HEART_SPRITE,
  MANOLO_FRAMES,
  MANOLO_PALETTE,
  NOTE_PALETTE,
  NOTE_SPRITES,
  type ManoloFrame,
} from "./day8-sprites";
import {
  NO_AUDIO_LETTER_MS,
  READ_LETTER_MS,
  SERENATA_DONE,
  SERENATA_LETTER,
  SERENATA_TITLE,
  SERENATA_TRACK_URI,
  serenadeFinished,
} from "./day8-serenata";

const ARROW_SPRITE = [
  "..KKKK..",
  "..KGGK..",
  "..KGGK..",
  "KKKGGKKK",
  "KGGGGGGK",
  ".KGGGGK.",
  "..KGGK..",
  "...KK...",
];

/* Fixed so the sky looks the same on every visit. */
const TWINKLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 23.7 + 3) % 54,
  top: (i * 13.3 + (i % 5) * 4) % 34,
  delay: (i * 0.41) % 3,
  big: i % 4 === 0,
}));
const LANTERNS = [
  { left: 7, top: 27 },
  { left: 24.5, top: 32 },
  { left: 37, top: 34.5 },
  { left: 50, top: 16.5 },
  { left: 52, top: 37 },
  { left: 10.5, top: 63 },
  { left: 28.5, top: 70 },
  { left: 53, top: 68.5 },
];
const MARIA_HEARTS = [0, 1.2, 2.4];

type Note = { id: number; sprite: number; x0: number; y0: number; x1: number; y1: number; dur: number; size: number };

/** Day 8: tap pixel Manolo and he sings to María on her balcony; when the song ends, a letter. */
export function Day8() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir la serenata"
        className="serenata-mini grid h-28 w-28 place-items-center"
      >
        <Guitar className="serenata-mini-icon h-12 w-12" strokeWidth={2.25} />
      </button>
      {hydrated && open && createPortal(<Serenata onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Serenata({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const radio = useRadio();
  const radioRef = useRef(radio);
  radioRef.current = radio;

  const [started, setStarted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const [done, setDone] = useState(false);
  const [rains, setRains] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [frame, setFrame] = useState<ManoloFrame>("idle");

  const hostRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<SpotifyController | null>(null);
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const heardRef = useRef(false);
  const wantPlayRef = useRef(false);
  const furthestRef = useRef(0);
  const noteId = useRef(0);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finish = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    later(() => setShowLetter(true), 900);
    later(() => setCanFinish(true), 900 + READ_LETTER_MS);
  }, [later]);

  const begin = useCallback(
    (fromTap: boolean) => {
      if (!startedRef.current) {
        startedRef.current = true;
        setStarted(true);
        // One song at a time: hush the Radio SKZ while Manolo sings.
        if (radioRef.current.playing) radioRef.current.toggle();
        later(() => {
          if (!heardRef.current) finish();
        }, NO_AUDIO_LETTER_MS);
      }
      if (fromTap) {
        wantPlayRef.current = true;
        ctrlRef.current?.play();
      }
    },
    [finish, later],
  );

  const onPlayback = useCallback(
    (p: SpotifyPlayback) => {
      setAudioPlaying(!p.isPaused);
      if (!p.isPaused && !startedRef.current) begin(false);
      if (p.position > 0 && !heardRef.current) {
        heardRef.current = true;
        setHeard(true);
      }
      furthestRef.current = Math.max(furthestRef.current, p.position);
      if (startedRef.current && serenadeFinished(p, furthestRef.current)) finish();
    },
    [begin, finish],
  );

  // The Spotify player for the song, ready before she taps.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    createSpotifyPlayer(host, SERENATA_TRACK_URI)
      .then((ctrl) => {
        if (cancelled) return ctrl.destroy();
        ctrlRef.current = ctrl;
        ctrl.addListener("playback_update", (e) => onPlayback(e.data));
        if (wantPlayRef.current) ctrl.play();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
      host.replaceChildren();
    };
  }, [onPlayback]);

  const strumming = started && !ended && (audioPlaying || !heard);

  // Manolo's frames: strumming loop, or resting with a blink now and then.
  useEffect(() => {
    if (strumming) {
      let up = true;
      setFrame("up");
      const t = window.setInterval(() => {
        up = !up;
        setFrame(up ? "up" : "down");
      }, 170);
      return () => window.clearInterval(t);
    }
    setFrame("idle");
    const t = window.setInterval(() => {
      setFrame("blink");
      window.setTimeout(() => setFrame("idle"), 160);
    }, 3200);
    return () => window.clearInterval(t);
  }, [strumming]);

  // Golden notes float from the guitar up to María's balcony.
  useEffect(() => {
    if (!strumming) return;
    const t = window.setInterval(() => {
      const i = noteId.current++;
      setNotes((list) => [
        ...list.slice(-14),
        {
          id: i,
          sprite: i % NOTE_SPRITES.length,
          x0: 28 + ((i * 7) % 6),
          y0: 74 + ((i * 3) % 6),
          x1: 66 + ((i * 11) % 16),
          y1: 18 + ((i * 5) % 14),
          dur: 3.4 + ((i * 3) % 5) * 0.25,
          size: 3.6 + ((i * 5) % 3) * 0.7,
        },
      ]);
    }, 480);
    return () => window.clearInterval(t);
  }, [strumming]);

  const tapManolo = () => {
    unlockCandleSound();
    if (endedRef.current) return;
    if (!startedRef.current) return begin(true);
    if (heardRef.current) ctrlRef.current?.togglePlay();
  };

  const complete = () => {
    if (!canFinish || done) return;
    playSparkle();
    markDayCompleted(window.localStorage, 8);
    window.dispatchEvent(new Event(COMPLETED_EVENT));
    setDone(true);
    setRains((n) => n + 1);
    later(() => navigate({ to: "/puertas" }), 2600);
  };

  return (
    <div className="serenata-scene fixed inset-0 z-[35] overflow-y-auto overflow-x-hidden" data-playing={strumming}>
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
        aria-label={SERENATA_TITLE}
        className="relative z-10 mx-auto flex min-h-full w-full flex-col items-center px-3 pb-10 pt-[4.75rem]"
      >
        <h2 className="serenata-title phase-in">{SERENATA_TITLE}</h2>

        <div className="serenata-stage relative mt-3">
          <img src={sceneImg} alt="" width={1024} height={1024} className="serenata-bg" draggable={false} />

          <div aria-hidden className="pointer-events-none absolute inset-0">
            {TWINKLES.map((s, i) => (
              <span
                key={i}
                className="serenata-twinkle"
                data-big={s.big}
                style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
              />
            ))}
            {LANTERNS.map((l, i) => (
              <span
                key={i}
                className="serenata-lantern"
                style={{ left: `${l.left}%`, top: `${l.top}%`, animationDelay: `${(i * 0.37) % 2}s` }}
              />
            ))}
          </div>

          {strumming &&
            MARIA_HEARTS.map((d) => (
              <PixelSprite
                key={d}
                rows={HEART_SPRITE}
                palette={NOTE_PALETTE}
                className="serenata-heart"
                style={{ left: `${72 + d * 3}%`, animationDelay: `${d}s` }}
              />
            ))}

          {notes.map((n) => (
            <PixelSprite
              key={n.id}
              rows={NOTE_SPRITES[n.sprite]!}
              palette={NOTE_PALETTE}
              className="serenata-note"
              style={
                {
                  "--x0": `${n.x0}%`,
                  "--y0": `${n.y0}%`,
                  "--x1": `${n.x1}%`,
                  "--y1": `${n.y1}%`,
                  width: `${n.size}%`,
                  animationDuration: `${n.dur}s`,
                } as React.CSSProperties
              }
              onAnimationEnd={() => setNotes((list) => list.filter((x) => x.id !== n.id))}
            />
          ))}

          <button
            type="button"
            onClick={tapManolo}
            aria-label={
              !started ? "Tocar a Manolo para que cante" : strumming ? "Pausar la serenata" : "Seguir la serenata"
            }
            className="serenata-manolo"
            data-strumming={strumming}
          >
            {!started && (
              <PixelSprite rows={ARROW_SPRITE} palette={NOTE_PALETTE} className="serenata-hint" />
            )}
            <PixelSprite rows={MANOLO_FRAMES[frame]} palette={MANOLO_PALETTE} className="h-full w-full" />
          </button>
        </div>

        <div className="serenata-player mt-4 w-full">
          <div ref={hostRef} />
        </div>
      </div>

      {showLetter && (
        <div className="serenata-letter-wrap fixed inset-0 z-30 grid place-items-center overflow-y-auto px-4 py-20">
          <div className="serenata-letter phase-in relative w-full max-w-lg">
            <PixelSprite rows={HEART_SPRITE} palette={NOTE_PALETTE} className="serenata-letter-heart" />
            <p className="serenata-letter-text">{SERENATA_LETTER}</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              {!canFinish && <span aria-hidden className="serenata-read-bar" style={{ animationDuration: `${READ_LETTER_MS}ms` }} />}
              <button type="button" onClick={complete} disabled={!canFinish || done} className="serenata-done">
                {SERENATA_DONE}
              </button>
            </div>
          </div>
        </div>
      )}

      {rains > 0 && <WishRain key={rains} />}
    </div>
  );
}
