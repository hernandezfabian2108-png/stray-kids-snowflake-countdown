/**
 * Loads Spotify's official embed IFrame API once and creates a player controller.
 * Browser-only: call from effects or event handlers.
 */
export type SpotifyPlayback = {
  isPaused: boolean;
  isBuffering?: boolean;
  /** Milliseconds. */
  position: number;
  /** Milliseconds. */
  duration: number;
};

export type SpotifyController = {
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: SpotifyPlayback }) => void) => void;
};

type SpotifyApi = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyController) => void,
  ) => void;
};

let apiPromise: Promise<SpotifyApi> | null = null;

function loadApi(): Promise<SpotifyApi> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SpotifyApi>((resolve, reject) => {
    const w = window as unknown as { onSpotifyIframeApiReady?: (api: SpotifyApi) => void };
    w.onSpotifyIframeApiReady = (api) => resolve(api);
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Spotify could not load"));
    };
    document.body.appendChild(script);
  });
  return apiPromise;
}

/** Mounts a Spotify player inside `host` (React never touches its children). */
export async function createSpotifyPlayer(host: HTMLElement, uri: string, height = 80): Promise<SpotifyController> {
  const api = await loadApi();
  const slot = document.createElement("div");
  host.replaceChildren(slot);
  return new Promise((resolve) => {
    api.createController(slot, { uri, width: "100%", height }, resolve);
  });
}
