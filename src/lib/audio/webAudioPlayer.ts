import type { EngineOutput } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

type ScheduledNode = { osc: OscillatorNode; gain: GainNode; start: number; end: number };

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class WebAudioPlayer {
  private _status: PlayerStatus = 'stopped';
  private ctx: (AudioContext & { resume: () => Promise<void>; suspend: () => Promise<void> }) | null = null;
  private master: GainNode | null = null;
  private scheduled: ScheduledNode[] = [];
  private timerFallback: ReturnType<typeof setTimeout> | null = null;
  private usingTimer = false;
  private onEnd?: () => void;

  constructor() {
    if (typeof window === 'undefined') {
      this.usingTimer = true;
      return;
    }
    const AC: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) {
      this.usingTimer = true;
      return;
    }
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.2; // modest default volume
      this.master.connect(this.ctx.destination);
    } catch {
      this.usingTimer = true;
    }
  }

  status(): PlayerStatus {
    return this._status;
  }

  private clearScheduled() {
    for (const n of this.scheduled) {
      try { n.osc.stop(); } catch {}
      try { n.osc.disconnect(); } catch {}
      try { n.gain.disconnect(); } catch {}
    }
    this.scheduled = [];
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    this.stop();
    this.onEnd = onEnd;
    if (this.usingTimer) {
      this._status = 'playing';
      // approximate total
      const total = out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
      this.timerFallback = setTimeout(() => {
        this._status = 'stopped';
        if (this.onEnd) this.onEnd();
      }, Math.max(1, Math.floor(total * 1000)));
      return;
    }
    const ctx = this.ctx!;
    const master = this.master!;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch {}
    }
    this._status = 'playing';
    const lag = 0.05; // schedule slightly ahead
    const startAt = ctx.currentTime + lag;

    for (const ev of out.events) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = midiToFreq(ev.pitch);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, startAt + ev.time);
      // simple envelope
      const atk = 0.005;
      const rel = Math.min(0.1, Math.max(0.02, ev.duration * 0.2));
      g.gain.linearRampToValueAtTime(ev.velocity ?? 0.8, startAt + ev.time + atk);
      g.gain.setValueAtTime(ev.velocity ?? 0.8, startAt + ev.time + Math.max(0, ev.duration - rel));
      g.gain.linearRampToValueAtTime(0, startAt + ev.time + ev.duration);
      osc.connect(g).connect(master);
      const s = startAt + ev.time;
      const e = s + ev.duration;
      try {
        osc.start(s);
        osc.stop(e);
      } catch {}
      this.scheduled.push({ osc, gain: g, start: s, end: e });
    }

    // signal end via timer based on last event end
    const endAt = out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0) + lag;
    this.timerFallback = setTimeout(() => {
      if (this._status !== 'playing') return;
      this._status = 'stopped';
      this.clearScheduled();
      if (this.onEnd) this.onEnd();
    }, Math.max(1, Math.floor(endAt * 1000)));
  }

  async pause() {
    if (this._status !== 'playing') return;
    if (this.usingTimer) {
      if (this.timerFallback) clearTimeout(this.timerFallback);
      this.timerFallback = null;
      this._status = 'paused';
      return;
    }
    const ctx = this.ctx!;
    try { await ctx.suspend(); } catch {}
    this._status = 'paused';
  }

  stop() {
    if (this.usingTimer) {
      if (this.timerFallback) clearTimeout(this.timerFallback);
      this.timerFallback = null;
      this._status = 'stopped';
      return;
    }
    this.clearScheduled();
    if (this.timerFallback) clearTimeout(this.timerFallback);
    this.timerFallback = null;
    this._status = 'stopped';
  }
}
