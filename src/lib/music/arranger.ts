import type { EngineOutput, GenerationParams, NoteEvent } from '@/lib/music/engines/types';
import { mulberry32 } from '@/lib/music/seededRandom';

const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9, // treat as A natural minor
};

// minimal scale info embedded in triad builder

function isMinor(key: string) { return key.toLowerCase().includes('m'); }

function triad(rootMidi: number, minor: boolean): number[] {
  // build scale degrees as pitches around root within an octave
  const deg0 = 0;
  const deg2 = minor ? 3 : 4;
  const deg4 = 7;
  return [rootMidi + deg0, rootMidi + deg2, rootMidi + deg4];
}

function clampPitch(p: number, lo = 36, hi = 84) {
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return p;
}

export function arrange(params: GenerationParams, base: EngineOutput): EngineOutput {
  const bpm = params.bpm;
  const beat = 60 / bpm;
  const minor = isMinor(params.key);
  const keySemi = KEY_TO_SEMITONE[params.key] ?? 0;
  const rootC4 = 60 + keySemi; // root around middle C
  const bars = Math.max(1, Math.floor(params.durationSecs / (4 * beat)));
  const rand = mulberry32(params.seed);

  // Choose a simple chord progression per bar
  const majorProgs = [
    [0, 7, 9, 5], // I V vi IV
    [0, 5, 7, 0], // I IV V I
    [2, 7, 0, 0], // ii V I I
  ];
  const minorProgs = [
    [0, 7, 5, 7], // i VII VI VII
    [0, 5, 7, 0], // i iv v i (approx with majors)
  ];
  const pool = minor ? minorProgs : majorProgs;
  const prog = pool[Math.floor(rand() * pool.length)];

  const arranged: NoteEvent[] = [];

  // Chords (triads), one per bar
  for (let b = 0; b < bars; b++) {
    const degree = prog[b % prog.length];
    const chordRoot = rootC4 + degree;
    const notes = triad(chordRoot, minor).map(p => clampPitch(p, 48, 76));
    const t = b * 4 * beat;
    const dur = Math.min(4 * beat, params.durationSecs - t);
    for (const p of notes) {
      arranged.push({ time: t, pitch: p, duration: dur, velocity: 0.5, track: 'chords' });
    }
  }

  // Bass: root on each beat
  for (let b = 0; b < bars; b++) {
    const degree = prog[b % prog.length];
    const bassRoot = clampPitch(rootC4 + degree - 24, 28, 52);
    for (let beatIdx = 0; beatIdx < 4; beatIdx++) {
      const t = b * 4 * beat + beatIdx * beat;
      if (t >= params.durationSecs) break;
      arranged.push({ time: t, pitch: bassRoot, duration: 0.9 * beat, velocity: 0.7, track: 'bass' });
    }
  }

  // Drums: kick on 1 & 3, snare on 2 & 4, hats 8ths
  for (let b = 0; b < bars; b++) {
    for (let beatIdx = 0; beatIdx < 4; beatIdx++) {
      const t = b * 4 * beat + beatIdx * beat;
      if (t >= params.durationSecs) break;
      if (beatIdx % 2 === 0) {
        arranged.push({ time: t, pitch: 36, duration: 0.22 * beat, velocity: 0.9, track: 'drums' }); // kick
      } else {
        arranged.push({ time: t, pitch: 38, duration: 0.18 * beat, velocity: 0.8, track: 'drums' }); // snare
      }
      // hats every 8th
      const hat1 = t;
      const hat2 = t + beat / 2;
      arranged.push({ time: hat1, pitch: 42, duration: 0.06 * beat, velocity: 0.5, track: 'drums' });
      if (hat2 < params.durationSecs)
        arranged.push({ time: hat2, pitch: 42, duration: 0.05 * beat, velocity: 0.45, track: 'drums' });
    }
  }

  // Lead: adapt base events to sit above chords, if present
  if (base.events?.length) {
    for (const ev of base.events) {
      const p = clampPitch(ev.pitch + 12, 60, 84);
      arranged.push({ ...ev, pitch: p, track: 'lead', duration: Math.max(0.1, Math.min(ev.duration, beat)) });
    }
  }

  arranged.sort((a, b) => a.time - b.time);
  return { events: arranged, meta: { bpm: params.bpm, key: params.key } };
}
