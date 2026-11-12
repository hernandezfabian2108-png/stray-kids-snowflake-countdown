/** Day 7 (Noche de las Velitas): the user's words, exactly as written. */
export const VELITAS_TITLE = "Noche de las Velitas contigo 🕯️✨";
export const VELITAS_TITLE_EMOJI = "🕯️✨";
export const VELITAS_SUBTITLE = "Un deseo por cada momento brillante a tu lado.";

export const VELITAS_LETTER: string[] = [
  "En esta Noche de las Velitas, le pido a Dios que muy pronto podamos prender una vela juntitos. Esta es la primera, el primero de muchos diciembres que nos esperan juntos, encendiendo este fuego pensando en ti.",
  "Si la luna ilumina mis noches y el sol tibia mis días, tu amor es la llama constante que le da calma y color a mi universo.",
  "Deseo muchas bendiciones para nosotros en este 2027, que sigamos compartiendo abrazos infinitos, risas de madrugada y este amor dulcito. Que podamos seguir construyendo momentos así de mágicos. Eres mi lugar seguro y mi estrella favorita.",
];
export const VELITAS_SIGN = "— Con todo mi amor, hoy y siempre.";
export const VELITAS_BUTTON = "Guardar este deseo en el corazón ❤️";

export type Point = { x: number; y: number };

/** How close (in px) the burning match head must get to the wick. */
export const WICK_RADIUS = 38;

/** The candle only catches when the match is burning and its head reaches the wick. */
export function canLightCandle(matchLit: boolean, head: Point, wick: Point, radius = WICK_RADIUS) {
  if (!matchLit) return false;
  return Math.hypot(head.x - wick.x, head.y - wick.y) <= radius;
}
