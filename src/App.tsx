import React from 'react';
import { GeneratorUI } from '@/components/GeneratorUI';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Visualizer } from '@/components/Visualizer';
import { EducationModal } from '@/components/EducationModal';
import { ProcessPanel } from '@/components/ProcessPanel';
import { PresetManager } from '@/components/PresetManager';
import { PerfWarnings } from '@/components/PerfWarnings';
import { toParams, type Settings } from '@/lib/export/settings';
import { useGeneration } from '@/lib/music/useGeneration';
import type { AlgorithmName } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { arrange } from '@/lib/music/arranger';
import { refineArrangementWithMagenta } from '@/lib/music/ml/magenta';
import { TrendingBadge } from '@/components/Trending';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useIdlePreload } from '@/lib/utils/useIdlePreload';

export default function App() {
  useIdlePreload();
  const { status, progress, output, generate, cancel, error } = useGeneration();
  const [lastOutput, setLastOutput] = React.useState(output ?? null);
  const [autoPlayToken, setAutoPlayToken] = React.useState(0);
  const [showEdu, setShowEdu] = React.useState(false);
  const [showProcess, setShowProcess] = React.useState(false);
  const [lastAlgo, setLastAlgo] = React.useState<AlgorithmName | null>(null);
  const [lastParams, setLastParams] = React.useState<GenerationParams | null>(null);

  const onGenerate = async ({ algorithm, params }: { algorithm: AlgorithmName; params: GenerationParams }) => {
    try {
      const out = await generate(algorithm, params);
      const enriched = arrange(params, out);
      setLastOutput(enriched);
      setLastAlgo(algorithm);
      setLastParams(params);
      // Try AI refinement in background for more realism/variation
      refineArrangementWithMagenta(params, enriched)
        .then(refined => setLastOutput(refined))
        .catch(() => {/* ignore */});
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
        <TrendingBadge />
        <button type="button" style={{ marginLeft: 8 }} onClick={() => setShowEdu(true)}>What’s this?</button>
      </div>
      <div aria-label="gen-status">{status} ({progress}%)</div>
      <ErrorBanner error={error} />
      {status === 'generating' && (
        <button type="button" onClick={cancel}>Cancel</button>
      )}

      <GeneratorUI onGenerate={onGenerate} />
      <PresetManager
        current={lastAlgo && lastParams ? { algorithm: lastAlgo, params: lastParams } : null}
        onApply={(s: Settings) => {
          const p = toParams(s);
          void onGenerateAndPlay({ algorithm: s.algorithm as AlgorithmName, params: p });
        }}
      />
      <PerfWarnings />
      <div style={{ marginTop: 8 }}>
        <label>
          <input type="checkbox" checked={showProcess} onChange={e => setShowProcess(e.target.checked)} /> Show process
        </label>
      </div>
      <ProcessPanel visible={showProcess} output={lastOutput ?? undefined} algorithm={lastAlgo ?? undefined} params={lastParams ?? undefined} />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={() => {
          const params: GenerationParams = { seed: 1, bpm: 128, key: 'C', timeSignature: '4/4', durationSecs: 8, density: 0.6 };
          void onGenerateAndPlay({ algorithm: 'euclidean', params });
        }}>Generate & Play</button>
      </div>

      {lastOutput && <PlaybackControls output={lastOutput} autoPlayToken={autoPlayToken} />}
      <Visualizer />
      <EducationModal open={showEdu} onClose={() => setShowEdu(false)} />
    </div>
  );
}
