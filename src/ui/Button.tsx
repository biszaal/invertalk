import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from './Txt';
import { fonts, useTheme } from './theme';

export type IconName = ComponentProps<typeof Feather>['name'];

type Props = {
  label: string;
  onPress: () => void;
  /** primary: saffron call to action · solid: ink (paper in dark mode) · secondary: outlined · quiet: text only. */
  variant?: 'primary' | 'solid' | 'secondary' | 'quiet';
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, accessibilityLabel, accessibilityHint }: Props) {
  const t = useTheme();
  const look = {
    primary: { bg: t.accent, fg: t.onAccent, border: 'transparent' },
    solid: { bg: t.text, fg: t.background, border: 'transparent' },
    secondary: { bg: 'transparent', fg: t.text, border: t.text },
    quiet: { bg: 'transparent', fg: t.text, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'quiet' && styles.quiet,
        { backgroundColor: look.bg, borderColor: look.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.inner}>
        <Txt style={[styles.label, { color: look.fg }]}>{label}</Txt>
        {icon ? <Feather name={icon} size={18} color={look.fg} /> : null}
      </View>
    </Pressable>
  );
}

/** Square icon-only button for headers and toolbars. */
export function IconButton({ icon, onPress, accessibilityLabel }: { icon: IconName; onPress: () => void; accessibilityLabel: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { borderColor: t.border, backgroundColor: t.surface }, pressed && styles.pressed]}>
      <Feather name={icon} size={18} color={t.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  quiet: { minHeight: 48 },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  disabled: { opacity: 0.4 },
  iconButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
