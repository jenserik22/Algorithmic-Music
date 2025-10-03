import type { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

/**
 * Enhanced Markov Chain Engine
 * 
 * Uses Markov chains for harmonic progressions, melodic patterns, and rhythmic structures.
 * Generates coherent multi-track compositions with probabilistic transitions.
 */

// Musical scales
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9,
};

// Markov chain for chord progressions (Roman numeral degrees)
// State transitions based on common music theory progressions
const CHORD_TRANSITIONS: Record<number, Record<number, number>> = {
  0: { 3: 0.3, 4: 0.3, 5: 0.25, 1: 0.15 }, // I → IV, V, vi, ii
  1: { 4: 0.4, 0: 0.3, 5: 0.3 },           // ii → V, I, vi
  2: { 4: 0.5, 5: 0.3, 0: 0.2 },           // iii → V, vi, I
  3: { 0: 0.4, 4: 0.3, 1: 0.2, 6: 0.1 },   // IV → I, V, ii, vii
  4: { 0: 0.5, 5: 0.3, 3: 0.2 },           // V → I, vi, IV
  5: { 3: 0.4, 1: 0.3, 0: 0.2, 4: 0.1 },   // vi → IV, ii, I, V
  6: { 0: 0.6, 5: 0.4 },                   // vii → I, vi
};

// Markov chain for melodic intervals (semitones)
// Using a Map instead of object for negative number keys
const MELODIC_TRANSITIONS_DATA: Array<[number, Record<number, number>]> = [
  [0, { 0: 0.2, 2: 0.25, 4: 0.2, [-2]: 0.2, 7: 0.15 }],     // Unison → step/skip
  [2, { 0: 0.15, 2: 0.2, [-2]: 0.25, 4: 0.2, [-4]: 0.2 }],   // Step up → various
  [4, { 2: 0.25, 0: 0.2, [-2]: 0.25, 5: 0.15, [-4]: 0.15 }], // Skip up → return
  [7, { [-2]: 0.3, 0: 0.2, 2: 0.2, [-7]: 0.3 }],             // Fifth up → return
  [-2, { 0: 0.2, 2: 0.3, [-2]: 0.2, [-4]: 0.15, 4: 0.15 }], // Step down → various
  [-4, { 2: 0.3, 0: 0.2, [-2]: 0.2, 4: 0.15, [-4]: 0.15 }], // Skip down → return
  [-7, { 2: 0.3, 0: 0.2, 7: 0.3, [-2]: 0.2 }],              // Fifth down → return
];

const MELODIC_TRANSITIONS = new Map<number, Record<number, number>>(MELODIC_TRANSITIONS_DATA);

// Markov chain for rhythm patterns (beat subdivisions)
const RHYTHM_TRANSITIONS: Record<string, Record<string, number>> = {
  'quarter': { 'quarter': 0.4, 'eighth': 0.3, 'half': 0.2, 'sixteenth': 0.1 },
  'eighth': { 'eighth': 0.35, 'sixteenth': 0.3, 'quarter': 0.25, 'eighth_rest': 0.1 },
  'sixteenth': { 'sixteenth': 0.4, 'eighth': 0.35, 'sixteenth_rest': 0.15, 'quarter': 0.1 },
  'half': { 'quarter': 0.5, 'half': 0.3, 'eighth': 0.2 },
  'eighth_rest': { 'eighth': 0.5, 'sixteenth': 0.3, 'quarter': 0.2 },
  'sixteenth_rest': { 'sixteenth': 0.5, 'eighth': 0.3, 'sixteenth_rest': 0.2 },
};

const RHYTHM_DURATIONS: Record<string, number> = {
  'whole': 4.0,
  'half': 2.0,
  'quarter': 1.0,
  'eighth': 0.5,
  'sixteenth': 0.25,
  'eighth_rest': 0.5,
  'sixteenth_rest': 0.25,
};

/**
 * Select next state based on Markov transition probabilities
 */
