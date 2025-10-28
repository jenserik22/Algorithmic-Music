import React, { useMemo, useState } from 'react';
import type { GenerationParams, Complexity } from '@/lib/music/engines/types';
import { MusicIcon, RefreshIcon } from '@/components/icons';
import { LabelWithTooltip } from '@/components/Tooltip';

type Algorithm = 'stochastic' | 'markov' | 'cellular_automata' | 'l_system' | 'generative_grammar' | 'euclidean' | 'helix' | 'enhanced_helix' | 'enhanced_cellular' | 'enhanced_markov';

const PRESETS: Record<string, { label: string; params: Omit<GenerationParams, 'seed'> }> = {
  upbeat: { label: '🎵 Upbeat 120', params: { bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5 } },
  ambient: { label: '🌊 Ambient 70', params: { bpm: 70, key: 'Am', timeSignature: '4/4', durationSecs: 8, density: 0.3 } },
  energetic: { label: '⚡ Energetic 140', params: { bpm: 140, key: 'Em', timeSignature: '4/4', durationSecs: 6, density: 0.7 } },
  chill: { label: '😌 Chill 90', params: { bpm: 90, key: 'F', timeSignature: '4/4', durationSecs: 12, density: 0.4 } },
};

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Am','Dm','Em','Fm','Gm'];

const ALGORITHM_INFO: Record<Algorithm, { name: string; description: string }> = {
  stochastic: { name: '🎲 Stochastic', description: 'Random with musical constraints' },
  markov: { name: '🔗 Markov Chains', description: 'Probability-based note sequences' },
  cellular_automata: { name: '🏗️ Cellular Automata', description: 'Grid-based pattern evolution' },
  l_system: { name: '🌿 L-Systems', description: 'Fractal recursive structures' },
  generative_grammar: { name: '📝 Generative Grammar', description: 'Rule-based composition' },
  euclidean: { name: '⭕ Euclidean Rhythms', description: 'Mathematical rhythm patterns' },
  helix: { name: '🧬 Helix', description: 'SoundHelix-inspired generation' },
  enhanced_helix: { name: '⚡ Enhanced Helix', description: 'Advanced multi-layered composition with sophisticated harmony' },
  enhanced_cellular: { name: '🌟 Enhanced Cellular', description: 'Multi-track Conway\'s Life with sophisticated CA rules' },
  enhanced_markov: { name: '🎼 Enhanced Markov', description: 'Probabilistic multi-track composition with harmonic progressions' },
};

// Style-aware advanced defaults for Enhanced Helix
type StyleKey = 'edm' | 'cinematic' | 'lofi' | 'jazz' | 'techno' | 'rock' | 'ambient';

type HelixAdvancedProfile = {
  grooveTemplate?: GenerationParams['grooveTemplate'];
  humanizeDistribution?: 'uniform' | 'gaussian';
  humanizeTime: number;
  humanizeVel: number;
  leadChordToneBias: number;
  accentMapIntensity: number;
  bassAnticipation: number;
  chordVoiceLeadingBias: number;
  enableExactChordVoiceAssignment?: boolean;
  leadMaxLeapSemitones: number;
  spaceMinGap: number;
  phrasing?: GenerationParams['phrasing'];
  cadenceStrength: number;
  harmonicRhythmVariance: number;
  harmonicComplexity: number;
  pedalToneStrength: number;
  callResponseIntensity: number;
  bassEchoProbability: number;
  densityGateStrength: number;
  dynamicsShape?: GenerationParams['dynamicsShape'];
  dynamicsStrength: number;
  registerLiftStrength: number;
  extendedLfoTargets: number;
  sidechainStrength: number;
  // Phase 7 (optional in profiles)
  ornamentation?: number;
  legatoStrength?: number;
  chordStabArpIntensity?: number;
};

