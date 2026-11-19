import { useCallback, useEffect, useRef, useState } from "react";
import stageImg from "@/assets/day9-concert-stage.png";
import lightstickImg from "@/assets/day9-lightstick.png";
import wolfHappy from "@/assets/stickers/wolf-happy.webp";
import bunnyCarrot from "@/assets/stickers/bunny-carrot.webp";
import quokkaWink from "@/assets/stickers/quokka-wink.webp";
import chickHeart from "@/assets/stickers/chick-heart.webp";
import { useRadio } from "@/components/radio/RadioProvider";
import { COMPLETED_EVENT, markDayCompleted } from "@/lib/completed-days";
import { unlockCandleSound } from "@/lib/candle-sound";
import {
  createSpotifyPlayer,
  type SpotifyController,
  type SpotifyPlayback,
} from "@/lib/spotify-embed";
import { serenadeFinished } from "./day8-serenata";
import {
  AUDIO_WAIT_MS,
  END_TRIM_MS,
  HIT_WINDOW_MS,
  LANE_NAMES,
  LANES,
  LEAD_IN_MS,
  NO_AUDIO_SONG_MS,
  RATING_LABEL,
  START_ENERGY,
  accuracy,
  addRating,
  emptyStats,
  generateChart,
  judge,
  laneForKey,
  nextEnergy,
  type Lane,
  type Level,
  type Note,
  type Rating,
  type Stats,
} from "./day9-concierto";

/** One SKZOO singer per lane: hitting that lane makes them sing. */
const SINGERS = [
  { src: wolfHappy, name: "Wolf Chan" },
  { src: bunnyCarrot, name: "Leebit" },
  { src: quokkaWink, name: "Han Quokka" },
  { src: chickHeart, name: "BbokAri" },
];

const ARROW_ROTATION = [-90, 180, 0, 90];
/** Receptor row position, as a fraction of the lane height. */
const RECEPTOR_AT = 0.06;

type Phase = "ready" | "loading" | "playing" | "paused" | "results";
type LiveNote = Note & { state: "pending" | "hit" | "missed" };

