import { mulberry32 } from './seededRandom';

/**
 * Timing configuration for musical humanization and groove
 */
export interface TimingConfig {
  bpm: number;
  style: string;
  variation: number; // 0-1, amount of humanization
  groove: 'straight' | 'shuffle' | 'mpc62' | 'funk';
}

/**
 * Groove template definitions with swing amounts and accent patterns
 */
export const GROOVE_TEMPLATES = {
  straight: {
    swingAmount: 0,
    accentPattern: [1.0, 0.9, 0.95, 0.9], // Every 4 16ths
    name: 'Straight',
    description: 'No swing, even 16th notes (EDM, pop)'
  },
  
  shuffle: {
    swingAmount: 0.66, // 2:1 triplet feel
    accentPattern: [1.0, 0.7, 0.95, 0.7],
    name: 'Shuffle',
    description: '2:1 triplet feel (blues, rock)'
  },
  
  mpc62: {
    swingAmount: 0.58, // MPC's famous "58% swing"
    accentPattern: [1.0, 0.75, 0.90, 0.75],
    name: 'MPC 62%',
    description: 'Classic hip-hop swing (58%)'
  },
  
  funk: {
    swingAmount: 0.54,
    accentPattern: [1.0, 0.8, 1.05, 0.85], // Push beat 3
    name: 'Funk',
    description: 'Syncopated, pushed feel'
  }
} as const;

/**
 * TimingEngine handles all timing-related humanization
 * 
 * Key concept: Ensemble-based humanization
 * - Real bands drift together (ensemble drift)
 * - Each instrument has characteristic micro-timing (drums tight, lead loose)
 * - Drums are the timing anchor
 * 
 * This replaces per-note random timing with musical coordination.
 */
export class TimingEngine {
  private rand: () => number;
  private beat: number;
  private sixteenth: number;
  private groove: typeof GROOVE_TEMPLATES[keyof typeof GROOVE_TEMPLATES];
  
  constructor(seed: number, private config: TimingConfig) {
    this.rand = mulberry32(seed);
    this.beat = 60 / config.bpm;
    this.sixteenth = this.beat / 4;
    this.groove = GROOVE_TEMPLATES[config.groove] || GROOVE_TEMPLATES.straight;
  }
  
  /**
   * Ensemble drift - smooth, bar-level drift affecting all instruments together
   * 
   * This creates the feeling of a band speeding up/slowing down together,
   * which is natural and musical (vs per-note randomness which sounds chaotic).
   * 
   * @param barIndex - Which bar we're in (for deterministic per-bar drift)
   * @returns Drift amount in seconds (typically ±4-8ms)
   */
  getEnsembleDrift(barIndex: number): number {
    // Create deterministic drift per bar (same bar = same drift)
    const driftSeed = mulberry32(barIndex * 7919); // Prime number for good distribution
    
    // Very small, smooth drift - real bands are quite tight
    // ±8ms max at full variation, scales down with variation parameter
    return (driftSeed() - 0.5) * 0.008 * this.config.variation;
  }
  
  /**
   * Micro-timing - per-note, track-specific humanization
   * 
   * Different instruments have different timing characteristics:
   * - Drums: Tightest (±2ms) - they're the anchor
   * - Bass: Tight (±4ms) - locks with drums
   * - Chords: Moderate (±6ms) - supportive role
   * - Lead: Loosest (±8ms) - most expressive freedom
   * - FX: Moderate (±5ms)
   * 
   * @param track - Which instrument track
   * @returns Micro-timing offset in seconds
   */
  getMicroTiming(track: string): number {
    const variance = {
      drums: 0.002,   // ±2ms (tightest - the anchor)
      bass: 0.004,    // ±4ms (locks with drums)
      chords: 0.006,  // ±6ms
      lead: 0.008,    // ±8ms (most freedom)
      fx: 0.005       // ±5ms
    };
    
    const amount = variance[track as keyof typeof variance] ?? 0.005;
    return (this.rand() - 0.5) * amount * this.config.variation;
  }
  
