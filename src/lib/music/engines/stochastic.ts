import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomInt, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11]; // Major scale pattern
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

export const StochasticEngine: Engine = {
  name: 'stochastic',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const events: NoteEvent[] = [];
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0); // C4 base
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec; // seconds per beat
    // Choose a grid based on density: higher density → shorter notes
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));
    let currentTime = 0;
    for (let i = 0; i < steps; i++) {
      // Randomly decide to place a note based on density
      if (rand() < Math.max(0.15, params.density)) {
        const degree = SCALE_PITCHES[randomInt(rand, 0, SCALE_PITCHES.length - 1)];
        const octave = randomInt(rand, -1, 1); // allow slight octave movement
        const pitch = basePitch + degree + octave * 12;
        const durBeats = [gridBeats, gridBeats * 2][randomInt(rand, 0, 1)];
        const duration = Math.min(params.durationSecs - currentTime, durBeats * beatDuration);
        const velocity = randomFloat(rand, 0.5, 0.9);
        events.push({ time: currentTime, pitch, duration, velocity });
      }
      currentTime += stepSec;
      if (currentTime >= params.durationSecs) break;
    }
    return { events };
  }
};
