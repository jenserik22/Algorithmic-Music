import { describe, test, expect } from 'vitest';
import { TimingEngine, createTimingEngine, GROOVE_TEMPLATES } from '@/lib/music/timing';

describe('TimingEngine', () => {
  describe('Ensemble Drift', () => {
    test('produces consistent drift per bar', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      // Same bar should give same drift
      const drift1 = engine.getEnsembleDrift(0);
      const drift2 = engine.getEnsembleDrift(0);
      expect(drift1).toBe(drift2);
      
      // Different bars should give different drift
      const drift3 = engine.getEnsembleDrift(1);
      expect(drift1).not.toBe(drift3);
    });
    
    test('scales with variation parameter', () => {
      const engine1 = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0,
        groove: 'straight'
      });
      
      const engine2 = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 1.0,
        groove: 'straight'
      });
      
      const drift1 = Math.abs(engine1.getEnsembleDrift(0));
      const drift2 = Math.abs(engine2.getEnsembleDrift(0));
      
      // Higher variation = larger drift
      expect(drift2).toBeGreaterThan(drift1);
    });
    
    test('stays within reasonable bounds (±8ms at max variation)', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 1.0,
        groove: 'straight'
      });
      
      // Test multiple bars
      for (let bar = 0; bar < 100; bar++) {
        const drift = engine.getEnsembleDrift(bar);
        expect(Math.abs(drift)).toBeLessThanOrEqual(0.008); // ±8ms
      }
    });
  });
  
  describe('Micro-Timing', () => {
    test('drums have tightest timing', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 1.0,
        groove: 'straight'
      });
      
      // Sample 100 timing offsets for each track
      const drumOffsets: number[] = [];
      const leadOffsets: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        // Need new engine each time to get different random values
        const e = new TimingEngine(12345 + i, {
          bpm: 120,
          style: 'edm',
          variation: 1.0,
          groove: 'straight'
        });
        drumOffsets.push(Math.abs(e.getMicroTiming('drums')));
        leadOffsets.push(Math.abs(e.getMicroTiming('lead')));
      }
      
      const avgDrum = drumOffsets.reduce((a, b) => a + b) / drumOffsets.length;
      const avgLead = leadOffsets.reduce((a, b) => a + b) / leadOffsets.length;
      
      // Lead should have more variance than drums
      expect(avgLead).toBeGreaterThan(avgDrum);
    });
    
    test('respects track hierarchy (drums < bass < chords < lead)', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 1.0,
        groove: 'straight'
      });
      
      // Max possible offsets
      const drumMax = 0.002;
      const bassMax = 0.004;
      const chordsMax = 0.006;
      const leadMax = 0.008;
      
      expect(drumMax).toBeLessThan(bassMax);
      expect(bassMax).toBeLessThan(chordsMax);
      expect(chordsMax).toBeLessThan(leadMax);
    });
  });
  
  describe('Swing Application', () => {
    test('straight groove has no swing', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const baseTime = 1.0;
      const swungTime = engine.applySwing(baseTime, 1); // Offbeat
      
      expect(swungTime).toBe(baseTime); // No change
    });
    
    test('shuffle groove delays offbeats', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'shuffle'
      });
      
      const baseTime = 1.0;
      const onbeat = engine.applySwing(baseTime, 0); // Even position
      const offbeat = engine.applySwing(baseTime, 1); // Odd position
      
      expect(onbeat).toBe(baseTime); // Onbeats unchanged
      expect(offbeat).toBeGreaterThan(baseTime); // Offbeats delayed
    });
    
    test('applies swing only to odd positions', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'shuffle'
      });
      
      const baseTime = 1.0;
      
      // Even positions (0, 2, 4, 6...) should be unchanged
      for (let i = 0; i < 16; i += 2) {
        const time = engine.applySwing(baseTime, i);
        expect(time).toBe(baseTime);
      }
      
      // Odd positions (1, 3, 5, 7...) should be delayed
      for (let i = 1; i < 16; i += 2) {
        const time = engine.applySwing(baseTime, i);
        expect(time).toBeGreaterThan(baseTime);
      }
    });
  });
  
  describe('Accent Patterns', () => {
    test('returns accent multipliers within valid range', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'funk'
      });
      
      for (let pos = 0; pos < 16; pos++) {
        const accent = engine.getAccent(pos);
        expect(accent).toBeGreaterThan(0);
        expect(accent).toBeLessThanOrEqual(1.1); // Allow slight emphasis
      }
    });
    
    test('pattern repeats every 4 positions', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const accent0 = engine.getAccent(0);
      const accent4 = engine.getAccent(4);
      const accent8 = engine.getAccent(8);
      
      expect(accent0).toBe(accent4);
      expect(accent4).toBe(accent8);
    });
  });
  
  describe('Combined Timing (finalizeTime)', () => {
    test('applies ensemble drift + micro-timing + swing', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'shuffle'
      });
      
      const baseTime = 1.0;
      const finalTime = engine.finalizeTime(baseTime, 1, 0, 'lead');
      
      // Should be different due to humanization + swing
      expect(finalTime).not.toBe(baseTime);
      
      // Should be greater (offbeat gets delayed by swing)
      expect(finalTime).toBeGreaterThan(baseTime);
    });
    
    test('never returns negative time', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 1.0,
        groove: 'straight'
      });
      
      const finalTime = engine.finalizeTime(0, 0, 0, 'drums');
      expect(finalTime).toBeGreaterThanOrEqual(0);
    });
    
    test('is deterministic for same inputs', () => {
      const engine1 = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const engine2 = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const time1 = engine1.finalizeTime(1.0, 0, 0, 'drums');
      const time2 = engine2.finalizeTime(1.0, 0, 0, 'drums');
      
      expect(time1).toBe(time2);
    });
  });
  
  describe('Groove Templates', () => {
    test('all groove templates are valid', () => {
      const grooves: Array<keyof typeof GROOVE_TEMPLATES> = ['straight', 'shuffle', 'mpc62', 'funk'];
      
      grooves.forEach(grooveName => {
        const groove = GROOVE_TEMPLATES[grooveName];
        
        expect(groove.swingAmount).toBeGreaterThanOrEqual(0);
        expect(groove.swingAmount).toBeLessThanOrEqual(1);
        expect(groove.accentPattern.length).toBeGreaterThan(0);
        expect(groove.name).toBeTruthy();
        expect(groove.description).toBeTruthy();
      });
    });
  });
  
  describe('Factory Function', () => {
    test('createTimingEngine uses defaults', () => {
      const engine = createTimingEngine(12345, { bpm: 120 });
      const stats = engine.getStats();
      
      expect(stats.bpm).toBe(120);
      expect(stats.groove).toBe('Straight');
      expect(stats.variation).toBe(0.5);
    });
    
    test('createTimingEngine respects overrides', () => {
      const engine = createTimingEngine(12345, {
        bpm: 140,
        variation: 0.8,
        groove: 'funk'
      });
      const stats = engine.getStats();
      
      expect(stats.bpm).toBe(140);
      expect(stats.groove).toBe('Funk');
      expect(stats.variation).toBe(0.8);
    });
    
    test('createTimingEngine clamps variation to 0-1', () => {
      const engine1 = createTimingEngine(12345, { bpm: 120, variation: -0.5 });
      const engine2 = createTimingEngine(12345, { bpm: 120, variation: 1.5 });
      
      expect(engine1.getStats().variation).toBe(0);
      expect(engine2.getStats().variation).toBe(1);
    });
  });
  
  describe('BPM Calculations', () => {
    test('calculates correct beat duration', () => {
      const engine = new TimingEngine(12345, {
        bpm: 120,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const stats = engine.getStats();
      expect(stats.beat).toBeCloseTo(0.5, 3); // 60/120 = 0.5 seconds per beat
      expect(stats.sixteenth).toBeCloseTo(0.125, 3); // 0.5/4 = 0.125 seconds per 16th
    });
    
    test('handles different BPMs correctly', () => {
      const engine60 = new TimingEngine(12345, {
        bpm: 60,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      const engine180 = new TimingEngine(12345, {
        bpm: 180,
        style: 'edm',
        variation: 0.5,
        groove: 'straight'
      });
      
      expect(engine60.getStats().beat).toBeCloseTo(1.0, 3); // 60/60 = 1.0
      expect(engine180.getStats().beat).toBeCloseTo(0.333, 3); // 60/180 = 0.333
    });
  });
});
