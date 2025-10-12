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

  status(): PlayerStatus { return this.status_; }

  private async ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignore */ }
    }
  }

  private async loadInstrumentFor(cfg: ChannelConfig) {
    const key = cfg.id; // dedicate instrument per channel to allow independent pan/vol
    if (this.instrumentCache.has(key)) return this.instrumentCache.get(key);
    const Soundfont = await loadSoundfont();
    if (cfg.isPercussion || cfg.channel === 10 || cfg.source === 'drums') {
      // Use the GM percussion instrument file; named kits are not available on this CDN
      let inst: any = null;
      // Try FluidR3 first, then MusyngKite
      inst = await Soundfont.instrument(this.ctx!, 'percussion' as any, {
        soundfont: 'FluidR3_GM',
        nameToUrl: (n: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${n}-mp3.js`,
      }).catch(() => null);
      if (!inst) {
        inst = await Soundfont.instrument(this.ctx!, 'percussion' as any, {
          soundfont: 'MusyngKite',
          nameToUrl: (n: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${n}-mp3.js`,
        }).catch(() => null);
      }
      if (!inst) {
        // Last resort: use a simple synth drum to avoid silence
        inst = await Soundfont.instrument(this.ctx!, 'synth_drum' as any, {
          soundfont: 'MusyngKite',
          nameToUrl: (n: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${n}-mp3.js`,
        }).catch(() => null);
      }
      if (inst) this.setupChannelNodes(key, cfg, inst);
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
    if (p) inst.connect(f).connect(p).connect(g).connect(this.ctx.destination);
    else inst.connect(f).connect(g).connect(this.ctx.destination);
    this.channelNodes.set(key, { filter: f, panner: p, gain: g });
  }

  private scheduleNote(inst: any, timeSec: number, midi: number, dur: number, vel: number, chKey: string) {
    if (!this.ctx || !inst) return;
    const t = this.ctx.currentTime + timeSec + 0.05; // slight buffer
    const ch = this.channelNodes.get(chKey);
    // apply per-note velocity by temporarily scaling channel gain via inst options
    const node = inst.play(midi, t, { duration: Math.max(0.08, dur), gain: Math.max(0, Math.min(1, vel)) });
    this.scheduled.push(() => { try { (node as any).stop?.(); } catch { /* ignore */ } });
  }

  private scheduleDrum(inst: any, timeSec: number, code: number, vel: number, dur: number, chKey: string) {
    if (!this.ctx || !inst) return;
    const t = this.ctx.currentTime + timeSec + 0.05;
    const node = inst.play(Math.max(0, Math.min(127, code)), t, { duration: Math.max(0.05, dur), gain: Math.max(0, Math.min(1, vel)) });
    this.scheduled.push(() => { try { (node as any).stop?.(); } catch { /* ignore */ } });
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    await this.ensureCtx();
    const ctx = this.ctx!;
    const mapping = loadMapping();
    this.stop();

    // Prepare instruments in parallel
    await Promise.all(mapping.channels.map((c) => this.loadInstrumentFor(c)));

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
