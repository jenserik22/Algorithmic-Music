import React from 'react';

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function PerfWarnings() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const small = typeof window !== 'undefined' && window.innerWidth < 480;
    if (small || isMobile()) setVisible(true);
  }, []);
  if (!visible) return null;
  return (
    <div role="note" style={{ marginTop: 8, padding: 8, border: '1px solid #f0c36d', background: '#fff8e1', borderRadius: 6, fontSize: 13 }}>
      On mobile/low-power devices, audio effects may be limited. Use headphones for best results.
      <button type="button" onClick={() => setVisible(false)} style={{ marginLeft: 8 }}>Dismiss</button>
    </div>
  );
}
