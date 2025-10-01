import type { Settings } from '@/lib/export/settings';

const KEY = 'am_presets';

export type Preset = { name: string; settings: Settings };

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Preset[];
    return Array.isArray(arr) ? arr : [];
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
