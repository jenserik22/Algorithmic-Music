import type { Engine, EngineOutput, GenerationParams, NoteEvent, LfoSpec } from './types';
import { mulberry32 } from '@/lib/music/seededRandom';

type SongConfig = {
  sections: { name: string; bars: number; density: number; crash?: boolean; riserBefore?: boolean }[];
  scale: 'aeolian' | 'ionian';
  register: { lead: [number, number] };
};

const TEMPLATES: Record<NonNullable<GenerationParams['style']>, SongConfig> = {
  edm: {
    sections: [
      { name: 'intro', bars: 2, density: 0.4 },
      { name: 'A', bars: 8, density: 0.8, crash: true },
      { name: 'B', bars: 8, density: 1.0, crash: true, riserBefore: true },
      { name: 'outro', bars: 2, density: 0.5 },
    ],
    scale: 'aeolian',
    register: { lead: [60, 84] },
  },
  cinematic: {
    sections: [
      { name: 'intro', bars: 4, density: 0.3 },
      { name: 'A', bars: 8, density: 0.6 },
      { name: 'B', bars: 8, density: 0.8, riserBefore: true },
      { name: 'outro', bars: 4, density: 0.4 },
    ],
    scale: 'aeolian',
    register: { lead: [58, 82] },
  },
  lofi: {
    sections: [
      { name: 'A', bars: 8, density: 0.5 },
      { name: 'B', bars: 8, density: 0.6 },
    ],
    scale: 'aeolian',
    register: { lead: [57, 81] },
  },
  jazz: {
    sections: [
      { name: 'intro', bars: 2, density: 0.5 },
      { name: 'A', bars: 8, density: 0.8 },
      { name: 'B', bars: 8, density: 0.9 },
    ],
    scale: 'ionian',
    register: { lead: [62, 86] },
  },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9,
};

function clampPitch(p: number, lo = 36, hi = 84) {
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return p;
}

function makeLfos(params: GenerationParams): LfoSpec[] | undefined {
  const motion = Math.max(0, Math.min(1, params.motion ?? 0));
  if (motion <= 0.01) return undefined;
  const arr: LfoSpec[] = [];
  const shape: LfoSpec['shape'] = 'triangle';
  arr.push({ target: 'track:lead.filterCutoff', rate: '1m', depth: motion, min: 400, max: 6000, shape });
  arr.push({ target: 'master.brightness', rate: '4m', depth: motion * 0.8, min: 800, max: 9000, shape: 'sine' });
  // gentle stereo motion for chords
  arr.push({ target: 'track:chords.pan', rate: '2m', depth: motion * 0.5, min: -0.3, max: 0.3, shape: 'sine' });
  return arr;
}

export const HelixEngine: Engine = {
  name: 'helix',
  generate(params: GenerationParams): EngineOutput {
    const seed = params.seed ?? 1;
    const rand = mulberry32(seed);
    const style = params.style ?? 'edm';
    const cfg = TEMPLATES[style];
    const bpm = params.bpm;
    const beat = 60 / bpm;
    const sixteenth = beat / 4;
    const keySemi = KEY_TO_SEMITONE[params.key] ?? 0;
    const rootC4 = 60 + keySemi;
    const scale = cfg.scale === 'aeolian' ? MINOR : MAJOR;
    const scalePitch = (deg: number, octave: number) => rootC4 + scale[(deg % 7 + 7) % 7] + 12 * octave;
    const bars = Math.max(1, Math.floor(params.durationSecs / (4 * beat)));

    const complexity = params.complexityLevel ?? 'intermediate';
    const leaps = complexity === 'simple' ? 1 : complexity === 'intermediate' ? 2 : complexity === 'full' ? 3 : 4;
    const density = Math.max(0, Math.min(1, params.density));

    const motifLen = 8; // 8 notes per 2 bars (mostly 8ths)
    const motif: number[] = [];
    let curDeg = (rand() * 7) | 0;
    for (let i = 0; i < motifLen; i++) {
      const step = (Math.floor(rand() * (2 * leaps + 1)) - leaps);
      curDeg = (curDeg + step + 7) % 7;
      motif.push(curDeg);
    }

    const events: NoteEvent[] = [];
    let time = 0;
    const total16ths = bars * 16;
    for (let i = 0; i < total16ths; i++) {
      if (rand() < (0.5 + 0.5 * density)) {
        const idx = i % motifLen;
        const deg = motif[idx];
        const note = clampPitch(scalePitch(deg, 1), cfg.register.lead[0], cfg.register.lead[1]);
        const dur = (rand() < 0.15 ? 0.5 : 0.25) * beat;
        events.push({ time, pitch: note, duration: dur, velocity: 0.75, track: 'lead' });
      }
      time += sixteenth;
      if (time >= params.durationSecs) break;
    }

    const out: EngineOutput = { events, meta: { bpm: params.bpm, key: params.key, variation: params.variation, lfos: makeLfos(params) } };
    return out;
  },
};

export default HelixEngine;
