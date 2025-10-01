import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaybackControls } from '@/components/PlaybackControls';

const sampleOut = { events: [
  { time: 0, pitch: 60, duration: 0.1, velocity: 0.8 },
  { time: 0.2, pitch: 64, duration: 0.1, velocity: 0.8 },
] };

describe('PlaybackControls', () => {
  it('play/pause/stop state progression', async () => {
    render(<PlaybackControls output={sampleOut} />);
    expect(screen.getByLabelText('playback-status').textContent).toBe('stopped');
    fireEvent.click(screen.getByText('Play'));
    expect(screen.getByLabelText('playback-status').textContent).toBe('playing');
    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByLabelText('playback-status').textContent).toBe('paused');
    fireEvent.click(screen.getByText('Stop'));
    expect(screen.getByLabelText('playback-status').textContent).toBe('stopped');
  });
});
