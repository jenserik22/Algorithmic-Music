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
  drumKit?: DrumKitId; // when drums
  brightness?: number; // 0..1 -> mapped to lowpass cutoff
}

export interface MappingState {
  engine: 'tone' | 'sf' | 'sf2';
  channels: ChannelConfig[];
}

const LS_KEY = 'amusic.midi.mapping.v1';
const LS_PRESETS_KEY = 'amusic.midi.userpresets.v1';

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

export type DrumKitId =
  | 'standard_kit'
  | 'room_kit'
  | 'power_kit'
  | 'electronic_kit'
  | 'analog_kit'
  | 'jazz_kit'
  | 'brush_kit'
  | 'orchestra_kit'
  | 'sfx_kit';

export const DRUM_KITS: { id: DrumKitId; label: string }[] = [
  { id: 'standard_kit', label: 'Standard Kit' },
  { id: 'room_kit', label: 'Room Kit' },
  { id: 'power_kit', label: 'Power Kit' },
  { id: 'electronic_kit', label: 'Electronic Kit' },
  { id: 'analog_kit', label: 'Analog Kit' },
  { id: 'jazz_kit', label: 'Jazz Kit' },
];

export function defaultMapping(): MappingState {
  const channels: ChannelConfig[] = [
    { id: 'lead', name: 'Lead', source: 'lead', channel: 1, program: 81, volume: 0.9, pan: 0, transpose: 0, brightness: 0.8 },
    { id: 'chords', name: 'Chords', source: 'chords', channel: 2, program: 89, volume: 0.8, pan: 0, transpose: 0, brightness: 0.6 },
    { id: 'bass', name: 'Bass', source: 'bass', channel: 3, program: 33, volume: 0.9, pan: 0, transpose: -12, brightness: 0.5 },
    { id: 'fx', name: 'FX', source: 'fx', channel: 4, program: 95, volume: 0.7, pan: 0, transpose: 0, brightness: 0.9 },
    { id: 'drums', name: 'Drums', source: 'drums', channel: 10, program: 0, isPercussion: true, drumKit: 'room_kit', volume: 1, pan: 0, brightness: 1 },
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

// ---- Style presets ----
export type StylePresetId = 'edm' | 'cinematic' | 'lofi' | 'techno' | 'rock' | 'classic';

export function applyStylePreset(state: MappingState, preset: StylePresetId): MappingState {
  const base = { ...state };
  const nextCh = base.channels.map((c) => ({ ...c }));
  const bySource = (s: SourceTrack) => nextCh.find((x) => x.source === s);
  const set = (s: SourceTrack, patch: Partial<ChannelConfig>) => {
    const t = bySource(s);
    if (t) Object.assign(t, patch);
  };
  if (preset === 'edm') {
    set('lead', { program: 81, brightness: 0.9, pan: 0.1, transpose: 0 });
    set('chords', { program: 89, brightness: 0.7, pan: -0.1 });
    set('bass', { program: 39, brightness: 0.6, transpose: -12 });
    set('fx', { program: 95, brightness: 0.95, pan: 0 });
    set('drums', { drumKit: 'electronic_kit', isPercussion: true, channel: 10 });
  } else if (preset === 'cinematic') {
    set('lead', { program: 73, brightness: 0.7, pan: 0 }); // Flute
    set('chords', { program: 49, brightness: 0.6, pan: -0.05 }); // Slow Strings
    set('bass', { program: 33, brightness: 0.5, transpose: -12 });
    set('fx', { program: 88, brightness: 0.6 }); // New Age Pad
    set('drums', { drumKit: 'standard_kit', isPercussion: true, channel: 10 });
  } else if (preset === 'lofi') {
    set('lead', { program: 4, brightness: 0.6, pan: 0.05 }); // EP1
    set('chords', { program: 5, brightness: 0.55, pan: -0.05 }); // EP2
    set('bass', { program: 36, brightness: 0.5, transpose: -12 }); // Fretless
    set('fx', { program: 90, brightness: 0.5 }); // Poly Synth Pad
    set('drums', { drumKit: 'jazz_kit', isPercussion: true, channel: 10 });
  } else if (preset === 'techno') {
    // Driving saw lead, warm pad chords, synth bass, electronic kit
    set('lead', { program: 81, brightness: 1.0, pan: 0, transpose: 0 }); // Saw Lead
    set('chords', { program: 90, brightness: 0.75, pan: -0.05 }); // Poly Synth Pad
    set('bass', { program: 38, brightness: 0.7, transpose: -12 }); // Synth Bass 1
    set('fx', { program: 95, brightness: 0.95, pan: 0.05 }); // Sci-Fi FX
    set('drums', { drumKit: 'electronic_kit', isPercussion: true, channel: 10 });
  } else if (preset === 'rock') {
    // Distorted guitar lead/chords, picked bass, power kit
    set('lead', { program: 30, brightness: 0.85, pan: 0.05 }); // Distortion Guitar
    set('chords', { program: 27, brightness: 0.7, pan: -0.05 }); // Clean Guitar
    set('bass', { program: 34, brightness: 0.6, transpose: -12 }); // Picked Bass
    set('fx', { program: 49, brightness: 0.65 }); // Slow Strings for pads
    set('drums', { drumKit: 'power_kit', isPercussion: true, channel: 10 });
  } else if (preset === 'classic') {
    // Classical: flute lead, string ensemble, acoustic bass, standard kit (light)
    set('lead', { program: 73, brightness: 0.65, pan: 0 }); // Flute
    set('chords', { program: 48, brightness: 0.6, pan: -0.02 }); // Strings
    set('bass', { program: 32, brightness: 0.5, transpose: -12 }); // Acoustic Bass
    set('fx', { program: 60, brightness: 0.55 }); // French Horn as texture
    set('drums', { drumKit: 'standard_kit', isPercussion: true, channel: 10 });
  }
  return { ...base, channels: nextCh };
}

// ---- User presets (saved locally) ----
export interface UserPreset {
  id: string; // unique id
  name: string;
  channels: ChannelConfig[];
}

export function loadUserPresets(): UserPreset[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as UserPreset[];
    if (!Array.isArray(list)) return [];
    return list;
  } catch {
    return [];
  }
}

export function saveUserPresets(list: UserPreset[]) {
  try {
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function saveCurrentAsPreset(state: MappingState, name: string): UserPreset {
  const id = `preset_${Date.now().toString(36)}`;
  const preset: UserPreset = {
    id,
    name: name.trim() || 'Untitled',
    channels: state.channels.map((c) => ({ ...c })),
  };
  const list = loadUserPresets();
  list.push(preset);
  saveUserPresets(list);
  return preset;
}

export function applyUserPreset(state: MappingState, presetId: string): MappingState {
  const list = loadUserPresets();
  const p = list.find((x) => x.id === presetId);
  if (!p) return state;
  return { ...state, channels: p.channels.map((c) => ({ ...c })) };
}

export function deleteUserPreset(presetId: string): UserPreset[] {
  const list = loadUserPresets();
  const next = list.filter((x) => x.id !== presetId);
  saveUserPresets(next);
  return next;
}
