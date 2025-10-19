// Minimal deterministic PRNG (Mulberry32)
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rand: () => number, min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randomFloat(rand: () => number, min: number, max: number) {
  return rand() * (max - min) + min;
}

// Box–Muller transform for deterministic Gaussian sampling using provided PRNG
export function gaussian01(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z; // mean 0, stdev 1
}

// Truncated Gaussian jitter helper: sigma sets spread, clampAbs limits extremes
export function gaussianJitter(rand: () => number, sigma: number, clampAbs: number): number {
  if (sigma <= 0) return 0;
  // Rejection sampling to keep within [-clampAbs, clampAbs]
  for (let i = 0; i < 8; i++) {
    const z = gaussian01(rand) * sigma;
    if (Math.abs(z) <= clampAbs) return z;
  }
  // Fallback: hard clamp extreme
  const z = gaussian01(rand) * sigma;
  return Math.max(-clampAbs, Math.min(clampAbs, z));
}
