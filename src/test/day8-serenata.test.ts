import { describe, expect, it } from "vitest";
import { SERENATA_LETTER, SERENATA_TITLE, serenadeFinished } from "@/components/days/day8-serenata";

describe("Day 8 serenade", () => {
  it("is not over while the song is still in the middle", () => {
    expect(serenadeFinished({ isPaused: false, position: 60_000, duration: 180_000 }, 60_000)).toBe(false);
  });

  it("is over when the song reaches its end", () => {
    expect(serenadeFinished({ isPaused: false, position: 179_000, duration: 180_000 }, 179_000)).toBe(true);
  });

  it("is over when the 30 second preview stops at its end and jumps back to 0", () => {
    expect(serenadeFinished({ isPaused: true, position: 0, duration: 30_000 }, 28_000)).toBe(true);
  });

  it("is not over when she just pauses halfway", () => {
    expect(serenadeFinished({ isPaused: true, position: 90_000, duration: 180_000 }, 90_000)).toBe(false);
  });

  it("is never over before the song length is known", () => {
    expect(serenadeFinished({ isPaused: true, position: 0, duration: 0 }, 0)).toBe(false);
  });

  it("keeps the user's title and letter word for word", () => {
    expect(SERENATA_TITLE).toBe("Te la dedico");
    expect(SERENATA_LETTER.startsWith("Nuestra historia no necesita magia de película")).toBe(true);
    expect(SERENATA_LETTER.endsWith("siempre se tratan de ti y de mí.")).toBe(true);
  });
});
