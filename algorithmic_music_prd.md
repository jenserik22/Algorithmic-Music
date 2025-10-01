### 2.7 History and Library
**Priority: P1 (Should Have)**

**Requirements:**
- **Anonymous Users** (No Account):
  - Keep history in browser local storage (last 20 generations)
  - Ability to replay previous generations
  - Download history tracks
  - Re-export in different formats
  - Clear history option
  - Warning when storage is full
- **Authenticated Users** (With Account):
  - Unlimited cloud-based history
  - Organize generations into folders/playlists
  - Tag and search functionality
  - Favorites/starred tracks
  - View generation date, parameters, and algorithm used
  - Bulk download and delete options

### 2.8 User Authentication & Accounts
**Priority: P0 (Must Have)**

**Requirements:**
- **Anonymous Access**:
  - Full feature access without account
  - Local storage for history and preferences
  - Prompt to create account after 5-10 generations (non-intrusive)
  - "Sign up to save your work" messaging
- **Account System**:
  - Email/password authentication
  - Social login (Google, GitHub) optional for Phase 2
  - Email verification
  - Password reset functionality
- **Account Benefits**:
  - Cloud-synced history (unlimited)
  - Access from any device
  - Saved custom presets
  - Generation settings backup
  - Future premium features
- **Data Migration**:
  - When creating account, offer to upload local history to cloud
  - Seamless transition from anonymous to authenticated state

**Technical Considerations:**
- Use Supabase for:
  - Authentication system
  - PostgreSQL database for user data
  - Storage for generation metadata (not audio files initially)
  - Row Level Security (RLS) policies
- Local storage fallback for anonymous users
- Clear data privacy messaging# Product Requirements Document: Algorithmic Music Generator

## 1. Overview

### 1.1 Product Vision
A web-based application that generates unique, algorithmic music compositions and exports them in multiple audio formats, enabling users to create custom background music, soundscapes, or experimental audio. The platform serves both casual users seeking quick music generation and advanced users wanting deep control over algorithmic composition techniques.

### 1.2 Business Model
- **Current Phase**: Completely free with all features available and no generation limits
- **Future Consideration**: Premium tier based on user feedback and testing results
- **Value Proposition**: Accessible algorithmic music creation for everyone from beginners to professionals

### 1.3 Target Users
- Content creators needing royalty-free background music
- Game developers seeking procedural audio
- Musicians exploring generative composition techniques
- Users wanting personalized ambient/focus music
- Experimental music enthusiasts
- Educators teaching algorithmic composition
- Sound designers needing quick iterations

### 1.4 Success Metrics
- User engagement: average session duration and compositions generated per user
- Account creation rate: percentage of anonymous users who create accounts
- Export rate: percentage of generated tracks that are downloaded
- User retention: return user rate within 7 and 30 days
- User satisfaction: rating of generated music quality and feature completeness
- Algorithm usage distribution: which algorithms are most popular

## 2. Core Features

### 2.1 Music Generation Engine
**Priority: P0 (Must Have)**

**Requirements:**
- Multiple algorithmic approaches user can select:
  - **Markov Chains**: Probability-based note and chord progression
  - **Cellular Automata**: Grid-based pattern evolution
  - **L-Systems**: Fractal/recursive musical structures
  - **Generative Grammar**: Rule-based composition
  - **Stochastic/Random**: Controlled randomness within musical constraints
  - **Euclidean Rhythms**: Mathematical rhythm generation
- Composition complexity levels:
  - **Simple Ambient Loops**: Minimal, repetitive soundscapes (pads, drones, simple melodies)
    - Generation time: 1-2 seconds
    - Best for: Background music, meditation, focus tracks
  - **Intermediate**: Melody + harmony or melody + rhythm
    - Generation time: 3-4 seconds
    - Best for: Podcasts, videos, casual listening
  - **Full Compositions**: Complete arrangements with melody, harmony, rhythm, and song structure
    - Generation time: 5-8 seconds
    - Best for: Professional projects, detailed listening, complex arrangements
  - **High Quality/Long Form**: Extended compositions with advanced processing (5-10 minutes)
    - Generation time: 10-15 seconds
    - Best for: Complete songs, background scores, immersive experiences
- Genre/Style selection (MVP should include 10-15, expandable):
  - **Classical**: Baroque, Romantic, Minimalist
  - **Rock**: Classic Rock, Progressive, Indie
  - **Electronic**: Techno, House, Ambient, Drum & Bass, Synthwave
  - **Jazz**: Bebop, Smooth Jazz, Fusion
  - **World**: African, Asian, Latin
  - **Hip Hop**: Lo-fi, Boom Bap, Trap
  - **Cinematic**: Epic, Suspense, Emotional
