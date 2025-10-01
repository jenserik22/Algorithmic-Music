// Optional Magenta.js refinement: drums and melody variations using pre-trained models
// Safe no-op in tests/SSR. Loads models lazily and only in browsers.
import type { EngineOutput, GenerationParams, NoteEvent } from '@/lib/music/engines/types';

let cached: {
  music?: typeof import('@magenta/music');
  drums?: any;
  vae?: any;
} = {};

function isTestOrSSR() {
  if (typeof window === 'undefined') return true;
  const ua = (window.navigator && window.navigator.userAgent) || '';
  return /jsdom|vitest/i.test(ua);
}

async function ensureModels() {
  if (cached.music) return cached;
  // Avoid Vite pre-bundling resolution in test by using vite-ignore
  const moduleName = '@magenta/music';
  // @ts-ignore
  const music = await import(/* @vite-ignore */ moduleName);
  cached.music = music;
  // DrumsRNN
  const drums = new (music as any).MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn');
  await drums.initialize();
  // Melody VAE (16-bar monophonic)
  const vae = new music.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_16bar');
  await vae.initialize();
  cached.drums = drums;
  cached.vae = vae;
  return cached;
}

function toEventsFromDrums(ns: any, beat: number): NoteEvent[] {
  const events: NoteEvent[] = [];
  // Map MIDI pitches: 36 kick, 38 snare, 42 hat if available; otherwise map kit
  for (const n of ns.notes ?? []) {
    const t = (n.startTime as number) ?? 0;
    const d = Math.max(0.04 * beat, ((n.endTime as number) ?? t + 0.08));
    let pitch = 42;
    // crude mapping by program/pitch if present
    const p = n.pitch as number;
    if (p <= 36) pitch = 36; else if (p <= 40) pitch = 38; else pitch = 42;
    events.push({ time: t, duration: d, pitch, velocity: (n.velocity as number) ?? 0.7, track: 'drums' });
  }
  return events;
}

function toEventsFromMelody(ns: any): NoteEvent[] {
  const events: NoteEvent[] = [];
  for (const n of ns.notes ?? []) {
    const t = (n.startTime as number) ?? 0;
    const e = (n.endTime as number) ?? t + 0.25;
    const d = Math.max(0.08, e - t);
    events.push({ time: t, duration: d, pitch: n.pitch as number, velocity: (n.velocity as number) ?? 0.7, track: 'lead' });
  }
  return events;
}

export async function refineArrangementWithMagenta(params: GenerationParams, arranged: EngineOutput): Promise<EngineOutput> {
  if (isTestOrSSR()) return arranged;
  try {
    const { music, drums, vae } = await ensureModels();
    const beat = 60 / params.bpm;
    const totalSecs = Math.max(...arranged.events.map(e => e.time + e.duration), params.durationSecs);
    const stepsPerQuarter = 4; // 16th grid
    const qpm = params.bpm;

    // Generate drums from scratch with temperature based on variation
    const variation = Math.max(0, Math.min(1, params.variation ?? 0.5));
    const steps = Math.max(16, Math.round((totalSecs / beat) * stepsPerQuarter));
    const emptyDrums = (music as any).sequences.quantizeNoteSequence({ notes: [], totalTime: totalSecs }, stepsPerQuarter);
    const sampled = await drums.sample(emptyDrums, steps, qpm, { temperature: 0.9 - 0.5 * variation });
    const drumNs = (music as any).sequences.unquantizeSequence(sampled, qpm);
    const drumEvents = toEventsFromDrums(drumNs, beat).filter(e => e.time < totalSecs);

    // Generate melody phrase (monophonic), then scale/trim to fit
    const samples = await vae.sample(1, { temperature: 0.8 + 0.2 * variation });
    const melNs = (music as any).sequences.unquantizeSequence(samples[0], qpm);
    let lead = toEventsFromMelody(melNs)
      .map(ev => ({ ...ev, time: ev.time % totalSecs }))
      .filter(e => e.time < totalSecs)
      .map(e => ({ ...e, velocity: Math.min(1, e.velocity * (0.6 + 0.4 * variation)) }));

    // Merge: replace existing drums, blend lead with some sparsity
    const nonDrums = arranged.events.filter(e => e.track !== 'drums');
    // thin lead to avoid clutter
    lead = lead.filter((_, idx) => idx % (variation > 0.5 ? 1 : 2) === 0);
    const merged: NoteEvent[] = [...nonDrums, ...drumEvents, ...lead];
    merged.sort((a, b) => a.time - b.time);
    return { events: merged, meta: { ...arranged.meta, style: params.style, variation } };
  } catch {
    return arranged; // graceful fallback
  }
}
