# 🎵 Algorithmic Music Generator

A web-based composition platform with ten generative engines, multi-backend playback (Tone.js, SoundFont, SF2 via WASM), rich visualization, preset management, and studio-grade exports.

**Built with:** React · TypeScript · Vite · Tone.js · Tailwind CSS

---

## Table of Contents
- [Highlights](#highlights)
- [Feature Breakdown](#feature-breakdown)
- [Workflow & Modes](#workflow--modes)
- [Playback, Visualization & Export](#playback-visualization--export)
- [Quick Start](#quick-start)
- [Testing & Quality](#testing--quality)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License & Acknowledgments](#license--acknowledgments)

---

## Highlights
- ⚡ **Ten Engines** — From stochastic sketches to Enhanced Helix, Enhanced Cellular, and Enhanced Markov self-arranging suites with style templates.
- 🎛️ **Channel Manager & Presets** — Canonical five-channel mix (lead, chords, bass, FX, drums) with per-channel controls, factory styles, and user-defined presets persisted locally.
- 🧠 **Guided Creation** — Education modal, process panel, perf warnings, and trending analytics (Supabase optional) keep users informed while generating.
- 🌈 **Dark-mode UI** — Responsive Tailwind interface with custom icon system, parameter tooltips, and seed-driven reproducibility.
- 🚀 **Production-ready Exports** — Offline WAV rendering, multi-track MIDI with proper mapping, and Tone/SoundFont/SF2 playback parity.

---

## Feature Breakdown

### Generative Engines
- **Core:** Stochastic, Markov Chains, Cellular Automata, L-Systems, Generative Grammar, Euclidean Rhythms, Helix.
- **Advanced:** Enhanced Helix (EDM, Cinematic, Lo-Fi, Jazz, Rock templates), Enhanced Cellular (track-specific rule sets), Enhanced Markov (theory-informed harmony & motifs).
- Deterministic seeds, density/variation controls, arranger fallback for basic engines, and optional Magenta refinement.

### Creative Workflow & UI
- **Simple Mode:** Style-first presets with tuned defaults and auto safety gates.
- **Advanced Mode:** 30+ parameters grouped by humanization, phrasing, dynamics, ornamentation, and conversation.
- **Process tooling:** EducationModal for quick onboarding, ProcessPanel event stats, PerfWarnings for browser/device guidance, Trending badge driven by Supabase metrics, and idle preloading for large samples.

### Data, Storage & Integration
- Local storage for presets and recent generations, collections & favorites utilities, and optional Supabase telemetry for trending engines.
- Works offline by default; Supabase credentials enable cloud analytics without affecting generation.

---

## Workflow & Modes
1. **Choose a style or preset** (Simple Mode) or fine-tune seed, BPM, key, and advanced parameters.
2. **Generate** to produce multi-track arrangements; enhanced engines emit ready-made leads, harmony, bass, FX, and drums.
3. **Inspect** results through the process panel, tooltips, and visual feedback.
4. **Tweak & save** — capture your configuration as a preset or adjust per-channel mix before exporting.

Seed inputs ensure reproducibility; randomize for variations or lock a favorite seed to iterate confidently.

---

## Playback, Visualization & Export
- **Playback backends:** Tone.js synth stack plus SoundFont player and spessasynth WASM SF2 engine with shared analysis bus.
- **Visualizer:** Spectrum Analyzer (bar, waveform, circular) with adjustable sensitivity and color themes.
- **Exports:**
  - Offline-rendered WAV (high fidelity).
  - Multi-track MIDI with channel mapping, instrument metadata, and DAW-friendly structure.
  - Channel-aware mix applied consistently across playback and export.

---

## Quick Start

### Requirements
- Node.js ≥ 18
- npm (ships with Node) or yarn/pnpm if preferred

### Setup
```bash
git clone https://github.com/<owner>/algorithmic_music.git
cd algorithmic_music
npm install
```

Create a `.env.local` (optional but required for Supabase-powered analytics):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

### Core Commands
```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview local production build
npm run typecheck  # TypeScript type validation
npm run test:unit  # Vitest coverage suite
npm run lint       # ESLint analysis
```

---

## Testing & Quality
- Unit coverage via `vitest` (see `src/__tests__`).
- Type safety enforced with `npm run typecheck`.
- Linting & formatting: `npm run lint` and `npm run format:check`.
- Manual verification steps live in `docs/refactor/MANUAL_TESTING_CHECKLIST.md`.

---

## Project Structure

```
algorithmic_music/
├── docs/
│   ├── MUSIC_GENERATION.md
│   ├── USER_GUIDE.md
│   └── refactor/
│       └── … project retrospectives & QA docs
├── public/
├── src/
│   ├── components/
│   │   ├── GeneratorUI.tsx
│   │   ├── AudioExporter.tsx · MidiExporter.tsx · SpectrumAnalyzer.tsx
│   │   ├── ChannelManager.tsx · PresetManager.tsx · PlaybackControls.tsx
│   │   └── support UI (EducationModal, PerfWarnings, Trending, Tooltips)
│   ├── lib/
│   │   ├── music/ (engines, arranger, Magenta bridge)
│   │   ├── audio/ (players, encoders)
│   │   ├── presets/ (store, defaults)
│   │   ├── storage/ (history, collections, favorites)
│   │   ├── supabase/ (client, metrics)
│   │   └── utils/
│   ├── types/ · styles/ · __tests__/
│   └── App.tsx · main.tsx · index.css
├── package.json · vite.config.ts · tailwind.config.cjs
└── README.md
```

---

## Documentation
- [USER_GUIDE.md](docs/USER_GUIDE.md) — End-to-end walkthrough of Simple & Advanced modes.
- [MUSIC_GENERATION.md](docs/MUSIC_GENERATION.md) — Deep dive into Enhanced Helix parameters and style recipes.
- `docs/refactor/` — Six-week refactor summaries, success criteria, and manual QA checklists.

---

## License & Acknowledgments
- MIT License (see `package.json`).
- Built with Tone.js, SoundHelix inspiration, Tailwind CSS, React, Vite, and the open-source WASM spessasynth library.

**Made with ❤️ and algorithms.** 🎵✨
