import { describe, it, expect } from 'vitest';
import { GenerativeGrammarEngine } from '../lib/music/engines/generativeGrammar';

describe('GenerativeGrammarEngine', () => {
  const base = { seed: 2718, bpm: 120, key: 'G', timeSignature: '4/4', durationSecs: 4, density: 0.5 };

  it('is deterministic for same seed and params', () => {
    const a = GenerativeGrammarEngine.generate(base);
    const b = GenerativeGrammarEngine.generate(base);
    expect(a).toEqual(b);
  });

  it('respects duration and produces monotonic event times', () => {
    const out = GenerativeGrammarEngine.generate({ ...base, durationSecs: 6 });
    expect(out.events.length).toBeGreaterThan(0);
    expect(out.events.every(e => e.time >= 0 && e.time + e.duration <= 6)).toBe(true);
    const times = out.events.map(e => e.time);
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });

  it('higher density yields more or equal events than lower density', () => {
    const lo = GenerativeGrammarEngine.generate({ ...base, density: 0.2 });
    const hi = GenerativeGrammarEngine.generate({ ...base, density: 0.85 });
    expect(hi.events.length).toBeGreaterThanOrEqual(lo.events.length);
  });
});
