import { describe, test, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

function continuityRatio(events: any[], beat: number, bars: number) {
  const sixteenth = beat / 4;
  let cont = 0;
  let hats = 0;
  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * 4 * beat;
    const present = new Array(16).fill(false);
    const slice = events.filter(e => e.track === 'drums' && e.pitch === 42 && e.time >= barStart && e.time < barStart + 4 * beat);
    for (const e of slice) {
      const idx = Math.round((e.time - barStart) / sixteenth) % 16;
      present[idx] = true;
    }
    for (let i = 0; i < 15; i++) {
      if (present[i]) {
        hats++;
        if (present[i + 1]) cont++;
      }
    }
  }
  return hats > 0 ? cont / hats : 0;
}

describe('Enhanced Helix - Rhythm Markov hats', () => {
  test('increasing rhythmMarkovStrength increases hat adjacency continuity', () => {
    const engine = getEngine('enhanced_helix');
    const base: GenerationParams = {
      seed: 4242,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 16,
      density: 0.7,
      style: 'edm',
      variation: 0,
      fillRate: 0,
      grooveTemplate: 'straight',
      humanizeTime: 0,
      humanizeVel: 0,
      humanizeDistribution: 'uniform',
    };

    const out0 = engine.generate({ ...base, rhythmMarkovStrength: 0 });
    const out1 = engine.generate({ ...base, rhythmMarkovStrength: 1 });

    const beat = 60 / base.bpm;
    const bars = Math.floor(base.durationSecs / (4 * beat));
    const r0 = continuityRatio(out0.events, beat, bars);
    const r1 = continuityRatio(out1.events, beat, bars);

    expect(r1).toBeGreaterThanOrEqual(r0);
    // Should be meaningfully higher in practice
    expect(r1 - r0).toBeGreaterThanOrEqual(0.02);
  });
});
