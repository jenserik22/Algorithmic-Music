import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11]; // Major
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

// Build a simple Markov transition matrix favoring small steps on the scale
function buildTransition(n: number, stayBias = 0.2) {
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dist = Math.abs(j - i);
      const weight = dist === 0 ? stayBias : 1 / (dist + 1);
      matrix[i][j] = weight;
    }
    // normalize
    const sum = matrix[i].reduce((a, b) => a + b, 0);
    for (let j = 0; j < n; j++) matrix[i][j] /= sum;
  }
  return matrix;
}

function pickIndex(rand: () => number, probs: number[]): number {
  let r = rand();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}

export const MarkovEngine: Engine = {
  name: 'markov',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0); // C4 base
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec;
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));

    const transition = buildTransition(SCALE_PITCHES.length, 0.25);
    let degreeIdx = Math.floor(rand() * SCALE_PITCHES.length);
    let octave = 0;

    const events: NoteEvent[] = [];
    let currentTime = 0;
    for (let i = 0; i < steps; i++) {
      if (rand() < Math.max(0.2, params.density)) {
        // choose next degree
        degreeIdx = pickIndex(rand, transition[degreeIdx]);
        // occasional small octave move with low probability
        if (rand() < 0.1) octave += rand() < 0.5 ? -1 : 1;
        const pitch = basePitch + SCALE_PITCHES[degreeIdx] + octave * 12;
        const durBeats = gridBeats * (rand() < 0.7 ? 1 : 2);
        const duration = Math.min(params.durationSecs - currentTime, durBeats * beatDuration);
        const velocity = randomFloat(rand, 0.55, 0.9);
        events.push({ time: currentTime, pitch, duration, velocity });
      }
      currentTime += stepSec;
      if (currentTime >= params.durationSecs) break;
    }
    return { events };
  }
};
