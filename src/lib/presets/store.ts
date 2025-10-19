import type { Settings } from '@/lib/export/settings';

const KEY = 'am_presets';
const LEGACY_KEYS = ['algo_music_presets', 'algorithmic_music_presets'];

export type Preset = { name: string; settings: Settings };

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Preset[];
      return Array.isArray(arr) ? arr : [];
    }
    // Fallback to legacy keys (one-time soft migration; do not overwrite if KEY already present)
    for (const k of LEGACY_KEYS) {
      const legacyRaw = localStorage.getItem(k);
      if (legacyRaw) {
        try {
          const arr = JSON.parse(legacyRaw) as Preset[] | any[];
          const list = Array.isArray(arr)
            ? arr.map((x: any) => (x && typeof x.name === 'string' && x.settings ? x : null)).filter(Boolean) as Preset[]
            : [];
          if (list.length) {
            // Write migrated copy under new key (keep legacy intact)
            localStorage.setItem(KEY, JSON.stringify(list));
            return list;
          }
        } catch { /* ignore */ }
      }
    }
    return [];
  } catch { return []; }
}

function write(list: Preset[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export function listPresets(): Preset[] { return read(); }

export function savePreset(name: string, settings: Settings) {
  const list = read();
  const idx = list.findIndex(p => p.name === name);
  if (idx >= 0) list[idx] = { name, settings }; else list.push({ name, settings });
  write(list);
}

export function deletePreset(name: string) {
  write(read().filter(p => p.name !== name));
}
