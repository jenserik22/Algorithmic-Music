/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';
import { loadMapping, findSfName, type ChannelConfig } from '@/lib/midi/mapping';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

// Lazy import to avoid bundling unless used
async function loadSoundfont() {
  const mod = await import('soundfont-player');
  return mod.default || (mod as any);
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class SfPlayer {
  private ctx: AudioContext | null = null;
  private status_: PlayerStatus = 'stopped';
  private instrumentCache = new Map<string, any>(); // key: ch-<n> or prog-<n>
  private scheduled: Array<() => void> = [];

  status(): PlayerStatus { return this.status_; }

  private async ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignore */ }
    }
  }

  private async loadInstrumentFor(cfg: ChannelConfig) {
    const key = (cfg.isPercussion || cfg.channel === 10) ? 'perc' : `prog-${cfg.program}`;
    if (this.instrumentCache.has(key)) return this.instrumentCache.get(key);
    const Soundfont = await loadSoundfont();
    if (key === 'perc') {
      // percussion kit name for FluidR3
      const inst = await Soundfont.instrument(this.ctx!, 'standard_kit' as any, {
        soundfont: 'FluidR3_GM',
        nameToUrl: (name: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-mp3.js`,
      }).catch((_e: any) => null);
      this.instrumentCache.set(key, inst);
      return inst;
    }
    const sfName = findSfName(cfg.program) || 'acoustic_grand_piano';
    const inst = await Soundfont.instrument(this.ctx!, sfName as any, {
      soundfont: 'FluidR3_GM',
      nameToUrl: (name: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-mp3.js`,
    }).catch((_e: any) => null);
    this.instrumentCache.set(key, inst);
    return inst;
  }

  private scheduleNote(inst: any, timeSec: number, midi: number, dur: number, vel: number, pan = 0, gain = 1) {
    if (!this.ctx || !inst) return;
    const t = this.ctx.currentTime + timeSec + 0.05; // slight buffer
    // build a small chain with gain + stereo panner
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, gain)) * vel;
    const panner = (this.ctx as any).createStereoPanner ? (this.ctx as any).createStereoPanner() : null;
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, pan));
    const dest = panner ? panner : gainNode;
    if (panner) panner.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    const node = inst.play(midi, t, { duration: Math.max(0.05, dur) });
    try {
      (node as any).connect?.(dest);
    } catch { /* ignore */ }
    this.scheduled.push(() => {
      try { (node as any).stop?.(); } catch { /* ignore */ }
      try { gainNode.disconnect(); } catch { /* ignore */ }
      try { panner?.disconnect(); } catch { /* ignore */ }
    });
  }

  private scheduleDrum(timeSec: number, code: number, vel: number, dur: number, pan = 0, gain = 1) {
    if (!this.ctx) return;
    // lightweight noise-based drum fallback
    const t = this.ctx.currentTime + timeSec + 0.02;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noise.buffer = buffer;
    const gainNode = this.ctx.createGain();
    const isKick = code === 36;
    gainNode.gain.value = (isKick ? 0.9 : 0.4) * vel * gain;
    const panner = (this.ctx as any).createStereoPanner ? (this.ctx as any).createStereoPanner() : null;
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, pan));
    const filter = this.ctx.createBiquadFilter();
    filter.type = isKick ? 'lowpass' : 'highpass';
    filter.frequency.value = isKick ? 200 : 6000;
    noise.connect(filter);
    filter.connect(panner || gainNode);
    if (panner) panner.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + Math.max(0.02, Math.min(0.25, dur)));
    this.scheduled.push(() => {
      try { noise.disconnect(); filter.disconnect(); gainNode.disconnect(); panner?.disconnect(); } catch { /* */ }
    });
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    await this.ensureCtx();
    const ctx = this.ctx!;
    const mapping = loadMapping();
    this.stop();

    // Prepare instruments in parallel
    await Promise.all(mapping.channels.map((c) => this.loadInstrumentFor(c)));

    const events = [...out.events].sort((a, b) => a.time - b.time);
    const endTime = events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
    const startAt = 0; // schedule relative to now with buffer inside scheduleNote

    // For each channel mapping, schedule the source track events
    for (const ch of mapping.channels) {
      const inst = (ch.isPercussion || ch.channel === 10) ? null : await this.loadInstrumentFor(ch);
      const evs = events.filter((e) => (e.track || 'lead') === ch.source);
      for (const ev of evs) {
        const midi = Math.max(0, Math.min(127, Math.round((ev.pitch || 0) + (ch.transpose || 0))));
        const dur = Math.max(0.05, ev.duration || 0.25);
        const vel = Math.max(0, Math.min(1, ev.velocity ?? 0.8));
        if (ch.isPercussion || ch.channel === 10 || ch.source === 'drums') {
          const code = ev.pitch | 0;
          this.scheduleDrum(startAt + ev.time, code, vel, dur, ch.pan ?? 0, ch.volume ?? 1);
        } else {
          this.scheduleNote(inst, startAt + ev.time, midiToFreq(midi), dur, vel, ch.pan ?? 0, ch.volume ?? 1);
        }
      }
    }

    // set end timeout
    const endId = setTimeout(() => {
      this.stop();
      onEnd?.();
    }, (startAt + endTime + 0.2) * 1000);
    this.scheduled.push(() => clearTimeout(endId));
    this.status_ = 'playing';
  }

  pause() {
    if (!this.ctx) return;
    try { this.ctx.suspend(); } catch { /* ignore */ }
    this.status_ = 'paused';
  }

  stop() {
    for (const fn of this.scheduled) {
      try { fn(); } catch { /* ignore */ }
    }
    this.scheduled = [];
    this.status_ = 'stopped';
  }
}
