import type { Engine, EngineOutput, GenerationParams, NoteEvent, LfoSpec } from './types';
import { mulberry32 } from '@/lib/music/seededRandom';

// Enhanced song structures with more sophisticated arrangements
type EnhancedSongConfig = {
  sections: SectionConfig[];
  scale: 'aeolian' | 'ionian' | 'dorian' | 'mixolydian';
  chordProgression: ChordProgression[];
  rhythmPattern: RhythmPattern;
  register: { lead: [number, number]; bass: [number, number]; chords: [number, number] };
};

type SectionConfig = {
  name: string;
  bars: number;
  density: number;
  energy: number; // 0-1, controls dynamics and complexity
  instruments: ('lead' | 'chords' | 'bass' | 'drums' | 'fx')[];
  crash?: boolean;
  riserBefore?: boolean;
  fill?: boolean;
};

type ChordProgression = {
  degree: number;
  quality: 'major' | 'minor' | 'diminished' | 'dominant7' | 'minor7' | 'major7';
  inversion?: number;
  extension?: ('9' | '11' | '13')[];
};

type RhythmPattern = {
  kick: number[];
  snare: number[];
  hats: number[];
  ghostNotes: number[];
  swing: number; // 0-1
};

// Enhanced templates with more musical sophistication
const ENHANCED_TEMPLATES: Record<NonNullable<GenerationParams['style']>, EnhancedSongConfig> = {
  edm: {
    sections: [
      { name: 'intro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords', 'hats'], crash: true },
      { name: 'buildup', bars: 4, density: 0.6, energy: 0.5, instruments: ['lead', 'chords', 'bass', 'drums'], riserBefore: true },
      { name: 'drop', bars: 8, density: 1.0, energy: 1.0, instruments: ['lead', 'chords', 'bass', 'drums', 'fx'], crash: true, fill: true },
      { name: 'break', bars: 4, density: 0.4, energy: 0.3, instruments: ['lead', 'chords'] },
      { name: 'drop2', bars: 8, density: 1.0, energy: 1.0, instruments: ['lead', 'chords', 'bass', 'drums', 'fx'], crash: true },
      { name: 'outro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords'] },
    ],
    scale: 'aeolian',
    chordProgression: [
      { degree: 0, quality: 'minor' },     // i
      { degree: 6, quality: 'major' },     // VI  
      { degree: 3, quality: 'major' },     // III
      { degree: 4, quality: 'minor' },     // iv
    ],
    rhythmPattern: {
      kick: [0, 6, 12],
      snare: [4, 12],
      hats: [2, 6, 10, 14],
      ghostNotes: [3, 7, 11],
      swing: 0.1,
    },
    register: { lead: [60, 84], bass: [28, 52], chords: [48, 72] },
  },
  
  cinematic: {
    sections: [
      { name: 'ambient-intro', bars: 8, density: 0.2, energy: 0.1, instruments: ['fx'] },
      { name: 'theme-intro', bars: 8, density: 0.4, energy: 0.3, instruments: ['lead', 'chords'] },
      { name: 'development', bars: 16, density: 0.7, energy: 0.6, instruments: ['lead', 'chords', 'bass'], riserBefore: true },
      { name: 'climax', bars: 8, density: 1.0, energy: 1.0, instruments: ['lead', 'chords', 'bass', 'drums', 'fx'], crash: true, fill: true },
      { name: 'resolution', bars: 8, density: 0.3, energy: 0.2, instruments: ['lead', 'chords'] },
    ],
    scale: 'dorian',
    chordProgression: [
      { degree: 0, quality: 'minor7' },    // im7
      { degree: 3, quality: 'major7' },    // IIImaj7
      { degree: 6, quality: 'dominant7' }, // VI7
      { degree: 4, quality: 'minor7' },    // ivm7
    ],
    rhythmPattern: {
      kick: [0, 8],
      snare: [4, 12],
      hats: [2, 6, 10, 14],
      ghostNotes: [1, 5, 9, 13],
      swing: 0.05,
    },
    register: { lead: [58, 82], bass: [24, 48], chords: [44, 68] },
  },
  
  lofi: {
    sections: [
      { name: 'intro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords', 'hats'] },
      { name: 'verse', bars: 16, density: 0.5, energy: 0.4, instruments: ['lead', 'chords', 'bass', 'drums'] },
      { name: 'chorus', bars: 8, density: 0.7, energy: 0.6, instruments: ['lead', 'chords', 'bass', 'drums'] },
      { name: 'verse2', bars: 16, density: 0.5, energy: 0.4, instruments: ['lead', 'chords', 'bass', 'drums'] },
      { name: 'outro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords'] },
    ],
    scale: 'ionian',
    chordProgression: [
      { degree: 0, quality: 'major7' },    // Imaj7
      { degree: 5, quality: 'minor7' },    // vim7  
      { degree: 3, quality: 'minor7' },    // iim7
      { degree: 4, quality: 'major7' },    // Vmaj7
    ],
    rhythmPattern: {
      kick: [0, 3, 8, 11],
      snare: [4, 12],
      hats: [1, 3, 5, 7, 9, 11, 13, 15],
      ghostNotes: [2, 6, 10, 14],
      swing: 0.25,
    },
    register: { lead: [57, 81], bass: [32, 56], chords: [48, 72] },
  },
  
  jazz: {
    sections: [
      { name: 'head', bars: 16, density: 0.6, energy: 0.5, instruments: ['lead', 'chords', 'bass', 'drums'] },
      { name: 'solo', bars: 32, density: 0.8, energy: 0.7, instruments: ['lead', 'chords', 'bass', 'drums'], fill: true },
      { name: 'head-out', bars: 16, density: 0.6, energy: 0.5, instruments: ['lead', 'chords', 'bass', 'drums'] },
    ],
    scale: 'mixolydian',
    chordProgression: [
      { degree: 0, quality: 'dominant7' },  // I7
      { degree: 3, quality: 'dominant7' },  // IV7
      { degree: 0, quality: 'dominant7' },  // I7
      { degree: 0, quality: 'dominant7' },  // I7
      { degree: 3, quality: 'dominant7' },  // IV7
      { degree: 3, quality: 'dominant7' },  // IV7
      { degree: 0, quality: 'dominant7' },  // I7
      { degree: 0, quality: 'dominant7' },  // I7
    ],
    rhythmPattern: {
      kick: [0, 6],
      snare: [2, 10],
      hats: [1, 3, 5, 7, 9, 11, 13, 15],
      ghostNotes: [4, 8, 12],
      swing: 0.4,
    },
    register: { lead: [62, 86], bass: [28, 52], chords: [52, 76] },
  },
};