export function ConcertGame({ level, onExit }: { level: Level; onExit: () => void }) {
  const radio = useRadio();
  const radioRef = useRef(radio);
  radioRef.current = radio;

  const [phase, setPhase] = useState<Phase>("ready");
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [energy, setEnergy] = useState(START_ENERGY);
  const [pressed, setPressed] = useState<boolean[]>([false, false, false, false]);
  const [popup, setPopup] = useState<{ rating: Rating; key: number } | null>(null);
  const [splashes, setSplashes] = useState<number[]>([0, 0, 0, 0]);
  const [singing, setSinging] = useState<{ lane: Lane; key: number } | null>(null);
  const [laneHeight, setLaneHeight] = useState(500);
  const [audioless, setAudioless] = useState(false);

  const phaseRef = useRef<Phase>("ready");
  const [chart] = useState<LiveNote[]>(() =>
    generateChart(level).map((n) => ({ ...n, state: "pending" })),
  );
  const notesRef = useRef(chart);
  const clock = useRef({ base: 0, at: 0, running: false });
  const durationRef = useRef<number | null>(null);
  const heardRef = useRef(false);
  const furthestRef = useRef(0);
  const wantPlayRef = useRef(false);
  const audiolessRef = useRef(false);
  const ctrlRef = useRef<SpotifyController | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const popupId = useRef(0);
  const waitTimer = useRef<number | null>(null);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const songNow = useCallback(() => {
    const c = clock.current;
    return c.running ? c.base + (performance.now() - c.at) : c.base;
  }, []);

  const finish = useCallback(() => {
    if (phaseRef.current === "results") return;
    clock.current = { base: songNow(), at: performance.now(), running: false };
    setPhaseBoth("results");
    ctrlRef.current?.pause();
    markDayCompleted(window.localStorage, 9);
    window.dispatchEvent(new Event(COMPLETED_EVENT));
  }, [setPhaseBoth, songNow]);

  const applyRating = useCallback((rating: Rating, lane: Lane | null) => {
    setStats((s) => addRating(s, rating));
    setEnergy((e) => nextEnergy(e, rating));
    const key = ++popupId.current;
    setPopup({ rating, key });
    if (lane !== null && rating !== "fallo") {
      setSinging({ lane, key });
      setSplashes((list) => list.map((v, i) => (i === lane ? key : v)));
    }
  }, []);

  const onPlayback = useCallback(
    (p: SpotifyPlayback) => {
      if (p.duration > 0) durationRef.current = p.duration;
      if (phaseRef.current === "ready" || phaseRef.current === "results") return;

      if (!p.isPaused) {
        heardRef.current = true;
        const c = clock.current;
        if (!c.running || Math.abs(p.position - songNow()) > 120) {
          clock.current = { base: p.position, at: performance.now(), running: true };
        }
        if (audiolessRef.current) {
          audiolessRef.current = false;
          setAudioless(false);
        }
        if (phaseRef.current !== "playing") setPhaseBoth("playing");
      }

      furthestRef.current = Math.max(furthestRef.current, p.position);
      if (heardRef.current && serenadeFinished(p, furthestRef.current)) return finish();

      if (p.isPaused && heardRef.current && phaseRef.current === "playing") {
        clock.current = { base: songNow(), at: performance.now(), running: false };
        setPhaseBoth("paused");
      }
    },
    [finish, setPhaseBoth, songNow],
  );

  // The Spotify player for this level's song.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    createSpotifyPlayer(host, level.trackUri)
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
  }, [level.trackUri, onPlayback]);

  useEffect(
    () => () => {
      if (waitTimer.current) window.clearTimeout(waitTimer.current);
    },
    [],
  );

  useEffect(() => {
    const el = lanesRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setLaneHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const start = () => {
    if (phaseRef.current !== "ready") return;
    unlockCandleSound();
    // One song at a time: hush the Radio SKZ during the concert.
    if (radioRef.current.playing) radioRef.current.toggle();
    setPhaseBoth("loading");
    wantPlayRef.current = true;
    ctrlRef.current?.play();
    waitTimer.current = window.setTimeout(() => {
      if (heardRef.current || phaseRef.current !== "loading") return;
      audiolessRef.current = true;
      setAudioless(true);
      durationRef.current = NO_AUDIO_SONG_MS;
      clock.current = { base: 0, at: performance.now(), running: true };
      setPhaseBoth("playing");
    }, AUDIO_WAIT_MS);
  };

  const resume = () => {
    if (phaseRef.current !== "paused") return;
    if (audiolessRef.current) {
      clock.current = { ...clock.current, at: performance.now(), running: true };
      setPhaseBoth("playing");
    } else {
      ctrlRef.current?.resume();
    }
  };

  // The game loop: advance the clock, mark arrows that slipped past, end with the song.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      const t = songNow();
      for (const n of notesRef.current) {
        if (n.time > t) break;
        if (n.state === "pending" && t - n.time > HIT_WINDOW_MS) {
          n.state = "missed";
          applyRating("fallo", null);
        }
      }
      const dur = durationRef.current;
      if (dur && t >= dur - 250) return finish();
      setNow(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, songNow, applyRating, finish]);

  const hit = useCallback(
    (lane: Lane) => {
      if (phaseRef.current !== "playing") return;
      const t = songNow();
      const dur = durationRef.current;
      let best: LiveNote | null = null;
      for (const n of notesRef.current) {
        if (n.time - t > HIT_WINDOW_MS) break;
        if (n.lane !== lane || n.state !== "pending") continue;
        if (dur && n.time > dur - END_TRIM_MS) continue;
        if (Math.abs(n.time - t) <= HIT_WINDOW_MS) {
          best = n;
          break;
        }
      }
      if (!best) return;
      const rating = judge(best.time - t);
      if (!rating) return;
      best.state = "hit";
      applyRating(rating, lane);
    },
    [songNow, applyRating],
  );

  const press = useCallback(
    (lane: Lane, down: boolean) => {
      setPressed((p) => (p[lane] === down ? p : p.map((v, i) => (i === lane ? down : v))));
      if (down) hit(lane);
    },
    [hit],
  );

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const lane = laneForKey(e.key);
      if (lane === null) return;
      e.preventDefault();
      if (e.repeat) return;
      press(lane, true);
    };
    const onUp = (e: KeyboardEvent) => {
      const lane = laneForKey(e.key);
      if (lane !== null) press(lane, false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [press]);

  const dur = durationRef.current;
  const pxPerMs = (level.speed * laneHeight) / 1000;
  const receptorY = laneHeight * RECEPTOR_AT;
  const arrowSize = Math.min(laneHeight * 0.14, 84);
  const visible =
    phase === "playing" || phase === "paused"
      ? notesRef.current.filter((n) => {
          if (n.state === "hit") return false;
          if (dur && n.time > dur - END_TRIM_MS) return false;
          const y = receptorY + (n.time - now) * pxPerMs;
          return y > -arrowSize * 1.5 && y < laneHeight + arrowSize;
        })
      : [];

  const countdown =
    phase === "playing" && now < LEAD_IN_MS + 500
      ? now < 0
        ? null
        : now < LEAD_IN_MS
          ? String(Math.max(1, Math.ceil((LEAD_IN_MS - now) / 1000)))
          : "Ya"
      : null;

  const beatSeconds = 60 / level.bpm;
  const totalNotes =
    stats.counts.perfecto + stats.counts.bien + stats.counts.regular + stats.counts.fallo;
  const progress = dur ? Math.min(1, Math.max(0, now / dur)) : 0;

  return (
    <div
      className="concierto-game relative flex h-full w-full flex-col gap-3 md:flex-row"
      data-live={phase === "playing"}
      style={{ "--beat": `${beatSeconds}s` } as React.CSSProperties}
    >
      <img src={stageImg} alt="" className="concierto-stage-bg" draggable={false} />
      <div aria-hidden className="concierto-beams">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Stage with the SKZOO singers */}
      <section
        aria-label="Escenario"
        className="relative z-10 flex flex-col items-center justify-end gap-3 md:order-2 md:flex-1"
      >
        <div className="concierto-song-tag">
          <span className="concierto-level-chip">Nivel {level.id}</span>
          <span className="truncate">{level.title}</span>
          <span className="text-white/70">{level.difficulty}</span>
        </div>
        <div className="flex w-full items-end justify-center gap-[2%] px-2">
          {SINGERS.map((s, i) => (
            <span
              key={s.name}
              className="concierto-singer-wrap"
              style={{ animationDelay: `${(i % 2) * beatSeconds * 0.5}s` }}
            >
              <img
                key={singing?.lane === i ? singing.key : 0}
                src={s.src}
                alt={s.name}
                draggable={false}
                className="concierto-singer"
                data-singing={singing?.lane === i}
              />
            </span>
          ))}
        </div>
        <div className="concierto-player w-full max-w-xl">
          <div ref={hostRef} />
        </div>
      </section>

      <div className="relative z-10 flex min-h-0 flex-1 gap-3 md:contents">
        {/* Energy meter with the lightstick */}
        <EnergyBar energy={energy} />

        {/* The four lanes */}
        <section
          aria-label="Flechas"
          className="concierto-lanes-wrap relative flex min-h-0 flex-1 flex-col md:order-3 md:w-[min(28rem,38vw)] md:flex-none"
        >
          <div ref={lanesRef} className="concierto-lanes relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-4">
              {LANES.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  tabIndex={-1}
                  aria-label={`Flecha ${LANE_NAMES[lane]}`}
                  className="concierto-lane relative h-full touch-none select-none"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    press(lane, true);
                  }}
                  onPointerUp={() => press(lane, false)}
                  onPointerLeave={() => press(lane, false)}
                  onPointerCancel={() => press(lane, false)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ top: receptorY + arrowSize / 2, width: arrowSize, height: arrowSize }}
                  >
                    <ArrowShape lane={lane} variant={pressed[lane] ? "pressed" : "receptor"} />
                    {(splashes[lane] ?? 0) > 0 && (
                      <span key={splashes[lane]} className="concierto-splash" data-lane={lane} />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div aria-hidden className="pointer-events-none absolute inset-0">
              {visible.map((n) => (
                <span
                  key={n.id}
                  className="absolute"
                  style={{
                    left: `${(n.lane + 0.5) * 25}%`,
                    top: 0,
                    width: arrowSize,
                    height: arrowSize,
                    transform: `translate(-50%, ${receptorY + (n.time - now) * pxPerMs}px)`,
                    opacity: n.state === "missed" ? 0.35 : 1,
                  }}
                >
                  <ArrowShape lane={n.lane} variant="note" />
                </span>
              ))}
            </div>

            {popup && phase !== "results" && (
              <span
                key={popup.key}
                aria-hidden
                className="concierto-rating"
                data-rating={popup.rating}
              >
                {RATING_LABEL[popup.rating]}
                {stats.combo >= 5 && popup.rating !== "fallo" && (
                  <small className="concierto-combo">{stats.combo}</small>
                )}
              </span>
            )}

            {countdown && (
              <span key={countdown} aria-hidden className="concierto-countdown">
                {countdown}
              </span>
            )}

            {phase === "ready" && (
              <div className="concierto-overlay">
                <p className="concierto-overlay-title">{level.title}</p>
                <p className="concierto-overlay-text">
                  Presiona las flechas del teclado (o D F J K) o toca las flechas cuando lleguen
                  arriba.
                </p>
                <button type="button" onClick={start} className="concierto-cta">
                  Empezar
                </button>
              </div>
            )}
            {phase === "loading" && (
              <div className="concierto-overlay">
                <p className="concierto-overlay-title">Preparando la canción</p>
                <p className="concierto-overlay-text">Si no suena, toca play en el reproductor.</p>
              </div>
            )}
            {phase === "paused" && (
              <div className="concierto-overlay">
                <p className="concierto-overlay-title">Pausa</p>
                <button type="button" onClick={resume} className="concierto-cta">
                  Continuar
                </button>
              </div>
            )}
          </div>

          <div className="concierto-progress" aria-hidden>
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="concierto-hud" aria-live="off">
            Puntaje: {stats.score} <span aria-hidden>|</span> Fallos: {stats.counts.fallo}{" "}
            <span aria-hidden>|</span> Precisión: {totalNotes ? `${accuracy(stats.counts)}%` : "-"}
          </p>
          {audioless && phase === "playing" && (
            <p className="concierto-hint">Sin música: sigue el ritmo de las flechas.</p>
          )}
        </section>
      </div>

      {phase === "results" && (
        <div className="concierto-results-wrap fixed inset-0 z-30 grid place-items-center px-4 py-20">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Puntaje final"
            className="concierto-results phase-in w-full max-w-sm"
          >
            <p className="concierto-results-kicker">{level.title}</p>
            <h3 className="concierto-results-title">Puntaje final</h3>
            <p className="concierto-results-score">{stats.score.toLocaleString("es")}</p>
            <dl className="concierto-results-stats">
              <div>
                <dt>Precisión</dt>
                <dd>{accuracy(stats.counts)}%</dd>
              </div>
              <div>
                <dt>Mejor combo</dt>
                <dd>{stats.bestCombo}</dd>
              </div>
              <div>
                <dt>Fallos</dt>
                <dd>{stats.counts.fallo}</dd>
              </div>
            </dl>
            <button type="button" onClick={onExit} className="concierto-cta mt-6 w-full">
              Volver a los niveles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowShape({ lane, variant }: { lane: Lane; variant: "note" | "receptor" | "pressed" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="concierto-arrow h-full w-full"
      data-lane={lane}
      data-variant={variant}
      style={{ rotate: `${ARROW_ROTATION[lane]}deg` }}
      aria-hidden
    >
      <path d="M50 7 L91 47 Q95 53 88 55 L67 55 L67 87 Q67 93 61 93 L39 93 Q33 93 33 87 L33 55 L12 55 Q5 53 9 47 Z" />
    </svg>
  );
}

function EnergyBar({ energy }: { energy: number }) {
  const glow = energy / 100;
  return (
    <div
      role="meter"
      aria-label="Energía"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(energy)}
      className="concierto-energy relative flex w-14 shrink-0 flex-col items-center md:order-1 md:w-20"
      style={{ "--glow": glow } as React.CSSProperties}
    >
      <img
        src={lightstickImg}
        alt="Lightstick de Stray Kids"
        className="concierto-lightstick"
        draggable={false}
      />
      <div className="concierto-energy-tube relative w-4 flex-1 md:w-5">
        <span className="concierto-energy-fill" style={{ height: `${energy}%` }} />
      </div>
      <span className="concierto-energy-value">{Math.round(energy)}</span>
    </div>
  );
}
