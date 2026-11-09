import { Link } from "@tanstack/react-router";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRadio } from "./RadioProvider";
import { Cassette } from "./Cassette";

/** Small floating radio that stays on screen while the music plays. */
export function RadioDock() {
  const radio = useRadio();
  const silent = radio.muted || radio.volume === 0;

  return (
    <div className="radio-dock fixed bottom-4 right-4 z-[45] flex items-center gap-2 p-2 pr-3">
      <Link to="/dia/$dia" params={{ dia: "2" }} aria-label="Abrir Radio SKZ" className="shrink-0">
        <Cassette playing={radio.playing} className="w-16" />
      </Link>
      <button
        type="button"
        onClick={radio.toggle}
        aria-label={radio.playing ? "Pausar" : "Reproducir"}
        className="radio-key grid h-10 w-10 place-items-center rounded-full"
      >
        {radio.playing ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        )}
      </button>
      <button
        type="button"
        onClick={radio.toggleMute}
        aria-label={silent ? "Activar sonido" : "Silenciar"}
        className="radio-dock-icon grid h-8 w-8 place-items-center rounded-full"
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
        className="radio-range hidden w-20 sm:block"
      />
    </div>
  );
}
