import React from 'react';
import { ChartBarIcon, WaveIcon } from '@/components/icons';

type Mode = 'bars' | 'spectrum';

export function Visualizer() {
  const [mode, setMode] = React.useState<Mode>('bars');
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1" role="group" aria-label="Visualizer Mode">
        <button 
          aria-pressed={mode==='bars'} 
          onClick={() => setMode('bars')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === 'bars'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ChartBarIcon className="w-4 h-4" />
          Bars
        </button>
        <button 
          aria-pressed={mode==='spectrum'} 
          onClick={() => setMode('spectrum')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === 'spectrum'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <WaveIcon className="w-4 h-4" />
          Spectrum
        </button>
      </div>

      {/* Current Mode Display */}
      <div className="text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Current mode: {mode}
        </span>
      </div>

      {/* Visualizer Canvas */}
      <div className="bg-black dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <canvas 
          ref={canvasRef}
          aria-label="visualizer-canvas" 
          width={300} 
          height={120}
          className="w-full h-30 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded"
        />
      </div>
    </div>
  );
}
