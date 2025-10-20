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

// Polyfill window.matchMedia for jsdom environment used in tests
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as MediaQueryList;
  };
}

// Stub canvas getContext for jsdom
if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
  const proto = window.HTMLCanvasElement.prototype as unknown as {
    getContext?: (contextId: string, options?: unknown) => unknown;
  };
  Object.defineProperty(proto, 'getContext', {
    configurable: true,
    writable: true,
    value: () => {
      return {
        // minimal 2D context stub used by our components
        clearRect: () => {},
        fillRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(0) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Uint8ClampedArray(0) }),
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        closePath: () => {},
        measureText: () => ({ width: 0 })
      } as unknown;
    }
  });
}
