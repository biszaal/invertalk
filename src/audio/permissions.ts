import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

export type MicStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Returns the mic permission, prompting only when the OS still allows it.
 * Never re-prompts once the user has said no (no prompt spam).
 */
export async function ensureMicPermission(): Promise<{ status: MicStatus; prompted: boolean }> {
  const current = await getRecordingPermissionsAsync();
  if (current.granted) return { status: 'granted', prompted: false };
  if (!current.canAskAgain) return { status: 'denied', prompted: false };
  const asked = await requestRecordingPermissionsAsync();
  return { status: asked.status as MicStatus, prompted: true };
}