// Enhanced scales with more modes
const SCALES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],      // Major
  aeolian: [0, 2, 3, 5, 7, 8, 10],     // Natural Minor
  dorian: [0, 2, 3, 5, 7, 9, 10],      // Dorian 
  mixolydian: [0, 2, 4, 5, 7, 9, 10],  // Mixolydian
};

const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9, // Natural minor
};

// Enhanced chord voicings
function getChordNotes(root: number, quality: ChordProgression['quality'], inversion = 0): number[] {
  const intervals = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    dominant7: [0, 4, 7, 10],
    minor7: [0, 3, 7, 10],
    major7: [0, 4, 7, 11],
  };
  
  let notes = intervals[quality].map(interval => root + interval);
  
  // Apply inversion
  for (let i = 0; i < inversion; i++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  
  return notes;
}

function clampPitch(p: number, lo = 36, hi = 84) {
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return p;
}

// Enhanced LFO system with more targets
function makeEnhancedLfos(params: GenerationParams): LfoSpec[] | undefined {
  const motion = Math.max(0, Math.min(1, params.motion ?? 0));
  const brightness = Math.max(0, Math.min(1, params.brightness ?? 0.5));
  
  if (motion <= 0.01 && brightness <= 0.1) return undefined;
  
  const lfos: LfoSpec[] = [];
  
  // Filter cutoff modulation
  if (motion > 0.1) {
    lfos.push({ 
      target: 'track:lead.filterCutoff', 
      rate: '1m', 
      depth: motion, 
      min: 400, 
      max: 6000, 
      shape: 'triangle' 
    });
    
    lfos.push({ 
      target: 'track:bass.filterCutoff', 
      rate: '2m', 
      depth: motion * 0.7, 
      min: 100, 
      max: 1200, 
      shape: 'sine' 
    });
  }
  
  // Brightness control  
  if (brightness !== 0.5) {
    lfos.push({ 
      target: 'master.brightness', 
      rate: '4m', 
      depth: Math.abs(brightness - 0.5) * 2, 
      min: brightness < 0.5 ? 400 : 800, 
      max: brightness < 0.5 ? 2000 : 9000, 
      shape: 'sine' 
    });
  }
  
  // Stereo movement
  if (motion > 0.2) {
    lfos.push({ 
      target: 'track:chords.pan', 
      rate: '2m', 
      depth: motion * 0.5, 
      min: -0.3, 
      max: 0.3, 
      shape: 'sine' 
    });
    
    lfos.push({ 
      target: 'track:lead.pan', 
      rate: '3m', 
      depth: motion * 0.3, 
      min: -0.2, 
      max: 0.2, 
      shape: 'triangle' 
    });
  }
  
  // Reverb modulation for cinematic style
  if (params.style === 'cinematic' && motion > 0.1) {
    lfos.push({
      target: 'track:lead.reverb',
      rate: '8m',
      depth: motion * 0.4,
      min: 0.1,
      max: 0.6,
      shape: 'sine'
    });
  }
  
  return lfos.length > 0 ? lfos : undefined;
}

