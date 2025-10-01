import { describe, it, expect } from 'vitest';
import { fromParams, toParams } from '@/lib/export/settings';

describe('settings mapping', () => {
  it('round-trips between params and settings', () => {
    const params = { seed: 7, bpm: 110, key: 'Am', timeSignature: '4/4', durationSecs: 10, density: 0.4 } as any;
    const s = fromParams('markov', params);
    expect(s.algorithm).toBe('markov');
    const p2 = toParams(s);
    expect(p2.bpm).toBe(params.bpm);
    expect(p2.seed).toBe(params.seed);
  });
});
