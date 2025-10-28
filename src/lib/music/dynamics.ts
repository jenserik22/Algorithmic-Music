/**
 * Dynamic shape types for section-level velocity envelopes
 */
export type DynamicShape = 'flat' | 'rise' | 'fall' | 'swell';

/**
 * DynamicsEngine handles all velocity-related humanization and musicality
 * 
 * Key concepts:
 * - Section-level dynamics (not random per-note)
 * - Track-specific velocity characteristics
 * - Musical phrasing (breath at phrase ends, accent at starts)
 * - Consistent variance (not wild swings)
 * 
 * This replaces random velocity with musical dynamics.
 */
export class DynamicsEngine {
  constructor(private rand: () => number) {}
  
  /**
   * Section-level dynamics envelope
   * 
   * Creates musical build/release over a section (not random!).
   * This gives shape to the music rather than constant energy.
   * 
   * @param timeInSection - Current position in section (seconds)
   * @param sectionDuration - Total section duration (seconds)
   * @param shape - Envelope shape
   * @returns Velocity multiplier (0.7-1.0 typically)
   */
  getSectionDynamics(
    timeInSection: number,
    sectionDuration: number,
    shape: DynamicShape
  ): number {
    // Normalize position to 0-1 range
    const pos = sectionDuration > 0 ? timeInSection / sectionDuration : 0;
    
    switch (shape) {
      case 'rise':
        // Gradual build: 0.7 → 1.0
        return 0.7 + 0.3 * pos;
        
      case 'fall':
        // Gradual release: 1.0 → 0.7
        return 1.0 - 0.3 * pos;
        
      case 'swell':
        // Rise and fall: 0.7 → 1.0 → 0.7
        return 0.7 + 0.3 * Math.sin(pos * Math.PI);
        
      case 'flat':
      default:
        // Constant energy
        return 1.0;
    }
  }
  
  /**
   * Track-specific velocity humanization
   * 
   * Different instruments have different consistency:
   * - Drums: Very consistent (±5%)
   * - Bass: Quite consistent (±6%)
   * - Chords: Moderate variance (±8%)
   * - Lead: Most expressive (±10%)
   * - FX: Moderate (±7%)
   * 
   * Real musicians don't have wild velocity swings - they're consistent
   * with subtle variation for expression.
   * 
   * @param baseVel - Base velocity (0-1)
   * @param track - Which instrument track
   * @param variation - Overall humanization amount (0-1)
   * @returns Humanized velocity (0.1-1.0)
   */
  humanizeVelocity(baseVel: number, track: string, variation: number): number {
    const variance = {
      drums: 0.05,    // ±5% (very consistent)
      bass: 0.06,     // ±6%
      chords: 0.08,   // ±8%
      lead: 0.10,     // ±10% (most expressive)
      fx: 0.07        // ±7%
    };
    
    const amount = variance[track as keyof typeof variance] ?? 0.08;
    const jitter = (this.rand() - 0.5) * 2 * amount * variation;
    
    // Clamp to valid MIDI range
    return Math.max(0.1, Math.min(1.0, baseVel + jitter));
  }
  
  /**
   * Musical phrasing dynamics
   * 
   * Creates natural "breathing" in phrases:
   * - Slight reduction at phrase end (like taking a breath)
   * - Slight accent at phrase start (emphasis)
   * 
   * @param time - Current time in seconds
   * @param phraseLength - Length of phrase in seconds (e.g., 4 bars)
   * @returns Velocity multiplier (0.85-1.1)
   */
  getPhraseDynamics(time: number, phraseLength: number): number {
    if (phraseLength <= 0) return 1.0;
    
    const posInPhrase = (time % phraseLength) / phraseLength;
    
    // Breath at phrase end (last 1/8 of phrase)
    if (posInPhrase > 0.875) {
      return 0.85; // Slight reduction
    }
    
    // Accent at phrase start (first 1/8 of phrase)
    if (posInPhrase < 0.125) {
      return 1.1; // Slight boost
    }
    
    return 1.0;
  }
  
  /**
   * Apply accent pattern to velocity
   * 
   * @param baseVel - Base velocity
   * @param accent - Accent multiplier (from groove or pattern)
   * @returns Accented velocity
   */
  applyAccent(baseVel: number, accent: number): number {
    return Math.max(0.1, Math.min(1.0, baseVel * accent));
  }
  
  /**
   * Combined dynamics calculation
   * 
   * Combines section envelope, phrasing, and humanization.
   * 
   * @param baseVel - Base velocity (0-1)
   * @param track - Instrument track
   * @param variation - Humanization amount (0-1)
   * @param timeInSection - Position in section
   * @param sectionDuration - Section length
   * @param shape - Section envelope shape
   * @param phraseTime - Current time for phrasing (optional)
   * @param phraseLength - Phrase length for phrasing (optional)
   * @returns Final velocity (0.1-1.0)
   */
  calculateVelocity(
    baseVel: number,
    track: string,
    variation: number,
    timeInSection: number,
    sectionDuration: number,
    shape: DynamicShape,
    phraseTime?: number,
    phraseLength?: number
  ): number {
    let vel = baseVel;
    
    // Apply section envelope
    vel *= this.getSectionDynamics(timeInSection, sectionDuration, shape);
    
    // Apply phrasing if provided
    if (phraseTime !== undefined && phraseLength !== undefined) {
      vel *= this.getPhraseDynamics(phraseTime, phraseLength);
    }
    
    // Apply humanization
    vel = this.humanizeVelocity(vel, track, variation);
    
    return vel;
  }
}

/**
 * Create a DynamicsEngine with a seeded random function
 * 
 * @param rand - Random function (e.g., from mulberry32)
 * @returns Configured DynamicsEngine
 */
export function createDynamicsEngine(rand: () => number): DynamicsEngine {
  return new DynamicsEngine(rand);
}
