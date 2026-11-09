import { describe, expect, it } from "vitest";
import { BOOK_PAGES } from "@/components/days/day3-pages";
import { DAY_CONTENT } from "@/components/days";

describe("Day 3 mini book", () => {
  it("has exactly 20 pages after the cover, each with a title and text", () => {
    expect(BOOK_PAGES).toHaveLength(20);
    expect(BOOK_PAGES.every((p) => p.title.length > 0 && p.text.length > 0)).toBe(true);
  });

  it("is what door 3 opens", () => {
    expect(DAY_CONTENT[3]).toBeDefined();
  });
});
