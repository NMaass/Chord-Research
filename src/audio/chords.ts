// Basic piano chords: 12 major + 12 minor (sharps only). 24 total.
// Must mirror VALID_CHORDS in worker/index.ts.

export const ROOTS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const MAJOR_CHORDS: string[] = ROOTS.map((r) => r);
export const MINOR_CHORDS: string[] = ROOTS.map((r) => `${r}m`);
export const ALL_CHORDS: string[] = [...MAJOR_CHORDS, ...MINOR_CHORDS];

export const POSSIBLE_PROGRESSIONS = ALL_CHORDS.length ** 4; // 331,776

const ROOT_SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

const MAJOR_TRIAD = [0, 4, 7];
const MINOR_TRIAD = [0, 3, 7];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Returns the frequencies (Hz) for a chord name like "F#" or "Am".
 * Voicing: root position triad in octave 4, plus a bass root in octave 3.
 */
export function chordFrequencies(chord: string): number[] {
  const isMinor = chord.endsWith("m");
  const rootName = isMinor ? chord.slice(0, -1) : chord;
  const semitone = ROOT_SEMITONE[rootName];
  if (semitone === undefined) throw new Error(`unknown chord: ${chord}`);

  const rootMidi = 60 + semitone; // octave 4 (C4 = middle C)
  const triad = (isMinor ? MINOR_TRIAD : MAJOR_TRIAD).map((i) => rootMidi + i);
  const bass = rootMidi - 12;
  return [bass, ...triad].map(midiToFreq);
}
