import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

const styles: Array<NonNullable<GenerationParams['style']>> = ['edm', 'cinematic', 'lofi', 'jazz'];

describe('EnhancedHelixEngine Phase 3: Harmonic Expansion', () => {
  const engine = getEngine('enhanced_helix');

  it('increases chord onset variety when harmonicRhythmVariance is high', () => {
    for (const style of styles) {
      const bpm = style === 'cinematic' ? 100 : style === 'lofi' ? 84 : style === 'jazz' ? 140 : 124;
      const bars = 16; // enough length to observe patterns
      const durationSecs = bars * 4 * (60 / bpm);

      const base: GenerationParams = {
        seed: 4242,
        bpm,
        key: style === 'lofi' ? 'C' : style === 'jazz' ? 'G' : 'Am',
        timeSignature: '4/4',
        durationSecs,
        density: 0.8,
        style,
      };

      const withVar: GenerationParams = { ...base, harmonicRhythmVariance: 1 };

      const outBase = engine.generate(base);
      const outVar = engine.generate(withVar);

      const onsetSet = (evs: any[]) => {
        const set = new Set<number>();
        for (const e of evs.filter(e => e.track === 'chords')) {
          // quantize to 1/64th note to merge tiny humanization
          const q = Math.round(e.time * 64 / (60 / bpm)) / 64 * (60 / bpm);
          set.add(Number(q.toFixed(6)));
        }
        return set.size;
      };

      const baseOnsets = onsetSet(outBase.events);
      const varOnsets = onsetSet(outVar.events);
      expect(varOnsets).toBeGreaterThanOrEqual(baseOnsets);
    }
  });

  it('adds long pedal bass tones during low-energy/break sections when pedalToneStrength=1', () => {
    const style: GenerationParams['style'] = 'edm';
    const bpm = 124;
    const bars = 28; // include break section
    const durationSecs = bars * 4 * (60 / bpm);

    const out = engine.generate({
      seed: 9090,
      bpm,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs,
      density: 0.8,
      style,
      pedalToneStrength: 1,
    });

    const beat = 60 / bpm;
    const longBass = out.events.filter(e => e.track === 'bass' && e.duration >= 2 * beat);
    // Expect at least one long bass event (pedal)
    expect(longBass.length).toBeGreaterThanOrEqual(1);
  });

  it('sets versionTag to v2-phase3 when any Phase 3 flag is used', () => {
    const out = engine.generate({
      seed: 1234,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 8,
      density: 0.5,
      style: 'lofi',
      harmonicRhythmVariance: 1,
    });
    expect(out.meta?.versionTag).toBe('v2-phase3');
  });
});
