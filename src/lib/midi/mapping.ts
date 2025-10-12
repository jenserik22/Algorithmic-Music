export type SourceTrack = 'lead' | 'chords' | 'bass' | 'drums' | 'fx';

export interface ChannelConfig {
  id: string;
  name: string;
  source: SourceTrack;
  channel: number; // 1..16 (10 = drums)
  program: number; // 0..127 (ignored for percussion)
  isPercussion?: boolean; // overrides channel===10
  volume?: number; // 0..1
  pan?: number; // -1..1
  transpose?: number; // semitones
}

export interface MappingState {
  engine: 'tone' | 'sf';
  channels: ChannelConfig[];
}

const LS_KEY = 'amusic.midi.mapping.v1';

export const GM_PROGRAMS: { program: number; label: string; sf: string }[] = [
  // Pianos
  { program: 0, label: 'Acoustic Grand Piano', sf: 'acoustic_grand_piano' },
  { program: 1, label: 'Bright Piano', sf: 'bright_acoustic_piano' },
  { program: 2, label: 'Electric Grand', sf: 'electric_grand_piano' },
  { program: 4, label: 'Electric Piano 1', sf: 'electric_piano_1' },
  { program: 5, label: 'Electric Piano 2', sf: 'electric_piano_2' },
  // Organs
  { program: 16, label: 'Drawbar Organ', sf: 'drawbar_organ' },
  { program: 19, label: 'Church Organ', sf: 'church_organ' },
  // Guitars
  { program: 24, label: 'Nylon Guitar', sf: 'acoustic_guitar_nylon' },
  { program: 25, label: 'Steel Guitar', sf: 'acoustic_guitar_steel' },
  { program: 27, label: 'Clean Guitar', sf: 'electric_guitar_clean' },
  { program: 29, label: 'Overdrive Guitar', sf: 'overdriven_guitar' },
  { program: 30, label: 'Distortion Guitar', sf: 'distortion_guitar' },
  // Bass
  { program: 32, label: 'Acoustic Bass', sf: 'acoustic_bass' },
  { program: 33, label: 'Electric Bass (Finger)', sf: 'electric_bass_finger' },
  { program: 34, label: 'Electric Bass (Pick)', sf: 'electric_bass_pick' },
  { program: 36, label: 'Fretless Bass', sf: 'fretless_bass' },
  { program: 38, label: 'Synth Bass 1', sf: 'synth_bass_1' },
  { program: 39, label: 'Synth Bass 2', sf: 'synth_bass_2' },
  // Strings
  { program: 40, label: 'Violin', sf: 'violin' },
  { program: 41, label: 'Viola', sf: 'viola' },
  { program: 42, label: 'Cello', sf: 'cello' },
  { program: 48, label: 'Strings', sf: 'string_ensemble_1' },
  { program: 49, label: 'Slow Strings', sf: 'string_ensemble_2' },
  // Brass & Winds
  { program: 56, label: 'Trumpet', sf: 'trumpet' },
  { program: 57, label: 'Trombone', sf: 'trombone' },
  { program: 60, label: 'French Horn', sf: 'french_horn' },
  { program: 64, label: 'Soprano Sax', sf: 'soprano_sax' },
  { program: 65, label: 'Alto Sax', sf: 'alto_sax' },
  { program: 66, label: 'Tenor Sax', sf: 'tenor_sax' },
  { program: 68, label: 'Oboe', sf: 'oboe' },
  { program: 73, label: 'Flute', sf: 'flute' },
  // Synths & Pads
  { program: 80, label: 'Square Lead', sf: 'lead_1_square' },
  { program: 81, label: 'Saw Lead', sf: 'lead_2_sawtooth' },
  { program: 88, label: 'New Age Pad', sf: 'pad_1_new_age' },
  { program: 89, label: 'Warm Pad', sf: 'pad_2_warm' },
  { program: 90, label: 'Poly Synth Pad', sf: 'pad_3_polysynth' },
  { program: 95, label: 'FX 8 (Sci-Fi)', sf: 'fx_8_scifi' },
];

export function defaultMapping(): MappingState {
  const channels: ChannelConfig[] = [
    { id: 'lead', name: 'Lead', source: 'lead', channel: 1, program: 81, volume: 0.9, pan: 0, transpose: 0 },
    { id: 'chords', name: 'Chords', source: 'chords', channel: 2, program: 89, volume: 0.8, pan: 0, transpose: 0 },
    { id: 'bass', name: 'Bass', source: 'bass', channel: 3, program: 33, volume: 0.9, pan: 0, transpose: -12 },
    { id: 'fx', name: 'FX', source: 'fx', channel: 4, program: 95, volume: 0.7, pan: 0, transpose: 0 },
    { id: 'drums', name: 'Drums', source: 'drums', channel: 10, program: 0, isPercussion: true, volume: 1, pan: 0 },
  ];
  return { engine: 'tone', channels };
}

export function loadMapping(): MappingState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultMapping();
    const parsed = JSON.parse(raw) as MappingState;
    if (!parsed.channels || !Array.isArray(parsed.channels)) return defaultMapping();
    return parsed;
  } catch {
    return defaultMapping();
  }
}

export function saveMapping(state: MappingState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function findSfName(program: number): string | undefined {
  return GM_PROGRAMS.find((i) => i.program === program)?.sf;
}
