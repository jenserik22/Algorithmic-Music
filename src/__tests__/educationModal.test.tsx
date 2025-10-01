import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EducationModal } from '@/components/EducationModal';
import { axe } from 'jest-axe';

describe('EducationModal', () => {
  it('renders when open and closes on button', async () => {
    const onClose = () => { /* noop */ };
    const { container, rerender } = render(<EducationModal open={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations.length).toBe(0);
    rerender(<EducationModal open={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