- Musical parameters:
  - Tempo (BPM range: 40-200)
  - Key/Scale (major, minor, pentatonic, chromatic, modal scales)
  - Time signature (4/4, 3/4, 5/4, 7/8, etc.)
  - Instrument selection per genre
  - Complexity/Density control (sparse to dense arrangements)
  - Duration (15 seconds to 10 minutes)
- Real-time audio generation in browser
- Deterministic generation with seed values for reproducibility

**Technical Considerations:**
- Use Web Audio API for synthesis
- Tone.js for audio generation and sequencing
- Implement efficient audio rendering to avoid performance issues
- Each algorithm should have genre-appropriate constraints

### 2.2 User Controls
**Priority: P0 (Must Have)**

**Requirements:**
- **Two-tier interface approach:**
  - **Simple Mode**: Quick generation with minimal options (genre picker, complexity level, generate button)
  - **Advanced Mode**: Full parameter control with all options exposed
  - Easy toggle between modes
- **Algorithm Selection**: Dropdown or visual selector for choosing generation approach
  - Each algorithm shows brief description (1-2 sentences)
  - "Learn More" link opens detailed documentation in modal or separate page
  - **Trending/Popular indicator** on most-used algorithms (updated weekly)
- **Complexity Selector**: 
  - Visual selector (cards or slider) with 4 levels: Simple → Intermediate → Full → High Quality
  - Each level shows:
    - Estimated generation time (adjusts for mobile: e.g., "3-4s desktop, 6-8s mobile")
    - Description of what's included
    - Recommended use cases
  - Default: Intermediate (good balance for first-time users)
  - Last selected complexity saved in preferences
- **Genre/Style Picker**: 
  - Grid or dropdown with 10-15+ genre options
  - **Trending/Popular badges** on most-generated genres (updated daily/weekly)
  - Sort options: Alphabetical, Most Popular, Recently Added
- **Preset Combinations** (Simple Mode):
  - 10-15 one-click preset buttons combining algorithm + genre + parameters
  - Examples: "Chill Ambient", "Lo-fi Hip Hop", "Epic Cinematic", "Upbeat Techno"
  - Each preset optimized for good results with that combination
  - "Surprise Me" button for random but curated selection
- **Musical Parameters Panel** (Advanced Mode):
  - Tempo slider with BPM display
  - Key and scale dropdowns
  - Time signature selector
  - Instrument toggles/selection
  - Density/complexity slider
  - Duration input
- "Generate" button to create new composition
  - Shows estimated time based on complexity
  - Disabled during active generation (only one generation at a time)
- "Regenerate" with same settings but different seed
- "Create Similar" for quick variations
- Playback controls (play, pause, stop, scrub timeline with progress indicator)
- Volume control and mute button
- **Generation Progress**:
  - Detailed progress bar with percentage
  - Current step indicator ("Generating melody...", "Adding harmony...", "Mixing...")
  - Estimated time remaining
  - Cancel button
  - Only one generation allowed at a time to prevent browser overload
- **Predefined Keyboard Shortcuts**:
  - Spacebar: Play/Pause
  - R: Regenerate
  - E: Export
  - Esc: Cancel generation
  - Arrow keys: Scrub timeline
  - M: Mute/Unmute
  - Shortcuts panel accessible in settings

### 2.3 Audio Export
**Priority: P0 (Must Have)**

**Requirements:**
- Multiple audio format exports:
  - **MP3**: Variable bitrate options (128kbps, 192kbps, 256kbps, 320kbps)
  - **WAV**: Uncompressed 16-bit and 24-bit options
  - **OGG**: Variable quality options (Q5, Q7, Q9)
  - **FLAC**: Lossless compression with quality levels
- Format selector with file size estimates
- **Automatic filename generation** (user-editable before download):
  - Format: `[Genre]_[Algorithm]_[Date]_[Time].ext`
  - Example: `Techno_MarkovChains_20251001_143022.mp3`
  - User can click filename to edit before downloading
  - Includes seed number for reproducibility (optional in filename)
- Download progress indicator with cancel option
- Batch export: download all formats at once (zipped)

