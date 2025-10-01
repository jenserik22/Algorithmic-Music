import { describe, it, expect } from 'vitest';
import { buildSchedule } from '../lib/audio/scheduler';

describe('audio scheduler prototype', () => {
  const sample = {
    events: [
      { time: 0.25, pitch: 64, duration: 0.25, velocity: 0.8 },
      { time: 0, pitch: 60, duration: 0.5, velocity: 0.7 },
      { time: 0.5, pitch: 67, duration: 0.25, velocity: 0.85 },
    ],
  };
  it('sorts by time and assigns deterministic ids', () => {
    const a = buildSchedule(sample);
    const b = buildSchedule(sample);
    expect(a).toEqual(b);
    expect(a.map(e => e.time)).toEqual([0, 0.25, 0.5]);
    expect(a[0].id).toContain('0.0000_60_');
  });
});
