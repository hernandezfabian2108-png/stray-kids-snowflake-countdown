/**
 * Tiny synthesized sounds for the candle (no audio files, nothing to load).
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

/** Call from a tap so browsers allow sound later. */
export function unlockCandleSound() {
  audio();
}

function noise(a: AudioContext, seconds: number) {
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  return src;
}

/** A short scratch, like striking a match. */
export function playStrike() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const src = noise(a, 0.35);
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(3200, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.3);
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
  src.stop(t + 0.35);
}

/** A soft whoosh of flame and a little chime. */
export function playIgnite() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;

  const src = noise(a, 0.8);
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
  filter.frequency.exponentialRampToValueAtTime(400, t + 0.75);
  const whoosh = a.createGain();
  whoosh.gain.setValueAtTime(0.0001, t);
  whoosh.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
  whoosh.gain.exponentialRampToValueAtTime(0.0001, t + 0.78);
  src.connect(filter).connect(whoosh).connect(a.destination);
  src.start(t);
  src.stop(t + 0.8);

  [1318.5, 1975.5, 2637].forEach((freq, i) => {
    const start = t + 0.12 + i * 0.09;
    const osc = a.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
    osc.connect(g).connect(a.destination);
    osc.start(start);
    osc.stop(start + 1.7);
  });
}

/** A gentle sparkle run for the wish button. */
export function playSparkle() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  [1046.5, 1318.5, 1568, 2093, 2637].forEach((freq, i) => {
    const start = t + i * 0.07;
    const osc = a.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.04, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    osc.connect(g).connect(a.destination);
    osc.start(start);
    osc.stop(start + 1);
  });
}
