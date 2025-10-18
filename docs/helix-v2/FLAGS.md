# Enhanced Helix – Phase 1–5 Flags

This document summarizes the humanization and musicality flags introduced in Phase 1 and Phase 2. Defaults maintain Phase 0 baseline until a flag is set non‑zero.

- grooveTemplate: one of `straight (empty)`, `shuffle`, `mpc62`, `funk`. Applies correlated micro‑timing.
- humanizeTime: 0..1. Micro‑timing randomization amount.
- humanizeVel: 0..1. Velocity randomization amount.
- leadChordToneBias: 0..1. Probability bias for placing the lead on chord tones on strong beats.
- accentMapIntensity: 0..1. Hi‑hat/backbeat accent shaping.
- bassAnticipation: 0..1. Chance for bass to anticipate bar endings ("& of 4").
- chordVoiceLeadingBias: 0..1. Inversion selection bias for minimal movement between chords.
- leadMaxLeapSemitones: 0|7|9|12. Limits melodic leaps via octave folding.
- spaceAllocatorMinGapSecs: 0..0.05. Enforces per‑track minimum gaps to reduce overlaps.

Phase 2 (phrasing & cadence):
- phrasing: 'short' | 'medium' | 'long'. Target phrase length in bars (short=2, medium/long=4 currently).
- cadenceStrength: 0..1. Strength of cadential resolution at the end of each phrase (prefers chord root/5th, pins timing to beat).

Phase 3 (harmonic expansion):
- harmonicRhythmVariance: 0..1. Increases variation of chord onset timing within each 2‑beat cell (split, anticipations, late accents). Baseline unchanged when 0.
- harmonicComplexity: 0..1. Bias for chord substitutions (diatonic + modal interchange + light secondary dominants). Baseline substitutions remain when 0.
- pedalToneStrength: 0..1. Adds sustained low pedal tones in low‑energy or break sections (bass track). 1 forces at least one pedal per eligible section.

Phase 4 (inter‑track conversation):
- callResponseIntensity: 0..1. Alternation strength between lead (call) and chords (response) across bars.
- bassEchoProbability: 0..1. Chance the bass will echo a recent lead fragment shortly after.
- densityGateStrength: 0..1. Reduces simultaneous onsets across tracks to avoid clutter.

Phase 5 (dynamics/automation/FX):
- dynamicsShape: 'flat' | 'rise' | 'fall' | 'swell'. Section envelope shaping across each section.
- dynamicsStrength: 0..1. Scales velocity and note length by the section envelope.
- registerLiftStrength: 0..1. Gently lifts lead register near section climaxes (when applicable).
- extendedLfoTargets: 0..1. Adds extra LFO targets (e.g., master.width, lead.vibrato, chords.filterRes).
- sidechainStrength: 0..1. Emits sidechain pulses metadata (kick onsets) and applies mild ducking to chords/bass near kicks.

Simple Mode (global musicality toggle):
- simpleMode: boolean. When true, the engine prioritizes clarity and human‑like structure over complexity by applying:
  - Motif memory with round‑robin reuse per progression step (reduces randomness, reinforces themes)
  - Arrangement constraints: at most 3 concurrent tracks per section window (prefer drums, chords, lead)
  - Safety gates: strong‑beat chord‑tone enforcement with a final strict pass aligned to metrics; stepwise bias and leap limiting
  - Deterministic anchors: rooted bass (beats 1/3 with optional fifths), anchored lead on strong beats, steady drum scaffolding
  Notes:
  - Compatible with Phases 1–5 (groove/humanize/phrasing/harmony/conversation/dynamics still apply)
  - UI exposes this as a Simple/Advanced mode toggle on the generator panel
  - Target metric: ≥0.8 lead chord‑tone rate on strong beats (current tests: 1.0)

Style presets (UI suggestions):
- EDM: mpc62, 0.12, 0.20, 0.40, 0.35, 0.30, 0.30, 9, 0.015
- Cinematic: straight, 0.12, 0.15, 0.50, 0.10, 0.20, 0.70, 7, 0.020
- Lo‑Fi: shuffle, 0.25, 0.30, 0.35, 0.40, 0.25, 0.40, 7, 0.020
- Jazz: shuffle, 0.15, 0.20, 0.50, 0.20, 0.35, 0.80, 9, 0.015

Phase 2–3 preset add-ons:
- EDM: phrasing=short, cadenceStrength=0.7
- Cinematic: phrasing=long, cadenceStrength=0.9
- Lo‑Fi: phrasing=short, cadenceStrength=0.6
- Jazz: phrasing=medium, cadenceStrength=0.5

Suggested Phase 3 values:
- EDM: harmonicRhythmVariance=0.5, harmonicComplexity=0.3, pedalToneStrength=0.2
- Cinematic: 0.3, 0.2, 0.5
- Lo‑Fi: 0.4, 0.25, 0.3
- Jazz: 0.35, 0.4, 0.2

Suggested Phase 4 values:
- EDM: callResponseIntensity=0.6, bassEchoProbability=0.3, densityGateStrength=0.4
- Cinematic: 0.4, 0.2, 0.3
- Lo‑Fi: 0.3, 0.25, 0.2
- Jazz: 0.5, 0.2, 0.3

Suggested Phase 5 values:
- EDM: dynamicsShape='swell', dynamicsStrength=0.6, registerLiftStrength=0.2, extendedLfoTargets=0.4, sidechainStrength=0.6
- Cinematic: dynamicsShape='rise', dynamicsStrength=0.4, registerLiftStrength=0.3, extendedLfoTargets=0.3, sidechainStrength=0.2
- Lo‑Fi: dynamicsShape='fall', dynamicsStrength=0.3, registerLiftStrength=0.1, extendedLfoTargets=0.3, sidechainStrength=0.2
- Jazz: dynamicsShape='swell', dynamicsStrength=0.3, registerLiftStrength=0.2, extendedLfoTargets=0.2, sidechainStrength=0.2

## UI behavior: Advanced defaults & Duration
- Default algorithm is Enhanced Helix across Generator UI, Play Demo, and Quick Generate.
- When switching to Advanced mode, if the Duration still equals the preset value, it auto‑sets to 16s (user edits are preserved).
- In Advanced mode with Enhanced Helix, if the advanced controls are untouched, a style‑aware profile is auto‑applied for the selected style (EDM/Cinematic/Lo‑Fi/Jazz). If you switch styles and your current values still match the previous style profile, the new style profile is applied; otherwise your custom values remain.
