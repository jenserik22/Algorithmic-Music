import React from 'react';
import type { AlgorithmName } from '@/lib/music/engines';
import type { GenerationParams } from '@/lib/music/engines/types';
import { listPresets, savePreset, deletePreset } from '@/lib/presets/store';
import { fromParams, toParams, type Settings } from '@/lib/export/settings';

export function PresetManager({
  current,
  onApply,
}: {
  current?: { algorithm: AlgorithmName; params: GenerationParams } | null;
  onApply: (s: Settings) => void;
}) {
  const [name, setName] = React.useState('My Preset');
  const [list, setList] = React.useState(() => listPresets());

  const refresh = () => setList(listPresets());
  const handleSave = () => {
    if (!current) return;
    const s = fromParams(current.algorithm, current.params);
    savePreset(name || 'Preset', s);
    refresh();
  };
  const handleApply = (s: Settings) => onApply(s);

  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <h3>Presets</h3>
      <div>
        <input aria-label="Preset name" value={name} onChange={e => setName(e.target.value)} placeholder="Preset name" />
        <button type="button" onClick={handleSave} style={{ marginLeft: 8 }}>Save</button>
      </div>
      <ul>
        {list.map(p => (
          <li key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>{p.name}</span>
            <button type="button" onClick={() => handleApply(p.settings)}>Apply</button>
            <button type="button" onClick={() => { deletePreset(p.name); refresh(); }}>Delete</button>
          </li>
        ))}
        {list.length === 0 && <li>No presets yet</li>}
      </ul>
    </div>
  );
}
