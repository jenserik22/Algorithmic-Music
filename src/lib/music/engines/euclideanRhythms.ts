import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

function bjorklund(steps: number, pulses: number): number[] {
  if (pulses <= 0) return Array(steps).fill(0);
  if (pulses >= steps) return Array(steps).fill(1);
  const pattern: number[] = [];
  const counts: number[] = [];
  const remainders: number[] = [];
  let divisor = steps - pulses;
  remainders.push(pulses);
  let level = 0;
  let continueLoop = true;
  while (continueLoop) {
    counts.push(Math.floor(divisor / remainders[level]));
    const remainder = divisor % remainders[level];
    remainders.push(remainder);
    level++;
    continueLoop = remainders[level] > 1;
    if (!continueLoop) break;
    divisor = remainders[level - 1];
  }
  counts.push(divisor);

  const build = (l: number) => {
    if (l === -1) pattern.push(0);
    else if (l === -2) pattern.push(1);
    else {
      for (let i = 0; i < counts[l]; i++) build(l - 1);
      if (remainders[l] !== 0) build(l - 2);
    }
  };
  build(level);
  return pattern.slice(0, steps);
}

export const EuclideanRhythmsEngine: Engine = {
  name: 'euclidean',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec;
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));

    const pulses = Math.max(0, Math.min(steps, Math.floor(steps * Math.max(0.05, params.density))))
      || (params.density > 0 ? 1 : 0);
    let pattern = bjorklund(steps, pulses);
    // rotate by seeded amount for variation
    const rot = Math.floor(rand() * steps);
    pattern = pattern.map((_, i) => pattern[(i + rot) % steps]);

    let degreeIdx = Math.floor(rand() * SCALE_PITCHES.length);
    let octave = 0;
    const events: NoteEvent[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i * stepSec;
      if (t >= params.durationSecs) break;
      if (pattern[i] === 1) {
        if (rand() < 0.5) degreeIdx = (degreeIdx + 1) % SCALE_PITCHES.length;
        if (rand() < 0.1) octave += rand() < 0.5 ? -1 : 1;
        const pitch = basePitch + SCALE_PITCHES[degreeIdx] + octave * 12;
        const duration = Math.min(params.durationSecs - t, stepSec);
        const velocity = randomFloat(rand, 0.55, 0.9);
        events.push({ time: t, pitch, duration, velocity });
      }
    }
    return { events };
  }
};
