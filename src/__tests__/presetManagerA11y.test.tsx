import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PresetManager } from '@/components/PresetManager';

describe('PresetManager a11y', () => {
  it('has no major accessibility violations', async () => {
    const { container } = render(<PresetManager current={null} onApply={() => {}} />);
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
  });
});
