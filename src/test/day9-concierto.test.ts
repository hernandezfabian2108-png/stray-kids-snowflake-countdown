import { describe, expect, it } from "vitest";
import {
  END_TRIM_MS,
  LEAD_IN_MS,
  LEVELS,
  START_ENERGY,
  accuracy,
  addRating,
  emptyStats,
  generateChart,
  judge,
  laneForKey,
  nextEnergy,
} from "@/components/days/day9-concierto";

describe("day 9 concert", () => {
  it("has three levels in the requested order", () => {
    expect(LEVELS.map((l) => l.title)).toEqual(["This & That", "God's Menu", "LALALALA"]);
  });

  it("builds sorted, deterministic charts inside the song", () => {
    for (const level of LEVELS) {
      const chart = generateChart(level, 60_000);
      expect(chart).toEqual(generateChart(level, 60_000));
      expect(chart[0]!.time).toBeGreaterThanOrEqual(LEAD_IN_MS);
      expect(chart.at(-1)!.time).toBeLessThanOrEqual(60_000 - END_TRIM_MS);
      for (let i = 1; i < chart.length; i++)
        expect(chart[i]!.time).toBeGreaterThanOrEqual(chart[i - 1]!.time);
    }
  });

  it("gets denser with each level", () => {
    const counts = LEVELS.map((l) => generateChart(l, 60_000).length / l.bpm);
    expect(counts[0]!).toBeLessThan(counts[1]!);
    expect(counts[1]!).toBeLessThan(counts[2]!);
  });

  it("judges hits by timing", () => {
    expect(judge(10)).toBe("perfecto");
    expect(judge(-70)).toBe("bien");
    expect(judge(120)).toBe("regular");
    expect(judge(200)).toBeNull();
  });

  it("moves energy up on hits and down on misses, within 0..100", () => {
    expect(nextEnergy(START_ENERGY, "perfecto")).toBeGreaterThan(START_ENERGY);
    expect(nextEnergy(START_ENERGY, "fallo")).toBeLessThan(START_ENERGY);
    expect(nextEnergy(2, "fallo")).toBe(0);
    expect(nextEnergy(99, "perfecto")).toBe(100);
  });

  it("scores, tracks combos and accuracy", () => {
    let s = emptyStats();
    s = addRating(s, "perfecto");
    s = addRating(s, "bien");
    s = addRating(s, "fallo");
    expect(s.score).toBe(540);
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(2);
    expect(accuracy(s.counts)).toBe(58.3);
  });

  it("maps arrow keys and DFJK to lanes", () => {
    expect(["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"].map(laneForKey)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(["d", "f", "j", "k"].map(laneForKey)).toEqual([0, 1, 2, 3]);
    expect(laneForKey("x")).toBeNull();
  });
});
