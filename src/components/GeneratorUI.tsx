import React, { useMemo, useState } from 'react';
import type { GenerationParams, Complexity } from '@/lib/music/engines/types';
import { MusicIcon, RefreshIcon } from '@/components/icons';

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

export function GeneratorUI({ onGenerate }: { onGenerate: (x: { algorithm: Algorithm; params: GenerationParams }) => void }) {
  const [mode, setMode] = useState<'simple'|'advanced'>('simple');
  const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>('upbeat');
  const [algorithm, setAlgorithm] = useState<Algorithm>('euclidean');
  const base = useMemo(() => PRESETS[presetKey].params, [presetKey]);
  const [seed] = useState<number>(1);

  const [bpm, setBpm] = useState<number>(base.bpm);
  const [keySig, setKeySig] = useState<string>(base.key);
  const [timeSignature, setTimeSignature] = useState<string>(base.timeSignature);
  const [durationSecs, setDurationSecs] = useState<number>(base.durationSecs);
  const [density, setDensity] = useState<number>(base.density);
  const [style, setStyle] = useState<'edm'|'cinematic'|'lofi'|'jazz'>('edm');
  const [variation, setVariation] = useState<number>(0.4);
  const [fillRate, setFillRate] = useState<number>(0.5);
  const [complexityLevel, setComplexityLevel] = useState<Complexity>('intermediate');
  const [motion, setMotion] = useState<number>(0.3);
  const [brightness, setBrightness] = useState<number>(0.5);

  // Phase 1 humanization flags (Enhanced Helix only)
  const [grooveTemplate, setGrooveTemplate] = useState<GenerationParams['grooveTemplate'] | undefined>(undefined);
  const [humanizeTimeAmt, setHumanizeTimeAmt] = useState<number>(0);
  const [humanizeVelAmt, setHumanizeVelAmt] = useState<number>(0);
  const [leadChordToneBias, setLeadChordToneBias] = useState<number>(0);
  const [accentMapIntensity, setAccentMapIntensity] = useState<number>(0);
  const [bassAnticipation, setBassAnticipation] = useState<number>(0);
  const [chordVoiceLeadingBias, setChordVoiceLeadingBias] = useState<number>(0);
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

  // sync state when preset changes
  React.useEffect(() => {
    setBpm(base.bpm);
    setKeySig(base.key);
    setTimeSignature(base.timeSignature);
    setDurationSecs(base.durationSecs);
    setDensity(base.density);
  }, [base]);

  const handleGenerate = () => {
    const params: GenerationParams = { 
      seed: seed + Math.floor(Math.random() * 1000), // randomize seed each time
      bpm, key: keySig, timeSignature, durationSecs, density, 
      style, variation, fillRate, complexityLevel, motion, brightness,
      // Enhanced Helix Phase 1 flags (only used by that engine)
      grooveTemplate: grooveTemplate ?? undefined,
      humanizeTime: humanizeTimeAmt || undefined,
      humanizeVel: humanizeVelAmt || undefined,
      leadChordToneBias: leadChordToneBias || undefined,
      accentMapIntensity: accentMapIntensity || undefined,
      bassAnticipation: bassAnticipation || undefined,
      chordVoiceLeadingBias: chordVoiceLeadingBias || undefined,
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
    };
    onGenerate({ algorithm, params });
  };
  
  const handleCreateSimilar = () => {
    const baseParams: GenerationParams = { 
      seed, bpm, key: keySig, timeSignature, durationSecs, density, 
      style, variation, fillRate, complexityLevel, motion, brightness,
      grooveTemplate: grooveTemplate ?? undefined,
      humanizeTime: humanizeTimeAmt || undefined,
      humanizeVel: humanizeVelAmt || undefined,
      leadChordToneBias: leadChordToneBias || undefined,
      accentMapIntensity: accentMapIntensity || undefined,
      bassAnticipation: bassAnticipation || undefined,
      chordVoiceLeadingBias: chordVoiceLeadingBias || undefined,
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
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
              onChange={e => setStyle(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="edm">🎛️ EDM</option>
              <option value="cinematic">🎬 Cinematic</option>
              <option value="lofi">📻 Lo-Fi</option>
              <option value="jazz">🎷 Jazz</option>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Humanization Presets</h3>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => { setGrooveTemplate('mpc62'); setHumanizeTimeAmt(0.12); setHumanizeVelAmt(0.2); setLeadChordToneBias(0.4); setAccentMapIntensity(0.35); setBassAnticipation(0.3); setChordVoiceLeadingBias(0.3); setLeadMaxLeapSemitones(9); setSpaceAllocatorMinGapSecs(0.015); setPhrasing('short'); setCadenceStrength(0.7); setHarmonicRhythmVariance(0.5); setHarmonicComplexity(0.3); setPedalToneStrength(0.2); setCallResponseIntensity(0.6); setBassEchoProbability(0.3); setDensityGateStrength(0.4); }}
                  >EDM</button>
                  <button type="button" className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => { setGrooveTemplate(undefined); setHumanizeTimeAmt(0.12); setHumanizeVelAmt(0.15); setLeadChordToneBias(0.5); setAccentMapIntensity(0.1); setBassAnticipation(0.2); setChordVoiceLeadingBias(0.7); setLeadMaxLeapSemitones(7); setSpaceAllocatorMinGapSecs(0.02); setPhrasing('long'); setCadenceStrength(0.9); setHarmonicRhythmVariance(0.3); setHarmonicComplexity(0.2); setPedalToneStrength(0.5); setCallResponseIntensity(0.4); setBassEchoProbability(0.2); setDensityGateStrength(0.3); }}
                  >Cinematic</button>
                  <button type="button" className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => { setGrooveTemplate('shuffle'); setHumanizeTimeAmt(0.25); setHumanizeVelAmt(0.3); setLeadChordToneBias(0.35); setAccentMapIntensity(0.4); setBassAnticipation(0.25); setChordVoiceLeadingBias(0.4); setLeadMaxLeapSemitones(7); setSpaceAllocatorMinGapSecs(0.02); setPhrasing('short'); setCadenceStrength(0.6); setHarmonicRhythmVariance(0.4); setHarmonicComplexity(0.25); setPedalToneStrength(0.3); setCallResponseIntensity(0.3); setBassEchoProbability(0.25); setDensityGateStrength(0.2); }}
                  >Lo‑Fi</button>
                  <button type="button" className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => { setGrooveTemplate('shuffle'); setHumanizeTimeAmt(0.15); setHumanizeVelAmt(0.2); setLeadChordToneBias(0.5); setAccentMapIntensity(0.2); setBassAnticipation(0.35); setChordVoiceLeadingBias(0.8); setLeadMaxLeapSemitones(9); setSpaceAllocatorMinGapSecs(0.015); setPhrasing('medium'); setCadenceStrength(0.5); setHarmonicRhythmVariance(0.35); setHarmonicComplexity(0.4); setPedalToneStrength(0.2); setCallResponseIntensity(0.5); setBassEchoProbability(0.2); setDensityGateStrength(0.3); }}
                  >Jazz</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Groove Template</label>
                  <select value={grooveTemplate ?? ''} onChange={(e) => setGrooveTemplate((e.target.value || undefined) as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">(straight)</option>
                    <option value="shuffle">shuffle</option>
                    <option value="mpc62">mpc62</option>
                    <option value="funk">funk</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Humanize Time: {humanizeTimeAmt.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={humanizeTimeAmt} onChange={e=>setHumanizeTimeAmt(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Humanize Velocity: {humanizeVelAmt.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={humanizeVelAmt} onChange={e=>setHumanizeVelAmt(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead Chord‑Tone Bias: {leadChordToneBias.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={leadChordToneBias} onChange={e=>setLeadChordToneBias(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Drum Accent Intensity: {accentMapIntensity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={accentMapIntensity} onChange={e=>setAccentMapIntensity(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bass Anticipation: {bassAnticipation.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={bassAnticipation} onChange={e=>setBassAnticipation(Number(e.target.value))} className="w-full" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chord Voice‑Leading Bias: {chordVoiceLeadingBias.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={chordVoiceLeadingBias} onChange={e=>setChordVoiceLeadingBias(Number(e.target.value))} className="w-full" />
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
              </div>
            </div>
          )}
        </div>
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