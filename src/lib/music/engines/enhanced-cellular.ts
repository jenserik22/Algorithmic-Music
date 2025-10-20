import type { Engine, EngineOutput, GenerationParams, NoteEvent } from './types';
import { mulberry32, randomFloat } from '../seededRandom';

/**
 * Enhanced Cellular Automata Engine
 * 
 * Uses Conway's Game of Life and variants to generate complex multi-track compositions.
 * Each track uses different CA rules for unique musical characteristics.
 */

// Musical scales
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

const KEY_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  Am: 9, // Start from A for minor
};

// Different CA rules for different musical characters
type CARule = {
  name: string;
  survive: number[]; // Neighbor counts where cell survives
  born: number[];    // Neighbor counts where cell is born
};

const CA_RULES: Record<string, CARule> = {
  life: { name: "Conway's Life", survive: [2, 3], born: [3] },           // Classic, balanced
  highlife: { name: 'HighLife', survive: [2, 3], born: [3, 6] },        // More energetic
  seeds: { name: 'Seeds', survive: [], born: [2] },                      // Explosive, chaotic
  maze: { name: 'Maze', survive: [1, 2, 3, 4, 5], born: [3] },         // Dense, complex
  coagulations: { name: 'Coagulations', survive: [2, 3, 5, 6, 7, 8], born: [3, 7, 8] }, // Very dense
};

// Different track configurations
type TrackConfig = {
  name: 'lead' | 'chords' | 'bass' | 'drums' | 'fx';
  rule: string;
  gridSize: { width: number; height: number };
  initDensity: number;
  emitProb: number;
  octaveRange: [number, number];
  velocityRange: [number, number];
  scale: keyof typeof SCALES;
};

const TRACK_CONFIGS: Record<string, TrackConfig> = {
  lead: {
    name: 'lead',
    rule: 'life',
    gridSize: { width: 64, height: 12 },
    initDensity: 0.3,
    emitProb: 0.7,
    octaveRange: [5, 7],
    velocityRange: [0.6, 0.9],
    scale: 'pentatonic',
  },
  chords: {
    name: 'chords',
    rule: 'highlife',
    gridSize: { width: 32, height: 8 },
    initDensity: 0.4,
    emitProb: 0.5,
    octaveRange: [3, 5],
    velocityRange: [0.4, 0.7],
    scale: 'major',
  },
  bass: {
    name: 'bass',
    rule: 'maze',
    gridSize: { width: 16, height: 4 },
    initDensity: 0.5,
    emitProb: 0.8,
    octaveRange: [2, 3],
    velocityRange: [0.7, 0.9],
    scale: 'minor',
  },
  drums: {
    name: 'drums',
    rule: 'seeds',
    gridSize: { width: 32, height: 4 },
    initDensity: 0.25,
    emitProb: 0.9,
    octaveRange: [2, 3],
    velocityRange: [0.6, 0.95],
    scale: 'pentatonic',
  },
  fx: {
    name: 'fx',
    rule: 'coagulations',
    gridSize: { width: 48, height: 6 },
    initDensity: 0.2,
    emitProb: 0.3,
    octaveRange: [6, 8],
    velocityRange: [0.3, 0.6],
    scale: 'dorian',
  },
};

/**
 * Initialize a cellular automata grid with random cells
 */
function initializeGrid(width: number, height: number, density: number, rand: () => number): number[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => (rand() < density ? 1 : 0))
  );
}

/**
 * Step the cellular automata grid forward one generation
 */
function stepGrid(grid: number[][], rule: CARule): number[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const out = Array.from({ length: h }, () => Array(w).fill(0));
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Count living neighbors (Moore neighborhood)
      let alive = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = (y + dy + h) % h; // Wrap around
          const nx = (x + dx + w) % w;
          alive += grid[ny][nx];
        }
      }
      
      const cell = grid[y][x];
      
      // Apply CA rules
      if (cell === 1) {
        out[y][x] = rule.survive.includes(alive) ? 1 : 0;
      } else {
        out[y][x] = rule.born.includes(alive) ? 1 : 0;
      }
    }
  }
  
  return out;
}

/**
 * Generate notes from a cellular automata grid for a specific track
 */
