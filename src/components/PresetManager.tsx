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
    <div className="mt-3 p-3 rounded-lg border bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
      <h3 className="text-sm font-semibold mb-2">Presets</h3>
      <div className="flex items-center gap-2 mb-2">
        <input 
          aria-label="Preset name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Preset name"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          type="button" 
          onClick={handleSave}
          className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >Save</button>
      </div>
      <ul className="space-y-1">
        {list.map(p => (
          <li key={p.name} className="flex items-center gap-2">
            <span className="flex-1 truncate">{p.name}</span>
            <button 
              type="button" 
              onClick={() => handleApply(p.settings)}
              className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >Apply</button>
            <button 
              type="button" 
              onClick={() => { deletePreset(p.name); refresh(); }}
              className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >Delete</button>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-gray-500 dark:text-gray-400">No presets yet</li>}
      </ul>
    </div>
  );
}
