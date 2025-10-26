 # Post‑Phase 9 Notes (Rationale)
 
 - Users reported concerns about voice leading realism and per‑note inconsistencies. We address this by explicit, deterministic voice assignment instead of implicit inversion selection alone.
 - Changes are feature‑gated: exact assignment applies only when `enableExactChordVoiceAssignment` is true AND `chordVoiceLeadingBias > 0`, preserving baseline outputs when off.
 - Registered drift and groove humanization already exist; our plan leverages them without expanding the public API.
 - Role‑aware durations add gentle musical phrasing to chord blocks while respecting spacing and collision guards.
 - Tests focus on correctness and determinism to align with the v2 acceptance criteria.
 - UI/presets: toggle exposed in Advanced mode with a tooltip; presets enable it for cinematic/jazz and leave it off for EDM/lo‑fi.
 
