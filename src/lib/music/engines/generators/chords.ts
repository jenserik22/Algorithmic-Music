/**
 * Chord Generator Module
 * 
 * Extracted from enhanced-helix.ts (Week 5 refactoring)
 * Generates chord progressions with voice leading, substitutions, and harmonic rhythm
 */

import type { NoteEvent, SectionConfig, EnhancedSongConfig, ChordProgression } from '../types';
import { assignCloseVoicing, roleOf } from '../voiceLeading';

/**
 * Clamp pitch to register bounds
 */
function clampPitch(p: number, lo = 36, hi = 84) {
  while (p < lo) p += 12;
  while (p > hi) p -= 12;
  return p;
}

/**
 * Get chord notes with inversion
 */
function getChordNotes(root: number, quality: ChordProgression['quality'], inversion = 0): number[] {
  const intervals = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    dominant7: [0, 4, 7, 10],
    minor7: [0, 3, 7, 10],
    major7: [0, 4, 7, 11],
  };
  
  let notes = intervals[quality].map(interval => root + interval);
  
  // Apply inversion
  for (let i = 0; i < inversion; i++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  
  return notes;
}

/**
 * Chord substitutions for harmonic variation
 */
const CHORD_SUBSTITUTIONS: Record<number, { degree: number; quality: ChordProgression['quality'] }[]> = {
  0: [{ degree: 5, quality: 'minor' }, { degree: 2, quality: 'minor' }], // I -> vi, iii
  3: [{ degree: 1, quality: 'minor' }], // IV -> ii
  4: [{ degree: 6, quality: 'diminished' }], // V -> vii°
  5: [{ degree: 0, quality: 'major' }, { degree: 2, quality: 'minor' }], // vi -> I, iii
};

/**
 * Generate chord progression
 * 
 * Features:
 * - Chord substitutions (diatonic, modal interchange, secondary dominants)
 * - Voice leading optimization (minimal movement between chords)
 * - Phase 1: Voice leading bias
 * - Phase 3: Harmonic rhythm variance
 * - Phase 4: Call/response structure
 * - Role-aware dynamics (root/third/fifth emphasis)
 */
