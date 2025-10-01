import React from 'react';
import { GeneratorUI } from '@/components/GeneratorUI';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Visualizer } from '@/components/Visualizer';
import { useGeneration } from '@/lib/music/useGeneration';
import type { AlgorithmName } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { arrange } from '@/lib/music/arranger';

export default function App() {
  const { status, progress, output, generate, cancel, error } = useGeneration();
  const [lastOutput, setLastOutput] = React.useState(output ?? null);
  const [autoPlayToken, setAutoPlayToken] = React.useState(0);

  const onGenerate = async ({ algorithm, params }: { algorithm: AlgorithmName; params: GenerationParams }) => {
    try {
      const out = await generate(algorithm, params);
      const enriched = arrange(params, out);
      setLastOutput(enriched);
    } catch {
      /* cancelled or error */
    }
  };

  const onGenerateAndPlay = async ({ algorithm, params }: { algorithm: AlgorithmName; params: GenerationParams }) => {
    await onGenerate({ algorithm, params });
    setAutoPlayToken((x) => x + 1);
  };

  const playDemo = () => {
    const demo: { algorithm: AlgorithmName; params: GenerationParams } = {
      algorithm: 'euclidean',
      params: { seed: 42, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 8, density: 0.6 },
    };
    void onGenerateAndPlay(demo);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Algorithmic Music MVP</h1>
      <div style={{ margin: '12px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
        <strong>Hear it now:</strong>
        <button type="button" style={{ marginLeft: 8 }} onClick={playDemo}>Play Demo</button>
      </div>
      <div aria-label="gen-status">{status} ({progress}%)</div>
      {error && <div role="alert">{String(error)}</div>}
      {status === 'generating' && (
        <button type="button" onClick={cancel}>Cancel</button>
      )}

      <GeneratorUI onGenerate={onGenerate} />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={() => {
          const params: GenerationParams = { seed: 1, bpm: 128, key: 'C', timeSignature: '4/4', durationSecs: 8, density: 0.6 };
          void onGenerateAndPlay({ algorithm: 'euclidean', params });
        }}>Generate & Play</button>
      </div>

      {lastOutput && <PlaybackControls output={lastOutput} autoPlayToken={autoPlayToken} />}
      <Visualizer />
    </div>
  );
}
