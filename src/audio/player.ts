// 100 BPM chord player using the Web Audio API.
// Chords change every two beats (1.2s at 100 BPM), with a soft electric-piano-ish voice.

import { chordFrequencies } from "./chords";

export const BPM = 100;
export const BEAT_SECONDS = 60 / BPM;
export const BAR_SECONDS = BEAT_SECONDS * 4;
export const CHORD_SECONDS = BAR_SECONDS / 2;

interface ActivePlayback {
  stop: () => void;
  done: Promise<void>;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: ActivePlayback | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  return ctx;
}

function scheduleNote(
  audio: AudioContext,
  out: GainNode,
  freq: number,
  start: number,
  duration: number,
  velocity: number
) {
  // Main voice: triangle. Shimmer: sine one octave up, quieter.
  const voices: Array<[OscillatorType, number, number]> = [
    ["triangle", freq, velocity],
    ["sine", freq * 2, velocity * 0.25],
  ];

  for (const [type, f, peak] of voices) {
    const osc = audio.createOscillator();
    osc.type = type;
    osc.frequency.value = f;

    const sustain = peak * 0.65;
    const decayEnd = start + Math.min(0.25, duration * 0.35);
    const releaseStart = Math.max(decayEnd, start + duration - 0.12);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(sustain, decayEnd);
    gain.gain.setValueAtTime(sustain, releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
}

/**
 * Play a 4-chord progression at 100 BPM, changing chords every two beats.
 * `onChordStart(index)` fires (approximately) as each chord sounds; -1 at the end.
 * Returns a handle with a stop() and a completion promise.
 */
export function playProgression(
  chords: string[],
  onChordStart?: (index: number) => void
): ActivePlayback {
  stopPlayback();

  const audio = getContext();
  if (audio.state === "suspended") void audio.resume();

  const bus = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.4;
  bus.connect(filter).connect(master!);

  const t0 = audio.currentTime + 0.06;
  const chordDuration = CHORD_SECONDS * 1.02;
  const timers: number[] = [];

  chords.forEach((chord, i) => {
    const start = t0 + i * CHORD_SECONDS;
    const freqs = chordFrequencies(chord);
    freqs.forEach((freq, j) => {
      // bass note a touch louder
      const velocity = j === 0 ? 0.16 : 0.11;
      scheduleNote(audio, bus, freq, start, chordDuration, velocity);
    });
    timers.push(
      window.setTimeout(
        () => onChordStart?.(i),
        Math.max(0, (start - audio.currentTime) * 1000)
      )
    );
  });

  const totalMs =
    (t0 + chords.length * CHORD_SECONDS - audio.currentTime) * 1000;

  let stopFn: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    const endTimer = window.setTimeout(() => {
      onChordStart?.(-1);
      cleanup();
      resolve();
    }, totalMs + 60);
    timers.push(endTimer);

    stopFn = () => {
      timers.forEach(clearTimeout);
      onChordStart?.(-1);
      cleanup();
      resolve();
    };
  });

  function cleanup() {
    // fade the bus out quickly to avoid clicks, then disconnect
    try {
      const now = audio.currentTime;
      bus.gain.setTargetAtTime(0, now, 0.03);
      window.setTimeout(() => bus.disconnect(), 200);
    } catch {
      /* already stopped */
    }
    if (current?.stop === stopFn) current = null;
  }

  const playback: ActivePlayback = { stop: () => stopFn(), done };
  current = playback;
  return playback;
}

export function stopPlayback(): void {
  current?.stop();
  current = null;
}

/** Play a single chord once (picker preview). Independent of any running progression. */
export function previewChord(chord: string): void {
  const audio = getContext();
  if (audio.state === "suspended") void audio.resume();

  const bus = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.4;
  bus.connect(filter).connect(master!);

  const start = audio.currentTime + 0.02;
  const duration = 0.8;
  chordFrequencies(chord).forEach((freq, j) => {
    const velocity = j === 0 ? 0.16 : 0.11;
    scheduleNote(audio, bus, freq, start, duration, velocity);
  });
  window.setTimeout(() => bus.disconnect(), (duration + 0.3) * 1000);
}
