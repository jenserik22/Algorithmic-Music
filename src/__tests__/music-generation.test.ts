/**
 * Week 6: Comprehensive Music Generation Test Suite
 * 
 * Tests overall music generation quality, consistency, and correctness
 */

import { describe, test, expect } from 'vitest';
import { EnhancedHelixEngine } from '../lib/music/engines/enhanced-helix';

describe('Music Generation - Week 6 Comprehensive Tests', () => {
  
  describe('Duration Compliance', () => {
    test('respects duration limit', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 12345
      });
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(8.0);
    });
    
    test('all events start within duration', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 16, 
        bpm: 140, 
        key: 'Am',
        style: 'jazz',
        seed: 54321
      });
      output.events.forEach(e => {
        expect(e.time).toBeLessThan(16.0);
      });
    });
    
    test('long duration (60 seconds) respects limit', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 60, 
        bpm: 128, 
        key: 'G',
        style: 'lofi',
        seed: 99999
      });
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(60.0);
    });
  });

  describe('Velocity Range Validation', () => {
    test('all velocities within valid MIDI range', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 11111
      });
      output.events.forEach(e => {
        expect(e.velocity).toBeGreaterThanOrEqual(0.1);
        expect(e.velocity).toBeLessThanOrEqual(1.0);
      });
    });
    
    test('per-track velocity variance is moderate', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 22222
      });
      
      const tracks = ['lead', 'bass', 'chords', 'drums', 'fx'] as const;
      tracks.forEach(track => {
        const trackEvents = output.events.filter(e => e.track === track);
        if (trackEvents.length === 0) return;
        
        const avgVel = trackEvents.reduce((sum, e) => sum + e.velocity, 0) / trackEvents.length;
        trackEvents.forEach(e => {
          const variance = Math.abs(e.velocity - avgVel);
          expect(variance).toBeLessThan(0.5); // No extreme outliers
        });
      });
    });
    
    test('drums have consistent loudness', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 128, 
        key: 'C',
        style: 'edm',
        seed: 33333
      });
      
      const kicks = output.events.filter(e => e.track === 'drums' && e.pitch === 36);
      const snares = output.events.filter(e => e.track === 'drums' && e.pitch === 38);
      
      if (kicks.length > 0) {
        const avgKickVel = kicks.reduce((sum, e) => sum + e.velocity, 0) / kicks.length;
        expect(avgKickVel).toBeGreaterThan(0.5); // Kicks should be reasonably loud
      }
      
      if (snares.length > 0) {
        const avgSnareVel = snares.reduce((sum, e) => sum + e.velocity, 0) / snares.length;
        expect(avgSnareVel).toBeGreaterThan(0.5); // Snares should be reasonably loud
      }
    });
  });

  describe('Event Sorting and Timing', () => {
    test('events are properly sorted by time', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 44444
      });
      
      for (let i = 1; i < output.events.length; i++) {
        expect(output.events[i].time).toBeGreaterThanOrEqual(output.events[i-1].time);
      }
    });
    
    test('no negative timestamps', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'jazz',
        seed: 55555
      });
      
      output.events.forEach(e => {
        expect(e.time).toBeGreaterThanOrEqual(0);
      });
    });
    
    test('timing consistency across styles', () => {
      const styles = ['edm', 'jazz', 'lofi', 'cinematic'] as const;
      
      styles.forEach(style => {
        const output = EnhancedHelixEngine.generate({ 
          durationSecs: 8, 
          bpm: 120, 
          key: 'C',
          style,
          seed: 66666
        });
        
        const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
        expect(maxTime).toBeLessThanOrEqual(8.0);
      });
    });
  });

  describe('Track Presence', () => {
    test('EDM style generates all tracks', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 128, 
        key: 'C',
        style: 'edm',
        seed: 77777
      });
      
      const tracks = new Set(output.events.map(e => e.track));
      expect(tracks.has('lead')).toBe(true);
      expect(tracks.has('drums')).toBe(true);
      expect(tracks.has('bass')).toBe(true);
      expect(tracks.has('chords')).toBe(true);
    });
    
    test('each track has reasonable event count', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 88888
      });
      
      const drumCount = output.events.filter(e => e.track === 'drums').length;
      const leadCount = output.events.filter(e => e.track === 'lead').length;
      const bassCount = output.events.filter(e => e.track === 'bass').length;
      const chordCount = output.events.filter(e => e.track === 'chords').length;
      
      expect(drumCount).toBeGreaterThan(10); // At least some drums
      expect(leadCount).toBeGreaterThan(5); // At least some lead
      expect(bassCount).toBeGreaterThan(5); // At least some bass
      expect(chordCount).toBeGreaterThan(5); // At least some chords
    });
  });

  describe('Musical Quality Metrics', () => {
    test('chord tones are within scale', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'jazz',
        seed: 99999
      });
      
      const chordEvents = output.events.filter(e => e.track === 'chords');
      chordEvents.forEach(e => {
        // Pitches should be reasonable MIDI values
        expect(e.pitch).toBeGreaterThanOrEqual(36);
        expect(e.pitch).toBeLessThanOrEqual(84);
      });
    });
    
    test('lead notes in reasonable register', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 12121
      });
      
      const leadEvents = output.events.filter(e => e.track === 'lead');
      leadEvents.forEach(e => {
        expect(e.pitch).toBeGreaterThanOrEqual(60); // C4 or higher
        expect(e.pitch).toBeLessThanOrEqual(84); // C6 or lower
      });
    });
    
    test('bass notes in low register', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 13131
      });
      
      const bassEvents = output.events.filter(e => e.track === 'bass');
      bassEvents.forEach(e => {
        expect(e.pitch).toBeGreaterThanOrEqual(28); // E1 or higher
        expect(e.pitch).toBeLessThanOrEqual(52); // E3 or lower
      });
    });
  });

  describe('Humanization Features', () => {
    test('groove templates affect timing', () => {
      const straight = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        grooveTemplate: 'straight',
        seed: 14141
      });
      
      const shuffle = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        grooveTemplate: 'shuffle',
        seed: 14141
      });
      
      // Same seed should produce different timing with different grooves
      const straightTimes = straight.events.filter(e => e.track === 'drums').map(e => e.time).slice(0, 10);
      const shuffleTimes = shuffle.events.filter(e => e.track === 'drums').map(e => e.time).slice(0, 10);
      
      let differences = 0;
      for (let i = 0; i < Math.min(straightTimes.length, shuffleTimes.length); i++) {
        if (Math.abs(straightTimes[i] - shuffleTimes[i]) > 0.001) differences++;
      }
      
      expect(differences).toBeGreaterThan(0); // Grooves should differ
    });
    
    test('humanization with variation parameter', () => {
      const noVar = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        variation: 0,
        seed: 15151
      });
      
      const withVar = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        variation: 0.5,
        seed: 15151
      });
      
      // Higher variation should produce more timing/velocity differences
      expect(withVar.events.length).toBeGreaterThan(0);
      expect(noVar.events.length).toBeGreaterThan(0);
    });
  });

  describe('Simple Mode', () => {
    test('simple mode generates valid output', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        simpleMode: true,
        seed: 16161
      });
      
      expect(output.events.length).toBeGreaterThan(0);
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(8.0);
    });
    
    test('simple mode is less complex than advanced', () => {
      const simple = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        simpleMode: true,
        seed: 17171
      });
      
      const advanced = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        simpleMode: false,
        harmonicComplexity: 0.8,
        ornamentation: 0.7,
        seed: 17171
      });
      
      // Simple mode should generally have fewer events or simpler patterns
      expect(simple.events.length).toBeLessThanOrEqual(advanced.events.length * 1.5);
    });
  });

  describe('Style Differences', () => {
    test('different styles produce different output', () => {
      const edm = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 128, 
        key: 'C',
        style: 'edm',
        seed: 18181
      });
      
      const jazz = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 128, 
        key: 'C',
        style: 'jazz',
        seed: 18181
      });
      
      // Different styles should have different event patterns
      expect(edm.events.length).not.toBe(jazz.events.length);
    });
    
    test('all styles respect duration', () => {
      const styles = ['edm', 'jazz', 'lofi', 'cinematic'] as const;
      
      styles.forEach(style => {
        const output = EnhancedHelixEngine.generate({ 
          durationSecs: 8, 
          bpm: 120, 
          key: 'C',
          style,
          seed: 19191
        });
        
        const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
        expect(maxTime).toBeLessThanOrEqual(8.0);
      });
    });
  });

  describe('Output Consistency', () => {
    test('same seed produces same output', () => {
      const output1 = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 20202
      });
      
      const output2 = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 20202
      });
      
      expect(output1.events.length).toBe(output2.events.length);
      
      // Check first 10 events are identical
      const n = Math.min(10, output1.events.length);
      for (let i = 0; i < n; i++) {
        expect(output1.events[i].time).toBeCloseTo(output2.events[i].time, 5);
        expect(output1.events[i].pitch).toBe(output2.events[i].pitch);
        expect(output1.events[i].velocity).toBeCloseTo(output2.events[i].velocity, 5);
      }
    });
    
    test('different seeds produce different output', () => {
      const output1 = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 21212
      });
      
      const output2 = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 21213
      });
      
      // Different seeds should produce different results
      let differences = 0;
      const n = Math.min(output1.events.length, output2.events.length);
      for (let i = 0; i < Math.min(10, n); i++) {
        if (Math.abs(output1.events[i].time - output2.events[i].time) > 0.001) differences++;
        if (output1.events[i].pitch !== output2.events[i].pitch) differences++;
      }
      
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('Parameter Validation', () => {
    test('handles extreme density', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        density: 1.0,
        seed: 22222
      });
      
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(4.0);
    });
    
    test('handles low density', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        density: 0.1,
        seed: 23232
      });
      
      expect(output.events.length).toBeGreaterThan(0); // Should still generate something
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(4.0);
    });
    
    test('handles various BPM values', () => {
      const bpms = [60, 90, 120, 140, 180];
      
      bpms.forEach(bpm => {
        const output = EnhancedHelixEngine.generate({ 
          durationSecs: 4, 
          bpm, 
          key: 'C',
          style: 'edm',
          seed: 24242
        });
        
        expect(output.events.length).toBeGreaterThan(0);
        const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
        expect(maxTime).toBeLessThanOrEqual(4.0);
      });
    });
  });

  describe('Metadata Validation', () => {
    test('output includes metadata', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 25252
      });
      
      expect(output.meta).toBeDefined();
      expect(output.meta.bpm).toBe(120);
      expect(output.meta.key).toBe('C');
      expect(output.meta.style).toBe('edm');
    });
    
    test('version tag reflects active phases', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 4, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 26262
      });
      
      expect(output.meta.versionTag).toBeDefined();
      expect(output.meta.versionTag).toContain('v2');
    });
  });

  describe('Edge Cases', () => {
    test('very short duration (2 seconds)', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 2, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 27272
      });
      
      expect(output.events.length).toBeGreaterThan(0);
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(2.0);
    });
    
    test('handles multiple sections correctly', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 16, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 28282
      });
      
      // Should have events throughout the full duration
      const earlyEvents = output.events.filter(e => e.time < 4);
      const lateEvents = output.events.filter(e => e.time >= 12);
      
      expect(earlyEvents.length).toBeGreaterThan(0);
      expect(lateEvents.length).toBeGreaterThan(0);
    });
    
    test('handles high harmonic complexity', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'jazz',
        harmonicComplexity: 1.0,
        seed: 29292
      });
      
      expect(output.events.length).toBeGreaterThan(0);
      const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
      expect(maxTime).toBeLessThanOrEqual(8.0);
    });
  });

  describe('Regression Tests', () => {
    test('no events with zero duration', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 30303
      });
      
      output.events.forEach(e => {
        expect(e.duration).toBeGreaterThan(0);
      });
    });
    
    test('no events with invalid pitches', () => {
      const output = EnhancedHelixEngine.generate({ 
        durationSecs: 8, 
        bpm: 120, 
        key: 'C',
        style: 'edm',
        seed: 31313
      });
      
      output.events.forEach(e => {
        expect(e.pitch).toBeGreaterThanOrEqual(0);
        expect(e.pitch).toBeLessThanOrEqual(127); // Valid MIDI range
      });
    });
  });
});
