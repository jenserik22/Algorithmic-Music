import React from 'react';
import { GM_PROGRAMS, defaultMapping, loadMapping, saveMapping, type MappingState, type ChannelConfig } from '@/lib/midi/mapping';

export function ChannelManager() {
  const [state, setState] = React.useState<MappingState>(() => loadMapping());
  const isDark = document.documentElement.classList.contains('dark');

  const update = (next: MappingState) => {
    setState(next);
    saveMapping(next);
  };

  const addChannel = () => {
    const id = `ch${Date.now().toString(36)}`;
    const next: MappingState = {
      ...state,
      channels: [
        ...state.channels,
        { id, name: 'Layer', source: 'lead', channel: 5, program: 81, volume: 0.8, pan: 0, transpose: 0 },
      ],
    };
    update(next);
  };

  const remove = (id: string) => {
    update({ ...state, channels: state.channels.filter((c) => c.id !== id) });
  };

  const change = (id: string, patch: Partial<ChannelConfig>) => {
    update({
      ...state,
      channels: state.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const reset = () => update(defaultMapping());

  return (
    <div className={`space-y-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm">Engine</label>
          <select
            value={state.engine}
            onChange={(e) => update({ ...state, engine: e.target.value as any })}
            className={`px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          >
            <option value="tone">Tone Synth</option>
            <option value="sf">MIDI (SoundFont)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={addChannel} className="px-2 py-1 text-xs rounded bg-blue-600 text-white">Add Channel</button>
          <button onClick={reset} className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>Reset</button>
        </div>
      </div>

      <div className="space-y-2">
        {state.channels.map((c) => (
          <div key={c.id} className={`grid grid-cols-12 gap-2 p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <input
              value={c.name}
              onChange={(e) => change(c.id, { name: e.target.value })}
              className={`col-span-2 px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <select
              value={c.source}
              onChange={(e) => change(c.id, { source: e.target.value as any })}
              className={`col-span-2 px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="lead">lead</option>
              <option value="chords">chords</option>
              <option value="bass">bass</option>
              <option value="fx">fx</option>
              <option value="drums">drums</option>
            </select>
            <input
              type="number"
              min={1}
              max={16}
              value={c.channel}
              onChange={(e) => change(c.id, { channel: Math.max(1, Math.min(16, Number(e.target.value))) })}
              className={`col-span-1 px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <label className="col-span-1 flex items-center gap-1 text-xs">
              <input type="checkbox" checked={!!c.isPercussion} onChange={(e) => change(c.id, { isPercussion: e.target.checked })} />
              Drums
            </label>
            <select
              value={c.program}
              onChange={(e) => change(c.id, { program: Number(e.target.value) })}
              disabled={c.isPercussion || c.channel === 10 || c.source === 'drums'}
              className={`col-span-3 px-2 py-1 rounded border text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              {GM_PROGRAMS.map((p) => (
                <option key={p.program} value={p.program}>{p.program}: {p.label}</option>
              ))}
            </select>
            <button onClick={() => remove(c.id)} className="col-span-1 px-2 py-1 text-xs rounded bg-red-600 text-white">Remove</button>
            <div className="col-span-12 grid grid-cols-12 gap-2">
              <label className="col-span-4 text-xs flex items-center gap-2">
                Vol
                <input type="range" min={0} max={1} step={0.01} value={c.volume ?? 1} onChange={(e) => change(c.id, { volume: Number(e.target.value) })} className="w-full" />
              </label>
              <label className="col-span-4 text-xs flex items-center gap-2">
                Pan
                <input type="range" min={-1} max={1} step={0.01} value={c.pan ?? 0} onChange={(e) => change(c.id, { pan: Number(e.target.value) })} className="w-full" />
              </label>
              <label className="col-span-4 text-xs flex items-center gap-2">
                Transpose
                <input type="range" min={-24} max={24} step={1} value={c.transpose ?? 0} onChange={(e) => change(c.id, { transpose: Number(e.target.value) })} className="w-full" />
              </label>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs opacity-75">Tip: Add multiple layers per source (e.g., Lead on ch1 Square + ch5 Saw) for richer textures. Drums default to channel 10.</p>
    </div>
  );
}

export default ChannelManager;
