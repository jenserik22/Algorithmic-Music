/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

export class TonePlayer {
  private tone: any | null = null;
  private ready = false;
  private _status: PlayerStatus = 'stopped';
  private nodes: {
    master?: any;
    masterFilter?: any;
    comp?: any;
    reverb?: any;
    chords?: any; chordsGain?: any; chordsPan?: any;
    lead?: any; leadFilter?: any; leadFX?: any; leadGain?: any;
    bass?: any; bassGain?: any;
    kick?: any; snare?: any; hat?: any;
    fxMetal?: any; fxNoise?: any; fxFilter?: any; fxGain?: any;
  } = {};
  private lfos: any[] = [];
  private scheduledIds: string[] = [];

  status(): PlayerStatus { return this._status; }

  private async ensureAudioContext() {
    if (!this.tone) return;
    
    // Ensure AudioContext is running (requires user gesture)
    if (this.tone.context.state !== 'running') {
      try {
        await this.tone.context.resume();
        console.log('[TonePlayer] AudioContext resumed');
      } catch (error) {
        console.warn('[TonePlayer] Failed to resume AudioContext:', error);
      }
    }
  }

  private async ensureReady(bpm = 120) {
    if (this.ready) return;
    try {
      const tone = await import('tone');
      this.tone = tone;
      
      // Try to start, but don't fail if it needs user gesture
      try {
        await tone.start();
      } catch (err) {
        // Expected error if no user gesture yet - will be handled by ensureAudioContext
        console.log('[TonePlayer] AudioContext will start on user gesture');
      }
      
      tone.Transport.bpm.value = bpm;

      const comp = new tone.Compressor({ threshold: -18, ratio: 3, attack: 0.003, release: 0.25 });
      const reverb = new tone.Reverb({ decay: 2.2, wet: 0.25 });
      const master = new tone.Gain(1);
      const masterFilter = new tone.Filter({ type: 'lowpass', frequency: 10000 });
      master.chain(comp, masterFilter, tone.Destination);

      // Chords
      const chords = new tone.PolySynth(tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.6 },
      });
      const chordsGain = new tone.Gain(0.7);
      const chordsPan = new tone.Panner(0);
      chords.chain(chordsGain, chordsPan);
      chordsPan.fan(reverb, master);

