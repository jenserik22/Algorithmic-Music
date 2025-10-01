# Progress Checklist

## Legend
- [ ] Pending
- [R] Tests written and failing
- [G] Tests passing
- [✔] Code merged and reviewed

## Phase 0 – Foundations
- [G] Repository scaffolded with lint/format configs
- [G] Test harnesses configured (Vitest, RTL, axe-core)
- [G] CI pipeline running lint + tests on push
 - [✔] Supabase project provisioned
- [G] Database migrations created (enums, tables, RLS)
- [R] RLS and constraints verified via pgTAP/sql tests
- [G] Tone.js deterministic prototype validated by tests
- [G] Shared mocks/fixtures implemented
- [G] Design system tokens/themes established

## Phase 1 – Core MVP
- [G] Markov engine (tests → implementation)
- [G] Cellular Automata engine
- [G] L-Systems engine
- [G] Generative Grammar engine
- [G] Stochastic engine
- [G] Euclidean rhythms engine
- [G] Simple/Advanced UI flows with presets
- [G] Generation progress + retry/cancel handling
- [G] Playback controls + visualization toggles
- [G] IndexedDB/local storage history (20 limit)
- [G] Supabase history sync + migration flow
- [G] Folders/playlists, tagging, favorites, bulk ops
- [G] Multi-format export pipeline (MP3/WAV/OGG/FLAC)
- [G] Settings export/import (JSON/URL, batch zip)
- [G] Deterministic seeding QA suite
- [G] Performance benchmark suite within SLA
- [ ] Cross-browser/device compatibility run

## Phase 2 – Enhancements
- [G] Trending metrics views + UI badges
- [G] Algorithm education modal
- [G] Process visualization toggle
- [G] Preset management enhancements + sharing
- [G] Mobile/low-power device warnings
- [G] Asset loading optimization (idle preloading, lazy deps)
- [G] Progressive generation (validated)
- [G] Accessibility audit (axe-core + component checks)
- [G] Error messaging refinements

## Phase 3 – Backlog Prep
- [ ] Premium tier requirements captured
- [ ] Community gallery plan drafted
- [ ] Stems/MIDI export requirements drafted
- [ ] Collaboration feature requirements drafted
- [ ] ML algorithm exploration outline
- [ ] Native app exploration outline

---

## Helix Learnings (remember)
- Config-driven generation (templates + macros) increases quality/variety while staying deterministic by seed.
- Macros: complexity, motion (LFO depth), brightness; sectioning (intro/A/B/break/outro) with tension curves.
- LFO automation routing: master brightness, lead filter cutoff, chords pan; keep LFOs transport-bound and disposed on stop.
- Style templates (EDM/Cinematic/Lo‑Fi/Jazz) guide scales/registers/rhythms; arranger handles FX (crashes/risers) and fills.
- Progressive generation works by segmenting duration and emitting slices; safe for early playback scheduling.

## Resume Checklist (next session)
- [ ] Phase 3 backlog: draft epics (premium, gallery, stems/MIDI, collaboration, ML, native);
- [ ] Implement progressive playback scheduling in TonePlayer (append scheduling while generating);
- [ ] Add voice‑leading improvements and motif transformations to Helix engine (inversion/augmentation/fragmentation).
