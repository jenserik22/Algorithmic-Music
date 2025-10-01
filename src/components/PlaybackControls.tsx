import React from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { WebAudioPlayer } from '@/lib/audio/webAudioPlayer';
import { TonePlayer } from '@/lib/audio/tonePlayer';
import { PlayIcon, PauseIcon, StopIcon } from '@/components/icons';

export function PlaybackControls({ output, autoPlayToken }: { output: EngineOutput | null; autoPlayToken?: number }) {
  const [status, setStatus] = React.useState<'stopped'|'playing'|'paused'>('stopped');
  const playerRef = React.useRef<WebAudioPlayer | TonePlayer | null>(null);

  React.useEffect(() => {
    // prefer Tone when available; fallback to WebAudio
    try {
      playerRef.current = new TonePlayer();
    } catch {
      playerRef.current = new WebAudioPlayer();
    }
  }, []);

  const onPlay = () => {
    if (!output || !playerRef.current) return;
    setStatus('playing');
    Promise.resolve()
      .then(() => (playerRef.current as any).play(output, () => setStatus('stopped')))
      .catch(() => {
        // fallback
        playerRef.current = new WebAudioPlayer();
        playerRef.current.play(output, () => setStatus('stopped'));
      });
  };
  const onPause = () => { playerRef.current?.pause?.(); setStatus('paused'); };
  const onStop = () => { playerRef.current?.stop(); setStatus('stopped'); };

  React.useEffect(() => {
    if (!autoPlayToken || !output) return;
    onPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayToken, output]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 ${
          status === 'playing' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
          status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        }`}>
          {status === 'playing' && <PlayIcon className="w-3 h-3" />}
          {status === 'paused' && <PauseIcon className="w-3 h-3" />}
          {status === 'stopped' && <StopIcon className="w-3 h-3" />}
          {status}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onPlay} 
          disabled={!output}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          <PlayIcon className="w-4 h-4" />
          Play
        </button>
        <button 
          onClick={onPause} 
          disabled={status !== 'playing'}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          <PauseIcon className="w-4 h-4" />
          Pause
        </button>
        <button 
          onClick={onStop} 
          disabled={status === 'stopped'}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          <StopIcon className="w-4 h-4" />
          Stop
        </button>
      </div>
    </div>
  );
}
