import type { NoteEvent, EngineOutput } from '@/lib/music/engines/types';

// Utility: sort by time
export function isSortedByTime(events: NoteEvent[]): boolean {
  const eps = 1e-4; // tolerate sub-millisecond jitter
  for (let i = 1; i < events.length; i++) {
    if (events[i].time + eps < events[i - 1].time) return false;
  }
  return true;
}

export function hasValidRanges(events: NoteEvent[], totalSecs: number): boolean {
  return events.every(e => e.time >= 0 && e.duration >= 0 && e.time + e.duration <= totalSecs + 1e-6 && e.velocity >= 0 && e.velocity <= 1);
}

export function withinTolerance(a: number, b: number, tol = 0.03): boolean {
  return Math.abs(a - b) <= tol;
}

// Compute beat times given bpm and duration
export function beatTimes(bpm: number, totalSecs: number): number[] {
  const beat = 60 / bpm;
  const beats: number[] = [];
  for (let t = 0; t <= totalSecs + 1e-6; t += beat) beats.push(+t.toFixed(6));
  return beats;
}

// Find chord snapshots at each change time (group chord notes by their start time)
export function extractChordBlocks(events: NoteEvent[]): Map<number, number[]> {
  const chords = events.filter(e => e.track === 'chords');
  const byTime = new Map<number, number[]>();
  for (const e of chords) {
    const t = +e.time.toFixed(3);
    const arr = byTime.get(t) ?? [];
    arr.push(e.pitch);
    byTime.set(t, arr);
  }
  return byTime;
}

// For a given time, find the most recent chord block (by start time <= t)
export function chordAtTime(chordBlocks: Map<number, number[]>, t: number): number[] | undefined {
  let bestTime = -Infinity;
  let best: number[] | undefined;
  for (const [ct, notes] of chordBlocks.entries()) {
    if (ct <= t && ct > bestTime) { bestTime = ct; best = notes; }
  }
  return best;
}

// Lead chord-tone hit rate on strong beats (beats 1 & 3 in 4/4)
export function chordToneHitRateStrongBeats(out: EngineOutput, bpm: number): number {
  const beats = beatTimes(bpm, Math.max(out.meta?.bpm ? 60 / out.meta.bpm : 0, out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0)));
  const strongBeatTimes = beats.filter((_, i) => i % 4 === 0 || i % 4 === 2);
  const chordsMap = extractChordBlocks(out.events);
  const lead = out.events.filter(e => e.track === 'lead');

  let total = 0, hits = 0;
  for (const lb of lead) {
    // Find nearest strong beat
    const nearest = strongBeatTimes.reduce((prev, cur) => (Math.abs(cur - lb.time) < Math.abs(prev - lb.time) ? cur : prev), strongBeatTimes[0] ?? 0);
    if (withinTolerance(lb.time, nearest, 0.05)) {
      total += 1;
      const chord = chordAtTime(chordsMap, lb.time);
      if (!chord || chord.length === 0) continue;
      const isTone = chord.some(p => ((p - lb.pitch) % 12 + 12) % 12 === 0);
      if (isTone) hits += 1;
    }
  }
  return total === 0 ? 0 : hits / total;
}

// Average voice-leading movement (approx): pair chord blocks by nearest pitches
export function averageVoiceLeadingMovement(out: EngineOutput): number {
  const chordsMap = extractChordBlocks(out.events);
  const times = Array.from(chordsMap.keys()).sort((a, b) => a - b);
  if (times.length < 2) return 0;
  let total = 0, transitions = 0;
  for (let i = 1; i < times.length; i++) {
    const prev = (chordsMap.get(times[i - 1]) ?? []).slice().sort((a, b) => a - b);
    const cur = (chordsMap.get(times[i]) ?? []).slice().sort((a, b) => a - b);
    if (prev.length === 0 || cur.length === 0) continue;
    // Greedy nearest assignment
    const used = new Set<number>();
    let move = 0;
    for (const p of prev) {
      let bestIdx = -1; let bestDist = Infinity;
      for (let j = 0; j < cur.length; j++) {
        if (used.has(j)) continue;
        const d = Math.abs(cur[j] - p);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      if (bestIdx >= 0) { used.add(bestIdx); move += bestDist; }
    }
    const voices = Math.min(prev.length, cur.length) || 1;
    total += move / voices;
    transitions += 1;
  }
  return transitions === 0 ? 0 : total / transitions;
}

// Count collisions: number of windows where > N events start within window
export function collisionCount(events: NoteEvent[], windowMs = 30, threshold = 2): number {
  const win = windowMs / 1000;
  let count = 0;
  for (let i = 0; i < events.length; i++) {
    const t0 = events[i].time;
    let n = 1;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].time - t0 <= win) n++; else break;
    }
    if (n > threshold) count++;
  }
  return count;
}

// Backbeat consistency: % of bars where snare is present near beats 2 & 4
export function backbeatConsistency(out: EngineOutput, bpm: number): number {
  const drums = out.events.filter(e => e.track === 'drums');
  if (drums.length === 0) return 0;
  const beat = 60 / bpm;
  const totalSecs = out.events.reduce((m, e) => Math.max(m, e.time + e.duration), 0);
  const bars = Math.floor(totalSecs / (4 * beat));
  if (bars === 0) return 0;
  let ok = 0, total = 0;
  for (let b = 0; b < bars; b++) {
    total += 1;
    const t2 = b * 4 * beat + 2 * beat;
    const t4 = b * 4 * beat + 4 * beat;
    const has2 = drums.some(d => withinTolerance(d.time, t2, 0.05) && d.pitch === 38);
    const has4 = drums.some(d => withinTolerance(d.time, t4, 0.05) && d.pitch === 38);
    if (has2 && has4) ok += 1;
  }
  return ok / total;
}