**Settings/Configuration Export:**
- Export generation parameters as JSON file
- Include: algorithm type, all musical parameters, seed value, timestamp
- "Import Settings" feature to load previous configurations
- Share-able configuration via:
  - JSON file download/upload
  - URL with encoded parameters: `app.com/preset/[base64-config]`
  - Copy to clipboard as JSON or link
- Preset links automatically load parameters when opened

**Error Handling:**
- Automatic retry on generation failure (one retry attempt)
- If retry fails, show clear error message with:
  - What went wrong (if identifiable)
  - Suggestion to try different parameters
  - Option to report issue
- Graceful degradation if audio format encoding fails
- Network error handling for authenticated features

**Technical Considerations:**
- Web Audio API to capture audio buffer
- Client-side encoding libraries:
  - MP3: lamejs
  - WAV: native Web Audio encoding
  - OGG: oggenc-js or similar
  - FLAC: flac.js
- Handle memory constraints for longer compositions and multiple format exports
- Show clear warnings for large file exports

### 2.4 Presets and Customization
**Priority: P1 (Should Have)**

**Requirements:**
- **One-Click Preset Combinations** (10-15 at launch):
  - Pre-configured algorithm + genre + parameter combinations
  - Examples:
    - "Chill Ambient" (Markov Chains + Ambient + Simple complexity)
    - "Lo-fi Hip Hop" (Stochastic + Hip Hop + Intermediate)
    - "Epic Cinematic" (L-Systems + Cinematic + Full composition)
    - "Upbeat Techno" (Euclidean Rhythms + Techno + Full composition)
    - "Jazz Improvisation" (Markov Chains + Jazz + Intermediate)
    - "Classical Baroque" (Generative Grammar + Classical + Full composition)
  - Each preset tested and optimized for consistent quality
- **"Surprise Me" Feature**:
  - Weighted randomization favoring pleasant-sounding combinations
  - Avoids problematic algorithm + genre pairings
- **Custom Presets**:
  - Save current parameter configuration as custom preset
  - Name and organize custom presets
  - Anonymous users: saved locally (up to 20)
  - Authenticated users: unlimited cloud-saved presets
- **Preset Sharing & Import/Export**:
  - Export preset as JSON file for sharing
  - Import preset JSON file to load configuration
  - Generate shareable link with preset encoded in URL
  - Format: `app.com/preset/[base64-encoded-config]`
  - Link loads app with preset parameters pre-filled
  - Social sharing buttons for preset links (copy, Twitter, etc.)
  - Community preset library (Phase 2 feature)
- **Last Used Settings**:
  - Always remember and restore user's last-used parameters on return
  - Saved per device for anonymous users
  - Synced across devices for authenticated users
- **"Create Similar" Feature**:
  - Button to generate new track with same settings but different seed
  - Quick iteration without manual regeneration

### 2.5 Visualization
**Priority: P0 (Must Have)**

**Requirements:**
- Real-time audio visualization during playback with two components:
  - **Bar Visualizer**: Vertical bars representing frequency bands (20-30 bars recommended)
  - **Spectrum Analyzer**: Frequency spectrum display showing the full audio frequency range
- Visualization options:
  - Toggle between bar-only, spectrum-only, or combined view
  - **User-selectable color schemes** (5-7 options):
    - Classic (green on black, VU meter style)
    - Neon (bright colors on dark)
    - Pastel (soft colors)
    - Monochrome (grayscale)
    - Custom (user can choose primary color)
  - Color scheme persists across sessions
- **Theme Support**:
  - Light mode and dark mode toggle
  - Affects entire UI, not just visualizer
  - System preference detection with manual override
  - Theme preference saved per user
- Smooth animation synced to audio (60fps target)
- Responsive canvas rendering optimized for performance
- Visual style options: Modern/minimalist, Retro/VU meter, Futuristic

### 2.6 Algorithm Education & Documentation
**Priority: P1 (Should Have)**

**Requirements:**
- **In-App Brief Descriptions**:
  - 1-2 sentence explanation visible for each algorithm
  - Shown on hover or next to algorithm selector
  - Non-technical language for accessibility
- **Detailed Documentation**:
  - Comprehensive guide accessible via "Learn More" links
  - Separate documentation page or modal
  - User must actively choose to view (not shown by default)
  - Content includes:
    - How the algorithm works (with diagrams)
    - Musical theory behind it
    - Best use cases and genre recommendations
    - Example parameters and expected outputs
    - Historical context and real-world applications
