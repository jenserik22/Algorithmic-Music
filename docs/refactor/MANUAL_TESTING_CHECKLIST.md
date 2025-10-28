# Week 6 - Manual Testing Checklist

## Task 6.2: Manual Testing Verification

This checklist ensures the music generator works correctly in real-world usage scenarios.

---

## Testing Instructions

### Setup
1. Start the application: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Open browser console for any errors
4. Have audio enabled to listen to results

---

## Test Cases

### ✅ Test 1: 8-Second EDM Duration Accuracy
**Goal**: Verify exact 8-second output in both generation and export

**Steps**:
1. Select "EDM" style
2. Set duration: 8 seconds
3. Set BPM: 128
4. Set key: C
5. Click "Generate"
6. **Verify**: Generation completes without errors
7. Click "Play" and time the playback → should be exactly 8 seconds
8. Click "Export MIDI"
9. Import MIDI into DAW (e.g., Ableton, FL Studio)
10. **Verify**: MIDI file length is 8 seconds (±0.1s)

**Expected Result**: ✅ Duration matches exactly in both playback and export

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 2: 16-Second Jazz Duration Accuracy
**Goal**: Verify longer durations work correctly

**Steps**:
1. Select "Jazz" style
2. Set duration: 16 seconds
3. Set BPM: 120
4. Set key: Bb
5. Click "Generate"
6. **Verify**: Generation completes
7. Time the playback → should be exactly 16 seconds
8. Export MIDI and verify length in DAW

**Expected Result**: ✅ Duration matches exactly

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 3: Variation = 0 (Robotic)
**Goal**: Verify no humanization produces tight, quantized output

**Steps**:
1. Select "EDM" style
2. Set duration: 8 seconds
3. Set BPM: 120
4. Set variation: 0.0
5. Click "Generate"
6. Listen to the output
7. **Verify**: Timing is perfectly quantized (robotic)
8. **Verify**: Velocity is consistent (no variation)

**Expected Result**: ✅ Output sounds perfectly quantized and mechanical

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 4: Variation = 1 (Natural Feel)
**Goal**: Verify humanization creates musical feel (not chaos)

**Steps**:
1. Select "EDM" style
2. Set duration: 8 seconds
3. Set BPM: 120
4. Set variation: 1.0
5. Click "Generate"
6. Listen to the output
7. **Verify**: Timing has subtle variations (not robotic)
8. **Verify**: Velocity has natural dynamics
9. **Verify**: Output still sounds musical (not sloppy/chaotic)

**Expected Result**: ✅ Output has natural human feel but remains musical

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 5: MIDI Export Length Accuracy
**Goal**: Verify exported MIDI matches generated length exactly

**Steps**:
1. Generate 8-second EDM track (BPM 128, Key C)
2. Export to MIDI
3. Import MIDI into DAW
4. Check track length in DAW timeline
5. **Verify**: Length is 8.0 seconds (±0.1s)
6. **Verify**: No notes extend beyond 8 seconds
7. Repeat with 16-second track

**Expected Result**: ✅ MIDI export matches generation duration

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 6: Musical Groove and Feel
**Goal**: Verify output sounds musical and has appropriate groove

**Steps**:
1. Generate EDM track (straight groove)
2. Listen for:
   - Drums sound tight and consistent
   - Bass locks with kick drum
   - Hi-hats have natural feel
   - Overall groove feels musical
3. Generate Jazz track (swing groove)
4. Listen for:
   - Swing feel is present
   - Drums have jazz articulation
   - Bass walks naturally
   - Overall jazz character

**Expected Result**: ✅ All styles have appropriate musical feel

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 7: All 4 Styles
**Goal**: Verify all styles work correctly

#### 7a. EDM Style
**Steps**:
1. Select "EDM" style
2. Set duration: 8 seconds, BPM: 128, Key: C
3. Generate and listen
4. **Verify**: 
   - Four-on-the-floor kick pattern
   - Energetic hi-hats
   - Synth lead melody
   - Bass follows kick
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

#### 7b. Cinematic Style
**Steps**:
1. Select "Cinematic" style
2. Set duration: 16 seconds, BPM: 90, Key: Am
3. Generate and listen
4. **Verify**:
   - Atmospheric pads/FX
   - Dramatic chord progressions
   - Sparse, impactful drums
   - Epic/emotional feel
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

#### 7c. LoFi Style
**Steps**:
1. Select "LoFi" style
2. Set duration: 8 seconds, BPM: 85, Key: C
3. Generate and listen
4. **Verify**:
   - Relaxed, laid-back feel
   - Simple drum pattern
   - Jazz-influenced chords
   - Mellow melody
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

#### 7d. Jazz Style
**Steps**:
1. Select "Jazz" style
2. Set duration: 16 seconds, BPM: 140, Key: Bb
3. Generate and listen
4. **Verify**:
   - Swing feel present
   - Walking bass line
   - Jazz chord voicings
   - Complex harmonies
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Test 8: Simple Mode vs Advanced Mode
**Goal**: Verify both modes work correctly

#### 8a. Simple Mode
**Steps**:
1. Switch to "Simple" mode
2. Select EDM style
3. Set duration: 8 seconds
4. Generate
5. **Verify**:
   - Generates successfully
   - Output is simpler/cleaner
   - Fewer parameters exposed
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

#### 8b. Advanced Mode
**Steps**:
1. Switch to "Advanced" mode
2. Select EDM style
3. Set duration: 8 seconds
4. Adjust advanced parameters (harmonicComplexity, ornamentation, etc.)
5. Generate
6. **Verify**:
   - More complex output
   - Advanced parameters have effect
   - No errors

**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

## Additional Verification

### ✅ Console Errors
**Check**: Open browser console during all tests  
**Verify**: No JavaScript errors or warnings  
**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Performance
**Check**: Generation time for 8-second track  
**Verify**: Completes in < 3 seconds  
**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

### ✅ Memory Leaks
**Check**: Generate 10 tracks in succession  
**Verify**: No browser slowdown or memory issues  
**Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____________________

---

## Summary

**Total Tests**: 11  
**Passed**: ___ / 11  
**Failed**: ___ / 11  
**Pass Rate**: ___%

---

## Critical Issues Found

_(List any critical issues that prevent production deployment)_

1. 
2. 
3. 

---

## Minor Issues Found

_(List any minor issues that can be addressed post-deployment)_

1. 
2. 
3. 

---

## Tester Information

**Tester Name**: _____________________  
**Date**: _____________________  
**Browser**: _____________________  
**OS**: _____________________  
**Test Duration**: _____________________

---

## Conclusion

[ ] ✅ **APPROVED FOR PRODUCTION** - All tests pass, no critical issues  
[ ] ⚠️ **APPROVED WITH NOTES** - Minor issues present, but production-ready  
[ ] ❌ **NOT APPROVED** - Critical issues must be fixed before deployment

**Overall Assessment**: _____________________________________________________

_________________________________________________________________________

_________________________________________________________________________
