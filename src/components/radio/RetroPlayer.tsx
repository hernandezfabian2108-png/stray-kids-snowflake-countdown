import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import wolfHappy from "@/assets/stickers/wolf-happy.webp";
import { formatTime } from "@/lib/radio";
import { useRadio } from "./RadioProvider";
import { Cassette } from "./Cassette";

/** Vintage MP4 / radio with the full set of controls. */
export function RetroPlayer() {
  const radio = useRadio();
  const silent = radio.muted || radio.volume === 0;
  const title = radio.title || (radio.ready ? "Radio SKZ" : "Sintonizando…");

  return (
    <div className="radio-body relative w-full" data-playing={radio.playing}>
      <span className="radio-antenna" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3 px-1">
        <span className="radio-brand">RADIO SKZ</span>
        <span className="radio-led" aria-hidden="true" />
      </div>

      <div className="radio-screen mt-3">
        <div className="flex items-end gap-3">
          <img src={wolfHappy} alt="" draggable={false} className="radio-dancer w-[30%] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="radio-eq" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} style={{ animationDelay: `${-i * 0.17}s` }} />
              ))}
            </div>
            <div className="radio-marquee mt-2">
              <span key={title}>{title}</span>
            </div>
            <div className="radio-lcd-small mt-1 flex justify-between">
              <span>
                {radio.count > 0 ? `${radio.index + 1}/${radio.count}` : "--/--"}
              </span>
              <span>
                {formatTime(radio.current)} / {formatTime(radio.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(radio.duration))}
        value={Math.floor(radio.current)}
        onChange={(e) => radio.seek(Number(e.target.value))}
        disabled={!radio.ready || radio.duration === 0}
        aria-label="Progreso de la canción"
        className="radio-range mt-4 w-full"
      />

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={radio.prev}
          disabled={!radio.ready}
          aria-label="Canción anterior"
          className="radio-key grid h-12 w-12 place-items-center rounded-full"
        >
          <SkipBack className="h-5 w-5" fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={radio.toggle}
          disabled={!radio.ready}
          aria-label={radio.playing ? "Pausar" : "Reproducir"}
          className="radio-key radio-key-main grid h-16 w-16 place-items-center rounded-full"
        >
          {radio.playing ? (
            <Pause className="h-7 w-7" fill="currentColor" />
          ) : (
            <Play className="ml-1 h-7 w-7" fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={radio.next}
          disabled={!radio.ready}
          aria-label="Canción siguiente"
          className="radio-key grid h-12 w-12 place-items-center rounded-full"
        >
          <SkipForward className="h-5 w-5" fill="currentColor" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={radio.toggleMute}
          aria-label={silent ? "Activar sonido" : "Silenciar"}
          className="radio-icon grid h-8 w-8 shrink-0 place-items-center rounded-full"
        >
          {silent ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={radio.muted ? 0 : radio.volume}
          onChange={(e) => radio.setVolume(Number(e.target.value))}
          aria-label="Volumen"
          className="radio-range w-full"
        />
        <Cassette playing={radio.playing} className="w-14 shrink-0" />
      </div>
    </div>
  );
}
