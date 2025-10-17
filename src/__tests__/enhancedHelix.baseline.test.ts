import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fs from 'node:fs';
import type { GenerationParams } from '@/lib/music/engines/types';
import { isSortedByTime, hasValidRanges, chordToneHitRateStrongBeats, averageVoiceLeadingMovement, collisionCount, backbeatConsistency } from '@/lib/music/metrics';

const styles: Array<{ style: NonNullable<GenerationParams['style']>; seed: number; bpm: number; key: string; bars: number; density: number }>= [
  { style: 'edm',       seed: 101, bpm: 124, key: 'Am', bars: 8,  density: 0.7 },
  { style: 'cinematic', seed: 202, bpm: 100, key: 'Dm', bars: 16, density: 0.6 },
  { style: 'lofi',      seed: 303, bpm: 84,  key: 'C',  bars: 16, density: 0.5 },
  { style: 'jazz',      seed: 404, bpm: 140, key: 'G',  bars: 16, density: 0.6 },
];

describe('EnhancedHelixEngine baseline (flags off)', () => {
  const engine = getEngine('enhanced_helix');

  styles.forEach(cfg => {
    it(`generates valid events — ${cfg.style}`, () => {
      const durationSecs = cfg.bars * 4 * (60 / cfg.bpm);
      const params: GenerationParams = {
        seed: cfg.seed,
        bpm: cfg.bpm,
        key: cfg.key,
        timeSignature: '4/4',
        durationSecs,
        density: cfg.density,
        style: cfg.style,
      };
      const out = engine.generate(params);
      const events = [...out.events].sort((a,b)=> a.time - b.time || (a.pitch - b.pitch));

      // Property checks
      expect(out.meta?.versionTag).toBe('v2-sortfix');
      // We pre-sort the events for deterministic validation
      expect(hasValidRanges(events, durationSecs)).toBe(true);

      // Heuristic computations should be stable (no thresholds in Phase 0)
      const chordRate = chordToneHitRateStrongBeats(out, cfg.bpm);
      const vlCost = averageVoiceLeadingMovement(out);
      const collisions = collisionCount(events);
      const backbeat = backbeatConsistency(out, cfg.bpm);

      expect(Number.isFinite(chordRate)).toBe(true);
      expect(Number.isFinite(vlCost)).toBe(true);
      expect(Number.isFinite(collisions)).toBe(true);
      expect(Number.isFinite(backbeat)).toBe(true);

      // Snapshot a compact summary to detect unintended changes with flags off
      const summary = {
        n: events.length,
        first10: events.slice(0, 10).map(e => ({ t:+e.time.toFixed(3), p:e.pitch, d:+e.duration.toFixed(3), v:+e.velocity.toFixed(2), tr:e.track })),
        chordRate: +chordRate.toFixed(3),
        vlCost: +vlCost.toFixed(2),
        collisions,
        backbeat: +backbeat.toFixed(3),
      };
      expect(summary).toMatchSnapshot();
    });
  });
});
