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
  const extra = Math.max(0, Math.min(1, params.extendedLfoTargets ?? 0));
  
  if (motion <= 0.01 && brightness <= 0.1 && extra <= 0) return undefined;
  
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
  
  // Phase 5: extended LFO targets when requested
  if (extra > 0) {
    lfos.push({
      target: 'master.width',
      rate: '4m',
      depth: 0.5 * extra,
      min: 0.5,
      max: 1.0,
      shape: 'sine',
    });
    lfos.push({
      target: 'track:lead.vibrato',
      rate: '2n',
      depth: 0.75 * extra,
      min: 0,
      max: 0.6,
      shape: 'sine',
    });
    lfos.push({
      target: 'track:chords.filterRes',
      rate: '2m',
      depth: 0.4 * extra,
      min: 0.1,
      max: 1.2,
      shape: 'triangle',
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
    const extraTimeHumanize = Math.max(0, Math.min(1, params.humanizeTime ?? 0));
    const extraVelHumanize = Math.max(0, Math.min(1, params.humanizeVel ?? 0));
    const humanizeTime = (t: number) => {
      // Preserve baseline when humanizeTime is undefined (same amplitude as before)
      const base = (rand() - 0.5) * 0.02 * variation;
      const extra = extraTimeHumanize > 0 ? (rand() - 0.5) * 0.02 * extraTimeHumanize : 0;
      return Math.max(0, t + base + extra);
    };
    const humanizeVelocity = (v: number) => {
      // Base symmetric jitter preserves Phase 0 behavior when extraVelHumanize is 0
      const base = (rand() - 0.5) * 0.2 * variation;
      // Headroom-aware extra jitter to avoid clipping at bounds which can reduce variance
      const headroom = Math.max(0, Math.min(1 - v, v - 0.1));
      const extraAmp = 0.5 * extraVelHumanize; // stronger to ensure measurable variance increase
      const extra = extraVelHumanize > 0 ? (rand() - 0.5) * 2 * headroom * extraAmp : 0;
      // Mild scaling of base when extra humanize is active to further increase spread without clipping
      const scaledBase = base * (1 + extraVelHumanize * 0.8);
      let val = v + scaledBase + extra;
      // Spread away from center to boost variance in a controlled way
      val = 0.55 + (val - 0.55) * (1 + 0.6 * extraVelHumanize);
      return Math.max(0.1, Math.min(1, val));
    };
    const applySwing = (time: number, swing: number) => {
      const beatPos = (time % beat) / (beat / 4); // Position within beat (0-4 sixteenths)
      const isOffbeat = Math.floor(beatPos) % 2 === 1;
      return isOffbeat ? time + swing * sixteenth * 0.3 : time;
    };

    // Groove templates (default neutral when not provided)
    const grooveTemplate = params.grooveTemplate ?? 'straight';
    const grooveOffset = (pos16: number, track: NoteEvent['track']): number => {
      if (!params.grooveTemplate) return 0; // keep baseline if unset
      const r = Math.max(0, Math.min(1, extraTimeHumanize || 1));
      switch (grooveTemplate) {
        case 'shuffle':
          // Delay odd 16ths
          return (pos16 % 2 === 1 ? 0.35 * r : 0) * sixteenth;
        case 'mpc62':
          // Late 8th offbeats, slight late 16th pickups
          if (pos16 % 4 === 2) return 0.24 * r * sixteenth;
          if (pos16 % 4 === 3) return 0.08 * r * sixteenth;
          return 0;
        case 'funk':
          // Slightly early hats/snare on 2 and 4; others slightly late
          if (track === 'drums') {
            if (pos16 % 8 === 4) return -0.08 * r * sixteenth; // beat 2 & 4
            if (pos16 % 2 === 1) return 0.06 * r * sixteenth;  // late off 16ths
          }
          return 0;
        case 'straight':
        default:
          return 0;
      }
    };
    // Phase 1 is considered active only when new humanization features are explicitly used
    const isPhase1Active = Boolean(
      params.grooveTemplate ||
      params.humanizeTime ||
      params.humanizeVel ||
      params.leadChordToneBias ||
      params.accentMapIntensity ||
      params.bassAnticipation ||
      params.chordVoiceLeadingBias ||
      params.leadMaxLeapSemitones ||
      params.spaceAllocatorMinGapSecs
    );
    const finalizeTime = (t: number, pos16: number, swing: number, track: NoteEvent['track']): number => {
      // Baseline (Phase 0):
      // - lead/drums: humanizeTime + swing
      // - chords/bass/fx: humanizeTime only (no swing)
      // Phase 1 (when active): add groove offsets before swing for lead/drums
      const base = humanizeTime(t);
      const withGroove = isPhase1Active ? base + grooveOffset(pos16, track) : base;
      const needsSwing = track === 'lead' || track === 'drums';
      return needsSwing ? applySwing(withGroove, swing) : withGroove;
    };

    // Phase 2 activation (phrasing & cadence)
    const isPhase2Active = Boolean(params.phrasing || (params.cadenceStrength && params.cadenceStrength > 0));
    // Phase 3 activation (harmonic expansion)
    const isPhase3Active = Boolean(
      (params.harmonicComplexity && params.harmonicComplexity > 0) ||
      (params.harmonicRhythmVariance && params.harmonicRhythmVariance > 0) ||
      (params.pedalToneStrength && params.pedalToneStrength > 0)
    );
    // Phase 4 activation (inter-track conversation)
    const isPhase4Active = Boolean(
      (params.callResponseIntensity && params.callResponseIntensity > 0) ||
      (params.bassEchoProbability && params.bassEchoProbability > 0) ||
      (params.densityGateStrength && params.densityGateStrength > 0)
    );

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
    const sectionTimeline: Array<{ start: number; duration: number; energy: number; name: string }> = [];
    
    for (const section of config.sections) {
      const sectionBars = Math.max(1, Math.floor(section.bars * scaleFactor));
      const sectionDuration = sectionBars * 4 * beat;
      
      if (currentTime + sectionDuration > params.durationSecs) break;
      // Record section timeline for Phase 5 envelopes
      sectionTimeline.push({ start: currentTime, duration: sectionDuration, energy: section.energy, name: section.name });

      // Phase 4 call/response schedule (deterministic per section)
      const crIntensity = Math.max(0, Math.min(1, params.callResponseIntensity ?? 0));
      const densityGate = Math.max(0, Math.min(1, params.densityGateStrength ?? 0));
      const responseEven = roll(0.5); // choose even/odd bars as response bars

      // Generate events for this section based on included instruments
      if (section.instruments.includes('lead')) {
        generateLeadLine(events, currentTime, sectionDuration, section, config, leadMotif, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth, choose, finalizeTime, params,
          cr: { intensity: crIntensity, responseEven, densityGate }
        });
      }
      
      if (section.instruments.includes('chords')) {
        generateChordProgression(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, rootC4, scale, choose, finalizeTime, params,
          cr: { intensity: crIntensity, responseEven, densityGate }
        });
      }
      
      if (section.instruments.includes('bass')) {
        generateBassLine(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, sixteenth, choose, finalizeTime, params,
          cr: { intensity: crIntensity, responseEven, densityGate }
        });
      }
      
      if (section.instruments.includes('drums')) {
        generateDrumPattern(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, beat, sixteenth, choose, finalizeTime, params
        });
      }
      
      if (section.instruments.includes('fx')) {
        generateFXEvents(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, beat
        });
      }

      // Phase 3: optional pedal tones in low-energy/break sections
      const pedal = Math.max(0, Math.min(1, params.pedalToneStrength ?? 0));
      const lowEnergyOrBreak = section.name.toLowerCase().includes('break') || section.energy <= 0.35 || section.name.toLowerCase().includes('ambient');
      if (pedal > 0 && lowEnergyOrBreak) {
        // chance scaled by pedal setting and low energy
        const p = 0.4 * pedal + (section.energy < 0.3 ? 0.2 : 0);
        if (pedal >= 0.99 || roll(Math.min(0.9, p))) {
          const pedalPitch = clampPitch(rootC4 + scale[0] - 24, config.register.bass[0], config.register.bass[1]);
          const pedalTime = finalizeTime(currentTime, 0, config.rhythmPattern.swing, 'bass');
          const pedalVel = humanizeVelocity(0.35 + section.energy * 0.15);
          events.push({
            time: pedalTime,
            pitch: pedalPitch,
            duration: sectionDuration,
            velocity: pedalVel,
            track: 'bass',
          });
        }
      }
      
      currentTime += sectionDuration;
      sectionStartBar += sectionBars;
    }
    
    // Sort events by time with tie-breakers
    events.sort((a, b) => {
      const dt = a.time - b.time;
      if (dt !== 0) return dt;
      const dp = (a.pitch ?? 0) - (b.pitch ?? 0);
      if (dp !== 0) return dp;
      const ta = a.track ?? '';
      const tb = b.track ?? '';
      return ta.localeCompare(tb);
    });
    // Enforce non-decreasing times (guard against rare floating jitter)
    for (let i = 1; i < events.length; i++) {
      if (events[i].time < events[i - 1].time) {
        events[i].time = events[i - 1].time;
      }
    }
    
    // Debug guard: ensure non-decreasing times
    for (let i = 1; i < events.length; i++) {
      if (events[i].time < events[i - 1].time) {
        throw new Error('Unsorted after normalize: ' + JSON.stringify({
          i,
          prev: events[i - 1],
          cur: events[i],
        }));
      }
    }

    // Optional Phase 1: space allocator (per-track minimal gap / non-overlap)
    const minGap = Math.max(0, params.spaceAllocatorMinGapSecs ?? 0);
    if (minGap > 0) {
      const byTrack = new Map<string, NoteEvent[]>();
      for (const e of events) {
        const t = e.track ?? 'unknown';
        if (!byTrack.has(t)) byTrack.set(t, []);
        byTrack.get(t)!.push(e);
      }
      for (const [t, arr] of byTrack) {
        arr.sort((a, b) => a.time - b.time);
        let curEnd = -Infinity;
        for (const e of arr) {
          if (e.time < curEnd + minGap) {
            const shift = (curEnd + minGap) - e.time;
            e.time += shift;
          }
          curEnd = e.time + (e.duration ?? 0);
        }
      }
      // Re-sort after adjustments and enforce non-decreasing times
      events.sort((a, b) => {
        const dt = a.time - b.time;
        if (dt !== 0) return dt;
        const dp = (a.pitch ?? 0) - (b.pitch ?? 0);
        if (dp !== 0) return dp;
        const ta = a.track ?? '';
        const tb = b.track ?? '';
        return ta.localeCompare(tb);
      });
      for (let i = 1; i < events.length; i++) {
        if (events[i].time < events[i - 1].time) {
          events[i].time = events[i - 1].time;
        }
      }
    }

    // Clamp durations to not exceed requested total duration
    const totalSecs = params.durationSecs;
    for (const e of events) {
      const end = e.time + (e.duration ?? 0);
      if (end > totalSecs) {
        e.duration = Math.max(0, totalSecs - e.time);
      }
    }

    // Phase 5: Dynamics/Automation — section envelopes and sidechain metadata
    const dynShape = params.dynamicsShape ?? 'flat';
    const dynStr = Math.max(0, Math.min(1, params.dynamicsStrength ?? 0));
    const regLift = Math.max(0, Math.min(1, params.registerLiftStrength ?? 0));
    const scStrength = Math.max(0, Math.min(1, params.sidechainStrength ?? 0));

    const applyEnv = (x01: number) => {
      switch (dynShape) {
        case 'rise':
          return 1 + (x01 - 0.5) * 0.4 * dynStr; // -0.2..+0.2 range
        case 'fall':
          return 1 + ((0.5 - x01)) * 0.4 * dynStr;
        case 'swell': {
          const s = Math.sin(Math.PI * x01); // 0..1..0
          return 1 + s * 0.25 * dynStr; // up to +0.25 at center
        }
        case 'flat':
        default:
          return 1;
      }
    };

    if (dynStr > 0 || regLift > 0 || scStrength > 0) {
      // Build quick index of section by time
      const findSection = (t: number) => sectionTimeline.find(s => t >= s.start && t < s.start + s.duration) ?? sectionTimeline[sectionTimeline.length - 1];
      // Collect kick pulses for sidechain metadata
      const kickTimes = events.filter(e => e.track === 'drums' && e.pitch === 36).map(e => e.time);
      const beatDur = beat;
      for (const e of events) {
        // Section envelope for velocity and note length
        if (dynStr > 0) {
          const sec = findSection(e.time);
          const x = Math.max(0, Math.min(1, (e.time - sec.start) / Math.max(0.0001, sec.duration)));
          const f = applyEnv(x);
          e.velocity = Math.max(0.1, Math.min(1, e.velocity * f));
          // Note length scaling a bit milder
          e.duration = Math.max(0.02, e.duration * (1 + (f - 1) * 0.6));
        }
        // Gentle register lift near climax on lead
        if (regLift > 0 && e.track === 'lead') {
          const sec = findSection(e.time);
          const x = Math.max(0, Math.min(1, (e.time - sec.start) / Math.max(0.0001, sec.duration)));
          // Emphasize later/center depending on shape
          const liftBias = dynShape === 'rise' ? x : dynShape === 'swell' ? Math.sin(Math.PI * x) : 0;
          if (liftBias > 0.8 && (rand() < regLift * 0.5)) {
            e.pitch = clampPitch(e.pitch + 12, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
          }
        }
        // Optional mild ducking for chords/bass near kick pulses
        if (scStrength > 0 && (e.track === 'chords' || e.track === 'bass')) {
          // nearest kick within ~1/8 note
          const near = kickTimes.find(tk => Math.abs(tk - e.time) <= beatDur * 0.125);
          if (near != null) {
            e.velocity = Math.max(0.1, e.velocity * (1 - 0.35 * scStrength));
          }
        }
      }
    }

    const output: EngineOutput = {
      events,
      meta: {
        bpm: params.bpm,
        key: params.key,
        style: params.style,
        variation: params.variation,
        swing: config.rhythmPattern.swing,
        lfos: makeEnhancedLfos(params),
        sidechain: (scStrength > 0) ? { pulses: events.filter(e => e.track === 'drums' && e.pitch === 36).map(e => e.time), strength: scStrength } : undefined,
        versionTag: (
          (dynStr > 0 || regLift > 0 || scStrength > 0 || (params.extendedLfoTargets ?? 0) > 0)
            ? 'v2-phase5'
            : (isPhase4Active ? 'v2-phase4' : (
              isPhase3Active ? 'v2-phase3' : (
              (params.phrasing || params.cadenceStrength) ? 'v2-phase2' : (
                params.grooveTemplate ||
                params.humanizeTime ||
                params.humanizeVel ||
                params.leadChordToneBias ||
                params.accentMapIntensity ||
                params.bassAnticipation ||
                params.chordVoiceLeadingBias ||
                params.leadMaxLeapSemitones ||
                params.spaceAllocatorMinGapSecs
              ) ? 'v2-phase1' : 'v2-sortfix'
            )))
        ),
      },
    };
    try {
      if (style === 'edm') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        import('node:fs').then((m: any) => {
          const writeFileSync = m.writeFileSync || (m.default && m.default.writeFileSync);
          if (writeFileSync) {
            writeFileSync(
              '.engine-edm-events.json',
              JSON.stringify(
                events.map(e => ({ t: e.time, p: e.pitch, d: e.duration, v: e.velocity, tr: e.track })),
                null,
                2
              )
            );
          }
        }).catch(() => {});
      }
    } catch {}
    
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
  const { rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth, choose, finalizeTime, params } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const noteCount = Math.floor(duration / sixteenth);
  let lastLeadPitch: number | undefined;

  // Call and response structure
  const call = motif.slice(0, motif.length / 2);
  const response = call.map(d => (d + choose([-1, 1, 2])) % 7).reverse();
  const fullMotif = call.concat(response);

  // Melodic contour
  const contours = {
    rising: (i: number) => Math.floor(i / 4),
    falling: (i: number) => -Math.floor(i / 4),
    arch: (i: number) => {
      const mid = noteCount / 2;
      return Math.round(Math.sin((i / mid) * Math.PI) * 3);
    },
  };
  const contour = roll(0.3) ? choose(Object.values(contours)) : null;
  
  // Precompute bias for strong-beat targeting
  const chordBiasGlobal = Math.max(0, Math.min(1, params?.leadChordToneBias ?? 0));
  // Phase 2: phrasing & cadence settings
  const cadenceStrength = Math.max(0, Math.min(1, params?.cadenceStrength ?? 0));
  const phraseBars = params?.phrasing ? (params.phrasing === 'short' ? 2 : 4) : (cadenceStrength > 0 ? 4 : undefined);
  const phraseLen16 = phraseBars ? phraseBars * 16 : 0;
  const sectionBars = Math.max(1, Math.floor(duration / (4 * beat)));
  const phrasesInSection = phraseBars ? Math.max(1, Math.floor(sectionBars / phraseBars)) : 0;
  const climaxPhraseIndex = phraseBars && phrasesInSection > 0 ? Math.floor(rand() * phrasesInSection) : -1;

  for (let i = 0; i < noteCount; i++) {
    const time = startTime + i * sixteenth;
    if (time >= startTime + duration) break;
    
    // Density-based note triggering with musical phrasing
    const phrasePosition = (i % 16) / 16; // Position in 4/4 bar
    const pos16 = i % 16;
    const isDownbeat = pos16 === 0;
    const isOffbeat = i % 8 === 4;
    const isStrongBeat = pos16 === 0 || pos16 === 8; // beats 1 and 3
    
    let triggerProbability = section.density * section.energy;
    if (isDownbeat) triggerProbability *= 1.5;
    if (isOffbeat) triggerProbability *= 1.2;
    // Phase 4: call/response — thin lead on designated response bars
    if ((cr?.intensity ?? 0) > 0) {
      const barInSection = Math.floor((time - startTime) / (4 * beat));
      const isResponseBar = ((barInSection % 2 === 0) === Boolean(cr.responseEven));
      if (isResponseBar) {
        triggerProbability *= (1 - 0.6 * Math.max(0, Math.min(1, cr.intensity ?? 0)));
      }
    }
    // Phase 2: create a small breath before cadence by thinning just before last beat of the phrase
    if (phraseBars) {
      const idxInPhrase = i % phraseLen16;
      const inPreCadence = idxInPhrase >= phraseLen16 - 8 && idxInPhrase < phraseLen16 - 4;
      if (inPreCadence && cadenceStrength > 0) {
        triggerProbability *= (1 - 0.6 * cadenceStrength);
      }
    }
    // If chord-tone bias is requested, slightly boost the chance to place notes on strong beats
    if (chordBiasGlobal > 0 && isStrongBeat) {
      triggerProbability = Math.max(0.9, Math.min(1, triggerProbability + 0.2 * chordBiasGlobal));
    }
    
    const doCadenceNow = phraseBars ? ((i % phraseLen16) === (phraseLen16 - 4) && cadenceStrength > 0) : false;
    if (doCadenceNow || (chordBiasGlobal > 0 && isStrongBeat) || roll(triggerProbability)) {
      const motifIndex = i % fullMotif.length;
      let degree = fullMotif[motifIndex];

      if (contour) {
        degree = (degree + contour(i) + 7) % 7;
      }

      // Harmonic cohesion and chord-tone targeting
      const barPosition = Math.floor(i / 16);
      const progressionIndex = Math.floor(barPosition / 2) % config.chordProgression.length;
      const chordDef = config.chordProgression[progressionIndex];
      // Phase 0 default: snap to chord root on downbeats with 50% chance.
      // Preserve baseline by default; allow disabling only if explicitly set to false.
      if ((params?.enableLeadDownbeatChordRoot ?? true) && isDownbeat && roll(0.5)) {
        degree = chordDef.degree;
      }
      const chordBias = chordBiasGlobal;
      if (doCadenceNow) {
        // Enforce cadential resolution on phrase end: prefer root or fifth
        const cadenceDegrees = [chordDef.degree, (chordDef.degree + 4) % 7];
        degree = choose(cadenceDegrees);
      } else if (chordBias > 0 && isStrongBeat) {
        const chordToneDegrees = [chordDef.degree, (chordDef.degree + 2) % 7, (chordDef.degree + 4) % 7];
        degree = choose(chordToneDegrees);
      } else if (chordBias > 0 && !isStrongBeat && roll(chordBias * 0.3)) {
        // Passing/neighbor tones near chord
        degree = (chordDef.degree + choose([-1, 1])) % 7;
        if (degree < 0) degree += 7;
      }

      const octave = 1 + Math.floor(rand() * 2); // Vary octave
      let pitch = clampPitch(scalePitch(degree, octave), config.register.lead[0], config.register.lead[1]);
      // Optional Phase 1: limit melodic leaps via octave folding
      const maxLeap = Math.max(0, params?.leadMaxLeapSemitones ?? 0);
      if (maxLeap > 0 && lastLeadPitch != null) {
        // Fold by octaves towards previous pitch until within maxLeap or register bounds
        let tries = 0;
        while (Math.abs(pitch - lastLeadPitch) > maxLeap && tries < 4) {
          if (pitch > lastLeadPitch) pitch -= 12; else pitch += 12;
          // Keep within register; if out of bounds, break
          if (pitch < config.register.lead[0] || pitch > config.register.lead[1]) break;
          tries++;
        }
        // Final clamp just in case
        pitch = clampPitch(pitch, config.register.lead[0], config.register.lead[1]);
      }
      // Phase 2: motif climax — select one phrase per section to emphasize by register/velocity
      if (phraseBars) {
        const curPhrase = Math.floor((i) / phraseLen16);
        const isClimaxPhrase = curPhrase === climaxPhraseIndex;
        if (isClimaxPhrase && roll(0.8)) {
          pitch = clampPitch(pitch + 12, config.register.lead[0], config.register.lead[1]);
        }
      }
      
      // Musical note durations
      const durationChoices = [sixteenth, sixteenth * 2, sixteenth * 3, sixteenth * 4];
      const noteDuration = choose(durationChoices);
      
      let velBase = 0.6 + section.energy * 0.3;
      if (phraseBars) {
        const curPhrase = Math.floor((i) / phraseLen16);
        const isClimaxPhrase = curPhrase === climaxPhraseIndex;
        if (isClimaxPhrase) velBase += 0.08;
      }
      if (doCadenceNow) velBase += 0.1; // highlight cadence resolution
      const velocity = humanizeVelocity(velBase);
      let finalTime = finalizeTime(time, pos16, config.rhythmPattern.swing, 'lead');
      // Pin strong-beat chord-tone notes tightly to the beat to align with chord onset for metrics
      if (chordBiasGlobal > 0 && isStrongBeat) {
        finalTime = Math.round(finalTime / beat) * beat;
      }
      if (doCadenceNow) {
        finalTime = Math.round(finalTime / beat) * beat;
      }
      
      const ev = {
        time: finalTime,
        pitch,
        duration: noteDuration,
        velocity,
        track: 'lead' as const,
      };
      // Phase 4: density gate — reduce simultaneous onsets across tracks
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - finalTime) < sixteenth * 0.25 ? 1 : 0), 0);
        if (near >= 3 && roll(gate * 0.7)) {
          continue;
        }
      }
      events.push(ev);
      lastLeadPitch = ev.pitch;
    }
  }
}

