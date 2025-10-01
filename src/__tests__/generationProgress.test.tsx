import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGeneration } from '@/lib/music/useGeneration';
import type { AlgorithmName } from '@/lib/music/engines';

function Harness({ alg = 'stochastic' }: { alg?: Extract<AlgorithmName, 'stochastic'> }) {
  const { status, progress, error, output, generate, cancel } = useGeneration();
  const onStart = () => {
    // swallow cancellation errors to avoid unhandled rejections in tests
    generate(alg as AlgorithmName, {
      seed: 1,
      bpm: 120,
      key: 'C',
      timeSignature: '4/4',
      durationSecs: 1,
      density: 0.5,
    }).catch(() => {});
  };
  return (
    <div>
      <div aria-label="status">{status}</div>
      <div aria-label="progress">{progress}</div>
      {error && <div role="alert">{error}</div>}
      {output && <div aria-label="done">done</div>}
      <button onClick={onStart}>Start</button>
      <button onClick={cancel}>Cancel</button>
    </div>
  );
}

describe('useGeneration progress, cancel, and retry-once', () => {
  it('updates progress and resolves with output', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByLabelText('status').textContent).toBe('generating');

    expect(await screen.findByLabelText('done', undefined, { timeout: 1500 })).toBeInTheDocument();
    expect(Number(screen.getByLabelText('progress').textContent)).toBeGreaterThanOrEqual(99);
    expect(screen.getByLabelText('status').textContent).toBe('success');
  });

  it('supports cancel to stop generation', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Start'));
    await new Promise((r) => setTimeout(r, 50));
    fireEvent.click(screen.getByText('Cancel'));
    // After cancel, status returns to idle and no done indicator should appear
    expect(screen.getByLabelText('status').textContent).toBe('idle');
    expect(Number(screen.getByLabelText('progress').textContent)).toBe(0);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByLabelText('done')).toBeNull();
  });

  it('retries once on failure and then succeeds', async () => {
    // Mock engines to throw first, then succeed
    let calls = 0;
    vi.doMock('@/lib/music/engines', () => ({
      getEngine: () => ({
        name: 'stochastic',
        generate: () => {
          calls += 1;
          if (calls === 1) throw new Error('boom');
          return { events: [] };
        },
      }),
    }));
    // Re-require the hook now that engines is mocked
    const { useGeneration: mockedHook } = await import('@/lib/music/useGeneration');
    function H2() {
      const { status, progress, output, generate } = mockedHook();
      return (
        <div>
          <div aria-label="status">{status}</div>
          <div aria-label="progress">{progress}</div>
          {output && <div aria-label="done">done</div>}
          <button onClick={() => generate('stochastic' as AlgorithmName, { seed: 1, bpm: 120, key: 'C', timeSignature: '4/4', durationSecs: 1, density: 0.5 }).catch(() => {})}>Start</button>
        </div>
      );
    }
    render(<H2 />);
    fireEvent.click(screen.getByText('Start'));
    expect(await screen.findByLabelText('done', undefined, { timeout: 1500 })).toBeInTheDocument();
    expect(screen.getByLabelText('status').textContent).toBe('success');
  });
});
