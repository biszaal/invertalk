import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from './theme';

export function RecordButton({ recording, onPress, disabled }: { recording: boolean; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: recording ? t.text : t.record },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: recording ? t.background : t.onRecord }]}>{recording ? 'Stop' : 'Record'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  dimmed: { opacity: 0.5 },
  label: { fontSize: 22, fontWeight: '700' },
});
