import React from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { WebAudioPlayer } from '@/lib/audio/webAudioPlayer';
import { TonePlayer } from '@/lib/audio/tonePlayer';
import { SfPlayer } from '@/lib/audio/sfPlayer';
import { loadMapping, saveMapping } from '@/lib/midi/mapping';
import { ChannelManager } from '@/components/ChannelManager';
import { PlayIcon, PauseIcon, StopIcon } from '@/components/icons';
import { memoryManager } from '@/lib/utils/memoryManager';

export function PlaybackControls({ output, autoPlayToken, onPlaybackStateChange }: { 
  output: EngineOutput | null; 
  autoPlayToken?: number;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}) {
  const [status, setStatus] = React.useState<'stopped'|'playing'|'paused'>('stopped');
  const [engine, setEngine] = React.useState<'tone'|'sf'>(() => loadMapping().engine);
  const [showChMgr, setShowChMgr] = React.useState(false);
  const playerRef = React.useRef<WebAudioPlayer | TonePlayer | SfPlayer | null>(null);

  React.useEffect(() => {
    // instantiate based on selected engine
    try {
      if (engine === 'sf') {
        playerRef.current = new SfPlayer();
      } else {
        playerRef.current = new TonePlayer();
      }
    } catch {
      playerRef.current = new WebAudioPlayer();
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.stop();
          // Note: TonePlayer and WebAudioPlayer don't have explicit dispose methods
          // but stopping them releases most resources
        } catch (error) {
          console.warn('[PlaybackControls] Cleanup error:', error);
        } finally {
          playerRef.current = null;
        }
      }
    };
  }, [engine]);

  // Persist engine in mapping store
  React.useEffect(() => {
    const s = loadMapping();
    if (s.engine !== engine) {
      saveMapping({ ...s, engine });
    }
  }, [engine]);

  const onPlay = () => {
    if (!output || !playerRef.current) return;
    setStatus('playing');
    onPlaybackStateChange?.(true);
    Promise.resolve()
      .then(() => (playerRef.current as any).play(output, () => {
        setStatus('stopped');
        onPlaybackStateChange?.(false);
      }))
      .catch((error) => {
        console.warn('[PlaybackControls] Playback failed, trying fallback:', error);
        // fallback: if Tone failed and we were using Tone, try SoundFont; otherwise WebAudio
        try {
          if (engine === 'tone') {
            playerRef.current = new SfPlayer();
          } else {
            playerRef.current = new WebAudioPlayer();
          }
          playerRef.current.play(output, () => {
            setStatus('stopped');
            onPlaybackStateChange?.(false);
          });
        } catch (fallbackError) {
          console.error('[PlaybackControls] Fallback also failed:', fallbackError);
          setStatus('stopped');
          onPlaybackStateChange?.(false);
        }
      });
  };
  const onPause = () => { 
    playerRef.current?.pause?.(); 
    setStatus('paused'); 
    onPlaybackStateChange?.(false);
  };
  const onStop = () => { 
    playerRef.current?.stop(); 
    setStatus('stopped'); 
    onPlaybackStateChange?.(false);
  };

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
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs opacity-75">Engine</label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as any)}
            className="px-2 py-1 rounded border text-xs bg-white dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="tone">Tone Synth</option>
            <option value="sf">MIDI (SoundFont)</option>
          </select>
          <button
            onClick={() => setShowChMgr(v => !v)}
            className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Channels
          </button>
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

      {showChMgr && (
        <div className="mt-2">
          <ChannelManager />
        </div>
      )}
    </div>
  );
}
