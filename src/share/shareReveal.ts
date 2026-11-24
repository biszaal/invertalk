import * as Sharing from 'expo-sharing';

/** Neutral title only: the share never carries a caption, so the phrase can't leak into it. */
export const SHARE_DIALOG_TITLE = 'Share your Invertalk reveal';

export async function canShare(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Opens the system share sheet with just the audio file. `shareAsync`
 * resolves when the sheet closes and cannot tell sent from cancelled, so
 * 'closed' means "sheet closed without error".
 */
export async function shareReveal(uri: string): Promise<'closed' | 'failed'> {
  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'audio/wav',
      UTI: 'com.microsoft.waveform-audio',
      dialogTitle: SHARE_DIALOG_TITLE,
    });
    return 'closed';
  } catch {
    return 'failed';
  }
}
