import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled, accessibilityLabel, accessibilityHint }: Props) {
  const t = useTheme();
  const primary = variant === 'primary';
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
        primary ? { backgroundColor: t.accent } : { borderColor: t.accent, borderWidth: 1.5 },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: primary ? t.onAccent : t.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.45 },
  label: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
