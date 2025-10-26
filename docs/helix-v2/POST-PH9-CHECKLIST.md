# Post‑Phase 9 Checklist

- [x] Implement `voiceLeading.ts` with deterministic close‑voicing assignment
- [x] Integrate into chords path when `chordVoiceLeadingBias > 0` AND `enableExactChordVoiceAssignment` is true (keeps baseline when disabled)
- [x] Preserve vel/dur; prevent duplicates; sort voices bass→treble
- [x] Role‑aware chord note durations within chord span
- [x] Ensure clamping: pitch 0–127 and to track register; non‑negative durations
- [x] Maintain determinism (use seeded RNG where needed)
- [x] Add unit tests: assignment correctness, no crossing, minimal movement, determinism
- [x] Verify metrics thresholds and perf budget (±10%)
- [x] Update snapshots unaffected with flags off
