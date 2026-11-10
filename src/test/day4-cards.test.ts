import { describe, expect, it } from "vitest";
import {
  createMemoryDeck,
  DAY4_STORAGE_KEY,
  loadDay4Progress,
  markScratched,
  MEMORY_FACES,
  saveDay4Progress,
  SCRATCH_MESSAGES,
} from "@/components/days/day4-data";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("Day 4 memory game", () => {
  it("deals 8 cards made of 4 SKZOO pairs", () => {
    expect(MEMORY_FACES).toHaveLength(4);
    const deck = createMemoryDeck(MEMORY_FACES.length);
    expect(deck).toHaveLength(8);
    for (let face = 0; face < 4; face++) {
      expect(deck.filter((c) => c.face === face)).toHaveLength(2);
    }
  });
});

describe("Day 4 scratch cards", () => {
  it("has exactly 30 messages, in the user's order and wording", () => {
    expect(SCRATCH_MESSAGES).toHaveLength(30);
    expect(SCRATCH_MESSAGES[0]).toBe(
      "Cada día podemos mejorar; no somos perfectos y ahí está la magia de intentar otra vez.",
    );
    expect(SCRATCH_MESSAGES[29]).toBe(
      "Jamás olvides que tienes un brillo propio y que siempre estoy orgulloso de la persona que eres.",
    );
  });

  it("keeps a scratched card unlocked after leaving and coming back", () => {
    const storage = memoryStorage();
    let progress = loadDay4Progress(storage);
    expect(progress).toEqual({ won: false, scratched: [] });

    progress = markScratched({ ...progress, won: true }, 6);
    saveDay4Progress(storage, progress);

    const again = loadDay4Progress(storage);
    expect(again.won).toBe(true);
    expect(again.scratched).toEqual([6]);
    expect(markScratched(again, 6).scratched).toEqual([6]);
  });

  it("ignores broken saved data instead of crashing", () => {
    const storage = memoryStorage();
    storage.setItem(DAY4_STORAGE_KEY, "{not json");
    expect(loadDay4Progress(storage)).toEqual({ won: false, scratched: [] });
    storage.setItem(DAY4_STORAGE_KEY, JSON.stringify({ won: true, scratched: [2, 99, -1, 2] }));
    expect(loadDay4Progress(storage)).toEqual({ won: true, scratched: [2] });
  });
});
