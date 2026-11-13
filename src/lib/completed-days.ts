/** Days she has finished (for example after saving the day 5 prize). Kept on this device. */
const KEY = "advent-completed-days";
export const COMPLETED_EVENT = "advent-completed-days";

export function loadCompletedDays(storage: Pick<Storage, "getItem">): number[] {
  try {
    const raw = JSON.parse(storage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 24) : [];
  } catch {
    return [];
  }
}

export function markDayCompleted(storage: Pick<Storage, "getItem" | "setItem">, day: number): number[] {
  const days = loadCompletedDays(storage);
  if (days.includes(day)) return days;
  const next = [...days, day].sort((a, b) => a - b);
  try {
    storage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
