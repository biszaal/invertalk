import { setAudioModeAsync } from 'expo-audio';

/** Session used for the whole challenge: record + play through the speaker, never in the background. */
export async function setRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'doNotMix',
    shouldPlayInBackground: false,
    allowsBackgroundRecording: false,
  });
}

/** Release the exclusive session so other apps' audio can resume. */
export async function resetAudioMode(): Promise<void> {
  await setAudioModeAsync({ allowsRecording: false, interruptionMode: 'mixWithOthers' });
}
