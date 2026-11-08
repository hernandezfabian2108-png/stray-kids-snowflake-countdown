import chickGift from "@/assets/stickers/chick-gift.webp";
import chickHeart from "@/assets/stickers/chick-heart.webp";
import pinkHat from "@/assets/stickers/pink-hat.webp";
import pinkGift from "@/assets/stickers/pink-gift.webp";
import foxGift from "@/assets/stickers/fox-gift.webp";
import quokkaWink from "@/assets/stickers/quokka-wink.webp";
import quokkaMug from "@/assets/stickers/quokka-mug.webp";
import puppyWink from "@/assets/stickers/puppy-wink.webp";
import bunnyCarrot from "@/assets/stickers/bunny-carrot.webp";
import bunnyTree from "@/assets/stickers/bunny-tree.webp";
import wolfHappy from "@/assets/stickers/wolf-happy.webp";
import wolfGift from "@/assets/stickers/wolf-gift.webp";

export const STICKERS = [
  wolfHappy,
  chickHeart,
  pinkHat,
  puppyWink,
  foxGift,
  quokkaWink,
  bunnyCarrot,
  wolfGift,
  chickGift,
  pinkGift,
  quokkaMug,
  bunnyTree,
] as const;

export type Day = {
  day: number;
  sticker: string;
};

/** The 24 doors. Each day's own content gets added to its page later. */
export const DAYS: Day[] = Array.from({ length: 24 }, (_, i) => ({
  day: i + 1,
  sticker: STICKERS[i % STICKERS.length],
}));

export function getDay(value: string): Day | undefined {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 24) return undefined;
  return DAYS[n - 1];
}
