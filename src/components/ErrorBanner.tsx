import React from 'react';

function mapMessage(err?: string) {
  if (!err) return '';
  const s = String(err).toLowerCase();
  if (s.includes('tone_unavailable')) return 'Audio engine unavailable. Please interact with the page (click) and try again.';
  if (s.includes('cancelled')) return 'Generation cancelled.';
  if (s.includes('network')) return 'Network issue detected. Check your connection and retry.';
  return 'Something went wrong during generation. Please try again.';
}

export function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div role="alert" aria-live="assertive" style={{ marginTop: 8, padding: 8, border: '1px solid #f5c2c7', background: '#f8d7da', color: '#842029', borderRadius: 6 }}>
      {mapMessage(error)}
    </div>
  );
}

export default ErrorBanner;
