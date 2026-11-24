import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';

import { useTheme } from './theme';

/** Header ×: ends the game (deleting its recordings) and returns Home. */
export function EndGameButton() {
  const { endSession } = useChallenge();
  const t = useTheme();
  const onPress = () =>
    Alert.alert('End this game?', 'The recordings from this game will be deleted.', [
      { text: 'Keep playing', style: 'cancel' },
      {
        text: 'End game',
        style: 'destructive',
        onPress: () => {
          endSession();
          router.dismissAll();
        },
      },
    ]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="End game" hitSlop={12} onPress={onPress} style={styles.hit}>
      <Text style={[styles.x, { color: t.text }]}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { paddingHorizontal: 8 },
  x: { fontSize: 28, lineHeight: 30 },
});
