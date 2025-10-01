export interface Settings {
  bpm: number;
  key: string;
  timeSignature: string;
  durationSecs: number;
  density: number;
  algorithm: string;
  seed: number;
}

export function serializeSettingsToJSON(s: Settings): string {
  return JSON.stringify(s);
}

export function parseSettingsFromJSON(json: string): Settings {
  return JSON.parse(json) as Settings;
}

export function encodeToURL(s: Settings): string {
  const json = serializeSettingsToJSON(s);
  return encodeURIComponent(btoa(json));
}

export function decodeFromURL(token: string): Settings {
  const json = atob(decodeURIComponent(token));
  return parseSettingsFromJSON(json);
}

export function zipFiles(files: { name: string; blob: Blob }[]): Blob {
  // Minimal placeholder zip: JSON manifest
  const manifest = files.map(f => ({ name: f.name, size: f.blob.size }));
  return new Blob([JSON.stringify({ files: manifest })], { type: 'application/zip' });
}

export function createSimilarSettings(base: Settings, jitter: Partial<Record<keyof Settings, number>> = {}): Settings {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const rand = (span: number) => (Math.random() * 2 - 1) * span;
  const bpm = clamp(Math.round(base.bpm + rand(jitter.bpm ?? 4)), 40, 220);
  const durationSecs = clamp(Math.round(base.durationSecs + rand(jitter.durationSecs ?? 2)), 2, 600);
  const density = clamp(base.density + rand(jitter.density ?? 0.05), 0, 1);
  const seed = Math.abs(Math.round(base.seed + rand(jitter.seed ?? 1000))) || (base.seed + 1);
  return { ...base, bpm, durationSecs, density, seed };
}

export function buildShareURL(baseUrl: string, s: Settings): string {
  const token = encodeToURL(s);
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}settings=${token}`;
}

// Mapping helpers
import type { GenerationParams } from '@/lib/music/engines/types';

export function fromParams(algorithm: string, params: GenerationParams): Settings {
  return {
    algorithm,
    bpm: params.bpm,
    key: params.key,
    timeSignature: params.timeSignature,
    durationSecs: params.durationSecs,
    density: params.density,
    seed: params.seed,
  };
}

export function toParams(s: Settings): GenerationParams {
  return {
    bpm: s.bpm,
    key: s.key,
    timeSignature: s.timeSignature,
    durationSecs: s.durationSecs,
    density: s.density,
    seed: s.seed,
  } as GenerationParams;
}
