import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ErrorBanner } from '@/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('maps known errors to friendly messages and is accessible', async () => {
    const { container } = render(<ErrorBanner error={'tone_unavailable'} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/audio engine unavailable/i)).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  });
});
