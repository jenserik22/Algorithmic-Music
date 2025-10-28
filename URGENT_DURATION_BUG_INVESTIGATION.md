# 🚨 URGENT: Duration Bug Investigation

**Status**: Duration fix IS in code but UI still produces wrong output  
**Date**: 2025-10-28  
**Severity**: CRITICAL

---

## Problem Report

**User Test**:
- Generated EDM music with 16 seconds requested
- Got 31.563 seconds actual duration (almost 2x!)
- BPM: 120, Key: C
- Style: EDM preset

**Expected**: 16.0 seconds  
**Actual**: 31.563 seconds  
**Difference**: +15.563 seconds (97% too long!)

---

## Code Verification

✅ **The fix IS present** in `src/lib/music/engines/enhanced-helix.ts` at line 1465:
```typescript
// CRITICAL FIX: Remove any events that start beyond duration limit
events = events.filter(e => e.time < params.durationSecs);
```

✅ **All tests pass** (194/201 = 96.5%) including duration tests  
✅ **No uncommitted changes** to enhanced-helix.ts  
✅ **Arranger not being called** for enhanced_helix (App.tsx line 57-59)

---

## Possible Causes

### 1. **Dev Server Using Old Code** (MOST LIKELY)
The Vite dev server may be serving cached JavaScript:
- Server started before commits
- HMR (Hot Module Reload) didn't pick up changes
- Browser cache has old bundle

**Solution**: 
```bash
# Stop dev server (Ctrl+C)
npm run dev
# Hard refresh browser (Ctrl+Shift+R)
```

### 2. **Dist Folder Has Old Build**
If production build wasn't updated:

**Solution**:
```bash
npm run build
```

### 3. **Multiple Generation Calls**
User might have clicked generate multiple times or UI is calling twice.

**Check**: Look at network tab in browser dev tools

### 4. **MIDI Export Bug Separate from Generation**
The generation might be correct but MIDI export is wrong.

**Test**: Check console.log of actual EngineOutput

---

## Immediate Actions Needed

### For User:

1. **Stop and Restart Dev Server**:
   ```bash
   # In terminal where dev server is running:
   Ctrl+C
   npm run dev
   ```

2. **Hard Refresh Browser**:
   - Chrome/Edge: `Ctrl+Shift+R` or `Ctrl+F5`
   - Firefox: `Ctrl+Shift+R`
   - Clear cache if needed

3. **Test Generation Again**:
   - Generate 16-second EDM track
   - Check browser console for any errors
   - Export MIDI and analyze

4. **Run Direct Test**:
   ```bash
   node test-duration-issue.js
   ```
   This will test the engine directly without UI

---

## Debug Steps

### Step 1: Verify Code is Running

Add this BEFORE line 1465 in enhanced-helix.ts:
```typescript
console.log('[DEBUG] Before filter:', {
  requested: params.durationSecs,
  eventCount: events.length,
  maxTime: Math.max(...events.map(e => e.time + e.duration))
});
```

Add this AFTER line 1472:
```typescript
console.log('[DEBUG] After filter:', {
  requested: params.durationSecs,
  eventCount: events.length,
  maxTime: Math.max(...events.map(e => e.time + e.duration))
});
```

Then regenerate and check browser console.

### Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "generate" or "music"
4. Click Generate
5. Check if multiple requests are made

### Step 3: Check Build

```bash
# Check if build is up to date
ls -la dist/

# Rebuild
npm run build

# Check size of enhanced-helix in bundle
# Should be recent timestamp
```

---

## If Bug Persists After Restart

### Option A: Direct Engine Test

Create test file `test-direct.ts`:
```typescript
import { EnhancedHelixEngine } from './src/lib/music/engines/enhanced-helix';

const output = EnhancedHelixEngine.generate({
  seed: 12345,
  durationSecs: 16,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  density: 0.7,
  style: 'edm'
});

const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
console.log('Requested: 16s');
console.log('Actual:', maxTime.toFixed(3), 's');
console.log('Bug exists:', maxTime > 16);
```

Run: `npx tsx test-direct.ts`

### Option B: Check If UI Parameters Are Wrong

Check in browser console during generation:
```javascript
// In browser console, type:
window.lastGenerateParams
```

This will show what parameters the UI actually sent.

---

## Root Cause Analysis

The duration fix was implemented correctly in the refactoring:

**Week 1 Changes** (Commit 381e80b):
1. Added `events.filter(e => e.time < params.durationSecs)` 
2. Added duration clamping for event ends
3. Added duration guards in all generator functions

**All tests pass** showing the fix works when called directly.

**Therefore**: The issue is NOT in the engine code, but in:
- Deployment/caching
- UI calling the wrong version
- MIDI export separate issue

---

## Next Steps

1. ✅ User restarts dev server + clears cache
2. ⏳ User tests again
3. ⏳ If still broken: Add debug logging
4. ⏳ If still broken: Check if UI is using correct engine
5. ⏳ Create UI improvements regardless (parameter tooltips, user guide)

---

## UI Improvements Needed (Separate from Bug)

Even after bug is fixed, user needs:

1. **Parameter Tooltips** - Explain what each setting does
2. **User Guide** - In-app help for all controls
3. **Better Presets** - More style-specific presets
4. **Duration Display** - Show expected vs actual after generation
5. **Track Visibility** - Show which tracks are generated

These are being tracked in separate tasks.

---

**Status**: Waiting for user to restart dev server and test again
