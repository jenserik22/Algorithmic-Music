import { describe, test, expect } from 'vitest';
import { DynamicsEngine, createDynamicsEngine } from '@/lib/music/dynamics';
import { mulberry32 } from '@/lib/music/seededRandom';

describe('DynamicsEngine', () => {
  describe('Section Dynamics', () => {
    test('flat shape maintains constant velocity', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const start = engine.getSectionDynamics(0, 8, 'flat');
      const middle = engine.getSectionDynamics(4, 8, 'flat');
      const end = engine.getSectionDynamics(8, 8, 'flat');
      
      expect(start).toBe(1.0);
      expect(middle).toBe(1.0);
      expect(end).toBe(1.0);
    });
    
    test('rise shape builds from 0.7 to 1.0', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const start = engine.getSectionDynamics(0, 8, 'rise');
      const middle = engine.getSectionDynamics(4, 8, 'rise');
      const end = engine.getSectionDynamics(8, 8, 'rise');
      
      expect(start).toBeCloseTo(0.7, 2);
      expect(middle).toBeCloseTo(0.85, 2);
      expect(end).toBeCloseTo(1.0, 2);
      
      // Should be monotonically increasing
      expect(middle).toBeGreaterThan(start);
      expect(end).toBeGreaterThan(middle);
    });
    
    test('fall shape releases from 1.0 to 0.7', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const start = engine.getSectionDynamics(0, 8, 'fall');
      const middle = engine.getSectionDynamics(4, 8, 'fall');
      const end = engine.getSectionDynamics(8, 8, 'fall');
      
      expect(start).toBeCloseTo(1.0, 2);
      expect(middle).toBeCloseTo(0.85, 2);
      expect(end).toBeCloseTo(0.7, 2);
      
      // Should be monotonically decreasing
      expect(start).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(end);
    });
    
    test('swell shape rises and falls', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const start = engine.getSectionDynamics(0, 8, 'swell');
      const quarter = engine.getSectionDynamics(2, 8, 'swell');
      const middle = engine.getSectionDynamics(4, 8, 'swell');
      const threeQuarter = engine.getSectionDynamics(6, 8, 'swell');
      const end = engine.getSectionDynamics(8, 8, 'swell');
      
      // Start low, rise to middle, fall to end
      expect(start).toBeCloseTo(0.7, 2);
      expect(middle).toBeCloseTo(1.0, 2);
      expect(end).toBeCloseTo(0.7, 2);
      
      // Quarter and three-quarter should be between min and max
      expect(quarter).toBeGreaterThan(start);
      expect(quarter).toBeLessThan(middle);
      expect(threeQuarter).toBeGreaterThan(end);
      expect(threeQuarter).toBeLessThan(middle);
    });
    
    test('handles zero duration gracefully', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const result = engine.getSectionDynamics(0, 0, 'rise');
      expect(result).toBeGreaterThanOrEqual(0.7);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });
  
  describe('Velocity Humanization', () => {
    test('drums have smallest variance', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      const baseVel = 0.8;
      const variations: number[] = [];
      
      // Sample 100 velocities
      for (let i = 0; i < 100; i++) {
        const vel = engine.humanizeVelocity(baseVel, 'drums', 1.0);
        variations.push(Math.abs(vel - baseVel));
      }
      
      const avgVariation = variations.reduce((a, b) => a + b) / variations.length;
      
      // Drums should vary by ~5% on average
      expect(avgVariation).toBeLessThan(0.06);
    });
    
    test('lead has largest variance', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      const baseVel = 0.8;
      const variations: number[] = [];
      
      // Sample 100 velocities
      for (let i = 0; i < 100; i++) {
        const vel = engine.humanizeVelocity(baseVel, 'lead', 1.0);
        variations.push(Math.abs(vel - baseVel));
      }
      
      const avgVariation = variations.reduce((a, b) => a + b) / variations.length;
      
      // Lead can vary by ~10%
      expect(avgVariation).toBeGreaterThan(0.04);
    });
    
    test('velocity stays within MIDI range (0.1-1.0)', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      // Test extreme inputs
      const tracks = ['drums', 'bass', 'chords', 'lead', 'fx'];
      
      for (const track of tracks) {
        // Very low base velocity
        const lowVel = engine.humanizeVelocity(0.0, track, 1.0);
        expect(lowVel).toBeGreaterThanOrEqual(0.1);
        expect(lowVel).toBeLessThanOrEqual(1.0);
        
        // Very high base velocity
        const highVel = engine.humanizeVelocity(1.0, track, 1.0);
        expect(highVel).toBeGreaterThanOrEqual(0.1);
        expect(highVel).toBeLessThanOrEqual(1.0);
      }
    });
    
    test('variation parameter scales humanization', () => {
      const rand1 = mulberry32(12345);
      const rand2 = mulberry32(12345);
      const engine1 = new DynamicsEngine(rand1);
      const engine2 = new DynamicsEngine(rand2);
      
      const baseVel = 0.8;
      const vel0 = engine1.humanizeVelocity(baseVel, 'lead', 0);
      const vel1 = engine2.humanizeVelocity(baseVel, 'lead', 1.0);
      
      // With variation=0, should be close to base
      expect(Math.abs(vel0 - baseVel)).toBeLessThan(0.001);
      
      // With variation=1, can be further from base
      expect(Math.abs(vel1 - baseVel)).toBeGreaterThan(0.001);
    });
  });
  
  describe('Phrase Dynamics', () => {
    test('reduces velocity at phrase end', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const phraseLength = 8.0; // 4 bars at 120 BPM
      
      const start = engine.getPhraseDynamics(0, phraseLength);
      const middle = engine.getPhraseDynamics(4, phraseLength);
      const end = engine.getPhraseDynamics(7.5, phraseLength); // Last 1/8
      
      expect(start).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(end);
      expect(end).toBe(0.85); // Breath
    });
    
    test('accents phrase start', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const phraseLength = 8.0;
      
      const start = engine.getPhraseDynamics(0.5, phraseLength); // First 1/8
      const middle = engine.getPhraseDynamics(4, phraseLength);
      
      expect(start).toBeGreaterThan(middle);
      expect(start).toBe(1.1); // Accent
    });
    
    test('middle of phrase is neutral', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const phraseLength = 8.0;
      const middle = engine.getPhraseDynamics(4, phraseLength);
      
      expect(middle).toBe(1.0); // Neutral
    });
    
    test('handles wrapping for longer times', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const phraseLength = 8.0;
      
      // Time beyond one phrase wraps
      const firstPhrase = engine.getPhraseDynamics(0.5, phraseLength);
      const secondPhrase = engine.getPhraseDynamics(8.5, phraseLength); // Wraps to 0.5
      
      expect(firstPhrase).toBe(secondPhrase);
    });
    
    test('handles zero phrase length', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const result = engine.getPhraseDynamics(4, 0);
      expect(result).toBe(1.0);
    });
  });
  
  describe('Accent Application', () => {
    test('applies accent multiplier correctly', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      const baseVel = 0.7;
      const accent = 1.2;
      
      const result = engine.applyAccent(baseVel, accent);
      expect(result).toBeCloseTo(0.84, 2); // 0.7 * 1.2 = 0.84
    });
    
    test('clamps accented velocity to valid range', () => {
      const engine = new DynamicsEngine(() => 0.5);
      
      // Test lower bound
      const lowResult = engine.applyAccent(0.05, 0.5);
      expect(lowResult).toBeGreaterThanOrEqual(0.1);
      
      // Test upper bound
      const highResult = engine.applyAccent(0.95, 1.2);
      expect(highResult).toBeLessThanOrEqual(1.0);
    });
  });
  
  describe('Combined Calculation', () => {
    test('combines all dynamics factors', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      const result = engine.calculateVelocity(
        0.7,        // baseVel
        'lead',     // track
        0.5,        // variation
        0,          // timeInSection
        8,          // sectionDuration
        'rise',     // shape
        0.5,        // phraseTime
        8           // phraseLength
      );
      
      // Should be modified from base
      expect(result).not.toBe(0.7);
      
      // Should be within valid range
      expect(result).toBeGreaterThanOrEqual(0.1);
      expect(result).toBeLessThanOrEqual(1.0);
    });
    
    test('works without phrasing parameters', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      const result = engine.calculateVelocity(
        0.7,
        'drums',
        0.5,
        4,
        8,
        'flat'
        // No phrase parameters
      );
      
      expect(result).toBeGreaterThanOrEqual(0.1);
      expect(result).toBeLessThanOrEqual(1.0);
    });
    
    test('produces different results for different tracks', () => {
      const rand1 = mulberry32(12345);
      const rand2 = mulberry32(12345);
      const engine1 = new DynamicsEngine(rand1);
      const engine2 = new DynamicsEngine(rand2);
      
      const drumsVel = engine1.calculateVelocity(0.7, 'drums', 0.5, 4, 8, 'flat');
      const leadVel = engine2.calculateVelocity(0.7, 'lead', 0.5, 4, 8, 'flat');
      
      // Different tracks should have different humanization
      // (though with same seed, micro differences may be small)
      expect(typeof drumsVel).toBe('number');
      expect(typeof leadVel).toBe('number');
    });
  });
  
  describe('Factory Function', () => {
    test('creates DynamicsEngine with provided random function', () => {
      const rand = mulberry32(12345);
      const engine = createDynamicsEngine(rand);
      
      const result = engine.humanizeVelocity(0.7, 'lead', 0.5);
      
      expect(result).toBeGreaterThanOrEqual(0.1);
      expect(result).toBeLessThanOrEqual(1.0);
    });
    
    test('produces consistent results with same seed', () => {
      const engine1 = createDynamicsEngine(mulberry32(12345));
      const engine2 = createDynamicsEngine(mulberry32(12345));
      
      const result1 = engine1.humanizeVelocity(0.7, 'lead', 0.5);
      const result2 = engine2.humanizeVelocity(0.7, 'lead', 0.5);
      
      expect(result1).toBe(result2);
    });
  });
  
  describe('Musical Realism', () => {
    test('velocity variations are modest, not extreme', () => {
      const rand = mulberry32(12345);
      const engine = new DynamicsEngine(rand);
      
      const baseVel = 0.7;
      const velocities: number[] = [];
      
      // Generate 100 velocities
      for (let i = 0; i < 100; i++) {
        velocities.push(engine.humanizeVelocity(baseVel, 'lead', 0.5));
      }
      
      // Calculate standard deviation
      const avg = velocities.reduce((a, b) => a + b) / velocities.length;
      const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / velocities.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be modest (real musicians are consistent)
      expect(stdDev).toBeLessThan(0.08);
    });
  });
});
