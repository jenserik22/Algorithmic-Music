import { describe, it, expect } from 'vitest';
import { getTrending } from '@/lib/supabase/metrics';

describe('getTrending', () => {
  it('returns empty when no supabase client', async () => {
    const res = await getTrending(undefined);
    expect(res.topAlgorithms).toEqual([]);
  });

  it('aggregates top algorithms', async () => {
    const mock = {
      from: () => ({
        select: async () => ({
          data: [
            { algorithm: 'euclidean', created_at: new Date().toISOString() },
            { algorithm: 'markov', created_at: new Date().toISOString() },
            { algorithm: 'euclidean', created_at: new Date().toISOString() },
          ],
          error: null,
        }),
      }),
    } as any;
    const res = await getTrending(mock, 7);
    expect(res.topAlgorithms[0]).toEqual({ algorithm: 'euclidean', count: 2 });
    expect(res.topAlgorithms[1]).toEqual({ algorithm: 'markov', count: 1 });
  });
});