function selectNextState<T extends string | number>(
  currentState: T,
  transitions: Record<T, Record<T, number>>,
  rand: () => number
): T {
  const stateTransitions = transitions[currentState];
  if (!stateTransitions) {
    // Fallback to a random valid state
    const allStates = Object.keys(transitions) as T[];
    return allStates[Math.floor(rand() * allStates.length)];
  }
  
  const r = rand();
  let cumulative = 0;
  
  for (const [nextState, prob] of Object.entries(stateTransitions)) {
    cumulative += prob as number;
    if (r < cumulative) {
      return nextState as T;
    }
  }
  
  // Fallback (shouldn't happen if probabilities sum to 1)
  return Object.keys(stateTransitions)[0] as T;
}

/**
 * Generate chord progression using Markov chain
 */
function generateChordProgression(
  params: GenerationParams,
  rand: () => number
): number[] {
  const beatsPerSec = params.bpm / 60;
  const totalBeats = params.durationSecs * beatsPerSec;
  const beatsPerChord = 4; // Change chord every 4 beats
  const numChords = Math.ceil(totalBeats / beatsPerChord);
  
  const progression: number[] = [0]; // Start with tonic (I)
  
  for (let i = 1; i < numChords; i++) {
    const currentChord = progression[progression.length - 1];
    const nextChord = selectNextState(currentChord, CHORD_TRANSITIONS, rand);
    progression.push(nextChord);
  }
  
  return progression;
}

/**
 * Generate melody using Markov chain for intervals
 */
function generateMelody(
  basePitch: number,
  scale: number[],
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  
  const events: NoteEvent[] = [];
  let currentTime = 0;
  let currentPitch = basePitch + scale[0] + 12; // Start one octave up
  let currentInterval = 0;
  let currentRhythm: keyof typeof RHYTHM_DURATIONS = 'quarter';
  
  while (currentTime < params.durationSecs) {
    // Select next rhythm
    currentRhythm = selectNextState(currentRhythm, RHYTHM_TRANSITIONS, rand) as keyof typeof RHYTHM_DURATIONS;
    const duration = RHYTHM_DURATIONS[currentRhythm] * beatDuration;
    
    // Skip rests
    if (currentRhythm.includes('rest')) {
      currentTime += duration;
      continue;
    }
    
    // Select next interval using Map
    const melodicTransitions = MELODIC_TRANSITIONS.get(currentInterval);
    if (melodicTransitions) {
      const r = rand();
      let cumulative = 0;
      let nextInterval = 0;
      
      for (const [interval, prob] of Object.entries(melodicTransitions)) {
        cumulative += prob;
        if (r < cumulative) {
          nextInterval = parseInt(interval);
          break;
        }
      }
      currentInterval = nextInterval;
    } else {
      // Fallback: random small interval
      currentInterval = Math.floor(rand() * 5) - 2;
    }
    currentPitch += currentInterval;
    
    // Keep pitch in reasonable range
    while (currentPitch < basePitch + 12) currentPitch += 12;
    while (currentPitch > basePitch + 36) currentPitch -= 12;
    
    // Snap to scale
    const pitchClass = (currentPitch - basePitch) % 12;
    const closestScaleNote = scale.reduce((closest, note) => {
      const diff = Math.abs(pitchClass - note);
      const closestDiff = Math.abs(pitchClass - closest);
      return diff < closestDiff ? note : closest;
    }, scale[0]);
    const octave = Math.floor((currentPitch - basePitch) / 12);
    currentPitch = basePitch + closestScaleNote + octave * 12;
    
    const velocity = randomFloat(rand, 0.6, 0.9);
    const actualDuration = Math.min(duration, params.durationSecs - currentTime);
    
    events.push({
      time: currentTime,
      pitch: currentPitch,
      duration: actualDuration,
      velocity,
      track: 'lead',
    });
    
    currentTime += duration;
  }
  
  return events;
}

/**
 * Generate bass line following chord progression
 */
function generateBassLine(
  basePitch: number,
  scale: number[],
  chordProgression: number[],
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  const beatsPerChord = 4;
  
  const events: NoteEvent[] = [];
  
  chordProgression.forEach((chordDegree, index) => {
    const chordStartTime = index * beatsPerChord * beatDuration;
    if (chordStartTime >= params.durationSecs) return;
    
    const root = basePitch + scale[chordDegree % scale.length] - 24; // Two octaves down
    
    // Play root on strong beats
    const numBeats = Math.min(beatsPerChord, (params.durationSecs - chordStartTime) / beatDuration);
    
    for (let beat = 0; beat < numBeats; beat++) {
      const time = chordStartTime + beat * beatDuration;
      if (time >= params.durationSecs) break;
      
      let pitch = root;
      
      // Add octave jumps occasionally
      if (rand() < 0.2) {
        pitch += 12;
      }
      
      // Add fifth on off-beats
      if (beat % 2 === 1 && rand() < 0.6) {
        pitch = root + 7;
      }
      
      const duration = beatDuration * (rand() < 0.3 ? 0.5 : 0.9);
      const velocity = randomFloat(rand, 0.7, 0.9);
      
      events.push({
        time,
        pitch,
        duration: Math.min(duration, params.durationSecs - time),
        velocity,
        track: 'bass',
      });
    }
  });
  
  return events;
}

