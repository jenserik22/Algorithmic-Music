import { describe, it, expect } from 'vitest';
import EnhancedHelixEngine from '@/lib/music/engines/enhanced-helix';
import type { GenerationParams, NoteEvent } from '@/lib/music/engines/types';

const baseParams: GenerationParams = {
  seed: 99999,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  durationSecs: 32,
  density: 0.7,
  style: 'edm',
};

const favoredHats = new Set([0,4,8,12]);

function hatFavoredFraction(events: NoteEvent[], bpm: number) {
  const beat = 60 / bpm; const sixteenth = beat / 4;
  const hats = events.filter(e => e.track === 'drums' && e.pitch === 42);
  if (hats.length === 0) return 0;
  let cnt = 0;
  for (const e of hats) {
    const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
    const pos = Math.round((e.time - barStart) / sixteenth) % 16;
    if (favoredHats.has(pos)) cnt++;
  }
  return cnt / hats.length;
}

describe('EnhancedHelixEngine Phase 9 (adaptive weighting)', () => {
  it('is deterministic with Phase 9 flags on and fixed profile', () => {
    const profile = { hatPos16: Array.from({ length: 16 }, (_, i) => favoredHats.has(i) ? 10 : 1), leadInterval2: { '1': 5, '-1': 5 } };
    const p: GenerationParams = {
      ...baseParams,
      adaptiveWeightingStrength: 0.8,
      adaptiveProfile: profile,
    };
    const out1 = EnhancedHelixEngine.generate(p);
    const out2 = EnhancedHelixEngine.generate(p);
    expect(out1.events).toEqual(out2.events);
    expect(out1.meta?.versionTag).toBe('v2-phase9');
  });

  it('no-op when strength=0 even if profile provided, and when strength>0 but no profile', () => {
    const baseline = EnhancedHelixEngine.generate({ ...baseParams });
    const withProfileZero = EnhancedHelixEngine.generate({ ...baseParams, adaptiveWeightingStrength: 0, adaptiveProfile: { hatPos16: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] } });
    expect(withProfileZero.events).toEqual(baseline.events);
    const withStrengthNoProfile = EnhancedHelixEngine.generate({ ...baseParams, adaptiveWeightingStrength: 1 });
    expect(withStrengthNoProfile.events).toEqual(baseline.events);
  });

  it('bias profile increases favored hat positions fraction (or holds equal)', () => {
    const baseline = EnhancedHelixEngine.generate({ ...baseParams });
    const r0 = hatFavoredFraction(baseline.events, baseParams.bpm);
    const profile = { hatPos16: Array.from({ length: 16 }, (_, i) => favoredHats.has(i) ? 10 : 0.1) };
    const biased = EnhancedHelixEngine.generate({ ...baseParams, adaptiveWeightingStrength: 1, adaptiveProfile: profile });
    const r1 = hatFavoredFraction(biased.events, baseParams.bpm);
    expect(r1).toBeGreaterThanOrEqual(r0 - 1e-6);
  });
});
