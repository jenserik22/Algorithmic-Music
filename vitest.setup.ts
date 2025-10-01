import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
expect.extend(matchers as any);

// Ensure test DOM is cleaned between tests to avoid duplicate elements
afterEach(() => {
  cleanup();
});
