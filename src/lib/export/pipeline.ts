import type { EngineOutput } from '@/lib/music/engines/types';

export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'flac';

export interface ExportOptions {
  formats: AudioFormat[];
  filenameTemplate?: string; // e.g., "{algorithm}_{seed}.{ext}"
  algorithm: string;
  seed: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

function blobOf(type: string, content: unknown): Blob {
  return new Blob([JSON.stringify(content)], { type });
}

export async function encode(format: AudioFormat, out: EngineOutput): Promise<Blob> {
  const content = { format, events: out.events.length };
  const type = format === 'wav' ? 'audio/wav'
    : format === 'mp3' ? 'audio/mpeg'
    : format === 'ogg' ? 'audio/ogg'
    : 'audio/flac';
  return blobOf(type, content);
}

export function buildFilename(tpl: string | undefined, algorithm: string, seed: number, ext: string) {
  const base = tpl || '{algorithm}_{seed}.{ext}';
  return base.replace('{algorithm}', algorithm).replace('{seed}', String(seed)).replace('{ext}', ext);
}

export async function exportTrack(out: EngineOutput, opts: ExportOptions) {
  const total = opts.formats.length;
  const results: { format: AudioFormat; blob: Blob; filename: string }[] = [];
  for (let i = 0; i < opts.formats.length; i++) {
    const f = opts.formats[i];
    if (opts.signal?.aborted) throw new Error('cancelled');
    const b = await encode(f, out);
    const filename = buildFilename(opts.filenameTemplate, opts.algorithm, opts.seed, f);
    results.push({ format: f, blob: b, filename });
    if (opts.onProgress) opts.onProgress(Math.floor(((i + 1) / total) * 100));
  }
  return results;
}
