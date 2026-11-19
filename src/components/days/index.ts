import type { ComponentType } from "react";
import { Day1 } from "./Day1";
import { Day2 } from "./Day2";
import { Day3 } from "./Day3";
import { Day4 } from "./Day4";
import { Day5 } from "./Day5";
import { Day6 } from "./Day6";
import { Day7 } from "./Day7";
import { Day8 } from "./Day8";
import { Day9 } from "./Day9";

/** What appears behind each door, by day number. Days without an entry show only their sticker. */
export const DAY_CONTENT: Partial<Record<number, ComponentType>> = {
  1: Day1,
  2: Day2,
  3: Day3,
  4: Day4,
  5: Day5,
  6: Day6,
  7: Day7,
  8: Day8,
  9: Day9,
};
