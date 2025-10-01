# Algorithmic Music MVP Specification

## Scope
- Deliver web-based generator supporting six algorithmic engines: Markov Chains, Cellular Automata, L-Systems, Generative Grammar, Stochastic, and Euclidean Rhythms.
- Provide both Simple and Advanced modes with presets, parameter controls (tempo, key, time signature, density, duration, instruments), and toggles for algorithm selection.
- Implement playback with deterministic seeding, visualization (bar + spectrum), keyboard shortcuts, generation progress UI, cancellation, and retry-once handling.
- Support multi-format export (MP3, WAV, OGG, FLAC) including filename templating, progress, cancel, and settings export/import via JSON/URL.
- Manage history/presets/folders/tags/favorites: anonymous users capped at 20 locally (IndexedDB/localStorage), authenticated users enjoy unlimited Supabase-backed storage with migration on signup.
- Authentication via Supabase email/password with verification and password reset; social logins deferred.
- No analytics in MVP, though settings include reserved opt-out flag for future use.
- Ensure performance targets per PRD (generation and export timings) and accessibility (WCAG AA) across modern browsers and mobile.

## Non-Goals
- No premium tier, community galleries, social sharing of audio, stems/MIDI exports, or ML algorithms in MVP.
- No server-side audio rendering; all audio processing remains client-side.
- No analytics event collection, dashboards, or tracking pipelines.

## User Journeys
1. **Anonymous generation**: land → select preset → generate → play → export → history stored locally with prompt to create account after threshold.
2. **Authenticated power user**: login → adjust advanced parameters → generate high-quality track → organize into folder with tags → export multiple formats → mark favorite.
3. **Preset sharing**: configure advanced settings → save custom preset → share via JSON/URL → recipient loads configuration ready for generation.

## Functional Requirements
- Deterministic seeding ensures reproducibility with identical parameters.
- One generation at a time; UI disables conflicting controls during generation/export.
- IndexedDB adapter enforces 20-item rolling window, with ability to replay, download, re-export, clear, and warn when storage saturated.
- Supabase-backed entities provide unlimited history, folder organization, tagging, favorites, bulk actions, and metadata display (date, algorithm, parameters).
- Data migration path uploads local history/presets upon account creation, deduplicating by seed + timestamp.
- Visualization offers selectable color schemes (min 5) plus light/dark theme integration, 60fps target.
- Export workflow must include JSON parameter export/import, shareable URL encoding, and batch download zipped set.
- Error handling yields actionable messages, auto-retry once on generation failure, and prevents format encoding crashes.

## Technical Stack
- React + TypeScript front end with Tailwind CSS for styling; state management via React Context or Zustand.
- Web Audio API and Tone.js for synthesis/sequencing; client-side encoders (lamejs, native WAV, oggenc-js, flac.js).
- Storage: IndexedDB/localStorage for anonymous users, Supabase PostgreSQL + Storage for authenticated metadata (audio storage optional later).
- Testing: Vitest/Jest + React Testing Library, Playwright E2E, pgTAP/sql tests for migrations, axe-core for accessibility.

## Supabase Schema Summary
- Tables: `profiles`, `user_settings`, `generations`, `generation_parameters`, `generation_audio_assets`, `folders`, `folder_items`, `tags`, `generation_tags`, `favorites`, `presets`, `preset_tags`, `shares`.
- Enums: `algorithm`, `genre`, `complexity`, `time_signature`, `audio_format`.
- Policies restrict read/write access to authenticated owner; anonymous uploads stored locally until migration.

## Performance & Quality Targets
- Generation times: Simple 1–2s, Intermediate 3–4s, Full 5–8s, High Quality 10–15s on desktop; mobile warns if >2×.
- Export durations: MP3 ≤15s, WAV ≤10s, OGG/FLAC ≤20s for 2-minute track.
- Visualization at 60fps without audio stutter; page load <3s on broadband.
- Less than 5% generation/export error rate with auto-retry mitigating transient failures.
- Accessibility: keyboard navigation, screen reader labels, visual contrast meeting WCAG AA.

## TDD Expectations
- Every feature preceded by failing tests (unit/integration/E2E) capturing acceptance criteria.
- CI gates on lint, unit, integration, database, accessibility, and scheduled E2E suites.
- Spec updated when scope adjustments occur; plan and checklist reflect live status.
