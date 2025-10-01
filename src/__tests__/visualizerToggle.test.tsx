import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Visualizer } from '@/components/Visualizer';

describe('Visualizer mode toggle', () => {
  it('toggles between bars and spectrum', () => {
    render(<Visualizer />);
    expect(screen.getByLabelText('visualizer-mode').textContent).toBe('bars');
    fireEvent.click(screen.getByText('Spectrum'));
    expect(screen.getByLabelText('visualizer-mode').textContent).toBe('spectrum');
    fireEvent.click(screen.getByText('Bars'));
    expect(screen.getByLabelText('visualizer-mode').textContent).toBe('bars');
  });
});
