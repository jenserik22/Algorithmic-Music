import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Do not throw to avoid breaking unit tests; consumers should handle undefined client gracefully.
  console.warn('Supabase env not set: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = url && anonKey ? createClient(url, anonKey) : undefined;
