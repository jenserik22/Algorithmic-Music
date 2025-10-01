/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

export type PlayerStatus = 'stopped' | 'playing' | 'paused';

export class EnhancedTonePlayer {
  private tone: any | null = null;
  private ready = false;
  private _status: PlayerStatus = 'stopped';
  private nodes: {
    master?: any;
    masterFilter?: any;
    masterComp?: any;
    masterReverb?: any;
    masterEQ?: any;
    masterLimiter?: any;
    
    // Enhanced instrument chains
    chords?: any; chordsGain?: any; chordsPan?: any; chordsFilter?: any; chordsChorus?: any;
    lead?: any; leadFilter?: any; leadFX?: any; leadGain?: any; leadPan?: any; leadSaturator?: any;
    bass?: any; bassGain?: any; bassPan?: any; bassFilter?: any; bassCompressor?: any;
    
    // Enhanced drum processors
    kick?: any; kickCompressor?: any; kickEQ?: any;
    snare?: any; snareReverb?: any; snareCompressor?: any;
    hat?: any; hatFilter?: any; hatPan?: any;
    
    // FX chain
    fxMetal?: any; fxNoise?: any; fxFilter?: any; fxGain?: any; fxDelay?: any; fxReverb?: any;
  } = {};
  private lfos: any[] = [];
  private scheduledIds: string[] = [];

  status(): PlayerStatus { return this._status; }

  private async ensureReady(bpm = 120) {
    if (this.ready) return;
    try {
      const tone = await import('tone');
      this.tone = tone;
      await tone.start();
      tone.Transport.bpm.value = bpm;

      // Create enhanced master chain with professional processing
      const masterEQ = new tone.EQ3({ low: -2, mid: 0, high: 1 });
      const masterComp = new tone.Compressor({ 
        threshold: -18, 
        ratio: 4, 
        attack: 0.003, 
        release: 0.25 
      });
      const masterReverb = new tone.Reverb({ decay: 2.2, wet: 0.15 });
      const masterFilter = new tone.Filter({ type: 'lowpass', frequency: 12000 });
      const masterLimiter = new tone.Limiter(-0.5);
      const master = new tone.Gain(0.8);

      // Master processing chain
      master.chain(masterEQ, masterComp, masterFilter, masterReverb, masterLimiter, tone.Destination);

      // Enhanced Chords section with rich processing
      const chords = new tone.PolySynth(tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.8 },
        filter: { frequency: 2500, rolloff: -24 }
      });
      const chordsFilter = new tone.Filter({ type: 'lowpass', frequency: 3000 });
      const chordsChorus = new tone.Chorus({ frequency: 0.4, delayTime: 2.5, depth: 0.7 }).start();
      const chordsGain = new tone.Gain(0.6);
      const chordsPan = new tone.Panner(0);
      
      chords.chain(chordsFilter, chordsChorus, chordsGain, chordsPan, masterReverb);
      chordsPan.connect(master);

