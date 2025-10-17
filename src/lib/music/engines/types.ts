export type Complexity = 'simple' | 'intermediate' | 'full' | 'high';

export interface GenerationParams {
  seed: number;
  bpm: number;
  key: string; // e.g., 'C', 'A#', with scale handled elsewhere
  timeSignature: string; // e.g., '4/4'
  durationSecs: number;
  density: number; // 0..1
  // Optional musical controls (backward compatible)
  style?: 'edm' | 'cinematic' | 'lofi' | 'jazz';
  variation?: number; // 0..1 amount of randomness/humanization
  fillRate?: number; // 0..1 likelihood of drum fills per 4/8 bars
  // Helix-style macros (optional)
  complexityLevel?: Complexity;
  motion?: number; // 0..1 LFO depth
  brightness?: number; // 0..1 tonal brightness macro
  // Phase 1 optional flags (default neutral)
  grooveTemplate?: 'straight' | 'shuffle' | 'mpc62' | 'funk';
  humanizeTime?: number; // 0..1 additional correlated timing humanization
  humanizeVel?: number; // 0..1 additional velocity humanization
  leadChordToneBias?: number; // 0..1 probability bias for lead to pick chord tones on strong beats
  accentMapIntensity?: number; // 0..1 drum accent/ghost map intensity
  bassAnticipation?: number; // 0..1 likelihood of & of 4 anticipations
  // Phase 1 voice-leading and spacing
  chordVoiceLeadingBias?: number; // 0..1 prefer chord inversions with minimal movement
  leadMaxLeapSemitones?: number; // limit melodic leaps via octave folding (e.g., 7, 9, 12)
  spaceAllocatorMinGapSecs?: number; // per-track minimum gap to avoid overlaps
  // Phase 1 gating switches to preserve baseline determinism when flags are off
  enableChordSubstitutions?: boolean; // gate harmonic substitutions in chords
  enableBassLeadInterplay?: boolean;  // gate bass reacting to nearby lead notes
  enableLeadDownbeatChordRoot?: boolean; // gate lead snapping to chord root on downbeats
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
    swing?: number; // 0..1
    style?: string;
    variation?: number;
    lfos?: LfoSpec[];
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
