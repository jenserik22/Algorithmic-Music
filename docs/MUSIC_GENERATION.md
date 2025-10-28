# Music Generation Guide

Complete guide to using the Enhanced Helix music generation engine.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Parameters](#core-parameters)
3. [Humanization & Feel](#humanization--feel)
4. [Musical Complexity](#musical-complexity)
5. [Advanced Parameters](#advanced-parameters)
6. [Style Guide](#style-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Usage

```typescript
import { EnhancedHelixEngine } from './lib/music/engines/enhanced-helix';

// Generate 8-second EDM track
const output = EnhancedHelixEngine.generate({
  seed: 12345,
  durationSecs: 8,
  bpm: 128,
  key: 'C',
  timeSignature: '4/4',
  density: 0.7,
  style: 'edm'
});

// Output contains:
// - events: Array of NoteEvent objects
// - meta: Metadata (bpm, key, style, etc.)
```

### Simple Mode

For quick, high-quality results with minimal configuration:

```typescript
const output = EnhancedHelixEngine.generate({
  seed: 12345,
  durationSecs: 16,
  bpm: 120,
  key: 'Am',
  timeSignature: '4/4',
  density: 0.6,
  style: 'jazz',
  simpleMode: true  // ✅ Automatic quality settings
});
```

---

## Core Parameters

### Required Parameters

#### `seed: number`
Random seed for deterministic generation. Same seed = same output.

```typescript
seed: 12345  // Any integer
```

#### `durationSecs: number`
Exact length of generated music in seconds.

```typescript
durationSecs: 8   // Short loop
durationSecs: 16  // Medium section
durationSecs: 60  // Full track
```

**Tip**: Use multiples of bars for clean loops:
- 4 bars @ 120 BPM = 8 seconds
- 8 bars @ 120 BPM = 16 seconds
- 16 bars @ 120 BPM = 32 seconds

#### `bpm: number`
Tempo in beats per minute.

```typescript
bpm: 60   // Very slow
bpm: 90   // Ballad
bpm: 120  // Medium (recommended default)
bpm: 140  // Uptempo
bpm: 180  // Very fast
```

**Style Recommendations**:
- EDM: 128-140 BPM
- Cinematic: 70-100 BPM
- LoFi: 70-90 BPM
- Jazz: 120-180 BPM

#### `key: string`
Musical key for the composition.

```typescript
key: 'C'   // C major
key: 'Am'  // A minor
key: 'F#'  // F# major
key: 'Bb'  // Bb major
```

**Available Keys**: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B  
**Minor Keys**: Add 'm' suffix (e.g., 'Am', 'F#m')

#### `timeSignature: string`
Time signature (currently only 4/4 fully supported).

```typescript
timeSignature: '4/4'  // Standard
```

#### `density: number` (0-1)
Overall note density/busyness.

```typescript
density: 0.3  // Sparse, minimal
density: 0.5  // Moderate (recommended)
density: 0.7  // Busy
density: 1.0  // Very dense
```

---

## Humanization & Feel

### `variation: number` (0-1)
Amount of humanization and timing variation.

```typescript
variation: 0.0  // Perfectly quantized (robotic/mechanical)
variation: 0.3  // Tight, professional feel (EDM)
variation: 0.5  // Natural human feel (recommended)
variation: 0.7  // Loose, jazzy feel
variation: 1.0  // Very loose (sloppy, use sparingly)
```

**Recommendations**:
- **EDM/Electronic**: 0.2-0.4 (tight but not robotic)
- **Jazz**: 0.5-0.7 (loose, swinging)
- **Cinematic**: 0.3-0.5 (natural but controlled)
- **LoFi**: 0.4-0.6 (relaxed feel)

### `grooveTemplate: string`
Rhythmic groove pattern.

```typescript
grooveTemplate: 'straight'  // Even 16ths (EDM, Pop)
grooveTemplate: 'shuffle'   // 2:1 triplet feel (Blues, Rock)
grooveTemplate: 'mpc62'     // MPC-style late 8ths (Hip-hop)
grooveTemplate: 'funk'      // Syncopated, pushed feel (Funk, R&B)
```

**Style Recommendations**:
- **EDM**: `'straight'`
- **Jazz**: `'shuffle'` or `'straight'` with swing
- **Hip-hop/LoFi**: `'mpc62'`
- **Funk**: `'funk'`

### `swingRatio: number` (0.5-0.75)
Swing amount for shuffle grooves. Only effective when `grooveTemplate === 'shuffle'`.

```typescript
swingRatio: 0.5   // No swing (straight)
swingRatio: 0.55  // Subtle swing
swingRatio: 0.6   // Medium swing (recommended)
swingRatio: 0.67  // Strong swing (triplet feel)
swingRatio: 0.75  // Maximum swing
```

---

## Musical Complexity

### `style: string`
Overall musical style/genre.

```typescript
style: 'edm'        // Electronic Dance Music (128 BPM)
style: 'techno'     // Minimal Techno (130 BPM)
style: 'rock'       // Rock/Alternative (120 BPM)
style: 'jazz'       // Jazz/Swing (120-140 BPM)
style: 'lofi'       // Lo-Fi Hip-Hop (85 BPM)
style: 'cinematic'  // Film/Game Score (90 BPM)
style: 'ambient'    // Atmospheric Soundscapes (60 BPM)
```

See [Style Guide](#style-guide) for detailed characteristics and recommended settings for all 7 styles.

### `simpleMode: boolean`
Simplified generation with automatic quality settings.

```typescript
simpleMode: true   // Automatic, high-quality (recommended for beginners)
simpleMode: false  // Advanced mode with full parameter control
```

When `simpleMode: true`:
- Automatic phrase lengths
- Balanced density
- Appropriate complexity for style
- Safety gates enabled
- Motif memory activated

### `harmonicComplexity: number` (0-1)
Harmonic sophistication and chord substitutions.

```typescript
harmonicComplexity: 0.0  // Simple, diatonic chords
harmonicComplexity: 0.3  // Some color chords
harmonicComplexity: 0.5  // Modal interchange (recommended)
harmonicComplexity: 0.7  // Secondary dominants
harmonicComplexity: 1.0  // Maximum complexity (jazz)
```

### `ornamentation: number` (0-1)
Amount of melodic embellishments (grace notes, slides, turns).

```typescript
ornamentation: 0.0  // Clean, simple melodies
ornamentation: 0.3  // Occasional ornaments
ornamentation: 0.5  // Moderate ornamentation (recommended)
ornamentation: 0.7  // Heavily ornamented
ornamentation: 1.0  // Maximum embellishment
```

---

## Advanced Parameters

### Phrasing & Structure

#### `phrasing: string`
Target phrase length.

```typescript
phrasing: 'short'   // 2-4 bars
phrasing: 'medium'  // 4-8 bars (recommended)
phrasing: 'long'    // 8-16 bars
```

#### `cadenceStrength: number` (0-1)
Strength of cadential resolution at phrase ends.

```typescript
cadenceStrength: 0.0  // No resolution
cadenceStrength: 0.5  // Natural cadences (recommended)
cadenceStrength: 1.0  // Strong, definitive cadences
```

### Dynamics & Automation

#### `dynamicsShape: string`
Overall volume/intensity contour.

```typescript
dynamicsShape: 'flat'   // Constant level
dynamicsShape: 'rise'   // Gradual build
dynamicsShape: 'fall'   // Gradual fade
dynamicsShape: 'swell'  // Rise then fall (recommended)
```

#### `dynamicsStrength: number` (0-1)
Intensity of dynamic changes.

```typescript
dynamicsStrength: 0.0  // Flat dynamics
dynamicsStrength: 0.3  // Subtle (recommended)
dynamicsStrength: 0.5  // Moderate
dynamicsStrength: 1.0  // Dramatic
```

### Track Interaction

#### `callResponseIntensity: number` (0-1)
Alternation between lead and chords (call-and-response).

```typescript
callResponseIntensity: 0.0  // Simultaneous
callResponseIntensity: 0.5  // Balanced (recommended)
callResponseIntensity: 1.0  // Strong alternation
```

#### `bassEchoProbability: number` (0-1)
Chance bass echoes recent lead fragments.

```typescript
bassEchoProbability: 0.0  // Independent bass
bassEchoProbability: 0.3  // Occasional echoes (recommended)
bassEchoProbability: 0.7  // Frequent echoes
```

### Drum Controls

#### `fillRate: number` (0-1)
Frequency of drum fills.

```typescript
fillRate: 0.0  // No fills
fillRate: 0.3  // Occasional fills (recommended)
fillRate: 0.5  // Frequent fills
fillRate: 1.0  // Fill-heavy (use sparingly)
```

#### `accentMapIntensity: number` (0-1)
Strength of accent/ghost note patterns from groove template.

```typescript
accentMapIntensity: 0.0  // Flat dynamics
accentMapIntensity: 0.5  // Natural accents (recommended)
accentMapIntensity: 1.0  // Strong accents
```

---

## Style Guide

### EDM (Electronic Dance Music)

**Characteristics**:
- Four-on-the-floor kick pattern
- Energetic hi-hats and percussion
- Synth lead melodies
- Bass follows kick drum
- Build-ups and drops

**Recommended Settings**:
```typescript
{
  style: 'edm',
  bpm: 128,
  variation: 0.3,
  grooveTemplate: 'straight',
  harmonicComplexity: 0.3,
  dynamicsShape: 'swell',
  fillRate: 0.4
}
```

### Cinematic (Film/Game Score)

**Characteristics**:
- Atmospheric pads and FX
- Dramatic chord progressions
- Sparse, impactful drums
- Epic/emotional melodies
- Wide dynamic range

**Recommended Settings**:
```typescript
{
  style: 'cinematic',
  bpm: 90,
  variation: 0.4,
  grooveTemplate: 'straight',
  harmonicComplexity: 0.5,
  dynamicsShape: 'swell',
  dynamicsStrength: 0.7,
  ornamentation: 0.6
}
```

### LoFi (Lo-Fi Hip-Hop)

**Characteristics**:
- Relaxed, laid-back feel
- Simple, repetitive drum patterns
- Jazz-influenced chord progressions
- Mellow, nostalgic melodies
- Analog/vintage character

**Recommended Settings**:
```typescript
{
  style: 'lofi',
  bpm: 85,
  variation: 0.5,
  grooveTemplate: 'mpc62',
  harmonicComplexity: 0.4,
  dynamicsShape: 'flat',
  fillRate: 0.2
}
```

### Jazz

**Characteristics**:
- Swing feel
- Walking bass lines
- Complex chord voicings
- Improvised-sounding melodies
- Sophisticated harmonies

**Recommended Settings**:
```typescript
{
  style: 'jazz',
  bpm: 140,
  variation: 0.6,
  grooveTemplate: 'shuffle',
  swingRatio: 0.6,
  harmonicComplexity: 0.7,
  harmonicRhythmVariance: 0.5,
  ornamentation: 0.7
}
```

### Techno

**Characteristics**:
- Driving, machine-like precision
- Minimal, hypnotic repetition
- Heavy sidechain pumping
- Tight, locked groove
- Underground club atmosphere

**Recommended Settings**:
```typescript
{
  style: 'techno',
  bpm: 130,
  variation: 0.25,          // Tight, mechanical feel
  grooveTemplate: 'straight',
  harmonicComplexity: 0.3,
  sidechainStrength: 0.78,  // Heavy pumping
  legatoStrength: 0.2,      // Short, punchy notes
  chordStabArpIntensity: 0.6,
  fillRate: 0.2             // Minimal fills
}
```

### Rock

**Characteristics**:
- Verse-chorus-bridge structure
- Guitar-driven sound
- I-vi-IV-V progressions
- Organic, live band feel
- Anthemic melodies

**Recommended Settings**:
```typescript
{
  style: 'rock',
  bpm: 120,
  variation: 0.4,
  grooveTemplate: 'straight',
  harmonicComplexity: 0.4,
  sidechainStrength: 0.2,   // Minimal EDM effects
  legatoStrength: 0.4,
  phrasing: 'medium',       // 4-bar phrases
  cadenceStrength: 0.7,     // Strong phrase endings
  fillRate: 0.4             // Frequent drum fills
}
```

### Ambient

**Characteristics**:
- Sparse, atmospheric textures
- Minimal percussion
- Sustained notes and drones
- Meditative, floating quality
- Long, evolving phrases

**Recommended Settings**:
```typescript
{
  style: 'ambient',
  bpm: 60,
  variation: 0.3,
  grooveTemplate: 'straight',
  density: 0.3,             // Sparse note placement
  harmonicComplexity: 0.4,
  pedalToneStrength: 0.6,   // Sustained drones
  legatoStrength: 0.75,     // Very smooth, connected
  sidechainStrength: 0.05,  // Minimal pumping
  dynamicsShape: 'swell',
  phrasing: 'long',         // 8-bar phrases
  fillRate: 0.1             // Very minimal drums
}
```

---

## Best Practices

### For Clean Loops

1. Use bar-aligned durations (8, 16, 32 seconds)
2. Keep `density` moderate (0.4-0.6)
3. Use consistent `seed` for variations
4. Avoid extreme parameter values

### For Natural Feel

1. Use `variation: 0.4-0.6` for most styles
2. Match `grooveTemplate` to style
3. Enable `simpleMode` for automatic quality
4. Use subtle dynamics (`dynamicsStrength: 0.3-0.5`)

### For Maximum Quality

1. Start with style presets (see [Style Guide](#style-guide))
2. Adjust 1-2 parameters at a time
3. Test with multiple seeds
4. Listen for musical coherence
5. Export to MIDI and verify length

### Performance Tips

1. Keep `durationSecs` under 60 for fast generation
2. Lower `density` reduces computation
3. `simpleMode: true` is faster
4. Reuse `seed` for consistent results

---

## Troubleshooting

### Issue: Output length doesn't match durationSecs

**Solution**: 
- This should be fixed in current version (Week 1 refactor)
- Verify all events end before `durationSecs`
- Check MIDI export matches playback length

### Issue: Output sounds too robotic

**Solution**:
- Increase `variation` (try 0.4-0.6)
- Use appropriate `grooveTemplate` for style
- Enable humanization: `humanizeTime: 0.3`, `humanizeVel: 0.3`

### Issue: Output sounds chaotic/random

**Solution**:
- Decrease `variation` (try 0.3-0.5)
- Lower `harmonicComplexity` (try 0.3-0.5)
- Reduce `ornamentation` (try 0.3-0.5)
- Enable `simpleMode: true`

### Issue: Melody doesn't fit chords

**Solution**:
- Increase `leadChordToneBias` (try 0.7-0.9)
- Use `simpleMode: true` for automatic chord-tone targeting
- Lower `harmonicComplexity` for simpler harmonies

### Issue: Drums are too busy/sparse

**Solution**:
- Adjust `density` (try 0.5-0.7 for busy, 0.3-0.5 for sparse)
- Adjust `fillRate` (try 0.2-0.4 for moderate fills)
- Use style preset as starting point

### Issue: Bass doesn't lock with drums

**Solution**:
- This should be fixed in current version (Week 2 refactor)
- Ensemble-based humanization keeps rhythm section tight
- Try `variation: 0.3-0.4` for tighter feel

---

## Parameter Reference Quick Table

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `seed` | any int | required | Random seed |
| `durationSecs` | 1-600 | required | Length in seconds |
| `bpm` | 60-200 | 120 | Tempo |
| `key` | string | 'C' | Musical key |
| `density` | 0-1 | 0.5 | Note density |
| `style` | enum | 'edm' | Musical style |
| `variation` | 0-1 | 0.5 | Humanization amount |
| `grooveTemplate` | enum | 'straight' | Rhythmic groove |
| `simpleMode` | boolean | false | Auto quality mode |
| `harmonicComplexity` | 0-1 | 0.5 | Chord complexity |
| `ornamentation` | 0-1 | 0.5 | Melodic embellishment |
| `fillRate` | 0-1 | 0.3 | Drum fill frequency |
| `dynamicsShape` | enum | 'swell' | Volume contour |
| `phrasing` | enum | 'medium' | Phrase length |

---

## Advanced Topics

For advanced usage including:
- Custom adaptive profiles
- Precise voice leading control
- Extended LFO automation
- Sidechain ducking
- Register lift effects

See: [Advanced Parameters Documentation](./ADVANCED_PARAMETERS.md)

---

## Examples

### Example 1: Tight EDM Loop
```typescript
const edm = EnhancedHelixEngine.generate({
  seed: 12345,
  durationSecs: 8,
  bpm: 128,
  key: 'C',
  timeSignature: '4/4',
  density: 0.7,
  style: 'edm',
  variation: 0.3,
  grooveTemplate: 'straight',
  dynamicsShape: 'swell',
  fillRate: 0.4
});
```

### Example 2: Atmospheric Cinematic
```typescript
const cinematic = EnhancedHelixEngine.generate({
  seed: 54321,
  durationSecs: 32,
  bpm: 80,
  key: 'Am',
  timeSignature: '4/4',
  density: 0.4,
  style: 'cinematic',
  variation: 0.5,
  harmonicComplexity: 0.6,
  dynamicsShape: 'rise',
  dynamicsStrength: 0.7,
  ornamentation: 0.6
});
```

### Example 3: Swinging Jazz
```typescript
const jazz = EnhancedHelixEngine.generate({
  seed: 99999,
  durationSecs: 16,
  bpm: 140,
  key: 'Bb',
  timeSignature: '4/4',
  density: 0.6,
  style: 'jazz',
  variation: 0.6,
  grooveTemplate: 'shuffle',
  swingRatio: 0.6,
  harmonicComplexity: 0.7,
  ornamentation: 0.7,
  fillRate: 0.3
});
```

### Example 4: Simple Mode (Beginner-Friendly)
```typescript
const simple = EnhancedHelixEngine.generate({
  seed: 11111,
  durationSecs: 16,
  bpm: 120,
  key: 'G',
  timeSignature: '4/4',
  density: 0.6,
  style: 'lofi',
  simpleMode: true  // ✅ That's it! Automatic quality settings
});
```

### Example 5: Hypnotic Techno
```typescript
const techno = EnhancedHelixEngine.generate({
  seed: 77777,
  durationSecs: 16,
  bpm: 130,
  key: 'Dm',
  timeSignature: '4/4',
  density: 0.7,
  style: 'techno',
  variation: 0.25,          // Tight, mechanical
  grooveTemplate: 'straight',
  sidechainStrength: 0.78,  // Heavy pumping
  legatoStrength: 0.2,
  fillRate: 0.2
});
```

### Example 6: Driving Rock
```typescript
const rock = EnhancedHelixEngine.generate({
  seed: 44444,
  durationSecs: 24,
  bpm: 120,
  key: 'E',
  timeSignature: '4/4',
  density: 0.6,
  style: 'rock',
  variation: 0.4,
  harmonicComplexity: 0.4,
  cadenceStrength: 0.7,     // Strong phrase endings
  fillRate: 0.4             // Frequent drum fills
});
```

### Example 7: Meditative Ambient
```typescript
const ambient = EnhancedHelixEngine.generate({
  seed: 33333,
  durationSecs: 45,
  bpm: 60,
  key: 'F',
  timeSignature: '4/4',
  density: 0.3,             // Sparse
  style: 'ambient',
  variation: 0.3,
  pedalToneStrength: 0.6,   // Sustained drones
  legatoStrength: 0.75,     // Very smooth
  phrasing: 'long',         // 8-bar phrases
  dynamicsShape: 'swell'
});
```

---

## Support

For issues, questions, or feature requests, see:
- [GitHub Issues](https://github.com/your-repo/issues)
- [Project Documentation](./README.md)
- [Refactoring Status](./docs/refactor/PROJECT_COMPLETE.md)

---

**Version**: 2.0 (Post-Refactoring)  
**Last Updated**: 2025-10-28
