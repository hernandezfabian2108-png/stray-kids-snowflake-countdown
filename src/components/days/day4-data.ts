import wolfHappy from "@/assets/stickers/wolf-happy.webp";
import chickGift from "@/assets/stickers/chick-gift.webp";
import foxGift from "@/assets/stickers/fox-gift.webp";
import quokkaWink from "@/assets/stickers/quokka-wink.webp";

/** The four SKZOO faces (all wearing Santa hats) used for the memory pairs. */
export const MEMORY_FACES: string[] = [wolfHappy, chickGift, foxGift, quokkaWink];

/** The 30 scratch-off cards, word for word as the user wrote them. */
export const SCRATCH_MESSAGES: string[] = [
  "Cada día podemos mejorar; no somos perfectos y ahí está la magia de intentar otra vez.",
  "Así haya un 99% de cosas negativas en contra, concéntrate siempre en ese 1% de posibilidad positiva.",
  "No le pidas al cielo días sin nubes; solo aprende a disfrutar el ritmo con el que cae la lluvia.",
  "Hasta la noche más larga y oscura siempre termina por darle paso a un nuevo amanecer.",
  "Tu ritmo es perfecto; no te compares con el reloj de nadie más en este mundo.",
  "A veces las cosas no salen como esperabas porque vienen mejores de las que imaginabas.",
  "Un tropiezo no es una caída; solo es un impulso para agarrar más vuelo hacia adelante.",
  "Los días grises también son necesarios para que el verde de los bosques vuelva a brillar.",
  "Mantén la calma: hasta los senderos más enredados te llevan a vistas increíbles.",
  "Eres mucho más fuerte de lo que te dices a ti misma en tus momentos de duda.",
  "Ninguna tormenta se queda a vivir para siempre en el mismo cielo; todo pasa.",
  "La constancia le gana a la suerte todos los días de la semana sin excepción.",
  "Enfócate en lo lejos que has llegado, no en lo que todavía sientes que te falta por recorrer.",
  "Agradece lo que hoy tienes mientras sigues trabajando con amor por lo que sueñas.",
  "Un mal día de hoy no significa para nada que vayas a tener una mala vida mañana.",
  "La luz más bonita es la que mantienes encendida por dentro cuando afuera todo está a oscuras.",
  "Aprender a soltar lo que no puedes controlar es el regalo de paz más grande que te puedes dar.",
  "Confía en tu proceso, en tus capacidades y en la paciencia con la que construyes todo.",
  "Pequeños pasos dados con constancia todos los días construyen los cambios más gigantescos.",
  "Si te cansas, aprende a descansar y a tomar un respiro, pero nunca a rendirte.",
  "Tu valor no cambia por la opinión de personas que no conocen tu camino completo.",
  "Todo el esfuerzo silencioso que haces a diario tarde o temprano da sus mejores frutos.",
  "Sonríe: a veces esa pequeña pausa es la respuesta exacta que tu mente estaba necesitando.",
  "No busques perfección; busca paz, tranquilidad y ser fiel a lo que tú sientes por dentro.",
  "Recuerda que hasta el árbol más alto y fuerte empezó siendo apenas una pequeña semilla.",
  "La actitud con la que recibes cada mañana define la dirección de todo lo que te sucede.",
  "Si hoy solo pudiste dar un paso pequeño, celébralo igual de fuerte que si hubieras dado diez.",
  "Valora los detalles cotidianos; en las cosas más sencillas es donde vive la felicidad real.",
  "Eres un trabajo en progreso constante, y la versión en la que te estás convirtiendo es hermosa.",
  "Jamás olvides que tienes un brillo propio y que siempre estoy orgulloso de la persona que eres.",
];

export type MemoryCard = { id: number; face: number };

/** Two cards per face, shuffled (Fisher–Yates). */
export function createMemoryDeck(pairs: number, random: () => number = Math.random): MemoryCard[] {
  const cards: MemoryCard[] = Array.from({ length: pairs * 2 }, (_, i) => ({
    id: i,
    face: i % pairs,
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

/* ---------- Saved progress (stays on this device for the whole month) ---------- */

export type Day4Progress = { won: boolean; scratched: number[] };

export const DAY4_STORAGE_KEY = "calendario-adviento:dia4";
const EMPTY: Day4Progress = { won: false, scratched: [] };

export function loadDay4Progress(storage: Pick<Storage, "getItem"> | undefined): Day4Progress {
  try {
    const raw = storage?.getItem(DAY4_STORAGE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<Day4Progress>;
    const scratched = Array.isArray(data.scratched)
      ? data.scratched.filter(
          (n): n is number =>
            Number.isInteger(n) && n >= 0 && n < SCRATCH_MESSAGES.length,
        )
      : [];
    return { won: data.won === true, scratched: [...new Set(scratched)].sort((a, b) => a - b) };
  } catch {
    return EMPTY;
  }
}

export function saveDay4Progress(storage: Pick<Storage, "setItem"> | undefined, progress: Day4Progress) {
  try {
    storage?.setItem(DAY4_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable (private mode); the cards still work for this visit.
  }
}

/** A scratched card stays unlocked: adding it again changes nothing. */
export function markScratched(progress: Day4Progress, index: number): Day4Progress {
  if (progress.scratched.includes(index)) return progress;
  return { ...progress, scratched: [...progress.scratched, index].sort((a, b) => a - b) };
}
