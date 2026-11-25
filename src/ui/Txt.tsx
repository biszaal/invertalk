import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, useTheme } from './theme';

export type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'muted' | 'label' | 'eyebrow' | 'meta';

type Props = TextProps & { variant?: TxtVariant; color?: string };

/** The type scale. Sizes are points and still follow the system text size (Dynamic Type). */
export function Txt({ variant = 'body', color, style, ...rest }: Props) {
  const t = useTheme();
  const tone = variant === 'muted' || variant === 'eyebrow' || variant === 'meta' ? t.muted : t.text;
  return <Text {...rest} style={[styles[variant], { color: color ?? tone }, style]} />;
}

const styles = StyleSheet.create<Record<TxtVariant, TextStyle>>({
  display: { fontFamily: fonts.black, fontSize: 44, lineHeight: 44, letterSpacing: -2 },
  title: { fontFamily: fonts.black, fontSize: 30, lineHeight: 32, letterSpacing: -1.1 },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25 },
  muted: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase' },
  meta: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
});
