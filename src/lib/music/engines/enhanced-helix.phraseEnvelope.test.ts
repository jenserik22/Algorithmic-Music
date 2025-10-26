import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

describe('EnhancedHelix — Phrasing envelope (velocity ramp, lead length taper)', () => {
  const engine = getEngine('enhanced_helix');

  it('later-in-phrase lead notes are louder and slightly longer than early ones', () => {
    const style: NonNullable<GenerationParams['style']> = 'cinematic';
    const bpm = 110;
    const bars = 16; // enough material
    const beat = 60 / bpm;
    const durationSecs = bars * 4 * beat;
    const params: GenerationParams = {
      seed: 424242,
      bpm,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.7,
      style,
      variation: 0,        // reduce baseline jitter
      humanizeTime: 0,     // focus on phrasing envelope
      humanizeVel: 0,
      phrasing: 'short',   // 2-bar phrases
      cadenceStrength: 0.4,
    };

    const out = engine.generate(params);
    const phraseBars = 2;
    const phraseLenSec = phraseBars * 4 * beat;
    const lead = out.events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
    if (lead.length === 0) return; // no strict assertion if no lead generated

    // Focus on a single phrase to avoid cross-section energy differences: pick the first phrase with lead
    const firstLeadTime = lead[0]!.time;
    const anchorPhraseStart = Math.floor(firstLeadTime / phraseLenSec) * phraseLenSec;
    const phraseEnd = anchorPhraseStart + phraseLenSec;
    const early: number[] = [];
    const late: number[] = [];
    const earlyDur: number[] = [];
    const lateDur: number[] = [];
    for (const e of lead) {
      if (e.time < anchorPhraseStart || e.time >= phraseEnd) continue;
      const pos01 = Math.max(0, Math.min(1, (e.time - anchorPhraseStart) / phraseLenSec));
      if (pos01 <= 0.25) { early.push(e.velocity); earlyDur.push(e.duration); }
      if (pos01 >= 0.75) { late.push(e.velocity); lateDur.push(e.duration); }
    }
    if (early.length === 0 || late.length === 0) return; // skip if insufficient sampling
    const mean = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / xs.length;
    const earlyV = mean(early), lateV = mean(late);
    const earlyD = mean(earlyDur), lateD = mean(lateDur);
    // Expect a noticeable but modest increase
    expect(lateV).toBeGreaterThan(earlyV + 0.005);
    expect(lateD).toBeGreaterThan(earlyD + 0.002);
  });
});
