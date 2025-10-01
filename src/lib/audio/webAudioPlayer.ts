import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

type ScheduledNode = { stop: () => void };

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class WebAudioPlayer {
  private _status: PlayerStatus = 'stopped';
  private ctx: (AudioContext & { resume: () => Promise<void>; suspend: () => Promise<void> }) | null = null;
  private master: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private wetBus: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private scheduled: ScheduledNode[] = [];
  private timerFallback: ReturnType<typeof setTimeout> | null = null;
  private usingTimer = false;
  private onEnd?: () => void;

  constructor() {
    if (typeof window === 'undefined') {
      this.usingTimer = true;
      return;
    }
    const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC: typeof AudioContext | undefined = g.AudioContext ?? g.webkitAudioContext;
    if (!AC) {
      this.usingTimer = true;
      return;
    }
    try {
      this.ctx = new AC();
      // Master chain: (dry + reverb wet) -> compressor -> destination
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.dryBus = this.ctx.createGain();
      this.dryBus.gain.value = 0.9;
      this.dryBus.connect(this.master);

      this.wetBus = this.ctx.createGain();
      this.wetBus.gain.value = 0.25;
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.makeImpulse(this.ctx, 2.0, 2.5);
      this.convolver.connect(this.wetBus);
      this.wetBus.connect(this.master);
    } catch (_e) {
      this.usingTimer = true;
    }
  }

  private makeImpulse(ctx: BaseAudioContext, seconds = 2, decay = 2): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(seconds * rate));
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const chData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        chData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  status(): PlayerStatus {
    return this._status;
  }

  private clearScheduled() {
    for (const n of this.scheduled) {
      try { n.stop(); } catch (_e) { /* ignore */ }
    }
    this.scheduled = [];
  }

  private scheduleVoice(ev: NoteEvent, startAt: number) {
    const ctx = this.ctx!;
    const track = ev.track || 'lead';
    const dry = this.dryBus!;
    const conv = this.convolver!;

    // Build per-note chain
    const sourceG = ctx.createGain();
    sourceG.gain.setValueAtTime(0, startAt + ev.time);

    // Envelope settings per track
    let atk = 0.01, rel = Math.min(0.2, Math.max(0.05, ev.duration * 0.3));
    if (track === 'chords') { atk = 0.02; rel = Math.max(0.4, ev.duration * 0.5); }
    if (track === 'bass') { atk = 0.005; rel = Math.min(0.15, ev.duration * 0.25); }

    const peak = Math.min(1, Math.max(0, ev.velocity ?? 0.8));
    sourceG.gain.linearRampToValueAtTime(peak, startAt + ev.time + atk);
    sourceG.gain.setValueAtTime(peak, startAt + ev.time + Math.max(0, ev.duration - rel));
    sourceG.gain.linearRampToValueAtTime(0, startAt + ev.time + ev.duration);

    // Route to dry and reverb
    sourceG.connect(dry);
    sourceG.connect(conv);

    const stopFns: Array<() => void> = [];

    const addOsc = (type: OscillatorType, freq: number, detuneCents = 0) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      if (detuneCents) osc.detune.value = detuneCents;
      osc.connect(sourceG);
      const s = startAt + ev.time;
      const e = s + ev.duration;
      try { osc.start(s); osc.stop(e); } catch (_e) { /* ignore */ }
      stopFns.push(() => { try { osc.stop(); } catch (_e) { /* ignore */ } try { osc.disconnect(); } catch (_e) { /* ignore */ } });
    };

    if (track === 'chords') {
      // Detuned saws for warmth
      const f = midiToFreq(ev.pitch);
      addOsc('sawtooth', f, -6);
      addOsc('sawtooth', f, +6);
    } else if (track === 'bass') {
      const f = midiToFreq(ev.pitch);
      addOsc('square', f);
    } else if (track === 'lead') {
      const f = midiToFreq(ev.pitch);
      addOsc('triangle', f);
    } else if (track === 'drums') {
      // Map GM: 36 kick, 38 snare, 42 hat
      const code = ev.pitch | 0;
      if (code === 36) {
        // Kick: decaying sine with pitch drop
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const f = osc.frequency;
        const s = startAt + ev.time;
        const e = s + Math.max(0.05, ev.duration);
        f.setValueAtTime(120, s);
        f.exponentialRampToValueAtTime(50, e);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(peak, s + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, e);
        osc.connect(g).connect(dry);
        osc.connect(g).connect(conv);
        try { osc.start(s); osc.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { osc.stop(); } catch (_e) { /* ignore */ } try { osc.disconnect(); } catch (_e) { /* ignore */ } try { g.disconnect(); } catch (_e) { /* ignore */ } });
      } else if (code === 38) {
        // Snare: noise burst + body tone
        const s = startAt + ev.time;
        const e = s + Math.max(0.05, ev.duration);
        const noiseBuf = ctx.createBuffer(1, Math.floor(0.2 * ctx.sampleRate), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hg = ctx.createBiquadFilter();
        hg.type = 'highpass';
        hg.frequency.value = 1000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, s);
        ng.gain.linearRampToValueAtTime(peak * 0.7, s + 0.002);
        ng.gain.exponentialRampToValueAtTime(0.0001, e);
        noise.connect(hg).connect(ng).connect(dry);
        noise.connect(hg).connect(ng).connect(conv);
        try { noise.start(s); noise.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { noise.stop(); } catch (_e) { /* ignore */ } try { noise.disconnect(); } catch (_e) { /* ignore */ } try { ng.disconnect(); } catch (_e) { /* ignore */ } });

        const body = ctx.createOscillator();
        body.type = 'triangle';
        const bf = body.frequency;
        bf.setValueAtTime(180, s);
        bf.exponentialRampToValueAtTime(140, e);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0, s);
        bg.gain.linearRampToValueAtTime(peak * 0.3, s + 0.002);
        bg.gain.exponentialRampToValueAtTime(0.0001, e);
        body.connect(bg).connect(dry);
        body.connect(bg).connect(conv);
        try { body.start(s); body.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { body.stop(); } catch (_e) { /* ignore */ } try { body.disconnect(); } catch (_e) { /* ignore */ } try { bg.disconnect(); } catch (_e) { /* ignore */ } });
      } else {
        // Hat: filtered noise ping
        const s = startAt + ev.time;
        const e = s + Math.max(0.02, ev.duration);
        const noiseBuf = ctx.createBuffer(1, Math.floor(0.1 * ctx.sampleRate), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, s);
        ng.gain.linearRampToValueAtTime(peak * 0.4, s + 0.002);
        ng.gain.exponentialRampToValueAtTime(0.0001, e);
        noise.connect(hp).connect(ng).connect(dry);
        try { noise.start(s); noise.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { noise.stop(); } catch (_e) { /* ignore */ } try { noise.disconnect(); } catch (_e) { /* ignore */ } try { ng.disconnect(); } catch (_e) { /* ignore */ } });
      }
    } else if (track === 'fx') {
      const code = ev.pitch | 0;
      const s = startAt + ev.time;
      const e = s + Math.max(0.2, ev.duration);
      if (code === 49) {
        // Crash: bright noise burst through highpass
        const noiseBuf = ctx.createBuffer(1, Math.floor(1.2 * ctx.sampleRate), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, s);
        ng.gain.linearRampToValueAtTime(peak, s + 0.01);
        ng.gain.exponentialRampToValueAtTime(0.0001, e);
        noise.connect(hp).connect(ng).connect(dry);
        try { noise.start(s); noise.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { noise.stop(); } catch (_e) {} try { noise.disconnect(); } catch (_e) {} });
      } else {
        // Riser: noise with opening lowpass sweep
        const noiseBuf = ctx.createBuffer(1, Math.floor(ev.duration * ctx.sampleRate), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuf;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, s); lp.frequency.exponentialRampToValueAtTime(8000, e);
        const ng = ctx.createGain(); ng.gain.setValueAtTime(0.05, s); ng.gain.linearRampToValueAtTime(peak * 0.6, e);
        noise.connect(lp).connect(ng).connect(dry);
        try { noise.start(s); noise.stop(e); } catch (_e) { /* ignore */ }
        stopFns.push(() => { try { noise.stop(); } catch (_e) {} try { noise.disconnect(); } catch (_e) {} });
      }
    }

    // Ensure we clear source gate
    stopFns.push(() => { try { sourceG.disconnect(); } catch (_e) { /* ignore */ } });
    this.scheduled.push({ stop: () => { for (const fn of stopFns) fn(); } });
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
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (_e) { /* ignore */ }
    }
    this._status = 'playing';
    const lag = 0.05; // schedule slightly ahead
    const startAt = ctx.currentTime + lag;

    for (const ev of out.events) this.scheduleVoice(ev, startAt);

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
    try { await ctx.suspend(); } catch (_e) { /* ignore */ }
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
