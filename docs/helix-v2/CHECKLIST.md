# Helix V2 Humanization — Checklist

Legend: [ ] pending, [~] in progress, [x] done

Phase 0 — Infra
- [x] Heuristic utils (chordToneRate, voiceLeadingCost, collisionCount, syncopationIndex, backbeatConsistency)
- [x] Baseline snapshots (flags off) per style/seed
- [ ] CI wiring (typecheck/lint/tests/snapshots/perf)

Phase 1 — Quick Wins
- [x] Lead chord‑tone targeting (strong beats)
- [x] Groove templates + correlated microtiming per track
- [x] Drum accent maps
- [ ] Ghost notes
- [ ] Structured last‑bar fills
- [x] Chord voice‑leading constraints (inversions biased by minimal movement)
- [ ] Optional 7ths/inversions by energy
- [x] Bass anticipations (& of 4)
- [ ] Approach tones
- [ ] Kick alignment
- [x] Space allocator (simul‑onset limiter)

Acceptance (Phase 1)
- [ ] chord‑tone rate ≥ 70%
- [ ] avg voice move ≤ 3 semitones
- [ ] backbeat ≥ 95%
- [ ] collisions ≤ budget in 30 ms window
- [ ] perf within ±10% baseline

Phase 2 — Phrasing & Cadence
- [x] Phrase grammar (2–4 bars), cadence curve per section
- [x] Section climax pitch; breath before cadence
- [ ] Motif development A→A′→B→A

Phase 3 — Harmonic Expansion
- [x] Style progression generator + substitutions (sec dom, modal)
- [x] Harmonic rhythm variation; pedals in breaks

Phase 4 — Inter‑Track Conversation
- [x] Call/response slots; bass echoes lead fragments (low p)
- [x] Density gating (space allocator 2.0)

Phase 5 — Dynamics/Automation/FX
- [x] Section envelopes; extended LFO targets; sidechain metadata

Phase 6 — Rhythm Markov & Fills
- [x] Markov hats/percussion; rudiment micro‑motifs
- [x] Bar‑aware fill generator
- [x] Humanize distribution selector (uniform/gaussian) + presets update per style

Phase 7 — Ornamentation/Articulation
- [x] Lead ornaments (grace/slide/turns); chord stabs/arps; legato/ties
- [x] UI controls exposed in Generator UI (Advanced → Enhanced Helix → Ornamentation & Articulation)

Phase 8 — Evaluation & Auto‑Repair (flag)
- [ ] Phrase‑level evaluator; bounded local re‑gen

Phase 9 — Light Adaptive Weighting (opt)
- [ ] Persist liked‑output n‑grams; bias choices when enabled

Release Gates
- [ ] Flags default off, A/B proven
- [x] Docs updated
- [ ] Flip default on (post‑acceptance)
