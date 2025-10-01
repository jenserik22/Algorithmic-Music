export type SupabaseRPC = {
  from: (name: string) => {
    select: (query?: string) => Promise<{ data: any[] | null; error: unknown | null }>
  };
};

export type Trending = {
  sinceDays: number;
  topAlgorithms: Array<{ algorithm: string; count: number }>;
};

export async function getTrending(supabase: SupabaseRPC | undefined, sinceDays = 7): Promise<Trending> {
  if (!supabase) return { sinceDays, topAlgorithms: [] };
  const sinceISO = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  // Minimal aggregation via client-side group-by. In production, prefer a PostgREST RPC or materialized view.
  const { data, error } = await supabase.from('generations').select();
  if (error || !data) return { sinceDays, topAlgorithms: [] };
  const filtered = (data as Array<{ algorithm?: string; created_at?: string }>).
    filter(r => !r.created_at || r.created_at >= sinceISO);
  const byAlgo = new Map<string, number>();
  for (const r of filtered) {
    const a = (r.algorithm ?? 'unknown').toString();
    byAlgo.set(a, (byAlgo.get(a) ?? 0) + 1);
  }
  const topAlgorithms = Array.from(byAlgo.entries())
    .map(([algorithm, count]) => ({ algorithm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return { sinceDays, topAlgorithms };
}