export function generateChordProgression(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, humanizeVelocityForTrack, scalePitch, beat, rootC4, scale, choose, finalizeTime, params, timingEngine, dynamicsEngine } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const chordChanges = Math.floor(duration / beat); // One chord per beat potentially
  let lastChordPitches: number[] | undefined; // previous assigned chord voices (bass→treble)
  
  for (let i = 0; i < chordChanges; i += 2) { // Change chords every 2 beats
    const time = startTime + i * beat;
    if (time >= startTime + duration) break;
    
    const progressionIndex = Math.floor((i / 2) % config.chordProgression.length);
    let chordDef = config.chordProgression[progressionIndex];

    // Probabilistically apply chord substitution (Phase 0 default enabled)
    if ((params?.enableChordSubstitutions ?? true)) {
      const baseSubP = 0.15;
      const hc = Math.max(0, Math.min(1, params?.harmonicComplexity ?? 0));
      const subProb = baseSubP + 0.35 * hc; // increase substitution chance with harmonic complexity
      if (roll(subProb)) {
        // Choose from diatonic substitutions, modal interchange, or secondary dominants when complexity is on
        const candidates: { degree: number; quality: ChordProgression['quality'] }[] = [];
        if (CHORD_SUBSTITUTIONS[chordDef.degree]) {
          candidates.push(...CHORD_SUBSTITUTIONS[chordDef.degree]);
        }
        if (hc > 0) {
          // Modal interchange: borrow iv (minor) or bVII (major) depending on current quality context
          candidates.push({ degree: (chordDef.degree + 4) % 7, quality: 'minor' }); // iv (borrowed)
          candidates.push({ degree: 6, quality: 'major' }); // bVII (approx in degree mapping)
          // Secondary dominant of the NEXT chord
          const nextIdx = Math.floor(((i / 2) + 1) % config.chordProgression.length);
          const nextChord = config.chordProgression[nextIdx];
          const secDomDegree = (nextChord.degree + 4) % 7; // V of next
          candidates.push({ degree: secDomDegree, quality: 'dominant7' });
        }
        if (candidates.length > 0) {
          chordDef = choose(candidates);
        }
      }
    }
    
    const chordRoot = rootC4 + scale[chordDef.degree];
    
    // Choose inversion; optionally bias for minimal movement from previous chord
    const vlBias = Math.max(0, Math.min(1, params?.chordVoiceLeadingBias ?? 0));
    const exactAssign = Boolean(params?.enableExactChordVoiceAssignment);
    let inversion = roll(0.2) ? choose([0, 1, 2]) : 0;
    let chordNotes = getChordNotes(chordRoot, chordDef.quality, inversion);
    // Determine target number of voices from chord quality
    const voicesCount = chordNotes.length;
    // Precompute best inversion by greedy cost vs previous voices (as before)
    let bestInvNotes: number[] | undefined;
    if (vlBias > 0 && lastChordPitches && lastChordPitches.length > 0) {
      const candidates = [0, 1, 2].map(inv => {
        const base = getChordNotes(chordRoot, chordDef.quality, inv).map(n => clampPitch(n, config.register.chords[0], config.register.chords[1]));
        const prev = lastChordPitches!.slice().sort((a, b) => a - b);
        const cur0 = base.slice().sort((a, b) => a - b);
        // Apply a uniform octave shift to minimize mean distance
        const avg = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / Math.max(1, xs.length);
        const k = Math.round((avg(prev) - avg(cur0)) / 12);
        const cur = cur0.map(n => clampPitch(n + k * 12, config.register.chords[0], config.register.chords[1])).sort((a,b)=>a-b);
        const used = new Set<number>();
        let cost = 0;
        for (const p of prev) {
          let bestIdx = -1; let bestDist = Infinity;
          for (let j = 0; j < cur.length; j++) {
            if (used.has(j)) continue;
            const d = Math.abs(cur[j] - p);
            if (d < bestDist) { bestDist = d; bestIdx = j; }
          }
          if (bestIdx >= 0) { used.add(bestIdx); cost += bestDist; }
        }
        const voices = Math.min(prev.length, cur.length) || 1;
        return { inv, notes: cur, cost: cost / voices };
      }).sort((a,b)=> a.cost - b.cost);
      bestInvNotes = candidates[0]?.notes;
      inversion = candidates[0]?.inv ?? inversion;
      chordNotes = getChordNotes(chordRoot, chordDef.quality, inversion);
    }
    // When voice-leading bias is active, compute a deterministic close voicing assignment
    const doVL = vlBias > 0 && exactAssign;
    const assignedVoicesRaw: number[] | undefined = doVL
      ? assignCloseVoicing(lastChordPitches, chordRoot, chordDef.quality, voicesCount, config.register.chords)
      : undefined;
    // If both strategies available, choose the one with lower movement cost w.r.t previous voices
    const assignedVoices: number[] | undefined = (() => {
      if (!doVL) return undefined;
      const prev = lastChordPitches?.slice()?.sort((a,b)=>a-b) ?? [];
      const cost = (arr?: number[]) => {
        if (!arr || prev.length === 0) return Infinity;
        const cur = arr.slice().sort((a,b)=>a-b);
        const n = Math.min(prev.length, cur.length);
        let s = 0; for (let i = 0; i < n; i++) s += Math.abs(prev[i] - cur[i]);
        return s / n;
      };
      const shiftToPrev = (arr?: number[]) => {
        if (!arr || prev.length === 0) return arr;
        const avg = (xs: number[]) => xs.reduce((a,b)=>a+b,0) / Math.max(1, xs.length);
        const k = Math.round((avg(prev) - avg(arr)) / 12);
        return arr.map(n => clampPitch(n + k * 12, config.register.chords[0], config.register.chords[1]));
      };
      const anchoredFromPrev = (): number[] | undefined => {
        if (prev.length === 0) return undefined;
        const pcs = Array.from(new Set(chordNotes.map(n => ((n % 12) + 12) % 12)));
        const pickNearestOnPc = (p: number, pc: number): number => {
          const curPc = ((p % 12) + 12) % 12;
          let best = p, bestD = Infinity;
          for (const k of [-2,-1,0,1,2]) {
            const shift = ((pc - curPc + 18) % 12) - 6 + 12 * k;
            const cand = clampPitch(p + shift, config.register.chords[0], config.register.chords[1]);
            const d = Math.abs(cand - p);
            if (d < bestD) { bestD = d; best = cand; }
          }
          return best;
        };
        const out: number[] = [];
        let last = -Infinity;
        for (const p of prev) {
          // prefer preserving current pitch class if it is a chord tone; else pick nearest chord pc
          const curPc = ((p % 12) + 12) % 12;
          const pcsOrdered = pcs.includes(curPc) ? [curPc, ...pcs.filter(x => x !== curPc)] : pcs;
          let chosen = pickNearestOnPc(p, pcsOrdered[0]!);
          for (let i = 1; i < pcsOrdered.length; i++) {
            const alt = pickNearestOnPc(p, pcsOrdered[i]!);
            if (Math.abs(alt - p) < Math.abs(chosen - p) - 1e-6) chosen = alt;
          }
          // enforce non-crossing by pushing up in octaves if needed
          while (chosen < last) {
            if (chosen + 12 <= config.register.chords[1]) chosen += 12; else break;
          }
          chosen = clampPitch(chosen, config.register.chords[0], config.register.chords[1]);
          if (chosen < last) chosen = last; // final guard
          out.push(chosen);
          last = chosen;
        }
        // ensure desired voice count by merging with assignment when available
        if (out.length < voicesCount && assignedVoicesRaw && assignedVoicesRaw.length >= voicesCount) {
          const merged = out.concat(assignedVoicesRaw).sort((a,b)=>a-b).slice(-voicesCount);
          return merged;
        }
        return out.slice(0, voicesCount).sort((a,b)=>a-b);
      };
      const candidates: number[][] = [];
      if (bestInvNotes) candidates.push(bestInvNotes);
      if (assignedVoicesRaw) candidates.push(assignedVoicesRaw);
      const shiftedAssign = shiftToPrev(assignedVoicesRaw);
      if (shiftedAssign) candidates.push(shiftedAssign);
      const anchored = anchoredFromPrev();
      if (anchored) candidates.push(anchored);
      if (candidates.length === 0) return undefined;
      candidates.sort((a,b)=> cost(a) - cost(b));
      return candidates[0];
    })();
    
    // Add some chord rhythm variation (Phase 3: harmonicRhythmVariance)
    let rhythmPattern: number[] = roll(0.3) ? [0, beat] : [0]; // baseline behavior
    const hrv = Math.max(0, Math.min(1, params?.harmonicRhythmVariance ?? 0));
    if (hrv > 0 && roll(0.2 + 0.6 * hrv)) {
      const patterns: number[][] = [
        [0],                 // hold 2 beats
        [0, beat],           // split on beat
        [0, beat * 1.5],     // late accent
        [0.5 * beat, beat],  // anticipation then beat
        [0, 0.75 * beat, 1.5 * beat], // syncopated triad hits within 2 beats
      ];
      rhythmPattern = choose(patterns);
    }
    
    for (const rhythmOffset of rhythmPattern) {
      const chordTime = time + rhythmOffset;
      if (chordTime >= startTime + duration) continue;
      // Phase 4: call/response — thin chords on CALL bars
      if ((cr?.intensity ?? 0) > 0) {
        const barInSection = Math.floor((chordTime - startTime) / (4 * beat));
        const isResponseBar = ((barInSection % 2 === 0) === Boolean(cr.responseEven));
        // On call bars (not response), probabilistically skip chord hits
        if (!isResponseBar && roll(0.4 * Math.max(0, Math.min(1, cr.intensity ?? 0)))) {
          continue;
        }
      }
      
      // Phase 4: density gate — avoid piling on when many onsets coincide
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - chordTime) < (beat * 0.125) ? 1 : 0), 0);
        if (near >= 4 && roll(gate * 0.8)) {
          continue;
        }
      }
      const baseDur = beat * (rhythmPattern.length === 1 ? 2 : 1);
      const pos16 = Math.floor((chordTime / (beat / 4)) % 16);

      if (assignedVoices && assignedVoices.length) {
        // Prefer preserving exact common tones from previous chord to minimize movement further
        if (lastChordPitches && lastChordPitches.length) {
          const prev = lastChordPitches.slice().sort((a,b)=>a-b);
          const used = new Set<number>();
          const adjusted: number[] = assignedVoices.slice().sort((a,b)=>a-b);
          for (let i = 0; i < prev.length; i++) {
            const p = prev[i];
            // Find an index in adjusted that matches pitch class and is closest to p
            let bestIdx = -1; let bestDist = Infinity;
            for (let j = 0; j < adjusted.length; j++) {
              if (used.has(j)) continue;
              if ((((adjusted[j] - p) % 12) + 12) % 12 !== 0) continue;
              const d = Math.abs(adjusted[j] - p);
              if (d < bestDist) { bestDist = d; bestIdx = j; }
            }
            if (bestIdx >= 0) {
              used.add(bestIdx);
              adjusted[bestIdx] = p; // snap exact common tone
            }
          }
          // Keep adjusted ordering and bounds
          adjusted.sort((a,b)=>a-b);
          for (let i = 0; i < adjusted.length; i++) adjusted[i] = clampPitch(adjusted[i], config.register.chords[0], config.register.chords[1]);
          // Replace assignedVoices with adjusted if it reduces L1 vs prev
          const l1 = (a:number[], b:number[])=>{ const n=Math.min(a.length,b.length); let s=0; for(let k=0;k<n;k++) s+=Math.abs(a[k]-b[k]); return s/n; };
          if (l1(adjusted, prev) <= l1(assignedVoices.slice().sort((a,b)=>a-b), prev)) {
            for (let i = 0; i < assignedVoices.length; i++) assignedVoices[i] = adjusted[i] ?? assignedVoices[i];
          }
        }
        // Final octave folding to minimize per-voice distance while preserving order and register
        if (lastChordPitches && lastChordPitches.length) {
          const prev = lastChordPitches.slice().sort((a,b)=>a-b);
          const cur = assignedVoices.slice().sort((a,b)=>a-b);
          for (let i = 0; i < Math.min(prev.length, cur.length); i++) {
            while ((cur[i] - prev[i]) > 6 && (cur[i] - 12) >= config.register.chords[0]) cur[i] -= 12;
            while ((prev[i] - cur[i]) > 6 && (cur[i] + 12) <= config.register.chords[1]) cur[i] += 12;
            if (i > 0 && cur[i] < cur[i-1]) cur[i] = Math.min(config.register.chords[1], cur[i-1]);
          }
          for (let i = 0; i < cur.length; i++) assignedVoices[i] = cur[i];
        }
        const baseVel = humanizeVelocity(0.4 + section.energy * 0.2);
        // Role‑aware slight duration/velocity shaping
        for (const p of assignedVoices.slice().sort((a,b)=>a-b)) {
          const role = roleOf(p, chordRoot, chordDef.quality);
          const durScale = role === 'root' ? 1.06 : role === 'third' ? 1.02 : role === 'fifth' ? 0.96 : 0.92;
          const velScale = role === 'root' ? 1.04 : role === 'third' ? 1.0 : role === 'fifth' ? 0.98 : 0.96;
          const pitch = clampPitch(p, config.register.chords[0], config.register.chords[1]);
          events.push({
            time: finalizeTime(chordTime, pos16, config.rhythmPattern.swing, 'chords'),
            pitch,
            duration: Math.max(0.02, baseDur * durScale),
            velocity: Math.max(0.1, Math.min(1, baseVel * velScale)),
            track: 'chords',
          });
        }
        lastChordPitches = assignedVoices.slice().sort((a,b)=>a-b);
      } else {
        for (const note of chordNotes) {
          const clampedPitch = clampPitch(note, config.register.chords[0], config.register.chords[1]);
          const velEach = humanizeVelocity(0.4 + section.energy * 0.2); // preserve RNG usage per note
          events.push({
            time: finalizeTime(chordTime, pos16, config.rhythmPattern.swing, 'chords'),
            pitch: clampedPitch,
            duration: baseDur,
            velocity: velEach,
            track: 'chords',
          });
        }
        lastChordPitches = chordNotes.map(n => clampPitch(n, config.register.chords[0], config.register.chords[1])).sort((a,b)=>a-b);
      }
    }
  }
}
