 # Post‑Phase 9 Notes (Rationale)
 
 - Users reported concerns about voice leading realism and per‑note inconsistencies. We address this by explicit, deterministic voice assignment instead of implicit inversion selection alone.
 - We keep changes gated by an existing flag (`chordVoiceLeadingBias`) so default/baseline outputs remain unchanged unless the user opts in.
 - Registered drift and groove humanization already exist; our plan leverages them without expanding the public API.
 - Role‑aware durations add gentle musical phrasing to chord blocks while respecting spacing and collision guards.
 - Tests focus on correctness and determinism to align with the v2 acceptance criteria.
 
