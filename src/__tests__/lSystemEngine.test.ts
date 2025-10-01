import { describe, it, expect } from 'vitest';
import { LSystemEngine } from '../lib/music/engines/lSystem';

describe('LSystemEngine', () => {
  const base = { seed: 31415, bpm: 120, key: 'E', timeSignature: '4/4', durationSecs: 4, density: 0.5 };

  it('is deterministic for same seed and params', () => {
    const a = LSystemEngine.generate(base);
    const b = LSystemEngine.generate(base);
    expect(a).toEqual(b);
  });

  it('respects duration and produces monotonic event times', () => {
    const out = LSystemEngine.generate({ ...base, durationSecs: 6 });
    expect(out.events.length).toBeGreaterThan(0);
    expect(out.events.every(e => e.time >= 0 && e.time + e.duration <= 6)).toBe(true);
    const times = out.events.map(e => e.time);
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });

  it('higher density yields more or equal events than lower density', () => {
    const lo = LSystemEngine.generate({ ...base, density: 0.2 });
    const hi = LSystemEngine.generate({ ...base, density: 0.85 });
    expect(hi.events.length).toBeGreaterThanOrEqual(lo.events.length);
  });
});
