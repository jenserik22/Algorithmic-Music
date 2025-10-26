 export type Register = [number, number];
 
 function clamp(p: number, lo: number, hi: number) {
   while (p < lo) p += 12;
   while (p > hi) p -= 12;
   return p;
 }
 
 export function roleIntervals(quality: 'major' | 'minor' | 'diminished' | 'dominant7' | 'minor7' | 'major7'): number[] {
   switch (quality) {
     case 'major': return [0, 4, 7];
     case 'minor': return [0, 3, 7];
     case 'diminished': return [0, 3, 6];
     case 'dominant7': return [0, 4, 7, 10];
     case 'minor7': return [0, 3, 7, 10];
     case 'major7':
     default: return [0, 4, 7, 11];
   }
 }
 
export function roleOf(pitch: number, rootMidi: number, quality: 'major' | 'minor' | 'diminished' | 'dominant7' | 'minor7' | 'major7'): 'root' | 'third' | 'fifth' | 'seventh' {
  const r = (((pitch - rootMidi) % 12) + 12) % 12;
   const ints = roleIntervals(quality).map(i => (i + 120) % 12);
   if (r === ints[0]) return 'root';
   if (r === ints[1]) return 'third';
   if (r === ints[2]) return 'fifth';
   return 'seventh';
 }
 
 function average(xs: number[]): number {
   if (xs.length === 0) return 60;
   return xs.reduce((a,b)=>a+b,0) / xs.length;
 }
 
 function buildBaseVoicing(rootMidi: number, quality: Parameters<typeof roleIntervals>[0], voices: number, center: number, reg: Register): number[] {
   const ints = roleIntervals(quality).slice(0, voices);
   // Choose octave so that mean of the stack is near center
   const stack = ints.map(i => rootMidi + i);
   const stackMean = (stack[0] + stack[stack.length - 1]) / 2;
   let shiftOct = Math.round((center - stackMean) / 12);
   let v = stack.map(n => n + shiftOct * 12);
   // Fold into register while preserving ordering
   v = v.map((n, i) => clamp(n, reg[0] + i * 0, reg[1] - (voices - 1 - i) * 0));
   // Ensure strictly non-decreasing (avoid crossing by octave adjustment)
   for (let i = 1; i < v.length; i++) {
     while (v[i] < v[i-1]) v[i] += 12;
   }
   // Second pass clamp
   for (let i = 0; i < v.length; i++) v[i] = clamp(v[i], reg[0], reg[1]);
   return v;
 }
 
 function totalDistance(a: number[], b: number[]): number {
   const n = Math.min(a.length, b.length);
   let s = 0;
   for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
   return s;
 }
 
 // Deterministic, order-preserving assignment minimizing movement.
 export function assignCloseVoicing(prev: number[] | undefined, rootMidi: number, quality: Parameters<typeof roleIntervals>[0], voices: number, reg: Register): number[] {
   const center = prev && prev.length > 0 ? average(prev) : (reg[0] + reg[1]) / 2;
   // Try a small neighborhood of octave shifts to reduce L1 distance
   const candidates: number[][] = [];
   for (let k = -1; k <= 1; k++) {
     const base = buildBaseVoicing(rootMidi + 12 * k, quality, voices, center, reg);
     candidates.push(base);
   }
   if (!prev || prev.length === 0) {
     // Sort bass→treble
     return candidates[1].slice().sort((a,b)=>a-b);
   }
   // Normalize prev sorted
   const p = prev.slice().sort((a,b)=>a-b);
   // Compute nearest transposition per candidate to align medians
   let best: number[] = candidates[0];
   let bestCost = Infinity;
   for (const cand of candidates) {
     // Allow an integer octave shift that best aligns
     const diffs = cand.map((n,i)=> p[i] - n);
     const med = diffs.sort((a,b)=>a-b)[Math.floor(diffs.length/2)];
     const kOct = Math.round(med / 12);
     const shifted = cand.map(n => n + kOct * 12);
     // Enforce order and range
     for (let i = 1; i < shifted.length; i++) {
       while (shifted[i] < shifted[i-1]) shifted[i] += 12;
     }
     const clamped = shifted.map(n => clamp(n, reg[0], reg[1]));
     const cost = totalDistance(p, clamped);
     if (cost < bestCost) { bestCost = cost; best = clamped; }
   }
   return best.slice().sort((a,b)=>a-b);
 }
 
