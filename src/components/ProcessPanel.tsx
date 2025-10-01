import React from 'react';
import type { EngineOutput, GenerationParams } from '@/lib/music/engines/types';

export function ProcessPanel({ visible, output, algorithm, params }: { visible: boolean; output?: EngineOutput | null; algorithm?: string; params?: GenerationParams }) {
  if (!visible) return null;
  const ev = output?.events ?? [];
  const byTrack = ev.reduce<Record<string, number>>((m, e) => { const k = e.track ?? 'unknown'; m[k] = (m[k] ?? 0) + 1; return m; }, {});
  return (
    <div aria-label="process" style={{ marginTop: 12, padding: 12, border: '1px dashed #bbb', borderRadius: 8 }}>
      <div><strong>Algorithm:</strong> {algorithm ?? 'n/a'}</div>
      <div><strong>BPM:</strong> {params?.bpm} · <strong>Key:</strong> {params?.key}</div>
      <div><strong>Events:</strong> {ev.length}</div>
      <div>
        {Object.entries(byTrack).map(([k, v]) => (
          <span key={k} style={{ marginRight: 8 }}>{k}:{v}</span>
        ))}
      </div>
    </div>
  );
}
