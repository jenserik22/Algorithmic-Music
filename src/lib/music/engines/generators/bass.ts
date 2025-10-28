/**
 * Bass Generator Module
 * 
 * Extracted from enhanced-helix.ts (Week 5 refactoring)
 * Generates bass lines with chord following, passing tones, and anticipation
 */

import type { NoteEvent, SectionConfig, EnhancedSongConfig, ChordProgression } from '../types';

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
 * Generate bass line
 * 
 * Features:
 * - Follows chord progression (root notes and fifths)
 * - Simple Mode: Deterministic root/fifth on beats 1 & 3
 * - Advanced Mode: Rhythmic variation, arpeggios, passing tones
 * - Phase 0: Bass-lead interplay
 * - Phase 1: Bass anticipation
 * - Phase 4: Bass echoes lead fragments, density gate
 */
export function generateBassLine(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, humanizeVelocityForTrack, scalePitch, beat, sixteenth, choose, finalizeTime, params, timingEngine, dynamicsEngine } = utils;
  const cr = (utils && utils.cr) ? utils.cr as { intensity?: number; responseEven?: boolean; densityGate?: number } : {};
  const simple = (utils && utils.simple) ? utils.simple as { simpleMode?: boolean; progressionAtTime?: (t:number, s:number)=>number } : {};
  const noteCount = Math.floor(duration / sixteenth);
  
  // Simple Mode: deterministic root/fifth on beats 1 & 3
  if (simple?.simpleMode) {
    for (let i = 0; i < noteCount; i++) {
      const time = startTime + i * sixteenth;
      if (time >= startTime + duration) break;
      const pos16 = i % 16;
      const isStrongBeat = (pos16 === 0 || pos16 === 8);
      if (!isStrongBeat) continue;
      const progIdx = simple.progressionAtTime ? simple.progressionAtTime(time, startTime) : 0;
      const chordDef = config.chordProgression[progIdx];
      const useFifth = (pos16 === 8) && roll(0.4);
      const degree = useFifth ? (chordDef.degree + 4) % 7 : chordDef.degree;
      const pitch = clampPitch(scalePitch(degree, -1), config.register.bass[0], config.register.bass[1]);
      const velocity = humanizeVelocity(0.7 + section.energy * 0.2);
      const evtTime = finalizeTime(time, pos16, config.rhythmPattern.swing, 'bass');
      events.push({ time: evtTime, pitch, duration: beat * 1.5, velocity, track: 'bass' });
    }
    return;
  }

  // Advanced: Bass follows chord progression root notes with interplay
  for (let i = 0; i < noteCount; i++) {
    const time = startTime + i * sixteenth;
    if (time >= startTime + duration) break;
    
    const beatPosition = i % 16;
    const isKick = config.rhythmPattern.kick.includes(beatPosition);
    const isImportantBeat = beatPosition % 4 === 0;
    
    let triggerProbability = section.density * 0.6;
    if (isKick) triggerProbability += 0.4;
    if (isImportantBeat) triggerProbability += 0.3;

    // Rhythmic interplay (Phase 0 default enabled)
    if ((params?.enableBassLeadInterplay ?? true) && roll(0.1)) {
        const leadEvent = events.find(e => e.track === 'lead' && Math.abs(e.time - time) < sixteenth / 2);
        if (leadEvent) {
            triggerProbability = 1;
        }
    }
    
    if (roll(triggerProbability)) {
      const barPosition = Math.floor(i / 16);
      const progressionIndex = Math.floor(barPosition / 2) % config.chordProgression.length;
      const chordDef = config.chordProgression[progressionIndex];
      
      // Arpeggiate chords occasionally
      if (roll(0.15)) {
        const chordNotes = getChordNotes(scalePitch(chordDef.degree, -1), chordDef.quality);
        const arpNotes = choose([[0, 1, 2], [0, 2, 1], [2, 1, 0]])
        for (let j = 0; j < 3; j++) {
          const arpTime = time + j * (sixteenth / 2);
          if (arpTime >= startTime + duration) continue;
          events.push({
            time: humanizeTime(arpTime),
            pitch: clampPitch(chordNotes[arpNotes[j]], config.register.bass[0], config.register.bass[1]),
            duration: sixteenth / 2,
            velocity: humanizeVelocity(0.6 + section.energy * 0.2),
            track: 'bass',
          });
        }
        i += 1; // advance the main loop
        continue;
      }

      // Bass plays root or fifth
      const rootDegree = chordDef.degree;
      const degree = roll(0.8) ? rootDegree : (rootDegree + 4) % 7; // Root or fifth
      
      const pitch = clampPitch(scalePitch(degree, -1), config.register.bass[0], config.register.bass[1]);
      const velocity = humanizeVelocity(0.7 + section.energy * 0.2);
      const noteDuration = sixteenth * (roll(0.3) ? 4 : 2); // Vary note lengths
      
      // Phase 4: density gate — reduce piling on
      const gate = Math.max(0, Math.min(1, cr?.densityGate ?? 0));
      const evtTime = finalizeTime(time, beatPosition, config.rhythmPattern.swing, 'bass');
      if (gate > 0) {
        const near = events.reduce((acc, e) => acc + (Math.abs(e.time - evtTime) < sixteenth * 0.25 ? 1 : 0), 0);
        if (near >= 3 && roll(gate * 0.6)) {
          continue;
        }
      }

      events.push({
        // Baseline: bass does not get swing
        time: evtTime,
        pitch,
        duration: noteDuration,
        velocity,
        track: 'bass',
      });

      // Add passing tones
      const nextProgressionIndex = Math.floor((barPosition + 1) / 2) % config.chordProgression.length;
      if (i % 16 === 15 && nextProgressionIndex !== progressionIndex) {
        const nextChordDef = config.chordProgression[nextProgressionIndex];
        const nextRootDegree = nextChordDef.degree;
        const degreeDiff = nextRootDegree - rootDegree;
        if (Math.abs(degreeDiff) === 1 || Math.abs(degreeDiff) === 2) {
          const passingNoteDegree = rootDegree + Math.sign(degreeDiff);
          const passingNotePitch = clampPitch(scalePitch(passingNoteDegree, -1), config.register.bass[0], config.register.bass[1]);
          events.push({
            // Baseline: bass does not get swing
            time: finalizeTime(time + sixteenth * 0.75, (beatPosition + 0.75) % 16, config.rhythmPattern.swing, 'bass'),
            pitch: passingNotePitch,
            duration: sixteenth * 0.25,
            velocity: humanizeVelocity(0.5 + section.energy * 0.2),
            track: 'bass',
          });
        }
      }

      // Optional anticipation on & of 4 into next bar
      const anticip = Math.max(0, Math.min(1, params?.bassAnticipation ?? 0));
      if (anticip > 0 && beatPosition === 15 && roll(anticip)) {
        const nextRootDegree = config.chordProgression[Math.floor((barPosition + 1) / 2) % config.chordProgression.length].degree;
        const anticipPitch = clampPitch(scalePitch(nextRootDegree, -1), config.register.bass[0], config.register.bass[1]);
        const anticipTime = time - sixteenth * 0.5;
        if (anticipTime >= startTime) {
          events.push({
            // Baseline: bass does not get swing
            time: finalizeTime(anticipTime, 15, config.rhythmPattern.swing, 'bass'),
            pitch: anticipPitch,
            duration: sixteenth * 0.5,
            velocity: humanizeVelocity(0.55 + section.energy * 0.2),
            track: 'bass',
          });
        }
      }

      // Phase 4: bass echoes recent lead fragments (low probability)
      const echoProb = Math.max(0, Math.min(1, params?.bassEchoProbability ?? 0));
      if (echoProb > 0) {
        // find a recent lead event within last half-beat
        const recentLead = [...events].reverse().find(e => e.track === 'lead' && e.time <= time && (time - e.time) <= (beat * 0.5));
        if (recentLead && roll(echoProb)) {
          const echoTime = Math.min(startTime + duration - sixteenth * 0.5, recentLead.time + sixteenth);
          if (echoTime >= startTime) {
            const echoPitch = clampPitch((recentLead.pitch ?? 48) - 12, config.register.bass[0], config.register.bass[1]);
            events.push({
              time: finalizeTime(echoTime, Math.floor((echoTime / (beat / 4)) % 16), config.rhythmPattern.swing, 'bass'),
              pitch: echoPitch,
              duration: sixteenth * 0.75,
              velocity: humanizeVelocity(0.45 + section.energy * 0.15),
              track: 'bass',
            });
          }
        }
      }
    }
  }
}
