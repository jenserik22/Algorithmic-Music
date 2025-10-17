# EnhancedHelixEngine Humanization — Refactor Plan/Spec

Status: Draft (awaiting approval)

Scope
- Make EnhancedHelixEngine sound more human than SoundHelix via phrasing, groove, harmony variety, inter‑track intent.
- Backward compatible: default behavior unchanged unless new optional params are provided.
- No engine‑code changes land without passing tests and acceptance checks.

Goals & Success Criteria
- Seed determinism preserved.
- Chord‑tone hit rate on strong beats (lead) ≥ 70%.
- Avg voice‑leading movement ≤ 3 semitones per voice between chord changes.
- Drum backbeat consistency ≥ 95% (styles that require it).
- Simultaneous onset collisions ≤ 2 within any 30 ms window (95th percentile).
- Generation time/memory within ±10% of baseline.

Non‑Breaking Strategy
- Add optional GenerationParams (all default to neutral):
  - grooveTemplate?: 'straight' | 'shuffle' | 'mpc62' | 'funk'
  - phrasing?: 'short' | 'medium' | 'long'
  - cadenceStrength?: 0–1
  - ornamentation?: 0–1
  - interplay?: 0–1
  - progressionVar?: 0–1
  - fillIntensity?: 0–1
  - humanizeTime?: 0–1 (correlated); humanizeVel?: 0–1
- meta.engineVersion = 'enhanced-helix-v2' when features used.

Branching, CI, Rollout
- Branch (to be created after approval): feat/helix-humanize-v2
- PRs per phase with green CI: typecheck, lint, unit, snapshots, perf.
- Flags default off; A/B compare v1 vs v2 by same seeds; flip default after acceptance.

Testing Strategy
- Determinism tests per generator (lead/chords/bass/drums/FX).
- Property tests: no NaNs, non‑negative durations, sorted by time, within durationSecs.
- Musical heuristics (automated): chordToneRate, voiceLeadingCost, collisionCount, syncopationIndex, backbeatConsistency.
- Snapshots: JSON events for fixed seeds/styles with flags off (baseline) and on (humanized).
- Perf snapshot: time/memory budget ±10%.

Roadmap (Phased)
Phase 0 — Infra (no audible change)
- Heuristic utilities + baselines + CI wiring.

Phase 1 — Quick Wins
1) Lead chord‑tone targeting on strong beats; diatonic passing/neighbor tones on weak beats.
2) Groove templates + correlated microtiming per track; section‑consistent.
3) Drum accent maps + ghost notes + structured fills (last‑bar patterns).
4) Chord voice‑leading constraints; add 7ths by section energy; tasteful inversions.
5) Bass anticipations (& of 4), approach tones, kick alignment priority.
6) Space allocator: cap simultaneous onsets; thin lowest‑priority events.

Phase 2 — Phrasing & Cadence
- 2–4 bar phrase grammar; cadence strength curve by section; motif climax per section.

Phase 3 — Harmonic Expansion
- Style progression generator with substitutions (sec dom, modal interchange); harmonic rhythm variation & pedals.

Phase 4 — Inter‑Track Conversation
- Call/response slots; bass echoes lead fragments (low p); density gating.

Phase 5 — Dynamics/Automation/FX
- Section envelopes for velocity/note length/register; extended LFO targets; sidechain metadata.

Phase 6 — Rhythm Markov & Advanced Fills
- Markov hats/percussion conditioned on groove; rudiment micro‑motifs; bar‑position‑aware fills.

Phase 7 — Ornamentation/Articulation
- Grace/slide/turns (low p); chord stabs/arps at transitions; legato/ties.

Phase 8 — Evaluation & Auto‑Repair (flagged)
- Evaluate phrases; locally re‑gen out‑of‑band phrases within perf budget.

Phase 9 — Light Adaptive Weighting (optional)
- Persist liked‑output n‑gram stats to bias intervals/rhythm (determinism intact when disabled).

Acceptance Criteria per Phase
- New tests pass; baselines unchanged with flags off.
- Metrics hit thresholds above.
- Perf within ±10% of baseline.

Risks & Mitigations
- Over‑humanization timing: clamp microtiming by groove template and section energy.
- Harmony drift: gate substitutions by progressionVar + voice‑leading checks.
- Performance regressions: add perf guards; bounded retries.

Files/Modules Affected
- src/lib/music/engines/enhanced-helix.ts (feature‑flagged updates only)
- src/lib/music/engines/types.ts (optional params, meta)
- tests/** (heuristics + snapshots + perf)

Next Steps (post‑approval)
- Create branch feat/helix-humanize-v2
- Land Phase 0 (infra/tests) PR
- Proceed with Phase 1 quick‑win PRs (one PR per item)
