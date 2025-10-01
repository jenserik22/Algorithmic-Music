import { describe, it, expect } from 'vitest';
import { listPresets, savePreset, deletePreset } from '@/lib/presets/store';

describe('preset store', () => {
  it('saves and lists presets', () => {
    const name = 'TestPreset';
    savePreset(name, { bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 8, density: 0.5, algorithm: 'markov', seed: 1 });
    const list = listPresets();
    expect(list.some(p => p.name === name)).toBe(true);
    deletePreset(name);
    expect(listPresets().some(p => p.name === name)).toBe(false);
  });
});
