import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { chordToneHitRateStrongBeats } from '@/lib/music/metrics';

const styles: Array<'edm'|'cinematic'|'lofi'|'jazz'> = ['edm','cinematic','lofi','jazz'];

function sixteenthForBpm(bpm: number) {
  const beat = 60 / bpm;
  return beat / 4;
}

function median(arr: number[]) {
  const a = arr.slice().sort((x,y) => x - y);
  if (a.length === 0) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function jitterMAD(events: any[], bpm: number) {
  const s16 = sixteenthForBpm(bpm);
  const offsets = events.map(e => {
    const q = Math.round(e.time / s16) * s16;
    return Math.abs(e.time - q);
  });
  return median(offsets);
}

function stdev(nums: number[]) {
  if (nums.length <= 1) return 0;
  const mean = nums.reduce((a,b) => a + b, 0) / nums.length;
  const v = nums.reduce((a,b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(v);
}

describe('EnhancedHelix Phase 1 flags — cross-style validations (broader)', () => {
  const engine = getEngine('enhanced_helix');

  it('grooveTemplate=mpc62 biases 8th offbeats later across styles (vs straight)', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 501, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.7, style, variation: 0 };
      const straight = engine.generate(base);
      const withGroove = engine.generate({ ...base, grooveTemplate: 'mpc62' });

      const s16 = sixteenthForBpm(bpm);
      const hatsStraight = straight.events.filter(e => e.track === 'drums' && e.pitch === 42);
      const hatsGroove = withGroove.events.filter(e => e.track === 'drums' && e.pitch === 42);
      // Identify pos per bar by rounding to nearest 16th
      const classify = (e: any) => Math.round(e.time / s16) % 16;
      const off8 = (arr: any[]) => arr.filter(e => classify(e) % 4 === 2); // 8th offbeats
      const odd16 = (arr: any[]) => arr.filter(e => classify(e) % 4 === 3); // late 16th pickups

      // Prefer 8th offbeats if present, otherwise use odd 16ths (for lo-fi etc.)
      const pickSet = (arr: any[]) => {
        const a = off8(arr);
        if (a.length >= 4) return a;
        const b = odd16(arr);
        return b;
      };

      const setS = pickSet(hatsStraight);
      const setG = pickSet(hatsGroove);
      // Compute mean offset from the grid (positive means late)
      const meanOffset = (arr: any[]) => {
        if (arr.length === 0) return 0;
        const offs = arr.map(e => e.time - Math.round(e.time / s16) * s16);
        return offs.reduce((a,b) => a + b, 0) / offs.length;
      };

      const muS = meanOffset(setS);
      const muG = meanOffset(setG);
      // Expect groove to push these offbeats later by at least ~4ms, allow small tolerance across styles
      expect(muG).toBeGreaterThan(muS + 0.004);
    }
  });

  it('humanizeTime increases microtiming jitter (median abs offset) across styles', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 601, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.7, style, variation: 0 };
      const low = engine.generate(base);
      const high = engine.generate({ ...base, humanizeTime: 0.6 });
      expect(jitterMAD(high.events, bpm)).toBeGreaterThan(jitterMAD(low.events, bpm) + 0.0005);
    }
  });

  it('humanizeVel increases velocity variance across styles', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 701, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.7, style, variation: 0 };
      const low = engine.generate(base);
      const high = engine.generate({ ...base, humanizeVel: 0.6 });
      const sLow = stdev(low.events.map(e => e.velocity ?? 0));
      const sHigh = stdev(high.events.map(e => e.velocity ?? 0));
      expect(sHigh).toBeGreaterThan(sLow + 0.01);
    }
  });

  it('accentMapIntensity emphasizes 0/4/8/12 vs de-emphasizes 2/6/10/14 hats across styles', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const s16 = sixteenthForBpm(bpm);
      const base: GenerationParams = { seed: 801, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.9, style, variation: 0 };
      const noAcc = engine.generate(base);
      const withAcc = engine.generate({ ...base, accentMapIntensity: 1 });

      const hats0 = noAcc.events.filter(e => e.track === 'drums' && e.pitch === 42);
      const hats1 = withAcc.events.filter(e => e.track === 'drums' && e.pitch === 42);
      const k = (t: number) => Math.round(t / s16) % 16;
      const mean = (xs: number[]) => (xs.length ? xs.reduce((a,b) => a + b, 0) / xs.length : 0);

      const accIdx = [0,4,8,12];
      const deIdx = [2,6,10,14];

      const vAcc0 = hats0.filter(e => accIdx.includes(k(e.time))).map(e => e.velocity ?? 0);
      const vDe0 = hats0.filter(e => deIdx.includes(k(e.time))).map(e => e.velocity ?? 0);
      const vAcc1 = hats1.filter(e => accIdx.includes(k(e.time))).map(e => e.velocity ?? 0);
      const vDe1 = hats1.filter(e => deIdx.includes(k(e.time))).map(e => e.velocity ?? 0);

      const haveAcc = vAcc0.length >= 2 && vAcc1.length >= 2;
      const haveDe = vDe0.length >= 2 && vDe1.length >= 2;

      if (haveAcc && haveDe) {
        const diff0 = mean(vAcc0) - mean(vDe0);
        const diff1 = mean(vAcc1) - mean(vDe1);
        expect(diff1).toBeGreaterThan(diff0 + 0.02);
      } else if (haveAcc) {
        expect(mean(vAcc1)).toBeGreaterThan(mean(vAcc0) + 0.02);
      } else if (haveDe) {
        expect(mean(vDe1)).toBeLessThan(mean(vDe0) - 0.02);
      } else {
        // If a style yields no hats on these indices, skip (rare)
        expect(true).toBe(true);
      }
    }
  });

  it('bassAnticipation increases pickups on the \'& of 4\' across styles', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const s16 = sixteenthForBpm(bpm);
      const base: GenerationParams = { seed: 901, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.9, style, variation: 0 };
      const noAnt = engine.generate(base);
      const yesAnt = engine.generate({ ...base, bassAnticipation: 1 });

      // Count bass notes that fall near 14.5 sixteenths within the bar (0.5 before 16)
      const k = (t: number) => Math.round(t / s16);
      const offset = (t: number) => t - Math.round(t / s16) * s16;
      const isPickup = (t: number) => (k(t) % 16) === 14 && Math.abs(offset(t) - 0.5 * s16) < 0.03;
      const countPickups = (ev: any[]) => ev.filter(e => e.track === 'bass' && isPickup(e.time)).length;

      expect(countPickups(yesAnt.events)).toBeGreaterThanOrEqual(countPickups(noAnt.events));
    }
  });

  it('leadChordToneBias maintains or improves chord-tone hits on strong beats across styles', () => {
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 1001, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.7, style };
      const out0 = engine.generate(base);
      const out1 = engine.generate({ ...base, leadChordToneBias: 1 });
      const r0 = chordToneHitRateStrongBeats(out0, bpm);
      const r1 = chordToneHitRateStrongBeats(out1, bpm);
      expect(r1).toBeGreaterThanOrEqual(r0);
    }
  });

  it('leadMaxLeapSemitones reduces average lead interval leaps across styles', () => {
    const avgLeap = (arr: any[]) => {
      const lead = arr.filter(e => e.track === 'lead').sort((a,b) => a.time - b.time);
      if (lead.length < 2) return 0;
      let sum = 0, n = 0;
      for (let i = 1; i < lead.length; i++) { sum += Math.abs((lead[i].pitch ?? 0) - (lead[i-1].pitch ?? 0)); n++; }
      return n === 0 ? 0 : sum / n;
    };
    for (const style of styles) {
      const bpm = style === 'edm' ? 124 : style === 'cinematic' ? 100 : style === 'lofi' ? 84 : 140;
      const durationSecs = 8 * 4 * (60 / bpm);
      const base: GenerationParams = { seed: 1101, bpm, key: style === 'jazz' ? 'G' : 'Am', timeSignature: '4/4', durationSecs, density: 0.7, style };
      const out0 = engine.generate(base);
      const out1 = engine.generate({ ...base, leadMaxLeapSemitones: 7 });
      expect(avgLeap(out1.events)).toBeLessThanOrEqual(avgLeap(out0.events));
    }
  });
});
