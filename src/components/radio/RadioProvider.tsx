import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RADIO_PLAYLIST_ID } from "@/lib/radio";
import { RadioDock } from "./RadioDock";

/* Minimal slice of the YouTube IFrame API that the radio uses. */
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  unMute(): void;
  mute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaylist(): string[] | null;
  getPlaylistIndex(): number;
  getVideoData?(): { title?: string };
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number;
      height: number;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

const PLAYING = 1;

export type Radio = {
  ready: boolean;
  playing: boolean;
  started: boolean;
  title: string;
  index: number;
  count: number;
  current: number;
  duration: number;
  volume: number;
  muted: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setFullOpen: (open: boolean) => void;
};

const RadioContext = createContext<Radio | null>(null);

export function useRadio(): Radio {
  const radio = useContext(RadioContext);
  if (!radio) throw new Error("useRadio must be used inside <RadioProvider>");
  return radio;
}

/** One YouTube player for the whole site, so music keeps playing between pages. */
export function RadioProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const errorsRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [title, setTitle] = useState("");
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const sync = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    setCurrent(p.getCurrentTime() || 0);
    setDuration(p.getDuration() || 0);
    setIndex(Math.max(0, p.getPlaylistIndex() ?? 0));
    setCount(p.getPlaylist()?.length ?? 0);
    const t = p.getVideoData?.().title;
    if (t) setTitle(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      const el = document.createElement("div");
      host.appendChild(el);
      playerRef.current = new YT.Player(el, {
        width: 200,
        height: 200,
        playerVars: {
          listType: "playlist",
          list: RADIO_PLAYLIST_ID,
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current?.setVolume(70);
            setReady(true);
            sync();
          },
          onStateChange: (e) => {
            const isPlaying = e.data === PLAYING;
            setPlaying(isPlaying);
            if (isPlaying) {
              setStarted(true);
              errorsRef.current = 0;
            }
            sync();
          },
          // Skip songs that can't be embedded, but stop after a few failures in a row.
          onError: (e) => {
            errorsRef.current += 1;
            console.warn("Radio SKZ: song failed", e.data);
            if (errorsRef.current <= 3) playerRef.current?.nextVideo();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      host.innerHTML = "";
    };
  }, [sync]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(sync, 500);
    return () => window.clearInterval(id);
  }, [playing, sync]);

  const radio = useMemo<Radio>(
    () => ({
      ready,
      playing,
      started,
      title,
      index,
      count,
      current,
      duration,
      volume,
      muted,
      toggle: () => {
        const p = playerRef.current;
        if (!p) return;
        errorsRef.current = 0;
        if (playing) p.pauseVideo();
        else p.playVideo();
      },
      next: () => playerRef.current?.nextVideo(),
      prev: () => {
        const p = playerRef.current;
        if (!p) return;
        if (p.getCurrentTime() > 3) p.seekTo(0, true);
        else p.previousVideo();
      },
      seek: (seconds) => {
        playerRef.current?.seekTo(seconds, true);
        setCurrent(seconds);
      },
      setVolume: (v) => {
        const p = playerRef.current;
        setVolumeState(v);
        if (!p) return;
        p.setVolume(v);
        if (v > 0) {
          p.unMute();
          setMuted(false);
        }
      },
      toggleMute: () => {
        const p = playerRef.current;
        if (!p) return;
        if (muted) p.unMute();
        else p.mute();
        setMuted(!muted);
      },
      setFullOpen,
    }),
    [ready, playing, started, title, index, count, current, duration, volume, muted],
  );

  return (
    <RadioContext.Provider value={radio}>
      {children}
      <div
        ref={hostRef}
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 -z-10 h-[200px] w-[200px] overflow-hidden opacity-0"
      />
      {started && !fullOpen && <RadioDock />}
    </RadioContext.Provider>
  );
}
