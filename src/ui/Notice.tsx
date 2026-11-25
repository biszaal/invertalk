import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { Txt } from './Txt';
import { useTheme } from './theme';

export function Notice({ tone = 'info', text }: { tone?: 'info' | 'error'; text: string }) {
  const t = useTheme();
  const error = tone === 'error';
  const color = error ? t.errorText : t.text;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: error ? t.errorBg : t.infoBg }]}>
      <Feather name={error ? 'alert-circle' : 'info'} size={18} color={color} style={styles.icon} />
      <Txt variant="body" color={color} style={styles.text}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16 },
  icon: { marginTop: 3 },
  text: { flex: 1, fontSize: 16, lineHeight: 23 },
});