function generateTrackEvents(
  config: TrackConfig,
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
  const scale = SCALES[config.scale];
  const rule = CA_RULES[config.rule];
  
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  
  // Calculate grid parameters
  const totalBeats = params.durationSecs * beatsPerSec;
  const stepsPerBeat = config.gridSize.width / totalBeats;
  const stepSec = beatDuration / stepsPerBeat;
  
  // Initialize grid
  const adjustedDensity = config.initDensity * (0.5 + params.density * 0.5);
  let grid = initializeGrid(config.gridSize.width, config.gridSize.height, adjustedDensity, rand);
  
  // Evolve grid for a few generations to create interesting patterns
  const evolveSteps = 3 + Math.floor(params.density * 5);
  for (let i = 0; i < evolveSteps; i++) {
    grid = stepGrid(grid, rule);
  }
  
  // Extract musical events from grid
  const events: NoteEvent[] = [];
  const emitProb = config.emitProb * (0.6 + params.density * 0.4);
  
  for (let x = 0; x < config.gridSize.width; x++) {
    const t = (x / config.gridSize.width) * params.durationSecs;
    if (t >= params.durationSecs) break;
    
    for (let y = 0; y < config.gridSize.height; y++) {
      if (grid[y][x] === 1 && rand() < emitProb) {
        // Map grid position to musical pitch
        const scaleIndex = y % scale.length;
        const octaveOffset = Math.floor(y / scale.length);
        const [minOctave, maxOctave] = config.octaveRange;
        const octave = minOctave + (octaveOffset % (maxOctave - minOctave + 1));
        
        const degree = scale[scaleIndex];
        const pitch = basePitch + degree + (octave - 5) * 12;
        
        // Duration based on grid resolution
        const dur = Math.min(stepSec * randomFloat(rand, 0.8, 1.5), params.durationSecs - t);
        
        // Velocity with some variation
        const [minVel, maxVel] = config.velocityRange;
        const velocity = randomFloat(rand, minVel, maxVel);
        
        events.push({
          time: t,
          pitch,
          duration: dur,
          velocity,
          track: config.name,
        });
      }
    }
  }
  
  return events;
}

/**
 * Generate chord progression from cellular automata
 */
function generateChordProgression(
  params: GenerationParams,
  rand: () => number
): NoteEvent[] {
  const basePitch = 60 + (KEY_TO_SEMITONE[params.key] ?? 0);
  const scale = SCALES.major;
  const beatsPerSec = params.bpm / 60;
  const beatDuration = 1 / beatsPerSec;
  
  // Create chord every 2-4 beats
  const chordInterval = beatDuration * (2 + Math.floor(rand() * 3));
  const numChords = Math.floor(params.durationSecs / chordInterval);
  
  const events: NoteEvent[] = [];
  
  for (let i = 0; i < numChords; i++) {
    const t = i * chordInterval;
    if (t >= params.durationSecs) break;
    
    // Select chord root from scale
    const degree = scale[Math.floor(rand() * scale.length)];
    const root = basePitch + degree - 12; // One octave down for chords
    
    // Create triad
    const chordNotes = [root, root + 4, root + 7]; // Major triad
    
    const dur = Math.min(chordInterval * 0.9, params.durationSecs - t);
    const velocity = randomFloat(rand, 0.4, 0.6);
    
    // Add each note of the chord
    chordNotes.forEach(pitch => {
      events.push({
        time: t,
        pitch,
        duration: dur,
        velocity,
        track: 'chords',
      });
    });
  }
  
  return events;
}

export const EnhancedCellularEngine: Engine = {
  name: 'enhanced_cellular',
  generate(params: GenerationParams): EngineOutput {
    const rand = mulberry32(params.seed);
    const events: NoteEvent[] = [];
    
    // Determine which tracks to generate based on density and style
    const density = params.density || 0.5;
    const tracksToGenerate: (keyof typeof TRACK_CONFIGS)[] = [];
    
    // Always include lead
    tracksToGenerate.push('lead');
    
    // Add more tracks as density increases
    if (density > 0.2) tracksToGenerate.push('chords');
    if (density > 0.4) tracksToGenerate.push('bass');
    if (density > 0.6) tracksToGenerate.push('drums');
    if (density > 0.7) tracksToGenerate.push('fx');
    
    // Generate events for each track
    for (const trackName of tracksToGenerate) {
      const config = TRACK_CONFIGS[trackName];
      const trackEvents = generateTrackEvents(config, params, rand);
      events.push(...trackEvents);
    }
    
    // Add harmonic chord progression if chords track is active
    if (tracksToGenerate.includes('chords')) {
      const chordEvents = generateChordProgression(params, rand);
      events.push(...chordEvents);
    }
    
    // Sort events by time
    events.sort((a, b) => a.time - b.time);
    
    return {
      events,
      meta: {
        algorithm: 'enhanced_cellular',
        key: params.key,
        bpm: params.bpm,
        timeSignature: params.timeSignature || '4/4',
        style: params.style || 'ambient',
      },
    };
  },
};
