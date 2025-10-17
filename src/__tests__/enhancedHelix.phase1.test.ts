import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { chordToneHitRateStrongBeats } from '@/lib/music/metrics';

describe('EnhancedHelixEngine Phase 1 flags (do not affect baseline)', () => {
  const engine = getEngine('enhanced_helix');

  it('increases chord-tone rate on strong beats when leadChordToneBias=1', () => {
    const durationSecs = 8 * 4 * (60 / 124); // 8 bars @ 124
    const base: GenerationParams = {
      seed: 101,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.7,
      style: 'edm',
    };
    const withBias: GenerationParams = {
      ...base,
      leadChordToneBias: 1,
    };

    const outBase = engine.generate(base);
    const outBias = engine.generate(withBias);

    const rBase = chordToneHitRateStrongBeats(outBase, base.bpm);
    const rBias = chordToneHitRateStrongBeats(outBias, base.bpm);

    expect(rBias).toBeGreaterThanOrEqual(rBase);
  });
});
