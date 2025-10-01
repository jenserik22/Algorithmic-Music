import { describe, it, expect } from 'vitest';
import { MarkovEngine } from '../lib/music/engines/markov';

describe('MarkovEngine', () => {
  const baseParams = { seed: 7, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.6 };

  it('is deterministic for same seed and params', () => {
    const a = MarkovEngine.generate(baseParams);
    const b = MarkovEngine.generate(baseParams);
    expect(a).toEqual(b);
  });

  it('respects duration and produces monotonic event times', () => {
    const out = MarkovEngine.generate({ ...baseParams, durationSecs: 5 });
    expect(out.events.length).toBeGreaterThan(0);
    expect(out.events.every(e => e.time >= 0 && e.time + e.duration <= 5)).toBe(true);
    const times = out.events.map(e => e.time);
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });

  it('limits step-wise pitch movement on average (small intervals favored)', () => {
    const out = MarkovEngine.generate({ ...baseParams, density: 0.9, durationSecs: 8 });
    let totalSteps = 0, smallIntervals = 0;
    for (let i = 1; i < out.events.length; i++) {
      const diff = Math.abs(out.events[i].pitch - out.events[i - 1].pitch);
      if (!Number.isFinite(diff)) continue;
      totalSteps++;
      if (diff <= 5) smallIntervals++;
    }
    // Expect majority of intervals to be small
    expect(smallIntervals / Math.max(1, totalSteps)).toBeGreaterThan(0.6);
  });
});
