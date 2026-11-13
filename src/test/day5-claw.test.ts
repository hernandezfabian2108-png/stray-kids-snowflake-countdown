import { describe, expect, it } from "vitest";
import {
  CLAW_MAX,
  CLAW_MIN,
  clampClaw,
  findCatch,
  GRAB_TOLERANCE,
  isTicketFree,
  loadDay5Progress,
  PLUSHIES,
  saveDay5Progress,
  TICKET_LETTER,
  TICKET_SIGN,
} from "@/components/days/day5-claw";
import { loadCompletedDays, markDayCompleted } from "@/lib/completed-days";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe("Day 5 claw machine", () => {
  const first = PLUSHIES[0]!;

  it("grabs the plush the claw is right above", () => {
    expect(findCatch(first.x, [])?.id).toBe(first.id);
  });

  it("misses when the claw is too far from every plush", () => {
    expect(findCatch(first.x - GRAB_TOLERANCE - 1, [])).toBeNull();
  });

  it("never grabs a plush that was already taken out", () => {
    expect(findCatch(first.x, [first.id])).toBeNull();
  });

  it("keeps the claw on its rail", () => {
    expect(clampClaw(0)).toBe(CLAW_MIN);
    expect(clampClaw(200)).toBe(CLAW_MAX);
  });

  it("frees the golden ticket only after every plush is out", () => {
    const all = PLUSHIES.map((p) => p.id);
    expect(isTicketFree(all.slice(1))).toBe(false);
    expect(isTicketFree(all)).toBe(true);
  });

  it("every plush can be reached by the claw", () => {
    for (const p of PLUSHIES) expect(findCatch(clampClaw(p.x), [])?.id).toBe(p.id);
  });

  it("remembers caught plushies and the saved prize", () => {
    const s = memory();
    saveDay5Progress(s, { caught: [0, 2], saved: true });
    expect(loadDay5Progress(s)).toEqual({ caught: [0, 2], saved: true });
  });

  it("keeps the letter as the user's three paragraphs without emojis", () => {
    expect(TICKET_LETTER).toHaveLength(3);
    expect(TICKET_LETTER[0]).toMatch(/^Lo lograste\./);
    expect(TICKET_SIGN).toBe("— Con todo mi amor, para siempre.");
    expect([...TICKET_LETTER, TICKET_SIGN].join(" ")).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("marks day 5 as completed once", () => {
    const s = memory();
    markDayCompleted(s, 5);
    markDayCompleted(s, 5);
    expect(loadCompletedDays(s)).toEqual([5]);
  });
});
