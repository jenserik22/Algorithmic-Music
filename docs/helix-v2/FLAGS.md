# Enhanced Helix – Phase 1 + 2 Flags

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

Style presets (UI suggestions):
- EDM: mpc62, 0.12, 0.20, 0.40, 0.35, 0.30, 0.30, 9, 0.015
- Cinematic: straight, 0.12, 0.15, 0.50, 0.10, 0.20, 0.70, 7, 0.020
- Lo‑Fi: shuffle, 0.25, 0.30, 0.35, 0.40, 0.25, 0.40, 7, 0.020
- Jazz: shuffle, 0.15, 0.20, 0.50, 0.20, 0.35, 0.80, 9, 0.015

Phase 2 preset add-ons:
- EDM: phrasing=short, cadenceStrength=0.7
- Cinematic: phrasing=long, cadenceStrength=0.9
- Lo‑Fi: phrasing=short, cadenceStrength=0.6
- Jazz: phrasing=medium, cadenceStrength=0.5
