import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

// Simple grammar-style generator using seeded choices
// Nonterminals: S (start)
// Terminals: N (note), R (rest), U (up), D (down), L (long)
export const GenerativeGrammarEngine: Engine = {
  name: 'generative_grammar',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec;
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));

    // Build a terminal token stream using probabilistic expansions per step
    const tokens: string[] = [];
    for (let i = 0; i < steps; i++) {
      // Expand S -> P | Q
      const chooseP = rand() < 0.6; // bias towards note phrases
      if (chooseP) {
        // P -> N | U N | D N
        const r = rand();
        if (r < 0.5) tokens.push('N');
        else if (r < 0.75) tokens.push('U', 'N');
        else tokens.push('D', 'N');
      } else {
        // Q -> R | N L
        if (rand() < 0.5) tokens.push('R');
        else tokens.push('N', 'L');
      }
    }

    let degreeIdx = Math.floor(rand() * SCALE_PITCHES.length);
    let octave = 0;
    let currentTime = 0;
    let longNext = false;
    const events: NoteEvent[] = [];
    for (let i = 0; i < steps; i++) {
      // Consume tokens to drive state for this step
      while (tokens.length && ['U', 'D'].includes(tokens[0])) {
        const t = tokens.shift();
        if (t === 'U') degreeIdx = Math.min(SCALE_PITCHES.length - 1, degreeIdx + 1);
        if (t === 'D') degreeIdx = Math.max(0, degreeIdx - 1);
      }
      if (tokens[0] === 'L') { longNext = true; tokens.shift(); }
      const action = tokens.shift() ?? 'R';

      if (action === 'R') {
        // rest
      } else if (action === 'N') {
        if (rand() < 0.08) octave += rand() < 0.5 ? -1 : 1; // rare octave movement
        const pitch = basePitch + SCALE_PITCHES[degreeIdx] + octave * 12;
        const durBeats = longNext ? gridBeats * 2 : gridBeats;
        const duration = Math.min(params.durationSecs - currentTime, durBeats * beatDuration);
        const velocity = randomFloat(rand, 0.5, 0.9);
        events.push({ time: currentTime, pitch, duration, velocity });
      }
      longNext = false;
      currentTime += stepSec;
      if (currentTime >= params.durationSecs) break;
    }
    events.sort((a, b) => a.time - b.time);
    return { events };
  }
};