      // Lead
      const lead = new tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 },
      });
      const leadFilter = new tone.Filter({ type: 'lowpass', frequency: 2000 });
      const leadFX = new tone.PingPongDelay({ delayTime: '8n', feedback: 0.18, wet: 0.25 });
      const leadGain = new tone.Gain(0.8);
      lead.chain(leadFilter, leadFX, leadGain);
      leadGain.fan(reverb, master);

      // Bass
      const bass = new tone.MonoSynth({
        oscillator: { type: 'square' },
        filter: { type: 'lowpass', frequency: 400 },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.15 },
        filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.05, baseFrequency: 80, octaves: 2.5 },
      });
      const bassGain = new tone.Gain(0.8);
      bass.connect(bassGain);
      bassGain.connect(master);

      // Drums
      const kick = new tone.MembraneSynth({ pitchDecay: 0.02, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0 } });
      kick.connect(master);
      const snare = new tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 }, volume: -6 });
      snare.connect(master);
      const hat = new tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -8 });
      const hatHP = new tone.Filter({ type: 'highpass', frequency: 6000 });
      hat.chain(hatHP, master);

      // FX: crash (metal) and riser (noise with sweeping filter)
      const fxMetal = new tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.0, release: 0.2 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -4 });
      fxMetal.connect(master);
      const fxNoise = new tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.2, decay: 1.0, sustain: 0 }, volume: -10 });
      const fxFilter = new tone.Filter({ type: 'lowpass', frequency: 200 });
      const fxGain = new tone.Gain(0.8);
      fxNoise.chain(fxFilter, fxGain, reverb, master);

      this.nodes = { master, masterFilter, comp, reverb, chords, chordsGain, chordsPan, lead, leadFilter, leadFX, leadGain, bass, bassGain, kick, snare, hat, fxMetal, fxNoise, fxFilter, fxGain };
      this.ready = true;
    } catch (_e) {
      this.ready = false;
      this.tone = null;
      throw _e;
    }
  }

  private clearSchedule() {
    if (!this.tone) return;
    const T = this.tone.Transport;
    for (const id of this.scheduledIds) T.clear(id);
    this.scheduledIds = [];
    // stop LFOs
    for (const l of this.lfos) {
      try { l.stop(); l.disconnect(); l.dispose?.(); } catch { /* ignore */ }
    }
    this.lfos = [];
  }

  private groupChordNotes(events: NoteEvent[]) {
    const groups = new Map<number, NoteEvent[]>();
    for (const ev of events) {
      const key = Math.round(ev.time * 1000);
      const arr = groups.get(key) ?? [];
      arr.push(ev);
      groups.set(key, arr);
    }
    return [...groups.values()].map(g => g.sort((a,b)=>a.pitch-b.pitch));
  }

  async play(out: EngineOutput, onEnd?: () => void) {
    try {
      await this.ensureReady(out.meta?.bpm ?? 120);
      // Start audio context on user gesture (play button click)
      await this.ensureAudioContext();
    } catch {
      // bubble to caller to fallback
      throw new Error('tone_unavailable');
    }
    const tone = this.tone!;
    const T = tone.Transport;
    T.stop();
    this.clearSchedule();
    T.bpm.value = out.meta?.bpm ?? T.bpm.value;

    // Velocity humanization with simple style-based accents
    const bpm = out.meta?.bpm ?? (this.tone.Transport.bpm.value as number) ?? 120;
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
    const sortedEvents = [...out.events]
      .map((e) => {
        const beat = Math.floor(e.time / beatSec);
        const accent = accentForBeat(beat);
        const rand = 1 + (Math.random() * 2 - 1) * 0.15 * variation;
        const v = Math.max(0, Math.min(1, (e.velocity ?? 0.8) * accent * rand));
        return { ...e, velocity: v } as NoteEvent;
      })
      .sort((a, b) => a.time - b.time);
    
    // Ensure minimum time gap between events (prevent "Start time must be strictly greater" error)
    const MIN_TIME_GAP = 0.001; // 1ms
    for (let i = 1; i < sortedEvents.length; i++) {
      if (sortedEvents[i].time <= sortedEvents[i - 1].time) {
        sortedEvents[i].time = sortedEvents[i - 1].time + MIN_TIME_GAP;
      }
    }

    const startAt = T.seconds + 0.1; // Slightly more buffer
    const endTime = sortedEvents.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
    
    // Release all synths before scheduling new notes
    try {
      this.nodes.chords?.releaseAll();
    } catch { /* ignore */ }
    
    // Setup LFOs if provided
    const lfos = out.meta?.lfos ?? [];
    for (const spec of lfos) {
      try {
        const lfo = new tone.LFO({ frequency: spec.rate, min: spec.min ?? 200, max: spec.max ?? 8000, type: spec.shape ?? 'sine' }).start(startAt);
        if (spec.target === 'master.brightness') {
          lfo.connect(this.nodes.masterFilter.frequency);
        } else if (spec.target === 'track:lead.filterCutoff') {
          lfo.connect(this.nodes.leadFilter.frequency);
        } else if (spec.target === 'track:chords.pan') {
          // pan range -1..1
          lfo.connect(this.nodes.chordsPan.pan);
        }
        this.lfos.push(lfo);
      } catch { /* ignore */ }
    }

    // Use sorted events
    const chordsEv = sortedEvents.filter(e => e.track === 'chords');
    const leadEv = sortedEvents.filter(e => e.track === 'lead');
    const bassEv = sortedEvents.filter(e => e.track === 'bass');
    const drumEv = sortedEvents.filter(e => e.track === 'drums');
    const fxEv = sortedEvents.filter(e => e.track === 'fx');

    // Chords grouped per onset
    for (const group of this.groupChordNotes(chordsEv)) {
      const t = group[0].time + startAt;
      const dur = Math.max(0.1, Math.min(8, group[0].duration));
      const notes = group.map(ev => tone.Frequency(ev.pitch, 'midi').toNote());
      const vel = group.reduce((a, b) => a + (b.velocity ?? 0.7), 0) / group.length;
      const id = T.schedule((time: number) => {
        this.nodes.chords.triggerAttackRelease(notes, dur, time, vel);
      }, t);
      this.scheduledIds.push(id);
    }

    // Lead
    for (const ev of leadEv) {
      const t = ev.time + startAt;
      const note = tone.Frequency(ev.pitch, 'midi').toNote();
      const id = T.schedule((time: number) => {
        this.nodes.lead.triggerAttackRelease(note, Math.max(0.05, ev.duration), time, ev.velocity ?? 0.8);
      }, t);
      this.scheduledIds.push(id);
    }

    // Bass
    for (const ev of bassEv) {
      const t = ev.time + startAt;
      const note = tone.Frequency(ev.pitch, 'midi').toNote();
      const id = T.schedule((time: number) => {
        this.nodes.bass.triggerAttackRelease(note, Math.max(0.05, ev.duration), time, ev.velocity ?? 0.9);
      }, t);
      this.scheduledIds.push(id);
    }

    // Drums + sidechain duck
    for (const ev of drumEv) {
      const t = ev.time + startAt;
      const id = T.schedule((time: number) => {
        const code = ev.pitch | 0;
        if (code === 36) {
          this.nodes.kick.triggerAttackRelease('C2', 0.2, time, 1);
          // sidechain duck chords and bass briefly
          const cg = this.nodes.chordsGain.gain;
          const bg = this.nodes.bassGain.gain;
          cg.setValueAtTime(0.6, time);
          cg.rampTo(0.8, 0.15, time);
          bg.setValueAtTime(0.6, time);
          bg.rampTo(0.8, 0.15, time);
        } else if (code === 38) {
          this.nodes.snare.triggerAttackRelease('16n', time, 0.6);
        } else {
          this.nodes.hat.triggerAttackRelease('32n', time, 0.4);
        }
      }, t);
      this.scheduledIds.push(id);
    }

    // Stop and onEnd callback
    // FX events
    for (const ev of fxEv) {
      const t = ev.time + startAt;
      const id = T.schedule((time: number) => {
        const code = ev.pitch | 0;
        if (code === 49) {
          this.nodes.fxMetal.triggerAttackRelease(0.8, time, 0.9);
        } else {
          // riser: sweep filter up across duration
          const dur = Math.max(0.5, ev.duration);
          const startF = 200;
          const endF = 8000;
          this.nodes.fxFilter.frequency.setValueAtTime(startF, time);
          this.nodes.fxFilter.frequency.exponentialRampToValueAtTime(endF, time + dur);
          this.nodes.fxNoise.triggerAttackRelease(dur, time, 0.7);
        }
      }, t);
      this.scheduledIds.push(id);
    }

    // Stop and onEnd callback
    const endId = T.scheduleOnce(() => {
      this._status = 'stopped';
      this.clearSchedule();
      if (onEnd) onEnd();
    }, startAt + endTime + 0.1);
    this.scheduledIds.push(endId);

    T.start();
    this._status = 'playing';
  }

  async pause() {
    if (!this.tone) return;
    if (this._status !== 'playing') return;
    this.tone.Transport.pause();
    this._status = 'paused';
  }

  stop() {
    if (!this.tone) { this._status = 'stopped'; return; }
    this.tone.Transport.stop();
    this.clearSchedule();
    this._status = 'stopped';
  }
}
