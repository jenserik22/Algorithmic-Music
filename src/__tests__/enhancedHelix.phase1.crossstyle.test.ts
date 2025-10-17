import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { averageVoiceLeadingMovement } from '@/lib/music/metrics';

const styles: Array<'edm'|'cinematic'|'lofi'|'jazz'> = ['edm','cinematic','lofi','jazz'];

describe('EnhancedHelix Phase 1 cross-style invariants', () => {
  const engine = getEngine('enhanced_helix');

  it('chordVoiceLeadingBias does not worsen voice-leading across styles', () => {
    for (const [i, style] of styles.entries()) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = {
        seed: 100 + i,
        bpm,
        key: style === 'jazz' ? 'G' : style === 'lofi' ? 'C' : 'Am',
        timeSignature: '4/4',
        durationSecs,
        density: 0.7,
        style,
      };
      const withVL: GenerationParams = { ...base, chordVoiceLeadingBias: 1 };
      const outBase = engine.generate(base);
      const outVL = engine.generate(withVL);
      const mBase = averageVoiceLeadingMovement(outBase);
      const mVL = averageVoiceLeadingMovement(outVL);
      expect(mVL).toBeLessThanOrEqual(mBase + 0.3);
    }
  });

  it('spaceAllocatorMinGapSecs reduces or maintains overlap counts across styles', () => {
    const countOverlaps = (events: any[]) => {
      const byTrack: Record<string, { t: number; d: number }[]> = {};
      for (const e of events) {
        const tr = e.track ?? 'unknown';
        (byTrack[tr] ||= []).push({ t: e.time, d: e.duration });
      }
      let count = 0;
      for (const tr of Object.keys(byTrack)) {
        const arr = byTrack[tr].sort((a, b) => a.t - b.t);
        for (let i = 1; i < arr.length; i++) {
          if (arr[i].t < arr[i-1].t + arr[i-1].d - 1e-6) count++;
        }
      }
      return count;
    };

    for (const [i, style] of styles.entries()) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = {
        seed: 200 + i,
        bpm,
        key: style === 'jazz' ? 'G' : style === 'lofi' ? 'C' : 'Am',
        timeSignature: '4/4',
        durationSecs,
        density: 0.9,
        style,
      };
      const spaced: GenerationParams = { ...base, spaceAllocatorMinGapSecs: 0.02 };
      const outBase = engine.generate(base);
      const outSp = engine.generate(spaced);
      expect(countOverlaps(outSp.events)).toBeLessThanOrEqual(countOverlaps(outBase.events));
    }
  });
});
