import { describe, it, expect } from 'vitest';
import { colors, lightTheme, darkTheme } from '../styles/tokens';

describe('design tokens', () => {
  it('exports base colors and themes', () => {
    expect(colors.primary).toMatch(/^#/);
    expect(lightTheme.bg).not.toBe(darkTheme.bg);
  });
});
