import React from 'react';

export function EducationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Algorithm education" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ maxWidth: 640, margin: '10% auto', background: '#fff', padding: 16, borderRadius: 8 }}>
        <h2>How generation works</h2>
        <ul>
          <li>Engines (stochastic, Markov, grammar, etc.) create seed-deterministic note events.</li>
          <li>The arranger groups tracks (chords, bass, drums, lead) into sections with fills and FX.</li>
          <li>Tone.js player renders tracks with synths, effects, and optional LFO automation.</li>
        </ul>
        <button type="button" onClick={onClose} aria-label="Close">Close</button>
      </div>
    </div>
  );
}
