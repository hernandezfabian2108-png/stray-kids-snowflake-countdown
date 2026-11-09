import type { ComponentType } from "react";
import { Day1 } from "./Day1";
import { Day2 } from "./Day2";
import { Day3 } from "./Day3";

/** What appears behind each door, by day number. Days without an entry show only their sticker. */
export const DAY_CONTENT: Partial<Record<number, ComponentType>> = {
  1: Day1,
  2: Day2,
  3: Day3,
};
