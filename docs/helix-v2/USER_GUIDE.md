# Enhanced Helix — User Guide (Phase 1–5 Settings)

This guide explains the new Enhanced Helix settings and provides recommended values to get musical, human‑sounding results quickly. All settings are optional: leaving them unset preserves the original baseline.

## Where to find the settings
- Advanced mode → Algorithm: "Enhanced Helix"
- Humanization Presets (EDM / Cinematic / Lo‑Fi / Jazz)
- Individual controls under "Enhanced Helix" section

## Settings (what they do and when to use)

- Groove Template (straight | shuffle | mpc62 | funk)
  - Applies style‑specific micro‑timing feel across tracks.
  - Use when you want swing/feel beyond simple random jitter.

- Humanize Time (0..1)
  - Adds correlated timing variation per track. Higher = looser, more "live" feel.
  - Start 0.10–0.25. Keep lower for tight EDM; higher for Lo‑Fi/Jazz.

- Humanize Velocity (0..1)
  - Varies note intensity dynamically. Higher values emphasize accents and de‑quantize feel.
  - Start 0.15–0.35. Back off if dynamics feel erratic.

- Lead Chord‑Tone Bias (0..1)
  - Pushes lead notes on strong beats toward chord tones (root/3rd/5th). Weak beats remain more free.
  - Use 0.35–0.60 for clearer harmony; 0 for more exploratory lines.

- Drum Accent Intensity (0..1)
  - Shapes hats/backbeat with repeating accent maps; combines nicely with groove templates.
  - 0.20–0.40 is subtle and musical.

- Bass Anticipation (0..1)
  - Chance that bass hits the "& of 4" to lead into the next bar.
  - 0.20–0.35 adds energy without over‑syncopation.

- Chord Voice‑Leading Bias (0..1)
  - Chooses chord inversions that minimize movement between changes.
  - 0.30–0.80 depending on how smooth you want the harmony to move.

- Lead Max Leap (semitones: 0|7|9|12)
  - Limits large melodic jumps by octave‑folding.
  - 7 or 9 keeps lines more singable; 0 disables limiting.

- Space Allocator – Min Gap (secs 0..0.05)
  - Ensures a minimum gap between notes per track to reduce overlaps/clipping.
  - 0.010–0.020 is a good starting point.

- Phrasing (short | medium | long)
  - Shapes phrase boundaries (currently: short=2 bars, medium/long=4 bars).
  - Use "short" for energetic styles; "long" for cinematic builds.

- Cadence Strength (0..1)
  - Encourages cadential target notes (root/5th) at phrase ends; adds a tiny "breath" before cadence.
  - 0.5–0.9 yields clear musical closures without being too predictable.

- Harmonic Rhythm Variance (0..1)
  - Varies chord onset timing inside each 2‑beat cell (split beats, anticipations, late hits). 0 keeps baseline.
  - Use 0.2–0.6 to add movement in pads/comping.

- Harmonic Complexity (0..1)
  - Adds tasteful chord substitutions (diatonic swaps, light modal interchange, occasional secondary dominants).
  - Start 0.2–0.4. Higher values add more color; keep moderate for clarity.

- Pedal Tone Strength (0..1)
  - Adds sustained low bass pedal notes in low‑energy/break/ambient sections.
  - 1 forces at least one pedal per eligible section; 0.2–0.5 is subtle.

- Call/Response Intensity (0..1)
  - Alternates focus between lead (call) and chords (response) across bars. Higher values create clearer back‑and‑forth.

- Bass Echo Probability (0..1)
  - Chance the bass briefly echoes a recent lead fragment, adding glue between parts.

- Density Gate Strength (0..1)
  - Reduces simultaneous onsets across tracks to avoid clutter and improve clarity.

### Dynamics & FX (Phase 5)

- Dynamics Shape (flat | rise | fall | swell)
  - Section‑level envelope applied across each section; "rise" builds, "fall" tapers, "swell" crescendos into the center.

- Dynamics Strength (0..1)
  - Scales velocity and slightly scales note length by the section envelope. 0 keeps baseline; 0.3–0.6 is musical.

- Register Lift (lead) (0..1)
  - Gently lifts lead an octave near section climaxes depending on shape/energy. 0.1–0.3 adds height without excess.

- Extended LFO Targets (0..1)
  - Adds tasteful movement: `master.width`, `track:lead.vibrato`, `track:chords.filterRes`. Higher = deeper modulation.

- Sidechain Strength (0..1)
  - Emits sidechain pulses metadata (kick onsets) and mildly ducks chords/bass near kicks. 0.2–0.6 for EDM/lo‑fi glue.

## Quick recipes (good‑sounding starting points)

- EDM:
  - Groove: mpc62; Time 0.12; Vel 0.20; Lead Chord‑Tone 0.40; Accent 0.35; Bass Ant 0.30; Voice‑Lead 0.30; Max Leap 9; Min Gap 0.015
  - Phrasing short; Cadence 0.7; HarmRhythmVar 0.5; HarmComplex 0.3; Pedal 0.2; Call/Resp 0.6; Bass Echo 0.3; Density Gate 0.4
  - Dynamics: shape=swell; strength=0.6; regLift=0.2; extLFO=0.4; sidechain=0.6

- Cinematic:
  - Groove: straight; Time 0.12; Vel 0.15; Lead Chord‑Tone 0.50; Accent 0.10; Bass Ant 0.20; Voice‑Lead 0.70; Max Leap 7; Min Gap 0.020
  - Phrasing long; Cadence 0.9; HarmRhythmVar 0.3; HarmComplex 0.2; Pedal 0.5; Call/Resp 0.4; Bass Echo 0.2; Density Gate 0.3
  - Dynamics: shape=rise; strength=0.4; regLift=0.3; extLFO=0.3; sidechain=0.2

- Lo‑Fi:
  - Groove: shuffle; Time 0.25; Vel 0.30; Lead Chord‑Tone 0.35; Accent 0.40; Bass Ant 0.25; Voice‑Lead 0.40; Max Leap 7; Min Gap 0.020
  - Phrasing short; Cadence 0.6; HarmRhythmVar 0.4; HarmComplex 0.25; Pedal 0.3; Call/Resp 0.3; Bass Echo 0.25; Density Gate 0.2
  - Dynamics: shape=fall; strength=0.3; regLift=0.1; extLFO=0.3; sidechain=0.2

- Jazz:
  - Groove: shuffle; Time 0.15; Vel 0.20; Lead Chord‑Tone 0.50; Accent 0.20; Bass Ant 0.35; Voice‑Lead 0.80; Max Leap 9; Min Gap 0.015
  - Phrasing medium; Cadence 0.5; HarmRhythmVar 0.35; HarmComplex 0.4; Pedal 0.2; Call/Resp 0.5; Bass Echo 0.2; Density Gate 0.3
  - Dynamics: shape=swell; strength=0.3; regLift=0.2; extLFO=0.2; sidechain=0.2

## Tips for better results
- Start from a preset, then tweak one control at a time.
- Keep Humanize Time moderate if you also use strong groove templates.
- Increase Lead Chord‑Tone Bias for clearer harmony; reduce for more exploratory melodies.
- Use Phrasing + Cadence to add musical sentences and closure.
- Keep Min Gap > 0 to avoid overlaps when density is high.

## Notes
- All features are optional and backward‑compatible. With all values off/empty, Enhanced Helix matches the previous baseline.
- When Phase 2 flags are used, the engine version tag shows `v2-phase2`. With any Phase 3 flag, it shows `v2-phase3`. With any Phase 4 flag, it shows `v2-phase4`. With any Phase 5 flag, it shows `v2-phase5`.
