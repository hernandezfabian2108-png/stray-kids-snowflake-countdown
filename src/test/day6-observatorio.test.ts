import { describe, expect, it } from "vitest";
import {
  clampCaught,
  counterLabel,
  isInLens,
  loadCaught,
  OBS_LETTER,
  saveCaught,
  WISHES,
} from "@/components/days/day6-observatorio";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe("Day 6 observatory", () => {
  it("has exactly five wishes, in the user's order", () => {
    expect(WISHES.map((w) => w.title)).toEqual([
      "La búsqueda del amor real",
      "El anhelo de la mujer soñada",
      "El deseo de construir en equipo",
      "La certeza de valorarla",
      "La respuesta y el agradecimiento",
    ]);
    expect(WISHES[0]!.text).toMatch(/^Dios, permíteme conocer/);
    expect(WISHES[4]!.text).toMatch(/hoy ese deseo está aquí, leyendo esto\.$/);
  });

  it("shows the counter as 'Estrellas capturadas: n de 5'", () => {
    expect(counterLabel(0)).toBe("Estrellas capturadas: 0 de 5");
    expect(counterLabel(3)).toBe("Estrellas capturadas: 3 de 5");
    expect(counterLabel(9)).toBe("Estrellas capturadas: 5 de 5");
  });

  it("catches a star only when it is inside the lens", () => {
    expect(isInLens({ x: 100, y: 100 }, { x: 130, y: 120 }, 50)).toBe(true);
    expect(isInLens({ x: 100, y: 100 }, { x: 170, y: 100 }, 50)).toBe(false);
  });

  it("remembers caught stars on the device and never goes past five", () => {
    const s = memory();
    expect(loadCaught(s)).toBe(0);
    saveCaught(s, 3);
    expect(loadCaught(s)).toBe(3);
    saveCaught(s, 12);
    expect(loadCaught(s)).toBe(5);
    expect(clampCaught(-2)).toBe(0);
  });

  it("keeps the final letter word for word", () => {
    expect(OBS_LETTER).toMatch(/^Durante mucho tiempo pensé/);
    expect(OBS_LETTER).toMatch(/lo que antes solo vivía en mis sueños\.$/);
  });
});