/**
 * Generate chords following progression
 */
function generateChords(
  basePitch: number,
  scale: number[],
  chordProgression: number[],
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  const beatsPerChord = 4;
  
  const events: NoteEvent[] = [];
  
  chordProgression.forEach((chordDegree, index) => {
    const chordStartTime = index * beatsPerChord * beatDuration;
    if (chordStartTime >= params.durationSecs) return;
    
    const root = basePitch + scale[chordDegree % scale.length];
    const third = basePitch + scale[(chordDegree + 2) % scale.length];
    const fifth = basePitch + scale[(chordDegree + 4) % scale.length];
    
    const chordNotes = [root, third, fifth];
    const duration = beatsPerChord * beatDuration * 0.95;
    const velocity = randomFloat(rand, 0.4, 0.6);
    
    chordNotes.forEach(pitch => {
      events.push({
        time: chordStartTime,
        pitch,
        duration: Math.min(duration, params.durationSecs - chordStartTime),
        velocity,
        track: 'chords',
      });
    });
  });
  
  return events;
}

/**
 * Generate drums using rhythm Markov chain
 */
function generateDrums(
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  
  const events: NoteEvent[] = [];
  const kickPitch = 36;
  const snarePitch = 38;
  const hihatPitch = 42;
  
  let currentTime = 0;
  let beatCount = 0;
  
  while (currentTime < params.durationSecs) {
    // Kick on strong beats
    if (beatCount % 4 === 0 || (beatCount % 4 === 2 && rand() < 0.7)) {
      events.push({
        time: currentTime,
        pitch: kickPitch,
        duration: beatDuration * 0.2,
        velocity: randomFloat(rand, 0.75, 0.95),
        track: 'drums',
      });
    }
    
    // Snare on backbeat
    if (beatCount % 4 === 2) {
      events.push({
        time: currentTime,
        pitch: snarePitch,
        duration: beatDuration * 0.15,
        velocity: randomFloat(rand, 0.7, 0.9),
        track: 'drums',
      });
    }
    
    // Hi-hat patterns using Markov rhythm
    if (rand() < 0.8) {
      events.push({
        time: currentTime,
        pitch: hihatPitch,
        duration: beatDuration * 0.1,
        velocity: randomFloat(rand, 0.5, 0.7),
        track: 'drums',
      });
    }
    
    currentTime += beatDuration;
    beatCount++;
  }
  
  return events;
}

export const EnhancedMarkovEngine: Engine = {
  name: 'enhanced_markov',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
    const scale = SCALES.major; // Could make this configurable
    
    const events: NoteEvent[] = [];
    
    // Generate chord progression using Markov chain
    const chordProgression = generateChordProgression(params, rand);
    
    // Determine which tracks to generate based on density
    const density = params.density || 0.5;
    
    // Always generate chords
    events.push(...generateChords(basePitch, scale, chordProgression, params, rand));
    
    // Add melody if density > 0.2
    if (density > 0.2) {
      events.push(...generateMelody(basePitch, scale, params, rand));
    }
    
    // Add bass if density > 0.4
    if (density > 0.4) {
      events.push(...generateBassLine(basePitch, scale, chordProgression, params, rand));
    }
    
    // Add drums if density > 0.6
    if (density > 0.6) {
      events.push(...generateDrums(params, rand));
    }
    
    // Sort events by time
    events.sort((a, b) => a.time - b.time);
    
    return {
      events,
      meta: {
        algorithm: 'enhanced_markov',
        key: params.key,
        bpm: params.bpm,
        timeSignature: params.timeSignature || '4/4',
        style: params.style || 'ambient',
      },
    };
  },
};
