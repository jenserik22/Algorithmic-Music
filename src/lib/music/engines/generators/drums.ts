/**
 * Drum Generator Module
 * 
 * Extracted from enhanced-helix.ts (Week 5 refactoring)
 * Generates drum patterns with kicks, snares, hi-hats, and ghost notes
 */

import type { NoteEvent, SectionConfig, EnhancedSongConfig } from '../types';

/**
 * Generate drum pattern
 * 
 * Features:
 * - Simple Mode: Deterministic anchored patterns
 * - Advanced Mode: Probabilistic triggering with Markov chains for hi-hats
 * - Drum fills at end of phrases
 * - Phase 1: Accent patterns and groove integration
 * - Phase 9: Adaptive weighting for hi-hat bias
 * - Week 4: Groove template accent patterns
 */
export function generateDrumPattern(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, humanizeVelocityForTrack, applySwing, beat, sixteenth, choose, finalizeTime, params, timingEngine, dynamicsEngine } = utils;
  const s9 = Math.max(0, Math.min(1, utils?.phase9?.s ?? 0));
  const hatBias: number[] | undefined = utils?.phase9?.hatBias;
  const pattern = config.rhythmPattern;
  const bars = Math.floor(duration / (4 * beat));
  const rmk = Math.max(0, Math.min(1, params?.rhythmMarkovStrength ?? 0));

  // Build simple 2-state Markov model for hats from base pattern
  const hatPresent: boolean[] = Array.from({ length: 16 }, (_, i) => pattern.hats.includes(i));
  let c11 = 0, c10 = 0, c01 = 0, c00 = 0;
  for (let i = 0; i < 16; i++) {
    const a = hatPresent[i];
    const b = hatPresent[(i + 1) % 16];
    if (a && b) c11++; else if (a && !b) c10++; else if (!a && b) c01++; else c00++;
  }
  let p11 = (c11 + c10) > 0 ? c11 / (c11 + c10) : 0.5;
  const p01 = (c01 + c00) > 0 ? c01 / (c01 + c00) : 0.5;

  const fillPatterns = [
    [0, 2, 4, 6, 8, 10, 12, 14], // 8th note fill
    [0, 1, 2, 3, 4, 5, 6, 7], // 16th note fill
    [0, 4, 8, 12], // 4th note fill
  ];
  
  // Simple Mode: deterministic anchored patterns
  if (params?.simpleMode) {
    for (let bar = 0; bar < bars; bar++) {
      const barStart = startTime + bar * 4 * beat;
      // Kicks
      for (const i of pattern.kick) {
        const t = barStart + i * sixteenth;
        if (t >= startTime + duration) break;
        if (t >= params.durationSecs) break;
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 36, duration: sixteenth * 2, velocity: humanizeVelocity(0.8 + section.energy * 0.15), track: 'drums' });
      }
      // Snares
      for (const i of pattern.snare) {
        const t = barStart + i * sixteenth;
        if (t >= startTime + duration) break;
        if (t >= params.durationSecs) break;
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 38, duration: sixteenth * 1.5, velocity: humanizeVelocity(0.7 + section.energy * 0.2), track: 'drums' });
      }
      // Hats at listed positions; if none, place closed hats on all 8ths
      const hatPos = pattern.hats && pattern.hats.length > 0 ? pattern.hats : [0,4,8,12];
      for (const i of hatPos) {
        const t = barStart + i * sixteenth;
        if (t >= startTime + duration) break;
        if (t >= params.durationSecs) break;
        const isAccent = i % 4 === 0;
        const vel = humanizeVelocity((isAccent ? 0.6 : 0.45) + section.energy * 0.1);
        events.push({ time: finalizeTime(t, i, pattern.swing, 'drums'), pitch: 42, duration: sixteenth * 0.5, velocity: vel, track: 'drums' });
      }
    }
    return;
  }

  for (let bar = 0; bar < bars; bar++) {
    const barStart = startTime + bar * 4 * beat;
    let hatCountThisBar = 0;
    let lastHat = false;
    
    // Add fills occasionally
    const fillProb = Math.max(0, Math.min(1, params?.fillRate ?? 0.25));
    const isFill = section.fill && roll(fillProb) && bar % 4 === 3;
    
    if (isFill) {
      // Generate drum fill
      const fillPattern = choose(fillPatterns);
      for (const pos of fillPattern) {
        const time = barStart + pos * sixteenth;
        const pitch = roll(0.5) ? 38 : 42; // Snare or hi-hat
        const velocity = humanizeVelocity(0.5 + (pos / 16) * 0.3); // Build velocity
        
        events.push({
          time: finalizeTime(time, pos, pattern.swing, 'drums'),
          pitch,
          duration: sixteenth * 0.8,
          velocity,
          track: 'drums',
        });
      }
    } else {
      // Regular pattern
      for (let i = 0; i < 16; i++) {
        const time = barStart + i * sixteenth;
        if (time >= startTime + duration) break;
        if (time >= params.durationSecs) break;

        // Probabilistic kick
        if (pattern.kick.includes(i) && roll(0.9)) {
          const kickVel = 0.8 + section.energy * 0.15;
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 36, // Kick
            duration: sixteenth * 2,
            velocity: humanizeVelocityForTrack(kickVel, 'drums'),
            track: 'drums',
          });
        }

        // Probabilistic snare
        if (pattern.snare.includes(i) && roll(0.9)) {
          const snareVel = 0.7 + section.energy * 0.2;
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 38, // Snare
            duration: sixteenth * 1.5,
            velocity: humanizeVelocityForTrack(snareVel, 'drums'),
            track: 'drums',
          });
        }

        // Probabilistic hi-hats (slightly higher when groove template is active to ensure detectable offbeats)
        const hatProbBase = (params?.grooveTemplate && params.grooveTemplate !== 'straight') ? 0.95 : 0.8;
        // Baseline behavior: allow occasional hats off the canonical pattern to keep texture lively
        const basePresence = pattern.hats.includes(i) ? hatProbBase : 0.15 * hatProbBase;
        // Encourage some adjacency when Markov is emphasized even if the base pattern has none
        const adjacencyBoost = 0.4 * rmk;
        const p11Adj = Math.max(p11, adjacencyBoost);
        const markovPresence = lastHat ? p11Adj : p01;
        const p = rmk > 0 ? ((1 - rmk) * basePresence + rmk * markovPresence) : basePresence;
        const hb = hatBias && hatBias[i] != null ? hatBias[i] : 0.5;
        const pBiased = Math.max(0, Math.min(1, (1 - s9) * p + s9 * hb));
        if (roll(pBiased)) {
          const isAccent = i % 4 === 0;
          let velBase = (isAccent ? 0.6 : 0.4) + section.energy * 0.1;
          
          // Week 4 Enhancement: Use groove template accent pattern
          const grooveAccent = timingEngine.getAccent(i);
          velBase *= grooveAccent;
          
          // Legacy accent map (Phase 1) - still applied if parameter set
          const accentParam = Math.max(0, Math.min(1, params?.accentMapIntensity ?? 0));
          if (accentParam > 0) {
            // Simple accent map: boost 0,4,8,12; lighten 2,6,10,14
            if ([0,4,8,12].includes(i)) velBase += 0.15 * accentParam;
            if ([2,6,10,14].includes(i)) velBase -= 0.08 * accentParam;
          }
          
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 42, // Hi-hat
            duration: sixteenth * 0.5,
            velocity: humanizeVelocityForTrack(velBase, 'drums'),
            track: 'drums',
          });
          hatCountThisBar++;
          lastHat = true;
        } else {
          lastHat = false;
        }

        // Probabilistic ghost notes
        if (pattern.ghostNotes.includes(i) && roll(section.energy * 0.5)) {
          const ghostVel = 0.2 + section.energy * 0.1;
          events.push({
            time: finalizeTime(time, i, pattern.swing, 'drums'),
            pitch: 38, // Snare
            duration: sixteenth * 0.3,
            velocity: humanizeVelocityForTrack(ghostVel, 'drums'),
            track: 'drums',
          });
        }
      }
    }
    // Ensure at least one hat per bar at a canonical position when using explicit groove templates,
    // so cross-style timing comparisons have observable samples.
    if ((params?.grooveTemplate && params.grooveTemplate !== 'straight') && hatCountThisBar === 0 && (config.rhythmPattern.hats?.length ?? 0) > 0) {
      const i = config.rhythmPattern.hats[0];
      const time = barStart + i * sixteenth;
      const isAccent = i % 4 === 0;
      let velBase = (isAccent ? 0.6 : 0.4) + section.energy * 0.1;
      events.push({
        time: finalizeTime(time, i, pattern.swing, 'drums'),
        pitch: 42,
        duration: sixteenth * 0.5,
        velocity: humanizeVelocity(velBase),
        track: 'drums',
      });
    }
  }
}
