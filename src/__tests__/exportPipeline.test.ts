import { describe, it, expect, vi } from 'vitest';
import { exportTrack, buildFilename } from '@/lib/export/pipeline';
import { zipFiles } from '@/lib/export/settings';

const out = { events: [ { time: 0, pitch: 60, duration: 0.1, velocity: 0.9 } ] };

describe('Export pipeline', () => {
  it('exports multiple formats with filenames and progress', async () => {
    const onProgress = vi.fn();
    const res = await exportTrack(out, { formats: ['wav','mp3','ogg','flac'], filenameTemplate: '{algorithm}_{seed}.{ext}', algorithm: 'markov', seed: 42, onProgress });
    expect(res.map(r => r.format)).toEqual(['wav','mp3','ogg','flac']);
    expect(res[0].blob.type).toBe('audio/wav');
    expect(res[1].blob.type).toBe('audio/mpeg');
    expect(res[2].blob.type).toBe('audio/ogg');
    expect(res[3].blob.type).toBe('audio/flac');
    expect(res[0].filename).toBe('markov_42.wav');
    expect(onProgress).toHaveBeenCalled();
  });

  it('buildFilename falls back to default template', () => {
    expect(buildFilename(undefined, 'stochastic', 1, 'wav')).toBe('stochastic_1.wav');
  });

  it('supports cancel via AbortSignal', async () => {
    const c = new AbortController();
    c.abort();
    await expect(exportTrack(out, { formats: ['wav'], algorithm: 'markov', seed: 1, signal: c.signal })).rejects.toThrow('cancelled');
  });

  it('creates a placeholder zip with manifest', async () => {
    const res = await exportTrack(out, { formats: ['wav','mp3'], algorithm: 'markov', seed: 1 });
    const zip = zipFiles(res.map(r => ({ name: r.filename, blob: r.blob })));
    expect(zip.type).toBe('application/zip');
  });
});
