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
import { SunIcon, MoonIcon, MusicIcon, SettingsIcon, FolderIcon, ExclamationIcon, ChartBarIcon, RocketIcon, DownloadIcon } from '@/components/icons';
import { AudioExporter } from '@/components/AudioExporter';

export default function App() {
  useIdlePreload();
  const { status, progress, output, generate, cancel, error } = useGeneration();
  const [lastOutput, setLastOutput] = React.useState(output ?? null);
  const [autoPlayToken, setAutoPlayToken] = React.useState(0);
  const [showEdu, setShowEdu] = React.useState(false);
  const [showProcess, setShowProcess] = React.useState(false);
  const [lastAlgo, setLastAlgo] = React.useState<AlgorithmName | null>(null);
  const [lastParams, setLastParams] = React.useState<GenerationParams | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

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

  const quickGenerate = () => {
    const params: GenerationParams = { seed: 1, bpm: 128, key: 'C', timeSignature: '4/4', durationSecs: 8, density: 0.6 };
    void onGenerateAndPlay({ algorithm: 'euclidean', params });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Algorithmic Music Generator
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-lg transition-colors shadow-sm border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Toggle theme"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Quick Start Banner */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold">🎵 Quick Start:</span>
              <button 
                onClick={playDemo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Play Demo
              </button>
              <TrendingBadge />
              <button 
                onClick={() => setShowEdu(true)}
                className={`px-3 py-1 text-sm rounded ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                What's this?
              </button>
            </div>
          </div>
        </header>

        {/* Generation Status */}
        {(status !== 'idle' || error) && (
          <div className={`mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Status: {status} {status === 'generating' && `(${progress}%)`}
                </span>
                {status === 'generating' && (
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              {status === 'generating' && (
                <button 
                  onClick={cancel}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <ErrorBanner error={error} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Generation Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <SettingsIcon className="w-5 h-5" />
                Generator Controls
              </h2>
              <GeneratorUI onGenerate={onGenerate} />
            </div>

            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <FolderIcon className="w-5 h-5" />
                Presets & Settings
              </h2>
              <PresetManager
                current={lastAlgo && lastParams ? { algorithm: lastAlgo, params: lastParams } : null}
                onApply={(s: Settings) => {
                  const p = toParams(s);
                  void onGenerateAndPlay({ algorithm: s.algorithm as AlgorithmName, params: p });
                }}
              />
            </div>

            {/* Advanced Options */}
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <SettingsIcon className="w-4 h-4" />
                Advanced Options
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={showProcess} 
                    onChange={e => setShowProcess(e.target.checked)}
                    className="rounded"
                  />
                  Show algorithm process visualization
                </label>
                <button 
                  onClick={quickGenerate}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RocketIcon className="w-4 h-4" />
                  Quick Generate & Play
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Playback & Visualization */}
          <div className="space-y-6">
            {/* Playback Controls */}
            {lastOutput && (
              <div className={`p-6 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <MusicIcon className="w-5 h-5" />
                  Playback
                </h2>
                <PlaybackControls output={lastOutput} autoPlayToken={autoPlayToken} />
              </div>
            )}

            {/* Export Controls */}
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <DownloadIcon className="w-5 h-5" />
                Export Music
              </h2>
              <AudioExporter output={lastOutput} />
            </div>

            {/* Visualizer */}
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <ChartBarIcon className="w-5 h-5" />
                Audio Visualizer
              </h2>
              <Visualizer />
            </div>

            {/* Performance Warnings */}
            <div className={`p-6 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <ExclamationIcon className="w-5 h-5" />
                System Info
              </h2>
              <PerfWarnings />
            </div>
          </div>
        </div>

        {/* Process Panel (Full Width) */}
        <ProcessPanel 
          visible={showProcess} 
          output={lastOutput ?? undefined} 
          algorithm={lastAlgo ?? undefined} 
          params={lastParams ?? undefined} 
        />

        {/* Education Modal */}
        <EducationModal open={showEdu} onClose={() => setShowEdu(false)} />
      </div>
    </div>
  );
}