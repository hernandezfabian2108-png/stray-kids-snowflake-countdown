/** Day 9, "Concierto SKZ": a Friday Night Funkin' style rhythm game with three songs. */

export const CONCIERTO_TITLE = "Concierto SKZ";

export type Lane = 0 | 1 | 2 | 3;
/** Left, down, up, right, in the same order as Friday Night Funkin'. */
export const LANES: Lane[] = [0, 1, 2, 3];
export const LANE_NAMES = ["izquierda", "abajo", "arriba", "derecha"] as const;

export type Level = {
  id: number;
  title: string;
  difficulty: string;
  trackUri: string;
  cover: string;
  /** Approximate tempo, used to place the arrows on the beat. */
  bpm: number;
  /** 0..1, how many beats carry arrows and how often they come in eighths or pairs. */
  density: number;
  /** Arrow travel speed, in stage heights per second. */
  speed: number;
};

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "This & That",
    difficulty: "Fácil",
    trackUri: "spotify:track:7AN7dJCtHqbL7f76QGyraa",
    cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0237f636fa384b48481241cbd3",
    bpm: 120,
    density: 0.35,
    speed: 0.85,
  },
  {
    id: 2,
    title: "God's Menu",
    difficulty: "Normal",
    trackUri: "spotify:track:4XPXrcpyNr30Km6aPiflJy",
    cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02fad8c4176e8df7173479f959",
    bpm: 146,
    density: 0.6,
    speed: 1.05,
  },
  {
    id: 3,
    title: "LALALALA",
    difficulty: "Difícil",
    trackUri: "spotify:track:1OG1NoKpZZLrMqMYCk9m84",
    cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022bca95a658fdf653a35a3710",
    bpm: 144,
    density: 0.85,
    speed: 1.25,
  },
];

/** The first arrow arrives after this lead-in (ms of song time). */
export const LEAD_IN_MS = 3000;
/** Longest chart ever generated; the real song length trims it. */
export const MAX_CHART_MS = 6 * 60_000;
/** Song length used when the music can't play (blocked or offline). */
export const NO_AUDIO_SONG_MS = 75_000;
/** How long to wait for the music before playing without it. */
export const AUDIO_WAIT_MS = 4000;
/** Arrows this close to the end of the song are left out. */
export const END_TRIM_MS = 1500;

export type Note = { id: number; time: number; lane: Lane };

/** Small deterministic PRNG so every play of a level gets the same chart. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the arrow chart on the song's beat grid. */
export function generateChart(
  level: Pick<Level, "id" | "bpm" | "density">,
  lengthMs = MAX_CHART_MS,
): Note[] {
  const rand = mulberry32(level.id * 9973 + level.bpm);
  const beat = 60_000 / level.bpm;
  const notes: Note[] = [];
  let id = 0;
  let last: Lane = 1;
  let repeats = 0;

  const pickLane = (avoid?: Lane): Lane => {
    let lane = Math.floor(rand() * 4) as Lane;
    if ((lane === last && repeats >= 1) || lane === avoid)
      lane = ((lane + 1 + Math.floor(rand() * 3)) % 4) as Lane;
    if (lane === avoid) lane = ((lane + 1) % 4) as Lane;
    repeats = lane === last ? repeats + 1 : 0;
    last = lane;
    return lane;
  };

  for (let i = 0; ; i++) {
    const t = LEAD_IN_MS + i * beat;
    if (t > lengthMs - END_TRIM_MS) break;
    // Every 16 beats, a short breather of 2 beats.
    if (i % 16 >= 14) continue;
    const onDownbeat = i % 2 === 0;
    if (!onDownbeat && rand() > 0.35 + level.density * 0.6) continue;

    const lane = pickLane();
    notes.push({ id: id++, time: Math.round(t), lane });

    if (level.density > 0.5 && rand() < (level.density - 0.5) * 0.4) {
      notes.push({ id: id++, time: Math.round(t), lane: pickLane(lane) });
    }
    if (rand() < level.density * 0.45) {
      const half = t + beat / 2;
      if (half <= lengthMs - END_TRIM_MS)
        notes.push({ id: id++, time: Math.round(half), lane: pickLane() });
    }
  }
  return notes;
}

export type Rating = "perfecto" | "bien" | "regular" | "fallo";

/** Hit windows, in ms either side of the arrow. */
export const PERFECT_MS = 45;
export const GOOD_MS = 90;
export const HIT_WINDOW_MS = 135;

export function judge(offsetMs: number): Rating | null {
  const d = Math.abs(offsetMs);
  if (d <= PERFECT_MS) return "perfecto";
  if (d <= GOOD_MS) return "bien";
  if (d <= HIT_WINDOW_MS) return "regular";
  return null;
}

export const RATING_POINTS: Record<Rating, number> = {
  perfecto: 350,
  bien: 200,
  regular: 50,
  fallo: -10,
};
export const RATING_ENERGY: Record<Rating, number> = {
  perfecto: 4,
  bien: 3,
  regular: 1,
  fallo: -8,
};
export const RATING_LABEL: Record<Rating, string> = {
  perfecto: "Perfecto",
  bien: "Bien",
  regular: "Regular",
  fallo: "Fallo",
};

export const START_ENERGY = 50;

export function nextEnergy(energy: number, rating: Rating): number {
  return Math.max(0, Math.min(100, energy + RATING_ENERGY[rating]));
}

export type Stats = {
  score: number;
  combo: number;
  bestCombo: number;
  counts: Record<Rating, number>;
};

export function emptyStats(): Stats {
  return {
    score: 0,
    combo: 0,
    bestCombo: 0,
    counts: { perfecto: 0, bien: 0, regular: 0, fallo: 0 },
  };
}

export function addRating(stats: Stats, rating: Rating): Stats {
  const combo = rating === "fallo" ? 0 : stats.combo + 1;
  return {
    score: Math.max(0, stats.score + RATING_POINTS[rating]),
    combo,
    bestCombo: Math.max(stats.bestCombo, combo),
    counts: { ...stats.counts, [rating]: stats.counts[rating] + 1 },
  };
}

/** Percentage of arrows hit, weighted by how cleanly. */
export function accuracy(counts: Record<Rating, number>): number {
  const total = counts.perfecto + counts.bien + counts.regular + counts.fallo;
  if (total === 0) return 0;
  const weighted = counts.perfecto + counts.bien * 0.75 + counts.regular * 0.35;
  return Math.round((weighted / total) * 1000) / 10;
}

/** Keyboard keys for each lane: the arrow keys, or D F J K. */
export function laneForKey(key: string): Lane | null {
  switch (key) {
    case "ArrowLeft":
    case "d":
    case "D":
      return 0;
    case "ArrowDown":
    case "f":
    case "F":
      return 1;
    case "ArrowUp":
    case "j":
    case "J":
      return 2;
    case "ArrowRight":
    case "k":
    case "K":
      return 3;
    default:
      return null;
  }
}
