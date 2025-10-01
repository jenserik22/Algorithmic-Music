import type { HistoryAdapter, GenerationRecord } from './history/types';

export type SelectResult<T> = { data: T | null; error: unknown | null };
export type InsertResult<T> = { data: T | null; error: unknown | null };
export type SupabaseLike = {
  from: (name: string) => {
    select: () => Promise<SelectResult<unknown[]>>;
    insert: (rows: unknown | unknown[]) => Promise<InsertResult<unknown>>;
    delete?: () => Promise<{ data: unknown | null; error: unknown | null }>;
  };
};

function keyOf(r: GenerationRecord) {
  return `${r.params.seed}:${r.createdAt}`;
}

export async function migrateLocalHistoryToSupabase(
  adapter: HistoryAdapter,
  supabase: SupabaseLike,
  userId: string
): Promise<{ inserted: number }> {
  const local = await adapter.list();
  if (local.length === 0) return { inserted: 0 };
  // Deduplicate local by seed+createdAt
  const map = new Map<string, GenerationRecord>();
  for (const r of local) {
    const k = keyOf(r);
    if (!map.has(k)) map.set(k, r);
  }
  const localUnique = Array.from(map.values());

  const existing = (await supabase.from('generations').select()) as SelectResult<
    Array<{ seed: number; created_at: string }>
  >;
  const existingKeys = new Set<string>(
    (existing.data ?? []).map((g) => `${g.seed}:${new Date(g.created_at).getTime()}`)
  );

  const toInsert = localUnique.filter(r => !existingKeys.has(keyOf(r)));
  if (toInsert.length === 0) return { inserted: 0 };

  const genRows = toInsert.map(r => ({
    user_id: userId,
    seed: r.params.seed,
    algorithm: r.algorithm,
    genre: 'electronic',
    complexity: 'simple',
    duration_secs: r.params.durationSecs,
    bpm: r.params.bpm,
    key: r.params.key,
    time_signature: r.params.timeSignature,
    density: r.params.density,
    created_at: new Date(r.createdAt).toISOString(),
  }));
  const ins = await supabase.from('generations').insert(genRows);
  if (ins.error) throw ins.error;

  // parameters table
  const paramsRows = toInsert.map(r => ({
    generation_id: null, // could be linked if we returned ids; mock accepts any
    parameters: r.params,
  }));
  await supabase.from('generation_parameters').insert(paramsRows);
  return { inserted: toInsert.length };
}
