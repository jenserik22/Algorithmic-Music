import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

describe('EnhancedHelixEngine Phase 5: Dynamics/Automation/FX', () => {
  const engine = getEngine('enhanced_helix');

  it('sets versionTag to v2-phase5 when Phase 5 flags are used', () => {
    const out = engine.generate({
      seed: 1212,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 8,
      density: 0.7,
      style: 'edm',
      dynamicsShape: 'swell',
      dynamicsStrength: 1,
    });
    expect(out.meta?.versionTag).toBe('v2-phase5');
  });

  it('swell dynamics increase mid-section velocities vs edges', () => {
    const bpm = 124;
    const durationSecs = 16 * 4 * (60 / bpm);
    const out = engine.generate({
      seed: 3434,
      bpm,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.8,
      style: 'edm',
      dynamicsShape: 'swell',
      dynamicsStrength: 1,
    });
    const ev = out.events.filter(e => e.track === 'chords' || e.track === 'lead');
    const midStart = durationSecs * 0.3;
    const midEnd = durationSecs * 0.7;
    const edge1End = durationSecs * 0.2;
    const edge2Start = durationSecs * 0.8;
    const avg = (arr: number[]) => arr.reduce((a,b)=>a+b,0) / Math.max(1, arr.length);
    const midV = avg(ev.filter(e => e.time >= midStart && e.time <= midEnd).map(e => e.velocity));
    const edgeV = avg(ev.filter(e => (e.time <= edge1End) || (e.time >= edge2Start)).map(e => e.velocity));
    expect(midV).toBeGreaterThan(edgeV);
  });

  it('emits sidechain pulses metadata when sidechainStrength > 0', () => {
    const out = engine.generate({
      seed: 5656,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs: 8 * 4 * (60 / 124),
      density: 0.8,
      style: 'edm',
      sidechainStrength: 1,
    });
    expect(out.meta?.sidechain).toBeTruthy();
    expect((out.meta!.sidechain!.pulses || []).length).toBeGreaterThan(0);
  });

  it('adds extended LFO targets when extendedLfoTargets > 0', () => {
    const out = engine.generate({
      seed: 7878,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 8,
      density: 0.5,
      style: 'lofi',
      motion: 0, // ensure base LFOs may be absent
      brightness: 0.5,
      extendedLfoTargets: 1,
    });
    const lfos = out.meta?.lfos || [];
    const hasWidth = lfos.some(l => l.target === 'master.width');
    expect(hasWidth).toBe(true);
  });
});
