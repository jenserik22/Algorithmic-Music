# Music Generator Complete Refactoring Plan

## Overview
This document provides a comprehensive plan to fix critical bugs and improve musical quality in the algorithmic music generator. Issues include timing overflows, inconsistent humanization, and overly complex phase systems that create unmusical output.

---

## Phase 1: Critical Bug Fixes (DO THESE FIRST)

### 1.1 Fix Duration Overflow in Event Generation
**Problem**: Events are generated beyond the requested duration (8 seconds requested → 24 seconds output)

**Files to modify**:
- `lib/music/engines/enhancedHelix.ts`
- `lib/music/engines/arrange.ts`

**Changes**:
```typescript
// In EnhancedHelixEngine.generate() - BEFORE final sort
// Add duration filter
events = events.filter(e => e.time < params.durationSecs);

// Ensure durations don't extend past limit
for (const e of events) {
  if (e.time + (e.duration ?? 0) > params.durationSecs) {
    e.duration = Math.max(0, params.durationSecs - e.time);
  }
}
```

**Add guards in ALL generation functions**:
```typescript
// In generateLeadLine, generateChordProgression, generateBassLine, generateDrumPattern
for (let i = 0; i < noteCount; i++) {
  const time = startTime + i * sixteenth;
  if (time >= startTime + duration) break; // ← ADD THIS CHECK
  if (time >= params.durationSecs) break;  // ← ADD THIS CHECK
  
  // ... rest of generation code
}
```

### 1.2 Fix MIDI Export Time Calculation
**Problem**: MIDI tracks are 3x longer than expected due to wait/duration accumulation

**File**: `lib/midi/exporter.ts`

**Changes**:
```typescript
// In createMidiTrack method, change from:
let lastEndTimeSec = 0;
const rawWaitSec = Math.max(0, eventTimeSec - lastEndTimeSec);
lastEndTimeSec = Math.max(lastEndTimeSec, eventTimeSec + durationSec);

// To:
let lastNoteStartTimeSec = 0;
const rawWaitSec = Math.max(0, eventTimeSec - lastNoteStartTimeSec);
lastNoteStartTimeSec = eventTimeSec;
```

### 1.3 Remove Events Starting After Duration
**Files**: Both engines

**Add final cleanup**:
```typescript
// Right before return statement
events = events.filter(e => e.time < params.durationSecs);
```

---

## Phase 2: Simplify & Fix Humanization (MUSICAL QUALITY)

### 2.1 Create Ensemble-Based Humanization
**Problem**: Each note is randomized independently, creating chaos. Real musicians drift together.

**New approach**:
```typescript
// Create ensemble drift (all instruments together)
const ensembleDrift = (barIndex: number, rand: () => number): number => {
  // Small, smooth drift per bar (not per note!)
  return (rand() - 0.5) * 0.008 * variation; // ±8ms max
};

// Create per-note micro-timing (much smaller)
const microTiming = (track: string, rand: () => number): number => {
  const amount = {
    drums: 0.002,   // ±2ms (tightest - the anchor)
    bass: 0.004,    // ±4ms (locks with drums)
    chords: 0.006,  // ±6ms
    lead: 0.008,    // ±8ms (most freedom)
    fx: 0.005       // ±5ms
  };
  return (rand() - 0.5) * (amount[track] ?? 0.005);
};

// Apply both in finalizeTime
const finalizeTime = (t: number, barIndex: number, track: string): number => {
  const drift = ensembleDrift(barIndex, rand);
  const micro = microTiming(track, rand);
  return Math.max(0, t + drift + micro);
};
```

### 2.2 Simplify Velocity Humanization
**Problem**: Too much variance (±20%+), real drummers are consistent

**New approach**:
```typescript
const humanizeVelocity = (v: number, track: string, rand: () => number): number => {
  const variance = {
    drums: 0.05,    // ±5% (very consistent)
    bass: 0.06,     // ±6%
    chords: 0.08,   // ±8%
    lead: 0.10,     // ±10% (most expressive)
    fx: 0.07        // ±7%
  };
  
  const jitter = (rand() - 0.5) * 2 * (variance[track] ?? 0.08);
  return Math.max(0.1, Math.min(1.0, v + jitter));
};
```

