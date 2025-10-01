/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

export class TonePlayer {
  private tone: any | null = null;
  private ready = false;
  private _status: PlayerStatus = 'stopped';
  private nodes: {
    master?: any;
    comp?: any;
    reverb?: any;
    chords?: any; chordsGain?: any;
    lead?: any; leadFX?: any; leadGain?: any;
    bass?: any; bassGain?: any;
    kick?: any; snare?: any; hat?: any;
  } = {};
  private scheduledIds: string[] = [];

  status(): PlayerStatus { return this._status; }

  private async ensureReady(bpm = 120) {
    if (this.ready) return;
    try {
      const tone = await import('tone');
      this.tone = tone;
      await tone.start();
      tone.Transport.bpm.value = bpm;

      const comp = new tone.Compressor({ threshold: -18, ratio: 3, attack: 0.003, release: 0.25 });
      const reverb = new tone.Reverb({ decay: 2.2, wet: 0.25 });
      const master = new tone.Gain(1);
      master.chain(comp, tone.Destination);

      // Chords
      const chords = new tone.PolySynth(tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.6 },
      });
      const chordsGain = new tone.Gain(0.7);
      chords.connect(chordsGain);
      chordsGain.fan(reverb, master);

      // Lead
      const lead = new tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 },
      });
      const leadFX = new tone.PingPongDelay({ delayTime: '8n', feedback: 0.18, wet: 0.25 });
      const leadGain = new tone.Gain(0.8);
      lead.chain(leadFX, leadGain);
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

      this.nodes = { master, comp, reverb, chords, chordsGain, lead, leadFX, leadGain, bass, bassGain, kick, snare, hat };
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
    } catch {
      // bubble to caller to fallback
      throw new Error('tone_unavailable');
    }
    const tone = this.tone!;
    const T = tone.Transport;
    T.stop();
    this.clearSchedule();
    T.bpm.value = out.meta?.bpm ?? T.bpm.value;

    const startAt = T.seconds + 0.05;
    const endTime = out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);

    const chordsEv = out.events.filter(e => e.track === 'chords');
    const leadEv = out.events.filter(e => e.track === 'lead');
    const bassEv = out.events.filter(e => e.track === 'bass');
    const drumEv = out.events.filter(e => e.track === 'drums');

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
