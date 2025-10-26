import type { AdaptiveBiasProfile, NoteEvent } from './types';

const MEM: Record<string, AdaptiveBiasProfile> = {};

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getAdaptiveProfile(id: string): AdaptiveBiasProfile | undefined {
  if (!id) return undefined;
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(`adaptiveProfile:${id}`);
    if (!raw) return undefined;
    try { return JSON.parse(raw) as AdaptiveBiasProfile; } catch { return undefined; }
  }
  return MEM[id];
}

export function saveAdaptiveProfile(id: string, profile: AdaptiveBiasProfile): void {
  if (!id) return;
  if (hasLocalStorage()) {
    try { window.localStorage.setItem(`adaptiveProfile:${id}`, JSON.stringify(profile)); } catch {}
    return;
  }
  MEM[id] = profile;
}

// Optional helper: derive a lightweight profile from events
export function learnFromEvents(prev: AdaptiveBiasProfile | undefined, events: NoteEvent[], bpm = 120): AdaptiveBiasProfile {
  const out: AdaptiveBiasProfile = {
    leadInterval2: { ...(prev?.leadInterval2 ?? {}) },
    hatPos16: prev?.hatPos16 ? [...prev.hatPos16] : Array.from({ length: 16 }, () => 0),
  };

  // Lead semitone deltas (clamped to [-6..6])
  const lead = events.filter(e => e.track === 'lead').sort((a,b)=>a.time-b.time);
  for (let i = 1; i < lead.length; i++) {
    const d = Math.max(-6, Math.min(6, Math.round((lead[i].pitch - lead[i-1].pitch))))
    const k = String(d);
    out.leadInterval2![k] = (out.leadInterval2![k] ?? 0) + 1;
  }

  // Hat positions per 16th (simple quantization)
  const beat = 60 / bpm; const sixteenth = beat / 4;
  for (const e of events) {
    if (e.track !== 'drums') continue;
    if (e.pitch !== 42) continue; // closed hat
    const barStart = Math.floor(e.time / (4 * beat)) * (4 * beat);
    const pos = Math.round((e.time - barStart) / sixteenth) % 16;
    out.hatPos16![pos] = (out.hatPos16![pos] ?? 0) + 1;
  }

  return out;
}
