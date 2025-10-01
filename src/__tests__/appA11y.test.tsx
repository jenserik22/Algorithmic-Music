import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from '../App';

describe('App accessibility', () => {
  it('has no obvious a11y violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  });
});
