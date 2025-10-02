import MidiWriter from 'midi-writer-js';
import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

interface MidiExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
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
      throw new Error(`MIDI export failed: ${error.message}`);
    }
  }

  /**
   * Generate MIDI file data from engine output
   */
  private static generateMidiData(output: EngineOutput, options: MidiExportOptions): Uint8Array {
    // Group events by track
    const trackGroups = this.groupEventsByTrack(output.events);
    
    // Add tempo and time signature
    const bpm = output.meta?.bpm || 120;
    const timeSignature = this.parseTimeSignature(output.meta?.timeSignature || '4/4');
    
    // Create tempo track (track 0)
    const tempoTrack = new MidiWriter.Track();
    tempoTrack.addEvent(new MidiWriter.TimeSignatureEvent(
      timeSignature.numerator, 
      timeSignature.denominator
    ));
    tempoTrack.addEvent(new MidiWriter.TempoEvent({ bpm }));
    
    if (options.includeMetadata) {
      tempoTrack.addEvent(new MidiWriter.TextEvent({ text: 'Algorithmic Music Generator' }));
      tempoTrack.addEvent(new MidiWriter.TextEvent({ 
        text: `Algorithm: ${output.meta?.algorithm || 'Unknown'}` 
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
    
    // Create tracks for each instrument
    Object.entries(trackGroups).forEach(([trackName, trackData]) => {
      if (trackData.events.length > 0) {
        const track = this.createMidiTrack(trackData, bpm);
        tracks.push(track);
      }
    });
    
    // Create MIDI writer with tracks array
    const writer = new MidiWriter.Writer(tracks);
    
    return writer.buildFile();
  }

  /**
   * Group note events by instrument track
   */
  private static groupEventsByTrack(events: NoteEvent[]): Record<string, MidiTrackData> {
    const groups: Record<string, MidiTrackData> = {};
    
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
  private static createMidiTrack(trackData: MidiTrackData, bpm: number): MidiWriter.Track {
    const track = new MidiWriter.Track();
    
    // Set track name
    track.addEvent(new MidiWriter.TextEvent({ 
      text: trackData.trackName,
      type: 'trackName'
    }));
    
    // Set instrument (program change) - skip for drums (channel 10)
    if (trackData.channel !== 10) {
      track.addEvent(new MidiWriter.ProgramChangeEvent({
        instrument: trackData.instrument
      }));
    }
    
    // Sort events by time
    const sortedEvents = [...trackData.events].sort((a, b) => a.time - b.time);
    
    // Convert note events to MIDI notes
    sortedEvents.forEach(noteEvent => {
      const velocity = Math.max(1, Math.min(127, Math.round((noteEvent.velocity || 0.7) * 127)));
      let pitch = Math.round(noteEvent.pitch);
      
      // Handle drum mapping for percussion track
      if (trackData.channel === 10) {
        pitch = this.mapDrumNote(pitch);
      }
      
      // Clamp pitch to valid MIDI range
      pitch = Math.max(0, Math.min(127, pitch));
      
      // Convert duration from seconds to standard notation
      // Only use valid MIDI durations that the library accepts
      const durationSecs = noteEvent.duration || 0.25;
      let duration: string;
      
      if (durationSecs >= 3.0) {
        duration = '1';  // Whole note (4 beats)
      } else if (durationSecs >= 1.5) {
        duration = '2';  // Half note (2 beats)  
      } else if (durationSecs >= 0.75) {
        duration = '4';  // Quarter note (1 beat)
      } else if (durationSecs >= 0.375) {
        duration = '8';  // Eighth note (0.5 beats)
      } else if (durationSecs >= 0.1875) {
        duration = '16'; // Sixteenth note (0.25 beats)
      } else {
        duration = '32'; // Thirty-second note (shortest)
      }
      
      // Create MIDI note event with basic parameters only
      const noteEventMidi = new MidiWriter.NoteEvent({
        pitch: [pitch],
        duration: duration,
        velocity: velocity
      });
      
      track.addEvent(noteEventMidi);
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
    const blob = new Blob([data], { type: 'audio/midi' });
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