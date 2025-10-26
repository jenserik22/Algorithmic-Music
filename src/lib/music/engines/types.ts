export type Complexity = 'simple' | 'intermediate' | 'full' | 'high';

export type AdaptiveBiasProfile = {
  // Lead interval bias histogram. Keys are integer steps (e.g., "-4".."+4").
  // Values are non-negative counts; higher => stronger preference.
  leadInterval2?: Record<string, number>;
  // Per-16th hat bias within a 4/4 bar; length 16 numbers in [0..1] or counts.
  hatPos16?: number[];
};

export interface GenerationParams {
  seed: number;
  bpm: number;
  key: string; // e.g., 'C', 'A#', with scale handled elsewhere
  timeSignature: string; // e.g., '4/4'
  durationSecs: number;
  density: number; // 0..1
  // Optional musical controls (backward compatible)
  style?: 'edm' | 'cinematic' | 'lofi' | 'jazz';
  // Simple/Advanced mode (UI convenience). When true, engine applies anchored patterns,
  // motif memory, arrangement constraints, and safety gates automatically.
  simpleMode?: boolean;
  variation?: number; // 0..1 amount of randomness/humanization
  fillRate?: number; // 0..1 likelihood of drum fills per 4/8 bars
  // Helix-style macros (optional)
  complexityLevel?: Complexity;
  motion?: number; // 0..1 LFO depth
  brightness?: number; // 0..1 tonal brightness macro
  // Phase 1 optional flags (default neutral)
  grooveTemplate?: 'straight' | 'shuffle' | 'mpc62' | 'funk';
  humanizeDistribution?: 'uniform' | 'gaussian';
  humanizeTime?: number; // 0..1 additional correlated timing humanization
  humanizeVel?: number; // 0..1 additional velocity humanization
  // Alias: timingVariation maps to humanizeTime in UI; kept single-source here
  leadChordToneBias?: number; // 0..1 probability bias for lead to pick chord tones on strong beats
  accentMapIntensity?: number; // 0..1 drum accent/ghost map intensity
  bassAnticipation?: number; // 0..1 likelihood of & of 4 anticipations
  rhythmMarkovStrength?: number; // 0..1 strength of Markov-driven hat/percussion continuity
  // Phase 1 voice-leading and spacing
  chordVoiceLeadingBias?: number; // 0..1 prefer chord inversions with minimal movement
  leadMaxLeapSemitones?: number; // limit melodic leaps via octave folding (e.g., 7, 9, 12)
  spaceAllocatorMinGapSecs?: number; // per-track minimum gap to avoid overlaps
  // Humanization extensions
  rushingDraggingStrength?: number; // 0..1 slow, mean-zero onset drift (applied after groove/humanize)
  swingRatio?: number; // 0.55..0.75 effective only when grooveTemplate==='shuffle'
  // Phase 1 gating switches to preserve baseline determinism when flags are off
  enableChordSubstitutions?: boolean; // gate harmonic substitutions in chords
  enableBassLeadInterplay?: boolean;  // gate bass reacting to nearby lead notes
  enableLeadDownbeatChordRoot?: boolean; // gate lead snapping to chord root on downbeats
  // Phase 2 phrasing & cadence (default neutral)
  phrasing?: 'short' | 'medium' | 'long'; // phrase length target (bars)
  cadenceStrength?: number; // 0..1 strength of cadential resolution at phrase ends
  // Phase 3 harmonic expansion (default neutral)
  harmonicComplexity?: number; // 0..1 probability/strength for reharmonization (substitutions)
  harmonicRhythmVariance?: number; // 0..1 variation in chord change timing (split/hold)
  pedalToneStrength?: number; // 0..1 likelihood/intensity of low pedal tones in low-energy/break sections
  // Phase 4 inter-track conversation (default neutral)
  callResponseIntensity?: number; // 0..1 alternation strength between lead/chords (call vs response)
  bassEchoProbability?: number; // 0..1 chance bass echoes recent lead fragment
  densityGateStrength?: number; // 0..1 reduces simultaneous onsets across tracks
  // Phase 5 dynamics & automation (default neutral)
  dynamicsShape?: 'flat' | 'rise' | 'fall' | 'swell'; // section envelope shape
  dynamicsStrength?: number; // 0..1 scales velocity and note length by section envelope
  registerLiftStrength?: number; // 0..1 gentle register lift near section climaxes (lead focus)
  extendedLfoTargets?: number; // 0..1 adds extra LFO targets in meta when > 0
  sidechainStrength?: number; // 0..1 emits sidechain pulses metadata and optional mild ducking
  // Phase 7 ornamentation & articulation (default neutral)
  ornamentation?: number; // 0..1 overall ornament probability (grace/slide/turns)
  legatoStrength?: number; // 0..1 reduce gaps / slight overlaps between successive lead notes
  chordStabArpIntensity?: number; // 0..1 add short chord stabs/arps at section transitions
  // Phase 8 evaluation & auto-repair (default neutral)
  evaluationStrength?: number; // 0..1 weight of evaluation pass (measures metrics; no changes if autoRepairStrength is 0)
  autoRepairStrength?: number; // 0..1 strength of bounded repair heuristics (pitch snap, thinning, micro-quantize)
  autoRepairBudgetMs?: number; // soft budget for repair ops (interpreted deterministically)
  // Phase 9 light adaptive weighting (optional; default neutral)
  adaptiveWeightingStrength?: number; // 0..1; mixes uniform choices with learned profile
  adaptiveProfileId?: string; // optional id to resolve a stored bias profile
  adaptiveProfile?: AdaptiveBiasProfile; // direct injection of bias profile (tests/advanced UI)
}

export interface NoteEvent {
  time: number; // seconds from start
  pitch: number; // MIDI note number
  duration: number; // seconds
  velocity: number; // 0..1
  track?: 'lead' | 'chords' | 'bass' | 'drums' | 'fx';
}

export interface EngineOutput {
  events: NoteEvent[];
  meta?: {
    bpm?: number;
    key?: string;
    algorithm?: string;
    swing?: number; // 0..1
    style?: string;
    variation?: number;
    timeSignature?: string;
    lfos?: LfoSpec[];
    sidechain?: { pulses: number[]; strength?: number };
    versionTag?: string;
  };
}

export interface Engine {
  name: string;
  generate(params: GenerationParams): EngineOutput;
}

export interface LfoSpec {
  target: string; // e.g., 'master.brightness' | 'track:lead.filterCutoff' | 'track:chords.pan'
  rate: string; // e.g., '1m', '4m', '2n'
  depth?: number; // 0..1
  min?: number;
  max?: number;
  shape?: 'sine' | 'triangle' | 'square';
}
