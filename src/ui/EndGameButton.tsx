import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useChallenge } from '@/game/ChallengeProvider';

import { IconButton } from './Button';

/** Header ×: ends the game (deleting its recordings) and returns Home. */
export function EndGameButton() {
  const { endSession } = useChallenge();
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
  return <IconButton icon="x" accessibilityLabel="End game" onPress={onPress} />;
}
