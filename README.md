# 🎵 Algorithmic Music Generator

A web-based algorithmic composition platform featuring 10 generative engines, multiple playback backends (Tone, SoundFont, SF2/WASM), real-time visualization, channel mapping with presets, and professional exports.

**Built with:** React + TypeScript + Vite + Tone.js + Tailwind CSS

---

## 🔄 Important updates (2025-10)
- New playback engines: SoundFont (SF) and SF2 (WASM spessasynth with AudioWorklet)
- Visualizer now works with SF/SF2 via a shared AnalysisBus (native AnalyserNode hookup)
- Channel Manager: canonical 5-channel layout (Lead, Chords, Bass, FX, Drums), per-channel mix (volume, pan, brightness, transpose)
- Presets: built-ins (Techno, Rock, Classic, plus EDM/Cinematic/Lo‑fi) and user-defined presets (save/load/delete via localStorage)
- Tone engine aligned to Channels mapping: only schedules present sources; applies per-source mix


## ✨ Features

### 🎼 **10 Algorithmic Engines**

**Basic Engines** (Single-track with auto-arrangement):
- 🎲 **Stochastic** - Random generation with musical constraints
- 🔗 **Markov Chains** - Probability-based note sequences  
- 🏗️ **Cellular Automata** - Grid-based pattern evolution
- 🌿 **L-Systems** - Fractal recursive structures
- 📝 **Generative Grammar** - Rule-based composition
- ⭕ **Euclidean Rhythms** - Mathematical rhythm patterns
- 🧬 **Helix** - SoundHelix-inspired generation

