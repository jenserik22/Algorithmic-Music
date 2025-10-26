# Post‑Phase 9 Checklist

- [ ] Implement `voiceLeading.ts` with deterministic close‑voicing assignment
- [ ] Integrate into chords path when `chordVoiceLeadingBias > 0` AND `enableExactChordVoiceAssignment` is true (keeps baseline when disabled)
- [ ] Preserve vel/dur; prevent duplicates; sort voices bass→treble
- [ ] Role‑aware chord note durations within chord span
- [ ] Ensure clamping: pitch 0–127 and to track register; non‑negative durations
- [ ] Maintain determinism (use seeded RNG where needed)
- [ ] Add unit tests: assignment correctness, no crossing, minimal movement, determinism
- [ ] Verify metrics thresholds and perf budget (±10%)
- [ ] Update snapshots unaffected with flags off
