export interface ScheduledNote { time: number; pitch: number; duration: number; velocity: number }

export class FakeAudioContext {
  scheduled: ScheduledNote[] = [];
  currentTime = 0;
  schedule(note: ScheduledNote) { this.scheduled.push(note); }
  flush() { this.scheduled.sort((a, b) => a.time - b.time); return this.scheduled; }
}
