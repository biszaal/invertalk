import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './theme';

const SIZE = 96;

/** Big round record control: a dot to start, a square to stop, a soft pulse ring while live. */
export function RecordButton({ recording, onPress, disabled }: { recording: boolean; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recording) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  const ringStyle = {
    backgroundColor: t.accent,
    opacity: recording ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }) : 0,
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
  };

  return (
    <View style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.button, { backgroundColor: t.accent }, pressed && styles.pressed, disabled && styles.disabled]}>
        <View style={[recording ? styles.stop : styles.dot, { backgroundColor: t.onAccent }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15 },
  stop: { width: 28, height: 28, borderRadius: 7 },
  pressed: { transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.45 },
});