- **Optional Process Visualization**:
  - "Show Algorithm Process" toggle in advanced settings (off by default)
  - Real-time visualization of algorithm execution during generation
  - Examples:
    - Markov chains: show state transitions
    - Cellular automata: show grid evolution
    - L-Systems: show recursive expansion
  - Separate panel or overlay that doesn't interfere with main interface
  - Performance optimized to not slow down generation
- **Educational Resources**:
  - Link to external learning resources
  - Glossary of musical and algorithmic terms
  - Tutorial videos (Phase 2)

## 3. User Experience

### 3.1 User Flow

**First-Time User Experience:**
1. User lands on homepage with clear value proposition
2. **Trending/Popular Section** visible:
   - "Most Popular" genres this week
   - "Trending" algorithms being used most
   - Quick stats: "1.2M tracks generated this month"
3. Prominent display of 3-4 curated preset buttons for instant gratification:
   - "Generate Chill Ambient"
   - "Generate Upbeat Electronic"  
   - "Generate Epic Cinematic"
   - "Surprise Me"
4. Optional: Brief dismissible tooltip explaining Simple vs Advanced mode
5. One-click generation shows what the app can do immediately

**Standard User Flow:**
1. **Simple Mode** (Default):
   - See trending algorithms/genres for inspiration
   - Select from preset combinations or use last-used settings (if returning user)
   - Adjust complexity level if desired
   - Click "Generate" (button shows estimated time)
2. **Advanced Mode**:
   - Select algorithm (with brief description visible + trending indicator)
   - Choose genre and complexity (with popular badges)
   - Fine-tune parameters (tempo, key, instruments, etc.)
   - "Generate" button updates estimated time based on selections
3. **Generation Process** (Single generation at a time):
   - Detailed progress bar with percentage complete
   - Current step displayed: "Generating melody... 45%"
   - Estimated time remaining updates in real-time
   - Cancel button available
   - Optional: Algorithm visualization if user enabled it
   - **Auto-retry**: If generation fails, automatically retries once
   - If retry fails: clear error message with suggestions
