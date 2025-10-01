import React from 'react';
import { GeneratorUI } from '@/components/GeneratorUI';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Visualizer } from '@/components/Visualizer';
import { useGeneration } from '@/lib/music/useGeneration';
import type { AlgorithmName } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';

export default function App() {
  const { status, progress, output, generate, cancel, error } = useGeneration();
  const [lastOutput, setLastOutput] = React.useState(output ?? null);

  const onGenerate = async ({ algorithm, params }: { algorithm: AlgorithmName; params: GenerationParams }) => {
    try {
      const out = await generate(algorithm, params);
      setLastOutput(out);
    } catch {
      /* cancelled or error */
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Algorithmic Music MVP</h1>
      <div aria-label="gen-status">{status} ({progress}%)</div>
      {error && <div role="alert">{String(error)}</div>}
      {status === 'generating' && (
        <button type="button" onClick={cancel}>Cancel</button>
      )}

      <GeneratorUI onGenerate={onGenerate} />

      {lastOutput && <PlaybackControls output={lastOutput} />}
      <Visualizer />
    </div>
  );
}
