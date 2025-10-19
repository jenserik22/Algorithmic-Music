import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

const engine = getEngine('enhanced_helix');

function sixteenthForBpm(bpm: number) { return (60 / bpm) / 4; }
function medianAbs(xs: number[]) {
  const arr = xs.map(Math.abs).sort((a,b)=>a-b);
  const m = Math.floor(arr.length/2);
  return arr.length ? (arr.length%2?arr[m]:(arr[m-1]+arr[m])/2) : 0;
}

describe('Gaussian humanization option', () => {
  it('reduces extreme microtiming outliers vs uniform at similar variance', () => {
    const bpm = 120; const bars = 8; const durationSecs = bars * 4 * (60/bpm);
    const base: GenerationParams = { seed: 4242, bpm, key: 'Am', timeSignature: '4/4', durationSecs, density: 0.8, style: 'edm', variation: 0.4, humanizeTime: 0.4 };
    const u = engine.generate({ ...base, humanizeDistribution: 'uniform' });
    const g = engine.generate({ ...base, humanizeDistribution: 'gaussian' });
    const s16 = sixteenthForBpm(bpm);
    const offsetsU = u.events.map(e => e.time - Math.round(e.time / s16) * s16);
    const offsetsG = g.events.map(e => e.time - Math.round(e.time / s16) * s16);
    const p95 = (xs: number[]) => { const a = xs.map(x=>Math.abs(x)).sort((a,b)=>a-b); return a[Math.floor(0.95*(a.length-1))] || 0; };
    expect(p95(offsetsG)).toBeLessThanOrEqual(p95(offsetsU) + 0.002);
    expect(medianAbs(offsetsG)).toBeGreaterThan(0);
  });

  it('maintains sorted events and valid ranges with gaussian', () => {
    const bpm = 100; const bars = 8; const durationSecs = bars * 4 * (60/bpm);
    const g = engine.generate({ seed: 11, bpm, key: 'Am', timeSignature: '4/4', durationSecs, density: 0.6, style: 'cinematic', variation: 0.4, humanizeTime: 0.6, humanizeVel: 0.6, humanizeDistribution: 'gaussian' });
    const events = g.events;
    for (let i=1;i<events.length;i++) expect(events[i].time).toBeGreaterThanOrEqual(events[i-1].time - 1e-6);
    expect(events.every(e => e.time >= 0 && e.time <= durationSecs + 1e-6)).toBe(true);
  });
});
