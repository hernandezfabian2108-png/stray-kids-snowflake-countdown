/** Day 8, "Te la dedico": the user's text word for word, plus the serenade rules. */

export const SERENATA_TITLE = "Te la dedico";

export const SERENATA_LETTER =
  "Nuestra historia no necesita magia de película ni mundos lejanos para ser extraordinaria; al final, somos mucho más como Manolo y María, cruzando cualquier distancia, cuidando lo nuestro y sabiendo que no importa el lugar ni el tiempo, porque cada latido y cada página de nuestra vida siempre se tratan de ti y de mí.";

export const SERENATA_DONE = "Completar el Día 8";

/** The song the user chose, on Spotify. */
export const SERENATA_TRACK_URI = "spotify:track:5I0aHj2JSQpoxSQnh3XcjO";

/** How close to the end (ms) counts as "the song is over". */
export const END_MARGIN_MS = 1500;
/** If the song never starts playing (blocked or offline), the letter still arrives after this long. */
export const NO_AUDIO_LETTER_MS = 35_000;
/** Time she gets to read the letter before the final button turns on. */
export const READ_LETTER_MS = 6_000;

export type Playback = { isPaused: boolean; position: number; duration: number };

/**
 * True once the serenade is over: the song reached its end, or it stopped
 * after having played almost to the end (Spotify sometimes jumps back to 0).
 * `furthest` is the furthest position heard so far, in ms.
 */
export function serenadeFinished(p: Playback, furthest: number): boolean {
  if (!(p.duration > 0)) return false;
  const end = p.duration - END_MARGIN_MS;
  if (p.position >= end) return true;
  const nearlyDone = furthest >= p.duration - END_MARGIN_MS * 2;
  return nearlyDone && (p.isPaused || p.position < furthest - 5000);
}
