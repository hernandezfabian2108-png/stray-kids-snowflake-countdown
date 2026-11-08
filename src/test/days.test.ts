import { describe, expect, it } from "vitest";
import { DAYS, getDay } from "@/lib/days";

describe("Advent doors", () => {
  it("has exactly 24 doors numbered 1 to 24, each with a sticker", () => {
    expect(DAYS).toHaveLength(24);
    expect(DAYS.map((d) => d.day)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(DAYS.every((d) => typeof d.sticker === "string" && d.sticker.length > 0)).toBe(true);
  });

  it("only opens day pages for doors 1 through 24", () => {
    expect(getDay("1")?.day).toBe(1);
    expect(getDay("24")?.day).toBe(24);
    expect(getDay("0")).toBeUndefined();
    expect(getDay("25")).toBeUndefined();
    expect(getDay("abc")).toBeUndefined();
  });
});
