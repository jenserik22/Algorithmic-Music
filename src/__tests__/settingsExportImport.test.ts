import { describe, it, expect } from 'vitest';
import { serializeSettingsToJSON, parseSettingsFromJSON, encodeToURL, decodeFromURL, type Settings } from '@/lib/export/settings';

describe('Settings export/import', () => {
  it('round-trips JSON', () => {
    const s: Settings = { bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5, algorithm: 'markov', seed: 1 };
    const json = serializeSettingsToJSON(s);
    const back = parseSettingsFromJSON(json);
    expect(back).toEqual(s);
  });

  it('round-trips URL token', () => {
    const s: Settings = { bpm: 90, key: 'Am', timeSignature: '3/4', durationSecs: 5, density: 0.3, algorithm: 'stochastic', seed: 7 };
    const token = encodeToURL(s);
    const back = decodeFromURL(token);
    expect(back).toEqual(s);
  });
});
