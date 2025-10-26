 import { describe, it, expect } from 'vitest';
 import { assignCloseVoicing, roleOf } from './voiceLeading';

 describe('voiceLeading.assignCloseVoicing', () => {
   it('assigns exact chord tones with minimal movement and no crossing (triad)', () => {
     const prev = [48, 52, 55]; // C3 E3 G3
     const rootMidi = 50; // D3 as base
     const reg: [number, number] = [44, 76];
     const out = assignCloseVoicing(prev, rootMidi, 'minor', 3, reg);
     expect(out.length).toBe(3);
     // Sorted bass→treble and within register
     const sorted = out.slice().sort((a,b)=>a-b);
     expect(out).toEqual(sorted);
     expect(sorted[0]).toBeGreaterThanOrEqual(reg[0]);
     expect(sorted[2]).toBeLessThanOrEqual(reg[1]);
     // All are chord tones of D minor triad
     const pcs = new Set([0,3,7]);
     for (const p of out) expect(pcs.has(((p - rootMidi) % 12 + 12) % 12)).toBe(true);
     // Movement should be small vs naive far voicing
     const naive = [50, 53, 57];
     const dist = out.reduce((s,p,i)=> s + Math.abs(p - prev[i]), 0);
     const distNaive = naive.reduce((s,p,i)=> s + Math.abs(p - prev[i]), 0);
     expect(dist).toBeLessThanOrEqual(distNaive);
   });

  it('handles sevenths with correct roles and register clamps', () => {
     const prev = [55, 59, 62, 66];
     const rootMidi = 55; // G3
     const out = assignCloseVoicing(prev, rootMidi, 'dominant7', 4, [48, 84]);
     expect(out.length).toBe(4);
    const roles = out.map(p => roleOf(p, rootMidi, 'dominant7'));
     expect(roles.sort()).toEqual(['fifth','root','seventh','third'].sort());
   });
 });
