import type { EngineOutput } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

export class Player {
  private _status: PlayerStatus = 'stopped';
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _onEnd?: () => void;

  status() { return this._status; }

  play(out: EngineOutput, onEnd?: () => void) {
    this.stop();
    this._status = 'playing';
    this._onEnd = onEnd;
    const last = out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
    this._timer = setTimeout(() => {
      this._status = 'stopped';
      if (this._onEnd) this._onEnd();
    }, Math.max(1, Math.floor(last * 1000)));
  }

  pause() {
    if (this._status !== 'playing') return;
    this._status = 'paused';
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  stop() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._status = 'stopped';
  }
}
