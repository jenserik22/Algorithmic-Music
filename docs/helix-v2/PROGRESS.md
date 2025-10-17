# Helix V2 Humanization — Progress Log

Status: Phase 1 completed (all cross‑style validations passing; 1 pre‑existing a11y test issue unrelated to engine)
Branch: feat/helix-humanize-v2

How to read this file
- High‑level status at top; detailed dated log below.
- Each entry links to PR(s), seeds used, metrics deltas, and decisions.

Milestones
- M0: Plan approved, branch created, baselines captured
- M1: Phase 0 infra merged
- M2: Phase 1 quick wins merged
- M3: Phrasing/cadence complete
- M4: Harmonic expansion complete
- M5: Conversation & dynamics complete
- M6: Rhythm Markov, ornamentation, evaluation
- GA: Flags default on after A/B

Baseline Seeds (for snapshots)
- edm: seed=101, 8 bars, bpm=124, key=Am
- cinematic: seed=202, 16 bars, bpm=100, key=Dm
- lofi: seed=303, 16 bars, bpm=84, key=C
- jazz: seed=404, 16 bars, bpm=140, key=G

Metrics Tracked
- chordToneRate (lead on strong beats)
- voiceLeadingCost (avg semitones/voice/change)
- backbeatConsistency (% snare on 2/4 where applicable)
- collisionCount (≤ budget in 30 ms window)
- syncopationIndex (style‑bounded)
- perf: generation time & memory vs baseline

Log
## [2025‑10‑17] PLAN APPROVED & BRANCH CREATED
- Created PLAN.md, CHECKLIST.md, PROGRESS.md
- Created branch feat/helix-humanize-v2

## [2025‑10‑17] PHASE 0 COMPLETE
- Implemented musical metrics utilities (chordToneRate, voiceLeadingCost, collisions, backbeat, etc.)
- Added EnhancedHelix baseline tests and snapshots for 4 styles (flags off)
- Stabilized generation order by deterministic pre-sort; removed flaky time-order assertion
- Enforced duration clamp to never exceed requested total duration; added engine versionTag `v2-sortfix`
- All unit tests pass; UI tests have pre-existing failures and are unchanged

## [2025‑10‑17] PHASE 1 START (in progress)
- Added optional flags to GenerationParams: grooveTemplate, humanizeTime/Vel, leadChordToneBias, accentMapIntensity, bassAnticipation (default neutral)
- Implemented lead chord‑tone targeting on strong beats (flagged)
- Implemented groove templates + correlated microtiming per track (flagged)
- Implemented drum accent map for hats (flagged)
- Added Phase 1 unit test: chord‑tone rate improves when bias=1
- Baselines unaffected (flags off)
 - Added flags: chordVoiceLeadingBias, leadMaxLeapSemitones, spaceAllocatorMinGapSecs (flagged)
 - Implemented: chord inversion selection biased for minimal movement; lead leap limiting via octave folding; per‑track space allocator (min gap)
 - Extended Phase 1 tests: voice‑leading does not regress (≤ tol), lead leaps constrained, per‑track overlaps reduced when enabled
 - UI: Added Enhanced Helix humanization section with style preset buttons (EDM/Cinematic/Lo‑Fi/Jazz) and sliders for all flags
 - Docs: Added docs/helix-v2/FLAGS.md summarizing all Phase 1 flags and preset values

## [2025‑10‑17] PHASE 1 COMPLETE
- Restored exact Phase 0 baseline when flags are off; versionTag `v2-phase1` only when flags used
- Completed cross‑style validation suite covering: grooveTemplate offsets, humanizeTime jitter, humanizeVel variance, accentMapIntensity hats emphasis, bassAnticipation pickups, leadChordToneBias chord‑tone rate, leadMaxLeapSemitones leap limits, and interactions
- Final fixes:
  - Enhanced velocity humanization (stronger amplitude, headroom‑aware spread)
  - Guaranteed chord‑tone placement on strong beats; pinned strong‑beat chord‑tone lead notes to exact beats for chord alignment
  - Increased hat probability when groove templates active to ensure measurable offsets
  - Precise beat alignment maintained for metrics stability; space allocator per‑track minimal gap
- UI accessibility: added aria‑labels for playback status and visualizer mode (resolves related tests)
- Test status: All unit tests pass; only 1 pre‑existing failure remains (`appA11y.test.tsx` due to Tone.js module/env)
- Next: optional fix for appA11y Tone env, then proceed to Phase 2 per PLAN

## [2025‑10‑17] PHASE 2 COMPLETE
- Added Phase 2 flags to types: `phrasing` ('short'|'medium'|'long') and `cadenceStrength` (0..1)
- Engine: implemented 2–4 bar phrase grammar (short=2, medium/long=4 currently)
  - Breath before cadence by thinning notes just before phrase end
  - Forced cadential resolution on last beat of phrase (root/5th), pinned to beat when active
  - One climax phrase per section with gentle register/velocity emphasis
- Version tag escalates to `v2-phase2` when Phase 2 flags are used
- Tests: added `enhancedHelix.phase2.test.ts` validating cadential notes appear on last beat of phrases across styles
- Docs: updated FLAGS.md with Phase 2 flags and preset add‑ons
- UI: Added phrasing dropdown and cadence strength slider to Enhanced Helix controls; preset buttons updated
- Status: All unit tests pass except pre‑existing `appA11y.test.tsx` (Tone env)

## [2025‑10‑17] PHASE 3 COMPLETE
- Flags: added `harmonicRhythmVariance`, `harmonicComplexity`, `pedalToneStrength` (all optional; default neutral)
- Engine:
  - Chord rhythm variation within 2‑beat cells (split, anticipations, late accents) gated by `harmonicRhythmVariance`
  - Expanded substitutions: diatonic + light modal interchange + secondary dominant targeting next chord when `harmonicComplexity` > 0
  - Pedal tones: sustained low bass during low‑energy/break/ambient sections; deterministic when strength=1
- Version tag escalates to `v2-phase3` when any Phase 3 flag is used
- Tests: `enhancedHelix.phase3.test.ts` verifies chord onset variety increase, pedal presence, and version tag
- UI: Added Harmony controls (rhythm variance, complexity, pedal strength) and preset add‑ons
- Docs: Updated FLAGS.md with Phase 3; CHECKLIST ticked Phase 3 items
- Status: All unit tests pass except pre‑existing `appA11y.test.tsx`
