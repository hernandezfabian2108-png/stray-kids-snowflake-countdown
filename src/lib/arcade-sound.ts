/**
 * Tiny synthesized arcade sounds for the claw machine (no audio files).
 * Uses its own AudioContext, so the radio keeps playing untouched.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function unlockArcadeSound() {
  audio();
}

function tone(a: AudioContext, type: OscillatorType, from: number, to: number, start: number, length: number, volume: number) {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + length);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(g).connect(a.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

/** The motor whirring as the claw goes down. */
export function playDescend() {
  const a = audio();
  if (!a) return;
  tone(a, "triangle", 420, 180, a.currentTime, 0.85, 0.035);
}

/** The claw snapping shut. */
export function playGrab(caught: boolean) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  tone(a, "square", 900, 500, t, 0.08, 0.03);
  if (caught) tone(a, "sine", 660, 990, t + 0.1, 0.25, 0.05);
}

/** A soft plop as the plush lands in the chute. */
export function playPrize() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  [784, 988, 1175].forEach((f, i) => tone(a, "triangle", f, f * 1.01, t + i * 0.08, 0.35, 0.045));
}

/** A bright little fanfare for the golden ticket. */
export function playFanfare() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) =>
    tone(a, "triangle", f, f, t + i * 0.09, 0.9, 0.04),
  );
}
