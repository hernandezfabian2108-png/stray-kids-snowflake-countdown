import wolfHappy from "@/assets/stickers/wolf-happy.webp";
import chickHeart from "@/assets/stickers/chick-heart.webp";
import quokkaWink from "@/assets/stickers/quokka-wink.webp";
import puppyWink from "@/assets/stickers/puppy-wink.webp";
import bunnyCarrot from "@/assets/stickers/bunny-carrot.webp";
import foxGift from "@/assets/stickers/fox-gift.webp";

/** Day 5 (Máquina de garra): the user's words, exactly as written. No emojis. */
export const CLAW_TITLE = "Atrapa tu premio";
export const CLAW_SUBTITLE = "Desliza la garra y saca todos los peluches para descubrir la sorpresa final.";
export const CLAW_DROP = "Soltar garra";
export const TICKET_HEADING = "TICKET DORADO - PREMIO MAYOR";
export const TICKET_LETTER: string[] = [
  "Lo lograste. Atrapaste todos los premios, pero el premio más grande de mi vida ya lo gané el día que te conocí.",
  "Esta pequeña dinámica es solo una muestra de cómo intento cada día capturar tu atención, hacerte sonreír y cuidar el lugar que tengo en tu corazón, sin importar los kilómetros ni las pantallas que nos separen. Me encanta escucharte reír, compartir nuestros momentos a distancia y construir esta complicidad tan bonita que tenemos.",
  "Gracias por ser mi equipo, por cada conversación, por acompañarme en mis días y por regalarme la ilusión de un futuro donde por fin estemos frente a frente. Eres mi premio mayor, hoy, mañana y en todos los diciembres que nos esperan.",
];
export const TICKET_SIGN = "— Con todo mi amor, para siempre.";
export const TICKET_BUTTON = "Guardar mi premio";

/** Plushies in the glass. x is the center as % of the glass width; back row sits on top of the pile. */
export type Plush = { id: number; x: number; row: "front" | "back"; img: string };
export const PLUSHIES: Plush[] = [wolfHappy, chickHeart, quokkaWink, puppyWink, bunnyCarrot, foxGift].map(
  (img, i) => ({ id: i, x: 32 + i * 11, row: i % 2 === 0 ? "front" : "back", img }),
);

/** The claw rides the rail between these (% of glass width). The exit chute sits left of CLAW_MIN. */
export const CLAW_MIN = 24;
export const CLAW_MAX = 92;
export const CHUTE_X = 10;
/** How far (in % of glass width) the claw may be from a plush's center and still grab it. */
export const GRAB_TOLERANCE = 4.5;

export const clampClaw = (x: number) => Math.min(CLAW_MAX, Math.max(CLAW_MIN, x));

/** The plush the claw grabs when dropped at x: the closest one still in the glass, if close enough. */
export function findCatch(x: number, caught: readonly number[], plushies = PLUSHIES, tolerance = GRAB_TOLERANCE) {
  let best: Plush | null = null;
  for (const p of plushies) {
    if (caught.includes(p.id)) continue;
    const d = Math.abs(p.x - x);
    if (d <= tolerance && (!best || d < Math.abs(best.x - x))) best = p;
  }
  return best;
}

/** The golden ticket is free once every plush is out. */
export const isTicketFree = (caught: readonly number[], plushies = PLUSHIES) =>
  plushies.every((p) => caught.includes(p.id));

/* ---------- Saved progress (stays on this device) ---------- */

export type Day5Progress = { caught: number[]; saved: boolean };
const KEY = "advent-day5-claw";

export function loadDay5Progress(storage: Pick<Storage, "getItem">): Day5Progress {
  try {
    const raw = JSON.parse(storage.getItem(KEY) ?? "null") as Partial<Day5Progress> | null;
    const ids = new Set(PLUSHIES.map((p) => p.id));
    const caught = Array.isArray(raw?.caught)
      ? [...new Set(raw.caught.filter((n): n is number => typeof n === "number" && ids.has(n)))]
      : [];
    return { caught, saved: raw?.saved === true };
  } catch {
    return { caught: [], saved: false };
  }
}

export function saveDay5Progress(storage: Pick<Storage, "setItem">, progress: Day5Progress) {
  try {
    storage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* private mode: progress just isn't kept */
  }
}
