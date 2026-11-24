import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from './theme';

export function Notice({ tone = 'info', text }: { tone?: 'info' | 'error'; text: string }) {
  const t = useTheme();
  const error = tone === 'error';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: error ? t.errorBg : t.infoBg }]}>
      <Text style={[styles.text, { color: error ? t.errorText : t.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 14, borderRadius: 12 },
  text: { fontSize: 16, lineHeight: 22 },
});
