import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

function lsystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let cur = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (const ch of cur) next += rules[ch] ?? ch;
    cur = next;
  }
  return cur;
}

export const LSystemEngine: Engine = {
  name: 'l_system',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec;
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));

    // Simple Fibonacci word L-system: Axiom A, A->AB, B->A
    const pattern = lsystem('A', { A: 'AB', B: 'A' }, 8); // length ~ 55

    let degreeIdx = Math.floor(rand() * SCALE_PITCHES.length);
    let octave = 0;
    const events: NoteEvent[] = [];
    let currentTime = 0;
    for (let i = 0; i < steps; i++) {
      const sym = pattern[i % pattern.length];
      if (sym === 'A') {
        degreeIdx = Math.min(SCALE_PITCHES.length - 1, degreeIdx + 1);
      } else if (sym === 'B') {
        degreeIdx = Math.max(0, degreeIdx - 1);
      }
      if (rand() < 0.1) octave += rand() < 0.5 ? -1 : 1; // occasional octave drift

      const pEmit = Math.min(1, Math.max(0.2, 0.25 + 0.7 * params.density + (sym === 'A' ? 0.05 : -0.05)));
      if (rand() < pEmit) {
        const pitch = basePitch + SCALE_PITCHES[degreeIdx] + octave * 12;
        const durBeats = sym === 'A' && rand() < 0.6 ? gridBeats * 2 : gridBeats;
        const duration = Math.min(params.durationSecs - currentTime, durBeats * beatDuration);
        const velocity = randomFloat(rand, 0.5, 0.9);
        events.push({ time: currentTime, pitch, duration, velocity });
      }
      currentTime += stepSec;
      if (currentTime >= params.durationSecs) break;
    }
    // Ensure chronological order
    events.sort((a, b) => a.time - b.time);
    return { events };
  }
};
