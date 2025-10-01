export const colors = {
  primary: '#4f46e5',
  primaryMuted: '#a5b4fc',
  bg: '#0f172a',
  text: '#e2e8f0',
  surface: '#1e293b',
};

export const lightTheme = {
  bg: '#ffffff',
  text: '#0f172a',
  surface: '#f1f5f9',
};

export const darkTheme = {
  bg: colors.bg,
  text: colors.text,
  surface: colors.surface,
};

export type Theme = typeof lightTheme;
