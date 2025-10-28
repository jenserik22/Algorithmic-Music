# Algorithmic Music Generator - User Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Simple Mode](#simple-mode)
3. [Advanced Mode](#advanced-mode)
4. [Musical Styles](#musical-styles)
5. [Algorithm Comparison](#algorithm-comparison)
6. [Parameter Reference](#parameter-reference)
7. [Tips & Best Practices](#tips--best-practices)

---

## Quick Start

### Generate Your First Track (Simple Mode)

1. **Select a Style** - Choose from 7 musical styles (EDM, Techno, Rock, Jazz, Lo-Fi, Cinematic, Ambient)
2. **Set Basic Parameters:**
   - Duration: 15-120 seconds
   - Tempo: 60-180 BPM
   - Key: Any musical key (C, D♭, D, etc.)
   - Mode: Major or Minor
3. **Click "Generate Music"** - Wait 5-30 seconds for generation
4. **Listen & Enjoy** - Use playback controls or download MIDI

**That's it!** Simple Mode uses carefully tuned defaults for each style.

### 🎲 Random Seed (Reproducibility)

Every generation uses a random "seed" number that determines the exact output. The UI automatically generates a new random seed each time you click "Generate Music."

**Why it matters:**
- **Same seed = Same output** - Perfect for reproducing a track you liked
- **Different seed = Different variation** - Same parameters, different melody/rhythm

**Note:** 
- **Simple Mode:** Seed is automatic - new random seed each time
- **Advanced Mode:** You can see and control the seed! Use the seed input box at the top of the Enhanced Helix section to view, edit, or randomize the seed.

---

## Simple Mode

### Overview
Simple Mode is designed for quick music generation with minimal parameters. Each style has been professionally tuned with optimal defaults.

### Available Styles

#### 🎛️ EDM (Electronic Dance Music)
- **Tempo:** 128 BPM
- **Character:** High energy, 4-on-floor kick pattern
- **Best For:** Dance tracks, party music, workouts
- **Key Features:** Strong sidechain pumping, driving bass, synth leads

#### 🔊 Techno
- **Tempo:** 130 BPM
- **Character:** Machine-like precision, hypnotic repetition
- **Best For:** Underground club vibes, minimal techno
- **Key Features:** Heavy sidechain (0.78), tight grooves, mechanical feel

#### 🎸 Rock
- **Tempo:** 120 BPM
- **Character:** Verse-chorus-bridge structure, organic feel
- **Best For:** Rock anthems, alternative music
- **Key Features:** I-vi-IV-V progressions, guitar-like phrasing

#### 🎷 Jazz
- **Tempo:** 120 BPM
- **Character:** Swing feel, sophisticated harmony
- **Best For:** Background music, lounge atmosphere
- **Key Features:** Dominant 7th chords, swing groove, 32-bar solos

#### 📻 Lo-Fi
- **Tempo:** 85 BPM
- **Character:** Relaxed, laid-back, study vibes
- **Best For:** Background music, studying, relaxation
- **Key Features:** Heavy shuffle, gaussian humanization, warm sound

#### 🎬 Cinematic
- **Tempo:** 90 BPM
- **Character:** Epic, orchestral, emotional arcs
- **Best For:** Film scores, trailers, dramatic moments
- **Key Features:** Long phrases (8 bars), modal harmony, dynamic swells

#### 🌌 Ambient
- **Tempo:** 60 BPM
- **Character:** Sparse, atmospheric, meditative
- **Best For:** Relaxation, meditation, soundscapes
- **Key Features:** High legato (0.75), pedal tones, minimal drums

### Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Duration** | 15-120 sec | Total track length |
| **Tempo** | 60-180 BPM | Beats per minute (auto-set by style) |
| **Key** | C - B | Musical root note |
| **Mode** | Major/Minor | Scale type (happy/sad) |

---

## Advanced Mode

### Overview
Advanced Mode unlocks 30+ parameters for fine-grained control over music generation. Perfect for power users and experimental music.

### Getting Started with Advanced Mode

1. **Switch to Advanced Mode** - Click the toggle at the top
2. **Select a Style** - This auto-populates parameters with style defaults
3. **Choose Algorithm:**
   - **Baseline:** Original algorithm (deprecated)
   - **Enhanced Helix:** Modern algorithm with all features (recommended)
4. **Adjust Parameters** - Hover over **?** icons for parameter explanations
5. **Generate** - Create your customized track

### Advanced Mode Sections

#### 0. **Random Seed Control** (At the top)
The first thing you'll see in Enhanced Helix Advanced Mode is the **Random Seed** box.

**What it does:**
- Displays your current seed number
- **Input field:** Type any number (0-999999) to use a specific seed
- **🎲 Randomize button:** Click to generate a new random seed instantly
- **Current display:** Shows the active seed below the input

**Use cases:**
- **Reproducing tracks:** Note the seed number to recreate the exact same track later
- **Sharing:** Give someone your seed + parameters and they'll get identical output
- **Variations:** Change seed slightly (e.g., 12345 → 12346) for similar but different results
- **Experimentation:** Lock seed to compare how different parameters affect the same base

#### 1. **Humanization** (6 parameters)
Controls timing and velocity variations to make music feel human-played.

#### 2. **Melody & Spacing** (7 parameters)
Shapes melodic contour, intervals, and note spacing.

#### 3. **Phrasing & Harmony** (7 parameters)
Defines phrase structure and chord progressions.

#### 4. **Conversation** (3 parameters)
Controls interaction between instruments (call-response, density).

#### 5. **Dynamics & FX** (5 parameters)
Volume envelopes, register changes, modulation, sidechain.

#### 6. **Ornamentation** (3 parameters)
Grace notes, legato/staccato, chord voicings.

#### 7. **Experimental** (2 parameters)
Adaptive AI-driven parameter adjustment (optional).

---

## Musical Styles

### Style Comparison Table

| Style | Tempo | Sidechain | Groove | Legato | Best Use Case |
|-------|-------|-----------|--------|--------|---------------|
| **EDM** | 128 | 0.65 | Straight | 0.3 | Dance, party |
| **Techno** | 130 | 0.78 | Straight | 0.2 | Club, minimal |
| **Rock** | 120 | 0.20 | Straight | 0.4 | Anthems, alt-rock |
| **Jazz** | 120 | 0.10 | Swing | 0.5 | Lounge, background |
| **Lo-Fi** | 85 | 0.30 | Shuffle | 0.6 | Study, chill |
| **Cinematic** | 90 | 0.15 | Straight | 0.5 | Film, dramatic |
| **Ambient** | 60 | 0.05 | Straight | 0.75 | Meditation, soundscape |

### When to Use Each Style

**🎛️ EDM** - High energy environments, workouts, gaming streams
**🔊 Techno** - Underground vibes, tech projects, hypnotic loops
**🎸 Rock** - Driving music, energetic content, guitar-focused
**🎷 Jazz** - Sophisticated background, cafes, lounge music
**📻 Lo-Fi** - Study sessions, focus work, relaxation
**🎬 Cinematic** - Video projects, trailers, emotional content
**🌌 Ambient** - Meditation, sleep, atmospheric soundscapes

---

## Algorithm Comparison

### Baseline (Deprecated)
The original algorithm with basic features:
- ✅ Basic melody and chord generation
- ✅ Simple drum patterns
- ❌ Limited humanization
- ❌ No conversation/interaction
- ❌ Basic dynamics only

**Status:** Kept for backward compatibility, not recommended.

### Enhanced Helix (Recommended)
The modern algorithm with all features:
- ✅ Advanced humanization (ensemble drift, groove templates)
- ✅ Sophisticated melody generation (phrase-based, register lift)
- ✅ Rich harmony (voice leading, pedal tones, substitutions)
- ✅ Inter-track conversation (call-response, density gating)
- ✅ Dynamic envelopes (rises, falls, swells)
- ✅ Comprehensive ornamentation
- ✅ 7 professionally tuned style presets

**Status:** Production-ready, recommended for all use cases.

---

## Parameter Reference

### Humanization

#### **Humanize Distribution**
- **Values:** uniform | gaussian
- **Effect:** How timing/velocity variations are distributed
- **Tooltip:** "Uniform = even spread, Gaussian = centered around beat (more natural)"

#### **Groove Template**
- **Values:** straight | shuffle | mpc62 | funk
- **Effect:** Rhythmic feel template
- **Tooltip:** "Straight=on-grid, Shuffle=swing 16ths, MPC62=classic sampler groove, Funk=syncopated"

#### **Humanize Time**
- **Range:** 0.0 - 1.0
- **Effect:** Timing variation amount
- **Tooltip:** "Timing imperfections. 0=robotic, 0.15=natural, 0.3+=sloppy"
- **Typical:** 0.08-0.15

#### **Swing Ratio** (when shuffle/swing selected)
- **Range:** 0.5 - 0.75
- **Effect:** Strength of swing/shuffle
- **Tooltip:** "Controls shuffle timing. 0.5=straight, 0.6=subtle, 0.66=triplet swing, 0.75=extreme"
- **Typical:** 0.60-0.66

#### **Humanize Velocity**
- **Range:** 0.0 - 1.0
- **Effect:** Volume variation between notes
- **Tooltip:** "Volume variations. 0=flat, 0.15=natural, 0.3+=very dynamic"
- **Typical:** 0.10-0.20

#### **Rushing/Dragging**
- **Range:** 0.0 - 1.0
- **Effect:** Ensemble drift (tracks drift slightly apart/together)
- **Tooltip:** "Ensemble tempo drift. 0=locked, 0.3=slight drift, 0.5+=significant rushing/dragging"
- **Typical:** 0.10-0.25

---

### Melody & Spacing

#### **Lead Chord-Tone Bias**
- **Range:** 0.0 - 1.0
- **Effect:** How much melodies stick to chord tones
- **Tooltip:** "How strongly lead melodies stick to chord tones. 0=chromatic freedom, 0.5=balanced, 1=only chord tones (safe but bland)"
- **Typical:** 0.50-0.80

#### **Lead Max Leap**
- **Values:** 0 (none), 7, 9, 12 semitones
- **Effect:** Maximum melodic interval jump
- **Tooltip:** "Maximum interval jump in lead melodies. 5=smooth/stepwise, 7=singable, 12=wide/dramatic leaps"
- **Typical:** 7-9

#### **Min Gap (Space Allocator)**
- **Range:** 0.000 - 0.050 seconds
- **Effect:** Minimum silence between lead notes
- **Tooltip:** "Minimum silence between lead notes. 0.01=dense/busy, 0.02=natural breathing, 0.03+=sparse/spacious"
- **Typical:** 0.015-0.025

#### **Drum Accent Intensity**
- **Range:** 0.0 - 1.0
- **Effect:** Emphasis on downbeats
- **Tooltip:** "Emphasizes downbeats and strong beats in drums. 0=flat dynamics, 0.5=natural accents, 1=heavy emphasis"
- **Typical:** 0.40-0.70

#### **Bass Anticipation**
- **Range:** 0.0 - 1.0
- **Effect:** Bass plays ahead of beat
- **Tooltip:** "Bass plays slightly ahead of beat (anticipation). 0=on-beat, 0.3=subtle groove, 0.5+=very forward-driving"
- **Typical:** 0.10-0.30

#### **Rhythm Markov Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Pattern repetition via probability chains
- **Tooltip:** "Uses probability chains for rhythm patterns. 0=random, 0.5=balanced variety, 1=highly repetitive patterns"
- **Typical:** 0.50-0.75

#### **Chord Voice-Leading Bias**
- **Range:** 0.0 - 1.0
- **Effect:** Smooth chord transitions
- **Tooltip:** "Smooth voice leading between chords (small melodic movement). 0=random inversions, 0.7=smooth classical, 1=minimal movement"
- **Typical:** 0.60-0.80

---

### Phrasing & Harmony

#### **Phrasing**
- **Values:** short (2 bars) | medium (4 bars) | long (8 bars)
- **Effect:** Musical phrase length
- **Tooltip:** "Musical phrase length. Short=2 bars (energetic), Medium=4 bars (balanced), Long=8 bars (epic/cinematic)"
- **Typical:** Medium for most styles, Long for cinematic

#### **Cadence Strength**
- **Range:** 0.0 - 1.0
- **Effect:** How strongly phrases resolve
- **Tooltip:** "How strongly phrases end with cadences (musical punctuation). 0=continuous flow, 0.7=clear phrases, 1=very defined endings"
- **Typical:** 0.50-0.80

#### **Harmonic Rhythm Variance**
- **Range:** 0.0 - 1.0
- **Effect:** Frequency of chord changes
- **Tooltip:** "How often chord changes occur. 0=static harmony, 0.5=varied timing, 1=frequent changes"
- **Typical:** 0.30-0.60

#### **Harmonic Complexity**
- **Range:** 0.0 - 1.0
- **Effect:** Chord substitutions and extensions
- **Tooltip:** "Chord substitutions and extensions. 0=basic triads, 0.5=7th chords, 1=jazz/complex voicings"
- **Typical:** 0.30 (rock) to 0.80 (jazz)

#### **Pedal Tone Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Sustained notes across chord changes
- **Tooltip:** "Sustained notes that hold across chord changes. 0=none, 0.5=occasional drones, 1=constant pedal tones (ambient)"
- **Typical:** 0.20-0.60 (higher for ambient)

---

### Conversation

#### **Call/Response Intensity**
- **Range:** 0.0 - 1.0
- **Effect:** Instruments take turns (musical dialogue)
- **Tooltip:** "Lead and other instruments take turns (musical conversation). 0=independent, 0.5=some interplay, 1=strong call-response"
- **Typical:** 0.30-0.60

#### **Bass Echo Probability**
- **Range:** 0.0 - 1.0
- **Effect:** Bass echoes lead melody
- **Tooltip:** "Bass echoes lead melody rhythmically. 0=independent bassline, 0.5=occasional echoes, 1=bass follows lead closely"
- **Typical:** 0.20-0.50

#### **Density Gate Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Reduces clutter in busy sections
- **Tooltip:** "Reduces note density in busy sections to prevent clutter. 0=all notes play, 0.5=moderate thinning, 1=aggressive sparse"
- **Typical:** 0.30-0.50

---

### Dynamics & FX

#### **Dynamics Shape**
- **Values:** flat | rise | fall | swell
- **Effect:** Overall volume contour
- **Tooltip:** "Overall volume contour. Flat=constant, Rise=builds up, Fall=decreases, Swell=grows then fades (cinematic)"
- **Typical:** Flat for EDM, Swell for cinematic

#### **Dynamics Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Intensity of volume changes
- **Tooltip:** "Intensity of volume changes. 0=flat dynamics, 0.5=natural expression, 1=dramatic contrast"
- **Typical:** 0.40-0.70

#### **Register Lift**
- **Range:** 0.0 - 1.0
- **Effect:** Melody rises during climaxes
- **Tooltip:** "Melodic register rises during climaxes. 0=constant register, 0.5=subtle lift, 1=dramatic octave jumps"
- **Typical:** 0.30-0.60

#### **Extended LFO**
- **Range:** 0.0 - 1.0
- **Effect:** Modulation effects (vibrato, filter sweeps)
- **Tooltip:** "Modulation/automation effects (vibrato, filter sweeps). 0=static, 0.5=subtle movement, 1=heavy modulation"
- **Typical:** 0.20-0.50

#### **Sidechain Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Pumping effect (EDM ducking)
- **Tooltip:** "Pumping effect (EDM). Other instruments duck when kick hits. 0=none, 0.5=subtle, 0.8=heavy pumping"
- **Typical:** 0.05 (ambient) to 0.78 (techno)

---

### Ornamentation

#### **Ornamentation**
- **Range:** 0.0 - 1.0
- **Effect:** Grace notes, trills, slides
- **Tooltip:** "Grace notes, trills, slides. 0=plain notes, 0.5=occasional ornaments, 1=heavily decorated (baroque)"
- **Typical:** 0.20-0.50

#### **Legato Strength**
- **Range:** 0.0 - 1.0
- **Effect:** Note overlap (smooth vs detached)
- **Tooltip:** "Smooth, connected notes (overlapping). 0=staccato/detached, 0.5=balanced, 1=fully legato/flowing (ambient)"
- **Typical:** 0.30-0.60 (0.75 for ambient)

#### **Chord Stab/Arp Intensity**
- **Range:** 0.0 - 1.0
- **Effect:** Block chords vs arpeggios
- **Tooltip:** "Chords as stabs or arpeggios. 0=block chords, 0.5=mix, 1=broken/arpeggiated chords (EDM/techno)"
- **Typical:** 0.30-0.70 (higher for electronic styles)

---

## Tips & Best Practices

### For Beginners

1. **Start with Simple Mode** - Get familiar with the 7 styles first
2. **Experiment with Styles** - Each has a distinct character
3. **Try Different Keys** - Major = happy/bright, Minor = sad/dark
4. **Adjust Duration** - Start with 30-60 seconds for quick iterations
5. **Use Tooltips** - Hover over ? icons in Advanced Mode to learn

### For Advanced Users

#### Creating Natural-Sounding Music
- Keep **Humanize Time** between 0.08-0.15
- Use **Gaussian distribution** for more natural feel
- Add **Rushing/Dragging** (0.10-0.20) for ensemble realism
- Vary **Dynamics Strength** (0.40-0.70) for expression

#### Creating Electronic/Dance Music
- Increase **Sidechain Strength** (0.65-0.80)
- Use **Straight groove** with minimal humanization
- Higher **Chord Stab/Arp** (0.60-0.80)
- Lower **Legato** (0.20-0.30) for tight feel

#### Creating Cinematic Music
- Use **Long phrasing** (8 bars)
- **Swell dynamics shape**
- Higher **Register Lift** (0.50-0.70)
- **Pedal Tones** for drama (0.40-0.60)
- Lower tempo (70-90 BPM)

#### Creating Jazz
- **Swing groove** with high swing ratio (0.62-0.66)
- High **Harmonic Complexity** (0.70-0.80)
- Moderate **Legato** (0.50-0.60)
- Lower **Sidechain** (<0.20)

### Common Workflows

#### Quick Background Music
1. Simple Mode → Lo-Fi or Ambient
2. Adjust duration to match video length
3. Generate → Download MIDI

#### Dance Track Prototype
1. Simple Mode → EDM or Techno
2. Advanced Mode → Increase sidechain to 0.75+
3. Adjust tempo if needed
4. Generate → Export

#### Experimental Soundscape
1. Advanced Mode → Ambient style
2. Increase **Pedal Tone Strength** → 0.70
3. Increase **Extended LFO** → 0.60
4. Set **Legato** → 0.80
5. Reduce **Drum Accent** → 0.20
6. Generate → Explore

### Reproducibility & Variations

**Want to recreate a track?**
- Each generation uses a random seed number for uniqueness
- **In Simple Mode:** Seed is automatic, download MIDI to save tracks
- **In Advanced Mode:** Seed is displayed! Copy the number to recreate later
- **Best practice:** Note down the seed number from Advanced Mode or download MIDI

**Want variations on the same theme?**
- Keep all parameters the same
- Click "Generate Music" again for a new variation
- Each generation uses a different random seed automatically
- Similar style, but different melody/rhythm each time

### Troubleshooting

**Problem:** Music sounds too robotic
- **Solution:** Increase Humanize Time (0.12-0.15) and Velocity (0.15-0.20)

**Problem:** Music is too cluttered/busy
- **Solution:** Increase Density Gate Strength (0.40-0.60)

**Problem:** Melodies are too jumpy
- **Solution:** Reduce Lead Max Leap to 7, increase Chord-Tone Bias

**Problem:** Chords sound disconnected
- **Solution:** Increase Chord Voice-Leading Bias (0.70-0.80)

**Problem:** No clear structure
- **Solution:** Increase Cadence Strength (0.60-0.80), use Medium/Long phrasing

---

## Export & Integration

### MIDI Export
- Click **"Download MIDI"** button after generation
- Import into your DAW (Ableton, FL Studio, Logic Pro, etc.)
- Assign your own instruments and mix

### Playback
- Use built-in soundfont player
- Adjust volume with playback controls
- Loop for longer listening

### Next Steps
- Import MIDI into DAW
- Replace with high-quality VSTs/samples
- Add effects (reverb, delay, compression)
- Mix and master to taste

---

## Keyboard Shortcuts

*(None currently implemented - future feature)*

---

## FAQ

**Q: Which algorithm should I use?**
A: Always use **Enhanced Helix**. Baseline is deprecated.

**Q: How long does generation take?**
A: 5-30 seconds depending on duration and parameters.

**Q: Can I edit the generated MIDI?**
A: Yes! Download the MIDI and import into any DAW.

**Q: Why does my track sound different each time?**
A: Each generation uses a different random seed for uniqueness. The seed determines the exact melody, rhythm, and note choices. This is intentional - you get fresh variations every time!

**Q: How do I recreate the exact same track?**
A: In Advanced Mode (with Enhanced Helix), you'll see a "Random Seed" box at the top showing your current seed number. Save this number along with your parameter settings. To recreate: enter the same seed, set the same parameters, and generate. In Simple Mode, download the MIDI file to keep tracks you like.

**Q: What's the best style for [use case]?**
A: See the [Style Comparison Table](#style-comparison-table) above.

**Q: Can I create my own style presets?**
A: Not in the UI yet, but you can save your Advanced Mode settings manually.

**Q: What is a "seed" and why does it matter?**
A: A seed is a number that controls the random generation. Same seed + same parameters = identical output every time. Different seed = different variation. Think of it like a recipe number - recipe #12345 always makes the same dish!

---

## Credits

Built with Enhanced Helix algorithm featuring:
- Ensemble-based humanization
- Phrase-aware melody generation
- Voice-leading harmony system
- Inter-track conversation
- Dynamic envelope shaping

For technical details, see `docs/MUSIC_GENERATION.md`

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-28  
**Algorithm:** Enhanced Helix v2
