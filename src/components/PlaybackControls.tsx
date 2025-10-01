import React from 'react';
import type { EngineOutput } from '@/lib/music/engines/types';
import { WebAudioPlayer } from '@/lib/audio/webAudioPlayer';
import { TonePlayer } from '@/lib/audio/tonePlayer';

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
    <div>
      <div aria-label="playback-status">{status}</div>
      <button onClick={onPlay} disabled={!output}>Play</button>
      <button onClick={onPause} disabled={status !== 'playing'}>Pause</button>
      <button onClick={onStop} disabled={status === 'stopped'}>Stop</button>
    </div>
  );
}
