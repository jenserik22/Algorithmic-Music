/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';
import { loadMapping, type ChannelConfig } from '@/lib/midi/mapping';
import { WorkletSynthesizer } from 'spessasynth_lib';
// Vite: import processor file as URL so AudioWorklet can load it
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import spessaWorkletUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

export class Sf2Player {
  private ctx: AudioContext | null = null;
  private status_: PlayerStatus = 'stopped';
  private synth: InstanceType<typeof WorkletSynthesizer> | null = null;
  private masterComp: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private channelNodes: Array<{ filter: BiquadFilterNode; panner: StereoPannerNode | null; gain: GainNode } | null> = new Array(16).fill(null);
  private scheduled: Array<() => void> = [];

  status(): PlayerStatus { return this.status_; }

  // Expose context and output node for visualization
  getAudioContext(): AudioContext | null { return this.ctx; }
  getOutputNode(): AudioNode | null { return this.masterComp ?? this.masterGain ?? this.ctx?.destination ?? null; }

  private async ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignore */ }
    }
    if (this.ctx && !this.masterComp) {
      const g = this.ctx.createGain();
      g.gain.value = 0.95;
      const c = this.ctx.createDynamicsCompressor();
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

  private setupChannelNodes() {
    if (!this.ctx) return;
    for (let i = 0; i < 16; i++) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 18000;
      const p = (this.ctx as any).createStereoPanner ? (this.ctx as any).createStereoPanner() : null;
      const g = this.ctx.createGain();
      g.gain.value = 1;
      const dest = this.masterGain ?? this.ctx.destination;
      if (p) f.connect(p).connect(g).connect(dest); else f.connect(g).connect(dest);
      this.channelNodes[i] = { filter: f, panner: p, gain: g };
    }
  }

  private applyChannelConfig(ch: number, cfg: ChannelConfig) {
    if (!this.synth || !this.ctx) return;
    const idx = Math.max(0, Math.min(15, (cfg.channel ?? ch) - 1));
    const nodes = this.channelNodes[idx];
    if (nodes) {
      const bright = Math.max(0, Math.min(1, cfg.brightness ?? 0.85));
      nodes.filter.frequency.value = 500 + bright * 19500;
      const vol = Math.max(0, Math.min(1, cfg.volume ?? 1));
      nodes.gain.gain.value = vol;
      if (nodes.panner) nodes.panner.pan.value = Math.max(-1, Math.min(1, cfg.pan ?? 0));
    }
    const isPerc = !!(cfg.isPercussion || cfg.channel === 10 || cfg.source === 'drums');
    try {
      this.synth.setDrums(idx, isPerc);
      if (!isPerc) this.synth.programChange(idx, Math.max(0, Math.min(127, cfg.program ?? 0)));
      // Set CC7 Volume and CC10 Pan for good measure (most SF2 respect these)
      this.synth.controllerChange(idx, 7 as any, Math.round(Math.max(0, Math.min(1, cfg.volume ?? 1)) * 127));
      const pan = Math.max(-1, Math.min(1, cfg.pan ?? 0));
      this.synth.controllerChange(idx, 10 as any, Math.round((pan * 0.5 + 0.5) * 127));
      // Transpose
      if (cfg.transpose) this.synth.transposeChannel(idx, cfg.transpose, true);
    } catch { /* ignore */ }
  }

  private async ensureSynthLoaded() {
    await this.ensureCtx();
    if (this.synth) return;
    const ctx = this.ctx!;
    // Ensure the AudioWorklet processor is registered before creating the synth
    try {
      // Some browsers require the context to be resumed before addModule
      if (ctx.state !== 'running') { try { await ctx.resume(); } catch { /* ignore */ } }
      await ctx.audioWorklet.addModule(spessaWorkletUrl);
    } catch (err) {
      console.warn('[Sf2Player] Failed to load spessasynth worklet module:', err);
      // Re-throw so the caller fallback can trigger
      throw err;
    }
    this.setupChannelNodes();
    // Create synth and connect its individual outputs to our channel chains
    this.synth = new WorkletSynthesizer(ctx, { oneOutput: false, initializeChorusProcessor: false, initializeReverbProcessor: false, enableEventSystem: false });
    await this.synth.isReady;
    const inputs: AudioNode[] = [];
    for (let i = 0; i < 16; i++) inputs.push(this.channelNodes[i]!.filter);
    this.synth.connectIndividualOutputs(inputs);

    // Load GeneralUser GS SoundFont
    const resp = await fetch('/GeneralUser-GSv1.472.sf2');
    const buf = await resp.arrayBuffer();
    await this.synth.soundBankManager.addSoundBank(buf, 'generaluser', 0);

    // Apply current mapping to channels
    const mapping = loadMapping();
    for (const cfg of mapping.channels) this.applyChannelConfig(cfg.channel - 1, cfg);
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    await this.ensureSynthLoaded();
    const ctx = this.ctx!;
    const synth = this.synth!;
    this.stop();

    // Recreate channel node graph if it was cleared by stop()
    if (!this.channelNodes[0]) {
      this.setupChannelNodes();
      const inputs: AudioNode[] = [];
      for (let i = 0; i < 16; i++) inputs.push(this.channelNodes[i]!.filter);
      try { this.synth!.connectIndividualOutputs(inputs); } catch { /* ignore */ }
    }

    const mapping = loadMapping();

    // Apply mapping (volume/pan/transpose/program/drums)
    for (const cfg of mapping.channels) this.applyChannelConfig(cfg.channel - 1, cfg);

    // Humanize velocities similar to SfPlayer
    const bpm = out.meta?.bpm ?? 120;
    const beatSec = 60 / bpm;
    const style = (out.meta?.style || '').toLowerCase();
    const variation = Math.min(1, Math.max(0, out.meta?.variation ?? 0.6));
    function accentForBeat(b: number) {
      const m = b % 4;
      if (style === 'jazz') return m === 1 || m === 3 ? 1.1 : 1.0;
      if (style === 'edm') return m === 0 ? 1.12 : m === 2 ? 1.06 : 1.0;
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
    const startAt = ctx.currentTime + 0.05;

    // Schedule via setTimeout based on AudioContext time for simplicity
    for (const cfg of mapping.channels) {
      const chIdx = Math.max(0, Math.min(15, (cfg.channel ?? 1) - 1));
      const evs = events.filter((e) => (e.track || 'lead') === cfg.source);
      for (const ev of evs) {
        const isPerc = !!(cfg.isPercussion || cfg.channel === 10 || cfg.source === 'drums');
        const midi = Math.max(0, Math.min(127, Math.round((ev.pitch || 0) + (isPerc ? 0 : (cfg.transpose || 0)))));
        const vel127 = Math.max(1, Math.min(127, Math.round((ev.velocity ?? 0.8) * 127)));
        const t = (startAt + ev.time - ctx.currentTime);
        const dur = Math.max(0.05, ev.duration || 0.25) * 0.85;
        const onId = setTimeout(() => {
          try { synth.noteOn(chIdx, midi, vel127); } catch { /* ignore */ }
        }, Math.max(0, t) * 1000);
        const offId = setTimeout(() => {
          try { synth.noteOff(chIdx, midi, false); } catch { /* ignore */ }
        }, Math.max(0, t + dur) * 1000);
        this.scheduled.push(() => clearTimeout(onId));
        this.scheduled.push(() => clearTimeout(offId));
      }
    }

    const endId = setTimeout(() => {
      this.stop();
      onEnd?.();
    }, (startAt - ctx.currentTime + endTime + 0.2) * 1000);
    this.scheduled.push(() => clearTimeout(endId));

    this.status_ = 'playing';
  }

  pause() {
    if (!this.ctx) return;
    try { this.ctx.suspend(); } catch { /* ignore */ }
    this.status_ = 'paused';
  }

  stop() {
    for (const fn of this.scheduled) { try { fn(); } catch { /* ignore */ } }
    this.scheduled = [];
    try { this.synth?.stopAll(true); } catch { /* ignore */ }
    // disconnect channel nodes
    for (let i = 0; i < 16; i++) {
      const n = this.channelNodes[i];
      if (!n) continue;
      try { n.panner?.disconnect(); } catch { /* ignore */ }
      try { n.gain.disconnect(); } catch { /* ignore */ }
      try { n.filter.disconnect(); } catch { /* ignore */ }
      this.channelNodes[i] = null;
    }
    this.status_ = 'stopped';
  }
}
