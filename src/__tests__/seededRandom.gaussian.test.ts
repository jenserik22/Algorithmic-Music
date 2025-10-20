import { describe, test, expect } from 'vitest';
import { mulberry32, gaussianJitter } from '@/lib/music/seededRandom';

function uniformJitter(rand: () => number, clampAbs: number) {
  return (rand() - 0.5) * 2 * clampAbs;
}

describe('gaussian vs uniform jitter', () => {
  test('bounds respected and distribution more central for gaussian', () => {
    const N = 20000;
    const clamp = 1;
    const sigma = 0.25; // narrower than clamp to emphasize central mass

    const rand1 = mulberry32(12345);
    const rand2 = mulberry32(12345); // same seed to keep comparability

    let gMin = Infinity, gMax = -Infinity, uMin = Infinity, uMax = -Infinity;
    let gCenter = 0, uCenter = 0;
    let gExtreme = 0, uExtreme = 0;

    for (let i = 0; i < N; i++) {
      const g = gaussianJitter(rand1, sigma, clamp);
      const u = uniformJitter(rand2, clamp);
      gMin = Math.min(gMin, g); gMax = Math.max(gMax, g);
      uMin = Math.min(uMin, u); uMax = Math.max(uMax, u);
      if (Math.abs(g) < 0.2) gCenter++;
      if (Math.abs(u) < 0.2) uCenter++;
      if (Math.abs(g) > 0.8) gExtreme++;
      if (Math.abs(u) > 0.8) uExtreme++;
    }

    // Bounds respected
    expect(gMin).toBeGreaterThanOrEqual(-clamp);
    expect(gMax).toBeLessThanOrEqual(clamp);
    expect(uMin).toBeGreaterThanOrEqual(-clamp);
    expect(uMax).toBeLessThanOrEqual(clamp);

    // Gaussian concentrates more near center than uniform
    const gCenterFrac = gCenter / N;
    const uCenterFrac = uCenter / N;
    expect(gCenterFrac).toBeGreaterThan(uCenterFrac);

    // Gaussian has fewer extreme values than uniform
    const gExtremeFrac = gExtreme / N;
    const uExtremeFrac = uExtreme / N;
    expect(gExtremeFrac).toBeLessThan(uExtremeFrac);
  });
});
