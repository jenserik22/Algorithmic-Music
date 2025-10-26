import type { Engine, EngineOutput, GenerationParams, NoteEvent, LfoSpec, AdaptiveBiasProfile } from './types';
import { mulberry32, gaussianJitter } from '@/lib/music/seededRandom';
import { assignCloseVoicing, roleOf } from './voiceLeading';
import { getAdaptiveProfile } from './adaptiveMemory';

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
      { name: 'intro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords'], crash: true },
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
      { name: 'intro', bars: 4, density: 0.3, energy: 0.2, instruments: ['chords'] },
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
    // Phase 9: resolve adaptive profile
    const adaptiveStrength = Math.max(0, Math.min(1, params.adaptiveWeightingStrength ?? 0));
    const resolvedProfile: AdaptiveBiasProfile | undefined = (() => {
      if (params.adaptiveProfile && (Object.keys(params.adaptiveProfile.leadInterval2 ?? {}).length > 0 || (params.adaptiveProfile.hatPos16?.length ?? 0) > 0)) {
        return params.adaptiveProfile;
      }
      if (params.adaptiveProfileId) {
        try { return getAdaptiveProfile(params.adaptiveProfileId) ?? undefined; } catch { return undefined; }
      }
      return undefined;
    })();
    const hasProfileSignals = Boolean(resolvedProfile && (
      (resolvedProfile.leadInterval2 && Object.keys(resolvedProfile.leadInterval2).length > 0) ||
      (resolvedProfile.hatPos16 && resolvedProfile.hatPos16.length > 0)
    ));
    const isPhase9Active = adaptiveStrength > 0 && hasProfileSignals;

    const normalizedHatBias = (p?: AdaptiveBiasProfile): number[] | undefined => {
      if (!p?.hatPos16 || p.hatPos16.length === 0) return undefined;
      const arr = p.hatPos16.slice(0, 16);
      while (arr.length < 16) arr.push(0);
      const max = arr.reduce((a,b)=>Math.max(a, b ?? 0), 0);
      if (max <= 0) return undefined;
      return arr.map(x => {
        const v = (x ?? 0) / max; // 0..1
        return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
      });
    };
    const hatBias16 = isPhase9Active ? normalizedHatBias(resolvedProfile) : undefined;

    const weightedIntervalPick = (range: number): number => {
      if (!isPhase9Active || !resolvedProfile?.leadInterval2) {
        return Math.floor(rand() * (range * 2 + 1)) - range;
      }
      const eps = 1e-6;
      const ks: number[] = [];
      const ws: number[] = [];
      for (let d = -range; d <= range; d++) {
        const base = 1;
        const bRaw = resolvedProfile.leadInterval2[String(Math.max(-6, Math.min(6, d)))] ?? 0;
        const w = (1 - adaptiveStrength) * base + adaptiveStrength * (bRaw > 0 ? bRaw : 0);
        ks.push(d); ws.push(w + eps);
      }
      let sum = 0; for (const w of ws) sum += w;
      let r = rand() * sum;
      for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return ks[i]; }
      return ks[ks.length - 1];
    };
    
    const scalePitch = (deg: number, octave: number) => rootC4 + scale[(deg % 7 + 7) % 7] + 12 * octave;
    const bars = Math.max(1, Math.floor(params.durationSecs / (4 * beat)));
    
    const choose = <T,>(arr: T[]) => arr[Math.max(0, Math.min(arr.length - 1, Math.floor(rand() * arr.length)))];
    const roll = (p: number) => rand() < p;
    
    // Enhanced humanization
    const extraTimeHumanize = Math.max(0, Math.min(1, params.humanizeTime ?? 0));
    const extraVelHumanize = Math.max(0, Math.min(1, params.humanizeVel ?? 0));
    const dist = params.humanizeDistribution ?? 'uniform';
    const humanizeTime = (t: number) => {
      // Preserve baseline amplitude when humanizeTime is undefined
      if (dist === 'gaussian') {
        const baseHalf = 0.01 * variation;
        const base = gaussianJitter(rand, baseHalf / 1.96, baseHalf);
        const extraHalf = 0.01 * extraTimeHumanize;
        const extra = extraTimeHumanize > 0 ? gaussianJitter(rand, extraHalf / 1.96, extraHalf) : 0;
        return Math.max(0, t + base + extra);
      } else {
        const base = (rand() - 0.5) * 0.02 * variation;
        const extra = extraTimeHumanize > 0 ? (rand() - 0.5) * 0.02 * extraTimeHumanize : 0;
        return Math.max(0, t + base + extra);
      }
    };
    const humanizeVelocity = (v: number) => {
      // Base symmetric jitter preserves Phase 0 behavior when extraVelHumanize is 0
      const base = dist === 'gaussian'
        ? gaussianJitter(rand, (0.1 * variation) / 1.96, 0.1 * variation)
        : (rand() - 0.5) * 0.2 * variation;
      // Headroom-aware extra jitter to avoid clipping at bounds which can reduce variance
      const headroom = Math.max(0, Math.min(1 - v, v - 0.1));
      const extraAmp = 0.5 * extraVelHumanize; // stronger to ensure measurable variance increase
      const extra = extraVelHumanize > 0
        ? (dist === 'gaussian'
            ? gaussianJitter(rand, (headroom * extraAmp) / 1.96, headroom * extraAmp)
            : (rand() - 0.5) * 2 * headroom * extraAmp)
        : 0;
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
          // Delay odd 16ths; allow optional swingRatio (0.55..0.75) to scale delay amount
          {
            const sr = typeof params.swingRatio === 'number' ? Math.max(0.5, Math.min(0.75, params.swingRatio)) : undefined;
            const scale = sr ? Math.max(0, Math.min(1, (sr - 0.5) / 0.25)) : 1;
            const base = 0.35 * scale;
            return (pos16 % 2 === 1 ? base * r : 0) * sixteenth;
          }
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
    // Phase 7 activation (ornamentation & articulation)
    const isPhase7Active = Boolean(
      (params.ornamentation && params.ornamentation > 0) ||
      (params.legatoStrength && params.legatoStrength > 0) ||
      (params.chordStabArpIntensity && params.chordStabArpIntensity > 0)
    );
    // Phase 8 activation (evaluation & auto-repair)
    const isPhase8Active = Boolean(
      (params.evaluationStrength && params.evaluationStrength > 0) ||
      (params.autoRepairStrength && params.autoRepairStrength > 0)
    );

    const events: NoteEvent[] = [];

    // Simple mode presets (engine-side safety net)
    const simpleMode = Boolean(params.simpleMode);
    const simpleDefaults = simpleMode && params.style === 'edm' ? {
      leadChordToneBias: 0.6,
      chordVoiceLeadingBias: 0.6,
      leadMaxLeapSemitones: 9,
    } : simpleMode ? {
      leadChordToneBias: 0.5,
      chordVoiceLeadingBias: 0.6,
      leadMaxLeapSemitones: 7,
    } : {} as any;

    // Helper: progression index aligned to chord schedule (every 2 beats)
    const progressionAtTime = (t: number, sectionStart: number) => {
      const beatIndex = Math.floor((t - sectionStart) / beat);
      return Math.floor(beatIndex / 2) % config.chordProgression.length;
    };

    // Motif memory per progression index (round-robin reuse)
    const motifMemory = new Map<number, number[][]>();
    const motifCounters = new Map<number, number>();
    if (simpleMode) {
      const makeStepwisePattern = (len: number) => {
        let deg = Math.floor(rand() * 7);
        const out: number[] = [];
        for (let i = 0; i < len; i++) {
          const step = choose([-2,-1,0,1,2]);
          deg = (deg + step + 7) % 7;
          out.push(deg);
        }
        return out;
      };
      const patternsPerProg = 2;
      const patternLen = 8;
      for (let idx = 0; idx < config.chordProgression.length; idx++) {
        const arr: number[][] = [];
        for (let k = 0; k < patternsPerProg; k++) arr.push(makeStepwisePattern(patternLen));
        motifMemory.set(idx, arr);
        motifCounters.set(idx, 0);
      }
    }
    
    // Generate sophisticated motifs based on complexity
    const motifLength = complexity === 'simple' ? 4 : complexity === 'intermediate' ? 8 : 12;
    const intervalRange = complexity === 'simple' ? 2 : complexity === 'intermediate' ? 3 : 4;
    
    const leadMotif: number[] = [];
    let currentDegree = Math.floor(rand() * 7);
    for (let i = 0; i < motifLength; i++) {
      const intervalJump = weightedIntervalPick(intervalRange);
      currentDegree = (currentDegree + intervalJump + 7) % 7;
      leadMotif.push(currentDegree);
    }
    
    // Calculate sections based on available time
    const totalSectionBars = config.sections.reduce((sum, sec) => sum + sec.bars, 0);
    const scaleFactor = Math.min(1, bars / totalSectionBars);
    
    let currentTime = 0;
    let sectionStartBar = 0;
    const sectionTimeline: Array<{ start: number; duration: number; energy: number; name: string; instruments: SectionConfig['instruments'] }> = [];
    
    for (const section of config.sections) {
      const sectionBars = Math.max(1, Math.floor(section.bars * scaleFactor));
      const sectionDuration = sectionBars * 4 * beat;
      
      if (currentTime + sectionDuration > params.durationSecs) break;
      // Record section timeline for Phase 5 envelopes and Simple Mode arrangement gating
      sectionTimeline.push({ start: currentTime, duration: sectionDuration, energy: section.energy, name: section.name, instruments: section.instruments });

      // Phase 4 call/response schedule (deterministic per section)
      const crIntensity = Math.max(0, Math.min(1, params.callResponseIntensity ?? 0));
      const densityGate = Math.max(0, Math.min(1, params.densityGateStrength ?? 0));
      const responseEven = roll(0.5); // choose even/odd bars as response bars

      // Generate events for this section based on included instruments
      if (section.instruments.includes('lead')) {
        generateLeadLine(events, currentTime, sectionDuration, section, config, leadMotif, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth, choose, finalizeTime, params,
          cr: { intensity: crIntensity, responseEven, densityGate },
          simple: { simpleMode, simpleDefaults, motifMemory, motifCounters, progressionAtTime }
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
          cr: { intensity: crIntensity, responseEven, densityGate },
          simple: { simpleMode, progressionAtTime }
        });
      }
      
      if (section.instruments.includes('drums')) {
        generateDrumPattern(events, currentTime, sectionDuration, section, config, {
          rand, roll, humanizeTime, humanizeVelocity, applySwing, beat, sixteenth, choose, finalizeTime, params,
          phase9: isPhase9Active ? { hatBias: hatBias16, s: adaptiveStrength } : undefined,
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

    // Phase 7: Ornamentation & Articulation (lead ornaments, legato/ties, chord stabs/arps)
    if (isPhase7Active) {
      const orn = Math.max(0, Math.min(1, params.ornamentation ?? 0));
      const leg = Math.max(0, Math.min(1, params.legatoStrength ?? 0));
      const stab = Math.max(0, Math.min(1, params.chordStabArpIntensity ?? 0));

      const findSectionAt = (t: number) => {
        return sectionTimeline.find(s => t >= s.start && t < s.start + s.duration) ?? sectionTimeline[sectionTimeline.length - 1];
      };

      // Lead legato and ornaments
      const leadEvents = events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
      // Legato: reduce gaps proportionally; keep overlaps bounded
      if (leg > 0 && leadEvents.length > 1) {
        for (let i = 1; i < leadEvents.length; i++) {
          const prev = leadEvents[i-1];
          const cur = leadEvents[i];
          const gap = (cur.time - (prev.time + (prev.duration ?? 0)));
          if (gap > 0) {
            const reduce = gap * leg;
            prev.duration = Math.max(0.02, (prev.duration ?? 0) + reduce);
          } else if (gap < 0) {
            const maxOverlap = (prev.duration ?? 0) * 0.15 * leg;
            const actualOverlap = -gap;
            if (actualOverlap > maxOverlap) {
              prev.duration = Math.max(0.02, (prev.duration ?? 0) - (actualOverlap - maxOverlap));
            }
          }
          // Tie same pitch: extend slightly into next when identical pitch
          if (prev.pitch === cur.pitch && leg > 0) {
            const extend = Math.min(beat * 0.1, Math.max(0, cur.time - prev.time) * 0.3) * leg;
            prev.duration = Math.max(prev.duration ?? 0, (cur.time - prev.time) + extend);
          }
        }
      }

      // Ornaments: grace, slide, turn (pre-notes)
      if (orn > 0 && leadEvents.length > 0) {
        for (let i = 0; i < leadEvents.length; i++) {
          const e = leadEvents[i];
          const sec = findSectionAt(e.time);
          const p = Math.min(0.85, 0.15 + 0.35 * orn + 0.2 * sec.energy);
          if (roll(p)) {
            const minWindow = sixteenth * 0.25;
            const prev = i > 0 ? leadEvents[i-1] : undefined;
            const windowStart = prev ? (prev.time + (prev.duration ?? 0)) : (sec.start);
            const available = e.time - windowStart;
            if (available >= minWindow * 1.1) {
              const kind = choose(['grace','slide','turn'] as const);
              if (kind === 'grace' || kind === 'slide') {
                const d = sixteenth * (kind === 'grace' ? 0.25 : 0.3);
                const t = Math.max(sec.start, e.time - d * 1.05);
                const delta = choose([-2,-1,1,2]);
                const pitch = clampPitch(e.pitch + delta, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
                const barStart = Math.floor(t / (4 * beat)) * (4 * beat);
                const pos16 = Math.floor(((t - barStart) / sixteenth)) % 16;
                events.push({
                  time: finalizeTime(t, pos16, config.rhythmPattern.swing, 'lead'),
                  pitch,
                  duration: d * 0.9,
                  velocity: Math.max(0.1, e.velocity * (0.7 + 0.2 * orn)),
                  track: 'lead',
                });
              } else { // turn
                const step = sixteenth * 0.125;
                const t2 = Math.max(sec.start, e.time - step * 2.2);
                const seq = choose([[ -1, +1 ], [ +1, -1 ]] as const);
                for (let k = 0; k < 2; k++) {
                  const pk = clampPitch(e.pitch + seq[k], ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
                  const tk = t2 + k * step;
                  const barStart = Math.floor(tk / (4 * beat)) * (4 * beat);
                  const pos16 = Math.floor(((tk - barStart) / sixteenth)) % 16;
                  events.push({
                    time: finalizeTime(tk, pos16, config.rhythmPattern.swing, 'lead'),
                    pitch: pk,
                    duration: step * 0.9,
                    velocity: Math.max(0.1, e.velocity * (0.65 + 0.25 * orn)),
                    track: 'lead',
                  });
                }
              }
            }
          }
        }
      }

      // Chord stabs/arpeggios at section transitions
      if (stab > 0) {
        for (let si = 0; si < sectionTimeline.length; si++) {
          const sec = sectionTimeline[si];
          if (!sec.instruments.includes('chords')) continue;
          const t = sec.start;
          if (t >= params.durationSecs) continue;
          const progIdx = progressionAtTime(t, sec.start);
          const chordDef = ENHANCED_TEMPLATES[style].chordProgression[progIdx];
          const chordRoot = rootC4 + SCALES[config.scale][chordDef.degree];
          const inversion = roll(0.3) ? choose([0,1,2]) : 0;
          const notes = getChordNotes(chordRoot, chordDef.quality, inversion).map(n => clampPitch(n, config.register.chords[0], config.register.chords[1]));
          const doArp = roll(0.4 + 0.4 * stab);
          if (doArp) {
            const order = roll(0.5) ? [...notes].sort((a,b)=>a-b) : [...notes].sort((a,b)=>b-a);
            const step = Math.min(sixteenth * 0.25, Math.max(0.03, (sec.duration) * 0.02));
            for (let j = 0; j < order.length; j++) {
              const tk = t + j * step;
              if (tk >= sec.start + Math.min(sec.duration, beat * 1.5)) break;
              const barStart = Math.floor(tk / (4 * beat)) * (4 * beat);
              const pos16 = Math.floor(((tk - barStart) / sixteenth)) % 16;
              events.push({
                time: finalizeTime(tk, pos16, config.rhythmPattern.swing, 'chords'),
                pitch: order[j],
                duration: step * 1.2,
                velocity: humanizeVelocity(0.5 + sec.energy * 0.25),
                track: 'chords',
              });
            }
          } else {
            const barStart = Math.floor(t / (4 * beat)) * (4 * beat);
            const pos16 = Math.floor(((t - barStart) / sixteenth)) % 16;
            for (const n of notes) {
              events.push({
                time: finalizeTime(t, pos16, config.rhythmPattern.swing, 'chords'),
                pitch: n,
                duration: sixteenth * (0.5 + 0.5 * stab),
                velocity: humanizeVelocity(0.55 + sec.energy * 0.25),
                track: 'chords',
              });
            }
          }
        }
      }
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

    // Simple Mode: arrangement activity constraints (max 3 concurrent tracks; prefer lead over bass when present)
    if (simpleMode) {
      for (const sec of sectionTimeline) {
        const start = sec.start;
        const end = sec.start + sec.duration;
        const activeOrder = ['drums','chords','lead','bass'] as const;
        const keepCount = 3;
        const present = new Set(sec.instruments);
        const keepList = activeOrder.filter(t => present.has(t));
        const keep = new Set<string>(keepList.slice(0, keepCount));
        for (let i = events.length - 1; i >= 0; i--) {
          const e = events[i];
          if (e.time >= start && e.time < end) {
            if (e.track && !keep.has(e.track)) {
              events.splice(i, 1);
            }
          }
        }
      }
    }

    // Simple Mode safety gates: enforce chord tones on strong beats and reduce large leaps
    if (simpleMode) {
      const leadEvents = events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
      const chordEvents = events.filter(e => e.track === 'chords');
      // First, quantize chord onsets tightly to the grid so chord snapshots align with strong-beat lead notes
      for (const c of chordEvents) {
        // Snap to nearest 16th to remove humanization jitter
        c.time = Math.round(c.time / sixteenth) * sixteenth;
      }
      // Precompute chord blocks by onset time (after quantization above)
      const chordBlocksByTime = new Map<number, number[]>();

      // Strong-beat chord tone enforcement (beats 1 and 3)
      for (const e of leadEvents) {
        const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
        const pos16 = Math.round((e.time - barStart) / sixteenth) % 16;
        // Treat events very near beats 1 or 3 as strong too (within ~0.1 beat ~ 50ms at 120bpm)
        const rel = e.time - barStart;
        const strongTargets = [0, 2 * beat];
        let strong = (pos16 === 0 || pos16 === 8);
        if (!strong) {
          const nearest = strongTargets.reduce((a, b) => (Math.abs(b - rel) < Math.abs(a - rel) ? b : a), strongTargets[0]);
          if (Math.abs(nearest - rel) <= beat * 0.1) {
            strong = true;
            // Quantize to the exact strong beat to align with chords and metrics
            e.time = barStart + nearest;
          }
        }
        if (!strong) continue;
        // Determine chord at this time from actual chord events if available; fallback to schedule
        let chordNotes: number[] | undefined;
        if (chordBlocksByTime.size === 0 && chordEvents.length > 0) {
          // Build blocks lazily on first use, after potential quantization
          for (const c of chordEvents) {
            const t = +c.time.toFixed(6);
            const arr = chordBlocksByTime.get(t) ?? [];
            arr.push(c.pitch);
            chordBlocksByTime.set(t, arr);
          }
        }
        if (chordBlocksByTime.size > 0) {
          let bestT = -Infinity;
          for (const t of chordBlocksByTime.keys()) {
            if (t <= e.time && t > bestT) bestT = t;
          }
          if (bestT > -Infinity) {
            const arr = chordBlocksByTime.get(bestT) ?? [];
            chordNotes = arr.map(n => ((n % 12) + 12) % 12);
          }
        }
        if (!chordNotes || chordNotes.length === 0) {
          const sec = sectionTimeline.find(s=> e.time>=s.start && e.time < s.start + s.duration) ?? sectionTimeline[0];
          const progIdx = progressionAtTime(e.time, sec.start);
          const chordDef = ENHANCED_TEMPLATES[style].chordProgression[progIdx];
          const chordRoot = rootC4 + SCALES[config.scale][chordDef.degree];
          chordNotes = getChordNotes(chordRoot, chordDef.quality).map(n=> (n%12+12)%12);
        }
        const pClass = ((e.pitch%12)+12)%12;
        if (!chordNotes.includes(pClass)) {
          // Snap to nearest chord tone within lead register (preserve closest pitch class)
          let best = e.pitch; let bestD = Infinity;
          for (const c of chordNotes) {
            const curClass = ((e.pitch % 12) + 12) % 12;
            const shift = ((c - curClass + 18) % 12) - 6; // minimal signed semitone shift to reach chord tone class
            const cand = clampPitch(e.pitch + shift, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
            const d = Math.abs(cand - e.pitch);
            if (d < bestD) { bestD = d; best = cand; }
          }
          e.pitch = best;
        }
      }
      // Stepwise preference: fold large leaps by octaves where possible
      for (let i = 1; i < leadEvents.length; i++) {
        const prev = leadEvents[i-1];
        const cur = leadEvents[i];
        let diff = cur.pitch - prev.pitch;
        while (Math.abs(diff) > (simpleDefaults.leadMaxLeapSemitones ?? 9)) {
          if (diff > 0) cur.pitch -= 12; else cur.pitch += 12;
          diff = cur.pitch - prev.pitch;
          cur.pitch = clampPitch(cur.pitch, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
        }
      }

      // FINAL strict pass (Simple Mode): align with metrics strong-beat detection (<=50ms) and force chord tones
      // This uses the same notion of "strong beats" as metrics.ts (beats 1 & 3 in 4/4; i % 4 === 0 || 2)
      // and snaps both timing and pitch class to the nearest chord tone when within 50ms.
      const strongTol = 0.05; // seconds
      const beatDur = beat;
      // Build chord blocks using millisecond rounding to mirror metrics.extractChordBlocks
      const chordBlocksMs = new Map<number, number[]>();
      for (const c of chordEvents) {
        const tKey = +c.time.toFixed(3);
        const arr = chordBlocksMs.get(tKey) ?? [];
        arr.push(c.pitch);
        chordBlocksMs.set(tKey, arr);
      }
      const chordTimesSorted = Array.from(chordBlocksMs.keys()).sort((a,b)=>a-b);
      
      const findChordAt = (t: number): number[] | undefined => {
        // most recent chord block with start time <= t
        let idx = -1;
        for (let i = 0; i < chordTimesSorted.length; i++) {
          if (chordTimesSorted[i] <= t) idx = i; else break;
        }
        if (idx >= 0) return (chordBlocksMs.get(chordTimesSorted[idx]) ?? []).map(n => ((n % 12) + 12) % 12);
        // fallback to scheduled progression when no chord block is found
        const sec = sectionTimeline.find(s=> t>=s.start && t < s.start + s.duration) ?? sectionTimeline[0];
        const progIdx = progressionAtTime(t, sec.start);
        const chordDef = ENHANCED_TEMPLATES[style].chordProgression[progIdx];
        const chordRoot = rootC4 + SCALES[config.scale][chordDef.degree];
        return getChordNotes(chordRoot, chordDef.quality).map(n=> (n%12+12)%12);
      };

      for (const e of leadEvents) {
        // nearest strong beat time (even beat indices): round(t/beat/2)*2*beat
        const nearestStrong = Math.round((e.time / beatDur) / 2) * 2 * beatDur;
        if (Math.abs(e.time - nearestStrong) <= strongTol) {
          // snap timing to exact strong beat to avoid tolerance drift
          e.time = nearestStrong;
          const chordPcs = findChordAt(nearestStrong) ?? [];
          if (chordPcs.length > 0) {
            const pClass = ((e.pitch % 12) + 12) % 12;
            if (!chordPcs.includes(pClass)) {
              let best = e.pitch; let bestD = Infinity;
              for (const cpc of chordPcs) {
                const curClass = ((e.pitch % 12) + 12) % 12;
                const shift = ((cpc - curClass + 18) % 12) - 6; // minimal signed semitone shift
                const cand = clampPitch(e.pitch + shift, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
                const d = Math.abs(cand - e.pitch);
                if (d < bestD) { bestD = d; best = cand; }
              }
              e.pitch = best;
            }
          }
        }
      }
    }

    // Phase 1 quick enforcement: if leadChordToneBias is maxed, ensure strong-beat lead notes are chord tones
    if (!simpleMode && Math.max(0, params.leadChordToneBias ?? 0) >= 1) {
      const leadEvents = events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
      const chordEvents = events.filter(e => e.track === 'chords');
      // Build chord blocks using millisecond rounding
      const chordBlocksMs = new Map<number, number[]>();
      for (const c of chordEvents) {
        const tKey = +c.time.toFixed(3);
        const arr = chordBlocksMs.get(tKey) ?? [];
        arr.push(c.pitch);
        chordBlocksMs.set(tKey, arr);
      }
      const chordTimesSorted = Array.from(chordBlocksMs.keys()).sort((a,b)=>a-b);
      const findChordAt = (t: number): number[] | undefined => {
        let idx = -1;
        for (let i = 0; i < chordTimesSorted.length; i++) {
          if (chordTimesSorted[i] <= t) idx = i; else break;
        }
        if (idx >= 0) return (chordBlocksMs.get(chordTimesSorted[idx]) ?? []).map(n => ((n % 12) + 12) % 12);
        const sec = sectionTimeline.find(s=> t>=s.start && t < s.start + s.duration) ?? sectionTimeline[0];
        const progIdx = progressionAtTime(t, sec.start);
        const chordDef = ENHANCED_TEMPLATES[style].chordProgression[progIdx];
        const chordRoot = rootC4 + SCALES[config.scale][chordDef.degree];
        return getChordNotes(chordRoot, chordDef.quality).map(n=> (n%12+12)%12);
      };
      const strongTol = 0.05; // seconds
      for (const e of leadEvents) {
        const nearestStrong = Math.round((e.time / beat) / 2) * 2 * beat;
        if (Math.abs(e.time - nearestStrong) <= strongTol) {
          e.time = nearestStrong;
          const chordPcs = findChordAt(nearestStrong) ?? [];
          const pClass = ((e.pitch % 12) + 12) % 12;
          if (chordPcs.length && !chordPcs.includes(pClass)) {
            let best = e.pitch; let bestD = Infinity;
            for (const cpc of chordPcs) {
              const curClass = ((e.pitch % 12) + 12) % 12;
              const shift = ((cpc - curClass + 18) % 12) - 6;
              const cand = clampPitch(e.pitch + shift, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
              const d = Math.abs(cand - e.pitch);
              if (d < bestD) { bestD = d; best = cand; }
            }
            e.pitch = best;
          }
        }
      }
    }

    // Rushing/Dragging drift: apply low-frequency, mean-zero onset drift after spacing adjustments
    {
      const rd = Math.max(0, Math.min(1, params.rushingDraggingStrength ?? 0));
      if (rd > 0) {
        const barDur = 4 * beat;
        const phi = rand() * Math.PI * 2; // deterministic phase from seed
        const freq = 1 / (barDur * 4); // slow drift: one cycle per 4 bars
        const styleAmp = ((): number => {
          switch (style) {
            case 'lofi': return 0.020; // 20ms max
            case 'jazz': return 0.016; // 16ms
            default: return 0.012;     // 12ms for edm/cinematic
          }
        })();
        const amp = styleAmp * rd; // seconds
        const trackScale = (e: NoteEvent): number => {
          if (e.track === 'drums') {
            // keep backbeat anchors tighter; kicks almost fixed
            if (e.pitch === 36) return 0.15; // kick
            if (e.pitch === 38) return 0.25; // snare
            return 0.5; // hats/other
          }
          return 1.0;
        };
        for (const e of events) {
          const drift = amp * Math.sin(2 * Math.PI * freq * e.time + phi) * trackScale(e);
          e.time = Math.max(0, e.time + drift);
        }
        // Re-sort and enforce non-decreasing times
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

    // Phase 8: Evaluation & Auto-Repair
    if (isPhase8Active) {
      const evalStr = Math.max(0, Math.min(1, params.evaluationStrength ?? 0));
      const repStr = Math.max(0, Math.min(1, params.autoRepairStrength ?? 0));
      const budgetMs = Math.max(0, Math.min(50, params.autoRepairBudgetMs ?? 6));
      // Deterministic ops budget derived from budgetMs (no wall-clock dependency)
      let opsBudget = Math.max(8, Math.floor(budgetMs * 0.8));

      // Precompute helpers
      const chordEvents = events.filter(e => e.track === 'chords').slice().sort((a,b)=>a.time-b.time);
      const chordBlocksMs = new Map<number, number[]>();
      for (const c of chordEvents) {
        const tKey = +c.time.toFixed(3);
        const arr = chordBlocksMs.get(tKey) ?? [];
        arr.push(c.pitch);
        chordBlocksMs.set(tKey, arr);
      }
      const chordTimesSorted = Array.from(chordBlocksMs.keys()).sort((a,b)=>a-b);
      const findChordAt = (t: number): number[] | undefined => {
        let idx = -1;
        for (let i = 0; i < chordTimesSorted.length; i++) {
          if (chordTimesSorted[i] <= t) idx = i; else break;
        }
        if (idx >= 0) return (chordBlocksMs.get(chordTimesSorted[idx]) ?? []).map(n => ((n % 12) + 12) % 12);
        // fallback to scheduled progression
        const sec = sectionTimeline.find(s=> t>=s.start && t < s.start + s.duration) ?? sectionTimeline[0];
        const progIdx = progressionAtTime(t, sec.start);
        const chordDef = ENHANCED_TEMPLATES[style].chordProgression[progIdx];
        const chordRoot = rootC4 + SCALES[config.scale][chordDef.degree];
        return getChordNotes(chordRoot, chordDef.quality).map(n=> (n%12+12)%12);
      };
      const strongTol = 0.05; // 50ms tolerance

      // Metrics
      const sixteenth = beat / 4;
      const leadEvents = events.filter(e => e.track === 'lead').slice().sort((a,b)=>a.time-b.time);
      let strongTotal = 0; let strongChordTone = 0;
      for (const e of leadEvents) {
        const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
        const rel = e.time - barStart;
        const targets = [0, 2 * beat];
        let nearest = targets[0];
        if (Math.abs(targets[1] - rel) < Math.abs(nearest - rel)) nearest = targets[1];
        const isStrong = Math.abs(nearest - rel) <= strongTol || (() => {
          const pos16 = Math.round((e.time - barStart) / sixteenth) % 16; return (pos16 === 0 || pos16 === 8);
        })();
        if (!isStrong) continue;
        strongTotal++;
        const chordPcs = findChordAt(barStart + nearest) ?? [];
        const pClass = ((e.pitch % 12) + 12) % 12;
        if (chordPcs.includes(pClass)) strongChordTone++;
      }
      const strongBeatChordToneRate = strongTotal > 0 ? strongChordTone / strongTotal : 1;

      // Collision metric: events per quantized 16th
      const grid = new Map<number, number[]>(); // idx -> indices of events in master list
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const idx = Math.round(e.time / sixteenth);
        const arr = grid.get(idx) ?? [];
        arr.push(i);
        grid.set(idx, arr);
      }
      let maxSimul = 0;
      for (const arr of grid.values()) maxSimul = Math.max(maxSimul, arr.length);

      // Register outliers count (pre-repair)
      const reg = ENHANCED_TEMPLATES[style].register;
      const isOutReg = (e: NoteEvent) => {
        if (!e.track) return false;
        const r = (reg as any)[e.track];
        if (!r) return false;
        return e.pitch < r[0] || e.pitch > r[1];
      };

      // Auto-Repair heuristics (bounded by opsBudget)
      if (repStr > 0 && opsBudget > 0) {
        const THRESH_CHORD_TONE = 0.80; // target rate
        const THRESH_MAX_SIMUL = 5;     // per 16th window

        // 1) Snap strong-beat lead notes to nearest chord tone if below target
        if (strongBeatChordToneRate < THRESH_CHORD_TONE) {
          const offenders: number[] = [];
          for (let i = 0; i < leadEvents.length; i++) {
            const e = leadEvents[i];
            const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
            const rel = e.time - barStart;
            const targets = [0, 2 * beat];
            let nearest = targets[0];
            if (Math.abs(targets[1] - rel) < Math.abs(nearest - rel)) nearest = targets[1];
            const isStrong = Math.abs(nearest - rel) <= strongTol || (() => {
              const pos16 = Math.round((e.time - barStart) / sixteenth) % 16; return (pos16 === 0 || pos16 === 8);
            })();
            if (!isStrong) continue;
            const chordPcs = findChordAt(barStart + nearest) ?? [];
            const pClass = ((e.pitch % 12) + 12) % 12;
            if (!chordPcs.includes(pClass)) offenders.push(i);
          }
          const need = Math.ceil((THRESH_CHORD_TONE - strongBeatChordToneRate) * (strongTotal || 1));
          const fixCount = Math.min(offenders.length, Math.max(1, Math.floor(need * repStr)));
          for (let k = 0; k < fixCount && opsBudget > 0; k++) {
            const idxInLead = offenders[k];
            const e = leadEvents[idxInLead];
            const sec = sectionTimeline.find(s=> e.time>=s.start && e.time < s.start + s.duration) ?? sectionTimeline[0];
            const nearestStrong = Math.round((e.time / beat) / 2) * 2 * beat;
            const chordPcs = findChordAt(nearestStrong) ?? [];
            if (chordPcs.length) {
              let best = e.pitch; let bestD = Infinity;
              for (const cpc of chordPcs) {
                const curClass = ((e.pitch % 12) + 12) % 12;
                const shift = ((cpc - curClass + 18) % 12) - 6;
                const cand = clampPitch(e.pitch + shift, ENHANCED_TEMPLATES[style].register.lead[0], ENHANCED_TEMPLATES[style].register.lead[1]);
                const d = Math.abs(cand - e.pitch);
                if (d < bestD) { bestD = d; best = cand; }
              }
              // Apply to master events array
              const masterIdx = events.findIndex(ev => ev === e);
              if (masterIdx >= 0) events[masterIdx].pitch = best;
              e.pitch = best;
              opsBudget--;
            }
          }
        }

        // 2) Thin dense onset clusters to threshold per 16th window
        if (opsBudget > 0) {
          const trackWeight: Record<NonNullable<NoteEvent['track']>, number> = {
            fx: 0.1, drums: 0.2, chords: 0.5, bass: 0.7, lead: 1.5,
          } as const as any;
          const keys = Array.from(grid.keys()).sort((a,b)=>a-b);
          for (const k of keys) {
            const arr = grid.get(k)!;
            if (arr.length <= THRESH_MAX_SIMUL) continue;
            const over = arr.length - THRESH_MAX_SIMUL;
            const removeCount = Math.max(1, Math.floor(over * repStr));
            // Sort candidates: low weight, then low velocity, then short duration
            const cand = arr.map(idx => ({ idx, e: events[idx] }))
              .sort((a,b)=>{
                const wa = a.e.track ? (trackWeight as any)[a.e.track] ?? 1 : 1;
                const wb = b.e.track ? (trackWeight as any)[b.e.track] ?? 1 : 1;
                if (wa !== wb) return wa - wb;
                if (a.e.velocity !== b.e.velocity) return a.e.velocity - b.e.velocity;
                return (a.e.duration ?? 0) - (b.e.duration ?? 0);
              });
            let removed = 0;
            for (let i = 0; i < cand.length && removed < removeCount && opsBudget > 0; i++) {
              const { idx } = cand[i];
              // Never remove lead unless absolutely necessary
              if (events[idx].track === 'lead' && cand.length - i > removeCount - removed) continue;
              events.splice(idx, 1);
              removed++;
              opsBudget--;
            }
          }
        }

        // 3) Micro-quantize chords/bass near grid (preserve feel)
        if (opsBudget > 0) {
          const nearTol = sixteenth * 0.08;
          for (const e of events) {
            if (e.track !== 'chords' && e.track !== 'bass') continue;
            const tGrid = Math.round(e.time / sixteenth) * sixteenth;
            const dt = Math.abs(e.time - tGrid);
            if (dt > 0 && dt <= nearTol) {
              e.time = tGrid;
              opsBudget--;
              if (opsBudget <= 0) break;
            }
          }
        }

        // 4) Spacing overlaps per track using existing minGap if provided
        if (opsBudget > 0) {
          const minGap = Math.max(0, params.spaceAllocatorMinGapSecs ?? 0);
          if (minGap > 0) {
            const byTrack = new Map<string, NoteEvent[]>();
            for (const e of events) {
              const t = e.track ?? 'unknown';
              if (!byTrack.has(t)) byTrack.set(t, []);
              byTrack.get(t)!.push(e);
            }
            for (const [t, arr] of byTrack) {
              arr.sort((a,b)=>a.time-b.time);
              let curEnd = -Infinity;
              for (const e of arr) {
                if (e.time < curEnd + minGap) {
                  const shift = (curEnd + minGap) - e.time;
                  e.time += shift;
                  opsBudget--;
                }
                curEnd = e.time + (e.duration ?? 0);
                if (opsBudget <= 0) break;
              }
              if (opsBudget <= 0) break;
            }
          }
        }

        // 5) Clamp any register outliers
        if (opsBudget > 0) {
          for (const e of events) {
            if (!e.track) continue;
            const r = (reg as any)[e.track];
            if (!r) continue;
            if (e.pitch < r[0] || e.pitch > r[1]) {
              e.pitch = clampPitch(e.pitch, r[0], r[1]);
              opsBudget--;
              if (opsBudget <= 0) break;
            }
          }
        }

        // Resort after edits and enforce non-decreasing times
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
          isPhase9Active ? 'v2-phase9' : (
          isPhase8Active ? 'v2-phase8' : (
          isPhase7Active ? 'v2-phase7' : (
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
              ))))))
        ),
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
  const { rand, roll, humanizeTime, humanizeVelocity, applySwing, scalePitch, beat, sixteenth, choose, finalizeTime, params } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const simple = (utils && utils.simple) ? utils.simple as { simpleMode?: boolean; simpleDefaults?: any; motifMemory?: Map<number, number[][]>; motifCounters?: Map<number, number>; progressionAtTime?: (t:number, s:number)=>number } : {};
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

  // Simple Mode helpers: assign a motif pattern per 2-beat slot
  const slotPatternIdx = new Map<number, number>();

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
    // Simple Mode: anchor strong beats and reuse per-slot motif memory
    if (simple?.simpleMode) {
      const slotLen = 2 * beat; // 2 beats per progression step
      const slotIndex = Math.floor((time - startTime) / slotLen);
      const posInSlot16 = Math.floor(((time - startTime) % slotLen) / sixteenth); // 0..7
      const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
      const memory = simple.motifMemory?.get(progIdx) ?? [];
      if (!slotPatternIdx.has(slotIndex)) {
        const counter = simple.motifCounters?.get(progIdx) ?? 0;
        const patIdx = memory.length > 0 ? (counter % memory.length) : 0;
        slotPatternIdx.set(slotIndex, patIdx);
        if (simple.motifCounters) simple.motifCounters.set(progIdx, counter + 1);
      }
      // Adjust trigger prob: always place notes on 1 and 3; thin others
      if (isStrongBeat) triggerProbability = 1;
      else triggerProbability = Math.min(1, 0.5 * (section.density + 0.4));
    }

    if (doCadenceNow || (chordBiasGlobal > 0 && isStrongBeat) || roll(triggerProbability)) {
      let degree: number;
      if (simple?.simpleMode) {
        const slotLen = 2 * beat;
        const slotIndex = Math.floor((time - startTime) / slotLen);
        const posInSlot16 = Math.floor(((time - startTime) % slotLen) / sixteenth); // 0..7
        const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
        const memory = simple.motifMemory?.get(progIdx) ?? [];
        const patIdx = slotPatternIdx.get(slotIndex) ?? 0;
        const pattern = memory[patIdx] ?? fullMotif; // fallback to existing motif
        degree = pattern[posInSlot16 % (pattern.length || 1)] ?? (fullMotif[i % fullMotif.length]);
      } else {
        const motifIndex = i % fullMotif.length;
        degree = fullMotif[motifIndex];
      }

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
      } else if ((simple?.simpleMode && isStrongBeat)) {
        // Simple Mode: force strong beats to chord tones (root/third/fifth)
        const chordToneDegrees = [chordDef.degree, (chordDef.degree + 2) % 7, (chordDef.degree + 4) % 7];
        degree = choose(chordToneDegrees);
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
      // Pin strong-beat notes tightly to the beat to align with chord onset for metrics
      if ((chordBiasGlobal > 0 && isStrongBeat) || (simple?.simpleMode && isStrongBeat)) {
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
  let lastChordPitches: number[] | undefined; // previous assigned chord voices (bass→treble)
  
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
    const exactAssign = Boolean(params?.enableExactChordVoiceAssignment);
    let inversion = roll(0.2) ? choose([0, 1, 2]) : 0;
    let chordNotes = getChordNotes(chordRoot, chordDef.quality, inversion);
    // Determine target number of voices from chord quality
    const voicesCount = chordNotes.length;
    // Precompute best inversion by greedy cost vs previous voices (as before)
    let bestInvNotes: number[] | undefined;
    if (vlBias > 0 && lastChordPitches && lastChordPitches.length > 0) {
      const candidates = [0, 1, 2].map(inv => {
        const base = getChordNotes(chordRoot, chordDef.quality, inv).map(n => clampPitch(n, config.register.chords[0], config.register.chords[1]));
        const prev = lastChordPitches!.slice().sort((a, b) => a - b);
        const cur0 = base.slice().sort((a, b) => a - b);
        // Apply a uniform octave shift to minimize mean distance
        const avg = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / Math.max(1, xs.length);
        const k = Math.round((avg(prev) - avg(cur0)) / 12);
        const cur = cur0.map(n => clampPitch(n + k * 12, config.register.chords[0], config.register.chords[1])).sort((a,b)=>a-b);
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
        return { inv, notes: cur, cost: cost / voices };
      }).sort((a,b)=> a.cost - b.cost);
      bestInvNotes = candidates[0]?.notes;
      inversion = candidates[0]?.inv ?? inversion;
      chordNotes = getChordNotes(chordRoot, chordDef.quality, inversion);
    }
    // When voice-leading bias is active, compute a deterministic close voicing assignment
    const doVL = vlBias > 0 && exactAssign;
    const assignedVoicesRaw: number[] | undefined = doVL
      ? assignCloseVoicing(lastChordPitches, chordRoot, chordDef.quality, voicesCount, config.register.chords)
      : undefined;
    // If both strategies available, choose the one with lower movement cost w.r.t previous voices
    const assignedVoices: number[] | undefined = (() => {
      if (!doVL) return undefined;
      const prev = lastChordPitches?.slice()?.sort((a,b)=>a-b) ?? [];
      const cost = (arr?: number[]) => {
        if (!arr || prev.length === 0) return Infinity;
        const cur = arr.slice().sort((a,b)=>a-b);
        const n = Math.min(prev.length, cur.length);
        let s = 0; for (let i = 0; i < n; i++) s += Math.abs(prev[i] - cur[i]);
        return s / n;
      };
      const shiftToPrev = (arr?: number[]) => {
        if (!arr || prev.length === 0) return arr;
        const avg = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / Math.max(1, xs.length);
        const k = Math.round((avg(prev) - avg(arr)) / 12);
        return arr.map(n => clampPitch(n + k * 12, config.register.chords[0], config.register.chords[1]));
      };
      const anchoredFromPrev = (): number[] | undefined => {
        if (prev.length === 0) return undefined;
        const pcs = Array.from(new Set(chordNotes.map(n => ((n % 12) + 12) % 12)));
        const pickNearestOnPc = (p: number, pc: number): number => {
          const curPc = ((p % 12) + 12) % 12;
          let best = p, bestD = Infinity;
          for (const k of [-2,-1,0,1,2]) {
            const shift = ((pc - curPc + 18) % 12) - 6 + 12 * k;
            const cand = clampPitch(p + shift, config.register.chords[0], config.register.chords[1]);
            const d = Math.abs(cand - p);
            if (d < bestD) { bestD = d; best = cand; }
          }
          return best;
        };
        const out: number[] = [];
        let last = -Infinity;
        for (const p of prev) {
          // prefer preserving current pitch class if it is a chord tone; else pick nearest chord pc
          const curPc = ((p % 12) + 12) % 12;
          const pcsOrdered = pcs.includes(curPc) ? [curPc, ...pcs.filter(x => x !== curPc)] : pcs;
          let chosen = pickNearestOnPc(p, pcsOrdered[0]!);
          for (let i = 1; i < pcsOrdered.length; i++) {
            const alt = pickNearestOnPc(p, pcsOrdered[i]!);
            if (Math.abs(alt - p) < Math.abs(chosen - p) - 1e-6) chosen = alt;
          }
          // enforce non-crossing by pushing up in octaves if needed
          while (chosen < last) {
            if (chosen + 12 <= config.register.chords[1]) chosen += 12; else break;
          }
          chosen = clampPitch(chosen, config.register.chords[0], config.register.chords[1]);
          if (chosen < last) chosen = last; // final guard
          out.push(chosen);
          last = chosen;
        }
        // ensure desired voice count by merging with assignment when available
        if (out.length < voicesCount && assignedVoicesRaw && assignedVoicesRaw.length >= voicesCount) {
          const merged = out.concat(assignedVoicesRaw).sort((a,b)=>a-b).slice(-voicesCount);
          return merged;
        }
        return out.slice(0, voicesCount).sort((a,b)=>a-b);
      };
      const candidates: number[][] = [];
      if (bestInvNotes) candidates.push(bestInvNotes);
      if (assignedVoicesRaw) candidates.push(assignedVoicesRaw);
      const shiftedAssign = shiftToPrev(assignedVoicesRaw);
      if (shiftedAssign) candidates.push(shiftedAssign);
      const anchored = anchoredFromPrev();
      if (anchored) candidates.push(anchored);
      if (candidates.length === 0) return undefined;
      candidates.sort((a,b)=> cost(a) - cost(b));
      return candidates[0];
    })();
    
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
      const baseDur = beat * (rhythmPattern.length === 1 ? 2 : 1);
      const pos16 = Math.floor((chordTime / (beat / 4)) % 16);

      if (assignedVoices && assignedVoices.length) {
        // Prefer preserving exact common tones from previous chord to minimize movement further
        if (lastChordPitches && lastChordPitches.length) {
          const prev = lastChordPitches.slice().sort((a,b)=>a-b);
          const used = new Set<number>();
          const adjusted: number[] = assignedVoices.slice().sort((a,b)=>a-b);
          for (let i = 0; i < prev.length; i++) {
            const p = prev[i];
            // Find an index in adjusted that matches pitch class and is closest to p
            let bestIdx = -1; let bestDist = Infinity;
            for (let j = 0; j < adjusted.length; j++) {
              if (used.has(j)) continue;
              if ((((adjusted[j] - p) % 12) + 12) % 12 !== 0) continue;
              const d = Math.abs(adjusted[j] - p);
              if (d < bestDist) { bestDist = d; bestIdx = j; }
            }
            if (bestIdx >= 0) {
              used.add(bestIdx);
              adjusted[bestIdx] = p; // snap exact common tone
            }
          }
          // Keep adjusted ordering and bounds
          adjusted.sort((a,b)=>a-b);
          for (let i = 0; i < adjusted.length; i++) adjusted[i] = clampPitch(adjusted[i], config.register.chords[0], config.register.chords[1]);
          // Replace assignedVoices with adjusted if it reduces L1 vs prev
          const l1 = (a:number[], b:number[])=>{ const n=Math.min(a.length,b.length); let s=0; for(let k=0;k<n;k++) s+=Math.abs(a[k]-b[k]); return s/n; };
          if (l1(adjusted, prev) <= l1(assignedVoices.slice().sort((a,b)=>a-b), prev)) {
            for (let i = 0; i < assignedVoices.length; i++) assignedVoices[i] = adjusted[i] ?? assignedVoices[i];
          }
        }
        // Final octave folding to minimize per-voice distance while preserving order and register
        if (lastChordPitches && lastChordPitches.length) {
          const prev = lastChordPitches.slice().sort((a,b)=>a-b);
          const cur = assignedVoices.slice().sort((a,b)=>a-b);
          for (let i = 0; i < Math.min(prev.length, cur.length); i++) {
            while ((cur[i] - prev[i]) > 6 && (cur[i] - 12) >= config.register.chords[0]) cur[i] -= 12;
            while ((prev[i] - cur[i]) > 6 && (cur[i] + 12) <= config.register.chords[1]) cur[i] += 12;
            if (i > 0 && cur[i] < cur[i-1]) cur[i] = Math.min(config.register.chords[1], cur[i-1]);
          }
          for (let i = 0; i < cur.length; i++) assignedVoices[i] = cur[i];
        }
        const baseVel = humanizeVelocity(0.4 + section.energy * 0.2);
        // Role‑aware slight duration/velocity shaping
        for (const p of assignedVoices.slice().sort((a,b)=>a-b)) {
          const role = roleOf(p, chordRoot, chordDef.quality);
          const durScale = role === 'root' ? 1.06 : role === 'third' ? 1.02 : role === 'fifth' ? 0.96 : 0.92;
          const velScale = role === 'root' ? 1.04 : role === 'third' ? 1.0 : role === 'fifth' ? 0.98 : 0.96;
          const pitch = clampPitch(p, config.register.chords[0], config.register.chords[1]);
          events.push({
            time: finalizeTime(chordTime, pos16, config.rhythmPattern.swing, 'chords'),
            pitch,
            duration: Math.max(0.02, baseDur * durScale),
            velocity: Math.max(0.1, Math.min(1, baseVel * velScale)),
            track: 'chords',
          });
        }
        lastChordPitches = assignedVoices.slice().sort((a,b)=>a-b);
      } else {
        for (const note of chordNotes) {
          const clampedPitch = clampPitch(note, config.register.chords[0], config.register.chords[1]);
          const velEach = humanizeVelocity(0.4 + section.energy * 0.2); // preserve RNG usage per note
          events.push({
            time: finalizeTime(chordTime, pos16, config.rhythmPattern.swing, 'chords'),
            pitch: clampedPitch,
            duration: baseDur,
            velocity: velEach,
            track: 'chords',
          });
        }
        lastChordPitches = chordNotes.map(n => clampPitch(n, config.register.chords[0], config.register.chords[1])).sort((a,b)=>a-b);
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
  const { rand, roll, humanizeTime, humanizeVelocity, scalePitch, beat, sixteenth, choose, finalizeTime, params } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const simple = (utils && utils.simple) ? utils.simple as { simpleMode?: boolean; progressionAtTime?: (t:number, s:number)=>number } : {};
  const noteCount = Math.floor(duration / sixteenth);
  
  // Simple Mode: deterministic root/fifth on beats 1 & 3
  if (simple?.simpleMode) {
    for (let i = 0; i < noteCount; i++) {
      const time = startTime + i * sixteenth;
      if (time >= startTime + duration) break;
      const pos16 = i % 16;
      const isStrongBeat = (pos16 === 0 || pos16 === 8);
      if (!isStrongBeat) continue;
      const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
      const chordDef = config.chordProgression[progIdx];
      const useFifth = (pos16 === 8) && roll(0.4);
      const degree = useFifth ? (chordDef.degree + 4) % 7 : chordDef.degree;
      const pitch = clampPitch(scalePitch(degree, -1), config.register.bass[0], config.register.bass[1]);
      const velocity = humanizeVelocity(0.7 + section.energy * 0.2);
      const evtTime = finalizeTime(time, pos16, config.rhythmPattern.swing, 'bass');
      events.push({ time: evtTime, pitch, duration: beat * 1.5, velocity, track: 'bass' });
    }
    return;
  }

  // Advanced: Bass follows chord progression root notes with interplay
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
  const s9 = Math.max(0, Math.min(1, utils?.phase9?.s ?? 0));
  const hatBias: number[] | undefined = utils?.phase9?.hatBias;
  const pattern = config.rhythmPattern;
  const bars = Math.floor(duration / (4 * beat));
  const rmk = Math.max(0, Math.min(1, params?.rhythmMarkovStrength ?? 0));

  // Build simple 2-state Markov model for hats from base pattern
  const hatPresent: boolean[] = Array.from({ length: 16 }, (_, i) => pattern.hats.includes(i));
  let c11 = 0, c10 = 0, c01 = 0, c00 = 0;
  for (let i = 0; i < 16; i++) {
    const a = hatPresent[i];
    const b = hatPresent[(i + 1) % 16];
    if (a && b) c11++; else if (a && !b) c10++; else if (!a && b) c01++; else c00++;
  }
  let p11 = (c11 + c10) > 0 ? c11 / (c11 + c10) : 0.5;
  const p01 = (c01 + c00) > 0 ? c01 / (c01 + c00) : 0.5;

  const fillPatterns = [
    [0, 2, 4, 6, 8, 10, 12, 14], // 8th note fill
    [0, 1, 2, 3, 4, 5, 6, 7], // 16th note fill
    [0, 4, 8, 12], // 4th note fill
  ];
  
  // Simple Mode: deterministic anchored patterns
  if (params?.simpleMode) {
    for (let bar = 0; bar < bars; bar++) {
      const barStart = startTime + bar * 4 * beat;
      // Kicks
      for (const i of pattern.kick) {
        const t = barStart + i * sixteenth;
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 36, duration: sixteenth * 2, velocity: humanizeVelocity(0.8 + section.energy * 0.15), track: 'drums' });
      }
      // Snares
      for (const i of pattern.snare) {
        const t = barStart + i * sixteenth;
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 38, duration: sixteenth * 1.5, velocity: humanizeVelocity(0.7 + section.energy * 0.2), track: 'drums' });
      }
      // Hats at listed positions; if none, place closed hats on all 8ths
      const hatPos = pattern.hats && pattern.hats.length > 0 ? pattern.hats : [0,4,8,12];
      for (const i of hatPos) {
        const t = barStart + i * sixteenth;
        const isAccent = i % 4 === 0;
        const vel = humanizeVelocity((isAccent ? 0.6 : 0.45) + section.energy * 0.1);
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 42, duration: sixteenth * 0.5, velocity: vel, track: 'drums' });
      }
    }
    return;
  }

  for (let bar = 0; bar < bars; bar++) {
    const barStart = startTime + bar * 4 * beat;
    let hatCountThisBar = 0;
    let lastHat = false;
    
    // Add fills occasionally
    const fillProb = Math.max(0, Math.min(1, params?.fillRate ?? 0.25));
    const isFill = section.fill && roll(fillProb) && bar % 4 === 3;
    
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
        const hatProbBase = (params?.grooveTemplate && params.grooveTemplate !== 'straight') ? 0.95 : 0.8;
        // Baseline behavior: allow occasional hats off the canonical pattern to keep texture lively
        const basePresence = pattern.hats.includes(i) ? hatProbBase : 0.15 * hatProbBase;
        // Encourage some adjacency when Markov is emphasized even if the base pattern has none
        const adjacencyBoost = 0.4 * rmk;
        const p11Adj = Math.max(p11, adjacencyBoost);
        const markovPresence = lastHat ? p11Adj : p01;
        const p = rmk > 0 ? ((1 - rmk) * basePresence + rmk * markovPresence) : basePresence;
        const hb = hatBias && hatBias[i] != null ? hatBias[i] : 0.5;
        const pBiased = Math.max(0, Math.min(1, (1 - s9) * p + s9 * hb));
        if (roll(pBiased)) {
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
          lastHat = true;
        } else {
          lastHat = false;
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