  /**
   * Apply swing to offbeat positions
   * 
   * Swing delays offbeat 16th notes to create a "lilting" feel.
   * Amount of 0.5 = no swing (straight)
   * Amount of 0.66 = 2:1 triplet feel (classic shuffle)
   * 
   * @param time - Base time in seconds
   * @param pos16 - Position within 16th note grid (0-15)
   * @param swingAmount - Override swing amount (uses groove default if not provided)
   * @returns Time with swing applied
   */
  applySwing(time: number, pos16: number, swingAmount?: number): number {
    const swing = swingAmount ?? this.groove.swingAmount;
    const isOffbeat = pos16 % 2 === 1;
    
    if (isOffbeat && swing > 0) {
      // Delay offbeat by swing amount
      time += this.sixteenth * (swing - 0.5);
    }
    
    return time;
  }
  
  /**
   * Get accent multiplier for velocity based on position and groove
   * 
   * @param pos16 - Position within 16th note grid (0-15)
   * @returns Accent multiplier (0.7-1.05 typically)
   */
  getAccent(pos16: number): number {
    const pattern = this.groove.accentPattern;
    return pattern[pos16 % pattern.length];
  }
  
  /**
   * Combined timing calculation: ensemble drift + micro-timing + swing
   * 
   * This is the main method used during generation.
   * 
   * @param baseTime - Original quantized time
   * @param pos16 - Position within 16th note grid (0-15)
   * @param barIndex - Which bar we're in
   * @param track - Which instrument track
   * @param swingAmount - Optional override for swing amount
   * @returns Final humanized time in seconds
   */
  finalizeTime(
    baseTime: number,
    pos16: number,
    barIndex: number,
    track: string,
    swingAmount?: number
  ): number {
    let t = baseTime;
    
    // Add ensemble drift (all instruments together)
    t += this.getEnsembleDrift(barIndex);
    
    // Add micro-timing (per-instrument character)
    t += this.getMicroTiming(track);
    
    // Apply swing (offbeat delay)
    t = this.applySwing(t, pos16, swingAmount);
    
    // Never go negative
    return Math.max(0, t);
  }
  
  /**
   * Simplified timing for when you don't have bar index
   * Uses time to calculate approximate bar
   * 
   * @param baseTime - Original quantized time
   * @param pos16 - Position within 16th note grid
   * @param track - Which instrument track
   * @param swingAmount - Optional swing override
   * @returns Final humanized time
   */
  finalizeTimeSimple(
    baseTime: number,
    pos16: number,
    track: string,
    swingAmount?: number
  ): number {
    // Approximate bar index from time
    const barIndex = Math.floor(baseTime / (4 * this.beat));
    return this.finalizeTime(baseTime, pos16, barIndex, track, swingAmount);
  }
  
  /**
   * Get the current groove template
   */
  getGroove() {
    return this.groove;
  }
  
  /**
   * Get timing statistics for debugging/testing
   */
  getStats() {
    return {
      bpm: this.config.bpm,
      beat: this.beat,
      sixteenth: this.sixteenth,
      groove: this.groove.name,
      variation: this.config.variation,
      swingAmount: this.groove.swingAmount
    };
  }
}

/**
 * Create a TimingEngine with sensible defaults
 * 
 * @param seed - Random seed for determinism
 * @param params - Partial config (missing values use defaults)
 * @returns Configured TimingEngine
 */
export function createTimingEngine(
  seed: number,
  params: Partial<TimingConfig> & { bpm: number }
): TimingEngine {
  const config: TimingConfig = {
    bpm: params.bpm,
    style: params.style ?? 'edm',
    variation: Math.max(0, Math.min(1, params.variation ?? 0.5)),
    groove: params.groove ?? 'straight'
  };
  
  return new TimingEngine(seed, config);
}