const ADVANCED_PROFILES: Record<StyleKey, HelixAdvancedProfile> = {
  edm: {
    grooveTemplate: 'mpc62',
    humanizeDistribution: 'uniform',
    humanizeTime: 0.14,
    humanizeVel: 0.26,
    leadChordToneBias: 0.62,
    accentMapIntensity: 0.45,
    bassAnticipation: 0.32,
    chordVoiceLeadingBias: 0.55,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 9,
    spaceMinGap: 0.012,
    phrasing: 'short',
    cadenceStrength: 0.66,
    harmonicRhythmVariance: 0.55,
    harmonicComplexity: 0.34,
    pedalToneStrength: 0.18,
    callResponseIntensity: 0.64,
    bassEchoProbability: 0.35,
    densityGateStrength: 0.46,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.55,
    registerLiftStrength: 0.3,
    extendedLfoTargets: 0.35,
    sidechainStrength: 0.6,
  },
  cinematic: {
    grooveTemplate: undefined,
    humanizeDistribution: 'uniform',
    humanizeTime: 0.1,
    humanizeVel: 0.18,
    leadChordToneBias: 0.7,
    accentMapIntensity: 0.12,
    bassAnticipation: 0.18,
    chordVoiceLeadingBias: 0.82,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 7,
    spaceMinGap: 0.02,
    phrasing: 'long',
    cadenceStrength: 0.88,
    harmonicRhythmVariance: 0.28,
    harmonicComplexity: 0.4,
    pedalToneStrength: 0.55,
    callResponseIntensity: 0.34,
    bassEchoProbability: 0.22,
    densityGateStrength: 0.28,
    dynamicsShape: 'rise',
    dynamicsStrength: 0.52,
    registerLiftStrength: 0.38,
    extendedLfoTargets: 0.22,
    sidechainStrength: 0.18,
  },
  lofi: {
    grooveTemplate: 'shuffle',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.28,
    humanizeVel: 0.34,
    leadChordToneBias: 0.42,
    accentMapIntensity: 0.42,
    bassAnticipation: 0.24,
    chordVoiceLeadingBias: 0.48,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 7,
    spaceMinGap: 0.024,
    phrasing: 'short',
    cadenceStrength: 0.52,
    harmonicRhythmVariance: 0.46,
    harmonicComplexity: 0.22,
    pedalToneStrength: 0.32,
    callResponseIntensity: 0.28,
    bassEchoProbability: 0.3,
    densityGateStrength: 0.22,
    dynamicsShape: 'fall',
    dynamicsStrength: 0.33,
    registerLiftStrength: 0.2,
    extendedLfoTargets: 0.18,
    sidechainStrength: 0.25,
  },
  jazz: {
    grooveTemplate: 'shuffle',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.18,
    humanizeVel: 0.26,
    leadChordToneBias: 0.62,
    accentMapIntensity: 0.24,
    bassAnticipation: 0.38,
    chordVoiceLeadingBias: 0.85,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 12,
    spaceMinGap: 0.015,
    phrasing: 'medium',
    cadenceStrength: 0.58,
    harmonicRhythmVariance: 0.38,
    harmonicComplexity: 0.52,
    pedalToneStrength: 0.24,
    callResponseIntensity: 0.58,
    bassEchoProbability: 0.26,
    densityGateStrength: 0.32,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.42,
    registerLiftStrength: 0.36,
    extendedLfoTargets: 0.24,
    sidechainStrength: 0.2,
  },
  techno: {
    grooveTemplate: 'mpc62',
    humanizeDistribution: 'uniform',
    humanizeTime: 0.08,
    humanizeVel: 0.18,
    leadChordToneBias: 0.35,
    accentMapIntensity: 0.65,
    bassAnticipation: 0.48,
    chordVoiceLeadingBias: 0.38,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 5,
    spaceMinGap: 0.008,
    phrasing: 'short',
    cadenceStrength: 0.42,
    harmonicRhythmVariance: 0.68,
    harmonicComplexity: 0.22,
    pedalToneStrength: 0.65,
    callResponseIntensity: 0.52,
    bassEchoProbability: 0.45,
    densityGateStrength: 0.58,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.48,
    registerLiftStrength: 0.22,
    extendedLfoTargets: 0.55,
    sidechainStrength: 0.78,
    ornamentation: 0.3,
    legatoStrength: 0.2,
    chordStabArpIntensity: 0.75,
  },
  rock: {
    grooveTemplate: 'straight',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.22,
    humanizeVel: 0.32,
    leadChordToneBias: 0.52,
    accentMapIntensity: 0.62,
    bassAnticipation: 0.35,
    chordVoiceLeadingBias: 0.48,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 12,
    spaceMinGap: 0.018,
    phrasing: 'medium',
    cadenceStrength: 0.72,
    harmonicRhythmVariance: 0.52,
    harmonicComplexity: 0.32,
    pedalToneStrength: 0.48,
    callResponseIntensity: 0.58,
    bassEchoProbability: 0.38,
    densityGateStrength: 0.42,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.68,
    registerLiftStrength: 0.38,
    extendedLfoTargets: 0.28,
    sidechainStrength: 0.35,
    ornamentation: 0.45,
    legatoStrength: 0.3,
    chordStabArpIntensity: 0.65,
  },
  ambient: {
    grooveTemplate: undefined,
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.15,
    humanizeVel: 0.22,
    leadChordToneBias: 0.82,
    accentMapIntensity: 0.08,
    bassAnticipation: 0.12,
    chordVoiceLeadingBias: 0.92,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 5,
    spaceMinGap: 0.035,
    phrasing: 'long',
    cadenceStrength: 0.28,
    harmonicRhythmVariance: 0.18,
    harmonicComplexity: 0.38,
    pedalToneStrength: 0.78,
    callResponseIntensity: 0.18,
    bassEchoProbability: 0.15,
    densityGateStrength: 0.15,
    dynamicsShape: 'rise',
    dynamicsStrength: 0.42,
    registerLiftStrength: 0.32,
    extendedLfoTargets: 0.45,
    sidechainStrength: 0.12,
    ornamentation: 0.25,
    legatoStrength: 0.75,
    chordStabArpIntensity: 0.15,
  },
};