**Advanced Multi-Track Engines** (Professional self-arranging):
- ⚡ **Enhanced Helix** - Sophisticated harmony with style templates (EDM, Cinematic, Lo-Fi, Jazz)
- 🌟 **Enhanced Cellular** - Multi-track CA with different rules per instrument (Conway's Life, HighLife, Seeds, Maze, Coagulations)
- 🎼 **Enhanced Markov** - Probabilistic composition with music theory-based harmonic progressions

### 🎹 **Audio Synthesis & Playback**
- Real-time audio synthesis using **Tone.js**
- Professional audio processing chain (EQ, compression, reverb)
- Enhanced instrument library (synths, bass, pads, drums, FX)
- Advanced effects (chorus, delay, distortion, phaser)
- Play/Pause/Stop controls with visual feedback

### 📊 **Real-Time Visualization**
- Spectrum Analyzer with multiple modes:
  - 📊 Bar Graph
  - 🌊 Waveform
  - ⭕ Circular
- Dynamic color themes
- Adjustable sensitivity
- Real-time audio analysis

### 💾 **Export Capabilities**
- **WAV Audio Export** - High-quality offline rendering
- **MIDI Export** - Multi-track for DAW integration
  - General MIDI compatibility
  - Proper channel mapping
  - Instrument assignments
  - Metadata embedding

### 🎨 **Modern UI/UX**
- Professional dark mode with smooth transitions
- Responsive 2-column layout
- Tailwind CSS styling
- Custom SVG icon library (15+ icons)
- Simple & Advanced parameter modes
- Preset management system

### ⚙️ **Advanced Controls**
- BPM (40-200)
- Key selection (17 keys including major/minor)
- Time signatures (4/4, 3/4, 5/4, 7/8)
- Duration (2-120 seconds)
- Density, variation, fill rate sliders
- Complexity levels (Simple, Intermediate, Full, High Quality)
- Style templates (EDM, Cinematic, Lo-Fi, Jazz)
- Motion & brightness controls for Helix engines

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Run tests
npm run test:unit
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
algorithmic_music/
├── src/
│   ├── components/          # React components
│   │   ├── icons/          # SVG icon library
│   │   ├── AudioExporter.tsx
│   │   ├── MidiExporter.tsx
│   │   ├── SpectrumAnalyzer.tsx
│   │   ├── GeneratorUI.tsx
│   │   ├── PlaybackControls.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── music/
│   │   │   ├── engines/    # 10 algorithmic engines
│   │   │   │   ├── enhanced-helix.ts
│   │   │   │   ├── enhanced-cellular.ts
│   │   │   │   ├── enhanced-markov.ts
│   │   │   │   └── ...
│   │   │   ├── arranger.ts # Auto-arrangement logic
│   │   │   └── seededRandom.ts
│   │   ├── audio/
│   │   │   ├── tonePlayer.ts
│   │   │   ├── enhancedTonePlayer.ts
│   │   │   └── audioEncoder.ts
│   │   └── export/
│   │       ├── midiExporter.ts
│   │       └── settings.ts
│   ├── App.tsx             # Main application
│   └── index.css           # Tailwind styles
├── docs/                    # Documentation
│   ├── COMPLETED_FEATURES.md
│   ├── PENDING_TASKS.md
│   ├── ARCHITECTURE.md
│   └── ENHANCEMENT_IDEAS.md
├── package.json
├── vite.config.ts
├── tailwind.config.cjs
└── README.md
```

See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for detailed file descriptions.

---

## 🎮 Usage Guide

### Basic Workflow
1. **Select Algorithm** - Choose from 10 different engines
2. **Choose Preset** (Simple mode) or **Adjust Parameters** (Advanced mode)
3. **Generate Music** - Click "Generate Music" button
4. **Playback** - Use Play/Pause/Stop controls
5. **Visualize** - Watch the spectrum analyzer
6. **Export** - Download as WAV audio or MIDI file

### Algorithm Comparison

| Engine | Type | Tracks | Best For |
|--------|------|--------|----------|
| Stochastic | Basic | Single | Experimental, random textures |
| Markov Chains | Basic | Single | Probabilistic melodies |
| Cellular Automata | Basic | Single | Evolving patterns |
| L-Systems | Basic | Single | Fractal structures |
| Generative Grammar | Basic | Single | Rule-based compositions |
| Euclidean Rhythms | Basic | Single | Complex polyrhythms |
| Helix | Basic | Single | SoundHelix-style generation |
| **Enhanced Helix** | Advanced | Multi | Professional tracks with style templates |
| **Enhanced Cellular** | Advanced | Multi | Organic emergent patterns |
| **Enhanced Markov** | Advanced | Multi | Music theory-based progressions |

---

## 🎼 Technical Details

### Audio Stack
- **Tone.js** - Web Audio API synthesis and scheduling
- **Offline Rendering** - High-quality WAV export
- **Real-time Analysis** - FFT-based spectrum visualization

### MIDI Export
- **midi-writer-js v3.1.1** - Multi-track MIDI file generation
- **General MIDI** - Standard instrument mapping
- **Multi-channel** - Separate tracks for each instrument

### UI Framework
- **Tailwind CSS v3.4.0** - Utility-first styling
- **React 18** - Component architecture
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool

---

## 📚 Documentation

- **[COMPLETED_FEATURES.md](docs/COMPLETED_FEATURES.md)** - All implemented features
- **[PENDING_TASKS.md](docs/PENDING_TASKS.md)** - Current todo list and roadmap
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Key files and system design
- **[ENHANCEMENT_IDEAS.md](docs/ENHANCEMENT_IDEAS.md)** - Future improvement proposals

---

## 🔧 Development

### Tech Stack
- **React** 18.3.1
- **TypeScript** 5.6.2
- **Vite** 5.4.20
- **Tone.js** 15.1.5
- **Tailwind CSS** 3.4.0
- **midi-writer-js** 3.1.1
- **wav-encoder** 1.3.0

### Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript validation
npm run test:unit    # Run unit tests
```

### Build Output
- **Bundle Size**: ~740 KB (minified)
- **Gzip Size**: ~198 KB
- **Build Time**: ~4-5 seconds

---

## 🎯 Current Status

✅ **Completed:**
- 10 algorithmic engines (7 basic + 3 advanced)
- Professional UI with dark mode
- Real-time audio synthesis
- WAV & MIDI export
- Spectrum analyzer
- Preset management
- Documentation files

📋 **In Progress:**
- See [PENDING_TASKS.md](docs/PENDING_TASKS.md) for current roadmap

---

## 🚀 Future Enhancements

See [ENHANCEMENT_IDEAS.md](docs/ENHANCEMENT_IDEAS.md) for detailed proposals including:
- Additional algorithmic engines
- Advanced musical features
- UI/UX improvements
- Performance optimizations
- And more...

---

## 📄 License

This project is part of a personal portfolio. Feel free to explore and learn from the code.

---

## 🙏 Acknowledgments

- **Tone.js** - For excellent Web Audio API abstraction
- **SoundHelix** - Inspiration for algorithmic composition
- **Tailwind CSS** - For beautiful utility-first styling
- **React & Vite** - For modern web development tools

---

**Made with ❤️ and algorithms** 🎵✨
