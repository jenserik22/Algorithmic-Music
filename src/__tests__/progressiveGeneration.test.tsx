import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGeneration } from '@/lib/music/useGeneration';
import type { AlgorithmName } from '@/lib/music/engines';

function Harness({ alg = 'euclidean' as AlgorithmName }) {
  const { status, progress, output, generateProgressive } = useGeneration();
  const [partials, setPartials] = useState<number>(0);
  const onStart = () => {
    setPartials(0);
    generateProgressive(alg, {
      seed: 1,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 2,
      density: 0.5,
    }, {
      segmentSecs: 0.5,
      onPartial: () => setPartials((n: number) => n + 1),
    }).catch(() => {});
  };
  return (
    <div>
      <div aria-label="status">{status}</div>
      <div aria-label="progress">{progress}</div>
      {output && <div aria-label="done">done</div>}
      <div aria-label="partials">{partials}</div>
      <button onClick={onStart}>Start</button>
    </div>
  );
}

describe('progressive generation', () => {
  it('emits partial slices before completion', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByLabelText('status').textContent).toBe('generating');
    const done = await screen.findByLabelText('done', undefined, { timeout: 1500 });
    expect(done).toBeInTheDocument();
    const partialCount = Number(screen.getByLabelText('partials').textContent);
    expect(partialCount).toBeGreaterThanOrEqual(1);
    expect(Number(screen.getByLabelText('progress').textContent)).toBe(100);
  });
});
