import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams, NoteEvent } from '@/lib/music/engines/types';
import { chordToneHitRateStrongBeats } from '@/lib/music/metrics';

function tracksActiveAt(events: NoteEvent[], t: number): Set<NonNullable<NoteEvent['track']>> {
  const s = new Set<NonNullable<NoteEvent['track']>>();
  for (const e of events) {
    const end = e.time + (e.duration ?? 0);
    if (t >= e.time && t < end && e.track) s.add(e.track);
  }
  return s as any;
}

describe('EnhancedHelixEngine — Simple Mode musicality', () => {
  const engine = getEngine('enhanced_helix');

  it('enforces chord tones on strong beats for lead (EDM)', () => {
    const params: GenerationParams = {
      seed: 777,
      bpm: 124,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs: 8 * 4 * (60 / 124),
      density: 0.7,
      style: 'edm',
      simpleMode: true,
    };
    const out = engine.generate(params);
    const rate = chordToneHitRateStrongBeats(out, params.bpm);
    // Expect strong-beat hits to be mostly chord tones in Simple Mode
    expect(rate).toBeGreaterThanOrEqual(0.8);
  });

  it('limits concurrent tracks to at most 3 per section window', () => {
    const params: GenerationParams = {
      seed: 888,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 8 * 4 * (60 / 120),
      density: 0.6,
      style: 'edm',
      simpleMode: true,
    };
    const out = engine.generate(params);
    const events = out.events;
    // sample at every 8th note onset across timeline
    const beat = 60 / params.bpm;
    const samples: number[] = [];
    for (let t = 0; t <= params.durationSecs; t += beat / 2) samples.push(+t.toFixed(6));
    for (const t of samples) {
      const active = tracksActiveAt(events, t);
      expect(active.size).toBeLessThanOrEqual(3);
    }
  });
});