4. **Playback & Iteration**:
   - Audio plays automatically upon completion (with user permission)
   - Real-time visualization (bars/spectrum with user's chosen color scheme)
   - User can:
     - Adjust parameters and regenerate
     - Click "Create Similar" for variation with same settings
     - Switch complexity levels (iterate fast with Simple, export with High Quality)
5. **Export**:
   - Select format and quality
   - Edit filename if desired (auto-generated: Genre_Algorithm_Date_Time)
   - Export settings/seed for reproducibility
   - Download
   - Share preset link with others
   - For anonymous users: prompt to create account after 5-10 exports (non-intrusive)
6. **Post-Export**:
   - Save to library/history
   - Rate the generation (optional, for data collection)
   - Share preset configuration via link or file
   - Generate another or explore saved tracks

### 3.2 Interface Requirements
- Clean, minimal design focused on the generation controls
- **Desktop-first responsive layout** with mobile optimization
- Mobile adaptations:
  - Collapsible parameter panels
  - Touch-optimized controls
  - Simplified visualization on smaller screens
  - Portrait and landscape support
  - Warning when selecting High Quality: "Generation may take 20-30 seconds on mobile"
- **Light/Dark mode toggle**:
  - System preference detection on first load
  - Manual toggle always accessible
  - Persists across sessions
  - Affects entire UI including visualizer background
- Loading states for generation and export processes with detailed progress
- Clear error messages and fallback states
- Tooltips for advanced parameters
- Keyboard shortcuts for power users:
  - Spacebar: Play/Pause
  - R: Regenerate
  - E: Export
  - Esc: Cancel generation
  - Arrow keys: Scrub timeline
  - M: Mute/Unmute
  - Predefined (not customizable in MVP)
  - Shortcuts panel accessible in settings or via "?" key
- Settings panel for:
  - Theme selection (light/dark)
  - Visualizer color scheme
  - Default complexity preference
  - Algorithm visualization toggle
  - Analytics opt-out
  - Keyboard shortcuts reference

## 4. Technical Requirements

### 4.1 Browser Compatibility
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### 4.2 Performance
- **Generation Time by Complexity**:
  - Simple Ambient Loops: 1-2 seconds
  - Intermediate: 3-4 seconds  
  - Full Compositions: 5-8 seconds
  - High Quality/Long Form: 10-15 seconds
- **Progressive Generation** (P1 priority):
  - For longer tracks, start playback of first 30 seconds while rest generates
  - Background generation allowing parameter adjustments during generation
- Playback should be smooth without dropouts (60fps audio rendering)
- Export time targets:
  - MP3: Within 10-15 seconds for 2-minute track
  - WAV: Within 5-10 seconds for 2-minute track
  - OGG/FLAC: Within 15-20 seconds for 2-minute track
- Page load time under 3 seconds on broadband
- Visualization rendering at 60fps minimum
- Mobile performance: generation times may be 1.5-2x slower, clearly communicated to users

### 4.3 Technology Stack
- **Frontend**: React with TypeScript (for type safety and scalability)
- **Audio**: Web Audio API, Tone.js for synthesis and sequencing
  - **Hybrid Instrument Approach**:
    - Synthesized sounds for electronic genres (Techno, House, Synthwave, Ambient)
    - Sample-based instruments for acoustic genres (Classical, Rock, Jazz)
    - Optimized sample library (compressed, lazy-loaded)
    - Total asset size target: <50MB for core samples
    - Progressive loading: load samples on-demand per genre
- **Audio Encoding**: 
  - MP3: lamejs
  - WAV: native Web Audio
  - OGG: oggenc-js
  - FLAC: flac.js
- **Authentication & Backend**: Supabase
  - PostgreSQL database
  - Authentication service
  - Real-time subscriptions (future feature)
- **Storage**: 
  - Local: IndexedDB for anonymous user history and large data (larger storage than localStorage)
  - Local: LocalStorage for preferences (theme, visualizer color, last-used settings)
  - Cloud: Supabase storage for authenticated users (history metadata, custom presets)
  - Automatic restoration of last-used parameters on return visit
- **State Management**: React Context or Zustand
- **Styling**: Tailwind CSS for responsive design
- **Visualization**: Canvas API or WebGL for performance

## 5. Non-Functional Requirements

### 5.1 Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Visual indicators for audio playback state
- Color contrast meeting WCAG AA standards

### 5.2 Privacy & Data
- Client-side audio processing (no audio uploaded to servers)
- **Analytics Collection** (with opt-out):
  - Anonymous usage metrics:
    - Algorithm popularity and usage patterns
    - Average generation times per complexity level
    - Export format preferences
    - Genre selection distribution
    - Completion rates (generated vs exported)
    - Error rates and failure points
  - No tracking of actual audio content or user listening behavior
  - Clear opt-out in settings
  - Transparent disclosure of what data is collected
- Clear privacy policy regarding data collection
- User data ownership: users own all generated music
- GDPR compliance for EU users
- Account deletion with full data removal
- Supabase RLS policies ensuring users can only access their own data
- No third-party advertising or tracking pixels

### 5.3 Legal/Licensing
- All generated music is royalty-free for users
- Clear licensing terms (e.g., Creative Commons Zero or similar)
- No copyrighted samples or melodies in generation algorithm

## 6. Future Enhancements (Post-MVP)

### Phase 2 (3-6 months post-launch)
- **Premium Tier** (based on user feedback):
  - Potential features: longer tracks, priority generation, commercial licensing, API access
  - Pricing model TBD based on costs and user research
- Social login (Google, GitHub, Apple)
- Sharing compositions with unique URLs
- Public gallery of user creations (opt-in)
- Collaboration features (shared workspaces)
- More algorithms (genetic algorithms, neural networks, constraint-based)
- Extended genre library (30+ genres)

### Phase 3 (6-12 months post-launch)
- Stem export (individual instrument tracks)
- MIDI export option
- Import MIDI as seed/constraint for generation
- Real-time collaborative generation (multiple users)
- Plugin/API for integration with DAWs and other tools
- Mobile native apps (iOS/Android)
- Progressive Web App (PWA) with offline support
- AI-enhanced generation using machine learning models
- Custom instrument upload and synthesis
- Advanced mixing and mastering controls
- Video generation synced to music (visualizers export)

### Phase 4 (12+ months post-launch)
- VST/AU plugin for DAW integration
- Marketplace for user-created presets and algorithms
- Educational platform with courses on algorithmic composition
- Integration with streaming services
- Hardware controller support (MIDI keyboards, control surfaces)

## 7. Resolved Decisions & Open Questions

### Resolved Decisions:
- ✅ **Monetization**: Free for now with no generation limits, premium tier based on user feedback and testing
- ✅ **User accounts**: Supabase authentication with local storage fallback for anonymous users
- ✅ **Export formats**: MP3, WAV, OGG, FLAC with user-selectable bitrate/quality
- ✅ **File naming**: Auto-generated format `[Genre]_[Algorithm]_[Date]_[Time]` (user-editable before download)
- ✅ **Algorithm education**: Brief descriptions always visible, detailed docs via "Learn More" links
- ✅ **Platform priority**: Desktop-first with mobile support and performance warnings
- ✅ **Instruments**: Hybrid approach (synthesized for electronic, samples for acoustic genres)
- ✅ **First-time UX**: Curated preset buttons ("Generate Chill Ambient", "Surprise Me", etc.)
- ✅ **Preset combinations**: 10-15 one-click presets optimized for good results
- ✅ **Track variations**: "Create Similar" button for same settings, different seed
- ✅ **Quality handling**: Free regeneration + optional rating system for data collection
- ✅ **Rate limiting**: None for MVP (client-side processing, monitor for abuse)
- ✅ **Visualization**: User-selectable color schemes (5-7 options), no auto-matching to genre
- ✅ **Theme**: Light/dark mode toggle with system preference detection
- ✅ **Mobile warnings**: Show adjusted time estimates, warn before High Quality generation
- ✅ **Caching**: No pre-caching for MVP, but save last-used settings per user
- ✅ **Analytics**: Anonymous usage metrics (algorithm popularity, generation times, export formats) with clear opt-out
- ✅ **Documentation**: User must actively choose to view detailed docs (not shown by default)
- ✅ **Generation failures**: Automatic retry once on failure, then show error message
- ✅ **Simultaneous generations**: Only one at a time with detailed progress bar
- ✅ **Trending/Popular**: Show popular algorithms and genres (updated daily/weekly)
- ✅ **Keyboard shortcuts**: Predefined shortcuts (not customizable in MVP)
- ✅ **Preset sharing**: Export/import JSON files + shareable URL links with encoded configurations

### Future Decisions (Post-MVP):
- Cloud storage integration (Google Drive, Dropbox) - decide based on user requests
- PWA/Offline mode capability - decide based on mobile usage patterns
- Keyboard shortcut customization - Phase 2 feature
- Community preset library - Phase 2 feature
- Custom instrument upload - Phase 3 feature

## 8. Success Criteria for MVP

**Technical Requirements:**
- Users can generate music with all 6 algorithmic approaches
- 10-15 genre styles available at launch
- All three complexity levels (ambient loops, intermediate, full compositions) functional
- 95% of generated tracks playable without errors across supported browsers
- Automatic retry on generation failure works reliably
- Export works for all 4 formats (MP3, WAV, OGG, FLAC) in all supported browsers
- Bar visualizer and spectrum analyzer render smoothly at 60fps on desktop
- Account creation and authentication flow functional via Supabase
- Local storage history works for anonymous users
- Cloud sync works for authenticated users
- Only one generation at a time with proper progress tracking
- Preset sharing via URL works correctly (encoding/decoding parameters)
- Trending/popular data updates correctly

**Performance Requirements:**
- Average generation time matches complexity targets:
  - Simple: 1-2 seconds
  - Intermediate: 3-4 seconds
  - Full: 5-8 seconds
  - High Quality: 10-15 seconds
- MP3 export completes within 15 seconds for 2-minute track
- WAV/FLAC export completes within 10 seconds
- Page load time under 3 seconds on broadband connection
- Mobile experience functional on iOS Safari and Chrome Mobile
- Progress bar updates smoothly (100ms intervals minimum)
- Retry on failure completes within 2x normal generation time

**User Experience Requirements:**
- Clear onboarding for new users (curated presets, tooltips)
- Simple mode usable by non-technical users
- Advanced mode provides sufficient control for power users
- Seamless transition from anonymous to authenticated state
- Algorithm explanations are clear and educational
- Export settings are intuitive with file size estimates
- Trending/popular indicators provide useful guidance
- Preset sharing links work across browsers and devices
- Error messages are helpful and actionable
- Keyboard shortcuts work as documented

**Quality Requirements:**
- Positive user feedback on music quality (>3.5/5 rating)
- Algorithm variety: each algorithm produces distinctly different results
- Genre accuracy: generated music matches expected genre characteristics
- At least 70% of users successfully generate and export a track in first session
- Less than 5% error rate during generation and export
- Less than 2% of generations require retry
- Preset combinations consistently produce good results (>4.0/5 rating)

**Business Metrics:**
- 20% of anonymous users create accounts within first 3 sessions
- 30% of users generate more than one track per session
- 50% of generated tracks are exported
- 15% user return rate within 7 days
- 10% of users share a preset link
- Trending data accurately reflects actual usage patterns