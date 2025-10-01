import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbHistoryAdapter } from '../lib/storage/history/indexeddb';
import type { GenerationParams } from '../lib/music/engines/types';

describe('IndexedDbHistoryAdapter', () => {
  const params: GenerationParams = { seed: 2, bpm: 110, key: 'D', timeSignature: '4/4', durationSecs: 5, density: 0.4 };
  let adapter: IndexedDbHistoryAdapter;

  beforeEach(async () => {
    // use unique db per test run to avoid cross-test interference
    adapter = new IndexedDbHistoryAdapter(`algo_music_history_test_${Math.random().toString(36).slice(2, 8)}`, 20);
    await adapter.clear();
  });

  it('adds records and enforces cap + ordering', async () => {
    for (let i = 0; i < 25; i++) {
      await adapter.add({ algorithm: 'cellular_automata', params, createdAt: 5000 + i });
    }
    const list = await adapter.list();
    const { count, saturated } = await adapter.count();
    expect(count).toBe(20);
    expect(saturated).toBe(true);
    expect(list.length).toBe(20);
    expect(list[0].createdAt).toBe(5000 + 24);
    expect(list[list.length - 1].createdAt).toBe(5000 + 5);
  });

  it('get/remove/clear operations work', async () => {
    const rec = await adapter.add({ algorithm: 'markov', params, createdAt: 6000 });
    const found = await adapter.get(rec.id);
    expect(found?.algorithm).toBe('markov');

    await adapter.remove(rec.id);
    const notFound = await adapter.get(rec.id);
    expect(notFound).toBeUndefined();

    // add some then clear
    await adapter.add({ algorithm: 'stochastic', params, createdAt: 6001 });
    await adapter.add({ algorithm: 'euclidean', params, createdAt: 6002 });
    const before = await adapter.list();
    expect(before.length).toBe(2);
    await adapter.clear();
    const after = await adapter.list();
    expect(after.length).toBe(0);
  });
});
