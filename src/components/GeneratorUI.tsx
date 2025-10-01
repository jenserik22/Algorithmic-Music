import React, { useMemo, useState } from 'react';
import type { GenerationParams } from '@/lib/music/engines/types';

type Algorithm = 'stochastic' | 'markov' | 'cellular_automata' | 'l_system' | 'generative_grammar' | 'euclidean';

const PRESETS: Record<string, { label: string; params: Omit<GenerationParams, 'seed'> }>
  = {
  upbeat: { label: 'Upbeat 120', params: { bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5 } },
  ambient: { label: 'Ambient 70', params: { bpm: 70, key: 'Am', timeSignature: '4/4', durationSecs: 8, density: 0.3 } },
};

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Am'];

export function GeneratorUI({ onGenerate }: { onGenerate: (x: { algorithm: Algorithm; params: GenerationParams }) => void }) {
  const [mode, setMode] = useState<'simple'|'advanced'>('simple');
  const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>('upbeat');
  const [algorithm, setAlgorithm] = useState<Algorithm>('stochastic');
  const base = useMemo(() => PRESETS[presetKey].params, [presetKey]);
  const [seed] = useState<number>(1);

  const [bpm, setBpm] = useState<number>(base.bpm);
  const [keySig, setKeySig] = useState<string>(base.key);
  const [timeSignature, setTimeSignature] = useState<string>(base.timeSignature);
  const [durationSecs, setDurationSecs] = useState<number>(base.durationSecs);
  const [density, setDensity] = useState<number>(base.density);

  // sync state when preset changes (only in simple or when not manually edited)
  React.useEffect(() => {
    setBpm(base.bpm);
    setKeySig(base.key);
    setTimeSignature(base.timeSignature);
    setDurationSecs(base.durationSecs);
    setDensity(base.density);
  }, [base]);

  const handleGenerate = () => {
    const params: GenerationParams = { seed, bpm, key: keySig, timeSignature, durationSecs, density };
    onGenerate({ algorithm, params });
  };

  return (
    <div>
      {mode === 'simple' ? (
        <h2>Simple Mode</h2>
      ) : (
        <h2>Advanced Mode</h2>
      )}
      <div>
        <button type="button" onClick={() => setMode('simple')}>Simple</button>
        <button type="button" onClick={() => setMode('advanced')}>Advanced</button>
      </div>
      <div>
        <label htmlFor="preset">Preset</label>
        <select id="preset" aria-label="Preset" value={presetKey} onChange={e => setPresetKey(e.target.value as any)}>
          {Object.entries(PRESETS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="algorithm">Algorithm</label>
        <select id="algorithm" aria-label="Algorithm" value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}>
          {['stochastic','markov','cellular_automata','l_system','generative_grammar','euclidean'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      {mode === 'advanced' && (
        <div>
          <div>
            <label htmlFor="bpm">BPM</label>
            <input id="bpm" type="number" aria-label="BPM" value={bpm} onChange={e => setBpm(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="key">Key</label>
            <select id="key" aria-label="Key" value={keySig} onChange={e => setKeySig(e.target.value)}>
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="timeSig">Time Signature</label>
            <select id="timeSig" aria-label="Time Signature" value={timeSignature} onChange={e => setTimeSignature(e.target.value)}>
              {['4/4','3/4','5/4','7/8'].map(ts => <option key={ts} value={ts}>{ts}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="duration">Duration (secs)</label>
            <input id="duration" type="number" aria-label="Duration" value={durationSecs} onChange={e => setDurationSecs(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="density">Density</label>
            <input id="density" type="number" step="0.05" min="0" max="1" aria-label="Density" value={density} onChange={e => setDensity(Number(e.target.value))} />
          </div>
        </div>
      )}
      <div>
        <button type="button" onClick={handleGenerate}>Generate</button>
      </div>
    </div>
  );
}
