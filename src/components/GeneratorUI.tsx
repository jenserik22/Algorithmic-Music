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
      style, variation, fillRate, complexityLevel, motion, brightness 
    };
    onGenerate({ algorithm, params });
  };
  
  const handleCreateSimilar = () => {
    const baseParams: GenerationParams = { 
      seed, bpm, key: keySig, timeSignature, durationSecs, density, 
      style, variation, fillRate, complexityLevel, motion, brightness 
    };
    const jittered = { ...baseParams, seed: baseParams.seed + Math.floor(Math.random() * 1000) };
    onGenerate({ algorithm, params: jittered });
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
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

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Algorithm
        </label>
        <select 
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Preset
          </label>
          <select 
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              BPM
            </label>
            <input 
              type="number" 
              min="40" max="200" 
              value={bpm} 
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Key
            </label>
            <select 
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