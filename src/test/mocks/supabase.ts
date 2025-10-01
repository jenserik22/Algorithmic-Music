type Row = Record<string, unknown> & { id?: string };

export function createSupabaseClientMock() {
  const tables: Record<string, Row[]> = {};
  return {
    from(name: string) {
      tables[name] ||= [];
      return {
        insert: async (rows: Row | Row[]) => {
          const arr = Array.isArray(rows) ? rows : [rows];
          tables[name].push(...arr);
          return { data: arr, error: null };
        },
        select: async () => ({ data: [...tables[name]], error: null }),
        delete: async () => { tables[name] = []; return { data: null, error: null }; },
      };
    },
  };
}
