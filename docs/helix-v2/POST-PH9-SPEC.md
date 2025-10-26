# Helix v2 — Post‑Phase 9 Spec: Addressing User Concerns

Status: Implemented (feature‑gated, deterministic) — exact close‑voicing integrated; UI checkbox and presets wired; tests passing

## Decisions
- Default voices: triads → 3 voices; 7th chords → 4 voices. If more voices needed, deterministically double root (then fifth) downward; if fewer, drop extensions first; always keep 3rd and 7th when present.
- Phrasing dynamics: phrase length by `phrasing` — short=2 bars, medium=4 bars, long=8 bars. Per‑phrase velocity ramp ±10 (scaled by section energy) and mild note length taper 0.95→1.05; clamped 40–120 velocity; reduced on drums; seeded‑deterministic. Off when `phrasing` is undefined.

## Scope
- Engine: voice leading assignment for chords; seeded RNG threading already in place; light role‑aware chord note durations.
- Utils: new `voiceLeading.ts` with deterministic close‑voicing builder/assignment.
- Tests: voice‑leading correctness (no crossing, minimal movement, chord‑tone only), determinism, and bounds.
- UI: Advanced toggle for exact close‑voicing with tooltip; presets enable for cinematic/jazz, off for EDM/lo‑fi.
- Docs: this spec + checklist.

## Voice Leading (Exact Assignment)
- Problem: Prior approach didn’t explicitly assign voices; could yield non‑ideal motion, duplicates, or off‑register notes.
- Plan: Given previous chord voices (sorted) and the next chord pitch classes, build a close voicing inside the chords register and assign each prior voice to a distinct target tone minimizing total movement without crossing.
- Behavior:
  - Sort previous voices bass→treble; compute base voicing near the previous average pitch (or mid‑register if none).
  - Enforce register bounds and non‑crossing; prefer keeping common tones.
  - Deterministic tie‑breakers; no intermediate pitches.
  - Gated by `enableExactChordVoiceAssignment` and requires `chordVoiceLeadingBias > 0` to apply; otherwise the engine uses conservative inversion bias only. Baseline unchanged when the flag is off.

## Humanization Granularity & Drift
- Maintain existing groove templates, swing, and rushing/dragging drift (mean‑zero, clamped by style and `rushingDraggingStrength`).
- Optionally bias variation strength toward off‑beats via existing groove maps (no API changes).

## Chord Note Durations (Role‑Aware)
- Slight sustain bias per role (root/third ≥ fifth/extensions) while staying within the chord span; clamp to next onset.

## Validation & Safety
- Clamp pitch 0–127 and to track register; durations non‑negative; enforce non‑decreasing event times after adjustments.

## Tests & Acceptance
- Engine determinism with fixed seeds preserved.
- Voice leading: no off‑chord notes, no voice crossing, lower/equal movement vs naive inversion, stable ordering.
- Metrics unaffected negatively: chordToneRate ≥ baseline; collisionCount ≤ baseline; backbeatConsistency ≥ 95%.
- Perf budget within ±10% of baseline.

## Rollout
- Off by default; turn on with `enableExactChordVoiceAssignment` (effective when `chordVoiceLeadingBias > 0`). Snapshot outputs unchanged when the flag is off.
