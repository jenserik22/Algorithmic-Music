import { describe, it, expect } from 'vitest';
import { engines } from '@/lib/music/engines';

describe('Performance (basic)', () => {
  it('generates small outputs under threshold', () => {
    const start = Date.now();
    const params = { seed: 1, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 1, density: 0.5 } as const;
    for (const e of Object.values(engines)) {
      const t0 = Date.now();
      e.generate(params);
      const dt = Date.now() - t0;
      expect(dt).toBeLessThan(200);
    }
    const total = Date.now() - start;
    expect(total).toBeLessThan(1500);
  });
});