      // Enhanced Lead synth with character
      const lead = new tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.3 },
        filter: { frequency: 4000, rolloff: -12 }
      });
      const leadSaturator = new tone.Distortion(0.2);
      const leadFilter = new tone.Filter({ type: 'lowpass', frequency: 2500 });
      const leadFX = new tone.PingPongDelay({ 
        delayTime: '8n', 
        feedback: 0.25, 
        wet: 0.3 
      });
      const leadGain = new tone.Gain(0.7);
      const leadPan = new tone.Panner(0.1);
      
      lead.chain(leadSaturator, leadFilter, leadFX, leadGain, leadPan, masterReverb);
      leadPan.connect(master);

      // Enhanced Bass with punch and character
      const bass = new tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.4 },
        filter: { frequency: 800, rolloff: -12 }
      });
      const bassFilter = new tone.Filter({ type: 'lowpass', frequency: 600 });
      const bassCompressor = new tone.Compressor({ 
        threshold: -12, 
        ratio: 8, 
        attack: 0.001, 
        release: 0.1 
      });
      const bassGain = new tone.Gain(1.2);
      const bassPan = new tone.Panner(-0.1);
      
      bass.chain(bassFilter, bassCompressor, bassGain, bassPan);
      bassPan.connect(master);

      // Enhanced Drums with character and processing
      // Kick with punch
      const kick = new tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
      });
      const kickEQ = new tone.EQ3({ low: 3, mid: -2, high: -6 });
      const kickCompressor = new tone.Compressor({ 
        threshold: -6, 
        ratio: 10, 
        attack: 0.001, 
        release: 0.05 
      });
      kick.chain(kickEQ, kickCompressor);
      kickCompressor.connect(master);

      // Snare with room
      const snare = new tone.NoiseSynth({
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
        filter: { frequency: 3000 }
      });
      const snareReverb = new tone.Reverb({ decay: 0.8, wet: 0.4 });
      const snareCompressor = new tone.Compressor({ 
        threshold: -8, 
        ratio: 6, 
        attack: 0.001, 
        release: 0.1 
      });
      snare.chain(snareCompressor, snareReverb);
      snareReverb.connect(master);

      // Hi-hats with sparkle
      const hat = new tone.MetalSynth({
        frequency: 400,
        envelope: { attack: 0.001, decay: 0.08, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      });
      const hatFilter = new tone.Filter({ type: 'highpass', frequency: 8000 });
      const hatPan = new tone.Panner(0.3);
      hat.chain(hatFilter, hatPan);
      hatPan.connect(master);

      // Enhanced FX section
      const fxNoise = new tone.NoiseSynth({
        envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 },
        filter: { frequency: 200 }
      });
      const fxMetal = new tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 1, release: 0.1 },
        harmonicity: 3,
        modulationIndex: 20
      });
      const fxFilter = new tone.Filter({ type: 'bandpass', frequency: 1000, Q: 10 });
      const fxDelay = new tone.FeedbackDelay({ 
        delayTime: '4n', 
        feedback: 0.4, 
        wet: 0.5 
      });
      const fxReverb = new tone.Reverb({ decay: 4, wet: 0.7 });
      const fxGain = new tone.Gain(0.8);

      fxNoise.chain(fxFilter, fxDelay, fxReverb, fxGain);
      fxMetal.chain(fxFilter, fxDelay, fxReverb, fxGain);
      fxGain.connect(master);

      // Store all nodes for later access
      this.nodes = {
        master, masterFilter, masterComp, masterReverb, masterEQ, masterLimiter,
        chords, chordsGain, chordsPan, chordsFilter, chordsChorus,
        lead, leadFilter, leadFX, leadGain, leadPan, leadSaturator,
        bass, bassGain, bassPan, bassFilter, bassCompressor,
        kick, kickCompressor, kickEQ,
        snare, snareReverb, snareCompressor,
        hat, hatFilter, hatPan,
        fxMetal, fxNoise, fxFilter, fxGain, fxDelay, fxReverb,
      };

      this.ready = true;
    } catch (error) {
      console.error('Enhanced Tone.js init failed:', error);
      throw error;
    }
  }

  async play(output: EngineOutput, startTime = 0) {
    if (this._status === 'playing') return;

    await this.ensureReady(output.meta?.bpm);
    if (!this.tone) throw new Error('Tone.js not initialized');

    this._status = 'playing';
    this.tone.Transport.start();

    try {
      // Apply LFO automation
      this.setupLFOs(output);

      // Schedule enhanced events with better processing
      for (const event of output.events) {
        this.scheduleEnhancedEvent(event, startTime);
      }

    } catch (error) {
      console.error('Enhanced playback error:', error);
      this.stop();
      throw error;
    }
  }

  private setupLFOs(output: EngineOutput) {
    if (!output.meta?.lfos || !this.tone) return;

    this.clearLFOs();

    for (const lfoSpec of output.meta.lfos) {
      try {
        const lfo = new this.tone.LFO({
          frequency: lfoSpec.rate,
          type: lfoSpec.shape || 'sine',
          min: lfoSpec.min,
          max: lfoSpec.max,
        });

        // Enhanced LFO targeting
        const target = this.getLFOTarget(lfoSpec.target);
        if (target) {
          lfo.connect(target);
          lfo.start();
          this.lfos.push(lfo);
        }
      } catch (error) {
        console.warn('LFO setup failed:', lfoSpec.target, error);
      }
    }
  }

  private getLFOTarget(targetSpec: string): any {
    if (!this.nodes) return null;

    // Enhanced LFO targeting with more options
    switch (targetSpec) {
      case 'track:lead.filterCutoff':
        return this.nodes.leadFilter?.frequency;
      case 'track:lead.pan':
        return this.nodes.leadPan?.pan;
      case 'track:lead.reverb':
        return this.nodes.leadFX?.wet;
      case 'track:chords.pan':
        return this.nodes.chordsPan?.pan;
      case 'track:bass.filterCutoff':
        return this.nodes.bassFilter?.frequency;
      case 'master.brightness':
        return this.nodes.masterFilter?.frequency;
      case 'master.compression':
        return this.nodes.masterComp?.threshold;
      default:
        console.warn('Unknown LFO target:', targetSpec);
        return null;
    }
  }

  private scheduleEnhancedEvent(event: NoteEvent, startTime: number) {
    if (!this.tone || !this.nodes) return;

    const { time, pitch, duration, velocity, track } = event;
    const when = startTime + time;
    const vel = Math.max(0.1, Math.min(1, velocity));

    try {
      switch (track) {
        case 'chords':
          this.nodes.chords?.triggerAttackRelease(
            this.tone.Frequency(pitch, 'midi'),
            duration,
            when,
            vel * 0.8
          );
          break;

        case 'lead':
          // Add subtle pitch bend for expression
          const freq = this.tone.Frequency(pitch, 'midi').toFrequency();
          const pitchBend = 1 + (Math.random() - 0.5) * 0.02; // ±1% pitch variation
          this.nodes.lead?.triggerAttackRelease(
            freq * pitchBend,
            duration,
            when,
            vel * 0.9
          );
          break;

        case 'bass':
          this.nodes.bass?.triggerAttackRelease(
            this.tone.Frequency(pitch, 'midi'),
            duration,
            when,
            vel
          );
          break;

        case 'drums':
          if (pitch <= 40) {
            // Kick drums - add sub-harmonic for more punch
            this.nodes.kick?.triggerAttackRelease(
              Math.max(30, pitch - 12),
              0.15,
              when,
              vel
            );
          } else if (pitch >= 42) {
            // Hi-hats with slight randomization
            this.nodes.hat?.triggerAttackRelease(
              400 + Math.random() * 200,
              Math.min(0.1, duration),
              when,
              vel * 0.7
            );
          } else {
            // Snares
            this.nodes.snare?.triggerAttackRelease(
              when,
              vel * 0.85
            );
          }
          break;

        case 'fx':
          if (pitch > 80) {
            // High FX - metallic sounds
            this.nodes.fxMetal?.triggerAttackRelease(
              this.tone.Frequency(pitch, 'midi'),
              duration,
              when,
              vel * 0.6
            );
          } else {
            // Low FX - noise and ambience  
            this.nodes.fxNoise?.triggerAttackRelease(
              duration,
              when,
              vel * 0.5
            );
          }
          break;

        default:
          // Default to lead synth for unknown tracks
          this.nodes.lead?.triggerAttackRelease(
            this.tone.Frequency(pitch, 'midi'),
            duration,
            when,
            vel * 0.7
          );
      }
    } catch (error) {
      console.warn('Event scheduling failed:', event, error);
    }
  }

  stop() {
    if (this._status === 'stopped') return;

    this._status = 'stopped';
    
    try {
      if (this.tone) {
        this.tone.Transport.stop();
        this.tone.Transport.cancel();
      }

      this.clearLFOs();
      this.scheduledIds = [];
    } catch (error) {
      console.warn('Stop cleanup error:', error);
    }
  }

  pause() {
    if (this._status !== 'playing') return;

    this._status = 'paused';
    if (this.tone) {
      this.tone.Transport.pause();
    }
  }

  resume() {
    if (this._status !== 'paused') return;

    this._status = 'playing';
    if (this.tone) {
      this.tone.Transport.start();
    }
  }

  private clearLFOs() {
    for (const lfo of this.lfos) {
      try {
        lfo.stop();
        lfo.dispose();
      } catch (error) {
        console.warn('LFO cleanup error:', error);
      }
    }
    this.lfos = [];
  }

  // Enhanced real-time parameter control
  setMasterVolume(volume: number) {
    if (this.nodes.master) {
      this.nodes.master.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setMasterFilter(frequency: number) {
    if (this.nodes.masterFilter) {
      this.nodes.masterFilter.frequency.value = Math.max(100, Math.min(20000, frequency));
    }
  }

  setReverbWet(wetness: number) {
    if (this.nodes.masterReverb) {
      this.nodes.masterReverb.wet.value = Math.max(0, Math.min(1, wetness));
    }
  }

  setLeadFilterCutoff(frequency: number) {
    if (this.nodes.leadFilter) {
      this.nodes.leadFilter.frequency.value = Math.max(100, Math.min(8000, frequency));
    }
  }

  setBassBoost(gain: number) {
    if (this.nodes.masterEQ) {
      this.nodes.masterEQ.low.value = Math.max(-12, Math.min(12, gain));
    }
  }

  // Get audio analysis data for visualization
  getAudioAnalysis() {
    if (!this.tone || !this.nodes.master) return null;

    try {
      const analyser = new this.tone.Analyser('waveform', 1024);
      this.nodes.master.connect(analyser);
      
      return {
        waveform: analyser.getValue(),
        volume: this.nodes.master.volume.value
      };
    } catch (error) {
      console.warn('Audio analysis error:', error);
      return null;
    }
  }

  dispose() {
    this.stop();
    this.clearLFOs();
    
    // Clean up all audio nodes
    for (const [name, node] of Object.entries(this.nodes)) {
      try {
        if (node && typeof node.dispose === 'function') {
          node.dispose();
        }
      } catch (error) {
        console.warn(`Error disposing ${name}:`, error);
      }
    }
    
    this.nodes = {};
    this.ready = false;
  }
}