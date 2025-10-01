import { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

const SCALE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

function stepGrid(grid: number[][]): number[][] {
  const h = grid.length, w = grid[0]?.length ?? 0;
  const out = Array.from({ length: h }, () => Array(w).fill(0));
  const dirs = [-1, 0, 1];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let alive = 0;
      for (const dy of dirs) for (const dx of dirs) {
        if (dx === 0 && dy === 0) continue;
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w) alive += grid[ny][nx];
      }
      const cell = grid[y][x];
      out[y][x] = (cell === 1 && (alive === 2 || alive === 3)) || (cell === 0 && alive === 3) ? 1 : 0;
    }
  }
  return out;
}

export const CellularAutomataEngine: Engine = {
  name: 'cellular_automata',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
    const beatsPerSec = params.bpm / 60;
    const beatDuration = 1 / beatsPerSec;
    const gridBeats = params.density > 0.66 ? 0.25 : params.density > 0.33 ? 0.5 : 1;
    const stepSec = gridBeats * beatDuration;
    const steps = Math.max(1, Math.floor(params.durationSecs / stepSec));

    const width = steps; // time axis
    const height = 8; // pitch lanes
    const initProb = 0.4; // keep grid independent of density for deterministic density scaling
    let grid = Array.from({ length: height }, () => Array.from({ length: width }, () => (rand() < initProb ? 1 : 0)));

    // Evolve fixed steps so cell structure is consistent across densities
    const evolve = 3;
    for (let i = 0; i < evolve; i++) grid = stepGrid(grid);

    const events: NoteEvent[] = [];
    for (let x = 0; x < width; x++) {
      const t = x * stepSec;
      if (t >= params.durationSecs) break;
      // For each lane active at this time add a note
      for (let y = 0; y < height; y++) {
        if (grid[y][x] === 1) {
          const pEmit = Math.min(1, Math.max(0.2, 0.2 + 0.7 * params.density));
          if (rand() >= pEmit) continue;
          const degree = SCALE_PITCHES[y % SCALE_PITCHES.length];
          const octave = Math.floor(y / SCALE_PITCHES.length) - 1; // spread around middle C
          const pitch = basePitch + degree + octave * 12;
          const dur = Math.min(params.durationSecs - t, stepSec);
          const velocity = randomFloat(rand, 0.5, 0.85);
          events.push({ time: t, pitch, duration: dur, velocity });
        }
      }
    }
    // Ensure events are sorted by time
    events.sort((a, b) => a.time - b.time);
    return { events };
  }
};
