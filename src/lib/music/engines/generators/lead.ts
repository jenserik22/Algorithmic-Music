/**
 * Lead Generator Module
 * 
 * Extracted from enhanced-helix.ts (Week 5 refactoring)
 * Generates melodic lead lines with phrasing, cadence, and humanization
 */

import type { NoteEvent, SectionConfig, EnhancedSongConfig, ChordProgression } from '../types';

/**
 * Clamp pitch to register bounds
 */
function clampPitch(pitch: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, pitch));
}

/**
 * Generate lead melody line
 * 
 * Features:
 * - Motif-based generation with call/response
 * - Melodic contours (rising, falling, arch)
 * - Chord-tone targeting on strong beats
 * - Phase 2: Phrasing & cadence resolution
 * - Phase 4: Call/response structure
 * - Week 4: Phrase dynamics for natural breathing
 */
export function generateLeadLine(
  events: NoteEvent[], 
  startTime: number, 
  duration: number, 
  section: SectionConfig,
  config: EnhancedSongConfig,
  motif: number[],
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, humanizeVelocityForTrack, applySwing, scalePitch, beat, sixteenth, choose, finalizeTime, params, timingEngine, dynamicsEngine } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const simple = (utils && utils.simple) ? utils.simple as { simpleMode?: boolean; simpleDefaults?: any; motifMemory?: Map<number, number[][]>; motifCounters?: Map<number, number>; progressionAtTime?: (t:number, s:number)=>number } : {};
  const noteCount = Math.floor(duration / sixteenth);
  let lastLeadPitch: number | undefined;

  // Call and response structure
  const call = motif.slice(0, motif.length / 2);
  const response = call.map(d => (d + choose([-1, 1, 2])) % 7).reverse();
  const fullMotif = call.concat(response);

  // Melodic contour
  const contours = {
    rising: (i: number) => Math.floor(i / 4),
    falling: (i: number) => -Math.floor(i / 4),
    arch: (i: number) => {
      const mid = noteCount / 2;
      return Math.round(Math.sin((i / mid) * Math.PI) * 3);
    },
  };
  const contour = roll(0.3) ? choose(Object.values(contours)) : null;
  
  // Precompute bias for strong-beat targeting
  const chordBiasGlobal = Math.max(0, Math.min(1, params?.leadChordToneBias ?? 0));
  // Phase 2: phrasing & cadence settings
  const cadenceStrength = Math.max(0, Math.min(1, params?.cadenceStrength ?? 0));
  const phraseBars = params?.phrasing ? (params.phrasing === 'short' ? 2 : (params.phrasing === 'medium' ? 4 : 8)) : (cadenceStrength > 0 ? 4 : undefined);
  const phraseLen16 = phraseBars ? phraseBars * 16 : 0;
  const sectionBars = Math.max(1, Math.floor(duration / (4 * beat)));
  const phrasesInSection = phraseBars ? Math.max(1, Math.floor(sectionBars / phraseBars)) : 0;
  const climaxPhraseIndex = phraseBars && phrasesInSection > 0 ? Math.floor(rand() * phrasesInSection) : -1;

  // Simple Mode helpers: assign a motif pattern per 2-beat slot
  const slotPatternIdx = new Map<number, number>();

  for (let i = 0; i < noteCount; i++) {
    const time = startTime + i * sixteenth;
    if (time >= startTime + duration) break;
    
    // Density-based note triggering with musical phrasing
    const phrasePosition = (i % 16) / 16; // Position in 4/4 bar
    const pos16 = i % 16;
    const isDownbeat = pos16 === 0;
    const isOffbeat = i % 8 === 4;
    const isStrongBeat = pos16 === 0 || pos16 === 8; // beats 1 and 3
    
    let triggerProbability = section.density * section.energy;
    if (isDownbeat) triggerProbability *= 1.5;
    if (isOffbeat) triggerProbability *= 1.2;
    // Phase 4: call/response — thin lead on designated response bars
    if ((cr?.intensity ?? 0) > 0) {
      const barInSection = Math.floor((time - startTime) / (4 * beat));
      const isResponseBar = ((barInSection % 2 === 0) === Boolean(cr.responseEven));
      if (isResponseBar) {
        triggerProbability *= (1 - 0.6 * Math.max(0, Math.min(1, cr.intensity ?? 0)));
      }
    }
    // Phase 2: create a small breath before cadence by thinning just before last beat of the phrase
    if (phraseBars) {
      const idxInPhrase = i % phraseLen16;
      const inPreCadence = idxInPhrase >= phraseLen16 - 8 && idxInPhrase < phraseLen16 - 4;
      if (inPreCadence && cadenceStrength > 0) {
        triggerProbability *= (1 - 0.6 * cadenceStrength);
      }
    }
    // If chord-tone bias is requested, slightly boost the chance to place notes on strong beats
    if (chordBiasGlobal > 0 && isStrongBeat) {
      triggerProbability = Math.max(0.9, Math.min(1, triggerProbability + 0.2 * chordBiasGlobal));
    }
    
    const doCadenceNow = phraseBars ? ((i % phraseLen16) === (phraseLen16 - 4) && cadenceStrength > 0) : false;
    // Simple Mode: anchor strong beats and reuse per-slot motif memory
    if (simple?.simpleMode) {
      const slotLen = 2 * beat; // 2 beats per progression step
      const slotIndex = Math.floor((time - startTime) / slotLen);
      const posInSlot16 = Math.floor(((time - startTime) % slotLen) / sixteenth); // 0..7
      const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
      const memory = simple.motifMemory?.get(progIdx) ?? [];
      if (!slotPatternIdx.has(slotIndex)) {
        const counter = simple.motifCounters?.get(progIdx) ?? 0;
        const patIdx = memory.length > 0 ? (counter % memory.length) : 0;
        slotPatternIdx.set(slotIndex, patIdx);
        if (simple.motifCounters) simple.motifCounters.set(progIdx, counter + 1);
      }
      // Adjust trigger prob: always place notes on 1 and 3; thin others
      if (isStrongBeat) triggerProbability = 1;
      else triggerProbability = Math.min(1, 0.5 * (section.density + 0.4));
    }

    if (doCadenceNow || (chordBiasGlobal > 0 && isStrongBeat) || roll(triggerProbability)) {
      let degree: number;
      if (simple?.simpleMode) {
        const slotLen = 2 * beat;
        const slotIndex = Math.floor((time - startTime) / slotLen);
        const posInSlot16 = Math.floor(((time - startTime) % slotLen) / sixteenth); // 0..7
        const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
        const memory = simple.motifMemory?.get(progIdx) ?? [];
        const patIdx = slotPatternIdx.get(slotIndex) ?? 0;
        const pattern = memory[patIdx] ?? fullMotif; // fallback to existing motif
        degree = pattern[posInSlot16 % (pattern.length || 1)] ?? (fullMotif[i % fullMotif.length]);
      } else {
        const motifIndex = i % fullMotif.length;
        degree = fullMotif[motifIndex];
      }

      if (contour) {
        degree = (degree + contour(i) + 7) % 7;
      }

      // Harmonic cohesion and chord-tone targeting
      const barPosition = Math.floor(i / 16);
      const progressionIndex = Math.floor(barPosition / 2) % config.chordProgression.length;
      const chordDef = config.chordProgression[progressionIndex];
      // Phase 0 default: snap to chord root on downbeats with 50% chance.
      // Preserve baseline by default; allow disabling only if explicitly set to false.
      if ((params?.enableLeadDownbeatChordRoot ?? true) && isDownbeat && roll(0.5)) {
        degree = chordDef.degree;
      }
      const chordBias = chordBiasGlobal;
      if (doCadenceNow) {
        // Enforce cadential resolution on phrase end: prefer root or fifth
        const cadenceDegrees = [chordDef.degree, (chordDef.degree + 4) % 7];
        degree = choose(cadenceDegrees);
      } else if ((simple?.simpleMode && isStrongBeat)) {
        // Simple Mode: force strong beats to chord tones (root/third/fifth)
        const chordToneDegrees = [chordDef.degree, (chordDef.degree + 2) % 7, (chordDef.degree + 4) % 7];
        degree = choose(chordToneDegrees);
      } else if (chordBias > 0 && isStrongBeat) {
        const chordToneDegrees = [chordDef.degree, (chordDef.degree + 2) % 7, (chordDef.degree + 4) % 7];
        degree = choose(chordToneDegrees);
      } else if (chordBias > 0 && !isStrongBeat && roll(chordBias * 0.3)) {
        // Passing/neighbor tones near chord
        degree = (chordDef.degree + choose([-1, 1])) % 7;
        if (degree < 0) degree += 7;
      }

      const octave = 1 + Math.floor(rand() * 2); // Vary octave
      let pitch = clampPitch(scalePitch(degree, octave), config.register.lead[0], config.register.lead[1]);
      // Optional Phase 1: limit melodic leaps via octave folding
      const maxLeap = Math.max(0, params?.leadMaxLeapSemitones ?? 0);
      if (maxLeap > 0 && lastLeadPitch != null) {
        // Fold by octaves towards previous pitch until within maxLeap or register bounds
        let tries = 0;
        while (Math.abs(pitch - lastLeadPitch) > maxLeap && tries < 4) {
          if (pitch > lastLeadPitch) pitch -= 12; else pitch += 12;
          // Keep within register; if out of bounds, break
          if (pitch < config.register.lead[0] || pitch > config.register.lead[1]) break;
          tries++;
        }
        // Final clamp just in case
        pitch = clampPitch(pitch, config.register.lead[0], config.register.lead[1]);
      }
      // Phase 2: motif climax — select one phrase per section to emphasize by register/velocity
      if (phraseBars) {
        const curPhrase = Math.floor((i) / phraseLen16);
        const isClimaxPhrase = curPhrase === climaxPhraseIndex;
        if (isClimaxPhrase && roll(0.8)) {
          pitch = clampPitch(pitch + 12, config.register.lead[0], config.register.lead[1]);
        }
      }
      
      // Musical note durations
      const durationChoices = [sixteenth, sixteenth * 2, sixteenth * 3, sixteenth * 4];
      const noteDuration = choose(durationChoices);
      
      let velBase = 0.6 + section.energy * 0.3;
      if (phraseBars) {
        const curPhrase = Math.floor((i) / phraseLen16);
        const isClimaxPhrase = curPhrase === climaxPhraseIndex;
        if (isClimaxPhrase) velBase += 0.08;
      }
      if (doCadenceNow) velBase += 0.1; // highlight cadence resolution
      
      // Week 4 Enhancement: Apply phrase dynamics (breathing)
      if (phraseBars) {
        const phraseLength = phraseBars * 4 * beat;
        const phraseDynamics = dynamicsEngine.getPhraseDynamics(time, phraseLength);
        velBase *= phraseDynamics;
      }
      
      const velocity = humanizeVelocityForTrack(velBase, 'lead');
      let finalTime = finalizeTime(time, pos16, config.rhythmPattern.swing, 'lead');
      // Pin strong-beat notes tightly to the beat to align with chord onset for metrics
      if ((chordBiasGlobal > 0 && isStrongBeat) || (simple?.simpleMode && isStrongBeat)) {
        finalTime = Math.round(finalTime / beat) * beat;
      }
      if (doCadenceNow) {
        finalTime = Math.round(finalTime / beat) * beat;
      }
      
      const ev = {
        time: finalTime,
        pitch,
        duration: noteDuration,
        velocity,
        track: 'lead' as const,
      };
      // Phase 4: density gate — reduce simultaneous onsets across tracks
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - finalTime) < sixteenth * 0.25 ? 1 : 0), 0);
        if (near >= 3 && roll(gate * 0.7)) {
          continue;
        }
      }
      events.push(ev);
      lastLeadPitch = ev.pitch;
    }
  }
}