export const EnhancedHelixEngine: Engine = {
  name: 'enhanced-helix',
  
  generate(params: GenerationParams): EngineOutput {
    const seed = params.seed ?? 1;
    const rand = mulberry32(seed);
    const style = params.style ?? 'edm';
    const config = ENHANCED_TEMPLATES[style];
    const bpm = params.bpm;
    const beat = 60 / bpm;
    const sixteenth = beat / 4;
    const keySemi = KEY_TO_SEMITONE[params.key] ?? 0;
    const rootC4 = 60 + keySemi;
    const scale = SCALES[config.scale];
    const complexity = params.complexityLevel ?? 'intermediate';
    const variation = Math.max(0, Math.min(1, params.variation ?? 0.4));
    
    const scalePitch = (deg: number, octave: number) => rootC4 + scale[(deg % 7 + 7) % 7] + 12 * octave;
    const bars = Math.max(1, Math.floor(params.durationSecs / (4 * beat)));
    
    const choose = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    const roll = (p: number) => rand() < p;
    
    // Enhanced humanization
    const humanizeTime = (t: number) => Math.max(0, t + (rand() - 0.5) * 0.02 * variation);
    const humanizeVelocity = (v: number) => Math.max(0.1, Math.min(1, v + (rand() - 0.5) * 0.2 * variation));
    const applySwing = (time: number, swing: number) => {
      const beatPos = (time % beat) / (beat / 4); // Position within beat (0-4 sixteenths)
      const isOffbeat = Math.floor(beatPos) % 2 === 1;
      return isOffbeat ? time + swing * sixteenth * 0.3 : time;
    };

    const events: NoteEvent[] = [];
    
    // Generate sophisticated motifs based on complexity
    const motifLength = complexity === 'simple' ? 4 : complexity === 'intermediate' ? 8 : 12;
    const intervalRange = complexity === 'simple' ? 2 : complexity === 'intermediate' ? 3 : 4;
    
    const leadMotif: number[] = [];
    let currentDegree = Math.floor(rand() * 7);
    
    for (let i = 0; i < motifLength; i++) {
      const intervalJump = Math.floor(rand() * (intervalRange * 2 + 1)) - intervalRange;
      currentDegree = (currentDegree + intervalJump + 7) % 7;
      leadMotif.push(currentDegree);
    }
    
    // Calculate sections based on available time
    const totalSectionBars = config.sections.reduce((sum, sec) => sum + sec.bars, 0);
    const scaleFactor = Math.min(1, bars / totalSectionBars);
    
    let currentTime = 0;
    let sectionStartBar = 0;
    
    for (const section of config.sections) {
      const sectionBars = Math.max(1, Math.floor(section.bars * scaleFactor));
      const sectionDuration = sectionBars * 4 * beat;
      
      if (currentTime + sectionDuration > params.durationSecs) break;
      
      // Generate events for this section based on included instruments
      if (section.instruments.includes('lead')) {
        generateLeadLine(events, currentTime, sectionDuration, section, config, leadMotif, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth
        });
      }
      
      if (section.instruments.includes('chords')) {
        generateChordProgression(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, rootC4, scale
        });
      }
      
      if (section.instruments.includes('bass')) {
        generateBassLine(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, sixteenth
        });
      }
      
      if (section.instruments.includes('drums')) {
        generateDrumPattern(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, beat, sixteenth
        });
      }
      
      if (section.instruments.includes('fx')) {
        generateFXEvents(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, beat
        });
      }
      
      currentTime += sectionDuration;
      sectionStartBar += sectionBars;
    }
    
    // Sort events by time
    events.sort((a, b) => a.time - b.time);
    
    const output: EngineOutput = {
      events,
      meta: {
        bpm: params.bpm,
        key: params.key,
        style: params.style,
        variation: params.variation,
        swing: config.rhythmPattern.swing,
        lfos: makeEnhancedLfos(params),
      },
    };
    
    return output;
  },
};

