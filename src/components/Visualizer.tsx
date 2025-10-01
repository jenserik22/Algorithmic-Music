import React from 'react';

type Mode = 'bars' | 'spectrum';

export function Visualizer() {
  const [mode, setMode] = React.useState<Mode>('bars');
  return (
    <div>
      <div role="group" aria-label="Visualizer Mode">
        <button aria-pressed={mode==='bars'} onClick={() => setMode('bars')}>Bars</button>
        <button aria-pressed={mode==='spectrum'} onClick={() => setMode('spectrum')}>Spectrum</button>
      </div>
      <div aria-label="visualizer-mode">{mode}</div>
      <canvas aria-label="visualizer-canvas" width={300} height={100} />
    </div>
  );
}
