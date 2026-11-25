import { useColorScheme } from 'react-native';

/**
 * Invertalk brand C ("Two i's"): paper, ink and one saffron accent.
 * Every text/background pair below meets WCAG AA (4.5:1) in both schemes.
 */
export type Palette = {
  scheme: 'light' | 'dark';
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  border: string;
  /** The dark "stage" card that holds players and the hero art, in both schemes. */
  stage: string;
  onStage: string;
  stageMuted: string;
  /** Unplayed waveform bars on the stage. */
  bar: string;
  selectedBg: string;
  infoBg: string;
  errorBg: string;
  errorText: string;
};

const light: Palette = {
  scheme: 'light',
  background: '#F4F0E8',
  surface: '#FFFDF8',
  text: '#1C1B19',
  muted: '#6E6A62',
  accent: '#F0A93A',
  onAccent: '#1C1B19',
  border: '#DDD5C7',
  stage: '#1C1B19',
  onStage: '#FFFDF8',
  stageMuted: '#B5AFA4',
  bar: '#3A3733',
  selectedBg: '#FBEBCF',
  infoBg: '#EFE6D3',
  errorBg: '#F8E3DC',
  errorText: '#8C2F1B',
};

const dark: Palette = {
  scheme: 'dark',
  background: '#151412',
  surface: '#201E1B',
  text: '#F4F0E8',
  muted: '#A8A196',
  accent: '#F0A93A',
  onAccent: '#1C1B19',
  border: '#34312C',
  stage: '#24221F',
  onStage: '#F4F0E8',
  stageMuted: '#A8A196',
  bar: '#45413B',
  selectedBg: '#33291A',
  infoBg: '#2A2620',
  errorBg: '#3A221B',
  errorText: '#F6C9BB',
};

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Font families loaded in the root layout (each family name is one weight). */
export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  black: 'Outfit_800ExtraBold',
  mono: 'GeistMono_500Medium',
} as const;