// Helper function implementations
function generateLeadLine(
  events: NoteEvent[], 
  startTime: number, 
  duration: number, 
  section: SectionConfig,
  config: EnhancedSongConfig,
  motif: number[],
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth } = utils;
  const noteCount = Math.floor(duration / sixteenth);
  
  for (let i = 0; i < noteCount; i++) {
    const time = startTime + i * sixteenth;
    if (time >= startTime + duration) break;
    
    // Density-based note triggering with musical phrasing
    const phrasePosition = (i % 16) / 16; // Position in 4/4 bar
    const isDownbeat = i % 16 === 0;
    const isOffbeat = i % 8 === 4;
    
    let triggerProbability = section.density * section.energy;
    if (isDownbeat) triggerProbability *= 1.5;
    if (isOffbeat) triggerProbability *= 1.2;
    
    if (roll(triggerProbability)) {
      const motifIndex = i % motif.length;
      const degree = motif[motifIndex];
      const octave = 1 + Math.floor(rand() * 2); // Vary octave
      const pitch = clampPitch(scalePitch(degree, octave), config.register.lead[0], config.register.lead[1]);
      
      // Musical note durations
      const durationChoices = [sixteenth, sixteenth * 2, sixteenth * 3, sixteenth * 4];
      const noteDuration = utils.choose(durationChoices);
      
      const velocity = humanizeVelocity(0.6 + section.energy * 0.3);
      const finalTime = applySwing(humanizeTime(time), config.rhythmPattern.swing);
      
      events.push({
        time: finalTime,
        pitch,
        duration: noteDuration,
        velocity,
        track: 'lead',
      });
    }
  }
}

function generateChordProgression(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, rootC4, scale } = utils;
  const chordChanges = Math.floor(duration / beat); // One chord per beat potentially
  
  for (let i = 0; i < chordChanges; i += 2) { // Change chords every 2 beats
    const time = startTime + i * beat;
    if (time >= startTime + duration) break;
    
    const progressionIndex = Math.floor((i / 2) % config.chordProgression.length);
    const chordDef = config.chordProgression[progressionIndex];
    
    const chordRoot = rootC4 + scale[chordDef.degree];
    const chordNotes = getChordNotes(chordRoot, chordDef.quality, chordDef.inversion);
    
    // Add some chord rhythm variation
    const rhythmPattern = roll(0.3) ? [0, beat] : [0]; // Sometimes split chord
    
    for (const rhythmOffset of rhythmPattern) {
      const chordTime = time + rhythmOffset;
      if (chordTime >= startTime + duration) continue;
      
      for (const note of chordNotes) {
        const clampedPitch = clampPitch(note, config.register.chords[0], config.register.chords[1]);
        const velocity = humanizeVelocity(0.4 + section.energy * 0.2);
        const noteDuration = beat * (rhythmPattern.length === 1 ? 2 : 1);
        
        events.push({
          time: humanizeTime(chordTime),
          pitch: clampedPitch,
          duration: noteDuration,
          velocity,
          track: 'chords',
        });
      }
    }
  }
}

function generateBassLine(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, sixteenth } = utils;
  const noteCount = Math.floor(duration / sixteenth);
  
  // Bass follows chord progression root notes
  for (let i = 0; i < noteCount; i++) {
    const time = startTime + i * sixteenth;
    if (time >= startTime + duration) break;
    
    const beatPosition = i % 16;
    const isKick = config.rhythmPattern.kick.includes(beatPosition);
    const isImportantBeat = beatPosition % 4 === 0;
    
    let triggerProbability = section.density * 0.6;
    if (isKick) triggerProbability += 0.4;
    if (isImportantBeat) triggerProbability += 0.3;
    
    if (roll(triggerProbability)) {
      const barPosition = Math.floor(i / 16);
      const progressionIndex = Math.floor(barPosition / 2) % config.chordProgression.length;
      const chordDef = config.chordProgression[progressionIndex];
      
      // Bass plays root or fifth
      const rootDegree = chordDef.degree;
      const degree = roll(0.8) ? rootDegree : (rootDegree + 4) % 7; // Root or fifth
      
      const pitch = clampPitch(scalePitch(degree, -1), config.register.bass[0], config.register.bass[1]);
      const velocity = humanizeVelocity(0.7 + section.energy * 0.2);
      const noteDuration = sixteenth * (roll(0.3) ? 4 : 2); // Vary note lengths
      
      events.push({
        time: humanizeTime(time),
        pitch,
        duration: noteDuration,
        velocity,
        track: 'bass',
      });
    }
  }
}

