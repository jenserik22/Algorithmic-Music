import { describe, it, expect } from 'vitest';
import { EnhancedHelixEngine } from '@/lib/music/engines/enhanced-helix';
import type { GenerationParams } from '@/lib/music/engines/types';
import { chordToneHitRateStrongBeats, backbeatConsistency } from '@/lib/music/metrics';

const baseParams: GenerationParams = {
  seed: 1234,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  durationSecs: 16,
  density: 0.8,
  style: 'lofi',
  variation: 0.4,
  grooveTemplate: 'shuffle',
  humanizeTime: 0.15,
  humanizeVel: 0.2,
};

describe('EnhancedHelix – rushing/dragging drift and swingRatio', () => {
  it('is deterministic with rushingDraggingStrength=0', () => {
    const out1 = EnhancedHelixEngine.generate({ ...baseParams, rushingDraggingStrength: 0 });
    const out2 = EnhancedHelixEngine.generate({ ...baseParams, rushingDraggingStrength: 0 });
    expect(JSON.stringify(out1.events)).toEqual(JSON.stringify(out2.events));
  });

  it('applies measurable onset drift when rushingDraggingStrength>0 without harming acceptance metrics materially', () => {
    const out0 = EnhancedHelixEngine.generate({ ...baseParams, rushingDraggingStrength: 0 });
    const out1 = EnhancedHelixEngine.generate({ ...baseParams, rushingDraggingStrength: 0.7 });
    // Median absolute delta of event times (non-kick) should be >= 2ms
    const a = out0.events;
    const b = out1.events;
    const n = Math.min(a.length, b.length);
    const diffs: number[] = [];
    for (let i = 0; i < n; i++) {
      if (a[i].track === 'drums' && a[i].pitch === 36) continue; // ignore kicks (kept tighter)
      diffs.push(Math.abs(a[i].time - b[i].time));
    }
    diffs.sort((x, y) => x - y);
    const mid = Math.floor(diffs.length / 2);
    const med = diffs.length % 2 ? diffs[mid] : (diffs[mid - 1] + diffs[mid]) / 2;
    expect(med).toBeGreaterThanOrEqual(0.002);

    const b0 = backbeatConsistency(out0, baseParams.bpm);
    const b1 = backbeatConsistency(out1, baseParams.bpm);
    expect(b1).toBeGreaterThanOrEqual(b0 - 0.02);

    const c0 = chordToneHitRateStrongBeats(out0, baseParams.bpm);
    const c1 = chordToneHitRateStrongBeats(out1, baseParams.bpm);
    expect(Math.abs(c1 - c0)).toBeLessThanOrEqual(0.03);
  });

  it('swingRatio has no effect unless grooveTemplate is shuffle', () => {
    const straight0 = EnhancedHelixEngine.generate({ ...baseParams, grooveTemplate: 'straight', swingRatio: undefined });
    const straight1 = EnhancedHelixEngine.generate({ ...baseParams, grooveTemplate: 'straight', swingRatio: 0.7 });
    expect(JSON.stringify(straight0.events)).toEqual(JSON.stringify(straight1.events));

    const shLo = EnhancedHelixEngine.generate({ ...baseParams, grooveTemplate: 'shuffle', swingRatio: 0.55 });
    const shHi = EnhancedHelixEngine.generate({ ...baseParams, grooveTemplate: 'shuffle', swingRatio: 0.75 });
    expect(JSON.stringify(shLo.events)).not.toEqual(JSON.stringify(shHi.events));
  });
});
