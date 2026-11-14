/** Day 6, El Observatorio de los Deseos: the user's text, kept word for word. */

export const OBS_TITLE = "El Observatorio de los Deseos";

export const OBS_INTRO =
  "Antes de que llegaras a mi vida, hubo muchas noches en las que miré hacia arriba pidiendo respuestas sin saber tu nombre. Cada estrella fugaz que cruza este observatorio guarda una de esas intenciones que pedí en silencio. Usa el telescopio para capturar las cinco estrellas y descubrir lo que alguna vez le pedí al cielo.";

export const OBS_START = "Mirar por el telescopio";

export type Wish = { label: string; title: string; text: string };

export const WISHES: Wish[] = [
  {
    label: "Primera Estrella",
    title: "La búsqueda del amor real",
    text: "Dios, permíteme conocer eso que tanto las personas llaman amor. Yo quiero sentir algo así de real, algo que me transforme y me haga entender por qué todos hablan de ello.",
  },
  {
    label: "Segunda Estrella",
    title: "El anhelo de la mujer soñada",
    text: "Permíteme conocer a la mujer con la que tanto sueño. Todavía no tiene rostro ni nombre, pero la imagino todos los días y sé en mi corazón que existe. Solo dime dónde encontrarla.",
  },
  {
    label: "Tercera Estrella",
    title: "El deseo de construir en equipo",
    text: "Cuando la encuentre, quiero que formemos un equipo de verdad. Que seamos dos personas construyendo juntos, sosteniéndonos en los días difíciles y celebrando cada paso que demos.",
  },
  {
    label: "Cuarta Estrella",
    title: "La certeza de valorarla",
    text: "Que el día que por fin llegue a mi vida, yo tenga la claridad suficiente para cuidarla, valorarla y nunca dar por sentado el milagro de haber coincidido con ella.",
  },
  {
    label: "Quinta Estrella",
    title: "La respuesta y el agradecimiento",
    text: "Ahora que ya te tengo, le doy gracias a Dios todos los días. Todos mis deseos de cumpleaños, cada estrella fugaz que miré y todos los 11:11 que alguna vez pedí en silencio... hoy ese deseo está aquí, leyendo esto.",
  },
];

export const OBS_LETTER =
  "Durante mucho tiempo pensé que pedir un deseo era simplemente lanzar palabras al aire esperando un milagro. Hoy entiendo que cada una de esas oraciones y cada 11:11 me estaban preparando para coincidir contigo. Tú eres la respuesta exacta a todo lo que alguna vez pedí sin saber cómo se sentía amar de verdad. Gracias por llegar, por quedarte y por hacer realidad lo que antes solo vivía en mis sueños.";

export const STAR_GOAL = WISHES.length;

export const counterLabel = (caught: number) =>
  `Estrellas capturadas: ${clampCaught(caught)} de ${STAR_GOAL}`;

export function clampCaught(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(STAR_GOAL, Math.floor(n))) : 0;
}

export type Point = { x: number; y: number };

/** The lens catches a shooting star when its head is inside the lens circle. */
export function isInLens(lens: Point, star: Point, radius: number): boolean {
  return Math.hypot(lens.x - star.x, lens.y - star.y) <= radius;
}

/** Where the five caught stars settle, in a 320 x 200 box, in the order they were caught. */
export const CONSTELLATION: Point[] = [
  { x: 36, y: 140 },
  { x: 104, y: 62 },
  { x: 170, y: 118 },
  { x: 238, y: 42 },
  { x: 288, y: 132 },
];

const KEY = "advent-day6-observatory";

export function loadCaught(storage: Pick<Storage, "getItem">): number {
  try {
    return clampCaught(JSON.parse(storage.getItem(KEY) ?? "{}")?.caught);
  } catch {
    return 0;
  }
}

export function saveCaught(storage: Pick<Storage, "setItem">, caught: number) {
  try {
    storage.setItem(KEY, JSON.stringify({ caught: clampCaught(caught) }));
  } catch {
    /* ignore */
  }
}
