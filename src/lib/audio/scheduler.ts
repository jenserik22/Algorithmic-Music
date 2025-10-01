import type { EngineOutput, NoteEvent } from '@/lib/music/engines/types';

export interface ScheduledEvent extends NoteEvent { id: string }

export function buildSchedule(out: EngineOutput): ScheduledEvent[] {
  // Deterministically derive ids based on time+pitch to make snapshot-friendly
  return out.events
    .slice()
    .sort((a, b) => a.time - b.time)
    .map((e, i) => ({ ...e, id: `${e.time.toFixed(4)}_${e.pitch}_${i}` }));
}
