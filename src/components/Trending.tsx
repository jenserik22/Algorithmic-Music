import React from 'react';
import { supabase } from '@/lib/supabase/client';
import { getTrending } from '@/lib/supabase/metrics';

export function TrendingBadge() {
  const [label, setLabel] = React.useState<string>('');
  React.useEffect(() => {
    let mounted = true;
    getTrending(supabase as any, 7).then((res) => {
      if (!mounted) return;
      const top = res.topAlgorithms[0];
      if (top) setLabel(`${top.algorithm} · ${top.count}`);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  if (!label) return null;
  return (
    <span aria-label="trending" style={{ marginLeft: 8, padding: '2px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }}>
      Trending: {label}
    </span>
  );
}
