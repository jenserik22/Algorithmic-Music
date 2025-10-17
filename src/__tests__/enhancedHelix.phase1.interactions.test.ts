import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { isSortedByTime, hasValidRanges } from '@/lib/music/metrics';

const styles: Array<'edm'|'cinematic'|'lofi'|'jazz'> = ['edm','cinematic','lofi','jazz'];

describe('EnhancedHelix Phase 1 — interactions between flags', () => {
  const engine = getEngine('enhanced_helix');

  it('grooveTemplate + spaceAllocator: spacing still reduces overlaps across styles', () => {
    const countOverlaps = (events: any[]) => {
      const byTrack: Record<string, { t: number; d: number }[]> = {};
      for (const e of events) {
        const tr = e.track ?? 'unknown';
        (byTrack[tr] ||= []).push({ t: e.time, d: e.duration ?? 0 });
      }
      let count = 0;
      for (const tr of Object.keys(byTrack)) {
        const arr = byTrack[tr].sort((a, b) => a.t - b.t);
        for (let i = 1; i < arr.length; i++) {
          if (arr[i].t < arr[i-1].t + arr[i-1].d - 1e-6) count++;
        }
      }
      return count;
    };

    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 1301, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.9, style, variation: 0, grooveTemplate: 'mpc62' };
      const withGroove = engine.generate(base);
      const withGrooveAndSpace = engine.generate({ ...base, spaceAllocatorMinGapSecs: 0.02 });
      expect(countOverlaps(withGrooveAndSpace.events)).toBeLessThanOrEqual(countOverlaps(withGroove.events));
    }
  });

  it('humanizeTime + humanizeVel keep events sorted and ranges valid', () => {
    const style: 'edm' = 'edm';
    const bpm = 124;
    const durationSecs = 8 * 4 * (60 / bpm);
    const params: GenerationParams = { seed: 1401, bpm, key: 'Am', timeSignature: '4/4', durationSecs, density: 0.8, style, humanizeTime: 0.6, humanizeVel: 0.6 };
    const out = engine.generate(params);
    expect(isSortedByTime(out.events)).toBe(true);
    expect(hasValidRanges(out.events, durationSecs)).toBe(true);
  });
});
