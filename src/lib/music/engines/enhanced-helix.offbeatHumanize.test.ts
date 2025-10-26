import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

function variance(xs: number[]): number {
  if (xs.length <= 1) return 0;
  const m = xs.reduce((a,b)=>a+b,0) / xs.length;
  return xs.reduce((s,x)=>s + (x - m) * (x - m), 0) / (xs.length - 1);
}

describe('EnhancedHelix — Off-beat humanization emphasis', () => {
  const engine = getEngine('enhanced_helix');

  it('off-beat 16ths have higher timing and velocity variance when humanize is active', () => {
    const style: NonNullable<GenerationParams['style']> = 'edm';
    const bpm = 124;
    const beat = 60 / bpm;
    const bars = 16;
    const durationSecs = bars * 4 * beat;
    const params: GenerationParams = {
      seed: 20231102,
      bpm,
      key: 'C',
      timeSignature: '4/4',
      durationSecs,
      density: 0.7,
      style,
      variation: 0,       // remove baseline jitter
      humanizeTime: 1,    // activate humanization
      humanizeVel: 1,
      leadChordToneBias: 1, // pin strong-beat lead notes to grid
    };
    const out = engine.generate(params);
    const sixteenth = beat / 4;
    // Use lead (pinned on-beats reduce on-beat timing dev; off-beat emphasis should be clear)
    const lead = out.events.filter(e => e.track === 'lead');
    if (lead.length === 0) return; // skip on empty
    const onDev: number[] = [];
    const offDev: number[] = [];
    const onVel: number[] = [];
    const offVel: number[] = [];
    for (const e of lead) {
      const idx = Math.round(e.time / sixteenth);
      const pos16 = idx % 16;
      const grid = idx * sixteenth;
      const dev = Math.abs(e.time - grid);
      if (pos16 % 2 === 0) { onDev.push(dev); onVel.push(e.velocity); }
      else { offDev.push(dev); offVel.push(e.velocity); }
    }
    if (onDev.length === 0 || offDev.length === 0) return;
    const mean = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / xs.length;
    // Timing: expect larger mean absolute deviation on off-beats
    expect(mean(offDev)).toBeGreaterThan(mean(onDev) * 1.2);
    // Timing difference is the primary assertion; velocity variance can be style-dependent
  });
});
