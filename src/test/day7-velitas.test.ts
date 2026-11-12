import { describe, expect, it } from "vitest";
import { canLightCandle, VELITAS_LETTER, WICK_RADIUS } from "@/components/days/day7-velitas";

describe("Day 7 candle", () => {
  const wick = { x: 100, y: 100 };

  it("never lights with an unlit match, even right on the wick", () => {
    expect(canLightCandle(false, { x: 100, y: 100 }, wick)).toBe(false);
  });

  it("lights when the burning match head reaches the wick", () => {
    expect(canLightCandle(true, { x: 110, y: 90 }, wick)).toBe(true);
  });

  it("does not light while the burning match is still far away", () => {
    expect(canLightCandle(true, { x: 100 + WICK_RADIUS + 20, y: 100 }, wick)).toBe(false);
  });

  it("keeps the letter as the user's three paragraphs", () => {
    expect(VELITAS_LETTER).toHaveLength(3);
    expect(VELITAS_LETTER[0]).toMatch(/^En esta Noche de las Velitas/);
    expect(VELITAS_LETTER[2]).toMatch(/mi estrella favorita\.$/);
  });
});
