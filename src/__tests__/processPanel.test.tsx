import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessPanel } from '@/components/ProcessPanel';

describe('ProcessPanel', () => {
  it('shows counts per track when visible', () => {
    const out = { events: [
      { time: 0, duration: 0.2, pitch: 60, velocity: 0.8, track: 'chords' },
      { time: 0.2, duration: 0.2, pitch: 62, velocity: 0.8, track: 'lead' },
      { time: 0.4, duration: 0.2, pitch: 36, velocity: 1.0, track: 'drums' },
      { time: 0.6, duration: 0.2, pitch: 42, velocity: 0.8, track: 'drums' },
    ] } as any;
    render(<ProcessPanel visible output={out} algorithm="markov" params={{ bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 4, density: 0.5, seed: 1 }} />);
    expect(screen.getByLabelText(/process/i)).toBeInTheDocument();
  });
});
