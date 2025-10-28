import MidiWriter from 'midi-writer-js';
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';
import { loadMapping, defaultMapping } from '@/lib/midi/mapping';

interface MidiExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
  quantize?: 'off' | '1/16' | '1/8' | '1/4';
}

interface MidiTrackData {
  trackName: string;
  channel: number;
  instrument: number;
  events: NoteEvent[];
}

// General MIDI instrument mapping
const GM_INSTRUMENTS = {
  lead: 81,      // Lead 2 (sawtooth)
  chords: 89,    // Pad 2 (warm)
  bass: 34,      // Electric Bass (finger)
  drums: 0,      // Will use channel 10 for percussion
  fx: 95         // FX 8 (sci-fi)
} as const;

// Drum note mapping (General MIDI percussion)
const DRUM_MAP = {
  36: 36,  // Kick drum
  38: 38,  // Snare drum
  42: 42,  // Closed hi-hat
  46: 46,  // Open hi-hat
  49: 49,  // Crash cymbal
  51: 51,  // Ride cymbal
} as const;

export class MidiExporter {
  /**
   * Convert engine output to MIDI file and trigger download
   */
  static exportToMidi(output: EngineOutput, options: MidiExportOptions = {}): void {
    try {
      const midiData = this.generateMidiData(output, options);
      this.downloadMidi(midiData, options.fileName || 'algorithmic-music');
    } catch (error) {
      console.error('MIDI export failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`MIDI export failed: ${message}`);
    }
  }

  /**
   * Generate MIDI file data from engine output
   */
  private static generateMidiData(output: EngineOutput, options: MidiExportOptions): Uint8Array {
    // DEBUG: Check what we're receiving
    console.log('[DEBUG] MIDI Export receiving:', {
      eventCount: output.events?.length || 0,
      maxTime: output.events?.length > 0 ? Math.max(...output.events.map(e => e.time + e.duration)) : 0,
      firstFewEvents: output.events?.slice(0, 5).map(e => ({ track: e.track, time: e.time, duration: e.duration }))
    });
    
    // Group events by track
    const trackGroups = this.groupEventsByTrack(output.events);
    
    // Add tempo and time signature
    const bpm = output.meta?.bpm || 120;
    const timeSignature = this.parseTimeSignature((output as any).meta?.timeSignature || '4/4');
    
    // Log basic export information
    console.log('MIDI Export:', {
      bpm,
      totalEvents: output.events?.length || 0,
      trackCount: Object.keys(trackGroups).length
    });
    
    // Create tempo track (track 0)
    const tempoTrack = new MidiWriter.Track();
    tempoTrack.addEvent(new MidiWriter.TimeSignatureEvent(
      timeSignature.numerator, 
      timeSignature.denominator,
      24,
      8,
    ));
    tempoTrack.addEvent(new MidiWriter.TempoEvent({ bpm }));
    
    if (options.includeMetadata) {
      tempoTrack.addEvent(new MidiWriter.TextEvent({ text: 'Algorithmic Music Generator' }));
      tempoTrack.addEvent(new MidiWriter.TextEvent({ 
        text: `Algorithm: ${(output as any).meta?.algorithm || 'Unknown'}` 
      }));
      tempoTrack.addEvent(new MidiWriter.TextEvent({ 
        text: `Key: ${output.meta?.key || 'C'}` 
      }));
      if (output.meta?.style) {
        tempoTrack.addEvent(new MidiWriter.TextEvent({ 
          text: `Style: ${output.meta.style}` 
        }));
      }
    }
    
    // Collect all tracks
    const tracks = [tempoTrack];
    
    // Create tracks for each instrument (ONLY if they have events)
    Object.entries(trackGroups).forEach(([trackName, trackData]) => {
      if (trackData.events.length > 0) {
        console.log('[DEBUG] Creating MIDI track:', trackName, 'with', trackData.events.length, 'events');
        const track = this.createMidiTrack(trackData, bpm, options);
        tracks.push(track);
      } else {
        console.log('[DEBUG] Skipping empty track:', trackName);
      }
    });
    
    console.log('[DEBUG] Total MIDI tracks created:', tracks.length, '(including tempo track)');
    
    // Create MIDI writer with tracks array
    // CRITICAL: Set PPQ (ticks per quarter note) to match our timing expectations
    const writer = new MidiWriter.Writer(tracks);
    
    console.log('[DEBUG] MIDI Writer PPQ:', (writer as any).header?.ticksPerBeat || 'unknown');
    
    const data = writer.buildFile();
    return data;
  }

  /**
   * Group note events by instrument track
   */
  private static groupEventsByTrack(events: NoteEvent[]): Record<string, MidiTrackData> {
    const groups: Record<string, MidiTrackData> = {};
    const mapping = (() => { try { return loadMapping(); } catch { return defaultMapping(); } })();

    if (mapping?.channels?.length) {
      for (const ch of mapping.channels) {
        const key = ch.id;
        const source = ch.source;
        const evs = events.filter((e) => (e.track || 'lead') === source);
        if (!evs.length) continue;
        groups[key] = {
          trackName: ch.name || source,
          channel: ch.isPercussion || ch.channel === 10 || source === 'drums' ? 10 : Math.max(1, Math.min(16, ch.channel || 1)),
          instrument: ch.program ?? this.getInstrumentForTrack(source),
          events: evs,
        };
      }
      return groups;
    }

    // fallback to fixed mapping
    events.forEach(event => {
      const trackName = event.track || 'lead';
      if (!groups[trackName]) {
        groups[trackName] = {
          trackName: trackName.charAt(0).toUpperCase() + trackName.slice(1),
          channel: this.getChannelForTrack(trackName),
          instrument: this.getInstrumentForTrack(trackName),
          events: []
        };
      }
      groups[trackName].events.push(event);
    });
    return groups;
  }

  /**
   * Create a MIDI track from track data
   */
  private static createMidiTrack(trackData: MidiTrackData, bpm: number, options: MidiExportOptions) {
    const track = new MidiWriter.Track();
    
    // Optionally write track name as a text meta event for compatibility
    track.addEvent(new MidiWriter.TextEvent({ text: `[Track] ${trackData.trackName}` } as any));
    
    // Set instrument (program change) - skip for drums (channel 10)
    if (trackData.channel !== 10) {
      track.addEvent(new MidiWriter.ProgramChangeEvent({
        instrument: trackData.instrument,
        channel: trackData.channel,
      } as any));
    }
    
    // Sort events by time
    const sortedEvents = [...trackData.events].sort((a, b) => a.time - b.time);
    
    // Timing helpers
    const secondsPerBeat = 60 / bpm;
    const gridBeats = this.getQuantizeGridBeats(options.quantize);

    // Keep track of running time per track (start of last note)
    let lastNoteStartTimeSec = 0;

    sortedEvents.forEach((noteEvent) => {
      const velocity = Math.max(1, Math.min(127, Math.round((noteEvent.velocity || 0.7) * 127)));
      let pitch = Math.round(noteEvent.pitch);
      
      // Handle drum mapping for percussion track
      if (trackData.channel === 10) {
        pitch = this.mapDrumNote(pitch);
      }
      
      // Clamp pitch to valid MIDI range
      pitch = Math.max(0, Math.min(127, pitch));
      
      // Original event timing
      const eventTimeSec = Math.max(0, noteEvent.time || 0);
      const durationSec = Math.max(0.01, noteEvent.duration || 0.25);

      // Compute wait before this note from start of previous note
      const rawWaitSec = Math.max(0, eventTimeSec - lastNoteStartTimeSec);
      // CRITICAL FIX: Halve the beat values because midi-writer-js is doubling them
      let waitBeats = (rawWaitSec / secondsPerBeat) / 2;
      let durationBeats = (durationSec / secondsPerBeat) / 2;

      // Quantize to grid if enabled
      if (gridBeats) {
        waitBeats = this.quantizeBeats(waitBeats, gridBeats);
        durationBeats = Math.max(gridBeats / 2, this.quantizeBeats(durationBeats, gridBeats));
      }

      // Map beats to duration strings compatible with midi-writer-js
      const waitStr = this.beatsToDurationString(waitBeats);
      const durStr = this.beatsToDurationString(durationBeats) || '16';

      // DEBUG: Log first few notes to see timing
      if (sortedEvents.indexOf(noteEvent) < 3) {
        console.log('[DEBUG] MIDI Note timing:', {
          track: trackData.trackName,
          eventTimeSec,
          lastNoteStartTimeSec,
          rawWaitSec,
          waitBeats,
          waitStr,
          durationBeats,
          durStr
        });
      }

      // Create MIDI note event with optional wait
      const eventConfig: any = {
        pitch: [pitch],
        duration: durStr,
        velocity,
        channel: trackData.channel,
      };
      if (waitStr) {
        eventConfig.wait = waitStr;
      }

      const noteEventMidi = new MidiWriter.NoteEvent(eventConfig);
      track.addEvent(noteEventMidi);

      // Track start time of this note for next iteration
      lastNoteStartTimeSec = eventTimeSec;
    });
    
    console.log('[DEBUG] MIDI Track created:', {
      trackName: trackData.trackName,
      eventCount: sortedEvents.length,
      lastNoteTime: lastNoteStartTimeSec
    });
    
    return track;
  }

  /**
   * Get MIDI channel for track type
   */
  private static getChannelForTrack(trackName: string): number {
    switch (trackName) {
      case 'lead': return 1;
      case 'chords': return 2;
      case 'bass': return 3;
      case 'drums': return 10; // Standard MIDI drum channel
      case 'fx': return 4;
      default: return 1;
    }
  }

  /**
   * Get General MIDI instrument number for track type
   */
  private static getInstrumentForTrack(trackName: string): number {
    return GM_INSTRUMENTS[trackName as keyof typeof GM_INSTRUMENTS] || GM_INSTRUMENTS.lead;
  }

  /**
   * Map drum notes to General MIDI percussion map
   */
  private static mapDrumNote(pitch: number): number {
    // Map common drum pitches to GM percussion
    if (pitch < 40) return 36; // Kick drum
    if (pitch < 50) return 38; // Snare drum
    if (pitch < 60) return 42; // Closed hi-hat
    return 49; // Crash cymbal
  }

  /**
   * Convert time in seconds to MIDI ticks
   */
  private static timeToTicks(timeInSeconds: number, bpm: number): number {
    const ticksPerBeat = 480; // Standard MIDI resolution
    const secondsPerBeat = 60 / bpm;
    const beats = timeInSeconds / secondsPerBeat;
    return Math.round(beats * ticksPerBeat);
  }

  /**
   * Convert a number of beats to nearest supported duration string
   * Supported values in midi-writer-js are note lengths like '1','2','4','8','16','32'.
   */
  private static beatsToDurationString(beats: number): string | undefined {
    if (!isFinite(beats) || beats <= 0) return undefined;
    const table: Array<{ beats: number; token: string }> = [
      { beats: 4, token: '1' },
      { beats: 2, token: '2' },
      { beats: 1, token: '4' },
      { beats: 0.5, token: '8' },
      { beats: 0.25, token: '16' },
      { beats: 0.125, token: '32' },
    ];
    // Choose the closest
    let best = table[table.length - 1];
    let bestDiff = Infinity;
    for (const row of table) {
      const d = Math.abs(beats - row.beats);
      if (d < bestDiff) { bestDiff = d; best = row; }
    }
    return best.token;
  }

  private static getQuantizeGridBeats(q?: MidiExportOptions['quantize']): number | null {
    switch (q) {
      case '1/4': return 1;
      case '1/8': return 0.5;
      case '1/16': return 0.25;
      default: return null;
    }
  }

  private static quantizeBeats(v: number, gridBeats: number): number {
    if (gridBeats <= 0) return v;
    return Math.round(v / gridBeats) * gridBeats;
  }

  /**
   * Parse time signature string
   */
  private static parseTimeSignature(timeSignature: string): { numerator: number; denominator: number } {
    const parts = timeSignature.split('/');
    return {
      numerator: parseInt(parts[0]) || 4,
      denominator: parseInt(parts[1]) || 4
    };
  }

  /**
   * Download MIDI file
   */
  private static downloadMidi(data: Uint8Array, fileName: string): void {
    // Ensure we pass a real ArrayBuffer to Blob for widest compatibility
    const ab = new ArrayBuffer(data.byteLength);
    new Uint8Array(ab).set(data as Uint8Array);
    const blob = new Blob([ab], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Get estimated file size for UI display
   */
  static getEstimatedFileSize(output: EngineOutput): string {
    const eventCount = output.events?.length || 0;
    const estimatedBytes = 1024 + (eventCount * 8); // Rough estimate
    
    if (estimatedBytes < 1024) {
      return `${estimatedBytes}B`;
    } else {
      return `${Math.round(estimatedBytes / 1024)}KB`;
    }
  }

  /**
   * Validate engine output for MIDI export
   */
  static validateOutput(output: EngineOutput | null): { valid: boolean; reason?: string } {
    if (!output) {
      return { valid: false, reason: 'No music generated' };
    }
    
    if (!output.events || output.events.length === 0) {
      return { valid: false, reason: 'No note events found' };
    }
    
    const hasValidNotes = output.events.some(event => 
      typeof event.pitch === 'number' && 
      event.pitch >= 0 && 
      event.pitch <= 127
    );
    
    if (!hasValidNotes) {
      return { valid: false, reason: 'No valid MIDI notes found' };
    }
    
    return { valid: true };
  }
}

export default MidiExporter;