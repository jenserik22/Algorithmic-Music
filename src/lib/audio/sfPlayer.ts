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
  private instrumentCache = new Map<string, any>(); // key: channel id
  private channelNodes = new Map<string, { filter: BiquadFilterNode | null; panner: StereoPannerNode | null; gain: GainNode }>();
  private scheduled: Array<() => void> = [];
  private noiseBuf: AudioBuffer | null = null;
  private masterComp: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices = new Map<string, Array<() => void>>(); // per-channel voice stop handlers

  // Scheduling/lookahead
  private static readonly LOOKAHEAD_S = 0.2; // 200ms lookahead to reduce jitter
  private static readonly MAX_POLYPHONY = 16; // per channel

  status(): PlayerStatus { return this.status_; }

  private async ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignore */ }
    }
    // Ensure master bus
    if (this.ctx && !this.masterComp) {
      const g = this.ctx.createGain();
      g.gain.value = 0.95; // small headroom
      const c = this.ctx.createDynamicsCompressor();
      // Soft limiter style
      c.threshold.value = -24;
      c.knee.value = 30;
      c.ratio.value = 12;
      c.attack.value = 0.003;
      c.release.value = 0.25;
      g.connect(c).connect(this.ctx.destination);
      this.masterGain = g;
      this.masterComp = c;
    }
  }

  private async loadInstrumentFor(cfg: ChannelConfig) {
    const key = cfg.id; // dedicate instrument per channel to allow independent pan/vol
    if (this.instrumentCache.has(key)) return this.instrumentCache.get(key);
    const Soundfont = await loadSoundfont();
    if (cfg.isPercussion || cfg.channel === 10 || cfg.source === 'drums') {
      // Avoid CDN 404s: synthesize drums locally instead of fetching kits
      const inst = { __drumSynth: true } as any;
      this.setupChannelNodes(key, cfg, null);
      this.instrumentCache.set(key, inst);
      return inst;
    }
    const sfName = findSfName(cfg.program) || 'acoustic_grand_piano';
    // Try FluidR3 first, then MusyngKite for the same name, then a few fallbacks across packs
    let inst = await Soundfont.instrument(this.ctx!, sfName as any, {
      soundfont: 'FluidR3_GM',
      nameToUrl: (name: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-mp3.js`,
    }).catch((_e: any) => null);
    if (!inst) {
      inst = await Soundfont.instrument(this.ctx!, sfName as any, {
        soundfont: 'MusyngKite',
        nameToUrl: (name: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-mp3.js`,
      }).catch((_e: any) => null);
    }
    if (!inst) {
      const fallbacks = [
        ['FluidR3_GM','acoustic_grand_piano'],
        ['MusyngKite','acoustic_grand_piano'],
        ['FluidR3_GM','electric_piano_1'],
        ['MusyngKite','pad_2_warm'],
        ['FluidR3_GM','violin'],
      ] as const;
      for (const [pack, name] of fallbacks) {
        inst = await Soundfont.instrument(this.ctx!, name as any, {
          soundfont: pack,
          nameToUrl: (n: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${n}-mp3.js`,
        }).catch(() => null);
        if (inst) break;
      }
    }
    if (inst) this.setupChannelNodes(key, cfg, inst);
    this.instrumentCache.set(key, inst);
    return inst;
  }

  private setupChannelNodes(key: string, cfg: ChannelConfig, inst: any) {
    if (!this.ctx) return;
    const g = this.ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1, cfg.volume ?? 1));
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    const bright = Math.max(0, Math.min(1, cfg.brightness ?? 0.85));
    // map brightness 0..1 to ~500Hz..20000Hz
    f.frequency.value = 500 + bright * 19500;
    const p = (this.ctx as any).createStereoPanner ? (this.ctx as any).createStereoPanner() : null;
    if (p) p.pan.value = Math.max(-1, Math.min(1, cfg.pan ?? 0));
    // connect chain to master bus; sources will connect into filter
    const dest = this.masterGain ?? this.ctx.destination;
    if (p) f.connect(p).connect(g).connect(dest);
    else f.connect(g).connect(dest);
    this.channelNodes.set(key, { filter: f, panner: p, gain: g });
    // If an instrument instance is provided and supports connect, route it through our channel filter
    try {
      if (inst && typeof inst.connect === 'function') {
        inst.connect(f);
      }
    } catch { /* ignore */ }
  }

  private scheduleNote(inst: any, timeSec: number, midi: number, dur: number, vel: number, chKey: string) {
    if (!this.ctx || !inst) return;
    const t = this.ctx.currentTime + timeSec + SfPlayer.LOOKAHEAD_S; // increased buffer
    const ch = this.channelNodes.get(chKey);
    // Clamp to a safe GM melodic range to avoid missing sample zones in some packs
    const safeMidi = Math.max(36, Math.min(96, midi | 0));
    // Voice limiting per channel
    const voices = this.activeVoices.get(chKey) ?? [];
    if (voices.length >= SfPlayer.MAX_POLYPHONY) {
      const stopOld = voices.shift();
      try { stopOld?.(); } catch { /* ignore */ }
    }
    try {
      const gateDur = Math.max(0.08, dur * 0.85); // shorter gate for clarity
      const node = inst.play(safeMidi, t, { duration: gateDur, gain: Math.max(0, Math.min(1, vel)) });
      const stopFn = () => { try { (node as any).stop?.(); } catch { /* ignore */ } };
      this.scheduled.push(stopFn);
      voices.push(stopFn);
      this.activeVoices.set(chKey, voices);
    } catch (_e) {
      // Fallback: simple sine if instrument sample missing
      try {
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440 * Math.pow(2, (safeMidi - 69) / 12);
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(Math.min(1, vel), t + 0.005);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, dur));
        osc.connect(amp);
        const dest = ch?.filter ?? this.masterGain ?? this.ctx.destination;
        amp.connect(dest);
        osc.start(t);
        osc.stop(t + Math.max(0.1, dur));
        const stopFn = () => { try { osc.disconnect(); amp.disconnect(); } catch { /* ignore */ } };
        this.scheduled.push(stopFn);
        voices.push(stopFn);
        this.activeVoices.set(chKey, voices);
      } catch { /* ignore */ }
    }
  }

  private scheduleDrum(inst: any, timeSec: number, code: number, vel: number, dur: number, chKey: string) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + timeSec + Math.max(0.02, SfPlayer.LOOKAHEAD_S * 0.5);
    const ch = this.channelNodes.get(chKey);
    if (!ch) return;
    if (inst && inst.__drumSynth) {
      // Kick: 35/36
      if (code === 35 || code === 36) {
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + Math.max(0.05, dur * 0.5));
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(Math.min(1, vel), t + 0.002);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.12, dur * 0.9));
        osc.connect(amp);
        amp.connect(ch.filter!);
        osc.start(t);
        osc.stop(t + Math.max(0.15, dur));
        this.scheduled.push(() => { try { osc.disconnect(); amp.disconnect(); } catch { } });
        return;
      }
      // Snare: 38/40
      if (code === 38 || code === 40) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer();
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800;
        const amp = this.ctx.createGain();
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(Math.min(1, vel), t + 0.001);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, dur));
        src.connect(bp).connect(amp).connect(ch.filter!);
        src.start(t);
        src.stop(t + Math.max(0.12, dur));
        this.scheduled.push(() => { try { src.disconnect(); bp.disconnect(); amp.disconnect(); } catch { } });
        return;
      }
      // Closed/Opened HH, Ride, etc: highpassed noise
      const src = this.ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer();
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6000;
      const amp = this.ctx.createGain();
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(Math.min(1, vel * 0.7), t + 0.001);
      const hatDur = code === 46 || code === 49 ? Math.max(0.2, dur) : Math.max(0.05, dur * 0.6);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + hatDur);
      src.connect(hp).connect(amp).connect(ch.filter!);
      src.start(t);
      src.stop(t + hatDur + 0.02);
      this.scheduled.push(() => { try { src.disconnect(); hp.disconnect(); amp.disconnect(); } catch { } });
      return;
    }
    // Fallback: try instrument play if present
    if (inst && typeof inst.play === 'function') {
      const node = inst.play(Math.max(0, Math.min(127, code)), t, { duration: Math.max(0.05, dur), gain: Math.max(0, Math.min(1, vel)) });
      this.scheduled.push(() => { try { (node as any).stop?.(); } catch { /* ignore */ } });
    }
  }

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuf && this.ctx) return this.noiseBuf;
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(1 - 1);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buffer;
    return buffer;
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    await this.ensureCtx();
    const ctx = this.ctx!;
    const mapping = loadMapping();
    this.stop();

    // Prepare instruments in parallel
    await Promise.all(mapping.channels.map((c) => this.loadInstrumentFor(c)));

    // Warm-up/preload: trigger quiet, short notes to force download/decoding up-front
    try {
      const now = ctx.currentTime + 0.05;
      for (const ch of mapping.channels) {
        const inst = await this.loadInstrumentFor(ch);
        if (!inst || ch.isPercussion || ch.channel === 10 || ch.source === 'drums') continue;
        const testNotes = ch.source === 'bass' ? [36, 40, 43] : ch.source === 'chords' ? [52, 55, 59] : [60, 64, 67];
        for (let i = 0; i < testNotes.length; i++) {
          try { inst.play(testNotes[i], now + i * 0.03, { duration: 0.05, gain: 0.001 }); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    // Velocity humanization with simple style-based accents
    const bpm = out.meta?.bpm ?? 120;
    const beatSec = 60 / bpm;
    const style = (out.meta?.style || '').toLowerCase();
    const variation = Math.min(1, Math.max(0, out.meta?.variation ?? 0.6));
    function accentForBeat(b: number) {
      const m = b % 4;
      if (style === 'jazz') return m === 1 || m === 3 ? 1.1 : 1.0; // accent 2 and 4
      if (style === 'edm') return m === 0 ? 1.12 : m === 2 ? 1.06 : 1.0; // 1 strong, 3 light
      if (style === 'cinematic') return m === 0 ? 1.1 : m === 2 ? 1.05 : 1.02;
      if (style === 'lofi') return m === 0 ? 1.06 : m === 2 ? 1.03 : 1.0;
      return m === 0 ? 1.1 : m === 2 ? 1.05 : 1.0;
    }
    const events = [...out.events]
      .map((e) => {
        const beat = Math.floor(e.time / beatSec);
        const accent = accentForBeat(beat);
        const rand = 1 + (Math.random() * 2 - 1) * 0.15 * variation;
        const v = Math.max(0, Math.min(1, (e.velocity ?? 0.8) * accent * rand));
        return { ...e, velocity: v } as NoteEvent;
      })
      .sort((a, b) => a.time - b.time);
    const endTime = events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
    const startAt = 0; // schedule relative to now with buffer inside scheduleNote

    // For each channel mapping, schedule the source track events
    for (const ch of mapping.channels) {
      const inst = await this.loadInstrumentFor(ch);
      const evs = events.filter((e) => (e.track || 'lead') === ch.source);
      for (const ev of evs) {
        const midi = Math.max(0, Math.min(127, Math.round((ev.pitch || 0) + (ch.transpose || 0))));
        const dur = Math.max(0.05, ev.duration || 0.25);
        const vel = Math.max(0, Math.min(1, ev.velocity ?? 0.8));
        if (ch.isPercussion || ch.channel === 10 || ch.source === 'drums') {
          const code = ev.pitch | 0;
          this.scheduleDrum(inst, startAt + ev.time, code, vel, dur, ch.id);
        } else {
          this.scheduleNote(inst, startAt + ev.time, midi, dur, vel, ch.id);
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
    this.activeVoices.clear();
    // do not close context, but disconnect channel nodes
    for (const [, nodes] of this.channelNodes) {
      try { nodes.panner?.disconnect(); } catch { /* ignore */ }
      try { nodes.gain.disconnect(); } catch { /* ignore */ }
      try { nodes.filter?.disconnect(); } catch { /* ignore */ }
    }
    this.channelNodes.clear();
    this.status_ = 'stopped';
  }
}