function generateDrumPattern(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, applySwing, beat, sixteenth } = utils;
  const pattern = config.rhythmPattern;
  const bars = Math.floor(duration / (4 * beat));
  
  for (let bar = 0; bar < bars; bar++) {
    const barStart = startTime + bar * 4 * beat;
    
    // Add fills occasionally
    const isFill = section.fill && roll(0.25) && bar % 4 === 3;
    
    if (isFill) {
      // Generate drum fill
      for (let i = 0; i < 16; i++) {
        if (roll(0.6)) {
          const time = barStart + i * sixteenth;
          const pitch = roll(0.5) ? 38 : 42; // Snare or hi-hat
          const velocity = humanizeVelocity(0.5 + (i / 16) * 0.3); // Build velocity
          
          events.push({
            time: applySwing(humanizeTime(time), pattern.swing),
            pitch,
            duration: sixteenth * 0.8,
            velocity,
            track: 'drums',
          });
        }
      }
    } else {
      // Regular pattern
      // Kick drums
      pattern.kick.forEach(pos => {
        const time = barStart + pos * sixteenth;
        events.push({
          time: humanizeTime(time),
          pitch: 36, // Kick
          duration: sixteenth * 2,
          velocity: humanizeVelocity(0.8 + section.energy * 0.15),
          track: 'drums',
        });
      });
      
      // Snare
      pattern.snare.forEach(pos => {
        const time = barStart + pos * sixteenth;
        events.push({
          time: applySwing(humanizeTime(time), pattern.swing),
          pitch: 38, // Snare
          duration: sixteenth * 1.5,
          velocity: humanizeVelocity(0.7 + section.energy * 0.2),
          track: 'drums',
        });
      });
      
      // Hi-hats
      pattern.hats.forEach(pos => {
        const time = barStart + pos * sixteenth;
        const isAccent = pos % 4 === 0;
        events.push({
          time: applySwing(humanizeTime(time), pattern.swing),
          pitch: 42, // Hi-hat
          duration: sixteenth * 0.5,
          velocity: humanizeVelocity((isAccent ? 0.6 : 0.4) + section.energy * 0.1),
          track: 'drums',
        });
      });
      
      // Ghost notes
      pattern.ghostNotes.forEach(pos => {
        if (roll(section.energy)) {
          const time = barStart + pos * sixteenth;
          events.push({
            time: applySwing(humanizeTime(time), pattern.swing),
            pitch: 38, // Snare
            duration: sixteenth * 0.3,
            velocity: humanizeVelocity(0.2 + section.energy * 0.1),
            track: 'drums',
          });
        }
      });
    }
  }
}

function generateFXEvents(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, beat } = utils;
  
  // Crashes at section starts
  if (section.crash) {
    events.push({
      time: humanizeTime(startTime),
      pitch: 49, // Crash
      duration: beat * 2,
      velocity: humanizeVelocity(0.8 + section.energy * 0.15),
      track: 'fx',
    });
  }
  
  // Risers before drops
  if (section.riserBefore && startTime > 0) {
    const riserStart = startTime - beat * 2;
    const riserDuration = beat * 2;
    
    events.push({
      time: Math.max(0, humanizeTime(riserStart)),
      pitch: 91, // White noise riser
      duration: riserDuration,
      velocity: humanizeVelocity(0.6),
      track: 'fx',
    });
  }
  
  // Ambient pads for cinematic style
  if (config.scale === 'dorian' && roll(0.5)) {
    const padDuration = duration * 0.8;
    events.push({
      time: humanizeTime(startTime + duration * 0.1),
      pitch: 88, // Ambient pad
      duration: padDuration,
      velocity: humanizeVelocity(0.3 + section.energy * 0.1),
      track: 'fx',
    });
  }
}

export default EnhancedHelixEngine;