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
}

export interface NoteEvent {
  time: number; // seconds from start
  pitch: number; // MIDI note number
  duration: number; // seconds
  velocity: number; // 0..1
  track?: 'lead' | 'chords' | 'bass' | 'drums';
}

export interface EngineOutput {
  events: NoteEvent[];
  meta?: {
    bpm?: number;
    key?: string;
    swing?: number; // 0..1
    style?: string;
    variation?: number;
  };
}

export interface Engine {
  name: string;
  generate(params: GenerationParams): EngineOutput;
}
