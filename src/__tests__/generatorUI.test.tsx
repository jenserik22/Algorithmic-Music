import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratorUI } from '../components/GeneratorUI';

describe('GeneratorUI (Simple/Advanced with presets)', () => {
  it('renders Simple mode by default and allows preset selection', () => {
    render(<GeneratorUI onGenerate={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /simple mode/i })).toBeInTheDocument();
    const preset = screen.getByLabelText(/preset/i) as HTMLSelectElement;
    expect(preset.value).toBe('upbeat');
  });

  it('switching to Advanced shows detailed controls', () => {
    render(<GeneratorUI onGenerate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
    expect(screen.getByRole('heading', { name: /advanced mode/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/bpm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
  });

  it('preset selection populates parameters and generate invokes callback with params', () => {
    const onGenerate = vi.fn();
    render(<GeneratorUI onGenerate={onGenerate} />);
    // Select preset "ambient"
    fireEvent.change(screen.getByLabelText(/preset/i), { target: { value: 'ambient' } });
    // Switch to Advanced to read fields
    fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
    expect((screen.getByLabelText(/bpm/i) as HTMLInputElement).value).toBe('70');
    expect((screen.getByLabelText(/key/i) as HTMLSelectElement).value).toBe('Am');

    // Change algorithm and generate
    fireEvent.change(screen.getByLabelText(/algorithm/i), { target: { value: 'markov' } });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
    const arg = onGenerate.mock.calls[0][0];
    expect(arg.algorithm).toBe('markov');
    expect(arg.params.bpm).toBe(70);
    expect(arg.params.key).toBe('Am');
  });
});