const HUMANIZE_PRESETS: Record<StyleKey, HelixAdvancedProfile> = {
  edm: {
    grooveTemplate: 'mpc62',
    humanizeDistribution: 'uniform',
    humanizeTime: 0.18,
    humanizeVel: 0.38,
    leadChordToneBias: 0.68,
    accentMapIntensity: 0.55,
    bassAnticipation: 0.4,
    chordVoiceLeadingBias: 0.5,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 9,
    spaceMinGap: 0.012,
    phrasing: 'short',
    cadenceStrength: 0.6,
    harmonicRhythmVariance: 0.58,
    harmonicComplexity: 0.28,
    pedalToneStrength: 0.12,
    callResponseIntensity: 0.7,
    bassEchoProbability: 0.38,
    densityGateStrength: 0.5,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.62,
    registerLiftStrength: 0.28,
    extendedLfoTargets: 0.4,
    sidechainStrength: 0.72,
    // Phase 7
    ornamentation: 0.5,
    legatoStrength: 0.4,
    chordStabArpIntensity: 0.6,
  },
  cinematic: {
    grooveTemplate: undefined,
    humanizeDistribution: 'uniform',
    humanizeTime: 0.12,
    humanizeVel: 0.22,
    leadChordToneBias: 0.76,
    accentMapIntensity: 0.14,
    bassAnticipation: 0.22,
    chordVoiceLeadingBias: 0.86,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 7,
    spaceMinGap: 0.02,
    phrasing: 'long',
    cadenceStrength: 0.94,
    harmonicRhythmVariance: 0.26,
    harmonicComplexity: 0.48,
    pedalToneStrength: 0.62,
    callResponseIntensity: 0.38,
    bassEchoProbability: 0.24,
    densityGateStrength: 0.32,
    dynamicsShape: 'rise',
    dynamicsStrength: 0.6,
    registerLiftStrength: 0.42,
    extendedLfoTargets: 0.26,
    sidechainStrength: 0.22,
    ornamentation: 0.35,
    legatoStrength: 0.5,
    chordStabArpIntensity: 0.3,
  },
  lofi: {
    grooveTemplate: 'shuffle',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.32,
    humanizeVel: 0.36,
    leadChordToneBias: 0.38,
    accentMapIntensity: 0.48,
    bassAnticipation: 0.26,
    chordVoiceLeadingBias: 0.46,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 7,
    spaceMinGap: 0.026,
    phrasing: 'short',
    cadenceStrength: 0.48,
    harmonicRhythmVariance: 0.5,
    harmonicComplexity: 0.24,
    pedalToneStrength: 0.36,
    callResponseIntensity: 0.32,
    bassEchoProbability: 0.34,
    densityGateStrength: 0.24,
    dynamicsShape: 'fall',
    dynamicsStrength: 0.36,
    registerLiftStrength: 0.22,
    extendedLfoTargets: 0.2,
    sidechainStrength: 0.28,
    ornamentation: 0.4,
    legatoStrength: 0.6,
    chordStabArpIntensity: 0.2,
  },
  jazz: {
    grooveTemplate: 'shuffle',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.2,
    humanizeVel: 0.28,
    leadChordToneBias: 0.7,
    accentMapIntensity: 0.28,
    bassAnticipation: 0.42,
    chordVoiceLeadingBias: 0.9,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 12,
    spaceMinGap: 0.015,
    phrasing: 'medium',
    cadenceStrength: 0.62,
    harmonicRhythmVariance: 0.42,
    harmonicComplexity: 0.58,
    pedalToneStrength: 0.28,
    callResponseIntensity: 0.66,
    bassEchoProbability: 0.28,
    densityGateStrength: 0.34,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.46,
    registerLiftStrength: 0.4,
    extendedLfoTargets: 0.26,
    sidechainStrength: 0.24,
    ornamentation: 0.5,
    legatoStrength: 0.5,
    chordStabArpIntensity: 0.25,
  },
  techno: {
    grooveTemplate: 'mpc62',
    humanizeDistribution: 'uniform',
    humanizeTime: 0.08,
    humanizeVel: 0.18,
    leadChordToneBias: 0.35,
    accentMapIntensity: 0.65,
    bassAnticipation: 0.48,
    chordVoiceLeadingBias: 0.38,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 5,
    spaceMinGap: 0.008,
    phrasing: 'short',
    cadenceStrength: 0.42,
    harmonicRhythmVariance: 0.68,
    harmonicComplexity: 0.22,
    pedalToneStrength: 0.65,
    callResponseIntensity: 0.52,
    bassEchoProbability: 0.45,
    densityGateStrength: 0.58,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.48,
    registerLiftStrength: 0.22,
    extendedLfoTargets: 0.55,
    sidechainStrength: 0.78,
    ornamentation: 0.3,
    legatoStrength: 0.2,
    chordStabArpIntensity: 0.75,
  },
  rock: {
    grooveTemplate: 'straight',
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.22,
    humanizeVel: 0.32,
    leadChordToneBias: 0.52,
    accentMapIntensity: 0.62,
    bassAnticipation: 0.35,
    chordVoiceLeadingBias: 0.48,
    enableExactChordVoiceAssignment: false,
    leadMaxLeapSemitones: 12,
    spaceMinGap: 0.018,
    phrasing: 'medium',
    cadenceStrength: 0.72,
    harmonicRhythmVariance: 0.52,
    harmonicComplexity: 0.32,
    pedalToneStrength: 0.48,
    callResponseIntensity: 0.58,
    bassEchoProbability: 0.38,
    densityGateStrength: 0.42,
    dynamicsShape: 'swell',
    dynamicsStrength: 0.68,
    registerLiftStrength: 0.38,
    extendedLfoTargets: 0.28,
    sidechainStrength: 0.35,
    ornamentation: 0.45,
    legatoStrength: 0.3,
    chordStabArpIntensity: 0.65,
  },
  ambient: {
    grooveTemplate: undefined,
    humanizeDistribution: 'gaussian',
    humanizeTime: 0.15,
    humanizeVel: 0.22,
    leadChordToneBias: 0.82,
    accentMapIntensity: 0.08,
    bassAnticipation: 0.12,
    chordVoiceLeadingBias: 0.92,
    enableExactChordVoiceAssignment: true,
    leadMaxLeapSemitones: 5,
    spaceMinGap: 0.035,
    phrasing: 'long',
    cadenceStrength: 0.28,
    harmonicRhythmVariance: 0.18,
    harmonicComplexity: 0.38,
    pedalToneStrength: 0.78,
    callResponseIntensity: 0.18,
    bassEchoProbability: 0.15,
    densityGateStrength: 0.15,
    dynamicsShape: 'rise',
    dynamicsStrength: 0.42,
    registerLiftStrength: 0.32,
    extendedLfoTargets: 0.45,
    sidechainStrength: 0.12,
    ornamentation: 0.25,
    legatoStrength: 0.75,
    chordStabArpIntensity: 0.15,
  },
};

