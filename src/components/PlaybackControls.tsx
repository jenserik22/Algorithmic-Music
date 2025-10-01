import React from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { WebAudioPlayer } from '@/lib/audio/webAudioPlayer';

export function PlaybackControls({ output }: { output: EngineOutput | null }) {
  const [status, setStatus] = React.useState<'stopped'|'playing'|'paused'>('stopped');
  const playerRef = React.useRef<WebAudioPlayer>(new WebAudioPlayer());

  const onPlay = () => {
    if (!output) return;
    playerRef.current.play(output, () => setStatus('stopped'));
    setStatus('playing');
  };
  const onPause = () => { playerRef.current.pause(); setStatus('paused'); };
  const onStop = () => { playerRef.current.stop(); setStatus('stopped'); };

  return (
    <div>
      <div aria-label="playback-status">{status}</div>
      <button onClick={onPlay} disabled={!output}>Play</button>
      <button onClick={onPause} disabled={status !== 'playing'}>Pause</button>
      <button onClick={onStop} disabled={status === 'stopped'}>Stop</button>
    </div>
  );
}
