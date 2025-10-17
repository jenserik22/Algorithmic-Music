import { describe, it, expect } from 'vitest';
import { getEngine } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

const styles: Array<NonNullable<GenerationParams['style']>> = ['edm', 'cinematic', 'lofi', 'jazz'];

describe('EnhancedHelixEngine Phase 4: Inter-Track Conversation', () => {
  const engine = getEngine('enhanced_helix');

  it('sets versionTag to v2-phase4 when Phase 4 flags are used', () => {
    const out = engine.generate({
      seed: 777,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 8,
      density: 0.7,
      style: 'edm',
      callResponseIntensity: 1,
    });
    expect(out.meta?.versionTag).toBe('v2-phase4');
  });

  it('bass echoes recent lead fragments when bassEchoProbability=1', () => {
    const bpm = 124;
    const beat = 60 / bpm;
    const out = engine.generate({
      seed: 888,
      bpm,
      key: 'Am',
      timeSignature: '4/4',
      durationSecs: 16 * 4 * beat,
      density: 0.8,
      style: 'edm',
      bassEchoProbability: 1,
    });
    const lead = out.events.filter(e => e.track === 'lead');
    const bass = out.events.filter(e => e.track === 'bass');
    let found = false;
    for (const le of lead) {
      const echo = bass.find(b => b.time >= le.time && b.time - le.time <= 0.75 * (beat / 2) && ((b.pitch - le.pitch) % 12 + 12) % 12 === 0);
      if (echo) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it('call/response alternates density between lead and chords when intensity is high', () => {
    for (const style of styles) {
      const bpm = style === 'cinematic' ? 100 : style === 'lofi' ? 84 : style === 'jazz' ? 140 : 124;
      const bars = 16;
      const durationSecs = bars * 4 * (60 / bpm);
      const out = engine.generate({
        seed: 999,
        bpm,
        key: style === 'lofi' ? 'C' : style === 'jazz' ? 'G' : 'Am',
        timeSignature: '4/4',
        durationSecs,
        density: 0.8,
        style,
        callResponseIntensity: 1,
      });
      const beat = 60 / bpm;
      const perBarLead: number[] = Array.from({ length: bars }, () => 0);
      const perBarChords: number[] = Array.from({ length: bars }, () => 0);
      for (const e of out.events) {
        const bar = Math.floor(e.time / (4 * beat));
        if (bar < 0 || bar >= bars) continue;
        if (e.track === 'lead') perBarLead[bar]++;
        if (e.track === 'chords') perBarChords[bar]++;
      }
      const evenLead = perBarLead.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
      const oddLead = perBarLead.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
      const evenCh = perBarChords.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
      const oddCh = perBarChords.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
      // Expect an alternation pattern: either evenLead != oddLead OR evenCh != oddCh
      const leadDiff = Math.abs(evenLead - oddLead);
      const chordDiff = Math.abs(evenCh - oddCh);
      expect(leadDiff + chordDiff).toBeGreaterThan(0);
    }
  });
});
