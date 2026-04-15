// Design system using Tailwind CSS v4
// Colors are defined in globals.css with @theme

export type ThemeKey = 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
};

const LIGHT_COLORS: ThemeColors = {
  primary: '#C8FF00',
  secondary: '#6E473B',
  background: '#E1D4C2',
  foreground: '#0F1A0E',
  accent: '#4CAF50',
};

const DARK_COLORS: ThemeColors = {
  primary: '#C8FF00',
  secondary: '#6E473B',
  background: '#0F1A0E',
  foreground: '#E1D4C2',
  accent: '#4CAF50',
};

export const THEMES: Record<ThemeKey, { colors: ThemeColors }> = {
  light: { colors: LIGHT_COLORS },
  dark: { colors: DARK_COLORS },
};

export const DEFAULT_THEME: ThemeKey = 'dark';
