import { describe, it, expect } from 'vitest';
import { CellularAutomataEngine } from '../lib/music/engines/cellularAutomata';

describe('CellularAutomataEngine', () => {
  const base = { seed: 123, bpm: 110, key: 'D', timeSignature: '4/4', durationSecs: 4, density: 0.5 };

  it('is deterministic for same seed and params', () => {
    const a = CellularAutomataEngine.generate(base);
    const b = CellularAutomataEngine.generate(base);
    expect(a).toEqual(b);
  });

  it('respects duration and monotonic times', () => {
    const out = CellularAutomataEngine.generate({ ...base, durationSecs: 6 });
    expect(out.events.every(e => e.time >= 0 && e.time + e.duration <= 6)).toBe(true);
    const times = out.events.map(e => e.time);
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });

  it('higher density produces more events than lower density', () => {
    const lo = CellularAutomataEngine.generate({ ...base, density: 0.2 });
    const hi = CellularAutomataEngine.generate({ ...base, density: 0.8 });
    expect(hi.events.length).toBeGreaterThanOrEqual(lo.events.length);
  });
});