### 2.3 Make Drums the Timing Anchor
**Changes**: 
- Drums get MINIMAL humanization (±2ms max)
- Bass locks to drums (slightly behind, ~5-10ms)
- Other instruments reference drum/bass timing

```typescript
// In generateDrumPattern - NO ensemble drift, only micro
const drumTime = startTime + i * sixteenth + microTiming('drums', rand);

// In generateBassLine - add slight systematic lag
const bassTime = drumTime + 0.005; // 5ms behind kick
```

### 2.4 Apply Swing Consistently
**Problem**: Only lead/drums get swing, creating split feel

**Fix**: Apply swing to ALL tracks or NONE
```typescript
// Remove track-specific swing logic
const needsSwing = true; // ALL tracks swing together

// OR for straight styles:
const needsSwing = params.style === 'edm' ? false : true;
```

---

## Phase 3: Reduce Phase Complexity

### 3.1 Consolidate Phases
**Problem**: 9+ phases that contradict each other

**New structure**:
1. **Generation Phase**: Create base events (lead, chords, bass, drums, fx)
2. **Musical Shaping Phase**: Apply phrasing, dynamics, articulation AS ONE PASS
3. **Final Cleanup Phase**: Sort, clamp, validate

**Remove these separate phases**:
- ~~Phase 1: Groove~~ → Integrate into Generation
- ~~Phase 2: Phrasing~~ → Integrate into Musical Shaping
- ~~Phase 3: Harmonic~~ → Integrate into Generation
- ~~Phase 4: Call/Response~~ → Integrate into Generation
- ~~Phase 5: Dynamics~~ → Integrate into Musical Shaping
- ~~Phase 7: Ornamentation~~ → Integrate into Musical Shaping
- ~~Phase 8: Auto-Repair~~ → **DELETE THIS** (shouldn't need to repair good generation)
- ~~Phase 9: Adaptive~~ → Optional enhancement, keep separate

### 3.2 Remove Auto-Repair Phase
**Reasoning**: If generation is correct, you don't need repair. Auto-repair masks bugs.

**Action**: Delete entire Phase 8 block (lines with `isPhase8Active`, `evaluationStrength`, `autoRepairStrength`)

### 3.3 Simplify Simple Mode
**Problem**: Two completely different code paths

**Fix**: Make Simple Mode just a parameter preset:
```typescript
if (params.simpleMode) {
  // Override complex parameters
  params.harmonicComplexity = 0;
  params.callResponseIntensity = 0;
  params.ornamentation = 0;
  // ... etc
  
  // Then use SAME generation code
}
```

---

## Phase 4: Improve Groove & Feel

### 4.1 Fix Groove Templates
**Problem**: Current grooves only shift timing, don't create feel

**New approach**:
```typescript
const grooves = {
  straight: {
    swingAmount: 0,
    microTimingVariance: 0.002,
    accentPattern: [1.0, 0.9, 0.95, 0.9] // every 4 16ths
  },
  
  shuffle: {
    swingAmount: 0.66, // 2:1 triplet feel
    microTimingVariance: 0.004,
    accentPattern: [1.0, 0.7, 0.95, 0.7]
  },
  
  mpc62: {
    swingAmount: 0.58, // MPC's famous "58% swing"
    microTimingVariance: 0.003,
    accentPattern: [1.0, 0.75, 0.90, 0.75]
  },
  
  funk: {
    swingAmount: 0.54,
    microTimingVariance: 0.005,
    accentPattern: [1.0, 0.8, 1.05, 0.85] // push beat 3
  }
};

// Apply groove globally, not per-note
const applyGroove = (time: number, pos16: number, groove: Groove): number => {
  const isOffbeat = pos16 % 2 === 1;
  if (isOffbeat && groove.swingAmount > 0) {
    time += sixteenth * (groove.swingAmount - 0.5); // shift offbeats
  }
  return time;
};
```

### 4.2 Create Natural Dynamics
**Problem**: Per-note random velocity, not musical contours

**New approach**:
```typescript
// Section-level dynamics envelope
const getDynamicsCurve = (
  timeInSection: number, 
  sectionDuration: number,
  shape: 'flat' | 'rise' | 'fall' | 'swell'
): number => {
  const pos = timeInSection / sectionDuration; // 0 to 1
  
  switch (shape) {
    case 'rise':
      return 0.7 + 0.3 * pos; // 0.7 → 1.0
    case 'fall':
      return 1.0 - 0.3 * pos; // 1.0 → 0.7
    case 'swell':
      return 0.7 + 0.3 * Math.sin(pos * Math.PI); // 0.7 → 1.0 → 0.7
    default:
      return 1.0;
  }
};

// Apply to velocity
const baseVelocity = 0.7;
const dynamicScale = getDynamicsCurve(timeInSection, duration, section.dynamicShape);
const finalVelocity = baseVelocity * dynamicScale;
```

### 4.3 Implement Musical Phrasing
**Problem**: Current phrasing too subtle

**New approach**:
```typescript
// Natural phrase breathing (4-bar phrases)
const phraseBars = 4;
const phraseLength = phraseBars * 4 * beat;
const posInPhrase = (time % phraseLength) / phraseLength;

// Slight density reduction at phrase end (breath)
if (posInPhrase > 0.875) { // last 1/2 bar of phrase
  triggerProbability *= 0.6; // thin out
}

// Slight accent at phrase start
if (posInPhrase < 0.125) { // first 1/2 bar
  velocity *= 1.1; // emphasize
}
```

---

## Phase 5: Code Organization & Cleanup

### 5.1 Extract Helper Functions
**Problem**: 2000+ line functions are unmaintainable

**Action**: Break up `EnhancedHelixEngine.generate()` into:
```
generate()
├── validateParams()
├── initializeEngine()
├── generateSection()
│   ├── generateLeadLine()
│   ├── generateChordProgression()
│   ├── generateBassLine()
│   ├── generateDrumPattern()
│   └── generateFXEvents()
├── applyMusicalShaping()
│   ├── applyPhrasing()
│   ├── applyDynamics()
│   └── applyArticulation()
└── finalizeOutput()
    ├── sortEvents()
    ├── clampDurations()
    └── validateOutput()
```

### 5.2 Create Timing Utilities Module
**New file**: `lib/music/timing.ts`

```typescript
export class TimingEngine {
  constructor(private bpm: number, private style: string) {}
  
  // Ensemble drift (smooth, all tracks together)
  getEnsembleDrift(barIndex: number): number { }
  
  // Micro-timing (per-note, track-specific)
  getMicroTiming(track: string): number { }
  
  // Swing application
  applySwing(time: number, pos16: number, amount: number): number { }
  
  // Groove templates
  applyGroove(time: number, pos16: number, groove: string): number { }
}
```

### 5.3 Create Dynamics Module
**New file**: `lib/music/dynamics.ts`

```typescript
export class DynamicsEngine {
  // Section-level envelope
  getSectionDynamics(timeInSection: number, duration: number, shape: string): number { }
  
  // Phrase-level breathing
  getPhraseDynamics(time: number, phraseLength: number): number { }
  
  // Accent patterns
  getAccent(pos16: number, pattern: number[]): number { }
  
  // Natural velocity humanization
  humanizeVelocity(baseVel: number, track: string): number { }
}
```

### 5.4 Remove Dead Code
**Action**: Search and remove:
- Unused phase flags (`isPhase1Active`, etc.)
- Redundant simple mode checks
- Old humanization functions
- Phase 8 auto-repair entirely
- Duplicate logic in `arrange.ts` vs `enhancedHelix.ts`

---

## Phase 6: Testing & Validation

### 6.1 Create Test Suite
**New file**: `tests/music-generation.test.ts`

```typescript
describe('Music Generation', () => {
  test('respects duration limit', () => {
    const output = engine.generate({ durationSecs: 8, bpm: 120, key: 'C' });
    const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
    expect(maxTime).toBeLessThanOrEqual(8.0);
  });
  
  test('MIDI export matches generation length', () => {
    const output = engine.generate({ durationSecs: 8, bpm: 120, key: 'C' });
    const midiData = MidiExporter.exportToMidi(output);
    const midiLength = analyzeMidiLength(midiData);
    expect(midiLength).toBeCloseTo(8.0, 1); // within 1 second
  });
  
  test('timing stays consistent across tracks', () => {
    const output = engine.generate({ durationSecs: 8, bpm: 120, key: 'C' });
    const drumTimes = output.events.filter(e => e.track === 'drums').map(e => e.time);
    const bassTimes = output.events.filter(e => e.track === 'bass').map(e => e.time);
    
    // Bass should be within 20ms of nearest drum event
    bassTimes.forEach(bt => {
      const nearestDrum = drumTimes.reduce((a, b) => 
        Math.abs(b - bt) < Math.abs(a - bt) ? b : a
      );
      expect(Math.abs(bt - nearestDrum)).toBeLessThan(0.02);
    });
  });
  
  test('velocity stays within musical range', () => {
    const output = engine.generate({ durationSecs: 8, bpm: 120, key: 'C' });
    output.events.forEach(e => {
      expect(e.velocity).toBeGreaterThanOrEqual(0.1);
      expect(e.velocity).toBeLessThanOrEqual(1.0);
      
      // Per-track variance should be modest
      const trackEvents = output.events.filter(ev => ev.track === e.track);
      const avgVel = trackEvents.reduce((sum, ev) => sum + ev.velocity, 0) / trackEvents.length;
      const variance = Math.abs(e.velocity - avgVel);
      expect(variance).toBeLessThan(0.3); // No wild swings
    });
  });
  
  test('events are properly sorted by time', () => {
    const output = engine.generate({ durationSecs: 8, bpm: 120, key: 'C' });
    for (let i = 1; i < output.events.length; i++) {
      expect(output.events[i].time).toBeGreaterThanOrEqual(output.events[i-1].time);
    }
  });
});
```

### 6.2 Manual Testing Checklist
- [ ] Generate 8-second EDM → verify it's exactly 8 seconds in playback AND export
- [ ] Generate 16-second Jazz → verify length
- [ ] Generate with variation=0 → should be robotic (no humanization)
- [ ] Generate with variation=1 → should have subtle feel (not chaos)
- [ ] Export to MIDI → verify length matches
- [ ] Listen for groove/feel → does it sound musical?
- [ ] Test all 4 styles (EDM, Cinematic, LoFi, Jazz)
- [ ] Test simple mode vs normal mode

---

## Phase 7: Documentation & Parameters

### 7.1 Update Parameter Descriptions
**File**: `lib/music/engines/types.ts`

```typescript
export interface GenerationParams {
  // CORE PARAMETERS (keep these simple)
  durationSecs: number;      // Exact length in seconds
  bpm: number;               // Tempo (60-200)
  key: string;               // Musical key
  style: 'edm' | 'jazz' | 'lofi' | 'cinematic';
  
  // FEEL PARAMETERS (simplified)
  variation: number;         // 0-1: Amount of humanization (0=robotic, 1=loose)
  groove: 'straight' | 'shuffle' | 'swing' | 'funk'; // Rhythmic feel
  dynamicShape: 'flat' | 'rise' | 'fall' | 'swell';  // Volume contour
  
  // COMPLEXITY (simplified)
  complexity: 'simple' | 'intermediate' | 'advanced'; // Overall complexity
  fillRate: number;          // 0-1: Frequency of drum fills
  
  // REMOVE THESE CONFUSING PARAMETERS:
  // ❌ humanizeTime, humanizeVel (use variation instead)
  // ❌ grooveTemplate (use groove instead)
  // ❌ All "phase" parameters
  // ❌ spaceAllocatorMinGapSecs
  // ❌ leadChordToneBias, chordVoiceLeadingBias, etc.
}
```

### 7.2 Create Usage Guide
**New file**: `docs/MUSIC_GENERATION.md`

```markdown
# Music Generation Guide

## Basic Usage
```typescript
const output = engine.generate({
  durationSecs: 8,
  bpm: 120,
  key: 'C',
  style: 'edm',
  variation: 0.5,  // 50% humanization
  groove: 'straight',
  complexity: 'intermediate'
});
```

## Parameters Explained

### variation (0-1)
- **0.0**: Perfectly quantized (robotic)
- **0.3**: Tight, professional feel
- **0.5**: Natural human feel (recommended)
- **0.7**: Loose, jazzy feel
- **1.0**: Very loose (sloppy)

### groove
- **straight**: No swing, even 16ths (EDM, pop)
- **shuffle**: 2:1 triplet feel (blues, rock)
- **swing**: Jazz swing (3:1 ratio)
- **funk**: Syncopated, pushed feel

### complexity
- **simple**: Clear melodies, basic chords, steady rhythm
- **intermediate**: Some variation, occasional fills
- **advanced**: Complex harmonies, frequent changes

## Tips for Good Results
1. Start with variation=0.3-0.5 for most styles
2. EDM sounds best with straight groove
3. Jazz needs swing groove
4. Keep durationSecs in multiples of bars for clean loops
```

---

## Implementation Order

### Week 1: Critical Fixes
1. ✅ Fix duration overflow (Phase 1.1)
2. ✅ Fix MIDI export timing (Phase 1.2)
3. ✅ Add duration filters (Phase 1.3)
4. ✅ Test that 8 seconds = 8 seconds

### Week 2: Humanization Overhaul
5. ✅ Implement ensemble drift (Phase 2.1)
6. ✅ Simplify velocity humanization (Phase 2.2)
7. ✅ Make drums the anchor (Phase 2.3)
8. ✅ Fix swing consistency (Phase 2.4)
9. ✅ Test musical feel improvement

### Week 3: Simplification
10. ✅ Remove Phase 8 (auto-repair)
11. ✅ Consolidate remaining phases (Phase 3.1)
12. ✅ Simplify Simple Mode (Phase 3.3)
13. ✅ Test that complexity reduction works

### Week 4: Groove & Feel
14. ✅ Implement new groove system (Phase 4.1)
15. ✅ Add dynamics curves (Phase 4.2)
16. ✅ Improve phrasing (Phase 4.3)
17. ✅ Test all styles for musicality

### Week 5: Organization
18. ✅ Extract timing utilities (Phase 5.2)
19. ✅ Extract dynamics module (Phase 5.3)
20. ✅ Break up large functions (Phase 5.1)
21. ✅ Remove dead code (Phase 5.4)

### Week 6: Testing & Docs
22. ✅ Create test suite (Phase 6.1)
23. ✅ Manual testing checklist (Phase 6.2)
24. ✅ Update parameter docs (Phase 7.1)
25. ✅ Write usage guide (Phase 7.2)

---

## Success Criteria

### Technical
- [ ] 8 seconds generates exactly 8 seconds (±0.1s)
- [ ] MIDI export matches generation length
- [ ] No events start beyond duration
- [ ] All tests pass

### Musical
- [ ] Users report improved "feel" and "groove"
- [ ] Drums sound tight and consistent
- [ ] Bass locks with drums
- [ ] Melody has natural phrasing
- [ ] Dynamics sound musical (not random)

### Code Quality
- [ ] No functions over 200 lines
- [ ] Clear separation of concerns
- [ ] Easy to understand and modify
- [ ] Well documented

---

## Quick Wins (Do These First!)

1. **Duration filter**: Add `events = events.filter(e => e.time < params.durationSecs)` before return
2. **MIDI fix**: Change `lastEndTimeSec` to `lastNoteStartTimeSec` in exporter
3. **Drum anchor**: Set drum humanization to ±2ms max
4. **Remove auto-repair**: Delete entire Phase 8 block

These 4 changes will fix 80% of reported issues!

---

## Notes for AI Assistant

When implementing this plan:

1. **Preserve musical intent**: Don't just delete code, understand what it was trying to do musically
2. **Test after each phase**: Don't move to next phase until current one works
3. **Keep it simple**: When in doubt, choose the simpler solution
4. **Listen to output**: Generate samples and verify they sound musical
5. **Document changes**: Update comments to explain WHY, not just WHAT

Good luck! This refactoring will dramatically improve both reliability and musical quality.
