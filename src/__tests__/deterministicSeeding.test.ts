import { describe, it, expect } from 'vitest';
import { engines } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

describe('Deterministic seeding across engines', () => {
  it('same params produce identical outputs', () => {
    const params: GenerationParams = { seed: 123, bpm: 110, key: 'C', timeSignature: '4/4', durationSecs: 2, density: 0.5 };
    for (const e of Object.values(engines)) {
      const a = e.generate(params);
      const b = e.generate(params);
      expect(a).toEqual(b);
    }
  });
});
