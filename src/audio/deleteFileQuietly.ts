import { File } from 'expo-file-system';

/** Deletes a file if it exists. Never throws: cleanup must not break the game. */
export function deleteFileQuietly(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Missing or locked file: nothing more we can do; the launch sweep retries.
  }
}