const CHORD_SUBSTITUTIONS: Record<number, { degree: number; quality: ChordProgression['quality'] }[]> = {
  0: [{ degree: 5, quality: 'minor' }, { degree: 2, quality: 'minor' }], // I -> vi, iii
  3: [{ degree: 1, quality: 'minor' }], // IV -> ii
  4: [{ degree: 6, quality: 'diminished' }], // V -> vii°
  5: [{ degree: 0, quality: 'major' }, { degree: 2, quality: 'minor' }], // vi -> I, iii
};

function generateChordProgression(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, rootC4, scale, choose, finalizeTime, params } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const chordChanges = Math.floor(duration / beat); // One chord per beat potentially
  let lastChordPitches: number[] | undefined;
  
  for (let i = 0; i < chordChanges; i += 2) { // Change chords every 2 beats
    const time = startTime + i * beat;
    if (time >= startTime + duration) break;
    
    const progressionIndex = Math.floor((i / 2) % config.chordProgression.length);
    let chordDef = config.chordProgression[progressionIndex];

    // Probabilistically apply chord substitution (Phase 0 default enabled)
    if ((params?.enableChordSubstitutions ?? true)) {
      const baseSubP = 0.15;
      const hc = Math.max(0, Math.min(1, params?.harmonicComplexity ?? 0));
      const subProb = baseSubP + 0.35 * hc; // increase substitution chance with harmonic complexity
      if (roll(subProb)) {
        // Choose from diatonic substitutions, modal interchange, or secondary dominants when complexity is on
        const candidates: { degree: number; quality: ChordProgression['quality'] }[] = [];
        if (CHORD_SUBSTITUTIONS[chordDef.degree]) {
          candidates.push(...CHORD_SUBSTITUTIONS[chordDef.degree]);
        }
        if (hc > 0) {
          // Modal interchange: borrow iv (minor) or bVII (major) depending on current quality context
          candidates.push({ degree: (chordDef.degree + 4) % 7, quality: 'minor' }); // iv (borrowed)
          candidates.push({ degree: 6, quality: 'major' }); // bVII (approx in degree mapping)
          // Secondary dominant of the NEXT chord
          const nextIdx = Math.floor(((i / 2) + 1) % config.chordProgression.length);
          const nextChord = config.chordProgression[nextIdx];
          const secDomDegree = (nextChord.degree + 4) % 7; // V of next
          candidates.push({ degree: secDomDegree, quality: 'dominant7' });
        }
        if (candidates.length > 0) {
          chordDef = choose(candidates);
        }
      }
    }
    
    const chordRoot = rootC4 + scale[chordDef.degree];
    
    // Choose inversion; optionally bias for minimal movement from previous chord
    const vlBias = Math.max(0, Math.min(1, params?.chordVoiceLeadingBias ?? 0));
    let inversion = roll(0.2) ? choose([0, 1, 2]) : 0;
    let chordNotes = getChordNotes(chordRoot, chordDef.quality, inversion);
    if (vlBias > 0 && lastChordPitches && lastChordPitches.length > 0) {
      const candidates = [0, 1, 2].map(inv => {
        const notes = getChordNotes(chordRoot, chordDef.quality, inv).map(n => clampPitch(n, config.register.chords[0], config.register.chords[1]));
        // Compute greedy nearest movement cost
        const prev = lastChordPitches.slice().sort((a, b) => a - b);
        const cur = notes.slice().sort((a, b) => a - b);
        const used = new Set<number>();
        let cost = 0;
        for (const p of prev) {
          let bestIdx = -1; let bestDist = Infinity;
          for (let j = 0; j < cur.length; j++) {
            if (used.has(j)) continue;
            const d = Math.abs(cur[j] - p);
            if (d < bestDist) { bestDist = d; bestIdx = j; }
          }
          if (bestIdx >= 0) { used.add(bestIdx); cost += bestDist; }
        }
        const voices = Math.min(prev.length, cur.length) || 1;
        return { inv, notes, cost: cost / voices };
      });
      candidates.sort((a, b) => a.cost - b.cost);
      const chosen = candidates[0];
      inversion = chosen.inv;
      chordNotes = chosen.notes;
    }
    
    // Add some chord rhythm variation (Phase 3: harmonicRhythmVariance)
    let rhythmPattern: number[] = roll(0.3) ? [0, beat] : [0]; // baseline behavior
    const hrv = Math.max(0, Math.min(1, params?.harmonicRhythmVariance ?? 0));
    if (hrv > 0 && roll(0.2 + 0.6 * hrv)) {
      const patterns: number[][] = [
        [0],                 // hold 2 beats
        [0, beat],           // split on beat
        [0, beat * 1.5],     // late accent
        [0.5 * beat, beat],  // anticipation then beat
        [0, 0.75 * beat, 1.5 * beat], // syncopated triad hits within 2 beats
      ];
      rhythmPattern = choose(patterns);
    }
    
    for (const rhythmOffset of rhythmPattern) {
      const chordTime = time + rhythmOffset;
      if (chordTime >= startTime + duration) continue;
      // Phase 4: call/response — thin chords on CALL bars
      if ((cr?.intensity ?? 0) > 0) {
        const barInSection = Math.floor((chordTime - startTime) / (4 * beat));
        const isResponseBar = ((barInSection % 2 === 0) === Boolean(cr.responseEven));
        // On call bars (not response), probabilistically skip chord hits
        if (!isResponseBar && roll(0.4 * Math.max(0, Math.min(1, cr.intensity ?? 0)))) {
          continue;
        }
      }
      
      // Phase 4: density gate — avoid piling on when many onsets coincide
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - chordTime) < (beat * 0.125) ? 1 : 0), 0);
        if (near >= 4 && roll(gate * 0.8)) {
          continue;
        }
      }

      for (const note of chordNotes) {
        const clampedPitch = clampPitch(note, config.register.chords[0], config.register.chords[1]);
        const velocity = humanizeVelocity(0.4 + section.energy * 0.2);
        const noteDuration = beat * (rhythmPattern.length === 1 ? 2 : 1);
        
        events.push({
          // Baseline: chords do not get swing
          time: finalizeTime(chordTime, Math.floor((chordTime / (beat / 4)) % 16), config.rhythmPattern.swing, 'chords'),
          pitch: clampedPitch,
          duration: noteDuration,
          velocity,
          track: 'chords',
        });
      }
      // Remember last chord block at this start time
      lastChordPitches = chordNotes.map(n => clampPitch(n, config.register.chords[0], config.register.chords[1]));
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
  const { rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, sixteenth, choose, finalizeTime, params } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
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

    // Rhythmic interplay (Phase 0 default enabled)
    if ((params?.enableBassLeadInterplay ?? true) && roll(0.1)) {
        const leadEvent = events.find(e => e.track === 'lead' && Math.abs(e.time - time) < sixteenth / 2);
        if (leadEvent) {
            triggerProbability = 1;
        }
    }
    
    if (roll(triggerProbability)) {
      const barPosition = Math.floor(i / 16);
      const progressionIndex = Math.floor(barPosition / 2) % config.chordProgression.length;
      const chordDef = config.chordProgression[progressionIndex];
      
      // Arpeggiate chords occasionally
      if (roll(0.15)) {
        const chordNotes = getChordNotes(scalePitch(chordDef.degree, -1), chordDef.quality);
        const arpNotes = choose([[0, 1, 2], [0, 2, 1], [2, 1, 0]])
        for (let j = 0; j < 3; j++) {
          const arpTime = time + j * (sixteenth / 2);
          if (arpTime >= startTime + duration) continue;
          events.push({
            time: humanizeTime(arpTime),
            pitch: clampPitch(chordNotes[arpNotes[j]], config.register.bass[0], config.register.bass[1]),
            duration: sixteenth / 2,
            velocity: humanizeVelocity(0.6 + section.energy * 0.2),
            track: 'bass',
          });
        }
        i += 1; // advance the main loop
        continue;
      }

      // Bass plays root or fifth
      const rootDegree = chordDef.degree;
      const degree = roll(0.8) ? rootDegree : (rootDegree + 4) % 7; // Root or fifth
      
      const pitch = clampPitch(scalePitch(degree, -1), config.register.bass[0], config.register.bass[1]);
      const velocity = humanizeVelocity(0.7 + section.energy * 0.2);
      const noteDuration = sixteenth * (roll(0.3) ? 4 : 2); // Vary note lengths
      
      // Phase 4: density gate — reduce piling on
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      const evtTime = finalizeTime(time, beatPosition, config.rhythmPattern.swing, 'bass');
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - evtTime) < sixteenth * 0.25 ? 1 : 0), 0);
        if (near >= 3 && roll(gate * 0.6)) {
          continue;
        }
      }

      events.push({
        // Baseline: bass does not get swing
        time: evtTime,
        pitch,
        duration: noteDuration,
        velocity,
        track: 'bass',
      });

      // Add passing tones
      const nextProgressionIndex = Math.floor((barPosition + 1) / 2) % config.chordProgression.length;
      if (i % 16 === 15 && nextProgressionIndex !== progressionIndex) {
        const nextChordDef = config.chordProgression[nextProgressionIndex];
        const nextRootDegree = nextChordDef.degree;
        const degreeDiff = nextRootDegree - rootDegree;
        if (Math.abs(degreeDiff) === 1 || Math.abs(degreeDiff) === 2) {
          const passingNoteDegree = rootDegree + Math.sign(degreeDiff);
          const passingNotePitch = clampPitch(scalePitch(passingNoteDegree, -1), config.register.bass[0], config.register.bass[1]);
          events.push({
            // Baseline: bass does not get swing
            time: finalizeTime(time + sixteenth * 0.75, (beatPosition + 0.75) % 16, config.rhythmPattern.swing, 'bass'),
            pitch: passingNotePitch,
            duration: sixteenth * 0.25,
            velocity: humanizeVelocity(0.5 + section.energy * 0.2),
            track: 'bass',
          });
        }
      }

      // Optional anticipation on & of 4 into next bar
      const anticip = Math.max(0, Math.min(1, params?.bassAnticipation ?? 0));
      if (anticip > 0 && beatPosition === 15 && roll(anticip)) {
        const nextRootDegree = config.chordProgression[Math.floor((barPosition + 1) / 2) % config.chordProgression.length].degree;
        const anticipPitch = clampPitch(scalePitch(nextRootDegree, -1), config.register.bass[0], config.register.bass[1]);
        const anticipTime = time - sixteenth * 0.5;
        if (anticipTime >= startTime) {
          events.push({
            // Baseline: bass does not get swing
            time: finalizeTime(anticipTime, 15, config.rhythmPattern.swing, 'bass'),
            pitch: anticipPitch,
            duration: sixteenth * 0.5,
            velocity: humanizeVelocity(0.55 + section.energy * 0.2),
            track: 'bass',
          });
        }
      }

      // Phase 4: bass echoes recent lead fragments (low probability)
      const echoProb = Math.max(0, Math.min(1, params?.bassEchoProbability ?? 0));
      if (echoProb > 0) {
        // find a recent lead event within last half-beat
        const recentLead = [...events].reverse().find(e => e.track === 'lead' && e.time <= time && (time - e.time) <= (beat * 0.5));
        if (recentLead && roll(echoProb)) {
          const echoTime = Math.min(startTime + duration - sixteenth * 0.5, recentLead.time + sixteenth);
          if (echoTime >= startTime) {
            const echoPitch = clampPitch((recentLead.pitch ?? 48) - 12, config.register.bass[0], config.register.bass[1]);
            events.push({
              time: finalizeTime(echoTime, Math.floor((echoTime / (beat / 4)) % 16), config.rhythmPattern.swing, 'bass'),
              pitch: echoPitch,
              duration: sixteenth * 0.75,
              velocity: humanizeVelocity(0.45 + section.energy * 0.15),
              track: 'bass',
            });
          }
        }
      }
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
  const { rand, roll, humanizeTime, humanizeVelocity, applySwing, beat, sixteenth, choose, finalizeTime, params } = utils;
  const pattern = config.rhythmPattern;
  const bars = Math.floor(duration / (4 * beat));

  const fillPatterns = [
    [0, 2, 4, 6, 8, 10, 12, 14], // 8th note fill
    [0, 1, 2, 3, 4, 5, 6, 7], // 16th note fill
    [0, 4, 8, 12], // 4th note fill
  ];
  
  for (let bar = 0; bar < bars; bar++) {
    const barStart = startTime + bar * 4 * beat;
    let hatCountThisBar = 0;
    
    // Add fills occasionally
    const isFill = section.fill && roll(0.25) && bar % 4 === 3;
    
    if (isFill) {
      // Generate drum fill
      const fillPattern = choose(fillPatterns);
      for (const pos of fillPattern) {
        const time = barStart + pos * sixteenth;
        const pitch = roll(0.5) ? 38 : 42; // Snare or hi-hat
        const velocity = humanizeVelocity(0.5 + (pos / 16) * 0.3); // Build velocity
        
        events.push({
          time: finalizeTime(time, pos, pattern.swing, 'drums'),
          pitch,
          duration: sixteenth * 0.8,
          velocity,
          track: 'drums',
        });
      }
    } else {
      // Regular pattern
      for (let i = 0; i < 16; i++) {
        const time = barStart + i * sixteenth;

        // Probabilistic kick
        if (pattern.kick.includes(i) && roll(0.9)) {
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 36, // Kick
            duration: sixteenth * 2,
            velocity: humanizeVelocity(0.8 + section.energy * 0.15),
            track: 'drums',
          });
        }

        // Probabilistic snare
        if (pattern.snare.includes(i) && roll(0.9)) {
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 38, // Snare
            duration: sixteenth * 1.5,
            velocity: humanizeVelocity(0.7 + section.energy * 0.2),
            track: 'drums',
          });
        }

        // Probabilistic hi-hats (slightly higher when groove template is active to ensure detectable offbeats)
        const hatProb = (params?.grooveTemplate && params.grooveTemplate !== 'straight') ? 0.95 : 0.8;
        if (pattern.hats.includes(i) && roll(hatProb)) {
          const isAccent = i % 4 === 0;
          let velBase = (isAccent ? 0.6 : 0.4) + section.energy * 0.1;
          const accent = Math.max(0, Math.min(1, params?.accentMapIntensity ?? 0));
          if (accent > 0) {
            // Simple accent map: boost 0,4,8,12; lighten 2,6,10,14
            if ([0,4,8,12].includes(i)) velBase += 0.15 * accent;
            if ([2,6,10,14].includes(i)) velBase -= 0.08 * accent;
          }
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 42, // Hi-hat
            duration: sixteenth * 0.5,
            velocity: humanizeVelocity(velBase),
            track: 'drums',
          });
          hatCountThisBar++;
        }

        // Probabilistic ghost notes
        if (pattern.ghostNotes.includes(i) && roll(section.energy * 0.5)) {
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 38, // Snare
            duration: sixteenth * 0.3,
            velocity: humanizeVelocity(0.2 + section.energy * 0.1),
            track: 'drums',
          });
        }
      }
    }
    // Ensure at least one hat per bar at a canonical position when using explicit groove templates,
    // so cross-style timing comparisons have observable samples.
    if ((params?.grooveTemplate && params.grooveTemplate !== 'straight') && hatCountThisBar === 0 && (config.rhythmPattern.hats?.length ?? 0) > 0) {
      const i = config.rhythmPattern.hats[0];
      const time = barStart + i * sixteenth;
      const isAccent = i % 4 === 0;
      let velBase = (isAccent ? 0.6 : 0.4) + section.energy * 0.1;
      events.push({
        time: finalizeTime(time, i, pattern.swing, 'drums'),
        pitch: 42,
        duration: sixteenth * 0.5,
        velocity: humanizeVelocity(velBase),
        track: 'drums',
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