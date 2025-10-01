import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryHistoryAdapter } from '../lib/storage/history/memory';
import type { GenerationParams } from '../lib/music/engines/types';

describe('MemoryHistoryAdapter', () => {
  let adapter: MemoryHistoryAdapter;
  const params: GenerationParams = { seed: 1, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5 };

  beforeEach(() => {
    adapter = new MemoryHistoryAdapter(20);
  });

  it('adds records and enforces 20-item cap with newest-first ordering', async () => {
    for (let i = 0; i < 25; i++) {
      await adapter.add({ algorithm: 'markov', params, createdAt: 1000 + i });
    }
    const list = await adapter.list();
    const { count, saturated } = await adapter.count();
    expect(count).toBe(20);
    expect(saturated).toBe(true);
    expect(list.length).toBe(20);
    // newest-first -> createdAt from 1024 down to 1005
    expect(list[0].createdAt).toBe(1000 + 24);
    expect(list[list.length - 1].createdAt).toBe(1000 + 5);
  });

  it('get/remove/clear work as expected', async () => {
    const a = await adapter.add({ algorithm: 'stochastic', params, createdAt: 2000 });
    const b = await adapter.add({ algorithm: 'euclidean', params, createdAt: 2001 });
    const got = await adapter.get(a.id);
    expect(got?.algorithm).toBe('stochastic');

    await adapter.remove(a.id);
    const afterRemove = await adapter.get(a.id);
    expect(afterRemove).toBeUndefined();

    const listBeforeClear = await adapter.list();
    expect(listBeforeClear.length).toBe(1);
    await adapter.clear();
    const listAfterClear = await adapter.list();
    expect(listAfterClear.length).toBe(0);
  });
});
