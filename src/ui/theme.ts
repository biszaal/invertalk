import { useColorScheme } from 'react-native';

export type Palette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  border: string;
  record: string;
  onRecord: string;
  infoBg: string;
  errorBg: string;
  errorText: string;
};

/** Calm, plain palette. Text/background pairs meet WCAG AA (≥ 4.5:1). */
const light: Palette = {
  background: '#F7F7F4',
  surface: '#FFFFFF',
  text: '#1B1B1F',
  muted: '#55555F',
  accent: '#2F55C8',
  onAccent: '#FFFFFF',
  border: '#CFCFD6',
  record: '#B3261E',
  onRecord: '#FFFFFF',
  infoBg: '#E9EEFB',
  errorBg: '#FBE9E8',
  errorText: '#8C1D18',
};

const dark: Palette = {
  background: '#121214',
  surface: '#1D1D21',
  text: '#EDEDF0',
  muted: '#A9A9B3',
  accent: '#93AAFF',
  onAccent: '#0B1533',
  border: '#3A3A42',
  record: '#F2B8B5',
  onRecord: '#3B0907',
  infoBg: '#1E2540',
  errorBg: '#3A1B19',
  errorText: '#F9DEDC',
};

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
