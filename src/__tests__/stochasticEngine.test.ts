import { describe, it, expect } from 'vitest';
import { StochasticEngine } from '../lib/music/engines/stochastic';

describe('StochasticEngine', () => {
  it('returns deterministic events for same seed and params', () => {
    const params = { seed: 42, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5 };
    const a = StochasticEngine.generate(params);
    const b = StochasticEngine.generate(params);
    expect(a).toEqual(b);
  });

  it('respects duration bound and monotonic times', () => {
    const params = { seed: 99, bpm: 100, key: 'A', timeSignature: '4/4', durationSecs: 3, density: 0.8 };
    const out = StochasticEngine.generate(params);
    expect(out.events.every(e => e.time >= 0 && e.time + e.duration <= params.durationSecs)).toBe(true);
    const times = out.events.map(e => e.time);
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });
});
