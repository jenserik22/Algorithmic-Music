export type Complexity = 'simple' | 'intermediate' | 'full' | 'high';

export interface GenerationParams {
  seed: number;
  bpm: number;
  key: string; // e.g., 'C', 'A#', with scale handled elsewhere
  timeSignature: string; // e.g., '4/4'
  durationSecs: number;
  density: number; // 0..1
}

export interface NoteEvent {
  time: number; // seconds from start
  pitch: number; // MIDI note number
  duration: number; // seconds
  velocity: number; // 0..1
}

export interface EngineOutput {
  events: NoteEvent[];
}

export interface Engine {
  name: string;
  generate(params: GenerationParams): EngineOutput;
}