export function GeneratorUI({ onGenerate }: { onGenerate: (x: { algorithm: Algorithm; params: GenerationParams }) => void }) {
  const [mode, setMode] = useState<'simple'|'advanced'>('simple');
  const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>('upbeat');
  const [algorithm, setAlgorithm] = useState<Algorithm>('enhanced_helix');
  const base = useMemo(() => PRESETS[presetKey].params, [presetKey]);
  const [seed] = useState<number>(1);

  const [bpm, setBpm] = useState<number>(base.bpm);
  const [keySig, setKeySig] = useState<string>(base.key);
  const [timeSignature, setTimeSignature] = useState<string>(base.timeSignature);
  const [durationSecs, setDurationSecs] = useState<number>(base.durationSecs);
  const [density, setDensity] = useState<number>(base.density);
  const [style, setStyle] = useState<StyleKey>('edm');
  const [variation, setVariation] = useState<number>(0.4);
  const [fillRate, setFillRate] = useState<number>(0.5);
  const [complexityLevel, setComplexityLevel] = useState<Complexity>('intermediate');
  const [motion, setMotion] = useState<number>(0.3);
  const [brightness, setBrightness] = useState<number>(0.5);

  // Phase 1 humanization flags (Enhanced Helix only)
  const [grooveTemplate, setGrooveTemplate] = useState<GenerationParams['grooveTemplate'] | undefined>(undefined);
  const [humanizeTimeAmt, setHumanizeTimeAmt] = useState<number>(0);
  const [humanizeVelAmt, setHumanizeVelAmt] = useState<number>(0);
  const [rushingDraggingStrength, setRushingDraggingStrength] = useState<number>(0);
  const [swingRatio, setSwingRatio] = useState<number | undefined>(undefined);
  const [leadChordToneBias, setLeadChordToneBias] = useState<number>(0);
  const [accentMapIntensity, setAccentMapIntensity] = useState<number>(0);
  const [bassAnticipation, setBassAnticipation] = useState<number>(0);
  const [rhythmMarkovStrength, setRhythmMarkovStrength] = useState<number>(0);
  const [chordVoiceLeadingBias, setChordVoiceLeadingBias] = useState<number>(0);
  const [enableExactChordVoiceAssignment, setEnableExactChordVoiceAssignment] = useState<boolean>(false);
  const [leadMaxLeapSemitones, setLeadMaxLeapSemitones] = useState<number>(0);
  const [spaceAllocatorMinGapSecs, setSpaceAllocatorMinGapSecs] = useState<number>(0);

  // Phase 2 phrasing & cadence (Enhanced Helix only)
  const [phrasing, setPhrasing] = useState<GenerationParams['phrasing'] | undefined>(undefined);
  const [cadenceStrength, setCadenceStrength] = useState<number>(0);

  // Phase 3 harmony (Enhanced Helix only)
  const [harmonicComplexity, setHarmonicComplexity] = useState<number>(0);
  const [harmonicRhythmVariance, setHarmonicRhythmVariance] = useState<number>(0);
  const [pedalToneStrength, setPedalToneStrength] = useState<number>(0);

  // Phase 4 inter-track conversation (Enhanced Helix only)
  const [callResponseIntensity, setCallResponseIntensity] = useState<number>(0);
  const [bassEchoProbability, setBassEchoProbability] = useState<number>(0);
  const [densityGateStrength, setDensityGateStrength] = useState<number>(0);

  // Phase 5 dynamics & automation (Enhanced Helix only)
  const [dynamicsShape, setDynamicsShape] = useState<GenerationParams['dynamicsShape'] | undefined>(undefined);
  const [dynamicsStrength, setDynamicsStrength] = useState<number>(0);
  const [registerLiftStrength, setRegisterLiftStrength] = useState<number>(0);
  const [extendedLfoTargets, setExtendedLfoTargets] = useState<number>(0);
  const [sidechainStrength, setSidechainStrength] = useState<number>(0);
  const [humanizeDistribution, setHumanizeDistribution] = useState<'uniform'|'gaussian'>('uniform');

  // Phase 7 ornamentation & articulation (Enhanced Helix only)
  const [ornamentation, setOrnamentation] = useState<number>(0);
  const [legatoStrength, setLegatoStrength] = useState<number>(0);
  const [chordStabArpIntensity, setChordStabArpIntensity] = useState<number>(0);

  // Phase 9 adaptive weighting (Enhanced Helix only)
  const [adaptiveWeightingStrength, setAdaptiveWeightingStrength] = useState<number>(0);
  const [adaptiveProfileId, setAdaptiveProfileId] = useState<string>('');

  // sync state when preset changes
  React.useEffect(() => {
    setBpm(base.bpm);
    setKeySig(base.key);
    setTimeSignature(base.timeSignature);
    setDurationSecs(base.durationSecs);
    setDensity(base.density);
  }, [base]);

  // Advanced mode default duration: if user hasn't changed it (still equals preset), set to 16s
  React.useEffect(() => {
    if (mode === 'advanced' && durationSecs === base.durationSecs) {
      setDurationSecs(16);
    }
  }, [mode, base, durationSecs]);

  // --- Advanced defaults application for Enhanced Helix ---
  const lastAdvancedStyleRef = React.useRef<StyleKey | null>(null);

  const applyHelixProfile = React.useCallback((profile: HelixAdvancedProfile | undefined) => {
    // Safety check: if profile is undefined, bail out
    if (!profile) {
      console.error('[applyHelixProfile] Received undefined profile');
      return;
    }
    setGrooveTemplate(profile.grooveTemplate);
    if (profile.humanizeDistribution) setHumanizeDistribution(profile.humanizeDistribution);
    setHumanizeTimeAmt(profile.humanizeTime);
    setHumanizeVelAmt(profile.humanizeVel);
    setLeadChordToneBias(profile.leadChordToneBias);
    setAccentMapIntensity(profile.accentMapIntensity);
    setBassAnticipation(profile.bassAnticipation);
    setChordVoiceLeadingBias(profile.chordVoiceLeadingBias);
    setEnableExactChordVoiceAssignment(Boolean(profile.enableExactChordVoiceAssignment));
    setLeadMaxLeapSemitones(profile.leadMaxLeapSemitones);
    setSpaceAllocatorMinGapSecs(profile.spaceMinGap);
    setPhrasing(profile.phrasing);
    setCadenceStrength(profile.cadenceStrength);
    setHarmonicRhythmVariance(profile.harmonicRhythmVariance);
    setHarmonicComplexity(profile.harmonicComplexity);
    setPedalToneStrength(profile.pedalToneStrength);
    setCallResponseIntensity(profile.callResponseIntensity);
    setBassEchoProbability(profile.bassEchoProbability);
    setDensityGateStrength(profile.densityGateStrength);
    setDynamicsShape(profile.dynamicsShape);
    setDynamicsStrength(profile.dynamicsStrength);
    setRegisterLiftStrength(profile.registerLiftStrength);
    setExtendedLfoTargets(profile.extendedLfoTargets);
    setSidechainStrength(profile.sidechainStrength);
    // Phase 7: Always set ornamentation parameters (use defaults if not in profile)
    setOrnamentation(profile.ornamentation ?? 0.5);
    setLegatoStrength(profile.legatoStrength ?? 0.4);
    setChordStabArpIntensity(profile.chordStabArpIntensity ?? 0.6);
  }, []);

  const applyAdvancedDefaults = React.useCallback((sty: StyleKey) => {
    const profile = ADVANCED_PROFILES[sty];
    if (!profile) {
      console.error(`[applyAdvancedDefaults] No profile found for style: ${sty}`);
      console.log('[applyAdvancedDefaults] Available styles:', Object.keys(ADVANCED_PROFILES));
      return;
    }
    applyHelixProfile(profile);
    lastAdvancedStyleRef.current = sty;
  }, [applyHelixProfile]);

  const applyHumanizePreset = React.useCallback((sty: StyleKey) => {
    const profile = HUMANIZE_PRESETS[sty];
    if (!profile) {
      console.error(`[applyHumanizePreset] No profile found for style: ${sty}`);
      console.log('[applyHumanizePreset] Available styles:', Object.keys(HUMANIZE_PRESETS));
      return;
    }
    applyHelixProfile(profile);
  }, [applyHelixProfile]);

  // CRITICAL FIX: Apply style defaults IMMEDIATELY when switching to advanced mode
  // This prevents users from seeing all zeros and feeling lost
  const previousMode = React.useRef<'simple'|'advanced'>('simple');
  React.useEffect(() => {
    if (mode === 'advanced' && previousMode.current === 'simple' && algorithm === 'enhanced_helix') {
      // User just switched to advanced mode - apply defaults immediately
      applyAdvancedDefaults(style);
    }
    previousMode.current = mode;
  }, [mode, algorithm, style, applyAdvancedDefaults]);

  React.useEffect(() => {
    if (mode !== 'advanced' || algorithm !== 'enhanced_helix') return;

    const untouched =
      (grooveTemplate ?? '') === '' &&
      humanizeTimeAmt === 0 &&
      humanizeVelAmt === 0 &&
      leadChordToneBias === 0 &&
      accentMapIntensity === 0 &&
      bassAnticipation === 0 &&
      chordVoiceLeadingBias === 0 &&
      leadMaxLeapSemitones === 0 &&
      spaceAllocatorMinGapSecs === 0 &&
      !phrasing &&
      cadenceStrength === 0 &&
      harmonicRhythmVariance === 0 &&
      harmonicComplexity === 0 &&
      pedalToneStrength === 0 &&
      callResponseIntensity === 0 &&
      bassEchoProbability === 0 &&
      densityGateStrength === 0 &&
      (!dynamicsShape) &&
      dynamicsStrength === 0 &&
      registerLiftStrength === 0 &&
      extendedLfoTargets === 0 &&
      sidechainStrength === 0;

    if (untouched) {
      applyAdvancedDefaults(style);
    } else if (lastAdvancedStyleRef.current && lastAdvancedStyleRef.current !== style) {
      // If current values still match previous style profile, switch to new style profile
      const prev = ADVANCED_PROFILES[lastAdvancedStyleRef.current];
      // Safety check: ensure prev exists (in case of invalid style key)
      if (!prev) {
        applyAdvancedDefaults(style);
        lastAdvancedStyleRef.current = style;
        return;
      }
      const floatEq = (a: number, b: number) => Math.abs(a - b) < 1e-3;
      const matchesPrev =
        (grooveTemplate ?? null) === (prev.grooveTemplate ?? null) &&
        floatEq(humanizeTimeAmt, prev.humanizeTime) &&
        floatEq(humanizeVelAmt, prev.humanizeVel) &&
        floatEq(leadChordToneBias, prev.leadChordToneBias) &&
        floatEq(accentMapIntensity, prev.accentMapIntensity) &&
        floatEq(bassAnticipation, prev.bassAnticipation) &&
        floatEq(chordVoiceLeadingBias, prev.chordVoiceLeadingBias) &&
        leadMaxLeapSemitones === prev.leadMaxLeapSemitones &&
        floatEq(spaceAllocatorMinGapSecs, prev.spaceMinGap) &&
        (phrasing ?? null) === (prev.phrasing ?? null) &&
        floatEq(cadenceStrength, prev.cadenceStrength) &&
        floatEq(harmonicRhythmVariance, prev.harmonicRhythmVariance) &&
        floatEq(harmonicComplexity, prev.harmonicComplexity) &&
        floatEq(pedalToneStrength, prev.pedalToneStrength) &&
        floatEq(callResponseIntensity, prev.callResponseIntensity) &&
        floatEq(bassEchoProbability, prev.bassEchoProbability) &&
        floatEq(densityGateStrength, prev.densityGateStrength) &&
        (dynamicsShape ?? null) === (prev.dynamicsShape ?? null) &&
        floatEq(dynamicsStrength, prev.dynamicsStrength) &&
        floatEq(registerLiftStrength, prev.registerLiftStrength) &&
        floatEq(extendedLfoTargets, prev.extendedLfoTargets) &&
        floatEq(sidechainStrength, prev.sidechainStrength);

      if (matchesPrev) applyAdvancedDefaults(style);
    }

    lastAdvancedStyleRef.current = style;
  }, [mode, algorithm, style, grooveTemplate, humanizeTimeAmt, humanizeVelAmt, leadChordToneBias, accentMapIntensity, bassAnticipation, chordVoiceLeadingBias, leadMaxLeapSemitones, spaceAllocatorMinGapSecs, phrasing, cadenceStrength, harmonicRhythmVariance, harmonicComplexity, pedalToneStrength, callResponseIntensity, bassEchoProbability, densityGateStrength, dynamicsShape, dynamicsStrength, registerLiftStrength, extendedLfoTargets, sidechainStrength, applyAdvancedDefaults]);

  const handleGenerate = () => {
    const params: GenerationParams = { 
      seed: seed + Math.floor(Math.random() * 1000), // randomize seed each time
      bpm, key: keySig, timeSignature, durationSecs, density, 
      style, variation, fillRate, complexityLevel, motion, brightness,
      simpleMode: mode === 'simple' ? true : undefined,
      // Enhanced Helix Phase 1 flags (only used by that engine)
      grooveTemplate: grooveTemplate ?? undefined,
      humanizeDistribution: humanizeDistribution,
      humanizeTime: humanizeTimeAmt || undefined,
      humanizeVel: humanizeVelAmt || undefined,
      rushingDraggingStrength: rushingDraggingStrength || undefined,
      swingRatio: grooveTemplate === 'shuffle' ? swingRatio : undefined,
      leadChordToneBias: leadChordToneBias || undefined,
      accentMapIntensity: accentMapIntensity || undefined,
      bassAnticipation: bassAnticipation || undefined,
      chordVoiceLeadingBias: chordVoiceLeadingBias || undefined,
      enableExactChordVoiceAssignment: enableExactChordVoiceAssignment || undefined,
      rhythmMarkovStrength: rhythmMarkovStrength || undefined,
      leadMaxLeapSemitones: leadMaxLeapSemitones || undefined,
      spaceAllocatorMinGapSecs: spaceAllocatorMinGapSecs || undefined,
      phrasing: phrasing ?? undefined,
      cadenceStrength: cadenceStrength || undefined,
      harmonicComplexity: harmonicComplexity || undefined,
      harmonicRhythmVariance: harmonicRhythmVariance || undefined,
      pedalToneStrength: pedalToneStrength || undefined,
      callResponseIntensity: callResponseIntensity || undefined,
      bassEchoProbability: bassEchoProbability || undefined,
      densityGateStrength: densityGateStrength || undefined,
      dynamicsShape: dynamicsShape ?? undefined,
      dynamicsStrength: dynamicsStrength || undefined,
      registerLiftStrength: registerLiftStrength || undefined,
      extendedLfoTargets: extendedLfoTargets || undefined,
      sidechainStrength: sidechainStrength || undefined,
      // Phase 7
      ornamentation: ornamentation || undefined,
      legatoStrength: legatoStrength || undefined,
      chordStabArpIntensity: chordStabArpIntensity || undefined,
      // Phase 9
      adaptiveWeightingStrength: adaptiveWeightingStrength > 0 ? adaptiveWeightingStrength : undefined,
      adaptiveProfileId: adaptiveProfileId.trim() ? adaptiveProfileId.trim() : undefined,
    };
    onGenerate({ algorithm, params });
  };
  
  const handleCreateSimilar = () => {
    const baseParams: GenerationParams = { 
      seed, bpm, key: keySig, timeSignature, durationSecs, density, 
      style, variation, fillRate, complexityLevel, motion, brightness,
      simpleMode: mode === 'simple' ? true : undefined,
      grooveTemplate: grooveTemplate ?? undefined,
      humanizeDistribution: humanizeDistribution,
      humanizeTime: humanizeTimeAmt || undefined,
      humanizeVel: humanizeVelAmt || undefined,
      rushingDraggingStrength: rushingDraggingStrength || undefined,
      swingRatio: grooveTemplate === 'shuffle' ? swingRatio : undefined,
      leadChordToneBias: leadChordToneBias || undefined,
      accentMapIntensity: accentMapIntensity || undefined,
      bassAnticipation: bassAnticipation || undefined,
      chordVoiceLeadingBias: chordVoiceLeadingBias || undefined,
      enableExactChordVoiceAssignment: enableExactChordVoiceAssignment || undefined,
      rhythmMarkovStrength: rhythmMarkovStrength || undefined,
      leadMaxLeapSemitones: leadMaxLeapSemitones || undefined,
      spaceAllocatorMinGapSecs: spaceAllocatorMinGapSecs || undefined,
      phrasing: phrasing ?? undefined,
      cadenceStrength: cadenceStrength || undefined,
      harmonicComplexity: harmonicComplexity || undefined,
      harmonicRhythmVariance: harmonicRhythmVariance || undefined,
      pedalToneStrength: pedalToneStrength || undefined,
      callResponseIntensity: callResponseIntensity || undefined,
      bassEchoProbability: bassEchoProbability || undefined,
      densityGateStrength: densityGateStrength || undefined,
      dynamicsShape: dynamicsShape ?? undefined,
      dynamicsStrength: dynamicsStrength || undefined,
      registerLiftStrength: registerLiftStrength || undefined,
      extendedLfoTargets: extendedLfoTargets || undefined,
      sidechainStrength: sidechainStrength || undefined,
      ornamentation: ornamentation || undefined,
      legatoStrength: legatoStrength || undefined,
      chordStabArpIntensity: chordStabArpIntensity || undefined,
      adaptiveWeightingStrength: adaptiveWeightingStrength > 0 ? adaptiveWeightingStrength : undefined,
      adaptiveProfileId: adaptiveProfileId.trim() ? adaptiveProfileId.trim() : undefined,
    };
    const jittered = { ...baseParams, seed: baseParams.seed + Math.floor(Math.random() * 1000) };
    onGenerate({ algorithm, params: jittered });
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</span>
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'simple'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🎯 Simple
          </button>
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'advanced'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ⚙️ Advanced
          </button>
        </div>
      </div>

      {/* Accessible headings for tests */}
      {mode === 'simple' && (
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Simple Mode</h3>
      )}
      {mode === 'advanced' && (
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Advanced Mode</h3>
      )}

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label htmlFor="algorithmSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Algorithm
        </label>
        <select
          id="algorithmSelect"
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value as Algorithm)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(ALGORITHM_INFO).map(([key, info]) => (
            <option key={key} value={key}>{info.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {ALGORITHM_INFO[algorithm].description}
        </p>
      </div>

      {/* Preset Selection (Simple Mode) */}
      {mode === 'simple' && (
        <div className="space-y-2">
          <label htmlFor="presetSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Preset
          </label>
          <select
            id="presetSelect"
            value={presetKey}
            onChange={e => setPresetKey(e.target.value as keyof typeof PRESETS)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Advanced Parameters */}
      {mode === 'advanced' && (
        <>
          {/* Info Banner */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">✨ Advanced Mode Active</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Full control over Enhanced Helix engine with modular generators (lead, chords, bass, drums, fx), 
              ensemble-based humanization, dynamic phrasing, and sophisticated harmony. 
              Style presets auto-configure parameters when switching styles.
            </p>
          </div>
          
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="bpmInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              BPM
            </label>
            <input
              id="bpmInput"
              type="number"
              min="40" max="200" 
              value={bpm} 
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="keySelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Key
            </label>
            <select
              id="keySelect"
              value={keySig}
              onChange={e => setKeySig(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Signature
            </label>
            <select 
              value={timeSignature} 
              onChange={e => setTimeSignature(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {['4/4','3/4','5/4','7/8'].map(ts => <option key={ts} value={ts}>{ts}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration (seconds)
            </label>
            <input 
              type="number" 
              min="2" max="120" 
              value={durationSecs} 
              onChange={e => setDurationSecs(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Style
            </label>
            <select 
              value={style} 
              onChange={e => setStyle(e.target.value as StyleKey)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="edm">🎛️ EDM</option>
              <option value="techno">🔊 Techno</option>
              <option value="rock">🎸 Rock</option>
              <option value="jazz">🎷 Jazz</option>
              <option value="lofi">📻 Lo-Fi</option>
              <option value="cinematic">🎬 Cinematic</option>
              <option value="ambient">🌌 Ambient</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Complexity
            </label>
            <select 
              value={complexityLevel} 
              onChange={e => setComplexityLevel(e.target.value as Complexity)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="simple">🎵 Simple</option>
              <option value="intermediate">🎼 Intermediate</option>
              <option value="full">🎹 Full</option>
              <option value="high">🎪 High Quality</option>
            </select>
          </div>

          {/* Sliders Row */}
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Density: {density.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={density} 
                onChange={e => setDensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Variation: {variation.toFixed(2)}
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={variation} 
                onChange={e => setVariation(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fill Rate: {fillRate.toFixed(1)}
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={fillRate} 
                onChange={e => setFillRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Helix-specific controls */}
          {(algorithm === 'helix' || algorithm === 'enhanced_helix') && (
            <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motion: {motion.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={motion} 
                  onChange={e => setMotion(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brightness: {brightness.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={brightness} 
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Enhanced Helix Humanization (Phase 1 flags) */}
          {algorithm === 'enhanced_helix' && (
            <div className="col-span-2 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label="Humanize Distribution" tooltip="Uniform: random spread. Gaussian: more natural clustering around center values." />
                  </label>
                  <select value={humanizeDistribution} onChange={e=>setHumanizeDistribution(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="uniform">uniform</option>
                    <option value="gaussian">gaussian</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Humanization Presets</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => applyHumanizePreset('edm')}
                  >EDM</button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => applyHumanizePreset('cinematic')}
                  >Cinematic</button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => applyHumanizePreset('lofi')}
                  >Lo‑Fi</button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => applyHumanizePreset('jazz')}
                  >Jazz</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label="Groove Template" tooltip="Applies timing patterns: straight (quantized), shuffle (swing feel), mpc62 (classic sampler timing), funk (syncopated)." />
                  </label>
                  <select value={grooveTemplate ?? ''} onChange={(e) => setGrooveTemplate((e.target.value || undefined) as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">(straight)</option>
                    <option value="shuffle">shuffle</option>
                    <option value="mpc62">mpc62</option>
                    <option value="funk">funk</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Humanize Time: ${humanizeTimeAmt.toFixed(2)}`} tooltip="Adds subtle timing variations to make notes feel more human (±ms). 0=robotic, 0.3=realistic, 0.5+=very loose." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={humanizeTimeAmt} onChange={e=>setHumanizeTimeAmt(Number(e.target.value))} className="w-full" />
                </div>

                {grooveTemplate === 'shuffle' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <LabelWithTooltip label={`Swing Ratio: ${(swingRatio ?? 0.66).toFixed(2)}`} tooltip="Controls shuffle timing. 0.5=straight 16ths, 0.66=triplet swing, 0.75=heavy swing." />
                    </label>
                    <input type="range" min="0.55" max="0.75" step="0.01" value={swingRatio ?? 0.66} onChange={e=>setSwingRatio(Number(e.target.value))} className="w-full" />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Humanize Velocity: ${humanizeVelAmt.toFixed(2)}`} tooltip="Varies note volumes for natural dynamics. 0=uniform, 0.3=subtle, 0.5+=dramatic expression." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={humanizeVelAmt} onChange={e=>setHumanizeVelAmt(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Rushing/Dragging: ${rushingDraggingStrength.toFixed(2)}`} tooltip="Ensemble drifts slightly ahead/behind tempo over bars. Adds organic feel but can loosen timing." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={rushingDraggingStrength} onChange={e=>setRushingDraggingStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Lead Chord-Tone Bias: ${leadChordToneBias.toFixed(2)}`} tooltip="How strongly lead melodies stick to chord tones. 0=chromatic freedom, 0.5=balanced, 1=only chord tones (safe but bland)." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={leadChordToneBias} onChange={e=>setLeadChordToneBias(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Drum Accent Intensity: ${accentMapIntensity.toFixed(2)}`} tooltip="Emphasizes downbeats and strong beats in drums. 0=flat dynamics, 0.5=natural accents, 1=heavy emphasis." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={accentMapIntensity} onChange={e=>setAccentMapIntensity(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Bass Anticipation: ${bassAnticipation.toFixed(2)}`} tooltip="Bass plays slightly ahead of beat (anticipation). 0=on-beat, 0.3=subtle groove, 0.5+=very forward-driving." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={bassAnticipation} onChange={e=>setBassAnticipation(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Rhythm Markov Strength: ${rhythmMarkovStrength.toFixed(2)}`} tooltip="Uses probability chains for rhythm patterns. 0=random, 0.5=balanced variety, 1=highly repetitive patterns." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={rhythmMarkovStrength} onChange={e=>setRhythmMarkovStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <LabelWithTooltip label={`Chord Voice-Leading Bias: ${chordVoiceLeadingBias.toFixed(2)}`} tooltip="Smooth voice leading between chords (small melodic movement). 0=random inversions, 0.7=smooth classical, 1=minimal movement." />
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={chordVoiceLeadingBias} onChange={e=>setChordVoiceLeadingBias(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input id="exactVoicingToggle" type="checkbox" checked={enableExactChordVoiceAssignment} onChange={e=>setEnableExactChordVoiceAssignment(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="exactVoicingToggle" className="text-sm text-gray-700 dark:text-gray-300" title="Preserves common tones and assigns each voice to the nearest chord tone; recommended for cinematic/jazz; requires Voice‑Leading Bias > 0.">Enable exact close‑voicing (preserve common tones)</label>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead Max Leap (semitones)</label>
                  <select value={leadMaxLeapSemitones} onChange={e=>setLeadMaxLeapSemitones(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {[0,7,9,12].map(n => <option key={n} value={n}>{n === 0 ? '(none)' : n}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Gap (secs): {spaceAllocatorMinGapSecs.toFixed(3)}</label>
                  <input type="range" min="0" max="0.05" step="0.005" value={spaceAllocatorMinGapSecs} onChange={e=>setSpaceAllocatorMinGapSecs(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 2: phrasing & cadence */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="phrasingSelect">Phrasing</label>
                  <select id="phrasingSelect" aria-label="phrasing-select" value={phrasing ?? ''} onChange={e=>setPhrasing((e.target.value || undefined) as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">(default)</option>
                    <option value="short">short (2 bars)</option>
                    <option value="medium">medium (4 bars)</option>
                    <option value="long">long (4 bars)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cadenceSlider">Cadence Strength: {cadenceStrength.toFixed(2)}</label>
                  <input id="cadenceSlider" aria-label="cadence-strength" type="range" min="0" max="1" step="0.05" value={cadenceStrength} onChange={e=>setCadenceStrength(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 3: harmonic expansion */}
                <div className="col-span-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Harmony</h3>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harmonic Rhythm Variance: {harmonicRhythmVariance.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={harmonicRhythmVariance} onChange={e=>setHarmonicRhythmVariance(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harmonic Complexity (subs): {harmonicComplexity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={harmonicComplexity} onChange={e=>setHarmonicComplexity(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pedal Tone Strength: {pedalToneStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={pedalToneStrength} onChange={e=>setPedalToneStrength(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 4: inter-track conversation */}
                <div className="col-span-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Conversation</h3>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Call/Response Intensity: {callResponseIntensity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={callResponseIntensity} onChange={e=>setCallResponseIntensity(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bass Echo Probability: {bassEchoProbability.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={bassEchoProbability} onChange={e=>setBassEchoProbability(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Density Gate Strength: {densityGateStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={densityGateStrength} onChange={e=>setDensityGateStrength(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 5: Dynamics & FX */}
                <div className="col-span-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dynamics & FX</h3>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dynamics Shape</label>
                  <select value={dynamicsShape ?? ''} onChange={(e)=>setDynamicsShape((e.target.value || undefined) as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">(flat)</option>
                    <option value="rise">rise</option>
                    <option value="fall">fall</option>
                    <option value="swell">swell</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dynamics Strength: {dynamicsStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={dynamicsStrength} onChange={e=>setDynamicsStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register Lift (lead): {registerLiftStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={registerLiftStrength} onChange={e=>setRegisterLiftStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Extended LFO Targets: {extendedLfoTargets.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={extendedLfoTargets} onChange={e=>setExtendedLfoTargets(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sidechain Strength: {sidechainStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={sidechainStrength} onChange={e=>setSidechainStrength(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 7: Ornamentation & Articulation */}
                <div className="col-span-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ornamentation & Articulation</h3>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ornamentation: {ornamentation.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={ornamentation} onChange={e=>setOrnamentation(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Legato Strength: {legatoStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={legatoStrength} onChange={e=>setLegatoStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chord Stab/Arp Intensity: {chordStabArpIntensity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={chordStabArpIntensity} onChange={e=>setChordStabArpIntensity(Number(e.target.value))} className="w-full" />
                </div>

                {/* Phase 9: Adaptive Bias (Optional) */}
                <div className="col-span-2 pt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">🔬 Experimental: Adaptive Bias</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional AI-driven parameter adjustment</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adaptive Weighting: {adaptiveWeightingStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={adaptiveWeightingStrength} onChange={e=>setAdaptiveWeightingStrength(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Id (optional)</label>
                  <input type="text" value={adaptiveProfileId} onChange={e=>setAdaptiveProfileId(e.target.value)}
                    placeholder="Leave empty for auto"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={handleGenerate}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <MusicIcon className="w-4 h-4" />
          Generate Music
        </button>
        <button 
          type="button" 
          onClick={handleCreateSimilar}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RefreshIcon className="w-4 h-4" />
          Similar
        </button>
      </div>
    </div>
  );
}