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
