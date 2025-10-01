export interface Settings {
  bpm: number;
  key: string;
  timeSignature: string;
  durationSecs: number;
  density: number;
  algorithm: string;
  seed: number;
}

export function serializeSettingsToJSON(s: Settings): string {
  return JSON.stringify(s);
}

export function parseSettingsFromJSON(json: string): Settings {
  return JSON.parse(json) as Settings;
}

export function encodeToURL(s: Settings): string {
  const json = serializeSettingsToJSON(s);
  return encodeURIComponent(btoa(json));
}

export function decodeFromURL(token: string): Settings {
  const json = atob(decodeURIComponent(token));
  return parseSettingsFromJSON(json);
}

export function zipFiles(files: { name: string; blob: Blob }[]): Blob {
  // Minimal placeholder zip: JSON manifest
  const manifest = files.map(f => ({ name: f.name, size: f.blob.size }));
  return new Blob([JSON.stringify({ files: manifest })], { type: 'application/zip' });
}
