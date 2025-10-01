import type { EngineOutput, GenerationParams, NoteEvent } from '@/lib/music/engines/types';
import { mulberry32 } from '@/lib/music/seededRandom';

const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9, // treat as A natural minor
};

// minimal scale info
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

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
  const sixteenth = beat / 4;
  const minor = isMinor(params.key);
  const keySemi = KEY_TO_SEMITONE[params.key] ?? 0;
  const rootC4 = 60 + keySemi; // root around middle C
  const bars = Math.max(1, Math.floor(params.durationSecs / (4 * beat)));
  const style = params.style ?? 'edm';
  const variation = Math.max(0, Math.min(1, params.variation ?? 0.4));
  const fillRate = Math.max(0, Math.min(1, params.fillRate ?? 0.5));
  const rand = mulberry32(params.seed);

  const scale = minor ? MINOR : MAJOR;
  const scalePitch = (deg: number, octave: number) => rootC4 + scale[(deg % 7 + 7) % 7] + octave * 12;

  const choose = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const roll = (p: number) => rand() < p;
  const humanizeTime = (t: number) => Math.max(0, t + (rand() - 0.5) * 0.03 * variation); // up to ~15ms
  const humanVel = (v: number) => Math.max(0.05, Math.min(1, v + (rand() - 0.5) * 0.3 * variation));

  // Style-aware banks
  const majorProgs = [
    [0, 7, 9, 5],         // I V vi IV
    [0, 5, 7, 0],         // I IV V I
    [0, 9, 5, 7],         // I vi IV V
    [2, 7, 0, 0],         // ii V I I
  ];
  const minorProgs = [
    [0, 7, 5, 7],         // i VII VI VII
    [0, 5, 7, 0],         // i iv v i
    [0, 3, 5, 7],         // i III iv v
  ];
  const styleBias = style === 'edm' ? 0.6 : style === 'cinematic' ? 0.5 : 0.4;
  const pool = minor ? minorProgs : majorProgs;
  const prog = choose(pool);

  const arranged: NoteEvent[] = [];

  // Section planning: intro (1 bar), A, B, breakdown (1 bar), outro (1 bar)
  const minBars = Math.max(4, bars);
  const introBars = Math.min(1, minBars);
  const outroBars = Math.min(1, Math.max(0, minBars - 1));
  const coreBars = Math.max(2, minBars - introBars - outroBars - 1);
  const aBars = Math.max(2, Math.floor(coreBars * 0.6));
  const bBars = Math.max(2, coreBars - aBars);
  const sections: { name: string; startBar: number; len: number; mute: Partial<Record<'chords'|'bass'|'drums'|'lead', boolean>>; crash: boolean; riserBefore: boolean }[] = [];
  let barPtr = 0;
  sections.push({ name: 'intro', startBar: barPtr, len: introBars, mute: { bass: true, drums: style !== 'jazz' }, crash: true, riserBefore: false }); barPtr += introBars;
  sections.push({ name: 'A', startBar: barPtr, len: aBars, mute: {}, crash: true, riserBefore: false }); barPtr += aBars;
  sections.push({ name: 'B', startBar: barPtr, len: bBars, mute: {}, crash: true, riserBefore: true }); barPtr += bBars;
  sections.push({ name: 'break', startBar: barPtr, len: 1, mute: { chords: true, bass: true }, crash: false, riserBefore: false }); barPtr += 1;
  sections.push({ name: 'outro', startBar: barPtr, len: outroBars, mute: { drums: true }, crash: true, riserBefore: false });

  const tensionAtBar = (b: number) => {
    const pos = b / Math.max(1, minBars - 1);
    // bell-like: build to B then drop for breakdown, slight rise for outro
    const baseCurve = Math.sin(Math.PI * pos);
    return Math.max(0, Math.min(1, baseCurve * (0.5 + 0.5 * variation)));
  };

  // Chords with harmonic rhythm variation (half-bar splits sometimes)
  for (let b = 0; b < minBars; b++) {
    const barStart = b * 4 * beat;
    if (barStart >= params.durationSecs) break;
    const sec = sections.find(s => b >= s.startBar && b < s.startBar + s.len)!;
    if (sec?.mute?.chords) continue;
    const degreeSemi = prog[b % prog.length];
    const chordRoot = rootC4 + degreeSemi;
    const split = roll(0.25 * variation + 0.2 * tensionAtBar(b)); // chance of two chords in bar
    const parts = split ? 2 : 1;
    for (let pIdx = 0; pIdx < parts; pIdx++) {
      const t = barStart + pIdx * (2 * beat);
      const dur = Math.min((split ? 2 * beat : 4 * beat), params.durationSecs - t);
      let chordTrans = chordRoot + (split && pIdx === 1 ? choose([2, -2, 0]) : 0);
      const notes = triad(chordTrans, minor)
        .map(p => clampPitch(p, 48, 76));
      // occasional 7th
      if (roll(0.3 * variation + 0.2 * tensionAtBar(b))) {
        const seventh = minor ? chordTrans + 10 : chordTrans + 11;
        notes.push(clampPitch(seventh, 50, 80));
      }
      for (const p of notes) {
        arranged.push({ time: humanizeTime(t), pitch: p, duration: dur, velocity: humanVel(0.55 + 0.3 * tensionAtBar(b)), track: 'chords' });
      }
    }
  }

  // Bass patterns: root-5th-octave or walking
  for (let b = 0; b < minBars; b++) {
    const barStart = b * 4 * beat;
    if (barStart >= params.durationSecs) break;
    const sec = sections.find(s => b >= s.startBar && b < s.startBar + s.len)!;
    if (sec?.mute?.bass) continue;
    const nextSemi = prog[(b + 1) % prog.length];
    const degreeSemi = prog[b % prog.length];
    const root = clampPitch(rootC4 + degreeSemi - 24, 28, 52);
    const pattern = roll(0.5 + 0.3 * variation) ? 'root5oct' : 'walk';
    if (pattern === 'root5oct') {
      const steps = [root, clampPitch(root + 7, 28, 60), clampPitch(root + 12, 28, 60), root];
      for (let i = 0; i < 4; i++) {
        const t = barStart + i * beat;
        arranged.push({ time: humanizeTime(t), pitch: steps[i], duration: 0.9 * beat, velocity: humanVel(0.7 + 0.2 * tensionAtBar(b)), track: 'bass' });
      }
    } else {
      // walk from root to next root with approach note
      const target = clampPitch(rootC4 + nextSemi - 24, 28, 52);
      const dir = target >= root ? 2 : -2;
      for (let i = 0; i < 4; i++) {
        const t = barStart + i * beat;
        let p = root + i * dir;
        if (i === 3) p = target + (roll(0.5) ? -1 : 0); // approach
        arranged.push({ time: humanizeTime(t), pitch: clampPitch(p, 28, 60), duration: 0.85 * beat, velocity: humanVel(0.65 + 0.2 * tensionAtBar(b)), track: 'bass' });
      }
    }
  }

  // Drum templates (16th grid)
  const drumTemplates = style === 'edm'
    ? { kick: [0, 4, 8, 12], snare: [8], hats: [...Array(16).keys()].filter(i => i % 2 === 0) }
    : style === 'lofi'
    ? { kick: [0, 7, 12], snare: [8], hats: [...Array(16).keys()].filter(i => i % 3 === 0) }
    : style === 'jazz'
    ? { kick: [0], snare: [8], hats: [0, 3, 6, 9, 12, 15] }
    : { kick: [0, 8, 12], snare: [8], hats: [...Array(16).keys()].filter(i => i % 2 === 0) };

  const rotate = (arr: number[], by: number) => arr.map((_, i) => arr[(i + by) % arr.length]);
  const rot = Math.floor(rand() * 4 * variation);
  const kSteps = drumTemplates.kick.map(s => (s + rot) % 16);
  const sSteps = drumTemplates.snare.map(s => (s + rot * 2) % 16);
  const hSteps = drumTemplates.hats.map(s => (s + rot) % 16);

  for (let b = 0; b < minBars; b++) {
    const barStart = b * 4 * beat;
    if (barStart >= params.durationSecs) break;
    const sec = sections.find(s => b >= s.startBar && b < s.startBar + s.len)!;
    const drumsMuted = !!sec?.mute?.drums;
    const isFill = (b + 1) % (roll(0.5) ? 4 : 8) === 0 && roll(fillRate);
    // hats
    for (const step of hSteps) {
      const t = barStart + step * sixteenth;
      if (t >= params.durationSecs) break;
      if (!drumsMuted) arranged.push({ time: humanizeTime(t), pitch: 42, duration: 0.05 * beat, velocity: humanVel((isFill ? 0.6 : 0.45) + 0.2 * tensionAtBar(b)), track: 'drums' });
    }
    // kicks
    for (const step of kSteps) {
      const t = barStart + step * sixteenth;
      if (t >= params.durationSecs) break;
      if (!drumsMuted) arranged.push({ time: humanizeTime(t), pitch: 36, duration: 0.22 * beat, velocity: humanVel(0.9), track: 'drums' });
    }
    // snares + fill roll
    if (isFill) {
      // 16th snare roll last beat
      const start = barStart + 3 * beat;
      for (let i = 0; i < 4; i++) {
        const t = start + i * sixteenth;
        if (t >= params.durationSecs) break;
        if (!drumsMuted) arranged.push({ time: humanizeTime(t), pitch: 38, duration: 0.12 * beat, velocity: humanVel(0.6 + 0.1 * i), track: 'drums' });
      }
    } else {
      for (const step of sSteps) {
        const t = barStart + step * sixteenth;
        if (t >= params.durationSecs) break;
        if (!drumsMuted) arranged.push({ time: humanizeTime(t), pitch: 38, duration: 0.18 * beat, velocity: humanVel(0.75), track: 'drums' });
      }
    }

    // FX: crashes at section starts
    if (sections.some(s => s.startBar === b && s.crash)) {
      arranged.push({ time: barStart, pitch: 49, duration: beat, velocity: 0.9, track: 'fx' });
    }
    // FX: riser before section start that requests it
    const nextSec = sections.find(s => s.startBar === b + 1 && s.riserBefore);
    if (nextSec) {
      const dur = Math.min(2 * beat, params.durationSecs - (barStart + 4 * beat - 2 * beat));
      const start = barStart + 4 * beat - dur;
      if (dur > 0) arranged.push({ time: start, pitch: 91, duration: dur, velocity: 0.7, track: 'fx' });
    }
  }

  // Lead: create motif from base or synthesize
  const useBase = base.events?.length > 0 && roll(0.5 + 0.3 * styleBias);
  if (useBase) {
    for (const ev of base.events) {
      const p = clampPitch(ev.pitch + 12, 60, 84);
      arranged.push({ time: humanizeTime(ev.time), pitch: p, duration: Math.max(0.1, Math.min(ev.duration, beat)), velocity: humanVel(0.7), track: 'lead' });
    }
  } else {
    // motif-based: 2 bars phrase repeated with transforms
    const motifDeg = [0, 2, 4, 5].map(d => (d + Math.floor(rand() * 3) - 1 + 7) % 7);
    const motifRhythm = [0, 2, 4, 6]; // 8th notes start within bar half
    const phrases = Math.ceil(bars / 2);
    for (let ph = 0; ph < phrases; ph++) {
      const barStart = ph * 2 * 4 * beat;
      if (barStart >= params.durationSecs) break;
      const trans = choose([-2, 0, 2]);
      for (let i = 0; i < motifDeg.length; i++) {
        const start = barStart + (i < 2 ? motifRhythm[i] : motifRhythm[i] + 4) * sixteenth;
        const deg = (motifDeg[i] + trans + (roll(0.2 * variation) ? choose([-1, 1]) : 0) + 7) % 7;
        const note = clampPitch(scalePitch(deg, 1), 60, 84);
        arranged.push({ time: humanizeTime(start), pitch: note, duration: 0.35 * beat, velocity: humanVel(0.7), track: 'lead' });
      }
    }
  }

  arranged.sort((a, b) => a.time - b.time);
  const swing = 0.08 * variation;
  return { events: arranged, meta: { bpm: params.bpm, key: params.key, style, variation, swing, lfos: base.meta?.lfos } };
}
