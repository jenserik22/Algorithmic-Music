declare module 'wav-encoder' {
  export function encode(audioData: {
    sampleRate: number;
    channelData: Float32Array[];
  }): Promise<ArrayBuffer>;
}

// Minimal typings for lamejs used by audio encoding
declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
    flush(): Uint8Array;
  }
}

// Minimal namespace-style typings for midi-writer-js used by our exporter
declare module 'midi-writer-js' {
  namespace MidiWriter {
    class Track {
      constructor();
      addEvent(event: any): void;
    }
    class NoteEvent {
      constructor(opts: any);
    }
    class ProgramChangeEvent {
      constructor(opts: any);
    }
    class TempoEvent {
      constructor(opts: { bpm: number });
    }
    class TimeSignatureEvent {
      constructor(numerator: number, denominator: number, metronome?: number, thirtyseconds?: number);
    }
    class TextEvent {
      constructor(opts: { text: string });
    }
    class Writer {
      constructor(tracks: Track[]);
      dataUri(): string;
      buildFile(): Uint8Array;
    }
  }
  const MidiWriterExport: typeof MidiWriter;
  export = MidiWriterExport;
}
