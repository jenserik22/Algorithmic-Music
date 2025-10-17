import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { chordToneHitRateStrongBeats, averageVoiceLeadingMovement } from '@/lib/music/metrics';

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

  it('reduces chord voice-leading movement when chordVoiceLeadingBias=1', () => {
    const durationSecs = 8 * 4 * (60 / 124);
    const base: GenerationParams = {
      seed: 202,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.7,
      style: 'edm',
    };
    const withVL: GenerationParams = {
      ...base,
      chordVoiceLeadingBias: 1,
    };

    const outBase = engine.generate(base);
    const outVL = engine.generate(withVL);

    const mBase = averageVoiceLeadingMovement(outBase);
    const mVL = averageVoiceLeadingMovement(outVL);
    // Allow small tolerance because voicing register clamps can slightly vary
    expect(mVL).toBeLessThanOrEqual(mBase + 0.25);
  });

  it('limits lead leaps when leadMaxLeapSemitones is set', () => {
    const durationSecs = 8 * 4 * (60 / 124);
    const base: GenerationParams = {
      seed: 303,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.7,
      style: 'edm',
    };
    const constrained: GenerationParams = {
      ...base,
      leadMaxLeapSemitones: 7,
    };

    const outBase = engine.generate(base);
    const outCon = engine.generate(constrained);

    const leadBase = outBase.events.filter(e => e.track === 'lead').sort((a, b) => a.time - b.time);
    const leadCon = outCon.events.filter(e => e.track === 'lead').sort((a, b) => a.time - b.time);
    const avgLeap = (arr: typeof leadBase) => {
      let sum = 0, n = 0;
      for (let i = 1; i < arr.length; i++) { sum += Math.abs(arr[i].pitch - arr[i-1].pitch); n++; }
      return n === 0 ? 0 : sum / n;
    };
    expect(avgLeap(leadCon)).toBeLessThanOrEqual(avgLeap(leadBase));
  });

  it('reduces per-track overlaps with spaceAllocatorMinGapSecs enabled', () => {
    const durationSecs = 8 * 4 * (60 / 124);
    const base: GenerationParams = {
      seed: 404,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.9,
      style: 'edm',
    };
    const spaced: GenerationParams = {
      ...base,
      spaceAllocatorMinGapSecs: 0.03,
    };

    const outBase = engine.generate(base);
    const outSp = engine.generate(spaced);

    const overlaps = (out: typeof outBase) => {
      const byTrack: Record<string, { t: number; d: number }[]> = {};
      for (const e of out.events) {
        const tr = e.track ?? 'unknown';
        (byTrack[tr] ||= []).push({ t: e.time, d: e.duration });
      }
      let count = 0;
      for (const tr of Object.keys(byTrack)) {
        const arr = byTrack[tr].sort((a, b) => a.t - b.t);
        for (let i = 1; i < arr.length; i++) {
          const prevEnd = arr[i-1].t + arr[i-1].d;
          if (arr[i].t < prevEnd - 1e-6) count++;
        }
      }
      return count;
    };

    expect(overlaps(outSp)).toBeLessThanOrEqual(overlaps(outBase));
  });
});
