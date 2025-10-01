import { describe, it, expect } from 'vitest';
import { MemoryHistoryAdapter } from '../lib/storage/history/memory';
import type { GenerationParams } from '../lib/music/engines/types';
import { migrateLocalHistoryToSupabase, type SupabaseLike } from '../lib/storage/sync';
import { createSupabaseClientMock } from '../test/mocks/supabase';

describe('history migration to Supabase', () => {
  it('inserts non-duplicate records and skips duplicates', async () => {
    const params: GenerationParams = { seed: 1, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5 };
    const adapter = new MemoryHistoryAdapter(20);
    // Two local records, second is duplicate by seed+createdAt
    await adapter.add({ algorithm: 'markov', params, createdAt: 1000 });
    await adapter.add({ algorithm: 'markov', params, createdAt: 1000 });

    const supa = createSupabaseClientMock();
    const result = await migrateLocalHistoryToSupabase(adapter, supa as unknown as SupabaseLike, 'u');
    expect(result.inserted).toBe(1); // dedup local duplicates
    const sel = await supa.from('generations').select();
    expect(sel.data?.length).toBe(1);
  });
});
