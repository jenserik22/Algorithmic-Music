import { useEffect } from 'react';

function isTestOrSSR() {
  if (typeof window === 'undefined') return true;
  const ua = (window.navigator && window.navigator.userAgent) || '';
  return /jsdom|vitest/i.test(ua);
}

export function useIdlePreload() {
  useEffect(() => {
    if (isTestOrSSR()) return;
    const idle = (cb: () => void) => {
      const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
      if (ric) ric(cb); else setTimeout(cb, 500);
    };
    const toneName = 'tone';
    const magName = '@magenta/music';
    idle(() => { import(/* @vite-ignore */ (toneName as any)).catch(() => {}); });
    idle(() => { import(/* @vite-ignore */ (magName as any)).catch(() => {}); });
  }, []);
}

export default useIdlePreload;
