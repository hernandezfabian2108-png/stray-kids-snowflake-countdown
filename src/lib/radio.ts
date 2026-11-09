/** YouTube playlist that feeds the Radio SKZ (day 2). */
export const RADIO_PLAYLIST_ID = "PL2HLJ87twWI3H5CwvG_xTOiHJ-muq8vrq";

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
