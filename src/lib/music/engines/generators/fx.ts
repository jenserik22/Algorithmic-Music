/**
 * FX Generator Module
 * 
 * Extracted from enhanced-helix.ts (Week 5 refactoring)
 * Generates FX events: crashes, risers, ambient pads
 */

import type { NoteEvent, SectionConfig, EnhancedSongConfig } from '../types';

/**
 * Generate FX events
 * 
 * Features:
 * - Crashes at section starts
 * - Risers before drops
 * - Ambient pads for cinematic styles
 */
export function generateFXEvents(
  events: NoteEvent[],
  startTime: number,
  duration: number,
  section: SectionConfig,
  config: EnhancedSongConfig,
  utils: any
) {
  const { rand, roll, humanizeTime, humanizeVelocity, humanizeVelocityForTrack, beat, timingEngine, dynamicsEngine } = utils;
  
  // Crashes at section starts
  if (section.crash) {
    events.push({
      time: humanizeTime(startTime),
      pitch: 49, // Crash
      duration: beat * 2,
      velocity: humanizeVelocity(0.8 + section.energy * 0.15),
      track: 'fx',
    });
  }
  
  // Risers before drops
  if (section.riserBefore && startTime > 0) {
    const riserStart = startTime - beat * 2;
    const riserDuration = beat * 2;
    
    events.push({
      time: Math.max(0, humanizeTime(riserStart)),
      pitch: 91, // White noise riser
      duration: riserDuration,
      velocity: humanizeVelocity(0.6),
      track: 'fx',
    });
  }
  
  // Ambient pads for cinematic style
  if (config.scale === 'dorian' && roll(0.5)) {
    const padDuration = duration * 0.8;
    events.push({
      time: humanizeTime(startTime + duration * 0.1),
      pitch: 88, // Ambient pad
      duration: padDuration,
      velocity: humanizeVelocity(0.3 + section.energy * 0.1),
      track: 'fx',
    });
  }
}
