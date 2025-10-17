/* eslint-disable @typescript-eslint/no-explicit-any */

// A tiny singleton to expose analyser nodes for the currently active engine.
// For Tone.js we continue using Tone.Analyser inside the UI component.
// For non‑Tone engines (sf/sf2), we create native AnalyserNode instances in the
// engine's own AudioContext and expose them so the SpectrumAnalyzer can read data.

type NativeAnalyzers = {
  ctx: AudioContext;
  fft: AnalyserNode;
  waveform: AnalyserNode;
};

class AnalysisBusImpl {
  private native: NativeAnalyzers | null = null;

  // Register an AudioContext + output node from a non‑Tone engine.
  // This will create analyser nodes and connect the output node into them (fan‑out).
  registerNative(ctx: AudioContext, outputNode: AudioNode) {
    try {
      // If context changed, rebuild analyzers
      if (!this.native || this.native.ctx !== ctx) {
        // cleanup previous
        if (this.native) {
          try { this.native.fft.disconnect(); } catch {}
          try { this.native.waveform.disconnect(); } catch {}
        }
        const fft = ctx.createAnalyser();
        fft.fftSize = 1024; // 512 bins from getFloatFrequencyData
        fft.smoothingTimeConstant = 0.8;
        const waveform = ctx.createAnalyser();
        waveform.fftSize = 1024;
        waveform.smoothingTimeConstant = 0.2;
        this.native = { ctx, fft, waveform };
      }
      // Safe parallel connections
      outputNode.connect(this.native.fft);
      outputNode.connect(this.native.waveform);
    } catch {
      // ignore
    }
  }

  // Clear existing native analyzers (e.g., on stop/disconnect)
  clearNative() {
    if (!this.native) return;
    try { this.native.fft.disconnect(); } catch {}
    try { this.native.waveform.disconnect(); } catch {}
    this.native = null;
  }

  getNative(): NativeAnalyzers | null {
    return this.native;
  }
}

export const AnalysisBus = new AnalysisBusImpl();
