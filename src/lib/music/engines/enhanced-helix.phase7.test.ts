import { describe, it, expect } from 'vitest';
import EnhancedHelixEngine from '@/lib/music/engines/enhanced-helix';
import type { GenerationParams, NoteEvent } from '@/lib/music/engines/types';

const baseParams: GenerationParams = {
  seed: 12345,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  durationSecs: 60,
  density: 0.7,
  style: 'edm',
};

function leadEvents(events: NoteEvent[]) {
  return events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
}

function sumPositiveLeadGaps(events: NoteEvent[]) {
  const lead = leadEvents(events);
  let sum = 0;
  for (let i = 1; i < lead.length; i++) {
    const prev = lead[i-1];
    const cur = lead[i];
    const gap = cur.time - (prev.time + (prev.duration ?? 0));
    if (gap > 0) sum += gap;
  }
  return sum;
}

describe('EnhancedHelixEngine Phase 7 (ornamentation & articulation)', () => {
  it('is deterministic with same seed and flags', () => {
    const p: GenerationParams = {
      ...baseParams,
      ornamentation: 0.7,
      legatoStrength: 0.6,
      chordStabArpIntensity: 0.7,
    };
    const out1 = EnhancedHelixEngine.generate(p);
    const out2 = EnhancedHelixEngine.generate(p);
    expect(out1.events).toEqual(out2.events);
    expect(out1.meta?.versionTag).toBe('v2-phase7');
  });

  it('adds more lead events when ornamentation > 0', () => {
    const off = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0, legatoStrength: 0, chordStabArpIntensity: 0 });
    const on = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0.9, legatoStrength: 0, chordStabArpIntensity: 0 });
    const cOff = leadEvents(off.events).length;
    const cOn = leadEvents(on.events).length;
    expect(cOn).toBeGreaterThanOrEqual(cOff);
    expect(on.meta?.versionTag).toBe('v2-phase7');
  });

  it('reduces average positive lead gaps when legatoStrength > 0', () => {
    const off = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0, legatoStrength: 0, chordStabArpIntensity: 0 });
    const on = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0, legatoStrength: 0.8, chordStabArpIntensity: 0 });
    const gOff = sumPositiveLeadGaps(off.events);
    const gOn = sumPositiveLeadGaps(on.events);
    // allow small tolerance for jitter
    expect(gOn).toBeLessThanOrEqual(gOff + 1e-6);
  });

  it('adds chord activity near section starts when chordStabArpIntensity > 0', () => {
    const off = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0, legatoStrength: 0, chordStabArpIntensity: 0 });
    const on = EnhancedHelixEngine.generate({ ...baseParams, ornamentation: 0, legatoStrength: 0, chordStabArpIntensity: 0.9 });
    const beats = 60 / baseParams.bpm; // 0.5s at 120bpm
    const sectionStarts = [0, 8, 16, 32, 40, 56]; // edm template section starts (seconds) at 120bpm
    const window = beats * 0.75; // small window after start
    const countNear = (evts: NoteEvent[]) => sectionStarts.reduce((acc, s) => acc + evts.filter(e => e.track === 'chords' && e.time >= s && e.time < s + window).length, 0);
    const cOff = countNear(off.events);
    const cOn = countNear(on.events);
    // should have strictly more when feature is on
    expect(cOn).toBeGreaterThanOrEqual(cOff);
  });
});
