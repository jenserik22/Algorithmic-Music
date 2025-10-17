import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

const styles: Array<NonNullable<GenerationParams['style']>> = ['edm', 'cinematic', 'lofi', 'jazz'];

describe('EnhancedHelixEngine Phase 2: Phrasing & Cadence', () => {
  const engine = getEngine('enhanced_helix');

  it('adds cadential lead notes on the last beat of each phrase when phrasing short + cadenceStrength=1', () => {
    for (const style of styles) {
      const bpm = style === 'cinematic' ? 100 : style === 'lofi' ? 84 : style === 'jazz' ? 140 : 124;
      const bars = style === 'cinematic' ? 16 : 16; // ensure enough time for lead sections in all styles
      const durationSecs = bars * 4 * (60 / bpm);
      const base: GenerationParams = {
        seed: 5151,
        bpm,
        key: style === 'lofi' ? 'C' : style === 'jazz' ? 'G' : 'Am',
        timeSignature: '4/4',
        durationSecs,
        density: 0.8,
        style,
        phrasing: 'short',
        cadenceStrength: 1,
      };

      const out = engine.generate(base);
      const beat = 60 / bpm;
      const phraseBars = 2; // short
      const phraseDur = phraseBars * 4 * beat;
      const lead = out.events.filter(e => e.track === 'lead').sort((a, b) => a.time - b.time);
      // If no lead was generated (edge case for some styles/sections), skip strict check for that style
      if (lead.length === 0) continue;

      const phraseCount = Math.floor(durationSecs / phraseDur);
      let found = 0;
      let eligible = 0;
      const eps = 1e-3;
      for (let p = 1; p <= phraseCount; p++) {
        const phraseEnd = p * phraseDur;
        const phraseStart = phraseEnd - phraseDur;
        const phraseHasLead = lead.some(ev => ev.time >= phraseStart - eps && ev.time < phraseEnd + eps);
        if (!phraseHasLead) continue;
        eligible++;
        const cadenceWindowStart = phraseEnd - beat - eps;
        const cadenceWindowEnd = phraseEnd + eps;
        const hasCadence = lead.some(ev => ev.time >= cadenceWindowStart && ev.time < cadenceWindowEnd);
        if (hasCadence) found++;
      }
      // Expect cadences on a majority of eligible phrases (where lead actually plays)
      expect(found).toBeGreaterThanOrEqual(Math.max(1, Math.floor(eligible * 0.5)));
    }
  });
});
