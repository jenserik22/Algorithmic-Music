import { describe, it, expect } from 'vitest';
import EnhancedHelixEngine from '@/lib/music/engines/enhanced-helix';
import type { GenerationParams, NoteEvent } from '@/lib/music/engines/types';

const baseParams: GenerationParams = {
  seed: 54321,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  durationSecs: 60,
  density: 0.7,
  style: 'edm',
};

function chordBlocks(events: NoteEvent[]) {
  const map = new Map<number, number[]>();
  for (const e of events) {
    if (e.track !== 'chords') continue;
    const t = +e.time.toFixed(3);
    const arr = map.get(t) ?? [];
    arr.push(((e.pitch % 12) + 12) % 12);
    map.set(t, arr);
  }
  const times = Array.from(map.keys()).sort((a,b)=>a-b);
  return { map, times };
}

function findChordAt(t: number, blocks: { map: Map<number, number[]>; times: number[] }) {
  let idx = -1;
  for (let i = 0; i < blocks.times.length; i++) {
    if (blocks.times[i] <= t) idx = i; else break;
  }
  if (idx >= 0) return blocks.map.get(blocks.times[idx]) ?? [];
  return [] as number[];
}

function strongBeatChordToneRate(events: NoteEvent[], bpm: number) {
  const beat = 60 / bpm;
  const sixteenth = beat / 4;
  const tol = 0.05;
  const blocks = chordBlocks(events);
  const lead = events.filter(e => e.track === 'lead').slice().sort((a,b)=>a.time-b.time);
  let total = 0, hit = 0;
  for (const e of lead) {
    const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
    const rel = e.time - barStart;
    const targets = [0, 2*beat];
    let nearest = targets[0];
    if (Math.abs(targets[1]-rel) < Math.abs(nearest-rel)) nearest = targets[1];
    const pos16 = Math.round((e.time - barStart) / sixteenth) % 16;
    const isStrong = Math.abs(nearest - rel) <= tol || pos16 === 0 || pos16 === 8;
    if (!isStrong) continue;
    total++;
    const chord = findChordAt(barStart + nearest, blocks);
    const pc = ((e.pitch % 12) + 12) % 12;
    if (chord.includes(pc)) hit++;
  }
  return total > 0 ? hit / total : 1;
}

describe('EnhancedHelixEngine Phase 8 (evaluation & auto-repair)', () => {
  it('is deterministic with Phase 8 flags on', () => {
    const p: GenerationParams = {
      ...baseParams,
      evaluationStrength: 0.9,
      autoRepairStrength: 0.8,
    };
    const out1 = EnhancedHelixEngine.generate(p);
    const out2 = EnhancedHelixEngine.generate(p);
    expect(out1.events).toEqual(out2.events);
    expect(out1.meta?.versionTag).toBe('v2-phase8');
  });

  it('evaluation only (autoRepairStrength=0) is a no-op on events', () => {
    const evalOnly = EnhancedHelixEngine.generate({ ...baseParams, evaluationStrength: 1, autoRepairStrength: 0 });
    const off = EnhancedHelixEngine.generate({ ...baseParams, evaluationStrength: 0, autoRepairStrength: 0 });
    expect(evalOnly.events).toEqual(off.events);
  });

  it('auto-repair improves strong-beat chord-tone rate (or holds equal)', () => {
    const evalOnly = EnhancedHelixEngine.generate({ ...baseParams, evaluationStrength: 1, autoRepairStrength: 0 });
    const repaired = EnhancedHelixEngine.generate({ ...baseParams, evaluationStrength: 1, autoRepairStrength: 1 });
    const r0 = strongBeatChordToneRate(evalOnly.events, baseParams.bpm);
    const r1 = strongBeatChordToneRate(repaired.events, baseParams.bpm);
    expect(r1).toBeGreaterThanOrEqual(r0 - 1e-6);
  });
});
